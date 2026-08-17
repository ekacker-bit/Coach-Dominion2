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

  function buildDailyExecutionQueue(input = {}) {
    const ordersAction = input.ordersAction || "approve_orders";
    const recoveryRequiresApproval = Boolean(input.recoveryRequired && !input.recoveryApproved);
    const definitions = [
      {
        id: "roll_call",
        label: "Establish readiness",
        detail: input.readinessComplete ? "Today’s Energy, Soreness, and Pain are current." : "Complete Morning Roll Call before the plan can be authorized.",
        complete: Boolean(input.readinessComplete),
        action: "roll_call",
        actionLabel: "Complete Roll Call"
      },
      {
        id: "orders",
        label: "Authorize today’s plan",
        detail: input.ordersApproved ? "Training and recovery constraints are approved." : recoveryRequiresApproval ? "Review the recovery adjustment before authorizing today’s plan." : "Approve the plan generated from today’s readiness and evidence.",
        complete: Boolean(input.ordersApproved),
        blockedBy: input.readinessComplete ? null : "Complete Roll Call first.",
        action: recoveryRequiresApproval ? "review_recovery" : ordersAction,
        actionLabel: recoveryRequiresApproval ? "Review recovery plan" : ordersAction === "review_programming" ? "Review programming" : "Approve today’s plan"
      },
      {
        id: "training",
        label: input.recoveryOnly ? "Honor the recovery-only order" : "Execute training",
        detail: input.recoveryOnly ? "Loaded work is removed; protecting the recovery window completes this step." : input.trainingComplete ? "Today’s workout evidence is complete." : input.trainingStarted ? "Workout is in progress. Complete the remaining work sets." : "Start the approved workout and capture completion evidence.",
        complete: Boolean(input.trainingComplete || input.recoveryOnly),
        blockedBy: input.ordersApproved ? null : "Authorize today’s plan first.",
        action: input.recoveryOnly ? "complete_recovery" : "start_training",
        actionLabel: input.trainingStarted ? "Continue workout" : input.recoveryOnly ? "Confirm recovery-only day" : "Start workout"
      },
      {
        id: "fueling",
        label: "Complete today’s fueling",
        detail: input.fuelingComplete ? "Current nutrition evidence is available against an approved baseline." : input.fuelingBaseline ? "Log today’s intake so Atlas can evaluate calories, protein, and timing." : "Approve a fueling baseline before today’s intake can be evaluated.",
        complete: Boolean(input.fuelingComplete),
        blockedBy: input.ordersApproved ? null : "Authorize today’s plan first.",
        action: "open_fuel",
        actionLabel: input.fuelingBaseline ? "Log today’s fueling" : "Set fueling targets"
      },
      {
        id: "recovery",
        label: "Complete the recovery action",
        detail: input.recoveryComplete ? "Today’s recovery commitment is recorded." : recoveryRequiresApproval ? "Approve the prescribed recovery plan, then confirm completion." : "Complete the recovery action prescribed for today.",
        complete: Boolean(input.recoveryComplete),
        blockedBy: recoveryRequiresApproval ? "Recovery plan approval is required." : input.ordersApproved ? null : "Authorize today’s plan first.",
        action: recoveryRequiresApproval ? "review_recovery" : "complete_recovery",
        actionLabel: recoveryRequiresApproval ? "Review recovery plan" : "Mark recovery complete"
      },
      {
        id: "record",
        label: "Complete the Daily Record",
        detail: input.recordComplete ? "Today’s execution record is saved." : "Review the day and preserve the evidence used by Weekly Review.",
        complete: Boolean(input.recordComplete),
        blockedBy: null,
        action: "review_record",
        actionLabel: "Complete Dominion Record"
      },
      {
        id: "closeout",
        label: "Close the day",
        detail: input.closeoutComplete ? "Final steps and discipline evidence are sealed." : "Add final steps and the private discipline evidence you choose to report.",
        complete: Boolean(input.closeoutComplete),
        blockedBy: null,
        action: "open_closeout",
        actionLabel: input.closeoutComplete ? "Review Closeout" : "Complete Daily Closeout"
      }
    ];

    let priorIncomplete = false;
    const steps = definitions.map((step) => {
      const sequenceBlocked = priorIncomplete && !step.complete;
      const status = step.complete ? "COMPLETE" : step.blockedBy || sequenceBlocked ? "BLOCKED" : "CURRENT";
      if (!step.complete) priorIncomplete = true;
      return {
        ...step,
        status,
        blockedBy: step.blockedBy || (sequenceBlocked ? "Complete the current step first." : null)
      };
    });
    const completed = steps.filter((step) => step.complete).length;
    const current = steps.find((step) => step.status === "CURRENT")
      || steps.find((step) => !step.complete && step.blockedBy && step.action)
      || null;
    const closeoutReady = steps.filter((step) => step.id !== "closeout").every((step) => step.complete);
    return {
      date: input.date || null,
      steps,
      current,
      completed,
      total: steps.length,
      percent: Math.round(completed / steps.length * 100),
      complete: completed === steps.length,
      closeoutReady,
      closeoutComplete: Boolean(input.closeoutComplete),
      state: completed === steps.length ? "DAY COMPLETE" : `${completed}/${steps.length} COMPLETE`
    };
  }

  return Object.freeze({ buildDailyCoachingLoop, buildDailyExecutionQueue, formatApprovedOrders });
});
