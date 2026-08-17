(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAccountTruth = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029N.1";
  const SCHEMA_VERSION = 1;
  const TRUTH_DOMAINS = Object.freeze(["profile", "readiness", "evidence", "coaching"]);
  const COLLECTION_LIMITS = Object.freeze({
    readiness: 90,
    performance: 500,
    closeouts: 120,
    missionReceipts: 180,
    horizons: 120,
    outcomes: 120,
    decisions: 120,
    constraints: 120,
    reconciliationReceipts: 120
  });
  const VOLATILE_KEYS = new Set([
    "capturedAt", "captured_at", "savedAt", "saved_at", "syncedAt", "synced_at",
    "renderedAt", "rendered_at", "lastViewedAt", "last_viewed_at"
  ]);

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
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

  function canonicalize(value) {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(canonicalize);
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !VOLATILE_KEYS.has(key))
      .map(([key, item]) => [key, canonicalize(item)]));
  }

  function semanticFingerprint(value) {
    return fingerprint(canonicalize(value));
  }

  function parsedTime(value) {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function itemTime(value = {}) {
    const keys = [
      "updatedAt", "updated_at", "completedAt", "completed_at", "recordedAt", "recorded_at",
      "createdAt", "created_at", "resolvedAt", "resolved_at", "reviewedAt", "reviewed_at",
      "approvedAt", "approved_at", "signedAt", "signed_at", "date", "performanceDate"
    ];
    return Math.max(0, ...keys.map((key) => parsedTime(value?.[key])));
  }

  function latestTime(value, fallback = null) {
    let latest = parsedTime(fallback);
    const visit = (item, depth = 0) => {
      if (!item || depth > 5) return;
      if (Array.isArray(item)) {
        item.forEach((entry) => visit(entry, depth + 1));
        return;
      }
      if (typeof item !== "object") return;
      latest = Math.max(latest, itemTime(item));
      Object.values(item).forEach((entry) => visit(entry, depth + 1));
    };
    visit(value);
    return latest ? new Date(latest).toISOString() : null;
  }

  function itemIdentity(item = {}, index = 0) {
    return String(
      item.id || item.receiptId || item.proposalId || item.decisionId || item.constraintId
      || item.date || item.performanceDate || item.weekStart || item.sourceDate || `item-${index}`
    );
  }

  function chooseNewer(deviceItem, accountItem) {
    if (!deviceItem) return clone(accountItem);
    if (!accountItem) return clone(deviceItem);
    if (semanticFingerprint(deviceItem) === semanticFingerprint(accountItem)) return clone(deviceItem);
    const deviceTime = itemTime(deviceItem);
    const accountTime = itemTime(accountItem);
    if (deviceTime > accountTime) return clone(deviceItem);
    if (accountTime > deviceTime) return clone(accountItem);
    return semanticFingerprint(deviceItem).localeCompare(semanticFingerprint(accountItem)) >= 0
      ? clone(deviceItem)
      : clone(accountItem);
  }

  function mergeCollection(deviceItems = [], accountItems = [], limit = 120) {
    const merged = new Map();
    [...(Array.isArray(accountItems) ? accountItems : []), ...(Array.isArray(deviceItems) ? deviceItems : [])]
      .filter(Boolean)
      .forEach((item, index) => {
        const key = itemIdentity(item, index);
        merged.set(key, chooseNewer(item, merged.get(key)));
      });
    return [...merged.values()]
      .sort((left, right) => itemTime(right) - itemTime(left) || itemIdentity(left).localeCompare(itemIdentity(right)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  function orientationComplete(value = {}) {
    return Boolean(value.completedAt || value.completed_at || value.status === "COMPLETE" || value.status === "COMPLETED");
  }

  function mergeOrientation(device, account) {
    if (!device) return clone(account);
    if (!account) return clone(device);
    if (orientationComplete(device) !== orientationComplete(account)) return clone(orientationComplete(device) ? device : account);
    return chooseNewer(device, account);
  }

  function normalizeConstraints(value = {}) {
    const active = Array.isArray(value?.active) ? value.active : [];
    const retired = Array.isArray(value?.retired) ? value.retired : [];
    return { active, retired };
  }

  function mergeConstraints(device, account) {
    const left = normalizeConstraints(device);
    const right = normalizeConstraints(account);
    const all = mergeCollection([...left.active, ...left.retired], [...right.active, ...right.retired], COLLECTION_LIMITS.constraints);
    const active = all.filter((item) => !item.retiredAt && String(item.status || "ACTIVE").toUpperCase() !== "RETIRED");
    const retired = all.filter((item) => item.retiredAt || String(item.status || "").toUpperCase() === "RETIRED");
    return { active, retired, count: active.length, status: active.length ? "ACTIVE" : "CLEAR" };
  }

  function normalizeDomainPayload(domain, value = {}) {
    if (domain === "profile") return {
      orientation: value.orientation ? clone(value.orientation) : null,
      constraints: normalizeConstraints(value.constraints)
    };
    if (domain === "readiness") {
      const history = mergeCollection(value.history || [], [], COLLECTION_LIMITS.readiness);
      return { current: value.current ? clone(value.current) : history[0] || null, history };
    }
    if (domain === "evidence") return {
      performance: mergeCollection(value.performance || [], [], COLLECTION_LIMITS.performance),
      closeouts: mergeCollection(value.closeouts || [], [], COLLECTION_LIMITS.closeouts),
      missionReceipts: mergeCollection(value.missionReceipts || [], [], COLLECTION_LIMITS.missionReceipts),
      reconciliationReceipts: mergeCollection(value.reconciliationReceipts || [], [], COLLECTION_LIMITS.reconciliationReceipts)
    };
    if (domain === "coaching") return {
      horizons: mergeCollection(value.horizons || [], [], COLLECTION_LIMITS.horizons),
      outcomes: mergeCollection(value.outcomes || [], [], COLLECTION_LIMITS.outcomes),
      decisions: mergeCollection(value.decisions || [], [], COLLECTION_LIMITS.decisions)
    };
    return clone(value || {});
  }

  function domainDescriptor(domain, value = {}, options = {}) {
    const payload = normalizeDomainPayload(domain, value);
    const updatedAt = options.updatedAt || latestTime(payload, options.fallbackUpdatedAt) || new Date(0).toISOString();
    return { domain, updatedAt, fingerprint: semanticFingerprint(payload), payload };
  }

  function buildSnapshot(input = {}, options = {}) {
    const domains = {};
    TRUTH_DOMAINS.forEach((domain) => {
      domains[domain] = domainDescriptor(domain, input[domain] || {}, { fallbackUpdatedAt: options.capturedAt });
    });
    const body = {
      schemaVersion: SCHEMA_VERSION,
      userId: options.userId || null,
      deviceId: options.deviceId || null,
      capturedAt: options.capturedAt || new Date().toISOString(),
      programFingerprint: options.programFingerprint || null,
      domains
    };
    return {
      ...body,
      fingerprint: fingerprint({
        schemaVersion: body.schemaVersion,
        userId: body.userId,
        programFingerprint: body.programFingerprint,
        domains: Object.fromEntries(TRUTH_DOMAINS.map((domain) => [domain, body.domains[domain].fingerprint]))
      })
    };
  }

  function normalizeSnapshot(value = {}, options = {}) {
    const rawDomains = value?.domains || value || {};
    return buildSnapshot(Object.fromEntries(TRUTH_DOMAINS.map((domain) => [domain, rawDomains?.[domain]?.payload || rawDomains?.[domain] || {}])), {
      userId: value?.userId || options.userId || null,
      deviceId: value?.deviceId || options.deviceId || null,
      capturedAt: value?.capturedAt || options.capturedAt || new Date(0).toISOString(),
      programFingerprint: value?.programFingerprint || options.programFingerprint || null
    });
  }

  function mergeDomainPayload(domain, device = {}, account = {}) {
    if (domain === "profile") return {
      orientation: mergeOrientation(device.orientation, account.orientation),
      constraints: mergeConstraints(device.constraints, account.constraints)
    };
    if (domain === "readiness") {
      const history = mergeCollection(device.history, account.history, COLLECTION_LIMITS.readiness);
      return { current: chooseNewer(device.current, account.current) || history[0] || null, history };
    }
    if (domain === "evidence") return {
      performance: mergeCollection(device.performance, account.performance, COLLECTION_LIMITS.performance),
      closeouts: mergeCollection(device.closeouts, account.closeouts, COLLECTION_LIMITS.closeouts),
      missionReceipts: mergeCollection(device.missionReceipts, account.missionReceipts, COLLECTION_LIMITS.missionReceipts),
      reconciliationReceipts: mergeCollection(device.reconciliationReceipts, account.reconciliationReceipts, COLLECTION_LIMITS.reconciliationReceipts)
    };
    if (domain === "coaching") return {
      horizons: mergeCollection(device.horizons, account.horizons, COLLECTION_LIMITS.horizons),
      outcomes: mergeCollection(device.outcomes, account.outcomes, COLLECTION_LIMITS.outcomes),
      decisions: mergeCollection(device.decisions, account.decisions, COLLECTION_LIMITS.decisions)
    };
    return chooseNewer(device, account);
  }

  function reconcileSnapshots(deviceValue = {}, accountValue = {}, options = {}) {
    const device = normalizeSnapshot(deviceValue, options);
    const account = normalizeSnapshot(accountValue, options);
    if (!accountValue || !Object.keys(accountValue).length) return { state: "DEVICE_NEWER", snapshot: device, deviceWins: 1, accountWins: 0 };
    if (!deviceValue || !Object.keys(deviceValue).length) return { state: "ACCOUNT_NEWER", snapshot: account, deviceWins: 0, accountWins: 1 };
    if (device.fingerprint === account.fingerprint) return { state: "MATCHED", snapshot: device, deviceWins: 0, accountWins: 0 };
    let deviceWins = 0;
    let accountWins = 0;
    const mergedInput = {};
    TRUTH_DOMAINS.forEach((domain) => {
      const deviceDomain = device.domains[domain];
      const accountDomain = account.domains[domain];
      if (deviceDomain.fingerprint !== accountDomain.fingerprint) {
        const deviceTime = parsedTime(deviceDomain.updatedAt);
        const accountTime = parsedTime(accountDomain.updatedAt);
        if (deviceTime >= accountTime) deviceWins += 1;
        if (accountTime >= deviceTime) accountWins += 1;
      }
      mergedInput[domain] = mergeDomainPayload(domain, deviceDomain.payload, accountDomain.payload);
    });
    const snapshot = buildSnapshot(mergedInput, {
      userId: device.userId || account.userId,
      deviceId: device.deviceId || account.deviceId,
      capturedAt: new Date(Math.max(parsedTime(device.capturedAt), parsedTime(account.capturedAt), Date.now())).toISOString(),
      programFingerprint: options.programFingerprint || device.programFingerprint || account.programFingerprint
    });
    const state = deviceWins && accountWins ? "MERGED" : deviceWins ? "DEVICE_NEWER" : accountWins ? "ACCOUNT_NEWER" : "MERGED";
    return { state, snapshot, deviceWins, accountWins };
  }

  function retryDelay(attempts = 1, options = {}) {
    const base = Math.min(1800000, 1000 * (2 ** Math.max(0, Number(attempts || 1) - 1)));
    const jitterRatio = options.jitterRatio ?? 0.2;
    const random = options.random ?? Math.random();
    return Math.max(0, Math.round(base + (base * jitterRatio * ((random * 2) - 1))));
  }

  function queueLatest(queue = [], snapshot, error = null, options = {}) {
    if (!snapshot) return [];
    const now = options.now || new Date().toISOString();
    const existing = (Array.isArray(queue) ? queue : []).find((item) => item?.fingerprint === snapshot.fingerprint);
    const failedAttempt = options.failedAttempt === true || Boolean(error);
    if (existing && !failedAttempt) return [existing];
    const attempts = Number(existing?.attempts || 0) + Number(failedAttempt);
    return [{
      id: `truth:${snapshot.fingerprint}`,
      fingerprint: snapshot.fingerprint,
      snapshot,
      queuedAt: existing?.queuedAt || now,
      lastAttemptAt: failedAttempt ? now : existing?.lastAttemptAt || null,
      attempts,
      nextAttemptAt: failedAttempt ? new Date(parsedTime(now) + retryDelay(Math.max(1, attempts), options)).toISOString() : now,
      errorCode: error?.code || null
    }];
  }

  function readyQueuedWrite(queue = [], options = {}) {
    const item = Array.isArray(queue) ? queue[0] : null;
    if (!item) return null;
    return parsedTime(item.nextAttemptAt) <= parsedTime(options.now || new Date().toISOString()) ? item : null;
  }

  function healthReport(input = {}) {
    const pending = Number(input.pendingWrites || 0);
    const online = input.online !== false;
    const revision = Number(input.accountRevision || 0);
    const schemaVersion = Number(input.truthSchemaVersion || input.snapshot?.schemaVersion || 0);
    const domainCount = TRUTH_DOMAINS.filter((domain) => Boolean(input.snapshot?.domains?.[domain])).length;
    let status = "CHECKING";
    let tone = "neutral";
    let headline = "Checking your account truth.";
    if (!online) {
      status = "OFFLINE_PROTECTED";
      tone = "yellow";
      headline = "Your latest work is protected on this device.";
    } else if (input.legacyFallback && input.lastError) {
      status = "LEGACY_ACTIVE";
      tone = "yellow";
      headline = "Program continuity is active; full account truth needs Migration 028.";
    } else if (pending) {
      status = "SAVE_QUEUED";
      tone = "yellow";
      headline = `${pending} account snapshot${pending === 1 ? " is" : "s are"} waiting to sync.`;
    } else if (input.lastError) {
      status = "RETRY_REQUIRED";
      tone = "yellow";
      headline = "Account verification needs another attempt.";
    } else if (revision && schemaVersion >= SCHEMA_VERSION && domainCount === TRUTH_DOMAINS.length && input.serverConfirmed === true) {
      status = input.recovered ? "RECOVERED" : "VERIFIED";
      tone = "green";
      headline = input.recovered ? "Account evidence restored and verified." : "Program, evidence, and coaching memory agree.";
    } else if (revision && schemaVersion >= SCHEMA_VERSION && domainCount === TRUTH_DOMAINS.length) {
      status = "VERIFYING";
      tone = "neutral";
      headline = "Waiting for an exact account receipt.";
    }
    return {
      version: VERSION,
      status,
      tone,
      headline,
      accountRevision: revision,
      schemaVersion,
      domainCount,
      expectedDomains: TRUTH_DOMAINS.length,
      pendingWrites: pending,
      fingerprint: input.snapshot?.fingerprint || null,
      lastVerifiedAt: input.lastVerifiedAt || null
    };
  }

  return Object.freeze({
    VERSION,
    SCHEMA_VERSION,
    TRUTH_DOMAINS: [...TRUTH_DOMAINS],
    COLLECTION_LIMITS: { ...COLLECTION_LIMITS },
    stableSerialize,
    fingerprint,
    canonicalize,
    semanticFingerprint,
    itemTime,
    latestTime,
    mergeCollection,
    mergeOrientation,
    mergeConstraints,
    normalizeDomainPayload,
    domainDescriptor,
    buildSnapshot,
    normalizeSnapshot,
    mergeDomainPayload,
    reconcileSnapshots,
    retryDelay,
    queueLatest,
    readyQueuedWrite,
    healthReport
  });
});
