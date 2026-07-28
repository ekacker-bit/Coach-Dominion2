const assert = require("assert");
const running = require("../assets/js/running-command.js");

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; } catch (error) { console.error(`FAIL: ${name}`); throw error; }
}

function run(overrides = {}) {
  return {
    id: "run-1",
    domain: "running",
    entryType: "RACE",
    performanceDate: "2026-07-20",
    evidenceStatus: "VERIFIED",
    source: "IMPORTED",
    metrics: { distance: 5, distance_unit: "km", duration_seconds: 1500 },
    ...overrides
  };
}

test("profile defaults are conservative and deterministic", () => {
  assert.deepEqual(running.normalizeProfile({}), {
    goal: "GENERAL_FITNESS", targetDate: null, runningDaysPerWeek: 3, preferredUnit: "mi", declaredWeeklyDistance: null,
    benchmarkDistance: null, benchmarkSeconds: null, benchmarkDate: null, approvedAt: null, updatedAt: null
  });
});

test("running days are bounded to one through seven", () => {
  assert.equal(running.normalizeProfile({ runningDaysPerWeek: 12 }).runningDaysPerWeek, 7);
  assert.equal(running.normalizeProfile({ runningDaysPerWeek: 0 }).runningDaysPerWeek, 3);
});

test("invalid goals do not silently become race goals", () => {
  assert.equal(running.normalizeProfile({ goal: "ultra" }).goal, "GENERAL_FITNESS");
});

test("distance conversion is exact enough for planning", () => {
  assert.ok(Math.abs(running.distanceToKm(1, "mi") - 1.609344) < 0.000001);
});

test("untimed running evidence is rejected", () => {
  assert.equal(running.runningEntryEvidence(run({ metrics: { distance: 5, distance_unit: "km" } })), null);
});

test("approved profile benchmark has explicit precedence", () => {
  const benchmark = running.selectBenchmark({ benchmarkDistance: "10K", benchmarkSeconds: 3000 }, [run()]);
  assert.equal(benchmark.source, "PROFILE");
  assert.equal(benchmark.distanceKm, 10);
});

test("recent timed performance evidence can establish benchmark", () => {
  const benchmark = running.selectBenchmark({}, [run()]);
  assert.equal(benchmark.source, "IMPORTED");
  assert.equal(benchmark.evidenceStatus, "VERIFIED");
});

test("zones remain unavailable without a valid benchmark", () => {
  assert.equal(running.derivePaceZones({}, []).status, "INSUFFICIENT_EVIDENCE");
  assert.deepEqual(running.derivePaceZones({}, []).zones, []);
});

test("valid benchmark produces ordered planning zones", () => {
  const result = running.derivePaceZones({ benchmarkDistance: "5K", benchmarkSeconds: 1500, preferredUnit: "km" });
  assert.equal(result.status, "READY");
  assert.equal(result.zones.length, 5);
  assert.ok(result.zones[0].fastSecondsPerUnit < result.zones[0].slowSecondsPerUnit);
  assert.ok(result.zones[0].fastSecondsPerUnit > result.zones[4].fastSecondsPerUnit);
});

test("mile pace output uses preferred units", () => {
  const result = running.derivePaceZones({ benchmarkDistance: "5K", benchmarkSeconds: 1500, preferredUnit: "mi" });
  assert.match(running.formatPace(result.zones[1].fastSecondsPerUnit, "mi"), /\/mi$/);
});

test("28-day baseline excludes older evidence", () => {
  const baseline = running.deriveMileageBaseline([
    run({ performanceDate: "2026-07-20" }),
    run({ id: "old", performanceDate: "2026-05-01" })
  ], { today: "2026-07-28", preferredUnit: "km" });
  assert.equal(baseline.runCount, 1);
  assert.equal(baseline.fourWeekDistance, 5);
});

test("command distinguishes profile, benchmark, and baseline states", () => {
  assert.equal(running.buildRunningCommand({}, []).readiness, "PROFILE_DRAFT");
  assert.equal(running.buildRunningCommand({ approvedAt: "2026-07-28" }, []).readiness, "BENCHMARK_REQUIRED");
  assert.equal(running.buildRunningCommand({ approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500 }, []).readiness, "BASELINE_LIMITED");
  assert.equal(running.buildRunningCommand({ approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500 }, [run()], { today: "2026-07-28" }).readiness, "READY");
});

test("weekly plan requires an approved profile", () => {
  assert.equal(running.buildWeeklyRunningPlan({}, [run()], { today: "2026-07-28" }).status, "PROFILE_REQUIRED");
});

test("weekly plan requires a mileage baseline", () => {
  const profile = { approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500 };
  assert.equal(running.buildWeeklyRunningPlan(profile, [], { today: "2026-07-28" }).status, "BASELINE_REQUIRED");
});

test("athlete-declared mileage can establish a labeled fallback baseline", () => {
  const plan = running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 15, preferredUnit: "mi"
  }, [], { today: "2026-07-28" });
  assert.equal(plan.status, "READY");
  assert.equal(plan.baselineSource, "ATHLETE_DECLARED");
  assert.equal(plan.weeklyDistance, 15);
});

test("observed mileage takes precedence over declared mileage", () => {
  const plan = running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 100, preferredUnit: "km"
  }, [run()], { today: "2026-07-28" });
  assert.equal(plan.baselineSource, "OBSERVED_28_DAY_AVERAGE");
  assert.equal(plan.weeklyDistance, 1.3);
});

test("weekly plan always covers Monday through Sunday", () => {
  const plan = running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 20, runningDaysPerWeek: 4
  }, [], { today: "2026-07-30" });
  assert.equal(plan.weekStart, "2026-07-27");
  assert.equal(plan.weekEnd, "2026-08-02");
  assert.equal(plan.sessions.length, 7);
  assert.equal(plan.sessions.filter((item) => item.type !== "REST").length, 4);
});

test("foundation week applies no mileage progression", () => {
  const plan = running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 20
  }, [], { today: "2026-07-28" });
  assert.equal(plan.safeguards.progressionPercent, 0);
});

test("long run and quality volume remain bounded", () => {
  const plan = running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 30, runningDaysPerWeek: 6, goal: "10K"
  }, [], { today: "2026-07-28" });
  const long = plan.sessions.find((item) => item.type === "LONG");
  assert.ok(long.distance <= 10.5);
  plan.sessions.filter((item) => ["TEMPO", "INTERVAL"].includes(item.type)).forEach((item) => assert.ok(item.distance <= 6));
});

test("two quality sessions are separated by a recovery day", () => {
  const plan = running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 30, runningDaysPerWeek: 6, goal: "10K"
  }, [], { today: "2026-07-28" });
  const qualityDays = plan.sessions.filter((item) => ["TEMPO", "INTERVAL"].includes(item.type)).map((item) => item.dayIndex);
  assert.ok(Math.abs(qualityDays[1] - qualityDays[0]) > 1);
});

test("one-day schedules do not mislabel the only run as long", () => {
  const plan = running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-28", benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 5, runningDaysPerWeek: 1
  }, [], { today: "2026-07-28" });
  assert.equal(plan.sessions.find((item) => item.type !== "REST").type, "EASY");
});

console.log(`Running Command: ${passed} assertions passed.`);
