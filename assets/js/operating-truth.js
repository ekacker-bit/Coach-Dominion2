(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionOperatingTruth = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025H.1";
  const STAGES = Object.freeze([
    { id: "contract", label: "Contract" },
    { id: "plans", label: "Plans" },
    { id: "week", label: "Week" },
    { id: "today", label: "Today" },
    { id: "evidence", label: "Evidence" },
    { id: "review", label: "Review" }
  ]);
  const TERMINAL_EXECUTION = new Set(["COMPLETE", "COMPLETED"]);
  const ACTIVE_EXECUTION = new Set(["IN_PROGRESS", "PAUSED", "REVIEW", "PARTIAL"]);
  const PROTECTIVE_EXECUTION = new Set(["PAIN_HOLD", "SAFETY_HOLD", "RECOVERY_ONLY"]);

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function whole(value = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
  }

  function moduleTruth(input = {}) {
    const execution = upper(input.executionState);
    const evidenceCount = whole(input.evidenceCount);
    const scheduled = Boolean(input.scheduled);
    const protectedDay = Boolean(input.protected) || PROTECTIVE_EXECUTION.has(execution);
    const hasTerminalExecution = Boolean(input.terminal) || TERMINAL_EXECUTION.has(execution);
    const verified = Boolean(input.verified) || evidenceCount > 0;
    const observed = hasTerminalExecution || ACTIVE_EXECUTION.has(execution) || verified;
    let status = "NOT_SCHEDULED";
    let detail = input.unscheduledDetail || "Not assigned by the committed week.";
    let complete = false;

    if (protectedDay) {
      status = "SAFETY_HOLD";
      detail = input.detail || "Recovery protection overrides progression.";
    } else if (!scheduled && observed) {
      status = "RECORDED";
      detail = "Work is recorded, but it was not assigned by the committed week.";
    } else if (scheduled && hasTerminalExecution && verified) {
      status = "COMPLETE";
      detail = input.detail || "Execution and evidence agree.";
      complete = true;
    } else if (scheduled && hasTerminalExecution && !verified) {
      status = "VERIFY";
      detail = "Execution was marked complete; attach or reconcile evidence.";
    } else if (scheduled && (ACTIVE_EXECUTION.has(execution) || verified)) {
      status = "IN_PROGRESS";
      detail = verified
        ? "Evidence exists; finish the execution record."
        : input.detail || "Execution is underway.";
    } else if (scheduled && input.authorized) {
      status = "READY";
      detail = input.detail || "Authorized and ready to execute.";
    } else if (scheduled) {
      status = "PLANNED";
      detail = input.detail || "Complete Roll Call and authorize today before starting.";
    }

    return {
      id: input.id,
      label: input.label || input.id,
      scheduled,
      status,
      detail,
      complete,
      observed,
      executionState: execution || null,
      evidenceCount
    };
  }

  function action(actionKey, label, section, detail, module = null) {
    return { action: actionKey, label, section, href: `#${section}`, detail, module };
  }

  function buildContradictions(input = {}, modules = []) {
    const contradictions = [];
    const week = input.week || {};
    const contract = input.contract || {};
    const activation = input.activation || {};
    const planModules = Array.isArray(activation.modules) ? activation.modules.filter((item) => item.included) : [];
    const linked = planModules.filter((item) => item.complete).length;
    const required = planModules.length;

    if (contract.approved && required && linked !== required && upper(activation.status) === "ACTIVE") {
      contradictions.push({
        code: "ACTIVE_WITH_UNLINKED_PLANS",
        severity: "BLOCKING",
        message: `Activation says active, but only ${linked} of ${required} required plans are linked.`,
        repair: "Relink the missing plan to the current Contract revision."
      });
    }
    if (week.committed && contract.revision && Number(week.contractRevision || 0) !== Number(contract.revision)) {
      contradictions.push({
        code: "WEEK_CONTRACT_MISMATCH",
        severity: "BLOCKING",
        message: `The committed week uses Contract ${week.contractRevision || "unknown"}; Contract ${contract.revision} is current.`,
        repair: "Build and commit a week from the current Contract."
      });
    }
    (Array.isArray(week.conflicts) ? week.conflicts : []).forEach((item) => {
      if (upper(item.severity) === "BLOCKING" || upper(item.code) === "TIME_COMMITMENT_EXCEEDED") {
        contradictions.push({
          code: item.code || "WEEK_CONFLICT",
          severity: upper(item.severity) === "BLOCKING" ? "BLOCKING" : "WARNING",
          message: item.detail || "The committed week conflicts with the Recruit Contract.",
          repair: upper(item.code) === "TIME_COMMITMENT_EXCEEDED"
            ? "Reduce or redistribute that day before calling the week executable."
            : "Resolve the week conflict and recommit."
        });
      }
    });
    modules.filter((item) => item.status === "RECORDED").forEach((item) => {
      contradictions.push({
        code: `UNSCHEDULED_${upper(item.id)}_EVIDENCE`,
        severity: "INFO",
        message: `${item.label} activity exists outside today’s committed assignment.`,
        repair: "Keep it as extra work; do not count it as plan completion."
      });
    });
    return contradictions;
  }

  function stageProgress(currentId, completedIds = []) {
    const currentIndex = STAGES.findIndex((item) => item.id === currentId);
    const complete = new Set(completedIds);
    return STAGES.map((stage, index) => ({
      ...stage,
      complete: complete.has(stage.id),
      current: stage.id === currentId,
      locked: index > currentIndex && !complete.has(stage.id)
    }));
  }

  function buildOperatingTruth(input = {}) {
    const contract = input.contract || {};
    const activation = input.activation || {};
    const week = input.week || {};
    const today = input.today || {};
    const review = input.review || {};
    const planModules = Array.isArray(activation.modules) ? activation.modules.filter((item) => item.included) : [];
    const planTotal = planModules.length;
    const planComplete = planModules.filter((item) => item.complete).length;
    const modules = (Array.isArray(input.modules) ? input.modules : []).map((item) => moduleTruth({
      ...item,
      authorized: Boolean(today.authorized)
    }));
    const contradictions = buildContradictions(input, modules);
    const blockingContradiction = contradictions.find((item) => item.severity === "BLOCKING")
      || contradictions.find((item) => item.severity === "WARNING")
      || null;
    const scheduled = modules.filter((item) => item.scheduled && item.status !== "SAFETY_HOLD");
    const verified = scheduled.filter((item) => item.complete);
    const needsEvidence = scheduled.filter((item) => item.status === "VERIFY");
    const inMotion = scheduled.filter((item) => ["READY", "PLANNED", "IN_PROGRESS"].includes(item.status));
    const activeExecution = modules.find((item) => item.status === "IN_PROGRESS");
    const loopState = upper(review.loopState);
    const reviewClosed = Boolean(review.closed) || Boolean(review.adaptationApproved) || loopState === "LOOP_CLOSED";
    const adaptationApproved = Boolean(review.adaptationApproved) || loopState === "LOOP_CLOSED";
    const common = {
      version: VERSION,
      date: input.date || null,
      modules,
      contradictions,
      plans: { complete: planComplete, total: planTotal },
      evidence: { complete: verified.length, total: scheduled.length, pending: needsEvidence.length },
      canSeal: false
    };

    let state;
    let phase;
    let title;
    let detail;
    let next;
    let completedStages = [];

    if (activeExecution && contract.approved && contract.signed) {
      state = "EXECUTION_REQUIRED";
      phase = "today";
      title = `Resume ${activeExecution.detail || activeExecution.label}`;
      detail = `${activeExecution.label} is already in progress. Preserve and finish the live session before repairing future programming.`;
      next = action("MODULE", `Resume ${activeExecution.label}`, "today", detail, activeExecution.id);
      completedStages = ["contract", "today"];
    } else if (!contract.approved) {
      state = "CONTRACT_REQUIRED";
      phase = "contract";
      title = "Set the Recruit Contract";
      detail = "One approved commitment must govern every plan, week, and daily assignment.";
      next = action("CONTRACT", "Set the Contract", "contract", detail);
    } else if (!contract.signed) {
      state = "SIGNATURE_REQUIRED";
      phase = "contract";
      title = "Sign the Dominion Contract";
      detail = "The Contract is drafted, but the commitment is not yet sealed.";
      next = action("CONTRACT", "Sign the Contract", "contract", detail);
    } else if (planComplete < planTotal || ["ACTION_REQUIRED", "CONTRACT_REQUIRED"].includes(upper(activation.status))) {
      const pending = planModules.find((item) => !item.complete);
      state = "PLANS_REQUIRED";
      phase = "plans";
      title = pending ? `Link the ${pending.label} plan` : "Link the required plans";
      detail = `${planComplete} of ${planTotal || 4} required plans match Contract ${contract.revision || "current"}.`;
      next = action("PLAN", pending ? `Open ${pending.label}` : "Review plans", pending?.section || activation.next?.section || "contract", detail, pending?.id || null);
      completedStages = ["contract"];
    } else if (!week.committed || ["READY_TO_BUILD", "WEEK_READY"].includes(upper(activation.status))) {
      state = "WEEK_REQUIRED";
      phase = "week";
      title = week.draft ? "Commit the coordinated week" : "Build the coordinated week";
      detail = "Approved plans are not executable until one coordinated week is committed.";
      next = action(week.draft ? "COMMIT_WEEK" : "BUILD_WEEK", week.draft ? "Commit the Week" : "Build the Week", "contract", detail);
      completedStages = ["contract", "plans"];
    } else if (blockingContradiction) {
      state = "CONFLICT";
      phase = "week";
      title = "Repair the operating week";
      detail = blockingContradiction.message;
      next = action("REPAIR_WEEK", "Repair the Week", "contract", blockingContradiction.repair);
      completedStages = ["contract", "plans"];
    } else if (!today.rollCallComplete) {
      state = "ROLL_CALL_REQUIRED";
      phase = "today";
      title = "Complete Morning Roll Call";
      detail = "Today’s readiness must be current before training is authorized.";
      next = action("ROLL_CALL", "Complete Roll Call", "today", detail);
      completedStages = ["contract", "plans", "week"];
    } else if (!today.authorized) {
      state = "AUTHORIZATION_REQUIRED";
      phase = "today";
      title = "Authorize today’s decision";
      detail = "Review the readiness-adjusted order before execution begins.";
      next = action("AUTHORIZE", "Authorize Today", "today", detail);
      completedStages = ["contract", "plans", "week"];
    } else if (inMotion.length || needsEvidence.length || verified.length < scheduled.length) {
      const verify = needsEvidence[0];
      const current = modules.find((item) => item.status === "IN_PROGRESS") || modules.find((item) => item.status === "READY" || item.status === "PLANNED");
      if (verify) {
        state = "EVIDENCE_REQUIRED";
        phase = "evidence";
        title = `Verify ${verify.label}`;
        detail = verify.detail;
        next = action("VERIFY", `Verify ${verify.label}`, verify.id === "nutrition" ? "nutrition" : "performance", detail, verify.id);
        completedStages = ["contract", "plans", "week", "today"];
      } else {
        state = "EXECUTION_REQUIRED";
        phase = "today";
        title = current ? `Execute ${current.label}` : "Execute today’s orders";
        detail = current?.detail || "Finish every assigned domain before closing the day.";
        const section = current?.id === "nutrition"
          ? "nutrition"
          : ["strength", "running", "core"].includes(current?.id)
            ? "performance"
            : "today";
        next = action("MODULE", current ? `Open ${current.label}` : "Open Today", section, detail, current?.id || null);
        completedStages = ["contract", "plans", "week"];
      }
    } else if (!reviewClosed) {
      state = "REVIEW_REQUIRED";
      phase = "review";
      title = "Seal today’s evidence";
      detail = "Every assigned domain is verified. Close the review to preserve the lesson.";
      next = action("REVIEW", "Seal the Day", "today", detail);
      completedStages = ["contract", "plans", "week", "today", "evidence"];
      common.canSeal = true;
    } else if (!adaptationApproved) {
      state = "ADAPTATION_REQUIRED";
      phase = "review";
      title = "Approve the next move";
      detail = "Today is reviewed; approve the bounded coaching response for the next exposure.";
      next = action("ADAPT", "Approve Next Move", "today", detail);
      completedStages = ["contract", "plans", "week", "today", "evidence"];
    } else {
      state = "SECURED";
      phase = "review";
      title = "Today is secured";
      detail = "Contract, execution, evidence, review, and adaptation agree.";
      next = action("HISTORY", "View the Record", "record", detail);
      completedStages = STAGES.map((item) => item.id);
      common.canSeal = true;
    }

    return {
      ...common,
      state,
      phase,
      title,
      detail,
      action: next,
      stages: stageProgress(phase, completedStages),
      source: `Contract ${contract.revision || "—"} · ${planComplete}/${planTotal || 4} plans · ${week.committed ? `Week r${week.revision || 1}` : "No week"}`
    };
  }

  return Object.freeze({ VERSION, STAGES: STAGES.map((item) => ({ ...item })), moduleTruth, buildContradictions, buildOperatingTruth });
});
