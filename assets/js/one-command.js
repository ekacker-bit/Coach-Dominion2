(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionOneCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "019E.1";
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

  return Object.freeze({ VERSION, SETUP_STATES: [...SETUP_STATES], REVIEW_STATES: [...REVIEW_STATES], modeFor, moduleChip, buildOneCommand });
});
