(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionWeekExecutionCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030M.1";
  const TYPE = "WEEK_EXECUTION_CERTIFICATION";
  const OUTCOMES = Object.freeze({
    COMPLETED: "COMPLETED",
    PARTIAL: "PARTIAL",
    MISSED: "MISSED",
    REPLACED: "REPLACED",
    UNRESOLVED: "UNRESOLVED",
    PENDING: "PENDING"
  });
  const TRAINING = new Set(["strength", "running", "core"]);
  const CLOSED = new Set(["CLOSED", "COMPLETE", "COMPLETED", "FINALIZED", "SEALED", "SUBMITTED"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function finite(value) {
    if (value === "" || value === null || value === undefined) return null;
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
  }
  function round(value, digits = 1) {
    const scale = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * scale) / scale;
  }
  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }
  function hash(value = "") {
    let result = 2166136261;
    for (const char of String(value)) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function isoDate(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  function addDays(value, amount) {
    const date = new Date(`${isoDate(value)}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return null;
    date.setUTCDate(date.getUTCDate() + Number(amount || 0));
    return date.toISOString().slice(0, 10);
  }
  function dayLabel(value) {
    const date = new Date(`${isoDate(value)}T12:00:00Z`);
    return Number.isNaN(date.getTime()) ? "day" : date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  }
  function domain(value = "") {
    const code = upper(value);
    return ({
      STRENGTH: "strength", WORKOUT: "strength", TRAINING: "strength",
      RUN: "running", RUNNING: "running", CARDIO: "running",
      CORE: "core", ABS: "core", ABS_CORE: "core",
      FUEL: "nutrition", FUELING: "nutrition", NUTRITION: "nutrition"
    })[code] || text(value).toLowerCase();
  }
  function assignmentId(entry = {}) {
    return text(entry.assignmentId || entry.assignment?.assignmentId || entry.assignment?.id);
  }
  function evidenceId(value = {}, index = 0) {
    return text(value.id || value.evidenceId || value.receiptId || value.sourceId || `evidence-${index}`);
  }
  function evidenceTime(value = {}) {
    const keys = ["verifiedAt", "completedAt", "recordedAt", "updatedAt", "createdAt", "date"];
    return Math.max(0, ...keys.map((key) => Date.parse(value?.[key] || "") || 0));
  }
  function evidenceVerified(value = {}) {
    return ["VERIFIED", "CONNECTED_VERIFIED", "SECURED"].includes(upper(value.evidenceStatus || value.verificationStatus || value.status));
  }
  function bestEvidence(entry = {}) {
    const candidates = [
      ...(Array.isArray(entry.evidence) ? entry.evidence : []),
      ...(entry.execution ? [entry.execution] : [])
    ].filter(Boolean);
    return candidates.sort((left, right) => Number(evidenceVerified(right)) - Number(evidenceVerified(left))
      || evidenceTime(right) - evidenceTime(left)
      || evidenceId(left).localeCompare(evidenceId(right)))[0] || null;
  }
  function closeoutSealed(value = {}) {
    return Boolean(value.closedAt || value.completedAt || value.finalizedAt || value.submittedAt)
      || CLOSED.has(upper(value.status || value.state));
  }
  function terminalOutcome(entry = {}, sealed = false, pending = false) {
    const state = text(entry.state).toLowerCase();
    if (["completed", "verified"].includes(state)) return OUTCOMES.COMPLETED;
    if (["in_progress", "draft_evidence"].includes(state)) return OUTCOMES.PARTIAL;
    if (["superseded", "cancelled"].includes(state)) return OUTCOMES.REPLACED;
    if (pending) return OUTCOMES.PENDING;
    return sealed ? OUTCOMES.MISSED : OUTCOMES.UNRESOLVED;
  }
  function workSetCount(value = {}) {
    const logs = value.setLogs || value.set_logs || {};
    const explicit = finite(value.metrics?.completed_sets ?? value.metrics?.completedSets ?? value.completed_sets ?? value.completedSets);
    const logged = Object.values(logs).reduce((sum, items) => sum + (Array.isArray(items)
      ? items.filter((item) => upper(item.kind || "WORK") !== "WARMUP").length
      : 0), 0);
    return Math.max(logged, explicit || 0);
  }
  function durationSeconds(value = {}) {
    const metrics = value.metrics || value.actual || value.totals || value;
    return finite(metrics.duration_seconds ?? metrics.durationSeconds ?? value.durationSeconds ?? value.elapsedSeconds)
      ?? ((finite(metrics.duration_minutes ?? metrics.durationMinutes ?? value.durationMinutes) || 0) * 60);
  }
  function distanceMiles(value = {}) {
    const metrics = value.metrics || value.actual || value.totals || value;
    const miles = finite(metrics.distance_miles ?? metrics.distanceMiles);
    if (miles !== null) return miles;
    const kilometers = finite(metrics.distance_km ?? metrics.distanceKm);
    if (kilometers !== null) return kilometers * 0.621371;
    const meters = finite(metrics.distance_meters ?? metrics.distanceMeters);
    if (meters !== null) return meters / 1609.344;
    const distance = finite(metrics.distance);
    const unit = upper(metrics.distance_unit || metrics.distanceUnit || metrics.unit);
    if (distance === null) return 0;
    if (["KM", "KILOMETER", "KILOMETERS"].includes(unit)) return distance * 0.621371;
    if (["M", "METER", "METERS"].includes(unit)) return distance / 1609.344;
    return distance;
  }
  function coreMinutes(value = {}) {
    const seconds = durationSeconds(value);
    return seconds > 0 ? seconds / 60 : 0;
  }
  function normalizeWeek(value = {}) {
    const weekStart = isoDate(value.weekStart || value.weekStartDate);
    const weekEnd = isoDate(value.weekEnd || value.weekEndDate) || addDays(weekStart, 6);
    return {
      id: text(value.id || value.weekId || `week:${weekStart || "unknown"}`),
      weekStart,
      weekEnd,
      revision: Number(value.revision || value.weekRevision || 0),
      contractRevision: Number(String(value.contractRevision || 0).replace(/^R/i, "")),
      programFingerprint: text(value.programFingerprint || value.programId || value.sourceRefs?.programId) || null
    };
  }
  function receiptScopeMatches(receipt = {}, week = {}) {
    return isoDate(receipt.weekStart) === week.weekStart
      && Number(receipt.weekRevision || 0) === Number(week.weekRevision ?? week.revision ?? 0)
      && Number(receipt.contractRevision || 0) === Number(week.contractRevision || 0);
  }
  function repairFor(unresolved = [], issues = []) {
    if (issues.length) return {
      code: "REPAIR_WEEK_EVIDENCE",
      label: "Repair week evidence",
      detail: "One assignment or proof is not tied cleanly to the committed week.",
      section: "inspection"
    };
    const item = unresolved[0];
    if (!item) return null;
    const label = item.module === "nutrition" ? "Fuel" : text(item.title || item.module || "assignment");
    return {
      code: "RESOLVE_ASSIGNMENT",
      label: `Resolve ${dayLabel(item.date)}: ${label}`,
      detail: `Record the result or close ${dayLabel(item.date)} so the assignment can be marked missed truthfully.`,
      section: item.module === "nutrition" ? "nutrition" : "performance",
      date: item.date,
      assignmentId: item.assignmentId,
      module: item.module
    };
  }

  function evaluate(input = {}) {
    const week = normalizeWeek(input.week || {});
    const dates = week.weekStart ? Array.from({ length: 7 }, (_, index) => addDays(week.weekStart, index)) : [];
    const ledgers = Array.isArray(input.ledgers) ? input.ledgers : [];
    const ledgerByDate = new Map(ledgers.map((item) => [isoDate(item?.date), item]));
    const closeouts = Array.isArray(input.closeouts) ? input.closeouts : [];
    const closeoutByDate = new Map(closeouts.filter(closeoutSealed).map((item) => [isoDate(item.date), item]));
    const readinessDates = new Set((Array.isArray(input.readiness) ? input.readiness : []).map((item) => isoDate(item?.date)).filter(Boolean));
    const currentDate = isoDate(input.currentDate) || week.weekEnd;
    const issues = [];
    if (!week.weekStart) issues.push({ code: "MISSING_WEEK_START" });
    if (dates.length && week.weekEnd !== dates[6]) issues.push({ code: "INVALID_WEEK_RANGE", expected: dates[6], received: week.weekEnd });
    const seenAssignments = new Set();
    const outcomes = [];
    const days = dates.map((date) => {
      const ledger = ledgerByDate.get(date);
      if (!ledger) issues.push({ code: "MISSING_DAY_LEDGER", date });
      (ledger?.consistency?.issues || []).forEach((issue) => issues.push({ ...issue, date }));
      const sealed = closeoutByDate.has(date);
      const future = Boolean(currentDate && date > currentDate);
      const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
      entries.forEach((entry, index) => {
        const id = assignmentId(entry);
        if (!id) issues.push({ code: "MISSING_ASSIGNMENT_ID", date, module: domain(entry.module) });
        else if (seenAssignments.has(id)) issues.push({ code: "DUPLICATE_ASSIGNMENT", date, assignmentId: id });
        else seenAssignments.add(id);
        const result = terminalOutcome(entry, sealed, future);
        const proof = bestEvidence(entry);
        outcomes.push({
          date,
          assignmentId: id || `missing:${date}:${domain(entry.module)}:${index}`,
          module: domain(entry.module),
          title: text(entry.assignment?.title || entry.title || entry.module),
          outcome: result,
          evidenceId: proof ? evidenceId(proof) : null,
          evidenceVerified: proof ? evidenceVerified(proof) : false,
          evidence: proof
        });
      });
      const training = outcomes.filter((item) => item.date === date && TRAINING.has(item.module));
      const dayOutcomes = outcomes.filter((item) => item.date === date);
      const status = training.length === 0 ? "RECOVERY"
        : dayOutcomes.some((item) => item.outcome === OUTCOMES.UNRESOLVED) ? OUTCOMES.UNRESOLVED
          : dayOutcomes.some((item) => item.outcome === OUTCOMES.PENDING) ? OUTCOMES.PENDING
          : dayOutcomes.some((item) => item.outcome === OUTCOMES.MISSED) ? OUTCOMES.MISSED
            : dayOutcomes.some((item) => item.outcome === OUTCOMES.PARTIAL) ? OUTCOMES.PARTIAL
              : dayOutcomes.every((item) => item.outcome === OUTCOMES.REPLACED) ? OUTCOMES.REPLACED
                : OUTCOMES.COMPLETED;
      return { date, status, recovery: training.length === 0, closeout: sealed, rollCall: readinessDates.has(date), assignments: dayOutcomes.map((item) => item.assignmentId) };
    });
    const unresolved = outcomes.filter((item) => item.outcome === OUTCOMES.UNRESOLVED);
    const terminalCounts = Object.fromEntries(Object.values(OUTCOMES).map((code) => [code, outcomes.filter((item) => item.outcome === code).length]));
    const training = outcomes.filter((item) => TRAINING.has(item.module) && item.outcome !== OUTCOMES.REPLACED);
    const executedTraining = training.filter((item) => [OUTCOMES.COMPLETED, OUTCOMES.PARTIAL].includes(item.outcome));
    const completedFuelDates = new Set(outcomes.filter((item) => item.module === "nutrition" && item.outcome === OUTCOMES.COMPLETED).map((item) => item.date));
    const completedStrength = outcomes.filter((item) => item.module === "strength" && item.outcome === OUTCOMES.COMPLETED);
    const completedRuns = outcomes.filter((item) => item.module === "running" && [OUTCOMES.COMPLETED, OUTCOMES.PARTIAL].includes(item.outcome));
    const completedCore = outcomes.filter((item) => item.module === "core" && [OUTCOMES.COMPLETED, OUTCOMES.PARTIAL].includes(item.outcome));
    const metrics = {
      trainingSessionsPlanned: training.length,
      trainingSessionsExecuted: executedTraining.length,
      completedAssignments: terminalCounts.COMPLETED,
      partialAssignments: terminalCounts.PARTIAL,
      missedAssignments: terminalCounts.MISSED,
      replacedAssignments: terminalCounts.REPLACED,
      unresolvedAssignments: terminalCounts.UNRESOLVED,
      strengthSets: completedStrength.reduce((sum, item) => sum + workSetCount(item.evidence || {}), 0),
      runningMiles: round(completedRuns.reduce((sum, item) => sum + distanceMiles(item.evidence || {}), 0), 2),
      runningMinutes: round(completedRuns.reduce((sum, item) => sum + durationSeconds(item.evidence || {}), 0) / 60, 1),
      coreMinutes: round(completedCore.reduce((sum, item) => sum + coreMinutes(item.evidence || {}), 0), 1),
      fuelDaysLogged: completedFuelDates.size,
      rollCallDays: dates.filter((date) => readinessDates.has(date)).length,
      closeoutDays: dates.filter((date) => closeoutByDate.has(date)).length,
      recoveryDays: days.filter((item) => item.recovery).length
    };
    const proof = {
      week,
      outcomes: outcomes.map((item) => ({ date: item.date, assignmentId: item.assignmentId, module: item.module, outcome: item.outcome, evidenceId: item.evidenceId, evidenceVerified: item.evidenceVerified })),
      closeouts: dates.filter((date) => closeoutByDate.has(date)),
      rollCalls: dates.filter((date) => readinessDates.has(date)),
      metrics
    };
    const fingerprint = `week-execution:${week.weekStart || "unknown"}:r${week.revision}:${hash(stableJson(proof))}`;
    const weekComplete = Boolean(currentDate && week.weekEnd && currentDate >= week.weekEnd);
    const canFinalize = weekComplete && issues.length === 0 && unresolved.length === 0;
    return {
      version: VERSION,
      type: TYPE,
      status: canFinalize ? "READY" : !weekComplete && issues.length === 0 && unresolved.length === 0 ? "COLLECTING" : "BLOCKED",
      locked: false,
      canFinalize,
      weekId: week.id,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      weekRevision: week.revision,
      contractRevision: week.contractRevision,
      programFingerprint: week.programFingerprint,
      currentDate,
      weekComplete,
      days,
      outcomes: proof.outcomes,
      counts: terminalCounts,
      metrics,
      issues,
      repair: repairFor(unresolved, issues),
      fingerprint
    };
  }

  function certify(input = {}) {
    const candidate = evaluate(input);
    const prior = input.priorReceipt || input.prior || null;
    if (prior?.locked || prior?.status === "CERTIFIED") {
      if (!receiptScopeMatches(prior, candidate)) {
        return {
          ...candidate,
          status: "BLOCKED",
          canFinalize: false,
          issues: [...candidate.issues, { code: "RECEIPT_SCOPE_CONFLICT", receiptId: prior.id || null }],
          repair: { code: "OPEN_SIGNED_WEEK", label: "Open the signed week", detail: "The saved receipt belongs to another week revision.", section: "inspection" }
        };
      }
      if (prior.fingerprint === candidate.fingerprint) return { ...clone(prior), idempotent: true, lateEvidence: false };
      return { ...clone(prior), idempotent: false, lateEvidence: true, observedFingerprint: candidate.fingerprint };
    }
    if (!candidate.canFinalize) return candidate;
    const finalizedAt = input.finalizedAt || new Date().toISOString();
    return {
      ...candidate,
      id: `${TYPE.toLowerCase()}:${candidate.weekStart}:r${candidate.weekRevision}:${hash(candidate.fingerprint)}`,
      status: "CERTIFIED",
      locked: true,
      certifiedAt: finalizedAt,
      finalizedAt,
      repair: null
    };
  }

  function upsertHistory(history = [], receipt = null, limit = 52) {
    const current = (Array.isArray(history) ? history : []).filter(Boolean);
    if (!receipt?.weekStart) return current.slice(0, limit);
    const sameWeek = current.find((item) => isoDate(item.weekStart) === isoDate(receipt.weekStart));
    const selected = sameWeek?.locked && sameWeek.fingerprint !== receipt.fingerprint ? sameWeek : receipt;
    return [selected, ...current.filter((item) => isoDate(item.weekStart) !== isoDate(receipt.weekStart))]
      .sort((left, right) => String(right.weekStart || "").localeCompare(String(left.weekStart || "")))
      .slice(0, Math.max(1, Number(limit || 52)));
  }

  return Object.freeze({
    VERSION,
    TYPE,
    OUTCOMES: { ...OUTCOMES },
    evaluate,
    certify,
    upsertHistory,
    closeoutSealed,
    terminalOutcome,
    bestEvidence,
    receiptScopeMatches
  });
});
