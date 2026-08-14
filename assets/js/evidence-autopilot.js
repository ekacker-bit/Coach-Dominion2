(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionEvidenceAutopilot = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "026J.1";
  const HISTORY_LIMIT = 720;
  const STATUS_ORDER = Object.freeze({ INCOMPLETE: 0, SELF_REPORTED: 1, VERIFIED: 2 });
  const TERMINAL_STATES = new Set(["COMPLETE", "PARTIAL", "STOPPED", "PAIN_HOLD", "SEALED", "CONFIRMED", "VERIFIED", "SECURED"]);
  const MACHINE_SOURCES = new Set(["APPLE_HEALTH", "FITBOD", "MYFITNESSPAL", "PROVIDER_IMPORT", "CONNECTED_PROVIDER"]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
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
    return `proof-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function text(value, fallback = "") {
    return String(value === undefined || value === null ? fallback : value).trim();
  }

  function upper(value, fallback = "") {
    return text(value, fallback).toUpperCase().replace(/[\s-]+/g, "_");
  }

  function isoDate(value) {
    const direct = text(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
  }

  function parsedTime(value) {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeDomain(value) {
    const code = upper(value);
    if (["CARDIO", "RUN", "RUNNING"].includes(code)) return "running";
    if (["ABS", "ABS_CORE", "CORE"].includes(code)) return "core";
    if (["FUEL", "MEAL", "NUTRITION"].includes(code)) return "nutrition";
    if (["ROLL_CALL", "READINESS", "MORNING_VERIFICATION"].includes(code)) return "readiness";
    if (["CLOSE", "CLOSEOUT", "DAILY_CLOSEOUT"].includes(code)) return "closeout";
    if (["RECOVERY", "RECOVERY_ORDER"].includes(code)) return "recovery";
    if (["STRENGTH", "LIFT", "WORKOUT"].includes(code)) return "strength";
    if (["CONDITIONING", "FITNESS_TEST", "BODY_METRICS"].includes(code)) return code.toLowerCase();
    return code ? code.toLowerCase() : "unknown";
  }

  function normalizeKind(value, domain) {
    const code = upper(value);
    if (code) return code;
    if (["strength", "running", "core", "conditioning"].includes(domain)) return "SESSION";
    if (domain === "nutrition") return "INTAKE";
    if (domain === "readiness") return "ROLL_CALL";
    if (domain === "closeout") return "CLOSEOUT";
    if (domain === "recovery") return "RECOVERY";
    return "EVIDENCE";
  }

  function evidenceStatus(source = {}) {
    const explicit = upper(source.evidenceStatus || source.evidence_status || source.proofStatus);
    if (["VERIFIED", "SELF_REPORTED", "INCOMPLETE"].includes(explicit)) return explicit;
    const provider = upper(source.provider || source.sourceProvider || source.provenance?.sourceProvider || source.source);
    if (source.machineVerified === true || MACHINE_SOURCES.has(provider) || source.provenance?.sourceIsDemo === false && source.provenance?.sourceProvider) return "VERIFIED";
    const state = upper(source.state || source.status || source.executionState);
    return TERMINAL_STATES.has(state) ? "SELF_REPORTED" : "INCOMPLETE";
  }

  function sourceTimestamp(source = {}) {
    return source.updatedAt || source.updated_at || source.completedAt || source.completed_at || source.sealedAt || source.confirmedAt || source.recordedAt || source.createdAt || source.performanceTime || source.date || source.performanceDate || null;
  }

  function lineageId(source = {}) {
    const direct = source.lineageId || source.evidenceId || source.sourceEvidenceId || source.metrics?.source_evidence_id;
    if (direct) return text(direct);
    if (source.module && source.summary && source.id) return text(source.id);
    const match = text(source.notes).match(/Mission Execution receipt\s+([^\s.]+)/i);
    return match?.[1] || null;
  }

  function sourceId(source = {}, index = 0) {
    return text(source.sourceId || source.id || source.receiptId || source.executionId || source.performanceId || `${source.date || source.performanceDate || "undated"}:${index}`);
  }

  function sourceType(source = {}) {
    if (source.sourceType) return upper(source.sourceType);
    if (source.module && source.summary) return "MISSION_RECEIPT";
    if (source.performanceDate || source.performance_date) return "PERFORMANCE_ENTRY";
    const domain = normalizeDomain(source.domain || source.module || source.type);
    if (domain === "readiness") return "ROLL_CALL";
    if (domain === "closeout") return "DAILY_CLOSEOUT";
    if (domain === "nutrition") return source.kind === "MEAL" ? "MEAL_EXECUTION" : "FUEL_CLOSEOUT";
    return `${upper(domain, "EVIDENCE")}_EXECUTION`;
  }

  function actionIdentity(source = {}, domain, kind, identity) {
    const linked = lineageId(source);
    if (linked) return linked;
    const session = source.sessionId || source.session_id || source.windowId || source.trainingWindowId || source.activityCode || source.activity_code || source.sessionName || source.session_name;
    return text(session || identity);
  }

  function metricsFor(source = {}) {
    return clone(source.metrics || source.summary || source.actual || source.steps || {});
  }

  function normalizeReceipt(source = {}, index = 0) {
    if (!source || typeof source !== "object") return null;
    const domain = normalizeDomain(source.domain || source.module || source.type || source.sourceType);
    const kind = normalizeKind(source.kind || source.entryType || source.entry_type, domain);
    const identity = sourceId(source, index);
    const date = isoDate(source.date || source.performanceDate || source.performance_date || source.completedAt || source.updatedAt || source.createdAt);
    if (!date || domain === "unknown") return null;
    const linked = lineageId(source);
    const actionId = actionIdentity(source, domain, kind, identity);
    const actionKey = linked ? `${date}:${domain}:LINKED:${linked}` : `${date}:${domain}:${kind}:${actionId}`;
    const type = sourceType(source);
    const capturedAt = sourceTimestamp(source) || `${date}T12:00:00.000Z`;
    const status = evidenceStatus(source);
    return {
      version: VERSION,
      id: fingerprint(actionKey),
      actionKey,
      date,
      domain,
      kind,
      status,
      state: upper(source.state || source.status || (status === "INCOMPLETE" ? "OPEN" : "SECURED")),
      sourceType: type,
      sourceId: identity,
      sourceRevision: Number(source.revision || 1),
      sourceRefs: [{ sourceType: type, sourceId: identity }],
      occurredAt: source.completedAt || source.sealedAt || source.confirmedAt || source.performanceTime || capturedAt,
      capturedAt,
      metrics: metricsFor(source),
      label: text(source.activityName || source.activity_name || source.sessionName || source.session_name || source.title || source.module || domain),
      confidence: status === "VERIFIED" ? "HIGH" : status === "SELF_REPORTED" ? "MODERATE" : "INSUFFICIENT",
      fromPerformance: type === "PERFORMANCE_ENTRY",
      fingerprint: fingerprint({ actionKey, status, state: source.state || source.status, metrics: metricsFor(source) })
    };
  }

  function newer(left, right) {
    const statusDelta = (STATUS_ORDER[right?.status] || 0) - (STATUS_ORDER[left?.status] || 0);
    if (statusDelta !== 0) return statusDelta > 0 ? right : left;
    const revisionDelta = Number(right?.sourceRevision || 0) - Number(left?.sourceRevision || 0);
    if (revisionDelta !== 0) return revisionDelta > 0 ? right : left;
    return parsedTime(right?.capturedAt) >= parsedTime(left?.capturedAt) ? right : left;
  }

  function combine(left, right) {
    const selected = newer(left, right);
    const refs = [...(left?.sourceRefs || []), ...(right?.sourceRefs || [])]
      .filter((item, index, all) => all.findIndex((candidate) => candidate.sourceType === item.sourceType && candidate.sourceId === item.sourceId) === index);
    return {
      ...clone(left),
      ...clone(right),
      ...clone(selected),
      metrics: { ...(left?.metrics || {}), ...(right?.metrics || {}), ...(selected?.metrics || {}) },
      sourceRefs: refs,
      fromPerformance: Boolean(left?.fromPerformance || right?.fromPerformance),
      fingerprint: fingerprint({ actionKey: selected.actionKey, status: selected.status, metrics: { ...(left?.metrics || {}), ...(right?.metrics || {}) }, refs })
    };
  }

  function mergeReceipts(existing = [], incoming = [], limit = HISTORY_LIMIT) {
    const map = new Map();
    [...existing, ...incoming].forEach((item, index) => {
      const receipt = item?.version === VERSION && item?.actionKey ? clone(item) : normalizeReceipt(item, index);
      if (!receipt) return;
      map.set(receipt.actionKey, map.has(receipt.actionKey) ? combine(map.get(receipt.actionKey), receipt) : receipt);
    });
    return [...map.values()]
      .sort((left, right) => String(right.occurredAt || right.date).localeCompare(String(left.occurredAt || left.date)))
      .slice(0, limit);
  }

  function buildReceipts(sources = [], existing = []) {
    return mergeReceipts(existing, sources.map(normalizeReceipt).filter(Boolean));
  }

  function isSecured(receipt) {
    return receipt?.status === "VERIFIED" || receipt?.status === "SELF_REPORTED";
  }

  function dailyProof(date, receipts = [], requiredDomains = []) {
    const normalizedDate = isoDate(date);
    const daily = receipts.filter((item) => item.date === normalizedDate);
    const secured = daily.filter(isSecured);
    const verified = secured.filter((item) => item.status === "VERIFIED");
    const selfReported = secured.filter((item) => item.status === "SELF_REPORTED");
    const required = [...new Set((requiredDomains || []).map(normalizeDomain).filter((item) => item !== "unknown"))];
    const covered = required.filter((domain) => secured.some((item) => item.domain === domain));
    const missing = required.filter((domain) => !covered.includes(domain));
    return {
      date: normalizedDate,
      status: missing.length ? "PROOF_REQUIRED" : secured.length ? "SECURED" : "NO_PROOF",
      receipts: daily,
      secured,
      verified,
      selfReported,
      incomplete: daily.filter((item) => !isSecured(item)),
      requiredDomains: required,
      coveredDomains: covered,
      missingDomains: missing,
      coveragePercent: required.length ? Math.round((covered.length / required.length) * 100) : secured.length ? 100 : 0
    };
  }

  function inRange(date, start, end) {
    return date && (!start || date >= start) && (!end || date <= end);
  }

  function weeklyProof(range = {}, receipts = [], requirements = []) {
    const start = isoDate(range.start || range.weekStartDate);
    const end = isoDate(range.end || range.weekEndDate);
    const weekly = receipts.filter((item) => inRange(item.date, start, end));
    const normalizedRequirements = requirements.map((item) => ({ date: isoDate(item.date), domains: item.domains || [] })).filter((item) => item.date);
    const days = normalizedRequirements.length
      ? normalizedRequirements.map((item) => dailyProof(item.date, weekly, item.domains))
      : [...new Set(weekly.map((item) => item.date))].sort().map((date) => dailyProof(date, weekly));
    const requiredCount = days.reduce((total, item) => total + item.requiredDomains.length, 0);
    const coveredCount = days.reduce((total, item) => total + item.coveredDomains.length, 0);
    return {
      start,
      end,
      receipts: weekly,
      secured: weekly.filter(isSecured),
      verified: weekly.filter((item) => item.status === "VERIFIED"),
      selfReported: weekly.filter((item) => item.status === "SELF_REPORTED"),
      incomplete: weekly.filter((item) => !isSecured(item)),
      days,
      missing: days.flatMap((item) => item.missingDomains.map((domain) => ({ date: item.date, domain }))),
      coveragePercent: requiredCount ? Math.round((coveredCount / requiredCount) * 100) : weekly.some(isSecured) ? 100 : 0
    };
  }

  function performanceEntryFor(receipt = {}) {
    if (!isSecured(receipt) || !["strength", "running", "core", "conditioning"].includes(receipt.domain) || receipt.fromPerformance) return null;
    const metrics = { ...(receipt.metrics || {}), source_evidence_id: receipt.id };
    if (receipt.domain === "strength") {
      metrics.sets = Number(metrics.sets || metrics.setsCompleted || 0);
      metrics.repetitions = Number(metrics.repetitions || 0);
      if (!metrics.sets || !metrics.repetitions) return null;
      metrics.weight = Number(metrics.weight || metrics.volume || 0);
      metrics.weight_unit = metrics.weight_unit || "lb";
    }
    if (receipt.domain === "running") {
      metrics.distance = Number(metrics.distance || 0);
      metrics.distance_unit = metrics.distance_unit || metrics.distanceUnit || "mi";
      if (!metrics.distance) return null;
      if (metrics.durationSeconds && !metrics.duration_seconds) metrics.duration_seconds = Number(metrics.durationSeconds);
    }
    if (receipt.domain === "core" && !metrics.duration_seconds && metrics.durationSeconds) metrics.duration_seconds = Number(metrics.durationSeconds);
    return {
      id: `perf-${receipt.id}`,
      performanceDate: receipt.date,
      domain: receipt.domain,
      entryType: "WORKOUT_SUMMARY",
      activityCode: `autopilot_${receipt.domain}`,
      activityName: receipt.label || `${receipt.domain} session`,
      sessionName: receipt.label || `${receipt.domain} session`,
      source: "COACH_DOMINION",
      evidenceStatus: receipt.status === "VERIFIED" ? "VERIFIED" : "SELF REPORTED",
      metrics,
      notes: `Evidence Autopilot ${receipt.id}.`,
      createdAt: receipt.occurredAt,
      updatedAt: receipt.capturedAt
    };
  }

  return Object.freeze({
    VERSION,
    HISTORY_LIMIT,
    stableSerialize,
    fingerprint,
    normalizeDomain,
    normalizeReceipt,
    mergeReceipts,
    buildReceipts,
    isSecured,
    dailyProof,
    weeklyProof,
    performanceEntryFor
  });
});
