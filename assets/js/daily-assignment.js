(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionDailyAssignment = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "009B.1";

  function buildExercise(item = {}, index = 0) {
    return {
      id: item.exerciseCode || `exercise-${index + 1}`,
      name: item.exerciseName || `Exercise ${index + 1}`,
      sets: Math.max(1, Number(item.recommendedSets || item.currentSets || 1)),
      reps: Math.max(1, Number(item.targetReps || 1)),
      load: Math.max(0, Number(item.recommendedLoad || item.currentLoad || 0)),
      unit: item.unit || "lb",
      restSeconds: Number(item.restSeconds || (index === 0 ? 180 : 120)),
      tempo: item.tempo || (index === 0 ? "2-1-X-1" : "2-0-X-1"),
      substitutions: Array.isArray(item.substitutions) && item.substitutions.length ? item.substitutions : ["Use the closest pain-free movement pattern; record the change."],
      action: item.action || "HOLD",
      rationale: item.rationale || "Based on the most recent supported training exposure.",
      evidenceCount: Number(item.evidenceCount || 0)
    };
  }

  function estimateDuration(exercises = []) {
    const workSeconds = exercises.reduce((sum, item) => sum + item.sets * (item.reps * 5 + item.restSeconds), 0);
    return Math.max(20, Math.round((workSeconds / 60 + 15) / 5) * 5);
  }

  function reconcileFitbod(assignment = {}, sessions = []) {
    const date = assignment.date;
    if (!(assignment.exercises || []).length) {
      return { state: "AWAITING PRESCRIPTION", matchedExercises: 0, completedSets: 0, prescribedSets: 0, sourceSessionId: null };
    }
    const session = (sessions || []).find((item) => item.date === date);
    if (!session) return { state: "AWAITING EVIDENCE", matchedExercises: 0, completedSets: 0, sourceSessionId: null };
    const performed = new Map((session.exercises || []).map((item) => [String(item.name || "").toLowerCase(), item]));
    let matchedExercises = 0;
    let completedSets = 0;
    assignment.exercises.forEach((exercise) => {
      const match = [...performed].find(([name]) => name.includes(exercise.name.toLowerCase()) || exercise.name.toLowerCase().includes(name))?.[1];
      if (!match) return;
      matchedExercises += 1;
      completedSets += Math.min(exercise.sets, Number(match.setCount || match.sets?.length || 0));
    });
    const prescribedSets = assignment.exercises.reduce((sum, item) => sum + item.sets, 0);
    return {
      state: matchedExercises === assignment.exercises.length && completedSets >= prescribedSets ? "COMPLETE" : matchedExercises ? "REVIEW REQUIRED" : "UNMATCHED",
      matchedExercises,
      completedSets,
      prescribedSets,
      sourceSessionId: session.id || null
    };
  }

  function buildDailyAssignment(input = {}) {
    const programming = input.programming || {};
    const readiness = input.readiness || {};
    const date = input.date || new Date().toISOString().slice(0, 10);
    const exercises = (programming.exercises || []).map(buildExercise);
    const blocked = readiness.pain === true || readiness.state === "RED";
    const scheduledRecovery = programming.scheduledRecovery === true;
    const assignment = {
      version: VERSION,
      date,
      generatedAt: input.generatedAt || new Date().toISOString(),
      state: blocked || scheduledRecovery ? "RECOVERY ONLY" : exercises.length ? "READY" : "NEEDS PROGRAM",
      title: blocked ? "Recovery protocol" : exercises.length ? "Today’s strength assignment" : "Training program required",
      estimatedMinutes: blocked ? 20 : estimateDuration(exercises),
      exercises: blocked ? [] : exercises,
      warmup: blocked ? ["10–20 minutes easy walking if pain-free.", "Complete prescribed mobility only."] : ["5 minutes easy cyclical movement.", "Movement-specific ramp-up sets before the first work set.", "Confirm pain remains absent before loading."],
      recoveryActions: blocked ? ["Do not perform loaded training.", "Report symptom changes and follow medical guidance."] : ["Stop if pain appears or technique deteriorates.", "Record substitutions and complete the post-session evidence review."],
      readinessDelta: blocked ? { code: "TRAINING_REMOVED", detail: "Pain or RED readiness removed loaded work." } : programming.policy?.code === "CONSERVATIVE" ? { code: "VOLUME_REDUCED", detail: "Readiness reduced prescribed sets while holding load." } : programming.policy?.code === "DELOAD" ? { code: "LOAD_AND_VOLUME_REDUCED", detail: "Readiness reduced load and volume." } : { code: "NO_SAFETY_REDUCTION", detail: "No readiness-based reduction is required." },
      evidence: exercises.map((item) => ({ exerciseId: item.id, sources: item.evidenceCount, rationale: item.rationale })),
      confidence: exercises.length && exercises.every((item) => item.evidenceCount >= 2) ? "MODERATE" : exercises.length ? "LIMITED" : "INSUFFICIENT"
    };
    if (scheduledRecovery && !blocked) {
      assignment.title = "Scheduled strength recovery";
      assignment.warmup = ["No loaded strength warm-up is required today."];
      assignment.recoveryActions = ["Preserve the approved recovery day.", "Do not add missed strength volume without deliberately rescheduling it."];
      assignment.readinessDelta = { code: "SCHEDULED_RECOVERY", detail: "The approved weekly strength schedule preserves recovery today." };
    }
    assignment.fitbod = reconcileFitbod(assignment, input.fitbodSessions || []);
    if (assignment.fitbod.state === "COMPLETE") assignment.state = "COMPLETE";
    return assignment;
  }

  return Object.freeze({ VERSION, buildExercise, estimateDuration, reconcileFitbod, buildDailyAssignment });
});
