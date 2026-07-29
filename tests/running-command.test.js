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

function approvedPlan(overrides = {}) {
  return running.buildWeeklyRunningPlan({
    approvedAt: "2026-07-20", updatedAt: "2026-07-20",
    benchmarkDistance: "5K", benchmarkSeconds: 1500,
    declaredWeeklyDistance: 20, runningDaysPerWeek: 3,
    ...overrides
  }, [], { today: "2026-07-22" });
}

function evidenceForSession(session, ratio = 1, overrides = {}) {
  const distance = Number((session.distance * ratio).toFixed(2));
  const pace = (session.paceFast + session.paceSlow) / 2;
  return run({
    id: `evidence-${session.date}`,
    performanceDate: session.date,
    entryType: "WORKOUT_SUMMARY",
    provenance: { sourceProvider: "APPLE_HEALTH" },
    metrics: { distance, distance_unit: session.unit, duration_seconds: Math.round(distance * pace) },
    ...overrides
  });
}

test("reconciliation requires an approved weekly plan", () => {
  assert.equal(running.reconcileWeeklyRunningPlan({}, []).status, "PLAN_REQUIRED");
});

test("open week remains in progress while sessions are upcoming", () => {
  const result = running.reconcileWeeklyRunningPlan(approvedPlan(), [], { today: "2026-07-20" });
  assert.equal(result.status, "IN_PROGRESS");
  assert.ok(result.days.some((day) => day.classification === "UPCOMING"));
});

test("matching distance and pace reconcile automatically", () => {
  const plan = approvedPlan();
  const sessions = plan.sessions.filter((session) => session.type !== "REST");
  const evidence = sessions.map((session) => evidenceForSession(session));
  const result = running.reconcileWeeklyRunningPlan(plan, evidence, { today: "2026-07-27" });
  assert.equal(result.status, "READY");
  assert.equal(result.summary.MATCHED, 3);
  assert.equal(result.summary.completionPercent, 100);
});

test("partial distance remains explicit", () => {
  const plan = approvedPlan();
  const session = plan.sessions.find((item) => item.type !== "REST");
  const result = running.reconcileWeeklyRunningPlan(plan, [evidenceForSession(session, 0.7)], { today: "2026-07-27" });
  assert.equal(result.days.find((day) => day.date === session.date).classification, "PARTIAL");
});

test("excess distance requires review", () => {
  const plan = approvedPlan();
  const session = plan.sessions.find((item) => item.type !== "REST");
  const result = running.reconcileWeeklyRunningPlan(plan, [evidenceForSession(session, 1.25)], { today: "2026-07-27" });
  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(result.days.find((day) => day.date === session.date).classification, "REVIEW_REQUIRED");
});

test("runs on recovery days are never silently matched", () => {
  const plan = approvedPlan();
  const rest = plan.sessions.find((item) => item.type === "REST");
  const result = running.reconcileWeeklyRunningPlan(plan, [run({ performanceDate: rest.date })], { today: "2026-07-27" });
  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(result.days.find((day) => day.date === rest.date).classification, "UNPLANNED");
});

test("provider provenance survives reconciliation", () => {
  const plan = approvedPlan();
  const session = plan.sessions.find((item) => item.type !== "REST");
  const result = running.reconcileWeeklyRunningPlan(plan, [evidenceForSession(session)], { today: "2026-07-27" });
  assert.equal(result.days.find((day) => day.date === session.date).runs[0].source, "APPLE_HEALTH");
});

test("evidence outside the approved week is ignored", () => {
  const plan = approvedPlan();
  const result = running.reconcileWeeklyRunningPlan(plan, [run({ performanceDate: "2026-06-01" })], { today: "2026-07-27" });
  assert.equal(result.summary.evidenceRunCount, 0);
});

test("daily prescription requires an approved plan", () => {
  assert.equal(running.buildDailyRunPrescription({}, { today: "2026-07-20" }).status, "PLAN_REQUIRED");
});

test("daily prescription preserves recovery days", () => {
  const plan = approvedPlan();
  const rest = plan.sessions.find((item) => item.type === "REST");
  assert.equal(running.buildDailyRunPrescription(plan, { today: rest.date }).status, "REST_DAY");
});

test("green readiness preserves the approved session", () => {
  const plan = approvedPlan();
  const session = plan.sessions.find((item) => item.type !== "REST");
  const result = running.buildDailyRunPrescription(plan, { today: session.date, readiness: { energy: 8, soreness: 2, pain: false } });
  assert.equal(result.status, "READY");
  assert.equal(result.session.distance, session.distance);
  assert.equal(result.steps.length, 3);
});

test("moderate readiness reduces distance and removes intensity", () => {
  const plan = approvedPlan({ goal: "5K" });
  const quality = plan.sessions.find((item) => item.type === "INTERVAL");
  const result = running.buildDailyRunPrescription(plan, { today: quality.date, readiness: { energy: 5, soreness: 4, pain: false } });
  assert.equal(result.status, "ADJUSTED");
  assert.equal(result.session.type, "EASY");
  assert.ok(result.session.distance < quality.distance);
});

test("low readiness cuts distance in half", () => {
  const plan = approvedPlan();
  const session = plan.sessions.find((item) => item.type !== "REST");
  const result = running.buildDailyRunPrescription(plan, { today: session.date, readiness: { energy: 3, soreness: 8, pain: false } });
  assert.equal(result.adjustment.factor, 0.5);
  assert.equal(result.session.type, "RECOVERY");
});

test("pain always holds the run", () => {
  const plan = approvedPlan();
  const session = plan.sessions.find((item) => item.type !== "REST");
  const result = running.buildDailyRunPrescription(plan, { today: session.date, readiness: { energy: 10, soreness: 1, pain: true } });
  assert.equal(result.status, "PAIN_HOLD");
  assert.equal(result.session.distance, 0);
  assert.equal(result.steps[0].code, "STOP");
});

console.log(`Running Command: ${passed} assertions passed.`);
