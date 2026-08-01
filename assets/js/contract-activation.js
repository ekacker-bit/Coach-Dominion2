(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionContractActivation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021D.1";
  const MODULES = Object.freeze([
    { id: "strength", label: "Strength", section: "performance", view: "today_training" },
    { id: "running", label: "Running", section: "performance", view: "running" },
    { id: "core", label: "Core", section: "performance", view: "core" },
    { id: "nutrition", label: "Nutrition", section: "nutrition", view: "plan" }
  ]);

  function numberValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function sameValue(left, right) {
    if (left === null || left === undefined || right === null || right === undefined) return left === right;
    const leftNumber = numberValue(left);
    const rightNumber = numberValue(right);
    if (leftNumber !== null && rightNumber !== null) return leftNumber === rightNumber;
    return String(left).toUpperCase() === String(right).toUpperCase();
  }

  function planProfile(plan = {}) {
    return plan.profile || {};
  }

  function linkedToContract(record = null, contract = null) {
    if (!record || !contract?.id) return false;
    return record.recruitContractId === contract.id
      && Number(record.recruitContractRevision || 0) === Number(contract.revision || 0);
  }

  function describe(value, suffix = "") {
    if (value === null || value === undefined || value === "") return "not set";
    return `${String(value).replaceAll("_", " ").toLowerCase()}${suffix}`;
  }

  function planChanges(moduleId, expected = {}, active = null) {
    if (!active) return [];
    const profile = planProfile(active);
    const checks = moduleId === "strength"
      ? [
          ["Training days", profile.daysPerWeek, expected.daysPerWeek, "/wk"],
          ["Session length", profile.sessionMinutes, expected.sessionMinutes, " min"],
          ["Goal", profile.goal, expected.goal, ""],
          ["Equipment", profile.equipment, expected.equipment, ""]
        ]
      : moduleId === "running"
        ? [
            ["Running days", profile.runningDaysPerWeek, expected.runningDaysPerWeek, "/wk"],
            ["Weekly distance", profile.declaredWeeklyDistance, expected.declaredWeeklyDistance, ` ${expected.preferredUnit || ""}`],
            ["Goal", profile.goal, expected.goal, ""]
          ]
        : moduleId === "core"
          ? [
              ["Core days", profile.sessionsPerWeek, expected.sessionsPerWeek, "/wk"],
              ["Session length", profile.sessionMinutes, expected.sessionMinutes, " min"],
              ["Goal", profile.goal, expected.goal, ""]
            ]
          : [["Goal", active.goal, expected.goal, ""]];
    return checks.filter(([, from, to]) => !sameValue(from, to)).map(([label, from, to, suffix]) => ({
      label,
      from: describe(from, suffix),
      to: describe(to, suffix)
    }));
  }

  function moduleState(definition, context, contract) {
    const expected = contract.planningInputs?.[definition.id] || null;
    if (!expected) {
      return { ...definition, included: false, complete: true, status: "NOT_INCLUDED", message: "Not included in this Contract.", changes: [] };
    }
    if (definition.id === "nutrition") {
      const connection = context.nutritionConnection || {};
      const active = context.nutritionBaseline || connection.baseline || null;
      const changes = planChanges("nutrition", expected, active);
      if (["PLAN_LINKED", "SCHEDULED"].includes(connection.status)) {
        return {
          ...definition,
          included: true,
          complete: true,
          status: connection.status === "SCHEDULED" ? "SCHEDULED" : "LINKED",
          message: connection.message || "Approved Nutrition targets are linked.",
          changes: []
        };
      }
      return {
        ...definition,
        included: true,
        complete: false,
        status: active ? "UPDATE_REQUIRED" : "PLAN_REQUIRED",
        message: connection.message || (active ? "Nutrition targets need review against this Contract." : "Approve Nutrition targets for this Contract."),
        changes
      };
    }

    const active = context[`${definition.id}Plan`] || null;
    const draft = context[`${definition.id}Draft`] || null;
    const activeLinked = linkedToContract(active, contract);
    const draftLinked = linkedToContract(draft, contract);
    const changes = planChanges(definition.id, expected, active);
    if (activeLinked) {
      return { ...definition, included: true, complete: true, status: "LINKED", message: `Approved ${definition.label} plan matches Contract ${contract.revision}.`, changes: [] };
    }
    if (draftLinked) {
      return { ...definition, included: true, complete: false, status: "DRAFT_READY", message: `Review and approve the Contract ${contract.revision} ${definition.label} draft.`, changes };
    }
    if (active && changes.length === 0) {
      return { ...definition, included: true, complete: true, status: "COMPATIBLE", message: `Approved ${definition.label} plan remains compatible with Contract ${contract.revision}; no prescription change is required.`, changes: [] };
    }
    if (active) {
      return { ...definition, included: true, complete: false, status: "UPDATE_REQUIRED", message: `The active ${definition.label} plan predates Contract ${contract.revision}.`, changes };
    }
    return { ...definition, included: true, complete: false, status: "PLAN_REQUIRED", message: `Create and approve the ${definition.label} plan.`, changes: [] };
  }

  function referenceFor(moduleId, context = {}) {
    if (moduleId === "nutrition") {
      const baseline = context.nutritionBaseline || context.nutritionConnection?.baseline || null;
      return { id: baseline?.id || baseline?.approvedAt || null, revision: null };
    }
    const plan = context[`${moduleId}Plan`] || null;
    return { id: plan?.id || null, revision: Number(plan?.revision || 1) };
  }

  function weekMatchesSources(week = null, contract = null, context = {}) {
    if (!week || !contract) return false;
    if (week.contractId !== contract.id || Number(week.contractRevision || 0) !== Number(contract.revision || 0)) return false;
    const refs = week.sourceRefs || {};
    return MODULES.every((definition) => {
      if (!contract.planningInputs?.[definition.id]) return true;
      const expected = referenceFor(definition.id, context);
      const idKey = `${definition.id === "running" ? "runningBlock" : definition.id === "core" ? "corePlan" : definition.id === "strength" ? "strengthPlan" : "nutritionBaseline"}Id`;
      if ((refs[idKey] || null) !== expected.id) return false;
      if (definition.id === "nutrition") return true;
      const revisionKey = `${definition.id === "running" ? "runningBlock" : `${definition.id}Plan`}Revision`;
      return Number(refs[revisionKey] || 1) === Number(expected.revision || 1);
    });
  }

  function buildActivation(context = {}, options = {}) {
    const contract = context.contract || null;
    if (!contract || contract.status !== "APPROVED") {
      return {
        version: VERSION,
        status: "CONTRACT_REQUIRED",
        message: "Approve the Recruit Contract before activating plans.",
        modules: [],
        progress: { complete: 0, total: 1, percent: 0 },
        next: { action: "EDIT_CONTRACT", label: "Set the Contract", section: "contract" },
        protectedWeek: null
      };
    }

    const modules = MODULES.map((definition) => moduleState(definition, context, contract));
    const required = modules.filter((item) => item.included);
    const linked = required.filter((item) => item.complete);
    const committedWeeks = Array.isArray(context.committedWeeks)
      ? context.committedWeeks
      : context.committedWeek ? [context.committedWeek] : [];
    const committed = committedWeeks.find((week) => week.status !== "REPLACED" && weekMatchesSources(week, contract, context)) || null;
    const matchingDraft = weekMatchesSources(context.weekDraft, contract, context) ? context.weekDraft : null;
    const pending = required.find((item) => !item.complete) || null;
    const total = required.length + 1;
    const complete = linked.length + (committed && !matchingDraft ? 1 : 0);
    const progress = { complete, total, percent: Math.round((complete / Math.max(1, total)) * 100) };
    const currentWeek = context.currentWeek || null;
    const protectedWeek = currentWeek && !weekMatchesSources(currentWeek, contract, context) ? currentWeek : null;

    if (pending) {
      const stageable = pending.id !== "nutrition" && pending.status !== "DRAFT_READY";
      return {
        version: VERSION,
        status: "ACTION_REQUIRED",
        message: `${linked.length} of ${required.length} plans are linked to Contract ${contract.revision}.`,
        modules,
        progress,
        protectedWeek,
        next: stageable
          ? { action: "STAGE_DRAFTS", label: "Prepare plan updates", section: "contract" }
          : { action: "OPEN_MODULE", label: `Review ${pending.label}`, section: pending.section, view: pending.view, module: pending.id }
      };
    }
    if (matchingDraft) {
      return {
        version: VERSION,
        status: "WEEK_READY",
        message: "Every plan is linked. Review and commit the coordinated week.",
        modules,
        progress,
        protectedWeek,
        next: { action: "COMMIT_WEEK", label: "Commit coordinated week", section: "contract" }
      };
    }
    if (committed) {
      return {
        version: VERSION,
        status: "ACTIVE",
        message: `Contract ${contract.revision}, every plan, and the committed week are aligned.`,
        modules,
        progress,
        protectedWeek: null,
        next: { action: "OPEN_TODAY", label: "Open Today", section: "today" }
      };
    }
    return {
      version: VERSION,
      status: "READY_TO_BUILD",
      message: "Every plan is linked. Build the coordinated week.",
      modules,
      progress,
      protectedWeek,
      next: { action: "BUILD_WEEK", label: "Build coordinated week", section: "contract" }
    };
  }

  return {
    VERSION,
    MODULES,
    linkedToContract,
    planChanges,
    weekMatchesSources,
    buildActivation
  };
});
