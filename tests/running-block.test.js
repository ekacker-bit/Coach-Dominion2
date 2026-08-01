const assert = require("assert");
const running = require("../assets/js/running-command.js");

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; } catch (error) { console.error(`FAIL: ${name}`); throw error; }
}

function profile(overrides = {}) {
  return {
    goal: "10K",
    targetDate: "2026-10-01",
    runningDaysPerWeek: 3,
    preferredUnit: "mi",
    declaredWeeklyDistance: 20,
    approvedAt: "2026-07-31T12:00:00.000Z",
    updatedAt: "2026-07-31T12:00:00.000Z",
    recruitContractId: "contract-2",
    recruitContractRevision: 2,
    ...overrides
  };
}

function contractSchedule() {
  return Array.from({ length: 7 }, (_, index) => ({
    weekday: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][index],
    activities: [1, 3, 5].includes(index) ? ["RUNNING"] : index === 0 ? ["STRENGTH", "CORE"] : []
  }));
}

test("four-week block is available without benchmark evidence", () => {
  const block = running.buildRunningBlock(profile(), [], { today: "2026-07-31", contractSchedule: contractSchedule() });
  assert.equal(block.status, "DRAFT");
  assert.equal(block.prescriptionMode, "EFFORT");
  assert.equal(block.weeks.length, 4);
  assert.match(block.message, /effort guidance/i);
});

test("contract calendar controls running weekdays", () => {
  const block = running.buildRunningBlock(profile(), [], { today: "2026-07-31", contractSchedule: contractSchedule() });
  block.weeks.forEach((week) => {
    assert.deepEqual(week.sessions.filter((session) => session.type !== "REST").map((session) => session.dayIndex), [1, 3, 5]);
  });
});

test("block uses foundation build build consolidate progression", () => {
  const block = running.buildRunningBlock(profile(), [], { today: "2026-07-31" });
  assert.deepEqual(block.weeks.map((week) => week.phase), ["FOUNDATION", "BUILD_1", "BUILD_2", "CONSOLIDATE"]);
  assert.deepEqual(block.weeks.map((week) => week.weeklyDistance), [20, 21, 22, 18]);
  assert.equal(block.safeguards.maximumWeeklyProgressionPercent, 5);
});

test("effort-only sessions carry usable RPE guidance", () => {
  const block = running.buildRunningBlock(profile(), [], { today: "2026-07-31" });
  const sessions = block.weeks.flatMap((week) => week.sessions).filter((session) => session.type !== "REST");
  assert.ok(sessions.every((session) => session.effortRpe && session.effortCue));
  assert.ok(sessions.every((session) => session.paceFast === null));
});

test("long-run prescriptions retain their full estimated duration without a time cap", () => {
  const block = running.buildRunningBlock(profile({ declaredWeeklyDistance: 100 }), [], { today: "2026-07-31" });
  const longRuns = block.weeks.flatMap((week) => week.sessions).filter((session) => session.type === "LONG");
  assert.ok(longRuns.some((session) => session.estimatedMinutes > 120));
  assert.ok(longRuns.every((session) => session.durationCapMinutes === null));
  assert.ok(longRuns.every((session) => session.durationPolicy === "UNCAPPED_BY_TIME"));
  assert.equal(block.weeks[0].safeguards.longRunDurationCapMinutes, null);
  assert.equal(block.weeks[0].safeguards.longRunDurationPolicy, "UNCAPPED_BY_TIME");
});

test("valid benchmark switches the block to pace mode", () => {
  const block = running.buildRunningBlock(profile({ benchmarkDistance: "5K", benchmarkSeconds: 1500 }), [], { today: "2026-07-31" });
  assert.equal(block.prescriptionMode, "PACE");
  assert.ok(block.weeks[0].sessions.some((session) => session.paceFast > 0));
});

test("seven running days are rejected to protect recovery", () => {
  const block = running.buildRunningBlock(profile({ runningDaysPerWeek: 7 }), [], { today: "2026-07-31" });
  assert.equal(block.status, "RECOVERY_REQUIRED");
  assert.equal(block.weeks.length, 0);
});

test("draft remains non-active until explicit approval", () => {
  const draft = running.buildRunningBlock(profile(), [], { today: "2026-07-31" });
  assert.equal(running.weeklyPlanForDate(draft, "2026-07-31"), null);
  const approved = running.approveRunningBlock(draft, null, { approvedAt: "2026-07-31T13:00:00.000Z" });
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.revision, 1);
  assert.ok(running.weeklyPlanForDate(approved, "2026-07-31"));
});

test("approving a replacement preserves revision lineage", () => {
  const first = running.approveRunningBlock(running.buildRunningBlock(profile(), [], { today: "2026-07-31" }));
  const replacement = running.buildRunningBlock(profile({ declaredWeeklyDistance: 22 }), [], { today: "2026-07-31" });
  const second = running.approveRunningBlock(replacement, first);
  assert.equal(second.revision, 2);
  assert.equal(second.supersedesId, first.id);
});

test("contract revisions are visible without invalidating the active block", () => {
  const active = running.approveRunningBlock(running.buildRunningBlock(profile(), [], { today: "2026-07-31", recruitContractId: "contract-2", recruitContractRevision: 2 }));
  assert.equal(running.blockContractState(active, { id: "contract-2", revision: 2 }), "ALIGNED");
  assert.equal(running.blockContractState(active, { id: "contract-3", revision: 3 }), "CONTRACT_UPDATE_AVAILABLE");
  assert.ok(running.weeklyPlanForDate(active, "2026-07-31"));
});

test("dates outside the approved block do not leak a stale plan", () => {
  const active = running.approveRunningBlock(running.buildRunningBlock(profile(), [], { today: "2026-07-31" }));
  assert.equal(running.weeklyPlanForDate(active, "2027-01-01"), null);
});

test("readiness-adjusted effort plans reduce distance and time together", () => {
  const active = running.approveRunningBlock(running.buildRunningBlock(profile(), [], { today: "2026-07-31" }));
  const week = running.weeklyPlanForDate(active, "2026-07-31");
  const session = week.sessions.find((item) => item.type !== "REST");
  const adjusted = running.buildDailyRunPrescription(week, { today: session.date, readiness: { energy: 5, soreness: 6, pain: false } });
  assert.equal(adjusted.status, "ADJUSTED");
  assert.ok(adjusted.session.distance < session.distance);
  assert.ok(adjusted.session.estimatedMinutes < session.estimatedMinutes);
  assert.ok(adjusted.session.effortRpe);
});

console.log(`Running block tests passed (${passed}).`);
