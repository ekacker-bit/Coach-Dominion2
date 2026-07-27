(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionProgramming = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeName(value) {
    return String(value || "").toLowerCase().replace(/\b(barbell|dumbbell|machine|cable|weighted)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  }

  function roundLoad(value, unit = "lb") {
    const increment = String(unit).toLowerCase() === "kg" ? 1 : 5;
    return Math.max(0, Math.round(value / increment) * increment);
  }

  function readinessPolicy(readiness = {}) {
    const soreness = number(readiness.soreness);
    const energy = number(readiness.energy);
    if (readiness.pain === true || readiness.state === "RED") return { code: "DELOAD", loadFactor: 0.9, volumeFactor: 0.7, reason: readiness.pain === true ? "Pain was reported." : "Readiness is RED." };
    if (readiness.state === "YELLOW" || (soreness !== null && soreness >= 7) || (energy !== null && energy <= 4)) return { code: "CONSERVATIVE", loadFactor: 1, volumeFactor: 0.8, reason: "Readiness or recovery evidence calls for reduced volume." };
    if (readiness.state === "GREEN") return { code: "PROGRESS", loadFactor: 1.025, volumeFactor: 1, reason: "Readiness is GREEN with no pain restriction." };
    return { code: "HOLD", loadFactor: 1, volumeFactor: 1, reason: "Readiness evidence is incomplete." };
  }

  function groupStrengthEvidence(entries = []) {
    const groups = new Map();
    entries.filter((entry) => entry && entry.domain === "strength").forEach((entry) => {
      const metrics = entry.metrics || {};
      const load = number(metrics.weight ?? metrics.load);
      const reps = number(metrics.repetitions ?? metrics.reps);
      const sets = number(metrics.sets) || 1;
      if (!load || !reps) return;
      const key = normalizeName(entry.activityName || entry.activity_name);
      if (!key) return;
      const item = groups.get(key) || { code: key, name: entry.activityName || entry.activity_name, exposures: [] };
      item.exposures.push({
        date: entry.performanceDate || entry.performance_date || "",
        load, reps, sets, unit: metrics.weight_unit || metrics.load_unit || "lb",
        evidenceStatus: entry.evidenceStatus || entry.evidence_status || "SELF REPORTED",
        source: entry.source || "MANUAL"
      });
      groups.set(key, item);
    });
    return Array.from(groups.values()).map((group) => ({ ...group, exposures: group.exposures.sort((a, b) => b.date.localeCompare(a.date)) }));
  }

  function recommendExercise(group, policy, compliance = {}) {
    const latest = group.exposures[0];
    const recent = group.exposures.slice(0, 6);
    const sameLoadSuccesses = recent.filter((entry) => entry.load === latest.load && entry.reps >= latest.reps).length;
    const confirmedComplete = ["completed", "complete"].includes(String(compliance.strengthStatus || "").toLowerCase());
    let action = "HOLD", loadFactor = 1, rationale = "Repeat the latest verified exposure.";
    if (policy.code === "DELOAD") { action = "DELOAD"; loadFactor = policy.loadFactor; rationale = policy.reason; }
    else if (policy.code === "CONSERVATIVE") { action = "HOLD_LOAD_REDUCE_VOLUME"; rationale = policy.reason; }
    else if (!confirmedComplete) { action = "REPEAT"; rationale = "Strength compliance is not confirmed complete."; }
    else if (recent.length >= 2 && sameLoadSuccesses >= 2 && policy.code === "PROGRESS") { action = "PROGRESS"; loadFactor = policy.loadFactor; rationale = "Two successful exposures at the current load support a small increase."; }
    else if (recent.length < 2) rationale = "Insufficient repeated exposure for progression.";
    const recommendedLoad = roundLoad(latest.load * loadFactor, latest.unit);
    const recommendedSets = Math.max(1, Math.round(latest.sets * policy.volumeFactor));
    return {
      exerciseCode: group.code, exerciseName: group.name, action,
      currentLoad: latest.load, recommendedLoad, unit: latest.unit,
      currentSets: latest.sets, recommendedSets, targetReps: latest.reps,
      evidenceCount: recent.length, rationale
    };
  }

  function buildProgrammingRecommendation(input = {}) {
    const groups = groupStrengthEvidence(input.entries || []);
    const policy = readinessPolicy(input.readiness || {});
    const exercises = groups.map((group) => recommendExercise(group, policy, input.compliance || {}));
    const evidenceQuality = exercises.length >= 3 && exercises.every((item) => item.evidenceCount >= 2) ? "MODERATE" : exercises.length ? "LIMITED" : "INSUFFICIENT";
    const status = !exercises.length ? "INSUFFICIENT EVIDENCE" : policy.code === "DELOAD" ? "DELOAD RECOMMENDED" : policy.code === "CONSERVATIVE" ? "VOLUME REDUCTION RECOMMENDED" : exercises.some((item) => item.action === "PROGRESS") ? "PROGRESSION AVAILABLE" : "HOLD / REPEAT";
    return {
      generatedAt: input.generatedAt || new Date().toISOString(), status, policy, evidenceQuality, exercises,
      requiresConfirmation: exercises.length > 0,
      restrictions: policy.code === "DELOAD" ? ["Do not progress load.", "Stop if symptoms increase."] : policy.code === "CONSERVATIVE" ? ["Maintain load.", "Reduce prescribed sets."] : ["No unplanned volume.", "Progress only the listed exercises."]
    };
  }

  function formatPrescription(recommendation = {}) {
    return (recommendation.exercises || []).map((item) => `${item.exerciseName} ${item.recommendedSets}x${item.targetReps} @ ${item.recommendedLoad} ${item.unit}`).join("; ");
  }

  return Object.freeze({ normalizeName, readinessPolicy, groupStrengthEvidence, recommendExercise, buildProgrammingRecommendation, formatPrescription });
});
