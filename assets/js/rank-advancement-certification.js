(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRankAdvancementCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030N.1";
  const TYPE = "RANK_ADVANCEMENT_CERTIFICATION";
  const RANKS = Object.freeze(["RECRUIT", "CADET", "OPERATOR", "VANGUARD", "DOMINION", "ASCENDANT"]);
  const CLOSED_STANDARDS = new Set(["RESOLVED", "DISMISSED", "EXCUSED"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function isoDate(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
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
  function rankIndex(value = "") { return RANKS.indexOf(upper(value)); }
  function validTransition(priorRank, nextRank) {
    const prior = rankIndex(priorRank);
    const next = rankIndex(nextRank);
    return prior >= 0 && next === prior + 1;
  }
  function inspectionWeek(item = {}) { return isoDate(item.weekStart || item.weekStartDate || item.week_start_date); }
  function inspectionFinalizedAt(item = {}) { return item.finalizedAt || item.finalized_at || null; }
  function inspectionId(item = {}) {
    const weekStart = inspectionWeek(item);
    return text(item.id || item.inspectionId || item.inspection_id || `inspection:${weekStart || "unknown"}`);
  }
  function requirementProof(eligibility = {}) {
    return (Array.isArray(eligibility.requirements) ? eligibility.requirements : []).map((item) => ({
      requirement: text(item.requirement),
      target: item.target ?? null,
      actual: item.actual ?? null,
      passed: item.passed === true
    }));
  }
  function latestCertifiedExecution(certifications = [], weekStart = "") {
    return (Array.isArray(certifications) ? certifications : [])
      .filter((item) => isoDate(item?.weekStart) === isoDate(weekStart))
      .filter((item) => upper(item?.status) === "CERTIFIED" && item?.locked === true)
      .sort((left, right) => String(right.certifiedAt || right.finalizedAt || "").localeCompare(String(left.certifiedAt || left.finalizedAt || "")))[0] || null;
  }
  function openStandards(items = []) {
    return (Array.isArray(items) ? items : []).filter((item) => !CLOSED_STANDARDS.has(upper(item?.status || "CANDIDATE")));
  }
  function repairFor(issues = [], targetRank = "") {
    const issue = issues[0];
    if (!issue) return null;
    if (issue.code === "NOT_ELIGIBLE") return { code: "EARN_REQUIREMENTS", label: `Keep earning ${text(targetRank).toLowerCase() || "the next rank"}`, detail: "The next unmet advancement gate is shown below.", section: "inspection" };
    if (issue.code === "OPEN_STANDARD") return { code: "RESOLVE_STANDARD", label: "Resolve the standards issue", detail: "An open standards case prevents advancement.", section: "standards" };
    if (["LATEST_EXECUTION_NOT_CERTIFIED", "EXECUTION_WEEK_MISMATCH"].includes(issue.code)) return { code: "CERTIFY_WEEK", label: "Certify the latest week", detail: "Finalize the week with its assignment-linked execution receipt before promotion.", section: "inspection" };
    if (issue.code === "RANK_HISTORY_CONFLICT") return { code: "RESTORE_RANK_HISTORY", label: "Restore rank history", detail: "The saved advancement chain does not match the active rank. Nothing was changed.", section: "account" };
    return { code: "REVIEW_ADVANCEMENT", label: "Review advancement proof", detail: "The promotion proof is incomplete or inconsistent.", section: "inspection" };
  }

  function assess(input = {}) {
    const currentRank = upper(input.currentRank || "RECRUIT");
    const targetRank = upper(input.targetRank || input.nextRank || "CADET");
    const eligibility = input.eligibility || {};
    const finalized = (Array.isArray(input.inspections) ? input.inspections : [])
      .filter((item) => inspectionWeek(item) && inspectionFinalizedAt(item))
      .sort((left, right) => inspectionWeek(left).localeCompare(inspectionWeek(right)));
    const uniqueByWeek = new Map(finalized.map((item) => [inspectionWeek(item), item]));
    const inspections = [...uniqueByWeek.values()];
    const latestInspection = inspections.at(-1) || null;
    const latestWeek = inspectionWeek(latestInspection || {});
    const execution = latestCertifiedExecution(input.executionCertifications, latestWeek);
    const standards = openStandards(input.standards);
    const requirements = requirementProof(eligibility);
    const historyState = validateHistory(input.history || [], currentRank);
    const issues = [];
    if (!validTransition(currentRank, targetRank)) issues.push({ code: "INVALID_RANK_TRANSITION", currentRank, targetRank });
    if (!historyState.valid || historyState.currentRank !== currentRank) issues.push({ code: "RANK_HISTORY_CONFLICT", expectedRank: historyState.currentRank, currentRank });
    if (upper(eligibility.status) !== "ELIGIBLE" || requirements.some((item) => !item.passed)) issues.push({ code: "NOT_ELIGIBLE" });
    if (!latestInspection) issues.push({ code: "NO_FINALIZED_INSPECTION" });
    if (!execution) issues.push({ code: "LATEST_EXECUTION_NOT_CERTIFIED", weekStart: latestWeek });
    if (execution && isoDate(execution.weekStart) !== latestWeek) issues.push({ code: "EXECUTION_WEEK_MISMATCH", weekStart: latestWeek, executionWeek: execution.weekStart });
    if (standards.length) issues.push({ code: "OPEN_STANDARD", count: standards.length });
    const proof = {
      currentRank,
      targetRank,
      requirements,
      inspections: inspections.map((item) => ({
        id: inspectionId(item),
        weekStart: inspectionWeek(item),
        finalizedAt: inspectionFinalizedAt(item),
        score: item.score ?? item.weeklyDisciplineScore ?? item.weekly_discipline_score ?? null,
        evidenceCoverage: item.evidenceCoverage ?? item.evidence_coverage ?? null
      })),
      latestExecution: execution ? {
        id: execution.id,
        weekStart: isoDate(execution.weekStart),
        fingerprint: execution.fingerprint,
        weekRevision: Number(execution.weekRevision || 0),
        contractRevision: Number(execution.contractRevision || 0)
      } : null,
      standards: standards.map((item) => ({ id: text(item.id || item.standardCode || item.standard_code), status: upper(item.status), severity: text(item.severity?.level || item.severity) }))
    };
    const fingerprint = `rank-advancement:${currentRank}:${targetRank}:${hash(stableJson(proof))}`;
    return {
      version: VERSION,
      type: TYPE,
      status: issues.length ? "BLOCKED" : "READY",
      locked: false,
      canCertify: issues.length === 0,
      currentRank,
      targetRank,
      latestWeek,
      qualifyingWeeks: inspections.length,
      proof,
      issues,
      repair: repairFor(issues, targetRank),
      fingerprint
    };
  }

  function certify(input = {}) {
    const candidate = assess(input);
    const sameTransition = (Array.isArray(input.history) ? input.history : [])
      .filter((item) => item?.locked && upper(item.currentRank || item.priorRank) === candidate.currentRank && upper(item.targetRank || item.newRank) === candidate.targetRank)
      .sort((left, right) => String(right.certifiedAt || right.finalizedAt || "").localeCompare(String(left.certifiedAt || left.finalizedAt || "")))[0] || null;
    if (sameTransition) {
      if (sameTransition.fingerprint === candidate.fingerprint) return { ...clone(sameTransition), idempotent: true, lateEvidence: false };
      return { ...clone(sameTransition), idempotent: false, lateEvidence: true, observedFingerprint: candidate.fingerprint };
    }
    if (!candidate.canCertify) return candidate;
    const certifiedAt = input.certifiedAt || input.finalizedAt || new Date().toISOString();
    return {
      ...candidate,
      id: `${TYPE.toLowerCase()}:${candidate.currentRank}:${candidate.targetRank}:${hash(candidate.fingerprint)}`,
      status: "CERTIFIED",
      locked: true,
      canCertify: false,
      priorRank: candidate.currentRank,
      newRank: candidate.targetRank,
      promotionState: "PROMOTED",
      effectiveDate: isoDate(certifiedAt),
      certifiedAt,
      finalizedAt: certifiedAt,
      repair: null
    };
  }

  function validateHistory(history = [], fallbackRank = "RECRUIT") {
    const certified = (Array.isArray(history) ? history : [])
      .filter((item) => item?.locked === true && upper(item?.status) === "CERTIFIED")
      .sort((left, right) => rankIndex(left.currentRank || left.priorRank) - rankIndex(right.currentRank || right.priorRank));
    let currentRank = certified.length ? upper(certified[0].currentRank || certified[0].priorRank) : upper(fallbackRank || "RECRUIT");
    const issues = [];
    certified.forEach((item) => {
      const prior = upper(item.currentRank || item.priorRank);
      const next = upper(item.targetRank || item.newRank);
      if (prior !== currentRank || !validTransition(prior, next)) issues.push({ code: "BROKEN_ADVANCEMENT_CHAIN", receiptId: item.id || null, expectedRank: currentRank, priorRank: prior, targetRank: next });
      else currentRank = next;
    });
    return { valid: issues.length === 0, currentRank, count: certified.length, issues, history: certified };
  }

  function upsertHistory(history = [], receipt = null, limit = 12) {
    const current = (Array.isArray(history) ? history : []).filter(Boolean);
    if (!receipt?.id) return current.slice(0, limit);
    const existing = current.find((item) => item.id === receipt.id || (upper(item.currentRank || item.priorRank) === upper(receipt.currentRank || receipt.priorRank) && upper(item.targetRank || item.newRank) === upper(receipt.targetRank || receipt.newRank)));
    const selected = existing?.locked && existing.fingerprint !== receipt.fingerprint ? existing : receipt;
    return [selected, ...current.filter((item) => item !== existing && item.id !== selected.id)]
      .sort((left, right) => rankIndex(right.targetRank || right.newRank) - rankIndex(left.targetRank || left.newRank))
      .slice(0, Math.max(1, Number(limit || 12)));
  }

  return Object.freeze({ VERSION, TYPE, RANKS: [...RANKS], assess, certify, validateHistory, upsertHistory, validTransition, latestCertifiedExecution });
});
