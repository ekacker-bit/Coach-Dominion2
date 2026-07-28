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
    goal: "GENERAL_FITNESS", targetDate: null, runningDaysPerWeek: 3, preferredUnit: "mi",
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

console.log(`Running Command: ${passed} assertions passed.`);
