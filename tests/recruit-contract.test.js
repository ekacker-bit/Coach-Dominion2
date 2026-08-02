const assert = require("node:assert/strict");
const contract = require("../assets/js/recruit-contract.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

function validInput(overrides = {}) {
  return {
    age: 42,
    heightValue: 70,
    heightUnit: "in",
    gender: "MAN",
    trainingYears: 8,
    primaryGoal: "BALANCED_FITNESS",
    target: "Build durable all-around fitness",
    targetDate: "2026-12-31",
    trainingDaysPerWeek: 5,
    strengthDaysPerWeek: 3,
    runningDaysPerWeek: 3,
    coreDaysPerWeek: 3,
    sessionMinutes: 60,
    twoADays: false,
    equipment: "FULL_GYM",
    experience: "INTERMEDIATE",
    runningGoal: "10K",
    preferredUnit: "mi",
    declaredWeeklyDistance: 18,
    nutritionCommitment: "TRACK_5_DAYS",
    effectiveDate: "2026-08-03",
    ...overrides
  };
}

const options = {
  today: "2026-07-30",
  weekStart: "2026-08-03",
  createdAt: "2026-07-30T12:00:00.000Z"
};

test("normalization constrains the recruit to six training days and one recovery day", () => {
  const normalized = contract.normalizeContractDraft(validInput({ trainingDaysPerWeek: 9 }), options);
  assert.equal(normalized.trainingDaysPerWeek, 6);
  const schedule = contract.buildCommitmentSchedule(normalized, options);
  assert.equal(schedule.length, 7);
  assert.equal(schedule.filter((day) => day.isRecoveryDay).length, 1);
  assert.equal(schedule.at(-1).weekday, "SUN");
  assert.equal(schedule.at(-1).isRecoveryDay, true);
});

test("goal-specific commitments block an unrealistic contract", () => {
  const result = contract.validateRecruitContract(validInput({
    primaryGoal: "RUN_FASTER",
    runningDaysPerWeek: 1
  }), options);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /requires at least two running days/i);
});

test("module minimums never schedule more than the recruit committed to", () => {
  const result = contract.validateRecruitContract(validInput({
    primaryGoal: "LOSE_FAT",
    strengthDaysPerWeek: 1,
    coreDaysPerWeek: 1
  }), options);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /zero or at least two strength days/i);
  assert.match(result.errors.join(" "), /zero or at least two core days/i);
});

test("running baseline gaps are visible without blocking the whole contract", () => {
  const result = contract.buildRecruitContract(validInput({ declaredWeeklyDistance: 0 }), options);
  assert.equal(result.status, "READY_FOR_APPROVAL");
  assert.equal(result.moduleReadiness.running.status, "BASELINE_REQUIRED");
  assert.match(result.warnings.join(" "), /weekly-distance baseline/i);
});

test("the seven-day commitment map coordinates stacked modalities", () => {
  const result = contract.buildRecruitContract(validInput(), options);
  assert.equal(result.schedule.length, 7);
  assert.equal(result.schedule.filter((day) => day.activities.includes("STRENGTH")).length, 3);
  assert.equal(result.schedule.filter((day) => day.activities.includes("RUNNING")).length, 3);
  assert.equal(result.schedule.filter((day) => day.activities.includes("CORE")).length, 3);
  assert.ok(result.schedule.some((day) => day.load === "STACKED"));
  assert.equal(new Set(result.schedule.map((day) => day.date)).size, 7);
});

test("Two-a-Days is a deliberate contract capacity with a 240-minute ceiling", () => {
  const result = contract.buildRecruitContract(validInput({ twoADays: true }), options);
  assert.equal(result.twoADays, true);
  assert.equal(contract.TWO_A_DAY_TARGET_MINUTES, 121);
  assert.equal(contract.TWO_A_DAY_MAX_MINUTES, 240);
  assert.ok(result.schedule.some((day) => day.load === "TWO_A_DAY" && day.twoADayEligible));
  assert.ok(result.schedule.every((day) => day.activities.length <= 2));
  assert.ok(result.schedule.filter((day) => day.twoADayEligible).every((day) => day.activities.length === 2));
  assert.ok(result.schedule.filter((day) => day.load === "TWO_A_DAY").every((day) => day.dailyMinuteCap === 240));
  assert.match(result.warnings.join(" "), /more than 120 combined minutes/i);
  assert.match(result.safeguards.join(" "), /long runs have no time ceiling/i);
});

