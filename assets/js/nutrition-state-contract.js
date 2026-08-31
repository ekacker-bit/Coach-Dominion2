(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionNutritionStateContract = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031A.1";
  const ALLOWED_STATE_TYPES = Object.freeze([
    "BASELINE_HISTORY",
    "ADAPTIVE_GOAL",
    "ADAPTIVE_APPROVAL",
    "MEAL_WINDOW",
    "REVIEW_HISTORY",
    "MANUAL_DAY",
    "FASTING_PROTOCOL",
    "FASTING_EXECUTION",
    "MEAL_EXECUTION",
    "FUEL_CLOSED_LOOP"
  ]);
  const ALLOWED = new Set(ALLOWED_STATE_TYPES);
  const LEGACY_ALIASES = Object.freeze({
    FASTING: "FASTING_PROTOCOL",
    FASTING_LOG: "FASTING_EXECUTION",
    MEAL_LOG: "MEAL_EXECUTION",
    CLOSED_LOOP: "FUEL_CLOSED_LOOP"
  });

  function text(value = "") {
    return String(value ?? "").trim();
  }

  function normalizeStateType(value = "") {
    const code = text(value).toUpperCase().replace(/[\s-]+/g, "_");
    const normalized = LEGACY_ALIASES[code] || code;
    return ALLOWED.has(normalized) ? normalized : null;
  }

  function stableSerialize(value) {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function fingerprint(value) {
    const source = stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fuel-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function payloadRevision(payload = {}) {
    return Number(payload?.revision || payload?.contractRevision || payload?.planRevision || payload?.calendarRevision || 0);
  }

  function writeIdentity(input = {}) {
    const stateType = normalizeStateType(input.stateType);
    if (!stateType) return null;
    const stateKey = text(input.stateKey || "current");
    const payloadHash = fingerprint(input.payload ?? {});
    return Object.freeze({
      stateType,
      stateKey,
      revision: payloadRevision(input.payload),
      payloadHash,
      key: [text(input.userId || "local"), stateType, stateKey, payloadRevision(input.payload), payloadHash].join(":")
    });
  }

  function normalizeRows(rows = []) {
    const merged = new Map();
    (Array.isArray(rows) ? rows : []).filter(Boolean).forEach((row) => {
      const stateType = normalizeStateType(row.state_type || row.stateType);
      if (!stateType) return;
      const stateKey = text(row.state_key || row.stateKey || "current");
      const normalized = { ...row, state_type: stateType, state_key: stateKey };
      const key = `${stateType}:${stateKey}`;
      const prior = merged.get(key);
      if (!prior || Date.parse(normalized.updated_at || 0) >= Date.parse(prior.updated_at || 0)) merged.set(key, normalized);
    });
    return [...merged.values()];
  }

  function shouldPersist(input = {}) {
    if (input.force === true) return { persist: true, reason: "FORCED" };
    const identity = writeIdentity(input);
    if (!identity) return { persist: false, reason: "UNSUPPORTED_STATE_TYPE" };
    const pending = (Array.isArray(input.pending) ? input.pending : []).find((item) => {
      const candidate = writeIdentity({
        userId: input.userId,
        stateType: item.stateType,
        stateKey: item.stateKey,
        payload: item.payload
      });
      return candidate?.key === identity.key;
    });
    if (pending) return { persist: false, reason: "ALREADY_QUEUED", identity };
    const metaFingerprint = input.meta?.payloadHash || input.meta?.fingerprint || null;
    if (input.meta?.syncedAt && metaFingerprint === identity.payloadHash) return { persist: false, reason: "ALREADY_CONFIRMED", identity };
    return { persist: true, reason: "CHANGED", identity };
  }

  function classifyFailure(error = null) {
    const message = text(error?.message);
    const constraint = error?.code === "23514" || /nutrition_state.*state_type|state_type.*check constraint/i.test(message);
    return Object.freeze({
      category: constraint ? "FUEL_SCHEMA_RETRY" : "FUEL_SAVE_RETRY",
      persistenceState: "TRANSIENT_FAILURE",
      errorCode: text(error?.code || (constraint ? "FUEL_STATE_CONTRACT" : "FUEL_SAVE_FAILED")),
      userMessage: "Fuel save needs retry"
    });
  }

  function confirmWrite(input = {}) {
    const expected = writeIdentity(input);
    const row = input.row || null;
    if (!expected || !row) return Object.freeze({ confirmed: false, reason: "SAVE_NOT_ACKNOWLEDGED", identity: expected });
    const actual = writeIdentity({
      userId: row.user_id || row.userId,
      stateType: row.state_type || row.stateType,
      stateKey: row.state_key || row.stateKey,
      payload: row.payload
    });
    const sameUser = text(row.user_id || row.userId) === text(input.userId);
    const confirmed = Boolean(sameUser && actual?.key === expected.key);
    return Object.freeze({ confirmed, reason: confirmed ? "CONFIRMED" : "SAVE_NOT_ACKNOWLEDGED", identity: expected, actual });
  }

  return Object.freeze({
    VERSION,
    ALLOWED_STATE_TYPES: [...ALLOWED_STATE_TYPES],
    LEGACY_ALIASES: { ...LEGACY_ALIASES },
    normalizeStateType,
    normalizeRows,
    stableSerialize,
    fingerprint,
    writeIdentity,
    shouldPersist,
    confirmWrite,
    classifyFailure
  });
});
