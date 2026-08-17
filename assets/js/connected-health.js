(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionConnectedHealth = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029F.1";
  const STATE = Object.freeze({
    CONNECTED_CURRENT: "CONNECTED_CURRENT",
    CONNECTED_STALE: "CONNECTED_STALE",
    SETUP_REQUIRED: "SETUP_REQUIRED",
    SYNC_PENDING: "SYNC_PENDING",
    ERROR: "ERROR"
  });
  const PRESENTATION = Object.freeze({
    [STATE.CONNECTED_CURRENT]: { label: "CONNECTED AND CURRENT", tone: "green", detail: "Every evidence source has a recent successful import." },
    [STATE.CONNECTED_STALE]: { label: "CONNECTED BUT STALE", tone: "yellow", detail: "At least one evidence source needs a fresh import." },
    [STATE.SETUP_REQUIRED]: { label: "SETUP REQUIRED", tone: "neutral", detail: "Connect and import current Strength, Fuel, and Health evidence." },
    [STATE.SYNC_PENDING]: { label: "SYNC PENDING", tone: "yellow", detail: "Your work is protected while account or evidence sync finishes." },
    [STATE.ERROR]: { label: "ERROR", tone: "red", detail: "A source or account save needs attention before evidence is current." }
  });

  function normalized(value) {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function aggregate(input = {}) {
    const sources = Array.isArray(input.sources) ? input.sources : [];
    const sourceStates = sources.map((source) => normalized(source?.state));
    const accountState = normalized(input.accountState);
    const storageState = normalized(input.storageState);
    const hasError = input.remoteLoadFailed === true
      || ["CONFLICT", "IMPORT_FAILED", "FAILED", "ERROR", "SYNC_ERROR"].includes(accountState)
      || sourceStates.some((state) => ["CONFLICT", "IMPORT_FAILED", "FAILED", "ERROR", "SYNC_ERROR"].includes(state));
    const pending = input.online === false
      || ["ACCOUNT_PENDING", "DEVICE_SAVED", "SYNC_PENDING", "QUEUED", "RUNNING"].includes(accountState)
      || sourceStates.some((state) => ["SYNC_PENDING", "QUEUED", "RUNNING"].includes(state));
    const setupRequired = !sources.length
      || ["LOCAL_FALLBACK", "LOCAL_FALLBACK_ACTIVE"].includes(storageState)
      || sourceStates.some((state) => ["SETUP_REQUIRED", "NOT_CONNECTED", "DISCONNECTED", "NO_EVIDENCE", "DEMO"].includes(state));
    const stale = sourceStates.some((state) => state === "STALE");
    const current = sources.length > 0 && sourceStates.every((state) => ["CURRENT", "CONNECTED_CURRENT"].includes(state));
    const state = hasError
      ? STATE.ERROR
      : pending
        ? STATE.SYNC_PENDING
        : setupRequired
          ? STATE.SETUP_REQUIRED
          : stale
            ? STATE.CONNECTED_STALE
            : current
              ? STATE.CONNECTED_CURRENT
              : STATE.SETUP_REQUIRED;
    return Object.freeze({ state, ...PRESENTATION[state], sourceCount: sources.length });
  }

  function source(input = {}) {
    if (input.isSimulated === true) return Object.freeze({ ...input, state: "SETUP_REQUIRED", label: "Setup required", action: "Connect source" });
    return Object.freeze({ ...input });
  }

  function sentence(summary = {}) {
    const base = summary.detail || PRESENTATION[STATE.SETUP_REQUIRED].detail;
    if (summary.state === STATE.ERROR) return `${base} Review the source marked in red.`;
    if (summary.state === STATE.SYNC_PENDING) return `${base} No pending save is called current until the server confirms it.`;
    return base;
  }

  return Object.freeze({ VERSION, STATE, PRESENTATION, normalized, aggregate, source, sentence });
});