test("Two-a-Day commitments reject more than two weekly sessions per training-day slot", () => {
  const result = contract.buildRecruitContract(validInput({
    trainingDaysPerWeek: 2,
    strengthDaysPerWeek: 2,
    runningDaysPerWeek: 2,
    coreDaysPerWeek: 2,
    twoADays: true
  }), options);
  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.match(result.errors.join(" "), /no more than two.*sessions per training day/i);
});

test("an omitted or unchecked Two-a-Days option remains off", () => {
  assert.equal(contract.normalizeContractDraft(validInput({ twoADays: undefined }), options).twoADays, false);
  assert.equal(contract.normalizeContractDraft(validInput({ twoADays: "true" }), options).twoADays, true);
  assert.equal(contract.normalizeContractDraft(validInput({ twoADays: "false" }), options).twoADays, false);
});

test("contract inputs map cleanly into every planning module", () => {
  const inputs = contract.contractPlanningInputs(validInput({
    primaryGoal: "RUN_FASTER",
    equipment: "DUMBBELLS",
    experience: "EXPERIENCED",
    sessionMinutes: 75
  }), options);
  assert.deepEqual(inputs.strength, {
    goal: "ATHLETIC_SUPPORT",
    daysPerWeek: 3,
    equipment: "DUMBBELLS",
    sessionMinutes: 75,
    experience: "EXPERIENCED"
  });
  assert.equal(inputs.running.goal, "10K");
  assert.equal(inputs.running.runningDaysPerWeek, 3);
  assert.equal(inputs.core.goal, "RUNNING_SUPPORT");
  assert.equal(inputs.core.experience, "ADVANCED");
  assert.equal(inputs.nutrition.goal, "PERFORMANCE");
  assert.equal(inputs.athleteProfile.athleteType, "VETERAN");
});

test("recruit context derives athlete type and training experience", () => {
  const foundation = contract.normalizeContractDraft(validInput({ trainingYears: 1, experience: undefined }), options);
  const trained = contract.normalizeContractDraft(validInput({ trainingYears: 5, experience: undefined }), options);
  assert.equal(foundation.athleteType, "FOUNDATION");
  assert.equal(foundation.experience, "FOUNDATION");
  assert.equal(trained.athleteType, "TRAINED");
  assert.equal(trained.experience, "INTERMEDIATE");
  assert.equal(trained.heightCm, 177.8);
});

test("a deleted contract remains a revision boundary for its replacement", () => {
  const draft = contract.buildRecruitContract(validInput(), options);
  const next = contract.approveRecruitContract(draft, {
    id: "deleted-prior",
    deletedContractId: "prior-contract",
    status: "DELETED",
    revision: 3
  }, { ...options, approvedAt: "2026-08-01T13:00:00.000Z" });
  assert.equal(next.revision, 4);
  assert.equal(next.supersedesId, "prior-contract");
});

test("an approved nutrition baseline is linked into the contract", () => {
  const draft = contract.buildRecruitContract(validInput(), options);
  const readiness = contract.resolveNutritionPlanReadiness(draft, {
    id: "nutrition-1",
    status: "APPROVED",
    goal: "MAINTAIN",
    effectiveDate: "2026-08-03",
    recoveryTargets: { calories: 2200, protein: 170, carbs: 230, fat: 70 }
  }, { date: "2026-08-03" });
  assert.equal(readiness.status, "PLAN_LINKED");
  assert.equal(readiness.aligned, true);
  assert.equal(readiness.targetSummary, "2200 kcal · 170g protein");
});

test("a future nutrition baseline is visible as scheduled", () => {
  const draft = contract.buildRecruitContract(validInput(), options);
  const readiness = contract.resolveNutritionPlanReadiness(draft, {
    id: "nutrition-future",
    status: "APPROVED",
    goal: "MAINTAIN",
    effectiveDate: "2026-08-10",
    recoveryTargets: { calories: 2200, protein: 170 }
  }, { date: "2026-08-03" });
  assert.equal(readiness.status, "SCHEDULED");
  assert.equal(readiness.scheduled, true);
  assert.match(readiness.message, /2026-08-10/);
});

