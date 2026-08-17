(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAccountPersistence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029C.1";
  const STABILIZATION_VERSION = "029G.1";
  const SCHEMA_VERSION = 1;
  const AUTH_DRAIN_EVENTS = Object.freeze(["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"]);

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
    return [{
      ...incoming,
      queuedAt: same ? current.queuedAt : now,
      lastAttemptAt: failedAttempt ? now : same ? current.lastAttemptAt : null,
      attempts,
      nextAttemptAt: failedAttempt ? new Date(Date.parse(now) + retryDelay(Math.max(1, attempts), options)).toISOString() : now,
      errorCode: error?.code || incoming.errorCode || null,
      supersedesMutationId: same ? current.supersedesMutationId : current?.mutationId || incoming.supersedesMutationId || null
    }];
  }

  function ready(queue = [], options = {}) {
    const item = (Array.isArray(queue) ? queue : [])[0] || null;
    if (!item) return null;
    return Date.parse(item.nextAttemptAt || item.queuedAt || 0) <= Date.parse(options.now || new Date().toISOString()) ? item : null;
  }

  function nextDelay(queue = [], options = {}) {
    const item = (Array.isArray(queue) ? queue : [])[0] || null;
    if (!item) return null;
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
    if (input.online === false) return { state: "OFFLINE_PROTECTED", confirmed: false, label: "SAVED HERE", detail: "Account sync resumes automatically." };
    if (pending) return { state: "SAVE_QUEUED", confirmed: false, label: "SYNC PENDING", detail: `${pending} protected save${pending === 1 ? "" : "s"} waiting.` };
    if (input.lastError) return { state: "RETRY_REQUIRED", confirmed: false, label: "RETRY NEEDED", detail: "The last account save was not confirmed." };
    if (input.serverConfirmed === true && input.lastVerifiedAt) return { state: "ACCOUNT_SAVED", confirmed: true, label: "ACCOUNT SAVED", detail: "Confirmed by your account." };
    return { state: "VERIFYING", confirmed: false, label: "VERIFYING", detail: "Waiting for an exact account receipt." };
  }

  function shouldDrainForAuthEvent(event, session) {
    return Boolean(session?.user?.id && AUTH_DRAIN_EVENTS.includes(String(event || "").toUpperCase()));
  }

  function canonicalPendingEntries(continuityQueue = [], accountQueue = []) {
    const granular = Array.isArray(continuityQueue) ? continuityQueue.filter(Boolean) : [];
    const aggregate = Array.isArray(accountQueue) ? accountQueue.filter(Boolean) : [];
    if (granular.length) return granular.map((item) => ({ ...item, queueSource: "CONTINUITY" }));
    return aggregate.map((item) => ({ ...item, queueSource: "ACCOUNT_TRUTH" }));
  }

  function pendingState(continuityQueue = [], accountQueue = []) {
    const entries = canonicalPendingEntries(continuityQueue, accountQueue);
    return {
      count: entries.length,
      entries,
      state: entries.length ? "SYNC_PENDING" : "CURRENT",
      label: entries.length ? `Sync · ${entries.length}` : "Synced"
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
    shouldDrainForAuthEvent,
    canonicalPendingEntries,
    pendingState,
    telemetry
  });
});
