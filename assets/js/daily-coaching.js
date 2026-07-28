(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionDailyCoaching = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function phase(code, label, state, detail) {
    return { code, label, state, detail };
  }

  function buildDailyCoachingLoop(input = {}) {
    const readiness = input.readiness || {};
    const mission = input.mission || {};
    const recovery = input.recovery || {};
    const programming = input.programming || {};
    const evidence = input.evidence || {};
    const compliance = input.compliance || {};
    const readinessState = readiness.state || null;
    const pain = readiness.pain === true;
    const recoveryApproved = Boolean(input.recoveryApproved);
    const programmingApproved = Boolean(input.programmingApproved);
    const ordersApproved = Boolean(input.ordersApproved);
    const hasTraining = Number(evidence.trainingRecords || 0) > 0;
    const hasNutrition = Number(evidence.nutritionRecords || 0) > 0;
    const recordSaved = Boolean(compliance.saved);

    let posture = "ROLL CALL REQUIRED";
    let priority = "REQUIRED";
    let headline = "Complete Morning Roll Call";
    let directive = "Submit Energy, Soreness, and Pain before Atlas authorizes today’s work.";
    let nextAction = "roll_call";
    let approvalRequired = false;

    if (readinessState) {
      posture = "EXECUTE";
      priority = "NORMAL";
      headline = mission.title || "Execute today’s mission";
      directive = mission.detail || readiness.instruction || "Execute the approved mission exactly.";
      nextAction = "approve_orders";
      approvalRequired = !ordersApproved;
    }

    if (pain || readinessState === "RED" || recovery.status === "PROTECT / RECOVER") {
      posture = "PROTECT / RECOVER";
      priority = "CRITICAL";
      headline = "Recovery protocol governs";
      directive = "Hard training is denied. Follow the pain-modified recovery mission and preserve the next recovery window.";
      nextAction = recoveryApproved ? "review_record" : "review_recovery";
      approvalRequired = !recoveryApproved;
    } else if (recovery.holdProgression) {
      posture = "HOLD & RECOVER";
      priority = "HIGH";
      headline = recovery.status || "Recovery adjustment required";
      directive = (recovery.actions || []).join(" ") || "Hold progression until readiness and fueling recover.";
      nextAction = recoveryApproved ? "approve_orders" : "review_recovery";
      approvalRequired = !recoveryApproved || !ordersApproved;
    } else if (programming.requiresConfirmation && !programmingApproved) {
      posture = "REVIEW PROGRAMMING";
      priority = "MODERATE";
      headline = "Next-session adjustment awaits approval";
      directive = "Review the evidence-based programming draft. No load or volume change will occur without approval.";
      nextAction = "review_programming";
      approvalRequired = true;
    } else if (readinessState && ordersApproved && (hasTraining || hasNutrition) && !recordSaved) {
      posture = "REVIEW & RECORD";
      priority = "NORMAL";
      headline = "Connected evidence is ready";
      directive = "Review the imported training and nutrition evidence, then complete today’s Dominion Record.";
      nextAction = "review_record";
      approvalRequired = false;
    } else if (readinessState && ordersApproved && recordSaved) {
      posture = "DAY CONTROLLED";
      priority = "NORMAL";
      headline = "Today’s loop is current";
      directive = "Continue the approved mission. Refresh evidence after training or fueling changes.";
      nextAction = "refresh";
      approvalRequired = false;
    }

    const phases = [
      phase("roll_call", "Roll Call", readinessState ? "COMPLETE" : "CURRENT", readinessState ? `${readinessState} readiness` : "Required"),
      phase("mission", "Orders", readinessState ? (ordersApproved ? "APPROVED" : "CURRENT") : "LOCKED", readinessState ? (ordersApproved ? "Approved locally" : "Awaiting approval") : "Awaiting roll call"),
      phase("evidence", "Evidence", hasTraining || hasNutrition ? "AVAILABLE" : "PENDING", `${evidence.trainingRecords || 0} training · ${evidence.nutritionRecords || 0} nutrition`),
      phase("record", "Record", recordSaved ? "SAVED" : "PENDING", recordSaved ? "Dominion Record current" : "End-of-day review")
    ];

    return {
      generatedAt: input.generatedAt || new Date().toISOString(),
      posture,
      priority,
      headline,
      directive,
      nextAction,
      approvalRequired,
      ordersApproved,
      phases,
      evidence: {
        trainingRecords: Number(evidence.trainingRecords || 0),
        nutritionRecords: Number(evidence.nutritionRecords || 0),
        trainingVolume: Number(evidence.trainingVolume || 0),
        calorieCoverage: recovery.calorieCoverage ?? null,
        proteinCoverage: recovery.proteinCoverage ?? null
      },
      safeguards: {
        painOverride: pain,
        progressionHeld: Boolean(recovery.holdProgression),
        programmingApprovalRequired: Boolean(programming.requiresConfirmation && !programmingApproved),
        missionMutationAllowed: false
      }
    };
  }

  function formatApprovedOrders(loop = {}) {
    return `${loop.headline}. ${loop.directive}`.trim();
  }

  return Object.freeze({ buildDailyCoachingLoop, formatApprovedOrders });
});
