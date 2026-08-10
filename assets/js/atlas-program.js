(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasProgram = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "024E.1";
  const MODULES = Object.freeze([
    { id: "strength", label: "Strength" },
    { id: "running", label: "Cardio" },
    { id: "core", label: "Core" },
    { id: "nutrition", label: "Fuel" }
  ]);

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundTo(value, increment) {
    return Math.round(Number(value || 0) / increment) * increment;
  }

  function recruitWeightKg(contract = {}, context = {}) {
    const profile = contract.athleteProfile || {};
    const direct = number(contract.weightKg ?? profile.weightKg ?? context.weightKg);
    if (direct && direct > 0) return Number(direct.toFixed(1));
    const value = number(contract.weightValue ?? profile.weightValue ?? context.weightValue);
    if (!value || value <= 0) return null;
    const unit = String(contract.weightUnit || profile.weightUnit || context.weightUnit || "lb").toLowerCase();
    return Number((unit === "kg" ? value : value / 2.2046226218).toFixed(1));
  }

  function estimateNutrition(contract = {}, context = {}) {
    const weightKg = recruitWeightKg(contract, context);
    const heightCm = number(contract.heightCm ?? contract.athleteProfile?.heightCm ?? context.heightCm ?? context.athleteProfile?.heightCm);
    const age = number(contract.age ?? contract.athleteProfile?.age ?? context.age ?? context.athleteProfile?.age);
    if (!weightKg || !heightCm || !age) {
      return {
        status: "PROFILE_REQUIRED",
        message: "Add current weight, height, and age once so Atlas can prepare Fuel with the rest of the program."
      };
    }

    const gender = String(contract.gender || contract.athleteProfile?.gender || "PREFER_NOT_TO_SAY");
    const sexOffset = gender === "MAN" ? 5 : gender === "WOMAN" ? -161 : -78;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;
    const activityFactor = clamp(1.35 + Number(contract.trainingDaysPerWeek || 0) * 0.05 + (contract.twoADays ? 0.05 : 0), 1.4, 1.75);
    const goal = contract.planningInputs?.nutrition?.goal
      || (contract.primaryGoal === "LOSE_FAT" ? "FAT_LOSS" : ["RUN_FASTER", "BUILD_ENDURANCE"].includes(contract.primaryGoal) ? "PERFORMANCE" : "MAINTAIN");
    const goalFactor = goal === "FAT_LOSS" ? 0.9 : goal === "PERFORMANCE" ? 1.03 : 1;
    const calories = roundTo(clamp(bmr * activityFactor * goalFactor, 1400, 4500), 50);
    const proteinMultiplier = goal === "FAT_LOSS" || contract.primaryGoal === "BUILD_STRENGTH" ? 2 : 1.8;
    const protein = roundTo(clamp(weightKg * proteinMultiplier, 90, 300), 5);
    const fat = roundTo(clamp(weightKg * 0.8, 50, 120), 5);
    const carbs = roundTo(Math.max(100, (calories - protein * 4 - fat * 9) / 4), 5);
    const trainingCalories = contract.twoADays ? 250 : Number(contract.trainingDaysPerWeek || 0) ? 150 : 0;
    const trainingCarbs = contract.twoADays ? 60 : Number(contract.trainingDaysPerWeek || 0) ? 35 : 0;

    return {
      status: "READY_FOR_APPROVAL",
      message: "Atlas prepared a conservative starting target from the signed profile and weekly workload.",
      input: {
        goal,
        effectiveDate: contract.effectiveDate,
        calories,
        protein,
        carbs,
        fat,
        trainingCalories,
        trainingCarbs
      },
      weightKg,
      evidence: "SIGNED_PROFILE_AND_CONTRACT",
      rationale: goal === "FAT_LOSS"
        ? "A modest starting deficit preserves protein and adds fuel back on training days."
        : goal === "PERFORMANCE"
          ? "Recovery intake supports the baseline; training days receive bounded carbohydrate and energy support."
          : "A maintenance starting point supports training while Week One establishes real intake and weight evidence.",
      safeguards: [
        "This is a starting estimate, not a medical diet.",
        "The recruit approves it before activation.",
        "Week One evidence can support a later recommendation, never a silent target change.",
        "Pain, medical needs, pregnancy, and eating-disorder risk require qualified professional guidance."
      ]
    };
  }

  function moduleState(definition, contract = {}, context = {}) {
    const input = contract.planningInputs?.[definition.id];
    if (!input && definition.id !== "nutrition") {
      return { ...definition, included: false, ready: true, status: "NOT_SELECTED", summary: "Not selected in this Contract." };
    }
    if (definition.id === "strength") {
      const draft = context.strengthDraft;
      const ready = Boolean(draft?.sessions?.length);
      return { ...definition, included: true, ready, status: ready ? "READY" : "NEEDS_REBUILD", summary: ready ? `${draft.sessions.length} session rotation` : "Strength draft unavailable." };
    }
    if (definition.id === "running") {
      const draft = context.runningDraft;
      const ready = ["DRAFT", "APPROVED"].includes(draft?.status) && Array.isArray(draft.weeks) && draft.weeks.length === 4;
      const sessions = ready ? (draft.weeks[0]?.sessions || []).filter((item) => item.type !== "REST").length : 0;
      return { ...definition, included: true, ready, status: ready ? "READY" : "NEEDS_REBUILD", summary: ready ? `${sessions} cardio day${sessions === 1 ? "" : "s"} per week` : "Cardio draft unavailable." };
    }
    if (definition.id === "core") {
      const draft = context.coreDraft;
      const ready = Boolean(draft?.id && Array.isArray(draft.weeks) && draft.weeks.length === 4);
      const sessions = ready ? Number(draft.profile?.sessionsPerWeek || input.sessionsPerWeek || 0) : 0;
      return { ...definition, included: true, ready, status: ready ? "READY" : "NEEDS_REBUILD", summary: ready ? `${sessions} focused session${sessions === 1 ? "" : "s"} per week` : "Core draft unavailable." };
    }
    const nutrition = context.nutrition || estimateNutrition(contract, context);
    const ready = nutrition?.status === "READY_FOR_APPROVAL" && ["READY FOR APPROVAL", "APPROVED"].includes(context.nutritionProposal?.status);
    return {
      ...definition,
      included: true,
      ready,
      status: ready ? "READY" : nutrition?.status || "NEEDS_REBUILD",
      summary: ready ? `${Math.round(context.nutritionProposal.recoveryTargets.calories)} kcal · ${Math.round(context.nutritionProposal.recoveryTargets.protein)}g protein` : nutrition?.message || "Fuel draft unavailable."
    };
  }

  function buildProgramPackage(context = {}, options = {}) {
    const contract = context.contract;
    if (!contract || contract.status !== "APPROVED") {
      return { version: VERSION, status: "CONTRACT_REQUIRED", modules: [], message: "Sign the Recruit Contract first." };
    }
    const modules = MODULES.map((definition) => moduleState(definition, contract, context));
    const required = modules.filter((item) => item.included);
    const ready = required.filter((item) => item.ready);
    const status = ready.length === required.length ? "READY_FOR_APPROVAL" : "REVIEW_REQUIRED";
    return {
      version: VERSION,
      id: `atlas-program:${contract.id}:r${contract.revision}`,
      contractId: contract.id,
      contractRevision: Number(contract.revision || 0),
      status,
      modules,
      progress: { ready: ready.length, total: required.length, percent: Math.round(ready.length / Math.max(1, required.length) * 100) },
      message: status === "READY_FOR_APPROVAL"
        ? "One coordinated program is ready. Approve it once to activate every plan and the first calendar week."
        : "Atlas needs one profile correction before the complete program can be approved.",
      generatedAt: options.generatedAt || new Date().toISOString(),
      safeguards: [
        "One approval activates the complete package; there are no hidden module approvals.",
        "Current plans and the current week remain protected until the replacement becomes effective.",
        "Daily readiness can reduce work but cannot silently increase or rewrite the approved program."
      ]
    };
  }

  return Object.freeze({ VERSION, MODULES, recruitWeightKg, estimateNutrition, buildProgramPackage });
});
