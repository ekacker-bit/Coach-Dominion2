(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecruitContract = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021C.1";
  const TWO_A_DAY_TARGET_MINUTES = 121;
  const TWO_A_DAY_MAX_MINUTES = 240;
  const PRIMARY_GOALS = Object.freeze([
    "BALANCED_FITNESS",
    "BUILD_STRENGTH",
    "RUN_FASTER",
    "BUILD_ENDURANCE",
    "LOSE_FAT"
  ]);
  const NUTRITION_COMMITMENTS = Object.freeze([
    "TRACK_DAILY",
    "TRACK_5_DAYS",
    "PROTEIN_FIRST",
    "FOUNDATION_ONLY"
  ]);
  const EQUIPMENT_LEVELS = Object.freeze(["FULL_GYM", "DUMBBELLS", "BODYWEIGHT_BANDS"]);
  const EXPERIENCE_LEVELS = Object.freeze(["FOUNDATION", "INTERMEDIATE", "EXPERIENCED"]);
  const GENDER_OPTIONS = Object.freeze(["WOMAN", "MAN", "NON_BINARY", "SELF_DESCRIBE", "PREFER_NOT_TO_SAY"]);
  const ATHLETE_TYPES = Object.freeze(["FOUNDATION", "DEVELOPING", "TRAINED", "VETERAN"]);
  const RUNNING_GOALS = Object.freeze(["GENERAL_FITNESS", "5K", "10K", "HALF_MARATHON", "MARATHON"]);
  const WEEKDAYS = Object.freeze(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
  const TRAINING_DAY_PATTERNS = Object.freeze({
    2: [1, 4],
    3: [0, 2, 5],
    4: [0, 1, 3, 5],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5]
  });

  function integer(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
  }

  function decimal(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function numberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function clamp(value, min, max, fallback) {
    return Math.max(min, Math.min(max, integer(value, fallback)));
  }

  function booleanValue(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (value === null || value === undefined || value === "") return fallback;
    return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
  }

  function dateIso(value) {
    const text = String(value || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function cleanText(value, maximum = 120) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maximum);
  }

  function enumValue(value, allowed, fallback) {
    const normalized = String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
    return allowed.includes(normalized) ? normalized : fallback;
  }

  function addDays(date, days) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + Number(days || 0));
    return value.toISOString().slice(0, 10);
  }

  function weekStartIso(value) {
    const candidate = dateIso(value) || new Date().toISOString().slice(0, 10);
    const date = new Date(`${candidate}T12:00:00Z`);
    const offset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  }

  function nearest(value, choices, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return [...choices].sort((a, b) => Math.abs(a - numeric) - Math.abs(b - numeric))[0];
  }

  function deriveAthleteType(trainingYears) {
    const years = numberOrNull(trainingYears);
    if (years === null || years < 0) return null;
    if (years <= 1) return "FOUNDATION";
    if (years <= 3) return "DEVELOPING";
    if (years <= 7) return "TRAINED";
    return "VETERAN";
  }

  function normalizeRecruitProfile(input = {}) {
    const source = input.athleteProfile || input;
    const heightUnit = String(source.heightUnit || source.height_unit || "in").toLowerCase() === "cm" ? "cm" : "in";
    const storedHeightCm = numberOrNull(source.heightCm ?? source.height_cm);
    const enteredHeight = numberOrNull(source.heightValue ?? source.height_value);
    const heightCm = storedHeightCm !== null
      ? Number(storedHeightCm.toFixed(1))
      : enteredHeight === null
        ? null
        : Number((heightUnit === "cm" ? enteredHeight : enteredHeight * 2.54).toFixed(1));
    const trainingYears = numberOrNull(source.trainingYears ?? source.training_years);
    const athleteType = deriveAthleteType(trainingYears);
    return {
      age: numberOrNull(source.age) === null ? null : Math.round(Number(source.age)),
      heightCm,
      heightUnit,
      heightValue: heightCm === null ? null : Number((heightUnit === "cm" ? heightCm : heightCm / 2.54).toFixed(1)),
      gender: enumValue(source.gender, GENDER_OPTIONS, "PREFER_NOT_TO_SAY"),
      trainingYears: trainingYears === null ? null : Math.max(0, Number(trainingYears.toFixed(1))),
      athleteType
    };
  }

  function experienceFromAthleteType(athleteType) {
    if (athleteType === "FOUNDATION") return "FOUNDATION";
    if (athleteType === "VETERAN") return "EXPERIENCED";
    return "INTERMEDIATE";
  }

  function defaultContract(options = {}) {
    return {
      version: VERSION,
      age: null,
      heightCm: null,
      heightUnit: "in",
      heightValue: null,
      gender: "PREFER_NOT_TO_SAY",
      trainingYears: null,
      athleteType: null,
      primaryGoal: "BALANCED_FITNESS",
      target: "",
      targetDate: null,
      trainingDaysPerWeek: 5,
      strengthDaysPerWeek: 3,
      runningDaysPerWeek: 3,
      coreDaysPerWeek: 3,
      sessionMinutes: 60,
      twoADays: false,
      equipment: "FULL_GYM",
      experience: "INTERMEDIATE",
      runningGoal: "GENERAL_FITNESS",
      preferredUnit: "mi",
      declaredWeeklyDistance: 0,
      nutritionCommitment: "TRACK_5_DAYS",
      effectiveDate: dateIso(options.today) || new Date().toISOString().slice(0, 10)
    };
  }

  function normalizeContractDraft(input = {}, options = {}) {
    const defaults = defaultContract(options);
    const athleteProfile = normalizeRecruitProfile(input);
    return {
      version: VERSION,
      ...athleteProfile,
      athleteProfile,
      primaryGoal: enumValue(input.primaryGoal || input.primary_goal, PRIMARY_GOALS, defaults.primaryGoal),
      target: cleanText(input.target || input.goalStatement || input.goal_statement, 120),
      targetDate: dateIso(input.targetDate || input.target_date),
      trainingDaysPerWeek: clamp(input.trainingDaysPerWeek ?? input.training_days_per_week, 2, 6, defaults.trainingDaysPerWeek),
      strengthDaysPerWeek: clamp(input.strengthDaysPerWeek ?? input.strength_days_per_week, 0, 6, defaults.strengthDaysPerWeek),
      runningDaysPerWeek: clamp(input.runningDaysPerWeek ?? input.running_days_per_week, 0, 6, defaults.runningDaysPerWeek),
      coreDaysPerWeek: clamp(input.coreDaysPerWeek ?? input.core_days_per_week, 0, 4, defaults.coreDaysPerWeek),
      sessionMinutes: nearest(input.sessionMinutes ?? input.session_minutes, [30, 45, 60, 75, 90], defaults.sessionMinutes),
      twoADays: booleanValue(input.twoADays ?? input.two_a_days, defaults.twoADays),
      equipment: enumValue(input.equipment, EQUIPMENT_LEVELS, defaults.equipment),
      experience: input.experience
        ? enumValue(input.experience, EXPERIENCE_LEVELS, defaults.experience)
        : experienceFromAthleteType(athleteProfile.athleteType),
      runningGoal: enumValue(input.runningGoal || input.running_goal, RUNNING_GOALS, defaults.runningGoal),
      preferredUnit: String(input.preferredUnit || input.preferred_unit || defaults.preferredUnit).toLowerCase() === "km" ? "km" : "mi",
      declaredWeeklyDistance: Math.max(0, Number(decimal(input.declaredWeeklyDistance ?? input.declared_weekly_distance, defaults.declaredWeeklyDistance).toFixed(1))),
      nutritionCommitment: enumValue(input.nutritionCommitment || input.nutrition_commitment, NUTRITION_COMMITMENTS, defaults.nutritionCommitment),
      effectiveDate: dateIso(input.effectiveDate || input.effective_date) || defaults.effectiveDate
    };
  }

  function validateRecruitContract(input = {}, options = {}) {
    const contract = normalizeContractDraft(input, options);
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const errors = [];
    const warnings = [];

    if (contract.age === null || contract.age < 13 || contract.age > 100) errors.push("Enter an age between 13 and 100.");
    if (contract.heightCm === null || contract.heightCm < 120 || contract.heightCm > 230) errors.push("Enter a height between 120 and 230 cm (47 to 91 in).");
    if (contract.trainingYears === null || contract.trainingYears > 70) errors.push("Enter total years of structured training between 0 and 70.");
    if (contract.target.length < 3) errors.push("Name the outcome this contract is meant to achieve.");
    if (contract.targetDate && contract.targetDate < today) errors.push("Target date cannot be in the past.");
    if (contract.strengthDaysPerWeek > contract.trainingDaysPerWeek) errors.push("Strength days cannot exceed total training days.");
    if (contract.runningDaysPerWeek > contract.trainingDaysPerWeek) errors.push("Running days cannot exceed total training days.");
    if (contract.coreDaysPerWeek > contract.trainingDaysPerWeek) errors.push("Core days cannot exceed total training days.");
    if (contract.strengthDaysPerWeek === 1) errors.push("Strength planning requires either zero or at least two strength days.");
    if (contract.coreDaysPerWeek === 1) errors.push("Core planning requires either zero or at least two core days.");
    if (contract.strengthDaysPerWeek + contract.runningDaysPerWeek + contract.coreDaysPerWeek === 0) {
      errors.push("Commit to at least one Strength, Running, or Core session.");
    }
    if (contract.primaryGoal === "BUILD_STRENGTH" && contract.strengthDaysPerWeek < 2) {
      errors.push("A strength goal requires at least two strength days.");
    }
    if (["RUN_FASTER", "BUILD_ENDURANCE"].includes(contract.primaryGoal) && contract.runningDaysPerWeek < 2) {
      errors.push("A running goal requires at least two running days.");
    }
    if (contract.primaryGoal === "BALANCED_FITNESS" && (contract.strengthDaysPerWeek < 2 || contract.runningDaysPerWeek < 2)) {
      warnings.push("Balanced fitness works best with at least two Strength and two Running days.");
    }
    if (contract.runningDaysPerWeek > 0 && contract.declaredWeeklyDistance <= 0) {
      warnings.push("Running can be staged, but a weekly-distance baseline is still required before a plan can be approved.");
    }
    if (contract.trainingDaysPerWeek === 6) warnings.push("Six training days preserves exactly one full recovery day.");
    if (contract.sessionMinutes === 90 && contract.trainingDaysPerWeek >= 5) {
      warnings.push("Five or more 90-minute training days is a high time commitment; confirm it is sustainable.");
    }
    if (contract.twoADays) {
      warnings.push("Two-a-Days permits two scheduled sessions and more than 120 combined minutes on a training day, up to 240 minutes. Long-run duration remains uncapped by time.");
      const committedSessions = contract.strengthDaysPerWeek + contract.runningDaysPerWeek + contract.coreDaysPerWeek;
      if (committedSessions > contract.trainingDaysPerWeek * 2) {
        errors.push("Two-a-Days can schedule no more than two Strength, Running, or Core sessions per training day. Reduce weekly sessions or add training days.");
      }
    }
    if (contract.athleteType === "FOUNDATION") warnings.push("Week One will remain a calibration week; Atlas will hold progression until baseline evidence is established.");
    if (Number(contract.age || 0) >= 50) warnings.push("Atlas will give recovery, pain, resting heart rate, and HRV extra weight before recommending additional workload.");

    return {
      valid: errors.length === 0,
      status: errors.length ? "REVIEW_REQUIRED" : "READY_FOR_APPROVAL",
      contract,
      errors,
      warnings
    };
  }

  function spreadActivities(trainingIndexes, count, preferredOrder) {
    const allowed = preferredOrder.filter((index) => trainingIndexes.includes(index));
    const remaining = trainingIndexes.filter((index) => !allowed.includes(index));
    return [...allowed, ...remaining].slice(0, count);
  }

  function buildCommitmentSchedule(input = {}, options = {}) {
    const contract = normalizeContractDraft(input, options);
    const weekStart = weekStartIso(options.weekStart || options.today || contract.effectiveDate);
    const trainingIndexes = TRAINING_DAY_PATTERNS[contract.trainingDaysPerWeek];
    const strengthIndexes = spreadActivities(trainingIndexes, contract.strengthDaysPerWeek, [0, 2, 4, 5, 1, 3]);
    const runningIndexes = spreadActivities(trainingIndexes, contract.runningDaysPerWeek, [1, 3, 5, 0, 4, 2]);
    const coreIndexes = spreadActivities(trainingIndexes, contract.coreDaysPerWeek, [0, 2, 5, 3, 1, 4]);
    const activitiesByDay = new Map(trainingIndexes.map((index) => [index, []]));
    strengthIndexes.forEach((index) => activitiesByDay.get(index)?.push("STRENGTH"));
    runningIndexes.forEach((index) => activitiesByDay.get(index)?.push("RUNNING"));
    coreIndexes.forEach((index) => activitiesByDay.get(index)?.push("CORE"));

    if (contract.twoADays) {
      trainingIndexes.forEach((sourceIndex) => {
        const source = activitiesByDay.get(sourceIndex) || [];
        while (source.length > 2) {
          const activity = source.pop();
          const targetIndex = trainingIndexes
            .filter((index) => index !== sourceIndex)
            .filter((index) => (activitiesByDay.get(index) || []).length < 2)
            .filter((index) => !(activitiesByDay.get(index) || []).includes(activity))
            .sort((left, right) => {
              const loadDifference = (activitiesByDay.get(left) || []).length - (activitiesByDay.get(right) || []).length;
              return loadDifference || Math.abs(left - sourceIndex) - Math.abs(right - sourceIndex) || left - right;
            })[0];
          if (targetIndex === undefined) {
            source.push(activity);
            break;
          }
          activitiesByDay.get(targetIndex).push(activity);
        }
      });
    }

    return WEEKDAYS.map((weekday, index) => {
      const activities = [...(activitiesByDay.get(index) || [])];
      const isTrainingDay = trainingIndexes.includes(index);
      const twoADayEligible = Boolean(contract.twoADays && activities.length === 2);
      return {
        weekday,
        date: addDays(weekStart, index),
        isTrainingDay,
        isRecoveryDay: !isTrainingDay,
        activities,
        twoADayEligible,
        dailyMinuteTarget: twoADayEligible ? TWO_A_DAY_TARGET_MINUTES : contract.sessionMinutes,
        dailyMinuteCap: twoADayEligible ? TWO_A_DAY_MAX_MINUTES : contract.sessionMinutes,
        load: !isTrainingDay ? "RECOVERY" : twoADayEligible ? "TWO_A_DAY" : activities.length > 2 ? "OVER_CAPACITY" : activities.length > 1 ? "STACKED" : "SINGLE"
      };
    });
  }

  function contractPlanningInputs(input = {}, options = {}) {
    const contract = normalizeContractDraft(input, options);
    const strengthGoal = contract.primaryGoal === "BUILD_STRENGTH"
      ? "MUSCLE"
      : ["RUN_FASTER", "BUILD_ENDURANCE"].includes(contract.primaryGoal) ? "ATHLETIC_SUPPORT" : "GENERAL_STRENGTH";
    const coreGoal = ["RUN_FASTER", "BUILD_ENDURANCE"].includes(contract.primaryGoal)
      ? "RUNNING_SUPPORT"
      : contract.primaryGoal === "BUILD_STRENGTH" ? "LIFTING_STABILITY" : "GENERAL_STRENGTH";
    const coreEquipment = contract.equipment === "FULL_GYM" ? "FULL_GYM" : contract.equipment === "DUMBBELLS" ? "MINIMAL" : "BODYWEIGHT";
    const coreExperience = contract.experience === "EXPERIENCED" ? "ADVANCED" : contract.experience;
    const nutritionGoal = contract.primaryGoal === "LOSE_FAT"
      ? "FAT_LOSS"
      : ["RUN_FASTER", "BUILD_ENDURANCE"].includes(contract.primaryGoal) ? "PERFORMANCE" : "MAINTAIN";

    return {
      athleteProfile: contract.athleteProfile,
      strength: contract.strengthDaysPerWeek > 0 ? {
        goal: strengthGoal,
        daysPerWeek: contract.strengthDaysPerWeek,
        equipment: contract.equipment,
        sessionMinutes: nearest(contract.sessionMinutes, [45, 60, 75], 60),
        experience: contract.experience
      } : null,
      running: contract.runningDaysPerWeek > 0 ? {
        goal: contract.runningGoal,
        targetDate: contract.targetDate,
        runningDaysPerWeek: contract.runningDaysPerWeek,
        preferredUnit: contract.preferredUnit,
        declaredWeeklyDistance: contract.declaredWeeklyDistance,
        benchmarkDistance: null,
        benchmarkSeconds: null,
        benchmarkDate: null
      } : null,
      core: contract.coreDaysPerWeek > 0 ? {
        goal: coreGoal,
        sessionsPerWeek: Math.max(2, contract.coreDaysPerWeek),
        experience: coreExperience,
        equipment: coreEquipment,
        sessionMinutes: nearest(contract.sessionMinutes / 3, [10, 15, 20], 15)
      } : null,
      nutrition: {
        goal: nutritionGoal,
        commitment: contract.nutritionCommitment,
        effectiveDate: contract.effectiveDate
      }
    };
  }

  function buildModuleReadiness(contract, planningInputs) {
    return {
      strength: planningInputs.strength
        ? { status: "READY_TO_STAGE", message: `${contract.strengthDaysPerWeek} strength day${contract.strengthDaysPerWeek === 1 ? "" : "s"} committed.` }
        : { status: "NOT_COMMITTED", message: "No strength work in this contract." },
      running: !planningInputs.running
        ? { status: "NOT_COMMITTED", message: "No running work in this contract." }
        : contract.declaredWeeklyDistance > 0
          ? { status: "READY_TO_STAGE", message: `${contract.runningDaysPerWeek} running day${contract.runningDaysPerWeek === 1 ? "" : "s"} with a declared baseline.` }
          : { status: "BASELINE_REQUIRED", message: "Add current weekly distance before approving a running week." },
      core: planningInputs.core
        ? { status: "READY_TO_STAGE", message: `${contract.coreDaysPerWeek} core exposure${contract.coreDaysPerWeek === 1 ? "" : "s"} committed.` }
        : { status: "NOT_COMMITTED", message: "No core work in this contract." },
      nutrition: { status: "TARGETS_REQUIRED", message: "Commitment is set; calorie and macro targets still require deliberate entry." }
    };
  }

  function resolveNutritionPlanReadiness(input = {}, baseline = null, options = {}) {
    const contract = normalizeContractDraft(input, options);
    const planningInputs = input.planningInputs || contractPlanningInputs(contract, options);
    const expected = planningInputs.nutrition;
    const contextDate = dateIso(options.date || options.today) || contract.effectiveDate;
    const approved = baseline?.status === "APPROVED";
    if (!approved) {
      return {
        status: "TARGETS_REQUIRED",
        message: "No approved Nutrition baseline is linked to this operating week.",
        baseline: null,
        expectedGoal: expected.goal,
        aligned: false,
        scheduled: false
      };
    }
    const effectiveDate = dateIso(baseline.effectiveDate) || contextDate;
    const scheduled = effectiveDate > contextDate;
    const aligned = baseline.goal === expected.goal;
    const targets = baseline.recoveryTargets || baseline.trainingTargets || {};
    const targetSummary = `${Math.round(Number(targets.calories || 0)) || "—"} kcal · ${Math.round(Number(targets.protein || 0)) || "—"}g protein`;
    if (scheduled) {
      return {
        status: "SCHEDULED",
        message: `Approved Nutrition baseline is linked and activates ${effectiveDate}.`,
        baseline,
        expectedGoal: expected.goal,
        aligned,
        scheduled,
        targetSummary
      };
    }
    return {
      status: aligned ? "PLAN_LINKED" : "PLAN_REVIEW",
      message: aligned
        ? "Approved Nutrition targets are linked to the Recruit Contract and weekly plan."
        : `Approved Nutrition targets are linked, but the ${String(baseline.goal || "current").replaceAll("_", " ")} goal differs from the contract's ${expected.goal.replaceAll("_", " ")} goal.`,
      baseline,
      expectedGoal: expected.goal,
      aligned,
      scheduled,
      targetSummary
    };
  }

  function stableSerialize(value) {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function fingerprint(value) {
    const text = stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `rc-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function buildRecruitContract(input = {}, options = {}) {
    const validation = validateRecruitContract(input, options);
    const planningInputs = contractPlanningInputs(validation.contract, options);
    const schedule = buildCommitmentSchedule(validation.contract, options);
    return {
      ...validation.contract,
      id: null,
      revision: null,
      status: validation.status,
      errors: validation.errors,
      warnings: validation.warnings,
      schedule,
      planningInputs,
      moduleReadiness: buildModuleReadiness(validation.contract, planningInputs),
      safeguards: [
        "At least one full recovery day is protected every week.",
        validation.contract.twoADays
          ? "Two-a-Day calendar days may contain no more than two sessions and 240 combined minutes; long runs have no time ceiling."
          : "Combined training remains within the standard daily session commitment.",
        "Approving this contract does not activate or replace a module plan.",
        "Contract inputs create reviewable drafts; each plan keeps its own approval boundary.",
        "Pain and RED readiness override every commitment."
      ],
      createdAt: options.createdAt || new Date().toISOString(),
      approvedAt: null
    };
  }

  function approveRecruitContract(draft = {}, previousApproved = null, options = {}) {
    const rebuilt = buildRecruitContract(draft, {
      today: options.today,
      weekStart: options.weekStart,
      createdAt: draft.createdAt || options.approvedAt
    });
    if (rebuilt.status !== "READY_FOR_APPROVAL") {
      throw new Error(rebuilt.errors[0] || "Only a ready Recruit Contract can be approved.");
    }
    const approvedAt = options.approvedAt || new Date().toISOString();
    const priorRevision = ["APPROVED", "DELETED", "RETIRED"].includes(previousApproved?.status)
      ? Number(previousApproved.revision || 0)
      : 0;
    const revision = priorRevision + 1;
    const identity = fingerprint({ version: VERSION, revision, contract: normalizeContractDraft(rebuilt, options) });
    return {
      ...rebuilt,
      id: options.id || `${identity}-r${revision}`,
      fingerprint: identity,
      revision,
      status: "APPROVED",
      errors: [],
      approvedAt,
      supersedesId: previousApproved?.status === "DELETED" ? previousApproved.deletedContractId || previousApproved.id : previousApproved?.id || null
    };
  }

  return {
    VERSION,
    TWO_A_DAY_TARGET_MINUTES,
    TWO_A_DAY_MAX_MINUTES,
    PRIMARY_GOALS,
    NUTRITION_COMMITMENTS,
    EQUIPMENT_LEVELS,
    EXPERIENCE_LEVELS,
    GENDER_OPTIONS,
    ATHLETE_TYPES,
    RUNNING_GOALS,
    WEEKDAYS,
    deriveAthleteType,
    normalizeRecruitProfile,
    defaultContract,
    normalizeContractDraft,
    validateRecruitContract,
    buildCommitmentSchedule,
    contractPlanningInputs,
    resolveNutritionPlanReadiness,
    buildRecruitContract,
    approveRecruitContract,
    fingerprint
  };
});
