(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasProgramRepair = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "024F.1";
  const MODULES = Object.freeze([
    { id: "strength", label: "Strength" },
    { id: "running", label: "Cardio" },
    { id: "core", label: "Core" },
    { id: "nutrition", label: "Fuel" }
  ]);

  const SAFETY_CODES = Object.freeze([
    "RECOVERY_MINIMUM_VIOLATED",
    "RECOVERY_DAY_COLLISION",
    "HARD_RUN_STRENGTH_COLLISION",
    "TWO_A_DAY_SESSION_LIMIT",
    "TRIPLE_TRAINING_WINDOW",
    "TIME_COMMITMENT_EXCEEDED"
  ]);

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function linkedToContract(record = null, contract = null) {
    return Boolean(record && contract?.id
      && record.status === "APPROVED"
      && record.recruitContractId === contract.id
      && Number(record.recruitContractRevision || 0) === Number(contract.revision || 0));
  }

  function weekLinkedToContract(week = null, contract = null) {
    return Boolean(week && contract?.id
      && week.contractId === contract.id
      && Number(week.contractRevision || 0) === Number(contract.revision || 0));
  }

  function calendarDisposition(week = null, contract = null, today = "") {
    if (!week) return "MISSING";
    if (weekLinkedToContract(week, contract)) return "CURRENT_CONTRACT";
    const date = String(today || "").slice(0, 10);
    if (date && week.weekStart <= date && week.weekEnd >= date && week.status !== "REPLACED") return "PROTECTED_CURRENT_WEEK";
    if (date && week.weekEnd && week.weekEnd < date) return "EXPIRED_LEGACY_WEEK";
    return "STALE_CONTRACT_WEEK";
  }

  function normalizeModuleReadiness(value = null, fallback = {}) {
    if (value && typeof value === "object" && value.status) {
      return {
        ...value,
        status: upper(value.status),
        message: value.message || fallback.message || "Review this program link."
      };
    }
    return {
      status: fallback.status || "PLAN_REQUIRED",
      message: fallback.message || "This program link must be rebuilt from the signed Contract."
    };
  }

  function includedModule(program = {}, definition = {}) {
    const state = (program.modules || []).find((item) => item.id === definition.id);
    return state ? state.included !== false : true;
  }

  function moduleRepairState(definition, context = {}) {
    const contract = context.contract || null;
    const programState = (context.program?.modules || []).find((item) => item.id === definition.id) || {};
    const active = context.activePlans?.[definition.id] || null;
    const linked = linkedToContract(active, contract);
    if (!includedModule(context.program, definition)) {
      return { ...definition, included: false, state: "NOT_INCLUDED", atlasCanFix: false, complete: true, detail: "Not selected in this Contract." };
    }
    if (linked) {
      return { ...definition, included: true, state: "KEEP", atlasCanFix: false, complete: true, activeId: active.id || null, detail: "Already matches the signed Contract." };
    }
    const programStatus = upper(programState.status);
    const needsDecision = ["PROFILE_REQUIRED", "DECISION_REQUIRED", "MEDICAL_REVIEW"].includes(programStatus);
    if (needsDecision) {
      return {
        ...definition,
        included: true,
        state: "DECISION_REQUIRED",
        atlasCanFix: false,
        complete: false,
        activeId: active?.id || null,
        detail: programState.summary || programState.message || "Atlas needs one recruit decision before this plan can be prepared."
      };
    }
    return {
      ...definition,
      included: true,
      state: active ? "REPLACE" : "CREATE",
      atlasCanFix: true,
      complete: false,
      activeId: active?.id || null,
      detail: active ? "Rebuild and relink this plan to the current Contract." : "Create this plan from the current Contract."
    };
  }

  function blockerKind(item = {}) {
    const code = upper(item.code);
    if (SAFETY_CODES.some((candidate) => code === candidate) || code.includes("CAP_EXCEEDED")) return "SAFETY_REVIEW";
    if (["CONTRACT_REQUIRED", "EFFECTIVE_DATE_AFTER_WEEK"].includes(code) || code.includes("PROFILE")) return "RECRUIT_DECISION";
    return "ATLAS_REPAIR";
  }

  function buildRepairPlan(context = {}) {
    const contract = context.contract || null;
    if (!contract || contract.status !== "APPROVED") {
      return {
        version: VERSION,
        status: "CONTRACT_REQUIRED",
        visible: true,
        headline: "Set the Contract first",
        detail: "Atlas needs one signed goal and capacity agreement before it can build the program.",
        modules: [],
        blockers: [{ kind: "RECRUIT_DECISION", title: "Signed Contract required", detail: "Complete and sign the Recruit Contract." }],
        primary: { action: "OPEN_CONTRACT", label: "Set the Contract" }
      };
    }

    const modules = MODULES.map((definition) => moduleRepairState(definition, context)).filter((item) => item.included);
    const rawBlockers = context.preflight?.blockers || [];
    const blockers = rawBlockers.map((item) => ({ ...item, kind: blockerKind(item) }));
    const safety = blockers.filter((item) => item.kind === "SAFETY_REVIEW");
    const decisions = blockers.filter((item) => item.kind === "RECRUIT_DECISION");
    const moduleDecisions = modules.filter((item) => item.state === "DECISION_REQUIRED");
    const repairable = modules.filter((item) => item.atlasCanFix);
    const kept = modules.filter((item) => item.state === "KEEP");
    const preflightReady = context.preflight?.status === "READY_TO_ACTIVATE";
    const receiptActive = context.receiptAudit?.status === "ACTIVE";

    let status = "READY_TO_REPAIR";
    let headline = `Atlas can complete ${repairable.length || "the"} program link${repairable.length === 1 ? "" : "s"}`;
    let detail = "Existing Contract-matched plans stay in force. Atlas changes only what is missing or stale.";
    let primary = { action: "PREPARE", label: "Complete my program" };

    if (receiptActive && !repairable.length && !blockers.length) {
      status = "ACTIVE";
      headline = "Your complete program is active";
      detail = "All plans and the coordinated week match the signed Contract.";
      primary = { action: "OPEN_TODAY", label: "Open Today" };
    } else if (safety.length) {
      status = "SAFETY_REVIEW";
      headline = "Review the calendar safeguard";
      detail = "Atlas will not activate the package until the named recovery or capacity conflict is resolved.";
      primary = { action: "OPEN_CALENDAR", label: "Review calendar" };
    } else if (decisions.length || moduleDecisions.length) {
      status = "DECISION_REQUIRED";
      headline = "One recruit decision is needed";
      detail = decisions[0]?.detail || moduleDecisions[0]?.detail || "Complete the missing profile input, then return to activate the program.";
      primary = { action: "OPEN_CONTRACT", label: "Complete profile" };
    } else if (preflightReady) {
      status = "READY_TO_ACTIVATE";
      headline = "Your complete program is ready";
      detail = "Approve once to activate Strength, Cardio, Core, Fuel, and this exact calendar together.";
      primary = { action: "ACTIVATE", label: "Activate complete program" };
    }

    const week = context.weekDraft || null;
    return {
      version: VERSION,
      status,
      visible: status !== "ACTIVE",
      headline,
      detail,
      primary,
      contractId: contract.id,
      contractRevision: Number(contract.revision || 0),
      modules,
      blockers,
      progress: {
        kept: kept.length,
        changing: repairable.length,
        total: modules.length
      },
      week: week ? {
        weekStart: week.weekStart || null,
        weekEnd: week.weekEnd || null,
        trainingDays: Number(week.trainingDays || 0),
        recoveryDays: Number(week.recoveryDays || 0),
        twoADayCount: Number(week.twoADayCount || 0),
        estimatedMinutes: (week.days || []).reduce((sum, day) => sum + Number(day.estimatedMinutes || 0), 0)
      } : null,
      safeguards: [
        "Contract-matched plans are preserved.",
        "Nothing becomes active until the recruit approves the complete package.",
        "A failed write restores the previous plans and calendar."
      ]
    };
  }

  return Object.freeze({
    VERSION,
    MODULES,
    SAFETY_CODES,
    linkedToContract,
    weekLinkedToContract,
    calendarDisposition,
    normalizeModuleReadiness,
    blockerKind,
    buildRepairPlan
  });
});
