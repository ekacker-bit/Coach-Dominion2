(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionOneCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021N.1";
  const SETUP_STATES = new Set(["CONTRACT_REQUIRED", "SIGNATURE_REQUIRED", "PLANS_REQUIRED", "WEEK_REQUIRED", "CONFLICT"]);
  const REVIEW_STATES = new Set(["REVIEW_REQUIRED", "ADAPTATION_REQUIRED", "SECURED"]);

  function display(value = "") {
    return String(value || "").replaceAll("_", " ");
  }

  function modeFor(state = "") {
    if (SETUP_STATES.has(state)) return "SETUP";
    if (state === "EVIDENCE_REQUIRED") return "VERIFY";
    if (REVIEW_STATES.has(state)) return "CLOSE";
    return "EXECUTE";
  }

  function moduleChip(item = {}) {
    return {
      id: item.id,
      label: item.label || item.id,
      status: item.status || "NOT_SCHEDULED",
      detail: item.detail || "",
      complete: Boolean(item.complete),
      active: ["READY", "IN_PROGRESS", "VERIFY"].includes(item.status),
      visible: Boolean(item.scheduled || item.observed || item.status === "SAFETY_HOLD")
    };
  }

  function reasonFor(state = "", truth = {}) {
    const reasons = {
      CONTRACT_REQUIRED: "Your Contract defines the standard before Atlas can prescribe the day.",
      SIGNATURE_REQUIRED: "The draft does not govern training until you deliberately sign it.",
      PLANS_REQUIRED: "Every committed domain needs an approved plan before the calendar is trustworthy.",
      WEEK_REQUIRED: "Today must come from a committed week, not an improvised recommendation.",
      CONFLICT: "A blocking mismatch must be resolved before Atlas can issue a safe order.",
      ROLL_CALL_REQUIRED: "Today’s readiness is required before Atlas can safely authorize training.",
      AUTHORIZATION_REQUIRED: "The prescription is ready; authorization fixes the target Atlas will verify.",
      EXECUTION_REQUIRED: "The approved prescription is the highest-priority unfinished work.",
      EVIDENCE_REQUIRED: "The work is not complete until the record proves what actually happened.",
      REVIEW_REQUIRED: "Execution and evidence are reconciled. The day is ready for final review.",
      ADAPTATION_REQUIRED: "Today’s lesson needs approval before it can influence the next exposure.",
      SECURED: "The evidence is preserved and the next operating day has a clean starting point."
    };
    return reasons[state] || truth.detail || "Atlas is reconciling readiness, the committed plan, and current evidence.";
  }

  function afterFor(state = "", truth = {}, options = {}) {
    if (options.after) return String(options.after);
    const labels = {
      CONTRACT_REQUIRED: "Atlas will check your approved plans.",
      SIGNATURE_REQUIRED: "The signed Contract will become the governing standard.",
      PLANS_REQUIRED: "Atlas will rebuild the coordinated week.",
      WEEK_REQUIRED: "Today’s first executable assignment will unlock.",
      CONFLICT: "Atlas will reconcile the operating chain again.",
      ROLL_CALL_REQUIRED: "Atlas will authorize, adjust, or protect today’s training.",
      AUTHORIZATION_REQUIRED: "The first executable assignment will open.",
      EXECUTION_REQUIRED: "Record the completed work as evidence.",
      EVIDENCE_REQUIRED: "Atlas will reconcile the day for closeout.",
      REVIEW_REQUIRED: "The daily seal and lesson will be preserved.",
      ADAPTATION_REQUIRED: "The approved lesson will govern the next exposure.",
      SECURED: "Return tomorrow for the next mission."
    };
    return labels[state] || truth.action?.label || "Atlas will reveal the next required action.";
  }

  function buildOneCommand(truth = {}, options = {}) {
    const state = truth.state || "ASSEMBLING";
    const stages = Array.isArray(truth.stages) ? truth.stages : [];
    const modules = (Array.isArray(truth.modules) ? truth.modules : []).map(moduleChip).filter((item) => item.visible);
    const currentStage = stages.find((item) => item.current);
    const completedStages = stages.filter((item) => item.complete).length;
    const conflict = (truth.contradictions || []).find((item) => item.severity === "BLOCKING")
      || (truth.contradictions || []).find((item) => item.severity === "WARNING")
      || null;
    const source = truth.source || "Contract and operating week are being checked.";
    const evidence = truth.evidence || { complete: 0, total: 0 };
    return {
      version: VERSION,
      state,
      stateLabel: display(state),
      mode: modeFor(state),
      eyebrow: state === "SECURED" ? "DAY SECURED" : `${modeFor(state)} // SINGLE ORDER`,
      title: truth.title || "Assembling the next action",
      detail: truth.detail || "Coach Dominion is reconciling the operating chain.",
      primary: {
        action: truth.action?.action || "REFRESH",
        label: truth.action?.label || "Refresh",
        section: truth.action?.section || "today",
        module: truth.action?.module || null
      },
      secondary: {
        label: SETUP_STATES.has(state) ? "View source chain" : "Why this action?",
        target: "one-command-context"
      },
      progress: {
        complete: completedStages,
        total: stages.length || 6,
        percent: Math.round((completedStages / Math.max(1, stages.length || 6)) * 100),
        current: currentStage?.label || "Checking"
      },
      stages,
      modules,
      context: {
        source,
        evidence: `${Number(evidence.complete || 0)}/${Number(evidence.total || 0)} assigned domains verified`,
        conflict: conflict ? `${conflict.message} ${conflict.repair}` : null,
        online: options.online !== false
      },
      secured: state === "SECURED"
    };
  }

  function buildTodayMission(truth = {}, options = {}) {
    const command = buildOneCommand(truth, options);
    const readiness = String(options.readiness || "ROLL CALL NEEDED").replaceAll("_", " ");
    const schedule = String(options.schedule || "CHECKING").replaceAll("_", " ");
    const evidence = String(options.evidence || command.context.evidence).replaceAll("_", " ");
    return {
      ...command,
      eyebrow: command.secured ? "TODAY // SECURED" : `TODAY // ${command.mode}`,
      reason: reasonFor(command.state, truth),
      decision: truth.action?.label
        ? `${truth.action.label} is the next unfinished requirement in the operating chain.`
        : "The next unfinished requirement comes first.",
      facts: { readiness, schedule, evidence },
      after: afterFor(command.state, truth, options),
      progressLabel: command.secured
        ? "6 of 6 · secured"
        : `${command.progress.complete} of ${command.progress.total} · ${command.progress.current}`,
      closeoutReady: REVIEW_STATES.has(command.state)
    };
  }

  return Object.freeze({ VERSION, SETUP_STATES: [...SETUP_STATES], REVIEW_STATES: [...REVIEW_STATES], modeFor, moduleChip, reasonFor, afterFor, buildOneCommand, buildTodayMission });
});

