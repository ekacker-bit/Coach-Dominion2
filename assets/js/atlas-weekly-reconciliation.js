(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasWeeklyReconciliation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030K.1";
  const FINAL_PROOF_CODES = new Set(["WORKED", "MIXED", "MISSED", "INSUFFICIENT_EVIDENCE"]);
  const CLOSED_STANDARD_STATES = new Set(["RESOLVED", "DISMISSED", "EXCUSED"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }
  function dateIso(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  function addDays(value = "", count = 0) {
    const source = dateIso(value);
    if (!source) return null;
    const date = new Date(`${source}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(count || 0));
    return date.toISOString().slice(0, 10);
  }
  function inRange(value = "", start = "", end = "") {
    const date = dateIso(value);
    return Boolean(date && start && end && date >= start && date <= end);
  }
  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function stableHash(value = "") {
    let hash = 2166136261;
    for (const char of typeof value === "string" ? value : stableJson(value)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function inspectionValue(record = {}, camel = "", snake = "") {
    return record?.[camel] ?? record?.[snake] ?? null;
  }
  function friendlyDomain(value = "") {
    const code = upper(value);
    return ({ MISSION: "Mission", STRENGTH: "Strength", CARDIO: "Cardio", RUNNING: "Running", CORE: "Core", RECOVERY: "Recovery", NUTRITION: "Fuel", FUELING: "Fuel" })[code]
      || text(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  function onePerIdentity(items = []) {
    const byId = new Map();
    (Array.isArray(items) ? items : []).filter(Boolean).forEach((item, index) => {
      const id = text(item.id || item.decisionId || `${item.effectiveDate || item.date || "item"}:${index}`);
      const current = byId.get(id);
      const nextTime = text(item.updatedAt || item.evaluatedAt || item.finalizedAt || item.date);
      const currentTime = text(current?.updatedAt || current?.evaluatedAt || current?.finalizedAt || current?.date);
      if (!current || nextTime >= currentTime) byId.set(id, item);
    });
    return [...byId.values()];
  }
  function proofCounts(items = []) {
    const counts = { WORKED: 0, MIXED: 0, MISSED: 0, INSUFFICIENT_EVIDENCE: 0 };
    items.forEach((item) => {
      const code = upper(item?.code);
      if (Object.prototype.hasOwnProperty.call(counts, code)) counts[code] += 1;
    });
    return counts;
  }
  function sourceUpdatedAt(items = [], fallback = null) {
    return [...(Array.isArray(items) ? items : [])]
      .flatMap((item) => [item?.updatedAt, item?.evaluatedAt, item?.finalizedAt, item?.sealedAt, item?.approvedAt])
      .filter(Boolean)
      .sort()
      .at(-1) || fallback;
  }

  function buildEvidencePacket(input = {}) {
    const inspection = input.inspection || {};
    const weekStart = dateIso(inspectionValue(inspection, "weekStartDate", "week_start_date") || input.activeWeek?.weekStart);
    const weekEnd = dateIso(inspectionValue(inspection, "weekEndDate", "week_end_date") || input.activeWeek?.weekEnd || addDays(weekStart, 6));
    if (!weekStart || !weekEnd) return null;
    const finalizedAt = inspectionValue(inspection, "finalizedAt", "finalized_at");
    const score = finite(inspectionValue(inspection, "score", "weekly_discipline_score"));
    const evidenceCoverage = finite(inspectionValue(inspection, "evidenceCoverage", "evidence_coverage"));
    const proofs = onePerIdentity(input.proofs).filter((item) => inRange(item.effectiveDate, weekStart, weekEnd) && FINAL_PROOF_CODES.has(upper(item.code)));
    const decisions = onePerIdentity(input.decisions).filter((item) => inRange(item.effectiveDate || item.date, weekStart, weekEnd));
    const closeouts = onePerIdentity(input.closeouts).filter((item) => inRange(item.date, weekStart, weekEnd) && upper(item.status) === "SEALED");
    const standards = (Array.isArray(input.standards) ? input.standards : []).filter((item) => {
      const date = dateIso(item.sourceDate || item.occurredAt || item.date || item.createdAt);
      return (!date || inRange(date, weekStart, weekEnd)) && !CLOSED_STANDARD_STATES.has(upper(item.status || "CANDIDATE"));
    });
    const activeWeek = input.activeWeek || null;
    const lineageIssues = [];
    if (activeWeek && (dateIso(activeWeek.weekStart) !== weekStart || dateIso(activeWeek.weekEnd) !== weekEnd)) lineageIssues.push("ACTIVE_WEEK_MISMATCH");
    const contractRevision = Number(activeWeek?.contractRevision || input.contract?.revision || 0);
    const proposedWeek = input.proposedWeek || null;
    if (proposedWeek && contractRevision && Number(proposedWeek.contractRevision || 0) !== contractRevision) lineageIssues.push("CONTRACT_REVISION_MISMATCH");
    const counts = proofCounts(proofs);
    const elapsedDays = Math.max(0, Math.min(7, Number(inspection.elapsedDayCount ?? inspection.counts?.elapsedDays ?? (finalizedAt ? 7 : 0))));
    const assessedDays = Math.max(0, Number(inspection.counts?.assessedDays || 0));
    const unscoredDays = Math.max(0, Number(inspection.counts?.unscoredDays ?? (7 - assessedDays)));
    const status = lineageIssues.length
      ? "BLOCKED"
      : finalizedAt
        ? "RECONCILED"
        : inspection.canFinalize
          ? "READY_TO_FINALIZE"
          : "COLLECTING";
    const fingerprintBasis = {
      version: VERSION,
      weekStart,
      weekEnd,
      finalizedAt: finalizedAt || null,
      score,
      evidenceCoverage,
      inspectionVersion: inspection.calculationVersion || null,
      proofFingerprints: proofs.map((item) => item.fingerprint || item.id).sort(),
      decisions: decisions.map((item) => item.fingerprint || item.id).sort(),
      closeouts: closeouts.map((item) => `${item.date}:r${Number(item.revision || 1)}`).sort(),
      standards: standards.map((item) => item.id || item.code || item.status).sort(),
      activeWeekId: activeWeek?.id || null,
      activeWeekRevision: Number(activeWeek?.revision || 0),
      contractRevision,
      proposedWeekId: proposedWeek?.id || null,
      lineageIssues
    };
    const fingerprint = stableHash(fingerprintBasis);
    return {
      version: VERSION,
      id: `atlas-weekly-reconciliation:${weekStart}:${fingerprint}`,
      fingerprint,
      status,
      weekStart,
      weekEnd,
      finalizedAt: finalizedAt || null,
      score,
      evidenceCoverage: evidenceCoverage === null ? null : Math.round(clamp(evidenceCoverage)),
      elapsedDays,
      assessedDays,
      unscoredDays,
      activeWeekId: activeWeek?.id || null,
      activeWeekRevision: Number(activeWeek?.revision || 0),
      contractId: activeWeek?.contractId || input.contract?.id || null,
      contractRevision,
      programId: activeWeek?.programId || input.programReceipt?.programId || input.programReceipt?.id || null,
      programRevision: Number(activeWeek?.programRevision || input.programReceipt?.programRevision || input.programReceipt?.revision || 0),
      proofCounts: counts,
      proofCount: proofs.length,
      verifiedProofCount: counts.WORKED + counts.MIXED + counts.MISSED,
      decisionCount: decisions.length,
      closeoutCount: closeouts.length,
      openStandardsCount: standards.length,
      strongestDomains: (inspection.strongestDomains || [inspection.strongestDomain || inspectionValue(inspection, "strongestDomain", "strongest_domain")]).filter(Boolean).map(friendlyDomain),
      weakestDomains: (inspection.weakestDomains || [inspection.weakestDomain || inspectionValue(inspection, "weakestDomain", "weakest_domain")]).filter(Boolean).map(friendlyDomain),
      lineage: { consistent: lineageIssues.length === 0, issues: lineageIssues },
      source: {
        inspectionVersion: inspection.calculationVersion || "UNKNOWN",
        inspectionUpdatedAt: finalizedAt || inspection.updatedAt || input.generatedAt || null,
        coachingUpdatedAt: sourceUpdatedAt(proofs, null),
        closeoutUpdatedAt: sourceUpdatedAt(closeouts, null)
      },
      generatedAt: input.generatedAt || new Date().toISOString()
    };
  }

  function resultPosition(packet = {}, options = {}) {
    if (!packet.lineage?.consistent || packet.openStandardsCount > 0) return "BLOCKED";
    if (!packet.finalizedAt) return "PROVISIONAL";
    const minimumEvidence = Number(options.minimumEvidence || 60);
    if (packet.score === null || packet.evidenceCoverage === null || packet.evidenceCoverage < minimumEvidence) return "UNSCORED";
    if (packet.score >= 90 && packet.evidenceCoverage >= 90 && packet.proofCounts.MISSED === 0) return "AHEAD";
    if (packet.score >= 75 && packet.evidenceCoverage >= 75 && packet.proofCounts.MISSED <= Math.max(1, packet.proofCounts.WORKED)) return "ON_TRACK";
    return "SLIPPING";
  }
  function positionDefinition(position = "PROVISIONAL") {
    if (position === "AHEAD") return { tone: "green", headline: "The week moved the campaign forward" };
    if (position === "ON_TRACK") return { tone: "green", headline: "The campaign remains on track" };
    if (position === "SLIPPING") return { tone: "yellow", headline: "The campaign is losing ground" };
    if (position === "BLOCKED") return { tone: "red", headline: "The weekly decision is blocked" };
    if (position === "UNSCORED") return { tone: "neutral", headline: "The week cannot support a verdict" };
    return { tone: "neutral", headline: "The week is still being earned" };
  }
  function workedLine(packet = {}) {
    const strongest = packet.strongestDomains.join(" / ");
    if (packet.proofCounts.WORKED) return `${packet.proofCounts.WORKED} Atlas call${packet.proofCounts.WORKED === 1 ? "" : "s"} worked${strongest ? `; ${strongest} led the week` : ""}.`;
    if (strongest && packet.score !== null) return `${strongest} produced the strongest assessed execution.`;
    return "No coaching win is claimed without finalized proof.";
  }
  function brokeLine(packet = {}) {
    const weakest = packet.weakestDomains.join(" / ");
    if (!packet.lineage?.consistent) return "Program lineage does not match the inspected week.";
    if (packet.openStandardsCount) return `${packet.openStandardsCount} open standards item${packet.openStandardsCount === 1 ? " blocks" : "s block"} the weekly decision.`;
    if (packet.proofCounts.MISSED) {
      const unscored = packet.proofCounts.INSUFFICIENT_EVIDENCE || packet.unscoredDays;
      return `${packet.proofCounts.MISSED} Atlas call${packet.proofCounts.MISSED === 1 ? " missed" : "s missed"}${weakest ? `; ${weakest} needs protection` : ""}.${unscored ? ` ${unscored} result${unscored === 1 ? " is" : "s are"} unscored, not failed.` : ""}`;
    }
    if (packet.proofCounts.INSUFFICIENT_EVIDENCE || packet.unscoredDays) return `${packet.proofCounts.INSUFFICIENT_EVIDENCE || packet.unscoredDays} result${(packet.proofCounts.INSUFFICIENT_EVIDENCE || packet.unscoredDays) === 1 ? " is" : "s are"} unscored, not failed.`;
    return weakest ? `${weakest} was the limiting assessed domain.` : "No verified coaching miss was recorded.";
  }
  function buildVerdict(packet = null, input = {}) {
    if (!packet) return null;
    const position = resultPosition(packet, input);
    const definition = positionDefinition(position);
    const command = input.command || null;
    const proposedWeek = input.proposedWeek || null;
    const targetWeekStart = dateIso(command?.targetWeekStart || addDays(packet.weekEnd, 1));
    const targetMatches = Boolean(targetWeekStart && proposedWeek?.weekStart === targetWeekStart);
    const draftReady = proposedWeek?.status === "DRAFT" && proposedWeek.approvalBlocked !== true && Number(proposedWeek.blockingConflictCount || 0) === 0;
    const alreadyCommitted = proposedWeek?.status === "COMMITTED" && targetMatches;
    const commandReady = ["PROPOSED", "APPROVED", "CURRENT", "HELD"].includes(upper(command?.status));
    const commitReady = Boolean(packet.finalizedAt && !["BLOCKED", "UNSCORED"].includes(position) && commandReady && targetMatches && draftReady);
    const nextLine = command
      ? `${command.headline || "Repeat the coordinated week"}. ${command.priority || command.detail || "Protect the signed Contract."}`
      : packet.finalizedAt
        ? "Build the coordinated next-week draft from this finalized result."
        : "Finalize the week before Atlas changes the program.";
    const action = alreadyCommitted
      ? { code: "COMMITTED", label: "Next week committed", disabled: true }
      : commitReady
        ? { code: "COMMIT_NEXT_WEEK", label: "Commit next week", disabled: false }
        : !packet.finalizedAt
          ? { code: "FINALIZE_FIRST", label: "Finalize week first", disabled: true }
          : position === "BLOCKED"
            ? { code: "RESOLVE_BLOCKER", label: "Resolve weekly blocker", disabled: true }
            : { code: "CALENDAR_REVIEW", label: "Review next-week calendar", disabled: true };
    return {
      version: VERSION,
      status: alreadyCommitted ? "COMMITTED" : packet.status,
      position,
      tone: definition.tone,
      headline: definition.headline,
      worked: workedLine(packet),
      broke: brokeLine(packet),
      next: nextLine,
      targetWeekStart,
      targetWeekEnd: addDays(targetWeekStart, 6),
      commandId: command?.id || null,
      commandCode: command?.code || null,
      commandStatus: command?.status || null,
      proposedWeekId: proposedWeek?.id || null,
      proposedWeekRevision: Number(proposedWeek?.revision || 0),
      proposedWeekBlockers: Number(proposedWeek?.blockingConflictCount || 0),
      commitReady,
      action,
      campaignImpact: position,
      safeguard: "The finalized week stays immutable. Commitment applies only to the coordinated next week."
    };
  }

  function buildReconciliation(input = {}) {
    const packet = buildEvidencePacket(input);
    if (!packet) return null;
    const verdict = buildVerdict(packet, input);
    const fingerprint = stableHash({ packet: packet.fingerprint, verdict });
    const prior = input.prior || null;
    if (prior?.fingerprint === fingerprint) return { ...prior };
    const commitReceipt = verdict.status === "COMMITTED"
      && prior?.commitReceipt?.targetWeekStart === verdict.targetWeekStart
      ? prior.commitReceipt
      : null;
    return {
      version: VERSION,
      id: `atlas-weekly-result:${packet.weekStart}:${fingerprint}`,
      fingerprint,
      status: verdict.status,
      weekStart: packet.weekStart,
      weekEnd: packet.weekEnd,
      finalizedAt: packet.finalizedAt,
      packet,
      verdict,
      ...(commitReceipt ? { commitReceipt } : {}),
      updatedAt: input.generatedAt || new Date().toISOString()
    };
  }

  function attachCommit(reconciliation = {}, committedWeek = {}, committedAt = new Date().toISOString()) {
    if (!reconciliation?.verdict?.commitReady) throw new Error("The reconciled week is not ready to commit.");
    if (committedWeek?.status !== "COMMITTED") throw new Error("The next week was not committed.");
    if (dateIso(committedWeek.weekStart) !== dateIso(reconciliation.verdict.targetWeekStart)) throw new Error("The committed calendar targets a different week.");
    const receipt = {
      id: `atlas-weekly-commit:${reconciliation.weekStart}:${committedWeek.weekStart}:r${Number(committedWeek.revision || 1)}`,
      reconciliationId: reconciliation.id,
      sourceWeekStart: reconciliation.weekStart,
      targetWeekStart: committedWeek.weekStart,
      targetWeekId: committedWeek.id || null,
      targetWeekRevision: Number(committedWeek.revision || 0),
      contractRevision: Number(committedWeek.contractRevision || reconciliation.packet?.contractRevision || 0),
      committedAt
    };
    return {
      ...reconciliation,
      status: "COMMITTED",
      verdict: {
        ...reconciliation.verdict,
        status: "COMMITTED",
        commitReady: false,
        action: { code: "COMMITTED", label: "Next week committed", disabled: true }
      },
      commitReceipt: receipt,
      updatedAt: committedAt
    };
  }

  function upsertHistory(history = [], record = null, limit = 52) {
    if (!record?.id) return Array.isArray(history) ? [...history] : [];
    return [record, ...(Array.isArray(history) ? history : []).filter((item) => item?.weekStart !== record.weekStart && item?.id !== record.id)]
      .sort((left, right) => text(right.weekStart).localeCompare(text(left.weekStart)))
      .slice(0, Math.max(1, Number(limit || 52)));
  }
  function summarize(history = [], limit = 12) {
    const records = onePerIdentity(history).filter((item) => item?.finalizedAt).sort((left, right) => text(right.weekStart).localeCompare(text(left.weekStart))).slice(0, limit);
    const counts = { AHEAD: 0, ON_TRACK: 0, SLIPPING: 0, BLOCKED: 0, UNSCORED: 0 };
    records.forEach((item) => {
      const code = upper(item.verdict?.position || "UNSCORED");
      if (Object.prototype.hasOwnProperty.call(counts, code)) counts[code] += 1;
    });
    return { version: VERSION, weeks: records.length, counts, latest: records[0] || null };
  }

  return Object.freeze({
    VERSION,
    dateIso,
    addDays,
    stableHash,
    buildEvidencePacket,
    resultPosition,
    buildVerdict,
    buildReconciliation,
    attachCommit,
    upsertHistory,
    summarize
  });
});
