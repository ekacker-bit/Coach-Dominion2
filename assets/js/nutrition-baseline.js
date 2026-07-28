(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionNutritionBaseline = api;
}(typeof self !== "undefined" ? self : this, function () {
  const GOALS = ["MAINTAIN", "PERFORMANCE", "FAT_LOSS"];
  const TARGET_KEYS = ["calories", "protein", "carbs", "fat"];
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value) => Math.round(value);

  function buildNutritionBaselineProposal(input) {
    const value = input || {};
    const goal = GOALS.includes(value.goal) ? value.goal : "MAINTAIN";
    const effectiveDate = /^\d{4}-\d{2}-\d{2}$/.test(value.effectiveDate || "") ? value.effectiveDate : null;
    const recoveryTargets = Object.fromEntries(TARGET_KEYS.map((key) => [key, number(value[key])]));
    const trainingAdjustments = { calories: number(value.trainingCalories) ?? 0, carbs: number(value.trainingCarbs) ?? 0 };
    const errors = [];
    if (!effectiveDate) errors.push("Choose an effective date.");
    TARGET_KEYS.forEach((key) => {
      if (!(recoveryTargets[key] > 0)) errors.push(`Enter a positive ${key} target.`);
    });
    if (recoveryTargets.calories && recoveryTargets.calories < 1200) errors.push("Calorie targets below 1,200 require qualified professional review.");
    if (recoveryTargets.protein && recoveryTargets.protein > 350) errors.push("Protein targets above 350g require qualified professional review.");
    if (trainingAdjustments.calories < 0 || trainingAdjustments.calories > 300) errors.push("Training-day calories must add between 0 and 300 kcal.");
    if (trainingAdjustments.carbs < 0 || trainingAdjustments.carbs > 75) errors.push("Training-day carbohydrates must add between 0 and 75g.");
    if (recoveryTargets.calories && recoveryTargets.protein && recoveryTargets.carbs && recoveryTargets.fat) {
      const macroCalories = recoveryTargets.protein * 4 + recoveryTargets.carbs * 4 + recoveryTargets.fat * 9;
      if (Math.abs(macroCalories - recoveryTargets.calories) / recoveryTargets.calories > 0.35) {
        errors.push("Macro calories differ from the calorie target by more than 35%. Review the baseline.");
      }
    }
    if (goal === "FAT_LOSS" && trainingAdjustments.calories === 0 && trainingAdjustments.carbs === 0) {
      errors.push("Fat-loss mode still requires a small training-day fueling allowance.");
    }
    if (errors.length) return { status: "REVIEW REQUIRED", errors, goal, effectiveDate, recoveryTargets, trainingAdjustments };
    const trainingTargets = {
      calories: round(recoveryTargets.calories + trainingAdjustments.calories),
      protein: round(recoveryTargets.protein),
      carbs: round(recoveryTargets.carbs + trainingAdjustments.carbs),
      fat: round(recoveryTargets.fat)
    };
    return {
      status: "READY FOR APPROVAL", goal, effectiveDate, recoveryTargets, trainingTargets, trainingAdjustments,
      rationale: goal === "PERFORMANCE"
        ? "Performance baseline preserves recovery intake and adds bounded training-day fuel."
        : goal === "FAT_LOSS"
          ? "Fat-loss baseline preserves protein and training-day fuel; no automatic deficit is created."
          : "Maintenance baseline keeps recovery intake stable and adds only the approved training-day allowance.",
      safeguards: [
        "This setup records targets you deliberately enter; it does not prescribe a medical diet.",
        "No baseline becomes active until explicit approval.",
        "Protein is never reduced on training days.",
        "Training-day fuel cannot be converted into a recovery-day penalty.",
        "Future changes create new history entries instead of rewriting prior baselines."
      ]
    };
  }

  function approveNutritionBaseline(proposal, approvedAt, id) {
    if (proposal?.status !== "READY FOR APPROVAL") throw new Error("Only a ready nutrition baseline can be approved.");
    return { ...proposal, id: id || `nutrition-baseline-${Date.now()}`, status: "APPROVED", approvedAt: approvedAt || new Date().toISOString() };
  }

  function selectEffectiveBaseline(history, date) {
    const onDate = date || new Date().toISOString().slice(0, 10);
    return (history || []).filter((item) => item?.status === "APPROVED" && item.effectiveDate <= onDate)
      .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate) || a.approvedAt.localeCompare(b.approvedAt)).at(-1) || null;
  }

  return { buildNutritionBaselineProposal, approveNutritionBaseline, selectEffectiveBaseline };
}));
