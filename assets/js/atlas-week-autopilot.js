(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasWeekAutopilot = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "024N.1";
  const PLAN_REFS = Object.freeze({
    strength: "strengthPlanId",
    running: "runningBlockId",
    core: "corePlanId",
    nutrition: "nutritionBaselineId"
  });

  function date(value) {
    const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function addDays(value, count) {
    const source = date(value);
    if (!source) return null;
    const next = new Date(`${source}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + Number(count || 0));
    return next.toISOString().slice(0, 10);
  }

  function weekStartIso(value) {
    const source = date(value);
    if (!source) return null;
    const current = new Date(`${source}T12:00:00Z`);
    current.setUTCDate(current.getUTCDate() - ((current.getUTCDay() + 6) % 7));
    return current.toISOString().slice(0, 10);
  }

  function planRef(moduleId, plan = null) {
    if (!plan) return null;
    if (moduleId === "nutrition") return plan.id || plan.approvedAt || null;
    return plan.id || null;
  }

  function targetWeekStart(input = {}) {
    return input.activeWeek?.weekStart
      ? addDays(input.activeWeek.weekStart, 7)
      : weekStartIso(input.today || new Date().toISOString());
  }

  function receiptMatchesContract(receipt = null, contract = null) {
    return Boolean(receipt?.status === "ACTIVE" && contract?.id
      && receipt.contractId === contract.id
      && Number(receipt.contractRevision || 0) === Number(contract.revision || 0));
  }

  function activePlansMatchReceipt(plans = {}, receipt = null) {
    if (!receipt?.planRefs) return false;
    return Object.keys(PLAN_REFS).every((moduleId) => {
      const expected = receipt.planRefs[moduleId] || null;
      return !expected || planRef(moduleId, plans[moduleId]) === expected;
    });
  }

  function weekMatchesReceipt(week = null, receipt = null, contract = null) {
    if (!week || !receiptMatchesContract(receipt, contract)) return false;
    if (week.contractId !== contract.id || Number(week.contractRevision || 0) !== Number(contract.revision || 0)) return false;
    return Object.entries(PLAN_REFS).every(([moduleId, sourceKey]) => {
      const expected = receipt.planRefs?.[moduleId] || null;
      return !expected || week.sourceRefs?.[sourceKey] === expected;
    });
  }

  function blockingConflicts(week = null) {
    return (week?.conflicts || []).filter((item) => String(item?.severity || "").toUpperCase() === "BLOCKING");
  }

  function hasManualEdits(week = null) {
    return Boolean(week?.calendarEdited || (week?.days || []).some((day) => (day.activities || []).some((item) => item.calendarEdited)));
  }

  function adaptationForTarget(adaptation = null, targetWeekStart = null) {
    return adaptation?.scope === "WEEK" && adaptation.targetWeekStart === targetWeekStart ? adaptation : null;
  }

  function weekMatchesAdaptation(week = null, adaptation = null) {
    if (!week || !adaptation || adaptation.status !== "APPROVED") return false;
    return week.atlasAdaptiveWeek?.decisionId === adaptation.id
      && week.atlasAdaptiveWeek?.fingerprint === adaptation.fingerprint;
  }

  function buildAutopilot(input = {}) {
    const target = targetWeekStart(input);
    const contract = input.contract || null;
    const receipt = input.receipt || null;
    const plans = input.plans || {};
    let futureWeek = input.futureWeek?.weekStart === target ? input.futureWeek : null;
    const candidate = input.draft?.weekStart === target ? input.draft : null;

    if (!contract || !receiptMatchesContract(receipt, contract)) {
      return { version: VERSION, status: "ACTIVATION_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Activate the complete program", detail: "Atlas needs one active Contract-linked program before weekly autopilot can begin.", action: "OPEN_PROGRAM" };
    }
    if (!activePlansMatchReceipt(plans, receipt)) {
      return { version: VERSION, status: "REVIEW_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Review a program change", detail: "At least one active plan changed after the last complete-program activation.", action: "REVIEW_PROGRAM" };
    }
    const adaptation = adaptationForTarget(input.adaptation, target);
    if (adaptation?.status === "MONITORING") {
      return {
        version: VERSION,
        status: "MONITORING",
        tone: "neutral",
        targetWeekStart: target,
        headline: adaptation.headline || "Atlas is reading the week",
        detail: futureWeek
          ? "The saved next week stays protected while Atlas finishes the current evidence review."
          : adaptation.detail || "Atlas is collecting execution and recovery evidence before preparing next week.",
        action: "OPEN_PROGRAM"
      };
    }
    if (adaptation?.status === "PROPOSED") {
      return {
        version: VERSION,
        status: "ADAPTATION_REVIEW",
        tone: ["PROTECT", "DELOAD"].includes(adaptation.code) ? "red" : "gold",
        targetWeekStart: target,
        headline: adaptation.headline || adaptation.label || "Review next week's coaching call",
        detail: adaptation.detail || adaptation.reason || "Atlas found a material change that requires recruit approval.",
        adaptationId: adaptation.id,
        action: "REVIEW_ADAPTATION"
      };
    }
    if (adaptation?.status === "APPROVED" && futureWeek && !weekMatchesAdaptation(futureWeek, adaptation)) {
      futureWeek = null;
    }
    if (adaptation?.status === "APPROVED" && candidate && !weekMatchesAdaptation(candidate, adaptation)) {
      if (hasManualEdits(candidate)) {
        return { version: VERSION, status: "REVIEW_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Resolve your calendar edits", detail: "Atlas will not overwrite a manually edited week with an adaptive draft.", action: "OPEN_CALENDAR" };
      }
      return {
        version: VERSION,
        status: "BUILD_READY",
        tone: "green",
        targetWeekStart: target,
        headline: "Applying the approved coaching call",
        detail: "Atlas is rebuilding next week with the approved bounded changes.",
        adaptationId: adaptation.id,
        action: "BUILD_ADAPTED"
      };
    }
    if (candidate) {
      const candidateBlockers = blockingConflicts(candidate);
      if (candidateBlockers.length || candidate.approvalBlocked) return { version: VERSION, status: "BLOCKED", tone: "red", targetWeekStart: target, headline: "Next week needs one fix", detail: candidateBlockers[0]?.detail || "A calendar blocker prevents automatic commitment.", blockers: candidateBlockers, action: "OPEN_CALENDAR" };
      if (hasManualEdits(candidate)) return { version: VERSION, status: "REVIEW_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Approve your calendar edits", detail: "Atlas will not automatically commit a manually edited week.", action: "OPEN_CALENDAR" };
    }
    if (futureWeek) {
      const blockers = blockingConflicts(futureWeek);
      if (blockers.length) return { version: VERSION, status: "BLOCKED", tone: "red", targetWeekStart: target, headline: "Next week needs one fix", detail: blockers[0].detail || "A calendar blocker prevents execution.", blockers, action: "OPEN_CALENDAR" };
      if (!weekMatchesReceipt(futureWeek, receipt, contract)) return { version: VERSION, status: "REVIEW_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Review next week", detail: "The saved week does not use the exact active program.", action: "OPEN_CALENDAR" };
      return { version: VERSION, status: "COMMITTED", tone: "green", targetWeekStart: target, headline: adaptation?.status === "APPROVED" ? "Adapted week is ready" : "Next week is ready", detail: adaptation?.status === "APPROVED" ? "The recruit-approved coaching call is committed without changing the active week." : "Atlas carried the active program into a committed executable week.", weekId: futureWeek.id || null, adaptationId: adaptation?.id || null, action: "OPEN_CALENDAR" };
    }
    if (!candidate) return { version: VERSION, status: "BUILD_READY", tone: "neutral", targetWeekStart: target, headline: "Preparing next week", detail: "Atlas is coordinating the active program into the next operating week.", action: "BUILD" };
    if (!weekMatchesReceipt(candidate, receipt, contract)) return { version: VERSION, status: "REVIEW_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Review next week", detail: "The proposed week does not use the exact active program.", action: "OPEN_CALENDAR" };
    return { version: VERSION, status: "READY_TO_COMMIT", tone: "green", targetWeekStart: target, headline: adaptation?.status === "APPROVED" ? "Approved changes are ready" : "Next week is ready to roll", detail: adaptation?.status === "APPROVED" ? "The bounded Atlas adjustment is applied and can be committed." : "No material program change was found. Atlas can commit the week automatically.", adaptationId: adaptation?.id || null, action: "AUTO_COMMIT" };
  }

  function canAutoCommit(model = null, context = {}) {
    return Boolean(model?.status === "READY_TO_COMMIT"
      && model.targetWeekStart
      && context.draft?.weekStart === model.targetWeekStart
      && !context.draft?.approvalBlocked
      && !hasManualEdits(context.draft)
      && weekMatchesReceipt(context.draft, context.receipt, context.contract)
      && (!context.adaptation || context.adaptation.status !== "APPROVED" || weekMatchesAdaptation(context.draft, context.adaptation)));
  }

  function buildCommitReceipt(model = {}, week = {}, options = {}) {
    const committedAt = options.committedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `atlas-week-autopilot:${week.id || model.targetWeekStart}:${committedAt}`,
      status: "AUTO_COMMITTED",
      committedAt,
      weekStart: week.weekStart || model.targetWeekStart || null,
      contractId: week.contractId || options.contractId || null,
      contractRevision: Number(week.contractRevision || options.contractRevision || 0),
      sourceRefs: { ...(week.sourceRefs || {}) },
      adaptationId: options.adaptation?.id || null,
      adaptationCode: options.adaptation?.decision || options.adaptation?.code || null,
      detail: options.adaptation?.status === "APPROVED"
        ? "Recruit-approved Atlas changes committed for the next week."
        : "Unchanged active program rolled forward automatically."
    };
  }

  return Object.freeze({ VERSION, PLAN_REFS, addDays, weekStartIso, targetWeekStart, receiptMatchesContract, activePlansMatchReceipt, weekMatchesReceipt, blockingConflicts, hasManualEdits, adaptationForTarget, weekMatchesAdaptation, buildAutopilot, canAutoCommit, buildCommitReceipt });
});