test("a linked nutrition goal mismatch is reviewable without hiding the plan", () => {
  const draft = contract.buildRecruitContract(validInput({ primaryGoal: "LOSE_FAT" }), options);
  const readiness = contract.resolveNutritionPlanReadiness(draft, {
    id: "nutrition-maintain",
    status: "APPROVED",
    goal: "MAINTAIN",
    effectiveDate: "2026-08-03",
    recoveryTargets: { calories: 2200, protein: 170 }
  }, { date: "2026-08-03" });
  assert.equal(readiness.status, "PLAN_REVIEW");
  assert.equal(readiness.baseline.id, "nutrition-maintain");
  assert.match(readiness.message, /differs from the contract/i);
});

test("approval is explicit, revisioned, and preserves the prior contract identity", () => {
  const draft = contract.buildRecruitContract(validInput(), options);
  const first = contract.approveRecruitContract(draft, null, {
    ...options,
    approvedAt: "2026-07-30T13:00:00.000Z"
  });
  const secondDraft = contract.buildRecruitContract(validInput({ target: "Build durable fitness for a fall 10K" }), options);
  const second = contract.approveRecruitContract(secondDraft, first, {
    ...options,
    approvedAt: "2026-08-01T13:00:00.000Z"
  });
  assert.equal(first.status, "APPROVED");
  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.equal(second.supersedesId, first.id);
  assert.notEqual(second.id, first.id);
});

test("an existing-user amendment recovers the saved orientation profile and creates a new immutable revision", () => {
  const legacyApproved = {
    ...contract.approveRecruitContract(contract.buildRecruitContract(validInput(), options), null, {
      ...options,
      approvedAt: "2026-07-30T13:00:00.000Z"
    }),
    age: null,
    heightCm: null,
    trainingYears: null,
    athleteProfile: { age: null, heightCm: null, heightUnit: "in", gender: "PREFER_NOT_TO_SAY", trainingYears: null }
  };
  const amendment = contract.buildRecruitContractAmendment(legacyApproved, { twoADays: true }, {
    age: 42,
    heightCm: 177.8,
    heightUnit: "in",
    gender: "MAN",
    trainingYears: 8
  }, options);
  assert.equal(amendment.status, "READY_FOR_APPROVAL");
  assert.equal(amendment.age, 42);
  assert.equal(amendment.heightCm, 177.8);
  assert.equal(amendment.trainingYears, 8);
  assert.equal(amendment.twoADays, true);
  assert.equal(amendment.amendsContractId, legacyApproved.id);
  const replacement = contract.approveRecruitContract(amendment, legacyApproved, {
    ...options,
    approvedAt: "2026-08-02T13:00:00.000Z"
  });
  assert.equal(replacement.revision, legacyApproved.revision + 1);
  assert.notEqual(replacement.id, legacyApproved.id);
  assert.equal(replacement.supersedesId, legacyApproved.id);
});

test("an unchanged expired target date does not trap an existing amendment", () => {
  const previous = contract.approveRecruitContract(contract.buildRecruitContract(validInput({ targetDate: "2026-07-31" }), {
    ...options,
    today: "2026-07-30"
  }), null, {
    ...options,
    today: "2026-07-30",
    approvedAt: "2026-07-30T13:00:00.000Z"
  });
  const amendment = contract.buildRecruitContractAmendment(previous, { twoADays: true }, previous.athleteProfile, {
    ...options,
    today: "2026-08-02"
  });
  assert.equal(amendment.targetDate, null);
  assert.equal(amendment.status, "READY_FOR_APPROVAL");
});

test("approving a contract never embeds or mutates active module plans", () => {
  const activePlan = Object.freeze({ id: "strength-plan-active", status: "APPROVED" });
  const draft = contract.buildRecruitContract(validInput(), options);
  const approved = contract.approveRecruitContract(draft, null, {
    ...options,
    approvedAt: "2026-07-30T13:00:00.000Z"
  });
  assert.equal(activePlan.status, "APPROVED");
  assert.equal(Object.hasOwn(approved, "activePlan"), false);
  assert.equal(Object.hasOwn(approved.planningInputs, "plans"), false);
  assert.match(approved.safeguards.join(" "), /does not activate or replace/i);
});

console.log(`Recruit Contract tests passed (${passed}).`);
