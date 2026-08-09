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

  function buildAutopilot(input = {}) {
    const target = targetWeekStart(input);
    const contract = input.contract || null;
    const receipt = input.receipt || null;
    const plans = input.plans || {};
    const futureWeek = input.futureWeek?.weekStart === target ? input.futureWeek : null;
    const candidate = input.draft?.weekStart === target ? input.draft : null;

    if (!contract || !receiptMatchesContract(receipt, contract)) {
      return { version: VERSION, status: "ACTIVATION_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Activate the complete program", detail: "Atlas needs one active Contract-linked program before weekly autopilot can begin.", action: "OPEN_PROGRAM" };
    }
    if (!activePlansMatchReceipt(plans, receipt)) {
      return { version: VERSION, status: "REVIEW_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Review a program change", detail: "At least one active plan changed after the last complete-program activation.", action: "REVIEW_PROGRAM" };
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
      return { version: VERSION, status: "COMMITTED", tone: "green", targetWeekStart: target, headline: "Next week is ready", detail: "Atlas carried the active program into a committed executable week.", weekId: futureWeek.id || null, action: "OPEN_CALENDAR" };
    }
    if (!candidate) return { version: VERSION, status: "BUILD_READY", tone: "neutral", targetWeekStart: target, headline: "Preparing next week", detail: "Atlas is coordinating the active program into the next operating week.", action: "BUILD" };
    if (!weekMatchesReceipt(candidate, receipt, contract)) return { version: VERSION, status: "REVIEW_REQUIRED", tone: "gold", targetWeekStart: target, headline: "Review next week", detail: "The proposed week does not use the exact active program.", action: "OPEN_CALENDAR" };
    return { version: VERSION, status: "READY_TO_COMMIT", tone: "green", targetWeekStart: target, headline: "Next week is ready to roll", detail: "No material program change was found. Atlas can commit the week automatically.", action: "AUTO_COMMIT" };
  }

  function canAutoCommit(model = null, context = {}) {
    return Boolean(model?.status === "READY_TO_COMMIT"
      && model.targetWeekStart
      && context.draft?.weekStart === model.targetWeekStart
      && !context.draft?.approvalBlocked
      && !hasManualEdits(context.draft)
      && weekMatchesReceipt(context.draft, context.receipt, context.contract));
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
      detail: "Unchanged active program rolled forward automatically."
    };
  }

  return Object.freeze({ VERSION, PLAN_REFS, addDays, weekStartIso, targetWeekStart, receiptMatchesContract, activePlansMatchReceipt, weekMatchesReceipt, blockingConflicts, hasManualEdits, buildAutopilot, canAutoCommit, buildCommitReceipt });
});
