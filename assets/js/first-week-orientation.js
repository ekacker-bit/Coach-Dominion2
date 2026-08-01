(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionFirstWeekOrientation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021D.1";
  const ATHLETE_TYPES = Object.freeze([
    { code: "FOUNDATION", label: "Foundation athlete", minimumYears: 0, maximumYears: 1 },
    { code: "DEVELOPING", label: "Developing athlete", minimumYears: 2, maximumYears: 3 },
    { code: "TRAINED", label: "Trained athlete", minimumYears: 4, maximumYears: 7 },
    { code: "VETERAN", label: "Veteran athlete", minimumYears: 8, maximumYears: null }
  ]);
  const ORIENTATION_STEPS = Object.freeze([
    { id: "profile", label: "Profile" },
    { id: "rhythm", label: "Daily rhythm" },
    { id: "baseline", label: "Baseline week" },
    { id: "launch", label: "Launch" }
  ]);

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function addDays(value, days) {
    const date = new Date(`${dateIso(value) || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function numberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function deriveAthleteType(trainingYears) {
    const years = numberOrNull(trainingYears);
    if (years === null || years < 0) return null;
    return ATHLETE_TYPES.find((item) => years >= item.minimumYears && (item.maximumYears === null || years <= item.maximumYears))?.code || "VETERAN";
  }

  function athleteTypeLabel(code) {
    return ATHLETE_TYPES.find((item) => item.code === code)?.label || "Athlete type pending";
  }

  function normalizeProfile(input = {}) {
    const heightUnit = String(input.heightUnit || input.height_unit || "in").toLowerCase() === "cm" ? "cm" : "in";
    const storedHeightCm = numberOrNull(input.heightCm ?? input.height_cm);
    const enteredHeight = numberOrNull(input.heightValue ?? input.height_value);
    const heightCm = storedHeightCm !== null
      ? Number(storedHeightCm.toFixed(1))
      : enteredHeight === null
        ? null
        : Number((heightUnit === "cm" ? enteredHeight : enteredHeight * 2.54).toFixed(1));
    const heightValue = heightCm === null
      ? null
      : Number((heightUnit === "cm" ? heightCm : heightCm / 2.54).toFixed(1));
    const age = numberOrNull(input.age);
    const trainingYears = numberOrNull(input.trainingYears ?? input.training_years);
    const genderOptions = ["WOMAN", "MAN", "NON_BINARY", "SELF_DESCRIBE", "PREFER_NOT_TO_SAY"];
    const gender = genderOptions.includes(String(input.gender || "").toUpperCase())
      ? String(input.gender).toUpperCase()
      : "PREFER_NOT_TO_SAY";
    return {
      age: age === null ? null : Math.round(age),
      heightCm,
      heightUnit,
      heightValue,
      gender,
      trainingYears: trainingYears === null ? null : Math.max(0, Number(trainingYears.toFixed(1))),
      athleteType: deriveAthleteType(trainingYears)
    };
  }

  function validateProfile(input = {}) {
    const profile = normalizeProfile(input);
    const errors = [];
    if (profile.age === null || profile.age < 13 || profile.age > 100) errors.push("Enter an age between 13 and 100.");
    if (profile.heightCm === null || profile.heightCm < 120 || profile.heightCm > 230) errors.push("Enter a height between 120 and 230 cm (47 to 91 in).");
    if (profile.trainingYears === null || profile.trainingYears > 70) errors.push("Enter total years of structured training between 0 and 70.");
    return { valid: errors.length === 0, profile, errors };
  }

  function profileFromContract(contract = {}) {
    return normalizeProfile(contract.athleteProfile || contract);
  }

  function startingStep(profile) {
    return validateProfile(profile).valid ? 1 : 0;
  }

  function createOrientation(contract = {}, options = {}) {
    if (!contract.id || contract.status !== "APPROVED") throw new Error("A signed Recruit Contract is required before Week One orientation.");
    const profile = profileFromContract(contract);
    const step = startingStep(profile);
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    return {
      version: VERSION,
      contractId: contract.id,
      contractRevision: Number(contract.revision || 0),
      status: step ? "IN_PROGRESS" : "PROFILE_REQUIRED",
      currentStep: step,
      profile,
      weekStart: dateIso(contract.effectiveDate) || today,
      weekEnd: addDays(dateIso(contract.effectiveDate) || today, 6),
      cadenceAcknowledgedAt: null,
      baselineAcknowledgedAt: null,
      completedAt: null,
      updatedAt: options.updatedAt || new Date().toISOString()
    };
  }

  function normalizeOrientation(value = {}, contract = {}, options = {}) {
    if (!value || value.contractId !== contract.id || Number(value.contractRevision || 0) !== Number(contract.revision || 0)) {
      return createOrientation(contract, options);
    }
    const profile = normalizeProfile(value.profile || profileFromContract(contract));
    const profileValid = validateProfile(profile).valid;
    const cadenceComplete = Boolean(value.cadenceAcknowledgedAt);
    const baselineComplete = Boolean(value.baselineAcknowledgedAt);
    const completed = Boolean(value.completedAt);
    const currentStep = !profileValid ? 0 : !cadenceComplete ? 1 : !baselineComplete ? 2 : 3;
    return {
      ...value,
      version: VERSION,
      contractId: contract.id,
      contractRevision: Number(contract.revision || 0),
      status: completed ? "COMPLETE" : profileValid ? "IN_PROGRESS" : "PROFILE_REQUIRED",
      currentStep: completed ? 3 : currentStep,
      profile,
      weekStart: dateIso(value.weekStart) || dateIso(contract.effectiveDate) || dateIso(options.today) || new Date().toISOString().slice(0, 10),
      weekEnd: dateIso(value.weekEnd) || addDays(value.weekStart || contract.effectiveDate || options.today, 6),
      updatedAt: value.updatedAt || options.updatedAt || new Date().toISOString()
    };
  }

  function rebaseOrientation(value = {}, previousContract = {}, nextContract = {}, options = {}) {
    const previous = normalizeOrientation(value, previousContract, options);
    const next = createOrientation(nextContract, options);
    return normalizeOrientation({
      ...previous,
      version: VERSION,
      contractId: nextContract.id,
      contractRevision: Number(nextContract.revision || 0),
      profile: next.profile,
      updatedAt: options.updatedAt || new Date().toISOString()
    }, nextContract, options);
  }

  function transition(value = {}, action, payload = {}, options = {}) {
    const now = options.now || new Date().toISOString();
    const state = { ...value, profile: normalizeProfile(value.profile), updatedAt: now };
    if (action === "SAVE_PROFILE") {
      const validation = validateProfile(payload);
      if (!validation.valid) throw new Error(validation.errors[0]);
      return { ...state, profile: validation.profile, status: "IN_PROGRESS", currentStep: 1 };
    }
    if (action === "ACKNOWLEDGE_RHYTHM") {
      if (!validateProfile(state.profile).valid) throw new Error("Complete the recruit profile first.");
      return { ...state, status: "IN_PROGRESS", currentStep: 2, cadenceAcknowledgedAt: now };
    }
    if (action === "ACKNOWLEDGE_BASELINE") {
      if (!state.cadenceAcknowledgedAt) throw new Error("Acknowledge the daily operating rhythm first.");
      return { ...state, status: "IN_PROGRESS", currentStep: 3, baselineAcknowledgedAt: now };
    }
    if (action === "COMPLETE") {
      if (!state.baselineAcknowledgedAt) throw new Error("Protect the baseline-week protocol before launch.");
      return { ...state, status: "COMPLETE", currentStep: 3, completedAt: now };
    }
    throw new Error("Unknown Week One orientation action.");
  }

  function atlasProfileContext(profileInput = {}, orientation = null) {
    const profile = normalizeProfile(profileInput);
    const type = profile.athleteType;
    const guardrails = [];
    if (type === "FOUNDATION") guardrails.push("Keep Week One submaximal and establish movement, workload, and recovery baselines before progression.");
    if (type === "DEVELOPING") guardrails.push("Progress only after clean execution and stable recovery are visible across the baseline week.");
    if (["TRAINED", "VETERAN"].includes(type)) guardrails.push("Preserve proven capacity, but require current evidence before increasing load or volume.");
    if (Number(profile.age || 0) >= 50) guardrails.push("Give recovery, pain, resting heart rate, and HRV extra weight before adding workload.");
    guardrails.push("Gender is retained as recruit context; it never lowers the evidence or execution standard.");
    const activeBaseline = orientation?.status !== "COMPLETE" || (dateIso(orientation.weekEnd) && dateIso(orientation.weekEnd) >= new Date().toISOString().slice(0, 10));
    return {
      athleteType: type,
      athleteTypeLabel: athleteTypeLabel(type),
      trainingYears: profile.trainingYears,
      age: profile.age,
      heightCm: profile.heightCm,
      gender: profile.gender,
      baselineWeekActive: Boolean(activeBaseline),
      progressionPolicy: activeBaseline ? "HOLD_PROGRESSION" : "EVIDENCE_GOVERNED",
      guardrails
    };
  }

  function presentation(value = {}, contract = {}) {
    const state = normalizeOrientation(value, contract);
    const completedSteps = state.status === "COMPLETE" ? 4 : Math.max(0, Number(state.currentStep || 0));
    return {
      ...state,
      percent: Math.round(completedSteps / ORIENTATION_STEPS.length * 100),
      steps: ORIENTATION_STEPS.map((step, index) => ({
        ...step,
        complete: state.status === "COMPLETE" || index < state.currentStep,
        current: state.status !== "COMPLETE" && index === state.currentStep
      })),
      atlas: atlasProfileContext(state.profile, state)
    };
  }

  function retireContract(contract = {}, options = {}) {
    if (!contract.id || contract.status !== "APPROVED") throw new Error("No approved Contract is available to delete.");
    const deletedAt = options.deletedAt || new Date().toISOString();
    const revision = Number(contract.revision || 0) + 1;
    return {
      retired: {
        ...contract,
        status: "RETIRED",
        retiredAt: deletedAt,
        retirementReason: "RECRUIT_REQUESTED_RESTART"
      },
      tombstone: {
        version: VERSION,
        id: `deleted-${contract.id}`,
        deletedContractId: contract.id,
        revision,
        status: "DELETED",
        deletedAt,
        updatedAt: deletedAt
      }
    };
  }

  return Object.freeze({
    VERSION,
    ATHLETE_TYPES: [...ATHLETE_TYPES],
    ORIENTATION_STEPS: [...ORIENTATION_STEPS],
    deriveAthleteType,
    athleteTypeLabel,
    normalizeProfile,
    validateProfile,
    profileFromContract,
    createOrientation,
    normalizeOrientation,
    rebaseOrientation,
    transition,
    atlasProfileContext,
    presentation,
    retireContract,
    addDays
  });
});
