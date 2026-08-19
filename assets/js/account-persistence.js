(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAccountPersistence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030E.1";
  const STABILIZATION_VERSION = "029N.1";
  const SCHEMA_VERSION = 1;
  const AUTH_DRAIN_EVENTS = Object.freeze(["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"]);
  const PERSISTENCE_STATES = Object.freeze({
    TRANSIENT_FAILURE: "TRANSIENT_FAILURE",
    AUTH_REQUIRED: "AUTH_REQUIRED",
    CONFLICT_REQUIRES_CHOICE: "CONFLICT_REQUIRES_CHOICE",
    VALIDATION_FAILURE: "VALIDATION_FAILURE",
    SYNCED: "SYNCED"
  });
  const SYNC_STATES = Object.freeze({
    SYNCED: "synced",
    TRANSIENT_RETRY: "transient_retry",
    OFFLINE_QUEUED: "offline_queued",
    USER_ACTION_REQUIRED: "user_action_required",
    CONFLICT: "conflict",
    FAILED: "failed"
  });

  function canonicalSyncState(input = {}) {
    const persistence = input.persistenceState || input.state || null;
    if (persistence === PERSISTENCE_STATES.CONFLICT_REQUIRES_CHOICE || input.conflict === true) return SYNC_STATES.CONFLICT;
    if ([PERSISTENCE_STATES.AUTH_REQUIRED, PERSISTENCE_STATES.VALIDATION_FAILURE].includes(persistence) || input.userActionRequired === true) return SYNC_STATES.USER_ACTION_REQUIRED;
    if (input.online === false && Number(input.pendingWrites || 0) > 0) return SYNC_STATES.OFFLINE_QUEUED;
    if (persistence === PERSISTENCE_STATES.TRANSIENT_FAILURE || Number(input.pendingWrites || 0) > 0) return SYNC_STATES.TRANSIENT_RETRY;
    if (input.failed === true) return SYNC_STATES.FAILED;
    return SYNC_STATES.SYNCED;
  }

  function classifyFailure(error = null, context = {}) {
    if (context.conflict === true || /conflict|same approved revision/i.test(String(error?.message || ""))) return PERSISTENCE_STATES.CONFLICT_REQUIRES_CHOICE;
    if (context.authenticated === false || ["401", "403", "PGRST301"].includes(String(error?.code || error?.status || ""))) return PERSISTENCE_STATES.AUTH_REQUIRED;
    if (context.validation === true || ["400", "422", "23502", "23514"].includes(String(error?.code || error?.status || ""))) return PERSISTENCE_STATES.VALIDATION_FAILURE;
    if (!error && context.serverConfirmed === true && Number(context.pendingWrites || 0) === 0) return PERSISTENCE_STATES.SYNCED;
    return PERSISTENCE_STATES.TRANSIENT_FAILURE;
  }

  function shouldRetry(state) {
    return state === PERSISTENCE_STATES.TRANSIENT_FAILURE;
  }

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function fingerprint(value) {
    const source = stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function recordFingerprint(value = {}) {
    return value?.fingerprint || fingerprint(value || {});
  }

  function mutationIdentity(input = {}) {
    const manifestFingerprint = recordFingerprint(input.manifest);
    const truthFingerprint = recordFingerprint(input.snapshot);
    const mutationFingerprint = fingerprint({
      userId: input.userId || null,
      manifestFingerprint,
      truthFingerprint
    });
    return {
      mutationId: input.mutationId || `account:${input.userId || "local"}:${mutationFingerprint}`,
      mutationFingerprint,
      manifestFingerprint,
      truthFingerprint
    };
  }

  function buildEnvelope(input = {}, options = {}) {
    const manifest = input.manifest || options.manifest || null;
    const snapshot = input.snapshot || options.snapshot || null;
    if (!manifest || !snapshot) return null;
    const source = { ...options, ...input, manifest, snapshot };
    const identity = mutationIdentity(source);
    const now = input.clientUpdatedAt || options.now || new Date().toISOString();
    return {
      schemaVersion: SCHEMA_VERSION,
      userId: input.userId || options.userId || null,
      deviceId: input.deviceId || options.deviceId || null,
      expectedRevision: Math.max(0, Number(input.expectedRevision ?? options.expectedRevision ?? 0)),
      manifest,
      snapshot,
      ...identity,
      clientUpdatedAt: now,
      queuedAt: input.queuedAt || now,
      lastAttemptAt: input.lastAttemptAt || null,
      attempts: Math.max(0, Number(input.attempts || 0)),
      nextAttemptAt: input.nextAttemptAt || now,
      errorCode: input.errorCode || null,
      persistenceState: input.persistenceState || null,
      supersedesMutationId: input.supersedesMutationId || null
    };
  }

  function retryDelay(attempts = 1, options = {}) {
    const base = Math.min(30 * 60 * 1000, 1000 * (2 ** Math.max(0, Number(attempts || 1) - 1)));
    const jitterRatio = options.jitterRatio ?? 0.2;
    const random = options.random ?? Math.random();
    return Math.max(0, Math.round(base + (base * jitterRatio * ((random * 2) - 1))));
  }

  function queueLatest(queue = [], candidate = null, error = null, options = {}) {
    const incoming = buildEnvelope(candidate || {}, options);
    if (!incoming) return Array.isArray(queue) ? queue.slice(-1) : [];
    const current = (Array.isArray(queue) ? queue : []).map((item) => buildEnvelope(item, options)).filter(Boolean).at(-1) || null;
    if (current && Date.parse(current.clientUpdatedAt || 0) > Date.parse(incoming.clientUpdatedAt || 0)) return [current];
    const same = current?.mutationId === incoming.mutationId;
    const failedAttempt = options.failedAttempt === true || Boolean(error);
    const attempts = same ? Number(current.attempts || 0) + Number(failedAttempt) : Number(failedAttempt);
    const now = options.now || new Date().toISOString();
    const persistenceState = failedAttempt
      ? classifyFailure(error, options)
      : incoming.persistenceState || PERSISTENCE_STATES.TRANSIENT_FAILURE;
    return [{
      ...incoming,
      queuedAt: same ? current.queuedAt : now,
      lastAttemptAt: failedAttempt ? now : same ? current.lastAttemptAt : null,
      attempts,
      nextAttemptAt: failedAttempt ? new Date(Date.parse(now) + retryDelay(Math.max(1, attempts), options)).toISOString() : now,
      errorCode: error?.code || incoming.errorCode || null,
      persistenceState,
      supersedesMutationId: same ? current.supersedesMutationId : current?.mutationId || incoming.supersedesMutationId || null
    }];
  }

  function ready(queue = [], options = {}) {
    const item = (Array.isArray(queue) ? queue : [])[0] || null;
    if (!item) return null;
    if (item.persistenceState && !shouldRetry(item.persistenceState)) return null;
    return Date.parse(item.nextAttemptAt || item.queuedAt || 0) <= Date.parse(options.now || new Date().toISOString()) ? item : null;
  }

  function nextDelay(queue = [], options = {}) {
    const item = (Array.isArray(queue) ? queue : [])[0] || null;
    if (!item) return null;
    if (item.persistenceState && !shouldRetry(item.persistenceState)) return null;
    return Math.max(0, Date.parse(item.nextAttemptAt || item.queuedAt || 0) - Date.parse(options.now || new Date().toISOString()));
  }

  function receiptMatches(receipt = null, envelope = null, options = {}) {
    const expected = buildEnvelope(envelope || {});
    if (!receipt || !expected) return false;
    const manifestMatches = recordFingerprint(receipt.manifest) === expected.manifestFingerprint;
    const truthMatches = recordFingerprint(receipt.truth_snapshot || receipt.snapshot) === expected.truthFingerprint;
    const mutationMatches = receipt.last_mutation_id === expected.mutationId
      && receipt.last_mutation_fingerprint === expected.mutationFingerprint;
    const minimumRevision = options.acceptExactState === true
      ? Math.max(1, expected.expectedRevision)
      : Math.max(1, expected.expectedRevision + 1);
    const revisionAdvanced = Number(receipt.revision || 0) >= minimumRevision;
    return manifestMatches && truthMatches && (mutationMatches || options.acceptExactState === true) && revisionAdvanced;
  }

  function status(input = {}) {
    const pending = Number(input.pendingWrites || 0);
    const canonicalState = canonicalSyncState({ ...input, pendingWrites: pending });
    if (input.persistenceState === PERSISTENCE_STATES.CONFLICT_REQUIRES_CHOICE) return { state: PERSISTENCE_STATES.CONFLICT_REQUIRES_CHOICE, canonicalState, confirmed: false, label: "CHOICE NEEDED", detail: "Automatic retries are paused until you choose the saved Contract." };
    if (input.persistenceState === PERSISTENCE_STATES.AUTH_REQUIRED) return { state: PERSISTENCE_STATES.AUTH_REQUIRED, canonicalState, confirmed: false, label: "SIGN IN", detail: "Sign in to resume protected account saves." };
    if (input.persistenceState === PERSISTENCE_STATES.VALIDATION_FAILURE) return { state: PERSISTENCE_STATES.VALIDATION_FAILURE, canonicalState, confirmed: false, label: "REVIEW NEEDED", detail: "This save needs correction before it can continue." };
    if (input.online === false) return { state: "OFFLINE_PROTECTED", canonicalState, confirmed: false, label: "SAVED HERE", detail: "Account sync resumes automatically." };
    if (pending) return { state: "SAVE_QUEUED", canonicalState, confirmed: false, label: "SYNC PENDING", detail: `${pending} protected save${pending === 1 ? "" : "s"} waiting.` };
    if (input.lastError) return { state: "RETRY_REQUIRED", canonicalState: SYNC_STATES.FAILED, confirmed: false, label: "RETRY NEEDED", detail: "The last account save was not confirmed." };
    if (input.serverConfirmed === true && input.lastVerifiedAt) return { state: "ACCOUNT_SAVED", canonicalState, confirmed: true, label: "ACCOUNT SAVED", detail: "Confirmed by your account." };
    return { state: "VERIFYING", canonicalState, confirmed: false, label: "VERIFYING", detail: "Waiting for an exact account receipt." };
  }

  function shouldDrainForAuthEvent(event, session) {
    return Boolean(session?.user?.id && AUTH_DRAIN_EVENTS.includes(String(event || "").toUpperCase()));
  }

  function canonicalPendingEntries(continuityQueue = [], accountQueue = []) {
    const granular = Array.isArray(continuityQueue) ? continuityQueue.filter(Boolean) : [];
    const aggregate = Array.isArray(accountQueue) ? accountQueue.filter(Boolean) : [];
    const merged = new Map();
    [
      ...granular.map((item) => ({ ...item, queueSource: "CONTINUITY" })),
      ...aggregate.map((item) => ({ ...item, queueSource: "ACCOUNT_TRUTH" }))
    ].forEach((item, index) => {
      const identity = String(item.mutationId || item.id || item.mutationFingerprint || item.fingerprint
        || [item.domain, item.stateType, item.stateKey, item.clientUpdatedAt || item.updatedAt || index].join(":"));
      const prior = merged.get(identity);
      if (!prior || Date.parse(item.queuedAt || item.createdAt || 0) < Date.parse(prior.queuedAt || prior.createdAt || 0)) merged.set(identity, item);
    });
    return [...merged.values()].sort((left, right) => Date.parse(left.queuedAt || left.createdAt || 0) - Date.parse(right.queuedAt || right.createdAt || 0));
  }

  function pendingState(continuityQueue = [], accountQueue = []) {
    const entries = canonicalPendingEntries(continuityQueue, accountQueue);
    const first = entries[0] || null;
    const state = canonicalSyncState({
      persistenceState: first?.persistenceState,
      pendingWrites: entries.length,
      online: first?.online !== false
    });
    const labels = {
      [SYNC_STATES.SYNCED]: "Synced",
      [SYNC_STATES.TRANSIENT_RETRY]: `Sync · ${entries.length}`,
      [SYNC_STATES.OFFLINE_QUEUED]: `Offline · ${entries.length} saved`,
      [SYNC_STATES.USER_ACTION_REQUIRED]: "Action needed",
      [SYNC_STATES.CONFLICT]: "Choice needed",
      [SYNC_STATES.FAILED]: "Sync failed"
    };
    return {
      count: entries.length,
      entries,
      state,
      label: labels[state],
      detail: entries.length
        ? `${entries.length} protected change${entries.length === 1 ? "" : "s"} waiting${first ? ` · ${String(first.operation || first.domain || first.stateType || "account save").replaceAll("_", " ")}` : ""}.`
        : "Account is current."
    };
  }

  function telemetry(input = {}) {
    return {
      operation: String(input.operation || "account_save").slice(0, 48),
      type: String(input.type || "ACCOUNT_TRUTH").slice(0, 48),
      revision: Math.max(0, Number(input.revision || 0)),
      status: String(input.status || "UNKNOWN").slice(0, 48),
      attempt: Math.max(0, Number(input.attempt || 0))
    };
  }

  return Object.freeze({
    VERSION,
    STABILIZATION_VERSION,
    SCHEMA_VERSION,
    AUTH_DRAIN_EVENTS: [...AUTH_DRAIN_EVENTS],
    PERSISTENCE_STATES: { ...PERSISTENCE_STATES },
    SYNC_STATES: { ...SYNC_STATES },
    stableSerialize,
    fingerprint,
    recordFingerprint,
    mutationIdentity,
    buildEnvelope,
    retryDelay,
    queueLatest,
    ready,
    nextDelay,
    receiptMatches,
    status,
    classifyFailure,
    shouldRetry,
    shouldDrainForAuthEvent,
    canonicalSyncState,
    canonicalPendingEntries,
    pendingState,
    telemetry
  });
});
