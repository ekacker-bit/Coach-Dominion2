(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionActivationRepair = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "019F.1";
  const REPAIRABLE_STATES = new Set([
    "CONTRACT_REQUIRED",
    "SIGNATURE_REQUIRED",
    "PLANS_REQUIRED",
    "WEEK_REQUIRED",
    "CONFLICT"
  ]);
  const STAGES = Object.freeze([
    { id: "contract", label: "Contract" },
    { id: "plans", label: "Plans" },
    { id: "week", label: "Week" },
    { id: "today", label: "Today" }
  ]);

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function moduleAction(item = {}, activation = {}) {
    if (item.complete) return null;
    if (item.id === "nutrition" || upper(item.status) === "DRAFT_READY") {
      return {
        action: "OPEN_MODULE",
        label: upper(item.status) === "DRAFT_READY" ? `Review ${item.label}` : `Open ${item.label}`,
        module: item.id
      };
    }
    if (activation.next?.action === "STAGE_DRAFTS") {
      return { action: "STAGE_DRAFTS", label: `Prepare ${item.label} update`, module: item.id };
    }
    return { action: "OPEN_MODULE", label: `Open ${item.label}`, module: item.id };
  }

  function repairAction(truth = {}, activation = {}) {
    const state = upper(truth.state);
    if (state === "CONTRACT_REQUIRED") return { action: "EDIT_CONTRACT", label: "Set the Contract", module: null };
    if (state === "SIGNATURE_REQUIRED") return { action: "SIGN_CONTRACT", label: "Sign the Contract", module: null };
    if (state === "PLANS_REQUIRED") {
      const pending = (activation.modules || []).find((item) => item.included && !item.complete);
      return moduleAction(pending, activation) || {
        action: activation.next?.action || "STAGE_DRAFTS",
        label: activation.next?.label || "Prepare plan updates",
        module: activation.next?.module || null
      };
    }
    if (state === "WEEK_REQUIRED") {
      return {
        action: activation.next?.action || (truth.action?.action === "COMMIT_WEEK" ? "COMMIT_WEEK" : "BUILD_WEEK"),
        label: activation.next?.label || truth.action?.label || "Build coordinated week",
        module: null
      };
    }
    if (state === "CONFLICT") return { action: "OPEN_WEEK", label: "Repair the Week", module: null };
    return { action: "OPEN_TODAY", label: "Return to Today", module: null };
  }

  function stageState(id, truthState, activation = {}) {
    const state = upper(truthState);
    const modules = (activation.modules || []).filter((item) => item.included);
    const plansComplete = Boolean(modules.length) && modules.every((item) => item.complete);
    const contractComplete = !["CONTRACT_REQUIRED", "SIGNATURE_REQUIRED"].includes(state);
    const weekComplete = upper(activation.status) === "ACTIVE" && !["WEEK_REQUIRED", "CONFLICT"].includes(state);
    const todayComplete = !REPAIRABLE_STATES.has(state);
    const values = { contract: contractComplete, plans: plansComplete, week: weekComplete, today: todayComplete };
    const current = state === "CONTRACT_REQUIRED" || state === "SIGNATURE_REQUIRED"
      ? "contract"
      : state === "PLANS_REQUIRED"
        ? "plans"
        : state === "WEEK_REQUIRED" || state === "CONFLICT"
          ? "week"
          : "today";
    return { complete: Boolean(values[id]), current: id === current };
  }

  function buildRepairFlow(truth = {}, activation = {}, options = {}) {
    const state = upper(truth.state || (options.timedOut ? "RETRY_REQUIRED" : "ASSEMBLING"));
    const timedOut = Boolean(options.timedOut) || state === "RETRY_REQUIRED";
    const visible = timedOut || REPAIRABLE_STATES.has(state);
    const modules = (activation.modules || []).filter((item) => item.included).map((item) => ({
      id: item.id,
      label: item.label || item.id,
      status: upper(item.status || (item.complete ? "LINKED" : "PLAN_REQUIRED")),
      detail: item.message || "This plan must match the signed Contract.",
      complete: Boolean(item.complete),
      action: moduleAction(item, activation)
    }));
    const complete = modules.filter((item) => item.complete).length;
    const total = modules.length;
    const primary = timedOut
      ? { action: "RETRY", label: "Reconcile again", module: null }
      : repairAction(truth, activation);
    const pending = modules.find((item) => !item.complete) || null;
    const headline = timedOut
      ? "The operating chain did not resolve"
      : state === "CONTRACT_REQUIRED"
        ? "Create the governing Contract"
        : state === "SIGNATURE_REQUIRED"
          ? "Seal the Contract"
          : state === "PLANS_REQUIRED"
            ? pending ? `Repair the ${pending.label} link` : "Connect the required plans"
            : state === "CONFLICT"
              ? "Repair the coordinated week"
              : state === "WEEK_REQUIRED"
                ? upper(activation.status) === "WEEK_READY" ? "Commit the coordinated week" : "Build the coordinated week"
                : "Your week is operational";
    const detail = timedOut
      ? "Coach Dominion could not reconcile the Contract, plans, and week. Retry without losing any saved work."
      : truth.detail || activation.message || "Complete this repair to unlock Today.";
    return {
      version: VERSION,
      visible,
      timedOut,
      state,
      headline,
      detail,
      primary,
      modules,
      progress: {
        complete,
        total,
        percent: Math.round((complete / Math.max(1, total)) * 100)
      },
      stages: STAGES.map((stage) => ({ ...stage, ...stageState(stage.id, state, activation) })),
      operational: !visible && state !== "ASSEMBLING"
    };
  }

  return Object.freeze({
    VERSION,
    REPAIRABLE_STATES: [...REPAIRABLE_STATES],
    STAGES: STAGES.map((item) => ({ ...item })),
    moduleAction,
    repairAction,
    buildRepairFlow
  });
});
