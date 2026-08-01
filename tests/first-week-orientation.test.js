const assert = require("node:assert/strict");
const test = require("node:test");
const orientation = require("../assets/js/first-week-orientation.js");

function contract(overrides = {}) {
  return {
    id: "contract-21c-r4",
    revision: 4,
    status: "APPROVED",
    effectiveDate: "2026-08-03",
    age: 42,
    heightCm: 180.3,
    heightUnit: "in",
    gender: "MAN",
    trainingYears: 9,
    athleteType: "VETERAN",
    ...overrides
  };
}

test("athlete type is deterministically derived from structured training years", () => {
  assert.equal(orientation.deriveAthleteType(0), "FOUNDATION");
  assert.equal(orientation.deriveAthleteType(2), "DEVELOPING");
  assert.equal(orientation.deriveAthleteType(5), "TRAINED");
  assert.equal(orientation.deriveAthleteType(12), "VETERAN");
});

test("profile normalization retains context and standardizes height", () => {
  const result = orientation.validateProfile({ age: 36, heightValue: 70, heightUnit: "in", gender: "woman", trainingYears: 4 });
  assert.equal(result.valid, true);
  assert.equal(result.profile.heightCm, 177.8);
  assert.equal(result.profile.athleteType, "TRAINED");
  assert.equal(result.profile.gender, "WOMAN");
});

test("an incomplete legacy profile is the first orientation gate", () => {
  const result = orientation.createOrientation(contract({ age: null, heightCm: null, trainingYears: null }), { today: "2026-08-01" });
  assert.equal(result.status, "PROFILE_REQUIRED");
  assert.equal(result.currentStep, 0);
});

test("new signed contracts enter the daily-rhythm briefing", () => {
  const result = orientation.createOrientation(contract(), { today: "2026-08-01" });
  assert.equal(result.status, "IN_PROGRESS");
  assert.equal(result.currentStep, 1);
  assert.equal(result.weekStart, "2026-08-03");
  assert.equal(result.weekEnd, "2026-08-09");
});

test("Week One cannot launch until rhythm and baseline are acknowledged", () => {
  const created = orientation.createOrientation(contract());
  assert.throws(() => orientation.transition(created, "COMPLETE"), /baseline-week protocol/i);
  const rhythm = orientation.transition(created, "ACKNOWLEDGE_RHYTHM", {}, { now: "2026-08-01T10:00:00.000Z" });
  const baseline = orientation.transition(rhythm, "ACKNOWLEDGE_BASELINE", {}, { now: "2026-08-01T10:01:00.000Z" });
  const complete = orientation.transition(baseline, "COMPLETE", {}, { now: "2026-08-01T10:02:00.000Z" });
  assert.equal(complete.status, "COMPLETE");
  assert.equal(orientation.presentation(complete, contract()).percent, 100);
});

test("a signed amendment carries First Week Orientation forward", () => {
  const previousContract = contract();
  const created = orientation.createOrientation(previousContract);
  const rhythm = orientation.transition(created, "ACKNOWLEDGE_RHYTHM", {}, { now: "2026-08-01T10:00:00.000Z" });
  const baseline = orientation.transition(rhythm, "ACKNOWLEDGE_BASELINE", {}, { now: "2026-08-01T10:01:00.000Z" });
  const complete = orientation.transition(baseline, "COMPLETE", {}, { now: "2026-08-01T10:02:00.000Z" });
  const replacement = contract({ id: "contract-21d-r5", revision: 5, twoADays: true });
  const rebased = orientation.rebaseOrientation(complete, previousContract, replacement, { today: "2026-08-01", updatedAt: "2026-08-01T11:00:00.000Z" });
  assert.equal(rebased.contractId, replacement.id);
  assert.equal(rebased.contractRevision, 5);
  assert.equal(rebased.status, "COMPLETE");
  assert.equal(rebased.completedAt, complete.completedAt);
});

test("Atlas receives a baseline hold and age-aware guardrail", () => {
  const state = orientation.createOrientation(contract({ age: 57 }), { today: "2026-08-01" });
  const context = orientation.atlasProfileContext(state.profile, state);
  assert.equal(context.progressionPolicy, "HOLD_PROGRESSION");
  assert.ok(context.guardrails.some((item) => /RHR.*HRV|heart rate.*HRV/i.test(item)));
});

test("retiring a contract preserves history and emits a higher revision tombstone", () => {
  const result = orientation.retireContract(contract(), { deletedAt: "2026-08-01T12:00:00.000Z" });
  assert.equal(result.retired.status, "RETIRED");
  assert.equal(result.retired.id, "contract-21c-r4");
  assert.equal(result.tombstone.status, "DELETED");
  assert.equal(result.tombstone.deletedContractId, "contract-21c-r4");
  assert.equal(result.tombstone.revision, 5);
});
