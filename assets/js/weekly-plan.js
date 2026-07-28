(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionWeeklyPlan = api;
}(typeof self !== "undefined" ? self : this, function () {
  const LABELS = { mission: "Mission", strength: "Strength", cardio: "Cardio", recovery: "Recovery", nutrition: "Nutrition" };

  function nextDay(date, offset) {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
  }

  function buildWeeklyPlan(inspection) {
    if (!inspection) return { status: "UNAVAILABLE", reason: "No weekly inspection is available.", days: [] };
    if (!inspection.finalizedAt) {
      return { status: "AWAITING FINALIZATION", reason: "Finalize the Weekly Inspection before generating next week’s plan.", days: [] };
    }
    if (Number(inspection.evidenceCoverage || 0) < 50) {
      return { status: "LIMITED EVIDENCE", reason: "At least 50% evidence coverage is required.", days: [] };
    }
    const priority = inspection.nextWeekPriority || { code: "MAINTAIN_STANDARD", text: "Maintain the current standard." };
    const domain = priority.domain || inspection.weakestDomain || null;
    const safety = Boolean(inspection.recoveryRiskSignal || priority.code === "RECOVERY_SAFETY");
    const nextWeekStart = nextDay(inspection.weekEndDate, 1);
    const focus = domain ? LABELS[domain] || domain : priority.code === "EVIDENCE_GAP" ? "Evidence" : safety ? "Recovery" : "Consistency";
    const days = Array.from({ length: 7 }, (_, index) => ({
      date: nextDay(nextWeekStart, index),
      day: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][index],
      focus: index === 0 || index === 3 ? focus : index === 6 ? "Weekly review" : "Execute assigned mission",
      instruction: index === 6 ? "Review evidence; do not compensate for missed work." : safety ? "Follow recovery restrictions and stop if symptoms worsen." : "Execute only authorized work and record all five domains."
    }));
    const guardrails = [
      "Today’s readiness and pain rules override this weekly plan.",
      "Missed work never authorizes compensatory volume.",
      "The plan does not change missions until explicitly approved."
    ];
    if (safety) guardrails.unshift("No hard training through pain or worsening symptoms.");
    return {
      status: "READY FOR APPROVAL",
      sourceWeek: `${inspection.weekStartDate} — ${inspection.weekEndDate}`,
      nextWeekStart,
      nextWeekEnd: nextDay(nextWeekStart, 6),
      priority,
      focus,
      safety,
      evidenceCoverage: Number(inspection.evidenceCoverage || 0),
      disciplineScore: inspection.score,
      days,
      guardrails
    };
  }

  function approveWeeklyPlan(plan, approvedAt) {
    if (!plan || plan.status !== "READY FOR APPROVAL") throw new Error("Only a ready weekly plan can be approved.");
    return { ...plan, status: "APPROVED", approvedAt: approvedAt || new Date().toISOString() };
  }

  return { buildWeeklyPlan, approveWeeklyPlan };
}));
