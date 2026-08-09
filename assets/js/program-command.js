(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionProgramCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "024C.1";
  const MODULES = Object.freeze([
    { id: "strength", label: "Strength" },
    { id: "running", label: "Cardio" },
    { id: "core", label: "Core" },
    { id: "nutrition", label: "Fuel" }
  ]);

  const GOAL_LABELS = Object.freeze({
    FAT_LOSS: "Lose fat",
    MUSCLE_GAIN: "Build muscle",
    STRENGTH: "Build strength",
    RUNNING_PERFORMANCE: "Run stronger",
    BALANCED_FITNESS: "Build complete fitness"
  });

  function upper(value) {
    return String(value || "").trim().toUpperCase();
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function planStatus(plan, contract) {
    if (!plan) return "MISSING";
    if (upper(plan.status) !== "APPROVED") return "DRAFT";
    if (contract?.id && plan.recruitContractId && plan.recruitContractId !== contract.id) return "OUTDATED";
    if (contract?.revision && plan.recruitContractRevision && number(plan.recruitContractRevision) !== number(contract.revision)) return "OUTDATED";
    return "APPROVED";
  }

  function moduleCounts(week = {}) {
    const counts = { strength: 0, running: 0, core: 0, nutrition: 0 };
    (week.days || []).forEach((day) => {
      (day.activities || []).forEach((activity) => {
        const key = upper(activity.module).toLowerCase();
        if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
      });
      if (day.nutrition) counts.nutrition += 1;
    });
    return counts;
  }

  function summarizeWeek(week = {}) {
    const days = Array.isArray(week.days) ? week.days : [];
    const activeDays = days.filter((day) => (day.activities || []).length > 0);
    const trainingWindows = activeDays.reduce((total, day) => total + (day.twoADay ? 2 : 1), 0);
    const estimatedMinutes = days.reduce((total, day) => total + number(day.estimatedMinutes), 0);
    const recoveryDays = number(week.recoveryDays) || days.filter((day) => day.isRecoveryDay).length;
    const twoADays = number(week.twoADayCount) || days.filter((day) => day.twoADay).length;
    const blockers = (week.conflicts || []).filter((item) => upper(item.severity) === "BLOCKING");
    return {
      trainingDays: number(week.trainingDays) || activeDays.length,
      trainingWindows,
      estimatedMinutes,
      recoveryDays,
      twoADays,
      blockers,
      longRunUncapped: days.some((day) => day.longRunUncapped)
    };
  }

  function blockerAction(input, weekSummary) {
    const contract = input.contract;
    const truth = input.truth || {};
    const audit = input.receiptAudit || {};
    const receipt = input.receipt || null;
    if (!contract) {
      return { status: "SETUP_REQUIRED", tone: "gold", title: "Set your standard", detail: "Name the outcome and the commitment Atlas will build around.", label: "Build Contract", section: "contract" };
    }
    if (audit.status === "REPAIR_REQUIRED") {
      return { status: "REPAIR_REQUIRED", tone: "red", title: "Repair the program link", detail: audit.issues?.[0]?.detail || "A saved plan no longer matches the active Contract.", label: "Repair Program", section: "contract" };
    }
    if (weekSummary.blockers.length) {
      const blocker = weekSummary.blockers[0];
      return { status: "BLOCKED", tone: "red", title: "Clear the calendar blocker", detail: blocker.detail || "The active week cannot execute as written.", label: "Open Calendar", section: "calendar" };
    }
    const contradiction = (truth.contradictions || []).find((item) => upper(item.severity) === "BLOCKING")
      || (truth.contradictions || []).find((item) => upper(item.severity) === "WARNING");
    if (contradiction) {
      return { status: "BLOCKED", tone: upper(contradiction.severity) === "BLOCKING" ? "red" : "gold", title: "Reconcile the program", detail: contradiction.message || contradiction.repair, label: "Review Program", section: contradiction.section || "contract" };
    }
    if (!receipt || upper(receipt.status) !== "ACTIVE") {
      return { status: "ACTIVATION_REQUIRED", tone: "gold", title: "Activate the program", detail: "Approve the plans and coordinated week as one program.", label: "Activate Program", section: "contract" };
    }
    if (!input.week) {
      return { status: "WEEK_REQUIRED", tone: "gold", title: "Build the operating week", detail: "The approved program needs a committed calendar.", label: "Open Calendar", section: "calendar" };
    }
    return {
      status: "ACTIVE",
      tone: "green",
      title: truth.title || "Execute today’s order",
      detail: truth.detail || "Your Contract, plans, and calendar agree.",
      label: truth.action?.label || "Open Today",
      section: truth.action?.section || "today",
      module: truth.action?.module || null
    };
  }

  function moduleSummary(id, count, contract = {}, plan = null) {
    const status = planStatus(plan, contract);
    if (id === "strength") return `${count || number(contract.strengthDaysPerWeek)} session${(count || number(contract.strengthDaysPerWeek)) === 1 ? "" : "s"}`;
    if (id === "running") return `${count || number(contract.runningDaysPerWeek)} session${(count || number(contract.runningDaysPerWeek)) === 1 ? "" : "s"}`;
    if (id === "core") return `${count || number(contract.coreDaysPerWeek)} session${(count || number(contract.coreDaysPerWeek)) === 1 ? "" : "s"}`;
    const commitment = upper(contract.nutritionCommitment).replaceAll("_", " ");
    return count ? `${count} daily targets` : commitment || (status === "APPROVED" ? "Targets active" : "Plan needed");
  }

  function rationale(input, weekSummary) {
    const contract = input.contract || {};
    const reasons = [];
    if (contract.primaryGoal) reasons.push(`${GOAL_LABELS[upper(contract.primaryGoal)] || String(contract.primaryGoal).replaceAll("_", " ")} sets the training and Fuel bias.`);
    if (contract.twoADays) reasons.push(`${weekSummary.twoADays} Two-a-Day window${weekSummary.twoADays === 1 ? "" : "s"}; Core is paired when the first window stays within 120 minutes.`);
    else reasons.push(`${contract.trainingDaysPerWeek || weekSummary.trainingDays || 0} training days preserve ${weekSummary.recoveryDays} recovery day${weekSummary.recoveryDays === 1 ? "" : "s"}.`);
    if (weekSummary.longRunUncapped) reasons.push("Long-run duration remains uncapped; the companion window stays protected.");
    else reasons.push(`${weekSummary.estimatedMinutes} planned minutes fit the signed weekly capacity.`);
    return reasons.slice(0, 3);
  }

  function buildProgramCommand(input = {}) {
    const contract = input.contract || null;
    const weekSummary = summarizeWeek(input.week || {});
    const counts = moduleCounts(input.week || {});
    const plans = input.plans || {};
    const next = blockerAction(input, weekSummary);
    const weekAutopilot = input.weekAutopilot || null;
    return {
      version: VERSION,
      status: next.status,
      tone: next.tone,
      goal: {
        label: contract ? (GOAL_LABELS[upper(contract.primaryGoal)] || String(contract.primaryGoal || "Primary outcome").replaceAll("_", " ")) : "No Contract yet",
        target: contract?.target || "Define the result you are pursuing.",
        targetDate: contract?.targetDate || null,
        revision: number(contract?.revision),
        effectiveDate: contract?.effectiveDate || null
      },
      next,
      week: { ...weekSummary, start: input.week?.weekStart || input.receipt?.weekStart || null, end: input.week?.weekEnd || null },
      modules: MODULES.map((module) => ({
        ...module,
        count: counts[module.id],
        status: planStatus(plans[module.id], contract),
        summary: moduleSummary(module.id, counts[module.id], contract || {}, plans[module.id])
      })),
      autopilot: weekAutopilot ? {
        status: weekAutopilot.status || "CHECKING",
        tone: weekAutopilot.tone || "neutral",
        headline: weekAutopilot.headline || "Atlas is preparing next week",
        detail: weekAutopilot.detail || "The active program will roll forward unless something material changes.",
        targetWeekStart: weekAutopilot.targetWeekStart || null,
        action: weekAutopilot.action || "OPEN_CALENDAR"
      } : null,
      rationale: rationale(input, weekSummary),
      safeguard: input.week ? "Current week stays protected until you approve a change." : "No change is applied from this page."
    };
  }

  function previewChange(model = {}, request = {}) {
    const type = upper(request.type || "SCHEDULE");
    const definitions = {
      GOAL: { title: "Change the outcome", modules: ["Strength", "Cardio", "Core", "Fuel"], route: "contract", label: "Amend Contract", signature: true, timing: "Next coordinated week" },
      CAPACITY: { title: "Change training capacity", modules: ["Strength", "Cardio", "Core", "Fuel", "Calendar"], route: "contract", label: "Amend Contract", signature: true, timing: "Next coordinated week" },
      TRAINING_MIX: { title: "Change the training mix", modules: ["Strength", "Cardio", "Core", "Fuel", "Calendar"], route: "contract", label: "Amend Contract", signature: true, timing: "Next coordinated week" },
      SCHEDULE: { title: "Move this week’s work", modules: ["Calendar"], route: "calendar", label: "Edit Calendar", signature: false, timing: "After conflict checks pass" }
    };
    const definition = definitions[type] || definitions.SCHEDULE;
    return {
      ...definition,
      type,
      note: String(request.note || "").trim().slice(0, 240),
      currentWeekProtected: true,
      message: definition.signature
        ? `Atlas will rebuild ${definition.modules.join(", ")} from the amended Contract. Nothing changes until you sign and activate it.`
        : "The Contract stays in force. Calendar guardrails must pass before the week changes.",
      programStatus: model.status || "UNKNOWN"
    };
  }

  return Object.freeze({ VERSION, MODULES, summarizeWeek, buildProgramCommand, previewChange });
});
