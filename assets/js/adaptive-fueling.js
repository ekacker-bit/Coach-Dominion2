(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionAdaptiveFueling = api;
}(typeof self !== "undefined" ? self : this, function () {
  const REQUIRED = ["calories", "protein", "carbs", "fat"];
  const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const round = (value, increment) => Math.round(Number(value) / increment) * increment;

  function buildAdaptiveFuelingProposal(input) {
    const value = input || {};
    const targets = Object.fromEntries(REQUIRED.map((key) => [key, Number(value.targets?.[key]) || null]));
    const missingTargets = REQUIRED.filter((key) => !targets[key]);
    if (missingTargets.length) return { status: "NEEDS TARGETS", reason: `Define ${missingTargets.join(", ")} targets first.`, missingTargets, evidenceDays: 0 };
    const days = (value.nutritionDays || []).filter((day) => Number(day.calories) > 0 && Number(day.protein) > 0);
    const evidenceDays = days.length;
    const calorieAdherence = average(days.map((day) => Number(day.calories) / targets.calories));
    const proteinAdherence = average(days.map((day) => Number(day.protein) / targets.protein));
    const base = { ...targets };
    if (evidenceDays < 3) return { status: "LEARNING", reason: "At least 3 complete nutrition days are required before proposing a target variant.", evidenceDays, requiredDays: 3, baseTargets: base };
    if (calorieAdherence < 0.85 || proteinAdherence < 0.85) {
      return { status: "HOLD", reason: "Recent intake is below the existing calorie or protein target. Build consistency before adapting targets.", evidenceDays, baseTargets: base, adherence: { calories: calorieAdherence, protein: proteinAdherence } };
    }
    const goal = ["MAINTAIN", "PERFORMANCE", "FAT_LOSS"].includes(value.goal) ? value.goal : "MAINTAIN";
    const reducedReadiness = ["YELLOW", "RED"].includes(value.readiness);
    const trainingTargets = { ...base };
    const recoveryTargets = { ...base };
    let strategy = "Keep weekly energy stable and shift a small amount of fuel toward training.";
    if (goal === "PERFORMANCE" && !reducedReadiness) {
      trainingTargets.calories = base.calories + Math.min(150, round(base.calories * 0.05, 25));
      trainingTargets.carbs = base.carbs + 30;
      strategy = "Add a small, capped training-day fuel allowance; recovery-day targets remain unchanged.";
    } else if (goal === "MAINTAIN" && !reducedReadiness && base.fat >= 50) {
      trainingTargets.carbs = base.carbs + 20;
      trainingTargets.fat = base.fat - 9;
    } else if (goal === "FAT_LOSS") {
      strategy = "Hold approved energy targets. Automatic calorie cuts are never created.";
    } else if (reducedReadiness) {
      strategy = "Hold approved targets while readiness is reduced; do not restrict recovery fuel.";
    }
    return {
      status: "READY FOR APPROVAL", goal, evidenceDays, baseTargets: base, trainingTargets, recoveryTargets,
      adherence: { calories: calorieAdherence, protein: proteinAdherence }, strategy,
      safeguards: [
        "No target changes occur before explicit approval.",
        "Protein is never reduced by this build.",
        "Reduced readiness blocks restrictive adjustments.",
        "Fat-loss mode never creates an automatic calorie cut.",
        "Approved variants remain local drafts until targets are deliberately updated."
      ]
    };
  }

  function approveAdaptiveFuelingProposal(proposal, approvedAt) {
    if (proposal?.status !== "READY FOR APPROVAL") throw new Error("Only a ready fueling proposal can be approved.");
    return { ...proposal, status: "APPROVED", approvedAt: approvedAt || new Date().toISOString() };
  }
  return { buildAdaptiveFuelingProposal, approveAdaptiveFuelingProposal };
}));
