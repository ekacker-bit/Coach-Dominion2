const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const block = require("../assets/js/strength-block.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

function approvedPlan(revision = 2) {
  return {
    id: "strength-plan-1",
    status: "APPROVED",
    revision,
    profile: { daysPerWeek: 4 },
    sessions: [{
      id: "SESSION_A",
      name: "Session A",
      exercises: [
        { exerciseCode: "SQUAT", exerciseName: "Squat", recommendedSets: 4 },
        { exerciseCode: "ROW", exerciseName: "Row", recommendedSets: 3 }
      ]
    }]
  };
}

function intelligence(overrides = {}) {
  return {
    version: "017F.1",
    status: "READY",
    summary: { workSets: 24 },
    fatigue: { code: "STABLE" },
    posture: { code: "STAY_COURSE" },
    ...overrides
  };
}

function draft(options = {}, evidence = intelligence(), plan = approvedPlan()) {
  return block.buildBlockDraft(plan, evidence, {
    today: "2026-07-30",
    startDate: "2026-08-03",
    createdAt: "2026-07-30T12:00:00.000Z",
    ...options
  });
}

test("an approved strength program is required", () => {
  const result = block.buildBlockDraft({}, intelligence(), { today: "2026-07-30" });
  assert.equal(result.status, "PLAN_REQUIRED");
  assert.equal(result.approvalBlocked, true);
  assert.deepEqual(result.weeks, []);
});

test("block length is constrained to four through six weeks", () => {
  assert.equal(block.normalizeBlockLength(2), 4);
  assert.equal(block.normalizeBlockLength(5), 5);
  assert.equal(block.normalizeBlockLength(9), 6);
  assert.equal(draft({ lengthWeeks: 4 }).weeks.length, 4);
  assert.equal(draft({ lengthWeeks: 6 }).weeks.length, 6);
});

test("every standard block ends with a planned deload", () => {
  [4, 5, 6].forEach((length) => {
    const result = draft({ lengthWeeks: length });
    assert.equal(result.weeks.at(-1).phase.code, "DELOAD");
    assert.equal(result.weeks.at(-1).setTargetPercent, 60);
  });
});

test("missing strength evidence creates a neutral baseline block", () => {
  const result = draft({}, intelligence({
    status: "BASELINE_REQUIRED",
    summary: { workSets: 0 },
    posture: { code: "BASELINE_REQUIRED" }
  }));
  assert.equal(result.signal.code, "BASELINE_REQUIRED");
  assert.equal(result.approvalBlocked, false);
  assert.match(result.signal.detail, /Missing evidence remains neutral/);
});

test("fatigue recommends review without silently changing the phase map", () => {
  const result = draft({}, intelligence({
    fatigue: { code: "DELOAD_REVIEW" },
    posture: { code: "DELOAD_REVIEW" }
  }));
  assert.equal(result.signal.code, "DELOAD_REVIEW");
  assert.equal(result.approvalBlocked, false);
  assert.equal(result.weeks[0].phase.code, "FOUNDATION");
  assert.equal(result.status, "DRAFT");
});

test("pain is the highest-priority hold and blocks activation", () => {
  const result = draft({}, intelligence({
    fatigue: { code: "SAFETY_HOLD" },
    posture: { code: "PROGRESSING" }
  }));
  assert.equal(result.signal.code, "SAFETY_HOLD");
  assert.equal(result.approvalBlocked, true);
  assert.throws(() => block.approveBlock(result, approvedPlan()), /pain safety hold/i);
});

test("approval is explicit and validates the current plan revision", () => {
  const result = draft();
  assert.equal(result.status, "DRAFT");
  assert.throws(() => block.approveBlock(result, approvedPlan(3)), /program changed/i);
  const approved = block.approveBlock(result, approvedPlan(), "2026-07-30T13:00:00.000Z");
  assert.equal(approved.status, "ACTIVE");
  assert.equal(approved.approvedAt, "2026-07-30T13:00:00.000Z");
  assert.equal(result.status, "DRAFT");
});

test("revising a block creates a new immutable draft revision", () => {
  const original = draft({ lengthWeeks: 4 });
  const revised = block.reviseBlock(original, approvedPlan(), intelligence(), {
    lengthWeeks: 6,
    startDate: "2026-08-10"
  }, "2026-07-30T14:00:00.000Z");
  assert.equal(original.lengthWeeks, 4);
  assert.equal(original.revision, 1);
  assert.equal(revised.lengthWeeks, 6);
  assert.equal(revised.revision, 2);
  assert.equal(revised.startDate, "2026-08-10");
});

test("current block week and phase resolve deterministically", () => {
  const active = block.approveBlock(draft({ lengthWeeks: 5 }), approvedPlan());
  const context = block.blockWeekForDate(active, "2026-08-18");
  assert.equal(context.status, "ACTIVE");
  assert.equal(context.weekIndex, 3);
  assert.equal(context.week.phase.code, "ACCUMULATION");
  assert.match(context.label, /Week 3 of 5/);
});

test("block phases can only hold or reduce prescribed sets", () => {
  const active = block.approveBlock(draft({ lengthWeeks: 4 }), approvedPlan());
  const prescription = {
    date: "2026-08-24",
    exercises: [
      { exerciseCode: "SQUAT", recommendedSets: 4, recommendedLoad: 185, rationale: "Approved." },
      { exerciseCode: "ROW", recommendedSets: 3, recommendedLoad: 90, rationale: "Approved." }
    ]
  };
  const deloaded = block.applyBlockToPrescription(prescription, active, "2026-08-24");
  assert.equal(deloaded.block.phase.code, "DELOAD");
  assert.deepEqual(deloaded.exercises.map((item) => item.recommendedSets), [3, 2]);
  assert.deepEqual(deloaded.exercises.map((item) => item.recommendedLoad), [185, 90]);
  assert(deloaded.exercises.every((item) => item.blockAdjustment.loadChanged === false));
  assert.deepEqual(prescription.exercises.map((item) => item.recommendedSets), [4, 3]);
});

test("a coordinated schedule gains block metadata without changing dates", () => {
  const active = block.approveBlock(draft({ lengthWeeks: 5 }), approvedPlan());
  const schedule = {
    status: "APPROVED",
    assignments: [
      { id: "a", date: "2026-08-04" },
      { id: "b", date: "2026-08-18" }
    ]
  };
  const result = block.coordinateSchedule(schedule, active);
  assert.deepEqual(result.assignments.map((item) => item.date), ["2026-08-04", "2026-08-18"]);
  assert.deepEqual(result.assignments.map((item) => item.blockWeek), [1, 3]);
  assert.deepEqual(result.assignments.map((item) => item.blockPhase), ["FOUNDATION", "ACCUMULATION"]);
  assert.equal(schedule.assignments[0].blockWeek, undefined);
});

test("ending a block preserves it and the next block remains a draft", () => {
  const active = block.approveBlock(draft({ lengthWeeks: 4 }), approvedPlan());
  const ended = block.endBlock(active, "2026-08-31T12:00:00.000Z", "Completed.");
  assert.equal(ended.status, "ENDED");
  assert.equal(active.status, "ACTIVE");
  const next = block.buildNextBlockDraft(ended, approvedPlan(), intelligence(), {
    createdAt: "2026-08-31T12:05:00.000Z"
  });
  assert.equal(next.status, "DRAFT");
  assert.equal(next.sourceBlockId, active.id);
  assert.equal(next.startDate, "2026-08-31");
});

test("017G is integrated into the product, persistence contract, and full test suite", () => {
  const root = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
  const migration = fs.readFileSync(path.join(root, "supabase/migrations/020_strength_block_planning.sql"), "utf8");
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(html, /strength-block\.js/);
  assert.match(app, /DominionStrengthBlock/);
  assert.match(app, /STRENGTH BLOCK/);
  assert.match(app, /"BLOCK"/);
  assert.match(app, /stateType === "BLOCK"/);
  assert.match(app, /`block-\$\{stateKey\}`/);
  assert.match(css, /Build 017G/);
  assert.match(migration, /'BLOCK'/);
  assert.match(pkg.scripts.test, /strength-block\.test\.js/);
  assert.match(pkg.scripts["test:programming"], /strength-block\.test\.js/);
});

console.log(`All Build 017G strength block tests passed (${passed}).`);
