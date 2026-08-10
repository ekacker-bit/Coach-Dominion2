(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionStrengthTraining = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025I.1";
  const TERMINAL_STATES = Object.freeze(["COMPLETE", "PARTIAL", "STOPPED"]);
  const ACTIVE_STATES = Object.freeze(["IN_PROGRESS", "PAUSED", "REVIEW"]);
  const PATTERN_LABELS = Object.freeze({
    SQUAT: "Squat",
    HINGE: "Hinge",
    HORIZONTAL_PUSH: "Horizontal push",
    VERTICAL_PUSH: "Vertical push",
    HORIZONTAL_PULL: "Horizontal pull",
    VERTICAL_PULL: "Vertical pull",
    UNILATERAL: "Unilateral",
    CARRY: "Carry",
    CORE: "Core"
  });
  const DEFAULT_PROFILE = Object.freeze({
    goal: "GENERAL_STRENGTH",
    daysPerWeek: 3,
    equipment: "FULL_GYM",
    sessionMinutes: 60,
    experience: "INTERMEDIATE"
  });

  const EXERCISES = Object.freeze({
    BACK_SQUAT: exercise("BACK_SQUAT", "Back Squat", "SQUAT", 3, 5, 180, ["Goblet Squat", "Leg Press"]),
    FRONT_SQUAT: exercise("FRONT_SQUAT", "Front Squat", "SQUAT", 3, 6, 150, ["Goblet Squat", "Leg Press"]),
    GOBLET_SQUAT: exercise("GOBLET_SQUAT", "Goblet Squat", "SQUAT", 3, 8, 120, ["Bodyweight Box Squat", "Split Squat"]),
    DEADLIFT: exercise("DEADLIFT", "Deadlift", "HINGE", 3, 5, 180, ["Trap Bar Deadlift", "Romanian Deadlift"]),
    TRAP_BAR_DEADLIFT: exercise("TRAP_BAR_DEADLIFT", "Trap Bar Deadlift", "HINGE", 3, 5, 180, ["Deadlift", "Dumbbell Romanian Deadlift"]),
    ROMANIAN_DEADLIFT: exercise("ROMANIAN_DEADLIFT", "Romanian Deadlift", "HINGE", 3, 8, 150, ["Dumbbell Romanian Deadlift", "Hip Thrust"]),
    DB_ROMANIAN_DEADLIFT: exercise("DB_ROMANIAN_DEADLIFT", "Dumbbell Romanian Deadlift", "HINGE", 3, 8, 120, ["Hip Hinge", "Single-Leg Romanian Deadlift"]),
    BENCH_PRESS: exercise("BENCH_PRESS", "Bench Press", "HORIZONTAL_PUSH", 3, 5, 180, ["Dumbbell Bench Press", "Push-Up"]),
    DB_BENCH_PRESS: exercise("DB_BENCH_PRESS", "Dumbbell Bench Press", "HORIZONTAL_PUSH", 3, 8, 120, ["Push-Up", "Floor Press"]),
    INCLINE_DB_PRESS: exercise("INCLINE_DB_PRESS", "Incline Dumbbell Press", "HORIZONTAL_PUSH", 3, 8, 120, ["Dumbbell Bench Press", "Push-Up"]),
    PUSH_UP: exercise("PUSH_UP", "Push-Up", "HORIZONTAL_PUSH", 3, 10, 90, ["Incline Push-Up", "Kneeling Push-Up"], "reps"),
    OVERHEAD_PRESS: exercise("OVERHEAD_PRESS", "Overhead Press", "VERTICAL_PUSH", 3, 6, 150, ["Dumbbell Shoulder Press", "Landmine Press"]),
    DB_SHOULDER_PRESS: exercise("DB_SHOULDER_PRESS", "Dumbbell Shoulder Press", "VERTICAL_PUSH", 3, 8, 120, ["Half-Kneeling Press", "Push-Up"]),
    ONE_ARM_ROW: exercise("ONE_ARM_ROW", "One-Arm Row", "HORIZONTAL_PULL", 3, 8, 120, ["Chest-Supported Row", "Seated Cable Row"]),
    SEATED_CABLE_ROW: exercise("SEATED_CABLE_ROW", "Seated Cable Row", "HORIZONTAL_PULL", 3, 8, 120, ["One-Arm Row", "Chest-Supported Row"]),
    BAND_ROW: exercise("BAND_ROW", "Band Row", "HORIZONTAL_PULL", 3, 12, 90, ["One-Arm Row", "Prone Y-T-W"], "reps"),
    LAT_PULLDOWN: exercise("LAT_PULLDOWN", "Lat Pulldown", "VERTICAL_PULL", 3, 8, 120, ["Assisted Pull-Up", "Band Pulldown"]),
    PULL_UP: exercise("PULL_UP", "Assisted Pull-Up", "VERTICAL_PULL", 3, 6, 120, ["Band Pulldown", "One-Arm Row"], "reps"),
    REVERSE_LUNGE: exercise("REVERSE_LUNGE", "Reverse Lunge", "UNILATERAL", 2, 8, 90, ["Split Squat", "Step-Up"]),
    SPLIT_SQUAT: exercise("SPLIT_SQUAT", "Split Squat", "UNILATERAL", 3, 8, 90, ["Reverse Lunge", "Step-Up"]),
    STEP_UP: exercise("STEP_UP", "Step-Up", "UNILATERAL", 2, 10, 90, ["Reverse Lunge", "Split Squat"]),
    SINGLE_LEG_RDL: exercise("SINGLE_LEG_RDL", "Single-Leg Romanian Deadlift", "UNILATERAL", 2, 8, 90, ["Reverse Lunge", "Step-Up"]),
    HIP_THRUST: exercise("HIP_THRUST", "Hip Thrust", "HINGE", 3, 10, 120, ["Glute Bridge", "Romanian Deadlift"]),
    FARMER_CARRY: exercise("FARMER_CARRY", "Farmer Carry", "CARRY", 3, 30, 90, ["Suitcase Carry", "Front-Rack Carry"], "seconds"),
    DEAD_BUG: exercise("DEAD_BUG", "Dead Bug", "CORE", 2, 8, 60, ["Bird Dog", "Plank"], "reps"),
    PALLOF_PRESS: exercise("PALLOF_PRESS", "Pallof Press", "CORE", 2, 10, 60, ["Side Plank", "Dead Bug"], "reps"),
    PLANK: exercise("PLANK", "Plank", "CORE", 2, 30, 60, ["Dead Bug", "Side Plank"], "seconds")
  });

  const TEMPLATES = Object.freeze({
    FULL_GYM: Object.freeze({
      2: [
        session("FULL_BODY_A", "Full Body A", ["BACK_SQUAT", "BENCH_PRESS", "ONE_ARM_ROW", "ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "DEAD_BUG"]),
        session("FULL_BODY_B", "Full Body B", ["TRAP_BAR_DEADLIFT", "OVERHEAD_PRESS", "LAT_PULLDOWN", "GOBLET_SQUAT", "HIP_THRUST", "PALLOF_PRESS"])
      ],
      3: [
        session("FULL_BODY_A", "Full Body A", ["BACK_SQUAT", "BENCH_PRESS", "ONE_ARM_ROW", "ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "DEAD_BUG"]),
        session("FULL_BODY_B", "Full Body B", ["TRAP_BAR_DEADLIFT", "OVERHEAD_PRESS", "LAT_PULLDOWN", "GOBLET_SQUAT", "HIP_THRUST", "PALLOF_PRESS"]),
        session("FULL_BODY_C", "Full Body C", ["FRONT_SQUAT", "INCLINE_DB_PRESS", "SEATED_CABLE_ROW", "SINGLE_LEG_RDL", "STEP_UP", "FARMER_CARRY", "PLANK"])
      ],
      4: [
        session("LOWER_A", "Lower A", ["BACK_SQUAT", "ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "FARMER_CARRY", "DEAD_BUG"]),
        session("UPPER_A", "Upper A", ["BENCH_PRESS", "ONE_ARM_ROW", "OVERHEAD_PRESS", "LAT_PULLDOWN", "INCLINE_DB_PRESS", "PALLOF_PRESS"]),
        session("LOWER_B", "Lower B", ["TRAP_BAR_DEADLIFT", "FRONT_SQUAT", "SINGLE_LEG_RDL", "STEP_UP", "FARMER_CARRY", "PLANK"]),
        session("UPPER_B", "Upper B", ["INCLINE_DB_PRESS", "SEATED_CABLE_ROW", "DB_SHOULDER_PRESS", "LAT_PULLDOWN", "PUSH_UP", "DEAD_BUG"])
      ],
      5: [
        session("LOWER_A", "Lower A", ["BACK_SQUAT", "ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "FARMER_CARRY", "DEAD_BUG"]),
        session("UPPER_A", "Upper A", ["BENCH_PRESS", "ONE_ARM_ROW", "OVERHEAD_PRESS", "LAT_PULLDOWN", "PALLOF_PRESS"]),
        session("LOWER_B", "Lower B", ["TRAP_BAR_DEADLIFT", "FRONT_SQUAT", "SINGLE_LEG_RDL", "STEP_UP", "PLANK"]),
        session("UPPER_B", "Upper B", ["INCLINE_DB_PRESS", "SEATED_CABLE_ROW", "DB_SHOULDER_PRESS", "PULL_UP", "DEAD_BUG"]),
        session("FULL_BODY_C", "Full Body C", ["GOBLET_SQUAT", "BENCH_PRESS", "ONE_ARM_ROW", "DB_ROMANIAN_DEADLIFT", "FARMER_CARRY"])
      ],
      6: [
        session("PUSH_A", "Push A", ["BENCH_PRESS", "OVERHEAD_PRESS", "INCLINE_DB_PRESS", "PUSH_UP", "PALLOF_PRESS"]),
        session("PULL_A", "Pull A", ["DEADLIFT", "ONE_ARM_ROW", "LAT_PULLDOWN", "SEATED_CABLE_ROW", "FARMER_CARRY"]),
        session("LEGS_A", "Legs A", ["BACK_SQUAT", "ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "DEAD_BUG"]),
        session("PUSH_B", "Push B", ["INCLINE_DB_PRESS", "DB_SHOULDER_PRESS", "BENCH_PRESS", "PUSH_UP", "PLANK"]),
        session("PULL_B", "Pull B", ["TRAP_BAR_DEADLIFT", "SEATED_CABLE_ROW", "PULL_UP", "ONE_ARM_ROW", "FARMER_CARRY"]),
        session("LEGS_B", "Legs B", ["FRONT_SQUAT", "SINGLE_LEG_RDL", "STEP_UP", "HIP_THRUST", "PALLOF_PRESS"])
      ]
    }),
    DUMBBELLS: Object.freeze({
      2: [
        session("DB_FULL_BODY_A", "Dumbbell Full Body A", ["GOBLET_SQUAT", "DB_BENCH_PRESS", "ONE_ARM_ROW", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "DEAD_BUG"]),
        session("DB_FULL_BODY_B", "Dumbbell Full Body B", ["SPLIT_SQUAT", "DB_SHOULDER_PRESS", "ONE_ARM_ROW", "HIP_THRUST", "SINGLE_LEG_RDL", "FARMER_CARRY", "PLANK"])
      ],
      3: [
        session("DB_FULL_BODY_A", "Dumbbell Full Body A", ["GOBLET_SQUAT", "DB_BENCH_PRESS", "ONE_ARM_ROW", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "DEAD_BUG"]),
        session("DB_FULL_BODY_B", "Dumbbell Full Body B", ["SPLIT_SQUAT", "DB_SHOULDER_PRESS", "ONE_ARM_ROW", "HIP_THRUST", "SINGLE_LEG_RDL", "FARMER_CARRY"]),
        session("DB_FULL_BODY_C", "Dumbbell Full Body C", ["GOBLET_SQUAT", "INCLINE_DB_PRESS", "ONE_ARM_ROW", "DB_ROMANIAN_DEADLIFT", "STEP_UP", "PLANK"])
      ],
      4: [
        session("DB_LOWER_A", "Dumbbell Lower A", ["GOBLET_SQUAT", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "FARMER_CARRY", "DEAD_BUG"]),
        session("DB_UPPER_A", "Dumbbell Upper A", ["DB_BENCH_PRESS", "ONE_ARM_ROW", "DB_SHOULDER_PRESS", "PUSH_UP", "FARMER_CARRY", "PALLOF_PRESS"]),
        session("DB_LOWER_B", "Dumbbell Lower B", ["SPLIT_SQUAT", "SINGLE_LEG_RDL", "STEP_UP", "HIP_THRUST", "FARMER_CARRY", "PLANK"]),
        session("DB_UPPER_B", "Dumbbell Upper B", ["INCLINE_DB_PRESS", "ONE_ARM_ROW", "DB_SHOULDER_PRESS", "PUSH_UP", "FARMER_CARRY", "DEAD_BUG"])
      ],
      5: [
        session("DB_LOWER_A", "Dumbbell Lower A", ["GOBLET_SQUAT", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "DEAD_BUG"]),
        session("DB_UPPER_A", "Dumbbell Upper A", ["DB_BENCH_PRESS", "ONE_ARM_ROW", "DB_SHOULDER_PRESS", "PUSH_UP", "PALLOF_PRESS"]),
        session("DB_LOWER_B", "Dumbbell Lower B", ["SPLIT_SQUAT", "SINGLE_LEG_RDL", "STEP_UP", "HIP_THRUST", "PLANK"]),
        session("DB_UPPER_B", "Dumbbell Upper B", ["INCLINE_DB_PRESS", "ONE_ARM_ROW", "DB_SHOULDER_PRESS", "PUSH_UP", "FARMER_CARRY"]),
        session("DB_FULL_BODY_C", "Dumbbell Full Body C", ["GOBLET_SQUAT", "DB_BENCH_PRESS", "ONE_ARM_ROW", "DB_ROMANIAN_DEADLIFT", "DEAD_BUG"])
      ],
      6: [
        session("DB_PUSH_A", "Dumbbell Push A", ["DB_BENCH_PRESS", "DB_SHOULDER_PRESS", "INCLINE_DB_PRESS", "PUSH_UP", "PALLOF_PRESS"]),
        session("DB_PULL_A", "Dumbbell Pull A", ["DB_ROMANIAN_DEADLIFT", "ONE_ARM_ROW", "BAND_ROW", "FARMER_CARRY", "DEAD_BUG"]),
        session("DB_LEGS_A", "Dumbbell Legs A", ["GOBLET_SQUAT", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "PLANK"]),
        session("DB_PUSH_B", "Dumbbell Push B", ["INCLINE_DB_PRESS", "DB_SHOULDER_PRESS", "DB_BENCH_PRESS", "PUSH_UP", "DEAD_BUG"]),
        session("DB_PULL_B", "Dumbbell Pull B", ["SINGLE_LEG_RDL", "ONE_ARM_ROW", "BAND_ROW", "FARMER_CARRY", "PALLOF_PRESS"]),
        session("DB_LEGS_B", "Dumbbell Legs B", ["SPLIT_SQUAT", "STEP_UP", "HIP_THRUST", "GOBLET_SQUAT", "PLANK"])
      ]
    }),
    BODYWEIGHT_BANDS: Object.freeze({
      2: [
        session("MINIMAL_A", "Minimal Equipment A", ["GOBLET_SQUAT", "PUSH_UP", "BAND_ROW", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "DEAD_BUG"]),
        session("MINIMAL_B", "Minimal Equipment B", ["SPLIT_SQUAT", "DB_SHOULDER_PRESS", "PULL_UP", "HIP_THRUST", "STEP_UP", "PLANK"])
      ],
      3: [
        session("MINIMAL_A", "Minimal Equipment A", ["GOBLET_SQUAT", "PUSH_UP", "BAND_ROW", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "DEAD_BUG"]),
        session("MINIMAL_B", "Minimal Equipment B", ["SPLIT_SQUAT", "DB_SHOULDER_PRESS", "PULL_UP", "HIP_THRUST", "STEP_UP", "PLANK"]),
        session("MINIMAL_C", "Minimal Equipment C", ["GOBLET_SQUAT", "PUSH_UP", "BAND_ROW", "SINGLE_LEG_RDL", "REVERSE_LUNGE", "PALLOF_PRESS"])
      ],
      4: [
        session("MINIMAL_LOWER_A", "Minimal Lower A", ["GOBLET_SQUAT", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "STEP_UP", "DEAD_BUG"]),
        session("MINIMAL_UPPER_A", "Minimal Upper A", ["PUSH_UP", "BAND_ROW", "DB_SHOULDER_PRESS", "PULL_UP", "PALLOF_PRESS", "PLANK"]),
        session("MINIMAL_LOWER_B", "Minimal Lower B", ["SPLIT_SQUAT", "SINGLE_LEG_RDL", "STEP_UP", "HIP_THRUST", "GOBLET_SQUAT", "PLANK"]),
        session("MINIMAL_UPPER_B", "Minimal Upper B", ["PUSH_UP", "ONE_ARM_ROW", "DB_SHOULDER_PRESS", "BAND_ROW", "DEAD_BUG", "PALLOF_PRESS"])
      ],
      5: [
        session("MINIMAL_LOWER_A", "Minimal Lower A", ["GOBLET_SQUAT", "DB_ROMANIAN_DEADLIFT", "REVERSE_LUNGE", "HIP_THRUST", "DEAD_BUG"]),
        session("MINIMAL_UPPER_A", "Minimal Upper A", ["PUSH_UP", "BAND_ROW", "DB_SHOULDER_PRESS", "PULL_UP", "PALLOF_PRESS"]),
        session("MINIMAL_LOWER_B", "Minimal Lower B", ["SPLIT_SQUAT", "SINGLE_LEG_RDL", "STEP_UP", "HIP_THRUST", "PLANK"]),
        session("MINIMAL_UPPER_B", "Minimal Upper B", ["PUSH_UP", "ONE_ARM_ROW", "DB_SHOULDER_PRESS", "BAND_ROW", "DEAD_BUG"]),
        session("MINIMAL_FULL_BODY", "Minimal Full Body", ["GOBLET_SQUAT", "PUSH_UP", "BAND_ROW", "DB_ROMANIAN_DEADLIFT", "FARMER_CARRY"])
      ],
      6: [
        session("MINIMAL_PUSH_A", "Minimal Push A", ["PUSH_UP", "DB_SHOULDER_PRESS", "INCLINE_DB_PRESS", "PALLOF_PRESS", "PLANK"]),
        session("MINIMAL_PULL_A", "Minimal Pull A", ["DB_ROMANIAN_DEADLIFT", "BAND_ROW", "PULL_UP", "ONE_ARM_ROW", "FARMER_CARRY"]),
        session("MINIMAL_LEGS_A", "Minimal Legs A", ["GOBLET_SQUAT", "REVERSE_LUNGE", "HIP_THRUST", "STEP_UP", "DEAD_BUG"]),
        session("MINIMAL_PUSH_B", "Minimal Push B", ["PUSH_UP", "DB_SHOULDER_PRESS", "DB_BENCH_PRESS", "PALLOF_PRESS", "DEAD_BUG"]),
        session("MINIMAL_PULL_B", "Minimal Pull B", ["SINGLE_LEG_RDL", "BAND_ROW", "PULL_UP", "ONE_ARM_ROW", "FARMER_CARRY"]),
        session("MINIMAL_LEGS_B", "Minimal Legs B", ["SPLIT_SQUAT", "DB_ROMANIAN_DEADLIFT", "STEP_UP", "HIP_THRUST", "PLANK"])
      ]
    })
  });

  function exercise(id, name, pattern, sets, reps, restSeconds, substitutions, repUnit = "reps") {
    return Object.freeze({ id, name, pattern, sets, reps, restSeconds, substitutions, repUnit });
  }

  function session(id, name, exerciseIds) {
    return Object.freeze({ id, name, exerciseIds: Object.freeze(exerciseIds) });
  }

  function clamp(value, min, max, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed))) : fallback;
  }

  function normalizeProfile(profile = {}) {
    const goal = ["GENERAL_STRENGTH", "MUSCLE", "ATHLETIC_SUPPORT"].includes(profile.goal) ? profile.goal : DEFAULT_PROFILE.goal;
    const equipment = ["FULL_GYM", "DUMBBELLS", "BODYWEIGHT_BANDS"].includes(profile.equipment) ? profile.equipment : DEFAULT_PROFILE.equipment;
    const experience = ["FOUNDATION", "INTERMEDIATE", "EXPERIENCED"].includes(profile.experience) ? profile.experience : DEFAULT_PROFILE.experience;
    return {
      goal,
      daysPerWeek: clamp(profile.daysPerWeek, 2, 6, DEFAULT_PROFILE.daysPerWeek),
      equipment,
      sessionMinutes: [45, 60, 75].includes(Number(profile.sessionMinutes)) ? Number(profile.sessionMinutes) : DEFAULT_PROFILE.sessionMinutes,
      experience
    };
  }

  function normalizeName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/dumbbell|barbell|single arm|one arm|one-arm|db/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function evidenceDate(item = {}) {
    return String(item.performanceDate || item.date || item.completedAt || item.createdAt || "");
  }

  function evidenceName(item = {}) {
    return item.exerciseName || item.activityName || item.name || item.title || "";
  }

  function evidenceMetrics(item = {}) {
    const metrics = item.metrics || {};
    const load = Number(metrics.weight ?? metrics.load ?? item.weight ?? item.load);
    const reps = Number(metrics.repetitions ?? metrics.reps ?? item.reps);
    const unit = metrics.weight_unit || metrics.unit || item.unit || "lb";
    return {
      load: Number.isFinite(load) && load > 0 ? load : 0,
      reps: Number.isFinite(reps) && reps > 0 ? Math.round(reps) : null,
      unit
    };
  }

  function matchesEvidence(definition, item) {
    const target = normalizeName(definition.name);
    const candidate = normalizeName(evidenceName(item));
    if (!candidate) return false;
    if (target === candidate || target.includes(candidate) || candidate.includes(target)) return true;
    return definition.substitutions.some((name) => {
      const alternative = normalizeName(name);
      return alternative === candidate || alternative.includes(candidate) || candidate.includes(alternative);
    });
  }

  function personalizeExercise(definition, evidence = [], profile = DEFAULT_PROFILE) {
    const matches = evidence
      .filter((item) => String(item.domain || "strength").toLowerCase() === "strength" && matchesEvidence(definition, item))
      .sort((a, b) => evidenceDate(b).localeCompare(evidenceDate(a)));
    const latest = matches[0] || null;
    const metrics = evidenceMetrics(latest || {});
    const repTarget = profile.goal === "MUSCLE" && definition.reps < 8 ? 8 : definition.reps;
    return {
      exerciseCode: definition.id,
      exerciseName: definition.name,
      pattern: definition.pattern,
      patternLabel: PATTERN_LABELS[definition.pattern],
      recommendedSets: definition.sets,
      targetReps: repTarget,
      repUnit: definition.repUnit,
      recommendedLoad: metrics.load,
      unit: metrics.unit,
      restSeconds: definition.restSeconds,
      tempo: definition.pattern === "CORE" || definition.pattern === "CARRY" ? "CONTROLLED" : "2-0-X-1",
      substitutions: [...definition.substitutions],
      action: matches.length >= 2 && metrics.load ? "PERSONALIZED" : metrics.load ? "EVIDENCE ANCHORED" : "TECHNIQUE FIRST",
      rationale: metrics.load
        ? `Load is anchored to the latest supported ${definition.name} evidence; prescribed sets come from the balanced program.`
        : "No reliable load history exists. Choose a technique-first load that leaves about three reps in reserve.",
      evidenceCount: matches.length,
      latestEvidenceDate: latest ? evidenceDate(latest).slice(0, 10) : null
    };
  }

  function buildStrengthProgram(profileInput = {}, evidence = [], options = {}) {
    const profile = normalizeProfile(profileInput);
    const generatedAt = options.generatedAt || new Date().toISOString();
    const startDate = options.startDate || generatedAt.slice(0, 10);
    const templates = TEMPLATES[profile.equipment][profile.daysPerWeek];
    const sessions = templates.map((template, index) => ({
      id: template.id,
      name: template.name,
      sequence: index + 1,
      exercises: template.exerciseIds.map((id) => personalizeExercise(EXERCISES[id], evidence, profile))
    }));
    return {
      version: VERSION,
      id: options.id || `strength-${startDate}-${profile.daysPerWeek}-${profile.equipment.toLowerCase()}`,
      status: "DRAFT",
      generatedAt,
      startDate,
      profile,
      sessions,
      safeguards: [
        "No automatic max testing.",
        "Stop loaded work if pain appears.",
        "New movements begin with a technique-first load.",
        "Readiness may reduce work but never silently increase it."
      ]
    };
  }

  function approvePlan(plan = {}, approvedAt = new Date().toISOString()) {
    if (!Array.isArray(plan.sessions) || !plan.sessions.length) throw new Error("A complete strength draft is required before approval.");
    return JSON.parse(JSON.stringify({ ...plan, status: "APPROVED", revision: Number(plan.revision || 1), approvedAt }));
  }

  function movementCoverage(plan = {}) {
    const counts = new Map();
    (plan.sessions || []).forEach((item) => (item.exercises || []).forEach((exerciseItem) => {
      counts.set(exerciseItem.pattern, Number(counts.get(exerciseItem.pattern) || 0) + 1);
    }));
    return [...counts.entries()].map(([code, exposures]) => ({ code, label: PATTERN_LABELS[code] || code, exposures }));
  }

  function isTerminal(state) {
    return TERMINAL_STATES.includes(String(state || ""));
  }

  function terminalHistory(history = [], planId) {
    return history.filter((item) => item?.planId === planId && isTerminal(item.state));
  }

  function selectSession(plan = {}, history = []) {
    const sessions = plan.sessions || [];
    if (!sessions.length) return null;
    const completedOccurrences = new Set(terminalHistory(history, plan.id).map((item) => `${item.date || "undated"}:${item.sessionId || item.id}`)).size;
    return sessions[completedOccurrences % sessions.length];
  }

  function readinessPolicy(readiness = {}) {
    if (readiness.pain === true || readiness.state === "RED") {
      return { code: "SAFETY_HOLD", state: "RECOVERY ONLY", detail: "Pain or RED readiness removed loaded training." };
    }
    if (readiness.state === "YELLOW") {
      return { code: "VOLUME_REDUCED", state: "READY", detail: "Readiness reduced each exercise by one set while preserving the approved exercise selection." };
    }
    return { code: "APPROVED_VOLUME", state: "READY", detail: "The approved session is available without an automatic increase." };
  }

  function prescriptionFromSession(plan = {}, selected = null, options = {}) {
    const policy = readinessPolicy(options.readiness || {});
    const blocked = policy.state === "RECOVERY ONLY";
    const exercises = blocked ? [] : (selected?.exercises || []).map((item) => ({
      ...item,
      plannedSets: item.recommendedSets,
      recommendedSets: policy.code === "VOLUME_REDUCED" ? Math.max(1, item.recommendedSets - 1) : item.recommendedSets
    }));
    return {
      version: VERSION,
      planId: plan.id,
      sessionId: selected?.id || null,
      sessionName: selected?.name || "Strength Session",
      date: options.today || new Date().toISOString().slice(0, 10),
      status: blocked ? "SAFETY HOLD" : "READY",
      state: policy.state,
      exercises,
      adjustment: policy,
      profile: plan.profile
    };
  }

  function planRequiredPrescription(options = {}) {
    return {
      version: VERSION,
      date: options.today || new Date().toISOString().slice(0, 10),
      status: "PLAN REQUIRED",
      state: "NEEDS PROGRAM",
      exercises: [],
      adjustment: { code: "PLAN_REQUIRED", detail: "Approve a balanced strength plan before training." }
    };
  }

  function buildSessionPrescription(plan = {}, sessionId, options = {}) {
    if (plan.status !== "APPROVED") return planRequiredPrescription(options);
    const selected = (plan.sessions || []).find((item) => item.id === sessionId);
    if (!selected) {
      return {
        ...planRequiredPrescription(options),
        planId: plan.id,
        status: "SESSION REQUIRED",
        state: "NEEDS SCHEDULE",
        adjustment: { code: "SESSION_REQUIRED", detail: "The scheduled strength session is no longer part of the approved plan." }
      };
    }
    return prescriptionFromSession(plan, selected, options);
  }

  function buildDailyPrescription(plan = {}, history = [], options = {}) {
    if (plan.status !== "APPROVED") return planRequiredPrescription(options);
    return prescriptionFromSession(plan, selectSession(plan, history), options);
  }

  function sessionLaunchDecision(plan = {}, sessionId, execution = {}, readiness = {}) {
    if (plan.status !== "APPROVED") {
      return { allowed: false, mode: "BLOCKED", label: "Approve plan first", message: "Approve the Strength plan before logging a workout." };
    }
    const selected = (plan.sessions || []).find((item) => item.id === sessionId);
    if (!selected) {
      return { allowed: false, mode: "BLOCKED", label: "Session unavailable", message: "This session is not part of the approved Strength plan." };
    }
    if (readiness.pain === true || readiness.state === "RED") {
      return { allowed: false, mode: "SAFETY_HOLD", label: "Safety hold", message: "Pain or RED readiness blocks loaded Strength logging today." };
    }
    const state = String(execution?.state || "");
    const sameSession = execution?.planId === plan.id && execution?.sessionId === sessionId;
    if (ACTIVE_STATES.includes(state)) {
      if (!sameSession) {
        return { allowed: false, mode: "ACTIVE_OTHER", label: "Finish active workout", message: `Finish or stop ${execution.sessionName || "the active workout"} before opening another session.` };
      }
      const mode = state === "PAUSED" ? "RESUME" : state === "REVIEW" ? "REVIEW" : "CONTINUE";
      const label = state === "PAUSED" ? "Resume workout" : state === "REVIEW" ? "Review workout" : "Continue logging";
      return { allowed: true, mode, label, message: `${selected.name} is already open.` };
    }
    if (isTerminal(state)) {
      return { allowed: false, mode: "COMPLETE_TODAY", label: "Workout logged", message: "Today already has preserved Strength evidence." };
    }
    return { allowed: true, mode: "START", label: "Log this workout", message: `Start ${selected.name} and open the set logger.` };
  }

  function executionForPrescription(prescription = {}, options = {}) {
    const attempt = Math.max(1, Number(options.attempt || 1));
    return {
      version: VERSION,
      id: `${prescription.planId || "plan"}:${prescription.sessionId || "session"}:${prescription.date || "date"}:attempt-${attempt}`,
      planId: prescription.planId || null,
      sessionId: prescription.sessionId || null,
      sessionName: prescription.sessionName || "Strength Session",
      date: prescription.date || new Date().toISOString().slice(0, 10),
      attempt,
      state: "READY",
      sessionSnapshot: JSON.parse(JSON.stringify(prescription)),
      setLogs: {},
      skipped: {},
      substitutions: {},
      painReported: false,
      activeSegments: [],
      restUntil: null,
      reviewNotes: "",
      updatedAt: new Date().toISOString()
    };
  }

  function startWorkout(execution = {}, prescription = execution.sessionSnapshot || {}, startedAt = new Date().toISOString()) {
    if (isTerminal(execution.state)) return { ...execution };
    const segments = [...(execution.activeSegments || [])];
    if (!segments.some((item) => !item.endedAt)) segments.push({ startedAt, endedAt: null });
    return {
      ...executionForPrescription(prescription),
      ...execution,
      state: "IN_PROGRESS",
      startedAt: execution.startedAt || startedAt,
      activeSegments: segments,
      pauseReason: null,
      updatedAt: startedAt
    };
  }

  function closeActiveSegment(execution = {}, endedAt = new Date().toISOString()) {
    const segments = [...(execution.activeSegments || [])];
    const index = segments.findLastIndex((item) => !item.endedAt);
    if (index >= 0) segments[index] = { ...segments[index], endedAt };
    return segments;
  }

  function pauseWorkout(execution = {}, pausedAt = new Date().toISOString(), reason = "Paused by user") {
    if (execution.state !== "IN_PROGRESS") return { ...execution };
    return {
      ...execution,
      state: "PAUSED",
      activeSegments: closeActiveSegment(execution, pausedAt),
      pausedAt,
      pauseReason: reason,
      updatedAt: pausedAt
    };
  }

  function resumeWorkout(execution = {}, resumedAt = new Date().toISOString()) {
    if (!["PAUSED", "REVIEW"].includes(execution.state)) return { ...execution };
    return {
      ...execution,
      state: "IN_PROGRESS",
      activeSegments: [...(execution.activeSegments || []), { startedAt: resumedAt, endedAt: null }],
      resumedAt,
      pauseReason: null,
      updatedAt: resumedAt
    };
  }

  function recoverInterruptedExecution(execution = {}, now = new Date().toISOString(), idleMinutes = 30) {
    if (execution.state !== "IN_PROGRESS") return { ...execution };
    const lastActivity = Date.parse(execution.updatedAt || execution.startedAt || "");
    const current = Date.parse(now);
    if (!Number.isFinite(lastActivity) || !Number.isFinite(current) || current - lastActivity < idleMinutes * 60000) return { ...execution };
    return {
      ...execution,
      state: "PAUSED",
      activeSegments: closeActiveSegment(execution, new Date(lastActivity).toISOString()),
      pausedAt: new Date(lastActivity).toISOString(),
      pauseReason: "Paused automatically after inactivity",
      recoveredAt: now,
      updatedAt: now
    };
  }

  function prescribedExercise(execution = {}, exerciseId) {
    return (execution.sessionSnapshot?.exercises || []).find((item) => item.exerciseCode === exerciseId || item.id === exerciseId) || null;
  }

  function recordSet(execution = {}, exerciseId, values = {}, completedAt = new Date().toISOString()) {
    if (execution.state !== "IN_PROGRESS") throw new Error("Start the workout before recording a set.");
    const exerciseItem = prescribedExercise(execution, exerciseId);
    if (!exerciseItem) throw new Error("Exercise is not part of the active session.");
    const setLogs = { ...(execution.setLogs || {}) };
    const logs = [...(setLogs[exerciseId] || [])];
    const kind = String(values.kind || "WORK").toUpperCase() === "WARMUP" ? "WARMUP" : "WORK";
    const workLogs = logs.filter((item) => String(item.kind || "WORK").toUpperCase() !== "WARMUP");
    const setTarget = Number(exerciseItem.recommendedSets || exerciseItem.sets || 1);
    if (kind === "WORK" && workLogs.length >= setTarget) return { ...execution };
    const reps = clamp(values.reps, 0, 1000, Number(exerciseItem.targetReps || 0));
    const loadValue = Number(values.load);
    const rpeValue = values.rpe === null || values.rpe === undefined || values.rpe === "" ? null : Number(values.rpe);
    logs.push({
      id: `${exerciseId}:${completedAt}:${logs.length + 1}`,
      setNumber: kind === "WORK" ? workLogs.length + 1 : logs.filter((item) => item.kind === "WARMUP").length + 1,
      kind,
      reps,
      load: Number.isFinite(loadValue) && loadValue >= 0 ? loadValue : Number(exerciseItem.recommendedLoad || 0),
      unit: exerciseItem.unit || "lb",
      rpe: rpeValue !== null && Number.isFinite(rpeValue) ? Math.max(1, Math.min(10, Math.round(rpeValue * 2) / 2)) : null,
      completedAt
    });
    setLogs[exerciseId] = logs;
    const restSeconds = kind === "WORK" ? Number(exerciseItem.restSeconds || 0) : 0;
    return {
      ...execution,
      setLogs,
      restUntil: restSeconds ? new Date(Date.parse(completedAt) + restSeconds * 1000).toISOString() : null,
      updatedAt: completedAt
    };
  }

  function editSet(execution = {}, exerciseId, setId, values = {}, updatedAt = new Date().toISOString()) {
    if (!["IN_PROGRESS", "PAUSED", "REVIEW"].includes(execution.state)) return { ...execution };
    const logs = [...(execution.setLogs?.[exerciseId] || [])];
    const index = logs.findIndex((item) => item.id === setId);
    if (index < 0) return { ...execution };
    const current = logs[index];
    const reps = clamp(values.reps, 0, 1000, Number(current.reps || 0));
    const load = Number(values.load);
    const rpe = values.rpe === "" || values.rpe === null || values.rpe === undefined ? null : Number(values.rpe);
    logs[index] = {
      ...current,
      reps,
      load: Number.isFinite(load) && load >= 0 ? load : Number(current.load || 0),
      rpe: rpe !== null && Number.isFinite(rpe) ? Math.max(1, Math.min(10, Math.round(rpe * 2) / 2)) : null,
      editedAt: updatedAt
    };
    return {
      ...execution,
      setLogs: { ...(execution.setLogs || {}), [exerciseId]: logs },
      updatedAt
    };
  }

  function undoLastSet(execution = {}, exerciseId, updatedAt = new Date().toISOString()) {
    if (execution.state !== "IN_PROGRESS") return { ...execution };
    const setLogs = { ...(execution.setLogs || {}) };
    const logs = [...(setLogs[exerciseId] || [])];
    logs.pop();
    setLogs[exerciseId] = logs;
    return { ...execution, setLogs, updatedAt };
  }

  function skipExercise(execution = {}, exerciseId, reason = "Skipped by user", updatedAt = new Date().toISOString()) {
    if (execution.state !== "IN_PROGRESS") return { ...execution };
    return {
      ...execution,
      skipped: { ...(execution.skipped || {}), [exerciseId]: { reason, at: updatedAt } },
      updatedAt
    };
  }

  function useSubstitution(execution = {}, exerciseId, substitution, updatedAt = new Date().toISOString()) {
    if (execution.state !== "IN_PROGRESS" || !substitution) return { ...execution };
    return {
      ...execution,
      substitutions: { ...(execution.substitutions || {}), [exerciseId]: { name: substitution, at: updatedAt } },
      updatedAt
    };
  }

  function plannedSetCount(prescription = {}) {
    return (prescription.exercises || []).reduce((sum, item) => sum + Number(item.recommendedSets || item.sets || 0), 0);
  }

  function completedSetCount(execution = {}) {
    return Object.values(execution.setLogs || {}).reduce((sum, logs) => sum + (Array.isArray(logs)
      ? logs.filter((item) => String(item.kind || "WORK").toUpperCase() !== "WARMUP").length
      : 0), 0);
  }

  function activeDurationMinutes(execution = {}, endedAt = null) {
    const segments = execution.activeSegments || [];
    if (segments.length) {
      const fallbackEnd = Date.parse(endedAt || execution.completedAt || new Date().toISOString());
      const milliseconds = segments.reduce((sum, item) => {
        const start = Date.parse(item.startedAt || "");
        const end = Date.parse(item.endedAt || "") || fallbackEnd;
        return Number.isFinite(start) && Number.isFinite(end) && end >= start ? sum + (end - start) : sum;
      }, 0);
      return Math.max(0, Math.round(milliseconds / 60000));
    }
    const start = Date.parse(execution.startedAt || "");
    const end = Date.parse(endedAt || execution.completedAt || "");
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
    const legacyMinutes = Math.round((end - start) / 60000);
    return legacyMinutes <= 240 ? legacyMinutes : null;
  }

  function sessionSummary(execution = {}, prescription = execution.sessionSnapshot || {}) {
    const setsPlanned = plannedSetCount(prescription);
    const setsCompleted = completedSetCount(execution);
    const volume = Object.values(execution.setLogs || {}).flat()
      .filter((item) => String(item.kind || "WORK").toUpperCase() !== "WARMUP")
      .reduce((sum, item) => sum + Number(item.reps || 0) * Number(item.load || 0), 0);
    const exercisesCompleted = (prescription.exercises || []).filter((item) => {
      const id = item.exerciseCode || item.id;
      return Number((execution.setLogs?.[id] || []).filter((log) => String(log.kind || "WORK").toUpperCase() !== "WARMUP").length) >= Number(item.recommendedSets || item.sets || 1);
    }).length;
    const durationMinutes = activeDurationMinutes(execution);
    return {
      setsPlanned,
      setsCompleted,
      exercisesPlanned: (prescription.exercises || []).length,
      exercisesCompleted,
      skippedExercises: Object.keys(execution.skipped || {}).length,
      substitutions: Object.keys(execution.substitutions || {}).length,
      volume: Math.round(volume),
      durationMinutes,
      durationStatus: durationMinutes === null && execution.startedAt ? "UNRELIABLE_LEGACY" : "VERIFIED_ACTIVE_TIME"
    };
  }

  function prepareWorkoutReview(execution = {}, reviewedAt = new Date().toISOString()) {
    if (execution.state !== "IN_PROGRESS" && execution.state !== "PAUSED") return { ...execution };
    return {
      ...execution,
      state: "REVIEW",
      activeSegments: execution.state === "IN_PROGRESS" ? closeActiveSegment(execution, reviewedAt) : [...(execution.activeSegments || [])],
      reviewStartedAt: reviewedAt,
      updatedAt: reviewedAt
    };
  }

  function finishWorkout(execution = {}, options = {}, completedAt = new Date().toISOString()) {
    if (isTerminal(execution.state)) return { ...execution };
    const prescription = execution.sessionSnapshot || {};
    const completed = completedSetCount(execution);
    const planned = plannedSetCount(prescription);
    let state = completed >= planned && planned > 0 ? "COMPLETE" : completed > 0 || Object.keys(execution.skipped || {}).length ? "PARTIAL" : "STOPPED";
    if (options.forceStop || options.painReported) state = "STOPPED";
    const next = {
      ...execution,
      state,
      activeSegments: execution.state === "IN_PROGRESS" ? closeActiveSegment(execution, completedAt) : [...(execution.activeSegments || [])],
      completedAt,
      reason: options.reason || (state === "COMPLETE" ? "All prescribed work recorded." : state === "PARTIAL" ? "Workout finished before every prescribed set was completed." : "Workout stopped before work sets were completed."),
      painReported: Boolean(execution.painReported || options.painReported),
      notes: options.notes || execution.notes || "",
      updatedAt: completedAt
    };
    return { ...next, summary: sessionSummary(next, prescription) };
  }

  function reportPain(execution = {}, completedAt = new Date().toISOString()) {
    return finishWorkout({ ...execution, painReported: true }, {
      forceStop: true,
      painReported: true,
      reason: "Pain reported during the workout. Loaded work stopped."
    }, completedAt);
  }

  function restartWorkout(execution = {}, restartedAt = new Date().toISOString()) {
    if (!isTerminal(execution.state)) return { ...execution };
    return {
      ...executionForPrescription(execution.sessionSnapshot || {}, { attempt: Number(execution.attempt || 1) + 1 }),
      restartedFromExecutionId: execution.id,
      updatedAt: restartedAt
    };
  }

  function roundLoad(value, unit = "lb") {
    const increment = String(unit || "lb").toLowerCase() === "kg" ? 2.5 : 5;
    return Math.max(0, Math.round(Number(value || 0) / increment) * increment);
  }

  function averageRpe(logs = []) {
    const values = logs
      .filter((item) => item.rpe !== null && item.rpe !== undefined && item.rpe !== "")
      .map((item) => Number(item.rpe))
      .filter((value) => Number.isFinite(value));
    if (!values.length) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10;
  }

  function workingLoad(logs = []) {
    const values = logs.map((item) => Number(item.load)).filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 2) / 2;
  }

  function exerciseFromExecution(execution = {}, exerciseCode) {
    return (execution.sessionSnapshot?.exercises || []).find((item) => (item.exerciseCode || item.id) === exerciseCode) || null;
  }

  function exerciseExposure(execution = {}, exerciseItem = {}) {
    const exerciseCode = exerciseItem.exerciseCode || exerciseItem.id;
    const logs = (execution.setLogs?.[exerciseCode] || []).filter((item) => String(item.kind || "WORK").toUpperCase() !== "WARMUP");
    const plannedSets = Number(exerciseItem.recommendedSets || exerciseItem.sets || 0);
    const targetReps = Number(exerciseItem.targetReps || exerciseItem.reps || 0);
    const completedSets = logs.length;
    const rpe = averageRpe(logs);
    const load = workingLoad(logs);
    const targetMet = completedSets >= plannedSets
      && logs.every((item) => Number(item.reps || 0) >= targetReps);
    return {
      exerciseCode,
      completedSets,
      plannedSets,
      targetReps,
      averageRpe: rpe,
      workingLoad: load,
      targetMet,
      skipped: Boolean(execution.skipped?.[exerciseCode]),
      substituted: Boolean(execution.substitutions?.[exerciseCode])
    };
  }

  function workSetsForExercise(execution = {}, exerciseCode) {
    return (execution.setLogs?.[exerciseCode] || [])
      .filter((item) => String(item.kind || "WORK").toUpperCase() !== "WARMUP");
  }

  function exerciseHistory(history = [], exerciseCode, excludeExecutionId = null) {
    return history
      .filter((execution) => execution
        && execution.id !== excludeExecutionId
        && isTerminal(execution.state)
        && exerciseFromExecution(execution, exerciseCode)
        && workSetsForExercise(execution, exerciseCode).length)
      .sort((a, b) => String(b.completedAt || b.updatedAt || "").localeCompare(String(a.completedAt || a.updatedAt || "")));
  }

  function strongestWorkSet(logs = []) {
    return [...logs].sort((a, b) => {
      const aLoad = Number(a.load || 0);
      const bLoad = Number(b.load || 0);
      const aReps = Number(a.reps || 0);
      const bReps = Number(b.reps || 0);
      const aScore = aLoad > 0 ? aLoad * (1 + aReps / 30) : aReps;
      const bScore = bLoad > 0 ? bLoad * (1 + bReps / 30) : bReps;
      return bScore - aScore || bLoad - aLoad || bReps - aReps;
    })[0] || null;
  }

  function buildProgressionMemory(planExercise = {}, history = [], options = {}) {
    const exerciseCode = planExercise.exerciseCode || planExercise.id;
    const prior = exerciseHistory(history, exerciseCode, options.excludeExecutionId || null);
    const latestExecution = prior[0] || null;
    const latestExercise = latestExecution ? exerciseFromExecution(latestExecution, exerciseCode) : null;
    const latestExposure = latestExecution && latestExercise ? exerciseExposure(latestExecution, latestExercise) : null;
    const latestSet = latestExecution ? strongestWorkSet(workSetsForExercise(latestExecution, exerciseCode)) : null;
    const currentLoad = Number(planExercise.recommendedLoad ?? planExercise.load ?? 0);
    const targetReps = Number(planExercise.targetReps ?? planExercise.reps ?? 0);
    const unit = planExercise.unit || latestSet?.unit || "lb";
    const repUnit = planExercise.repUnit || "reps";
    const qualityExposures = qualityExposureCount(prior, exerciseCode);
    const safetyCode = String(options.readinessState || options.policyCode || "").toUpperCase();
    const safetyHold = Boolean(options.pain)
      || ["RED", "SAFETY_HOLD", "RECOVERY ONLY"].includes(safetyCode)
      || latestExecution?.painReported
      || latestExecution?.state === "STOPPED";
    const repeatLoad = Number(latestSet?.load ?? latestExposure?.workingLoad ?? currentLoad ?? 0);
    const repeatReps = Number(latestSet?.reps ?? targetReps ?? 0);
    let action = "ESTABLISH_BASELINE";
    let label = "Establish baseline";
    let reason = "No completed exposure exists. Use the approved target and leave clean repetitions available.";
    let coachedLoad = currentLoad;
    let coachedReps = targetReps;

    if (latestExposure) {
      action = "REPEAT";
      label = "Repeat last";
      reason = "Repeat the last controlled target before adding difficulty.";
      coachedLoad = repeatLoad;
      coachedReps = targetReps || repeatReps;
      if (safetyHold) {
        action = "SAFETY_HOLD";
        label = "Hold progression";
        reason = "Pain, a stopped session, or RED readiness blocks a harder target.";
      } else if (latestExecution.state !== "COMPLETE" || latestExposure.skipped || latestExposure.substituted || !latestExposure.targetMet) {
        reason = "The previous exposure was incomplete or modified, so the last supported target repeats.";
      } else if (latestExposure.averageRpe === null) {
        reason = "RPE was not recorded, so Atlas will not infer progression.";
      } else if (latestExposure.averageRpe > 8) {
        reason = "The previous work was near the limit. Repeat before adding load or repetitions.";
      } else if (qualityExposures >= 2 && repeatLoad > 0) {
        action = "ADD_LOAD";
        label = String(unit).toLowerCase() === "kg" ? "+2.5 kg" : "+5 lb";
        coachedLoad = roundLoad(Math.max(currentLoad, repeatLoad) + (String(unit).toLowerCase() === "kg" ? 2.5 : 5), unit);
        coachedReps = targetReps || repeatReps;
        reason = "Two consecutive complete, pain-free exposures at RPE 8 or below earned the smallest load step.";
      } else if (repUnit === "reps") {
        action = "ADD_REP";
        label = "+1 rep";
        coachedLoad = repeatLoad;
        coachedReps = Math.max(targetReps, repeatReps + 1);
        reason = "One controlled exposure supports a repetition target while load stays fixed.";
      }
    }

    return {
      version: VERSION,
      exerciseCode,
      exerciseName: planExercise.exerciseName || planExercise.name || exerciseCode,
      qualityExposures,
      latest: latestExposure ? {
        date: String(latestExecution.completedAt || latestExecution.date || "").slice(0, 10),
        state: latestExecution.state,
        sets: latestExposure.completedSets,
        load: repeatLoad,
        reps: repeatReps,
        averageRpe: latestExposure.averageRpe,
        unit
      } : null,
      coachedTarget: {
        action,
        label,
        reason,
        reps: coachedReps,
        load: coachedLoad,
        unit,
        requiresConfirmation: ["ADD_LOAD", "ADD_REP"].includes(action),
        blocked: action === "SAFETY_HOLD"
      }
    };
  }

  function recordsForExercise(execution = {}, history = [], exerciseItem = {}) {
    const exerciseCode = exerciseItem.exerciseCode || exerciseItem.id;
    const currentSets = workSetsForExercise(execution, exerciseCode);
    const prior = exerciseHistory(history, exerciseCode, execution.id);
    const priorSets = prior.flatMap((item) => workSetsForExercise(item, exerciseCode));
    const currentBest = strongestWorkSet(currentSets);
    const priorMaxLoad = Math.max(0, ...priorSets.map((item) => Number(item.load || 0)));
    const currentMaxLoad = Math.max(0, ...currentSets.map((item) => Number(item.load || 0)));
    const currentVolume = currentSets.reduce((sum, item) => sum + Number(item.load || 0) * Number(item.reps || 0), 0);
    const priorMaxVolume = Math.max(0, ...prior.map((item) => workSetsForExercise(item, exerciseCode)
      .reduce((sum, setItem) => sum + Number(setItem.load || 0) * Number(setItem.reps || 0), 0)));
    const records = [];

    if (priorSets.length && currentMaxLoad > priorMaxLoad) {
      records.push({ code: "LOAD_PR", label: "Load PR", value: currentMaxLoad, unit: currentBest?.unit || exerciseItem.unit || "lb" });
    }
    if (priorSets.length) {
      const repRecord = currentSets
        .map((item) => {
          const sameLoad = priorSets.filter((priorSet) => Number(priorSet.load || 0) === Number(item.load || 0));
          const previous = Math.max(0, ...sameLoad.map((priorSet) => Number(priorSet.reps || 0)));
          return sameLoad.length && Number(item.reps || 0) > previous
            ? { current: Number(item.reps || 0), previous, load: Number(item.load || 0), unit: item.unit || exerciseItem.unit || "lb" }
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.current - a.current)[0];
      if (repRecord) records.push({ code: "REP_PR", label: "Rep PR", value: repRecord.current, unit: "reps", load: repRecord.load, loadUnit: repRecord.unit });
    }
    if (prior.length && currentVolume > priorMaxVolume) {
      records.push({ code: "VOLUME_PR", label: "Volume PR", value: Math.round(currentVolume), unit: `${exerciseItem.unit || currentBest?.unit || "lb"}-reps` });
    }

    return {
      exerciseCode,
      exerciseName: exerciseItem.exerciseName || exerciseItem.name || exerciseCode,
      baselineEstablished: Boolean(currentSets.length && !priorSets.length),
      strongestSet: currentBest ? {
        exerciseCode,
        exerciseName: exerciseItem.exerciseName || exerciseItem.name || exerciseCode,
        load: Number(currentBest.load || 0),
        reps: Number(currentBest.reps || 0),
        rpe: currentBest.rpe ?? null,
        unit: currentBest.unit || exerciseItem.unit || "lb"
      } : null,
      records
    };
  }

  function buildCompletionReport(execution = {}, history = [], plan = {}, options = {}) {
    if (!isTerminal(execution.state)) return null;
    const priorHistory = history.filter((item) => item?.id !== execution.id);
    const exerciseResults = (execution.sessionSnapshot?.exercises || [])
      .map((item) => recordsForExercise(execution, priorHistory, item));
    const records = exerciseResults.flatMap((item) => item.records.map((record) => ({
      ...record,
      exerciseCode: item.exerciseCode,
      exerciseName: item.exerciseName
    })));
    const strongestSet = exerciseResults.map((item) => item.strongestSet).filter(Boolean)
      .sort((a, b) => {
        const aScore = a.load > 0 ? a.load * (1 + a.reps / 30) : a.reps;
        const bScore = b.load > 0 ? b.load * (1 + b.reps / 30) : b.reps;
        return bScore - aScore;
      })[0] || null;
    const proposal = plan?.status === "APPROVED"
      ? buildAdjustmentProposal(plan, [execution, ...priorHistory], { createdAt: options.createdAt || execution.completedAt || new Date().toISOString() })
      : null;
    const decisions = proposal?.decisions || [];
    const earned = decisions.filter((item) => item.action === "PROGRESS_LOAD");
    const reduced = decisions.filter((item) => item.action === "REDUCE_LOAD");
    const baselines = exerciseResults.filter((item) => item.baselineEstablished).length;
    const headline = execution.painReported || execution.state === "STOPPED"
      ? "Recovery protection engaged"
      : earned.length
        ? `Progression earned on ${earned.length} exercise${earned.length === 1 ? "" : "s"}`
        : records.length
          ? `${records.length} performance mark${records.length === 1 ? "" : "s"} secured`
          : baselines
            ? `${baselines} baseline${baselines === 1 ? "" : "s"} established`
            : execution.state === "COMPLETE" ? "Session secured" : "Completed work preserved";
    const detail = execution.painReported || execution.state === "STOPPED"
      ? "No progression is authorized until readiness is reviewed."
      : earned.length
        ? "Review the earned load steps before they change the approved plan."
        : reduced.length
          ? "Atlas recommends a smaller next exposure before load returns."
          : "The next exposure repeats until the evidence supports a controlled increase.";
    return {
      version: VERSION,
      id: `strength-progression:${execution.id}`,
      sourceExecutionId: execution.id,
      createdAt: options.createdAt || execution.completedAt || new Date().toISOString(),
      headline,
      detail,
      recordCount: records.length,
      records,
      strongestSet,
      baselinesEstablished: baselines,
      progression: {
        earnedCount: earned.length,
        reducedCount: reduced.length,
        repeatCount: decisions.filter((item) => ["REPEAT", "HOLD_FOR_REVIEW", "SAFETY_HOLD"].includes(item.action)).length,
        decisions: decisions.map((item) => ({
          exerciseCode: item.exerciseCode,
          exerciseName: item.exerciseName,
          action: item.action,
          label: item.label,
          currentLoad: item.currentLoad,
          proposedLoad: item.proposedLoad,
          unit: item.unit,
          reason: item.reason
        }))
      }
    };
  }

  function qualityExposureCount(history = [], exerciseCode) {
    let count = 0;
    let anchorLoad = null;
    for (const execution of history) {
      const item = exerciseFromExecution(execution, exerciseCode);
      if (!item) continue;
      const exposure = exerciseExposure(execution, item);
      const qualifies = execution.state === "COMPLETE"
        && !execution.painReported
        && !exposure.skipped
        && !exposure.substituted
        && exposure.targetMet
        && exposure.averageRpe !== null
        && exposure.averageRpe <= 8;
      if (!qualifies) break;
      if (anchorLoad === null) anchorLoad = exposure.workingLoad;
      if (Math.abs(exposure.workingLoad - anchorLoad) > 0.01) break;
      count += 1;
    }
    return count;
  }

  function adjustmentDecision(planExercise = {}, execution = {}, matchingHistory = []) {
    const exerciseCode = planExercise.exerciseCode || planExercise.id;
    const performedExercise = exerciseFromExecution(execution, exerciseCode) || planExercise;
    const exposure = exerciseExposure(execution, performedExercise);
    const currentLoad = Number(planExercise.recommendedLoad || 0);
    const actualLoad = exposure.workingLoad;
    const unit = planExercise.unit || "lb";
    const repeatLoad = roundLoad(actualLoad || currentLoad, unit);
    const base = {
      exerciseCode,
      exerciseName: planExercise.exerciseName,
      sessionId: execution.sessionId,
      currentLoad,
      actualLoad,
      proposedLoad: currentLoad,
      unit,
      completedSets: exposure.completedSets,
      plannedSets: exposure.plannedSets,
      averageRpe: exposure.averageRpe,
      qualityExposures: qualityExposureCount(matchingHistory, exerciseCode),
      changed: false
    };

    if (execution.painReported || execution.state === "STOPPED") {
      return { ...base, action: "SAFETY_HOLD", label: "Safety hold", reason: "Pain or a stopped session blocks loaded progression until readiness is reviewed." };
    }
    if (execution.state !== "COMPLETE") {
      return { ...base, action: "REPEAT", label: "Repeat", reason: "The session was not fully completed, so the approved prescription stays unchanged." };
    }
    if (exposure.substituted) {
      return { ...base, action: "HOLD_FOR_REVIEW", label: "Review substitution", reason: "A substituted movement does not change the approved load for the original exercise." };
    }
    if (exposure.skipped || !exposure.targetMet) {
      return { ...base, action: "REPEAT", label: "Repeat", reason: "All prescribed sets and reps must be completed before progression is considered." };
    }
    if (exposure.averageRpe === null) {
      return { ...base, action: "REPEAT", label: "Repeat", reason: "RPE was not recorded, so Coach Dominion will not infer readiness to progress." };
    }
    if (!actualLoad) {
      return { ...base, action: "REPEAT", label: "Repeat", reason: "No external load was recorded. Bodyweight and timed work stay unchanged for manual review." };
    }
    if (exposure.averageRpe >= 9) {
      const reduced = roundLoad(actualLoad * 0.95, unit);
      return {
        ...base,
        action: "REDUCE_LOAD",
        label: "Reduce load",
        proposedLoad: reduced,
        changed: reduced !== currentLoad,
        reason: "Average RPE reached 9 or higher. A small load reduction is proposed; sets do not increase."
      };
    }
    if (exposure.averageRpe > 8) {
      return {
        ...base,
        action: "REPEAT",
        label: "Repeat load",
        proposedLoad: repeatLoad,
        changed: repeatLoad !== currentLoad,
        reason: "The work was completed near the limit. Repeat the working load before adding difficulty."
      };
    }
    if (base.qualityExposures < 2) {
      return {
        ...base,
        action: currentLoad > 0 ? "REPEAT" : "ESTABLISH_BASELINE",
        label: currentLoad > 0 ? "Repeat load" : "Set baseline",
        proposedLoad: repeatLoad,
        changed: repeatLoad !== currentLoad,
        reason: currentLoad > 0
          ? "One controlled exposure is recorded. A second successful exposure is required before progression."
          : "The first controlled exposure establishes a working baseline without counting as progression."
      };
    }
    const progressed = roundLoad(actualLoad + (String(unit).toLowerCase() === "kg" ? 2.5 : 5), unit);
    return {
      ...base,
      action: "PROGRESS_LOAD",
      label: "Progress load",
      proposedLoad: progressed,
      changed: progressed !== currentLoad,
      reason: "Two consecutive complete, pain-free exposures at RPE 8 or below support the smallest load increase."
    };
  }

  function buildAdjustmentProposal(plan = {}, history = [], options = {}) {
    if (plan.status !== "APPROVED") return null;
    const matchingHistory = terminalHistory(history, plan.id)
      .sort((a, b) => String(b.completedAt || b.updatedAt || "").localeCompare(String(a.completedAt || a.updatedAt || "")));
    const source = matchingHistory[0];
    if (!source) return null;
    const planSession = (plan.sessions || []).find((item) => item.id === source.sessionId);
    if (!planSession) return null;
    const decisions = (planSession.exercises || []).map((item) => adjustmentDecision(item, source, matchingHistory));
    const changedCount = decisions.filter((item) => item.changed).length;
    const safetyHold = decisions.some((item) => item.action === "SAFETY_HOLD");
    const revision = Number(plan.revision || 1);
    return {
      version: VERSION,
      id: `strength-adjustment:${source.id}:r${revision}`,
      status: "PENDING",
      planId: plan.id,
      planRevision: revision,
      sourceExecutionId: source.id,
      sourceState: source.state,
      sessionId: source.sessionId,
      sessionName: source.sessionName,
      createdAt: options.createdAt || new Date().toISOString(),
      safetyHold,
      decisions,
      summary: {
        changedCount,
        progressedCount: decisions.filter((item) => item.action === "PROGRESS_LOAD").length,
        reducedCount: decisions.filter((item) => item.action === "REDUCE_LOAD").length,
        repeatedCount: decisions.filter((item) => ["REPEAT", "HOLD_FOR_REVIEW", "SAFETY_HOLD"].includes(item.action)).length
      },
      safeguards: [
        "No change applies without explicit approval.",
        "Load and volume never increase together.",
        "Pain blocks loaded progression.",
        "Two successful exposures are required before adding load."
      ]
    };
  }

  function applyAdjustmentProposal(plan = {}, proposal = {}, approvedAt = new Date().toISOString()) {
    if (plan.status !== "APPROVED" || proposal.status !== "PENDING" || proposal.planId !== plan.id) {
      throw new Error("A pending adjustment for the active plan is required.");
    }
    if (proposal.safetyHold) throw new Error("Resolve the pain hold before approving loaded changes.");
    const decisions = new Map((proposal.decisions || []).map((item) => [item.exerciseCode, item]));
    const sessions = (plan.sessions || []).map((sessionItem) => ({
      ...sessionItem,
      exercises: (sessionItem.exercises || []).map((exerciseItem) => {
        const decision = decisions.get(exerciseItem.exerciseCode || exerciseItem.id);
        if (!decision || !decision.changed || !["PROGRESS_LOAD", "REDUCE_LOAD", "ESTABLISH_BASELINE", "REPEAT"].includes(decision.action)) return { ...exerciseItem };
        return {
          ...exerciseItem,
          recommendedLoad: decision.proposedLoad,
          unit: decision.unit || exerciseItem.unit,
          action: decision.action === "PROGRESS_LOAD" ? "PROGRESSED" : decision.action === "REDUCE_LOAD" ? "DELOADED" : "EVIDENCE ANCHORED",
          rationale: decision.reason
        };
      })
    }));
    const nextPlan = JSON.parse(JSON.stringify({
      ...plan,
      version: VERSION,
      revision: Number(plan.revision || 1) + 1,
      sessions,
      adjustedAt: approvedAt,
      lastAdjustmentId: proposal.id
    }));
    return {
      plan: nextPlan,
      adjustment: {
        ...proposal,
        status: "APPROVED",
        approvedAt,
        appliedRevision: nextPlan.revision
      }
    };
  }

  function holdAdjustment(proposal = {}, heldAt = new Date().toISOString()) {
    if (proposal.status !== "PENDING") return { ...proposal };
    return { ...proposal, status: "HELD", heldAt };
  }

  return Object.freeze({
    VERSION,
    DEFAULT_PROFILE,
    PATTERN_LABELS,
    EXERCISES,
    normalizeProfile,
    buildStrengthProgram,
    approvePlan,
    movementCoverage,
    selectSession,
    readinessPolicy,
    buildDailyPrescription,
    buildSessionPrescription,
    sessionLaunchDecision,
    executionForPrescription,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    recoverInterruptedExecution,
    recordSet,
    editSet,
    undoLastSet,
    skipExercise,
    useSubstitution,
    plannedSetCount,
    completedSetCount,
    activeDurationMinutes,
    sessionSummary,
    prepareWorkoutReview,
    finishWorkout,
    reportPain,
    restartWorkout,
    averageRpe,
    exerciseExposure,
    buildProgressionMemory,
    recordsForExercise,
    buildCompletionReport,
    qualityExposureCount,
    buildAdjustmentProposal,
    applyAdjustmentProposal,
    holdAdjustment,
    isTerminal
  });
});
