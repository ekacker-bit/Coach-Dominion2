(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionProgramRecovery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025Z.1";
  const ORDER = Object.freeze([
    { id: "contract", label: "Contract" },
    { id: "strength", label: "Strength" },
    { id: "running", label: "Cardio" },
    { id: "core", label: "Core" },
    { id: "nutrition", label: "Fuel" },
    { id: "calendar", label: "Calendar" }
  ]);

  function upper(value = "") { return String(value || "").trim().toUpperCase(); }
  function buildRecovery(input = {}) {
    const repair = input.repair || {};
    const modules = new Map((repair.modules || []).map((item) => [String(item.id || "").toLowerCase(), item]));
    const contractReady = Boolean(input.contract) && repair.status !== "CONTRACT_REQUIRED";
    const planSteps = ORDER.slice(1, 5).map((step) => {
      const module = modules.get(step.id);
      const moduleState = upper(module?.state || module?.status);
      const ready = ["KEEP", "MATCHED", "READY", "APPROVED", "ACTIVE", "NOT_INCLUDED"].includes(moduleState);
      return { ...step, state: ready ? "READY" : "REPAIR", detail: ready ? "Approved" : module?.detail || "Atlas will rebuild this plan." };
    });
    const plansReady = planSteps.every((step) => step.state === "READY");
    const calendarReady = Boolean(repair.calendarReady || repair.week || repair.status === "ACTIVE" || repair.status === "READY_TO_ACTIVATE");
    const steps = [
      { ...ORDER[0], state: contractReady ? "READY" : "NEEDS_YOU", detail: contractReady ? "Signed" : "Sign or amend the Contract." },
      ...planSteps,
      { ...ORDER[5], state: calendarReady ? "READY" : plansReady ? "REPAIR" : "BLOCKED", detail: calendarReady ? "Committed" : plansReady ? "Atlas will create the week." : "Complete the plans first." }
    ];
    const readyCount = steps.filter((step) => step.state === "READY").length;
    const current = steps.find((step) => step.state !== "READY") || null;
    let status = "RECOVERY_REQUIRED";
    let primary = { action: "PREPARE", label: "Complete program" };
    let headline = current ? `Complete ${current.label}` : "Program ready";
    let detail = current?.detail || "Every required plan and calendar commitment is ready.";
    if (!contractReady) primary = { action: "OPEN_CONTRACT", label: "Open Contract" };
    else if (repair.status === "DECISION_REQUIRED" || repair.status === "SAFETY_REVIEW") primary = repair.primary || { action: "OPEN_CONTRACT", label: "Review blocker" };
    else if (repair.status === "READY_TO_ACTIVATE") { status = "READY_TO_ACTIVATE"; primary = { action: "ACTIVATE", label: "Activate program" }; headline = "Ready to activate"; detail = "The complete package is staged. One approval activates it."; }
    else if (repair.status === "ACTIVE") { status = "ACTIVE"; primary = { action: "OPEN_TODAY", label: "Open Today" }; headline = "Program active"; detail = "Contract, plans, and calendar are aligned."; }
    return {
      version: VERSION,
      status,
      tone: status === "ACTIVE" ? "green" : status === "READY_TO_ACTIVATE" ? "yellow" : "neutral",
      headline,
      detail,
      progress: Math.round((readyCount / ORDER.length) * 100),
      currentStep: current,
      steps,
      primary,
      safeguard: "Atlas preserves every approved plan that still matches the Contract."
    };
  }

  return Object.freeze({ VERSION, ORDER, buildRecovery });
});
