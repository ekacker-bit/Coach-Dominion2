(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCoreProgramming = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "013C.1";
  const GOALS = ["GENERAL_STRENGTH", "RUNNING_SUPPORT", "LIFTING_STABILITY", "CORE_ENDURANCE", "ABDOMINAL_DEVELOPMENT"];
  const EXPERIENCE_LEVELS = ["FOUNDATION", "INTERMEDIATE", "ADVANCED"];
  const EQUIPMENT_LEVELS = ["BODYWEIGHT", "MINIMAL", "FULL_GYM"];
  const MOVEMENT_CATEGORIES = Object.freeze([
    { code: "ANTI_EXTENSION", label: "Anti-extension", purpose: "Resist excessive spinal extension and preserve trunk position." },
    { code: "ANTI_ROTATION", label: "Anti-rotation", purpose: "Control unwanted rotation under asymmetric force." },
    { code: "ANTI_LATERAL_FLEXION", label: "Anti-lateral flexion", purpose: "Resist side-bending and build frontal-plane stability." },
    { code: "TRUNK_HIP_FLEXION", label: "Trunk / hip flexion", purpose: "Train controlled abdominal shortening and hip-flexion strength." },
    { code: "CARRY_BRACING", label: "Carries & bracing", purpose: "Apply whole-body trunk stiffness while moving or loading." }
  ]);
  const EXERCISE_CATALOG = Object.freeze([
    { code: "dead_bug", name: "Dead Bug", category: "ANTI_EXTENSION", level: 0, equipment: 0, metric: "REPS", base: 8, cue: "Keep the low back quietly connected to the floor.", substitution: "Heel taps" },
    { code: "front_plank", name: "Front Plank", category: "ANTI_EXTENSION", level: 0, equipment: 0, metric: "SECONDS", base: 30, cue: "Brace, breathe behind the shield, and keep ribs stacked.", substitution: "Elevated plank" },
    { code: "hollow_hold", name: "Hollow-Body Hold", category: "ANTI_EXTENSION", level: 1, equipment: 0, metric: "SECONDS", base: 20, cue: "Shorten the distance between ribs and pelvis without holding breath.", substitution: "Tuck hollow hold" },
    { code: "ab_wheel", name: "Ab-Wheel Rollout", category: "ANTI_EXTENSION", level: 2, equipment: 1, metric: "REPS", base: 6, cue: "Move only as far as the trunk stays braced and pain-free.", substitution: "Stability-ball rollout" },
    { code: "bird_dog", name: "Bird Dog", category: "ANTI_ROTATION", level: 0, equipment: 0, metric: "REPS", base: 8, cue: "Reach long without shifting or rotating the pelvis.", substitution: "Quadruped shoulder tap" },
    { code: "pallof_press", name: "Pallof Press", category: "ANTI_ROTATION", level: 1, equipment: 1, metric: "REPS", base: 10, cue: "Press straight out while the torso remains square.", substitution: "Tall-kneeling band press" },
    { code: "cable_chop", name: "Controlled Cable Chop", category: "ANTI_ROTATION", level: 2, equipment: 2, metric: "REPS", base: 8, cue: "Rotate through the upper back while controlling the pelvis.", substitution: "Band chop" },
    { code: "side_plank", name: "Side Plank", category: "ANTI_LATERAL_FLEXION", level: 0, equipment: 0, metric: "SECONDS", base: 25, cue: "Build one straight line from ear through ankle.", substitution: "Bent-knee side plank" },
    { code: "suitcase_hold", name: "Suitcase Hold", category: "ANTI_LATERAL_FLEXION", level: 1, equipment: 1, metric: "SECONDS", base: 30, cue: "Stand tall without leaning toward or away from the load.", substitution: "Side plank" },
    { code: "reverse_crunch", name: "Reverse Crunch", category: "TRUNK_HIP_FLEXION", level: 0, equipment: 0, metric: "REPS", base: 10, cue: "Roll the pelvis with control instead of swinging the legs.", substitution: "Bent-knee march" },
    { code: "hanging_knee_raise", name: "Hanging Knee Raise", category: "TRUNK_HIP_FLEXION", level: 1, equipment: 1, metric: "REPS", base: 8, cue: "Begin from a quiet hang and avoid momentum.", substitution: "Captain's-chair knee raise" },
    { code: "hanging_leg_raise", name: "Hanging Leg Raise", category: "TRUNK_HIP_FLEXION", level: 2, equipment: 1, metric: "REPS", base: 6, cue: "Use posterior pelvic tilt and stop before swinging begins.", substitution: "Hanging knee raise" },
    { code: "bear_crawl", name: "Bear Crawl", category: "CARRY_BRACING", level: 0, equipment: 0, metric: "SECONDS", base: 25, cue: "Move slowly while hips and shoulders stay level.", substitution: "Bear-plank shoulder tap" },
    { code: "farmer_carry", name: "Farmer Carry", category: "CARRY_BRACING", level: 1, equipment: 1, metric: "SECONDS", base: 40, cue: "Walk tall with quiet ribs and deliberate breathing.", substitution: "Marching suitcase hold" },
    { code: "front_rack_carry", name: "Front-Rack Carry", category: "CARRY_BRACING", level: 2, equipment: 2, metric: "SECONDS", base: 30, cue: "Stack ribs over pelvis and preserve an even gait.", substitution: "Farmer carry" }
  ]);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
  }

  function addDays(date, days) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + Number(days || 0));
    return value.toISOString().slice(0, 10);
  }

  function weekStartIso(value) {
    const date = new Date(`${dateIso(value) || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
    const offset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  }

  function normalizeProfile(input = {}) {
    const goal = GOALS.includes(input.goal) ? input.goal : "GENERAL_STRENGTH";
    const experience = EXPERIENCE_LEVELS.includes(input.experience) ? input.experience : "FOUNDATION";
    const equipment = EQUIPMENT_LEVELS.includes(input.equipment) ? input.equipment : "BODYWEIGHT";
    return {
      version: VERSION,
      goal,
      sessionsPerWeek: clamp(Math.round(input.sessionsPerWeek || input.sessions_per_week || 3), 2, 4),
      experience,
      equipment,
      sessionMinutes: [10, 15, 20].includes(Number(input.sessionMinutes || input.session_minutes)) ? Number(input.sessionMinutes || input.session_minutes) : 15,
      approvedAt: input.approvedAt || input.approved_at || null,
      updatedAt: input.updatedAt || input.updated_at || null
    };
  }

  function sessionDayIndexes(sessionsPerWeek) {
    return {
      2: [1, 4],
      3: [0, 2, 5],
      4: [0, 1, 3, 5]
    }[clamp(Math.round(sessionsPerWeek), 2, 4)];
  }

  function eligibleExercises(category, profile) {
    const maxLevel = EXPERIENCE_LEVELS.indexOf(profile.experience);
    const maxEquipment = EQUIPMENT_LEVELS.indexOf(profile.equipment);
    return EXERCISE_CATALOG.filter((exercise) => exercise.category === category && exercise.level <= maxLevel && exercise.equipment <= maxEquipment);
  }

  function selectExercise(category, profile, rotation = 0) {
    const candidates = eligibleExercises(category, profile);
    const fallback = EXERCISE_CATALOG.filter((exercise) => exercise.category === category && exercise.level === 0 && exercise.equipment === 0);
    const pool = candidates.length ? candidates : fallback;
    return pool[rotation % pool.length];
  }

  function exercisePrescription(exercise, profile, weekNumber, sessionNumber, slot) {
    const weekRules = {
      1: { multiplier: 1, setDelta: 0, label: "ESTABLISH" },
      2: { multiplier: 1.1, setDelta: 0, label: "ACCUMULATE" },
      3: { multiplier: 1.15, setDelta: 1, label: "BUILD" },
      4: { multiplier: 1, setDelta: 0, label: "CONSOLIDATE" }
    };
    const rule = weekRules[weekNumber];
    const baseSets = profile.sessionMinutes === 10 ? 2 : profile.sessionMinutes === 20 ? 3 : slot === 0 ? 3 : 2;
    const target = Math.max(1, Math.round(exercise.base * rule.multiplier));
    return {
      id: `${exercise.code}-${weekNumber}-${sessionNumber}`,
      exerciseCode: exercise.code,
      name: exercise.name,
      category: exercise.category,
      categoryLabel: MOVEMENT_CATEGORIES.find((item) => item.code === exercise.category)?.label || exercise.category,
      sets: Math.min(4, baseSets + rule.setDelta),
      metric: exercise.metric,
      target,
      restSeconds: exercise.metric === "SECONDS" ? 45 : 60,
      cue: exercise.cue,
      substitution: exercise.substitution,
      progression: rule.label
    };
  }

  function planFingerprint(profile, startDate) {
    return [VERSION, startDate, profile.goal, profile.sessionsPerWeek, profile.experience, profile.equipment, profile.sessionMinutes].join(":");
  }

  function buildFourWeekPlan(profileInput = {}, options = {}) {
    const profile = normalizeProfile(profileInput);
    const startDate = weekStartIso(options.startDate || options.today);
    const sessionDays = sessionDayIndexes(profile.sessionsPerWeek);
    const exercisesPerSession = profile.sessionMinutes === 10 ? 2 : profile.sessionMinutes === 20 ? 4 : 3;
    const weeks = Array.from({ length: 4 }, (_, weekIndex) => {
      const weekNumber = weekIndex + 1;
      const weekStart = addDays(startDate, weekIndex * 7);
      const sessions = sessionDays.map((dayIndex, sessionIndex) => {
        const categories = Array.from({ length: exercisesPerSession }, (_, slot) => {
          const categoryIndex = (sessionIndex * exercisesPerSession + slot + weekIndex) % MOVEMENT_CATEGORIES.length;
          return MOVEMENT_CATEGORIES[categoryIndex].code;
        });
        const exercises = categories.map((category, slot) => {
          const selected = selectExercise(category, profile, weekIndex + sessionIndex + slot);
          return exercisePrescription(selected, profile, weekNumber, sessionIndex + 1, slot);
        });
        return {
          id: `core-${weekNumber}-${sessionIndex + 1}`,
          date: addDays(weekStart, dayIndex),
          weekNumber,
          sessionNumber: sessionIndex + 1,
          title: `Core ${weekNumber}.${sessionIndex + 1}`,
          phase: ["ESTABLISH", "ACCUMULATE", "BUILD", "CONSOLIDATE"][weekIndex],
          estimatedMinutes: profile.sessionMinutes,
          exercises
        };
      });
      return { weekNumber, weekStart, weekEnd: addDays(weekStart, 6), phase: ["ESTABLISH", "ACCUMULATE", "BUILD", "CONSOLIDATE"][weekIndex], sessions };
    });
    return {
      version: VERSION,
      id: `core-plan-${planFingerprint(profile, startDate).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
      status: "DRAFT",
      startDate,
      endDate: addDays(startDate, 27),
      generatedAt: options.generatedAt || new Date().toISOString(),
      approvedAt: null,
      profile,
      weeks,
      safeguards: [
        "Pain or RED readiness removes the session.",
        "YELLOW readiness may reduce volume but never increase it.",
        "Technique quality overrides repetitions, time, and progression.",
        "The approved four-week plan never changes silently."
      ]
    };
  }

  function approvePlan(plan = {}, approvedAt = new Date().toISOString()) {
    if (!plan.id || !Array.isArray(plan.weeks) || plan.weeks.length !== 4) return null;
    return JSON.parse(JSON.stringify({ ...plan, status: "APPROVED", approvedAt }));
  }

  function planSessions(plan = {}) {
    return (plan.weeks || []).flatMap((week) => week.sessions || []);
  }

  function normalizedHistory(history = []) {
    return (history || []).filter((item) => item && item.date).map((item) => ({
      ...item,
      state: item.state || "NOT_STARTED",
      quality: item.quality || null,
      effort: Number(item.effort || 0),
      painReported: Boolean(item.painReported)
    })).sort((left, right) => String(left.date).localeCompare(String(right.date)));
  }

  function deriveProgressionRecommendation(history = []) {
    const completed = normalizedHistory(history).filter((item) => item.state === "COMPLETE");
    const recent = completed.slice(-4);
    if (!recent.length) return { code: "ESTABLISH", label: "Establish evidence", reason: "Complete controlled sessions before progression is considered." };
    if (recent.some((item) => item.painReported || item.quality === "TECHNIQUE_LIMITED")) {
      return { code: "REGRESS", label: "Regress or substitute", reason: "Pain or technique-limited evidence blocks progression." };
    }
    const controlled = recent.filter((item) => item.quality === "CONTROLLED" && item.effort > 0 && item.effort <= 8);
    if (controlled.length >= Math.min(2, recent.length) && recent.length >= 2) {
      return { code: "PROGRESS_NEXT_CYCLE", label: "Progress next cycle", reason: "At least two recent controlled sessions were completed at sustainable effort." };
    }
    return { code: "REPEAT", label: "Repeat current exposure", reason: "Completion exists, but control or effort evidence does not yet support progression." };
  }

  function buildDailyPrescription(plan = {}, history = [], options = {}) {
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    if (!plan || plan.status !== "APPROVED") {
      return { status: "PLAN_REQUIRED", date: today, session: null, exercises: [], message: "Approve a four-week core plan before executing a daily session." };
    }
    const planned = planSessions(plan).find((session) => session.date === today) || null;
    if (!planned) {
      return { status: "RECOVERY_DAY", date: today, session: null, exercises: [], message: "No core session is scheduled today. Recovery preserves the approved plan." };
    }
    const readiness = String(options.readiness?.state || "UNKNOWN").toUpperCase();
    const pain = Boolean(options.readiness?.pain);
    if (pain || readiness === "RED") {
      return {
        status: "SAFETY_HOLD",
        date: today,
        session: planned,
        exercises: [],
        message: "Pain or RED readiness removed today’s core session. Do not train through symptoms.",
        adjustment: { code: "SESSION_REMOVED", setDelta: null }
      };
    }
    const yellow = readiness === "YELLOW";
    const exercises = planned.exercises.map((exercise) => ({
      ...exercise,
      plannedSets: exercise.sets,
      sets: yellow ? Math.max(1, exercise.sets - 1) : exercise.sets
    }));
    const existing = normalizedHistory(history).find((item) => item.date === today && item.planId === plan.id) || null;
    return {
      status: existing?.state === "COMPLETE" ? "COMPLETE" : existing?.state === "IN_PROGRESS" ? "IN_PROGRESS" : "READY",
      date: today,
      planId: plan.id,
      session: planned,
      exercises,
      message: yellow ? "YELLOW readiness reduced one set from each movement while preserving the approved exercise selection." : "Execute the approved session with controlled technique and pain-free range.",
      adjustment: yellow ? { code: "VOLUME_REDUCED", setDelta: -1 } : { code: "NO_CHANGE", setDelta: 0 },
      progression: deriveProgressionRecommendation(history)
    };
  }

  function startExecution(prescription = {}, startedAt = new Date().toISOString()) {
    if (!prescription.session || !["READY", "IN_PROGRESS"].includes(prescription.status)) return null;
    return {
      version: VERSION,
      planId: prescription.planId,
      sessionId: prescription.session.id,
      date: prescription.date,
      state: "IN_PROGRESS",
      startedAt,
      completedAt: null,
      completedExercises: {},
      quality: null,
      effort: null,
      painReported: false,
      adjustment: prescription.adjustment
    };
  }

  function completeExercise(execution = {}, exerciseId = "") {
    if (execution.state !== "IN_PROGRESS" || !exerciseId) return execution;
    return { ...execution, completedExercises: { ...(execution.completedExercises || {}), [exerciseId]: true } };
  }

  function completeSession(execution = {}, prescription = {}, review = {}) {
    if (execution.state !== "IN_PROGRESS") return { valid: false, execution, message: "Start the session before completing it." };
    const exercises = prescription.exercises || [];
    const allComplete = exercises.length > 0 && exercises.every((exercise) => execution.completedExercises?.[exercise.id]);
    if (!allComplete) return { valid: false, execution, message: "Complete every prescribed movement before closing the session." };
    const quality = ["CONTROLLED", "TECHNIQUE_LIMITED"].includes(review.quality) ? review.quality : "CONTROLLED";
    const effort = clamp(Math.round(review.effort || 7), 1, 10);
    return {
      valid: true,
      message: quality === "CONTROLLED" ? "Core session completed with controlled evidence." : "Session saved; technique limitations will block progression.",
      execution: {
        ...execution,
        state: "COMPLETE",
        quality,
        effort,
        completedAt: review.completedAt || new Date().toISOString()
      }
    };
  }

  function reportPain(execution = {}, reportedAt = new Date().toISOString()) {
    return { ...execution, state: "PAIN_HOLD", painReported: true, reportedAt, completedAt: null };
  }

  function movementCoverage(plan = {}) {
    const counts = Object.fromEntries(MOVEMENT_CATEGORIES.map((category) => [category.code, 0]));
    planSessions(plan).forEach((session) => session.exercises.forEach((exercise) => { counts[exercise.category] = (counts[exercise.category] || 0) + 1; }));
    return MOVEMENT_CATEGORIES.map((category) => ({ ...category, exposures: counts[category.code] || 0 }));
  }

  function buildCycleReview(plan = {}, history = []) {
    const sessions = planSessions(plan);
    const planHistory = normalizedHistory(history).filter((item) => item.planId === plan.id);
    const completed = planHistory.filter((item) => item.state === "COMPLETE");
    const painFlags = planHistory.filter((item) => item.painReported).length;
    return {
      prescribedSessions: sessions.length,
      completedSessions: completed.length,
      compliancePercent: sessions.length ? Math.round((completed.length / sessions.length) * 100) : 0,
      controlledSessions: completed.filter((item) => item.quality === "CONTROLLED").length,
      painFlags,
      coverage: movementCoverage(plan),
      recommendation: deriveProgressionRecommendation(planHistory)
    };
  }

  function stableUuid(value = "") {
    const text = String(value);
    const seeds = [2166136261, 2246822507, 3266489909, 668265263];
    const chunks = seeds.map((seed) => {
      let hash = seed >>> 0;
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index) + index;
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16).padStart(8, "0");
    });
    const chars = chunks.join("").split("");
    chars[12] = "4";
    chars[16] = ["8", "9", "a", "b"][parseInt(chars[16], 16) % 4];
    const hex = chars.join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function performanceEntriesForSession(prescription = {}, execution = {}, options = {}) {
    if (execution.state !== "COMPLETE") return [];
    return (prescription.exercises || []).map((exercise) => ({
      id: stableUuid(`core:${prescription.planId}:${prescription.date}:${exercise.exerciseCode}`),
      userId: options.userId || null,
      performanceDate: prescription.date,
      performanceTime: options.performanceTime || "",
      domain: "core",
      entryType: prescription.session.phase === "CONSOLIDATE" ? "BENCHMARK" : "TRAINING_SET",
      activityCode: exercise.exerciseCode,
      activityName: exercise.name,
      sessionName: prescription.session.title,
      source: "MANUAL",
      evidenceStatus: "SELF REPORTED",
      metrics: exercise.metric === "SECONDS"
        ? { duration_seconds: exercise.sets * exercise.target, rounds: exercise.sets, work_interval_seconds: exercise.target, rest_interval_seconds: exercise.restSeconds }
        : { repetitions: exercise.sets * exercise.target, rounds: exercise.sets, rest_interval_seconds: exercise.restSeconds },
      notes: `${exercise.categoryLabel}; ${execution.quality}; effort ${execution.effort}/10; ${exercise.progression}.`
    }));
  }

  return Object.freeze({
    VERSION,
    GOALS: [...GOALS],
    EXPERIENCE_LEVELS: [...EXPERIENCE_LEVELS],
    EQUIPMENT_LEVELS: [...EQUIPMENT_LEVELS],
    MOVEMENT_CATEGORIES: MOVEMENT_CATEGORIES.map((item) => ({ ...item })),
    EXERCISE_CATALOG: EXERCISE_CATALOG.map((item) => ({ ...item })),
    normalizeProfile,
    weekStartIso,
    addDays,
    sessionDayIndexes,
    buildFourWeekPlan,
    approvePlan,
    planSessions,
    deriveProgressionRecommendation,
    buildDailyPrescription,
    startExecution,
    completeExercise,
    completeSession,
    reportPain,
    movementCoverage,
    buildCycleReview,
    stableUuid,
    performanceEntriesForSession
  });
});
