const test = require("node:test");
const assert = require("node:assert/strict");
const {
  VERSION,
  reviewFastingProtocol,
  approveFastingProtocol,
  dailyFastingContext
} = require("../assets/js/intermittent-fasting.js");

function eligible(overrides = {}) {
  return {
    protocol: "14_10",
    eatingStart: "10:00",
    effectiveDate: "2026-08-03",
    notPregnantOrBreastfeeding: true,
    noEatingDisorderHistory: true,
    medicalClearanceConfirmed: true,
    trainingOverrideAccepted: true,
    ...overrides
  };
}

function approved(overrides = {}) {
  return approveFastingProtocol(reviewFastingProtocol(eligible(overrides), { age: 40, today: "2026-08-03" }));
}

test("023C exposes a deterministic fasting protocol engine", () => {
  assert.equal(VERSION, "023C.1");
});

test("protocol review blocks minors and incomplete safety screening", () => {
  const minor = reviewFastingProtocol(eligible(), { age: 17, today: "2026-08-03" });
  assert.equal(minor.status, "REVIEW REQUIRED");
  assert.match(minor.blockers.join(" "), /adult age/i);
  const incomplete = reviewFastingProtocol(eligible({ medicalClearanceConfirmed: false }), { age: 40 });
  assert.match(incomplete.blockers.join(" "), /clinician guidance/i);
});

test("valid protocols preserve a fixed eating duration and require approval", () => {
  const proposal = reviewFastingProtocol(eligible(), { age: 40 });
  assert.equal(proposal.status, "READY FOR APPROVAL");
  assert.equal(proposal.eatingHours, 10);
  assert.equal(proposal.eatingStart, "10:00");
  assert.equal(proposal.eatingEnd, "20:00");
  assert.equal(proposal.targetPolicy, "APPROVED DAILY TARGETS UNCHANGED");
  const result = approveFastingProtocol(proposal, { revision: 2 }, "2026-08-03T12:00:00.000Z");
  assert.equal(result.status, "APPROVED");
  assert.equal(result.revision, 3);
});

test("turning fasting off never requires health attestations", () => {
  const proposal = reviewFastingProtocol({ protocol: "OFF", effectiveDate: "2026-08-03" }, { age: null });
  assert.equal(proposal.status, "READY FOR APPROVAL");
  assert.equal(approveFastingProtocol(proposal).status, "OFF");
});

test("Two-a-Days and long runs suspend the fasting clock", () => {
  const protocol = approved();
  const split = dailyFastingContext({ protocol, date: "2026-08-03", calendarContext: { trainingDay: true, splitDay: true } });
  const long = dailyFastingContext({ protocol, date: "2026-08-03", calendarContext: { trainingDay: true, longRun: true } });
  assert.equal(split.status, "SUSPENDED TODAY");
  assert.match(split.detail, /Two-a-Day/);
  assert.equal(long.status, "SUSPENDED TODAY");
  assert.match(long.detail, /Long-run/);
});

test("RED readiness or pain suspends fasting without a penalty", () => {
  const result = dailyFastingContext({
    protocol: approved(),
    date: "2026-08-03",
    readiness: "RED",
    calendarContext: { trainingDay: false }
  });
  assert.equal(result.status, "SUSPENDED TODAY");
  assert.ok(result.safeguards.some((item) => /No missed-fast penalty/.test(item)));
});

test("morning training moves the window earlier and fasting resolves by time", () => {
  const protocol = approved({ protocol: "16_8", eatingStart: "10:00" });
  const context = dailyFastingContext({
    protocol,
    date: "2026-08-03",
    now: new Date(2026, 7, 3, 6, 30),
    calendarContext: { trainingDay: true, mealWindow: "MORNING" }
  });
  assert.equal(context.status, "FAST ACTIVE");
  assert.equal(context.eatingStart, "07:00");
  assert.equal(context.adjustedForTraining, true);
  assert.equal(context.mealWindow, "FASTING_TRAINING");
});

test("an eligible recovery-day window opens without changing targets", () => {
  const context = dailyFastingContext({
    protocol: approved(),
    date: "2026-08-03",
    now: new Date(2026, 7, 3, 12, 0),
    calendarContext: { trainingDay: false }
  });
  assert.equal(context.status, "EATING WINDOW OPEN");
  assert.equal(context.mealWindow, "FASTING_RECOVERY");
  assert.match(context.targetPolicy, /UNCHANGED/);
});

