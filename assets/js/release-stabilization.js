(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionReleaseStabilization = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "028F.1";
  const LIFECYCLE = Object.freeze({
    INCOMPLETE: "INCOMPLETE",
    READY: "READY",
    ACTIVE: "ACTIVE",
    DRAFT_REVISION: "DRAFT_REVISION",
    REPAIR_REQUIRED: "REPAIR_REQUIRED",
    LAUNCH_PENDING: "LAUNCH_PENDING",
    PAUSED: "PAUSED"
  });
  const CONNECTION = Object.freeze({
    CURRENT: "CURRENT",
    STALE: "STALE",
    SETUP_REQUIRED: "SETUP_REQUIRED",
    SYNC_PENDING: "SYNC_PENDING",
    CONFLICT: "CONFLICT",
    IMPORT_FAILED: "IMPORT_FAILED",
    NO_EVIDENCE: "NO_EVIDENCE"
  });
  const TRAINING_DOMAINS = Object.freeze(["strength", "running", "core"]);

  function number(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function percentValue(value) {
    const parsed = number(value);
    if (parsed === null) return null;
    const normalized = parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
    return Math.max(0, Math.min(100, normalized));
  }

  function formatPercent(value, options = {}) {
    const normalized = percentValue(value);
    if (normalized === null) return options.fallback ?? "—";
    const precision = options.precision ?? (Math.abs(normalized - Math.round(normalized)) > 0.0001 ? 1 : 0);
    return `${normalized.toFixed(precision).replace(/\.0$/, "")}%`;
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

  function mutationId(key, payloadFingerprint) {
    return `save:${fingerprint(`${key}:${payloadFingerprint}`)}`;
  }

  function retryDelay(attempts = 1, options = {}) {
    const base = Math.min(30 * 60 * 1000, 1000 * (2 ** Math.max(0, Number(attempts || 1) - 1)));
    const jitterRatio = options.jitterRatio ?? 0.2;
    const random = options.random ?? Math.random();
    const jitter = base * jitterRatio * ((random * 2) - 1);
    return Math.max(0, Math.round(base + jitter));
  }

  function enqueue(queue = [], input = {}, options = {}) {
    if (!input.key || input.payload === undefined) return Array.isArray(queue) ? queue : [];
    const source = Array.isArray(queue) ? queue : [];
    const payloadFingerprint = input.fingerprint || fingerprint(input.payload);
    const id = mutationId(input.key, payloadFingerprint);
    const existing = source.find((item) => item.id === id);
    if (existing && options.failedAttempt !== true) return source;
    const now = options.now || new Date().toISOString();
    const attempts = Number(existing?.attempts || 0) + Number(options.failedAttempt === true);
    const nextAttemptAt = options.failedAttempt === true
      ? new Date(Date.parse(now) + retryDelay(Math.max(1, attempts), options)).toISOString()
      : existing?.nextAttemptAt || now;
    const item = {
      ...input,
      id,
      fingerprint: payloadFingerprint,
      queuedAt: existing?.queuedAt || now,
      lastAttemptAt: options.failedAttempt === true ? now : existing?.lastAttemptAt || null,
      attempts,
      nextAttemptAt,
      errorCode: input.errorCode || null
    };
    return [...source.filter((entry) => entry.key !== input.key), item].slice(-50);
  }

  function acknowledge(queue = [], id) {
    return (Array.isArray(queue) ? queue : []).filter((item) => item.id !== id);
  }

  function ready(queue = [], options = {}) {
    const now = Date.parse(options.now || new Date().toISOString());
    return (Array.isArray(queue) ? queue : []).filter((item) => Date.parse(item.nextAttemptAt || item.queuedAt || 0) <= now);
  }

  function oldestAge(queue = [], options = {}) {
    const times = (Array.isArray(queue) ? queue : []).map((item) => Date.parse(item.queuedAt || "")).filter(Number.isFinite);
    if (!times.length) return { milliseconds: 0, label: "NONE" };
    const age = Math.max(0, Date.parse(options.now || new Date().toISOString()) - Math.min(...times));
    if (age < 60000) return { milliseconds: age, label: "<1 MIN" };
    if (age < 3600000) return { milliseconds: age, label: `${Math.floor(age / 60000)} MIN` };
    return { milliseconds: age, label: `${Math.floor(age / 3600000)} HR` };
  }

  function lifecycle(input = {}) {
    if (input.paused === true) return LIFECYCLE.PAUSED;
    if (input.repairRequired === true || input.conflict === true) return LIFECYCLE.REPAIR_REQUIRED;
    if (input.draftRevision === true || input.hasDraft === true) return LIFECYCLE.DRAFT_REVISION;
    if (!input.contractApproved || !input.plansApproved || !input.calendarReady) return LIFECYCLE.INCOMPLETE;
    if (input.launchPending === true) return LIFECYCLE.LAUNCH_PENDING;
    if (input.active === true || input.receiptActive === true) return LIFECYCLE.ACTIVE;
    return LIFECYCLE.READY;
  }

  function lifecycleLabel(value) {
    return ({
      INCOMPLETE: "SETUP NEEDED",
      READY: "READY",
      ACTIVE: "ACTIVE",
      DRAFT_REVISION: "DRAFT — ACTIVE PLAN UNCHANGED",
      REPAIR_REQUIRED: "REPAIR NEEDED",
      LAUNCH_PENDING: "LAUNCH PENDING",
      PAUSED: "PAUSED"
    })[value] || "CHECKING";
  }

  function recoveryDay(decision = {}) {
    const isRecovery = decision.recoveryDay === true || decision.status === "RECOVERY_DAY";
    if (!isRecovery) return null;
    const recoveryComplete = decision.authorization?.recovery?.complete === true || decision.recoveryComplete === true;
    const fuelComplete = decision.authorization?.nutrition?.complete === true || decision.fuelComplete === true;
    return {
      status: "RECOVERY",
      title: recoveryComplete ? "Recovery secured" : "Protect the recovery day",
      detail: "No training is assigned. Complete the recovery action and preserve normal fueling.",
      priority: "RECOVER / PROTECT",
      progression: "N/A — HELD",
      training: Object.fromEntries(TRAINING_DOMAINS.map((domain) => [domain, { state: "N/A", label: "REST", applicable: false }])),
      applicable: ["recovery", "nutrition", "closeout"],
      complete: recoveryComplete && fuelComplete,
      action: recoveryComplete ? { module: "nutrition", label: fuelComplete ? "Close today" : "Log recovery-day Fuel" } : { module: "recovery", label: "Complete recovery action" }
    };
  }

  function connectionState(input = {}, options = {}) {
    const raw = String(input.status || input.connectionStatus || "").toUpperCase().replaceAll(" ", "_");
    const lastAt = input.lastSuccessfulAt || input.lastSyncAt || input.updatedAt || null;
    const ageMs = lastAt ? Date.parse(options.now || new Date().toISOString()) - Date.parse(lastAt) : null;
    if (input.conflict === true || raw === "CONFLICT") return { state: CONNECTION.CONFLICT, label: "Needs a choice", action: "Resolve" };
    if (input.failed === true || ["FAILED", "ERROR", "IMPORT_FAILED"].includes(raw)) return { state: CONNECTION.IMPORT_FAILED, label: "Import failed", action: "Review" };
    if (input.pending === true || ["PENDING", "SYNCING", "QUEUED"].includes(raw)) return { state: CONNECTION.SYNC_PENDING, label: "Sync pending", action: "Retry" };
    if (!raw || ["NOT_CONNECTED", "DISCONNECTED", "SETUP_REQUIRED"].includes(raw)) return { state: CONNECTION.SETUP_REQUIRED, label: "Setup required", action: "Set up" };
    if (!lastAt || input.evidenceCount === 0) return { state: CONNECTION.NO_EVIDENCE, label: "Connected — no evidence", action: "Import" };
    if (ageMs !== null && ageMs >= (options.staleAfterMs || 7 * 86400000)) return { state: CONNECTION.STALE, label: "Connected — stale", action: "Refresh" };
    return { state: CONNECTION.CURRENT, label: "Connected — current", action: "Review" };
  }

  function syncSummary(input = {}) {
    const pending = Number(input.pending || 0);
    if (input.conflicts) return { state: "CONFLICT", tone: "red", label: "CHOICE NEEDED", detail: `${input.conflicts} saved difference${input.conflicts === 1 ? "" : "s"}` };
    if (input.online === false) return { state: "DEVICE_SAVED", tone: "neutral", label: "SAVED HERE", detail: pending ? `${pending} waiting for account sync` : "Offline — account sync paused" };
    if (pending) return { state: "ACCOUNT_PENDING", tone: "yellow", label: "SYNC PENDING", detail: `${pending} protected save${pending === 1 ? "" : "s"}` };
    return { state: "ACCOUNT_SAVED", tone: "neutral", label: "ACCOUNT SAVED", detail: input.lastSavedAt ? `Saved ${input.lastSavedAt}` : "Current" };
  }

  return Object.freeze({
    VERSION,
    LIFECYCLE,
    CONNECTION,
    TRAINING_DOMAINS: [...TRAINING_DOMAINS],
    number,
    percentValue,
    formatPercent,
    stableSerialize,
    fingerprint,
    mutationId,
    retryDelay,
    enqueue,
    acknowledge,
    ready,
    oldestAge,
    lifecycle,
    lifecycleLabel,
    recoveryDay,
    connectionState,
    syncSummary
  });
});
