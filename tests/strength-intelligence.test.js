const assert = require("assert");
const fs = require("fs");
const path = require("path");
const intelligence = require("../assets/js/strength-intelligence.js");

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

function execution({
  id,
  date,
  exerciseCode = "BACK_SQUAT",
  exerciseName = "Back Squat",
  pattern = "SQUAT",
  state = "COMPLETE",
  sets = [],
  painReported = false,
  substitution = null,
  attempt = 1
}) {
  return {
    id: id || `${date}:${exerciseCode}:attempt-${attempt}`,
    planId: "strength-plan",
    sessionId: "LOWER_A",
    sessionName: "Lower A",
    date,
    attempt,
    state,
    completedAt: `${date}T12:00:00.000Z`,
    painReported,
    sessionSnapshot: {
      exercises: [{
        exerciseCode,
        exerciseName,
        pattern,
        patternLabel: pattern === "SQUAT" ? "Squat" : pattern,
        recommendedSets: 3,
        targetReps: 5,
        unit: "lb"
      }]
    },
    setLogs: {
      [exerciseCode]: sets.map((set, index) => ({
        id: `${date}:${exerciseCode}:${index + 1}`,
        kind: set.kind || "WORK",
        reps: set.reps,
        load: set.load,
        unit: "lb",
        rpe: set.rpe ?? null
      }))
    },
    substitutions: substitution ? { [exerciseCode]: { name: substitution } } : {}
  };
}

function plan() {
  return {
    status: "APPROVED",
    sessions: [{
      id: "LOWER_A",
      name: "Lower A",
      exercises: [
        { exerciseCode: "BACK_SQUAT", exerciseName: "Back Squat", pattern: "SQUAT", patternLabel: "Squat", unit: "lb" },
        { exerciseCode: "DEAD_BUG", exerciseName: "Dead Bug", pattern: "CORE", patternLabel: "Core", unit: "lb" }
      ]
    }]
  };
}

test("empty history requires baselines without inventing progress", () => {
  const result = intelligence.buildStrengthIntelligence([], plan(), {
    today: "2026-07-30",
    generatedAt: "2026-07-30T12:00:00.000Z"
  });
  assert.equal(result.status, "BASELINE_REQUIRED");
  assert.equal(result.posture.code, "BASELINE_REQUIRED");
  assert.equal(result.summary.sessions, 0);
  assert.equal(result.trajectories.length, 2);
  assert(result.trajectories.every((item) => item.status.code === "NO_EVIDENCE"));
});

test("warm-up sets are excluded from workload, exposure counts, and records", () => {
  const history = [execution({
    date: "2026-07-28",
    sets: [
      { kind: "WARMUP", load: 45, reps: 10, rpe: 3 },
      { load: 135, reps: 5, rpe: 7 },
      { load: 135, reps: 5, rpe: 7.5 }
    ]
  })];
  const result = intelligence.buildStrengthIntelligence(history, plan(), { today: "2026-07-30" });
  assert.equal(result.summary.workSets, 2);
  assert.equal(result.weeks[0].workSets, 2);
  assert.equal(result.weeks[0].volume, 1350);
  assert.equal(result.verifiedRecords[0].record.value, 135);
});

test("a substitution stays visible but never becomes a record for the original movement", () => {
  const history = [execution({
    date: "2026-07-28",
    substitution: "Goblet Squat",
    sets: [{ load: 60, reps: 10, rpe: 7 }]
  })];
  const result = intelligence.buildStrengthIntelligence(history, plan(), { today: "2026-07-30" });
  const original = result.trajectories.find((item) => item.exerciseCode === "BACK_SQUAT");
  const substitute = result.trajectories.find((item) => item.exerciseName === "Goblet Squat");
  assert.equal(original.exposureCount, 0);
  assert.equal(substitute.exposureCount, 1);
  assert.equal(substitute.record, null);
  assert.equal(result.verifiedRecords.length, 0);
});

test("verified load and rep bests are grounded in recorded work sets", () => {
  const history = [
    execution({ date: "2026-07-21", sets: [{ load: 135, reps: 5, rpe: 7 }] }),
    execution({ date: "2026-07-28", sets: [{ load: 145, reps: 4, rpe: 8 }] })
  ];
  const result = intelligence.buildStrengthIntelligence(history, plan(), { today: "2026-07-30" });
  const squat = result.trajectories.find((item) => item.exerciseCode === "BACK_SQUAT");
  assert.equal(squat.record.type, "LOAD");
  assert.equal(squat.record.value, 145);
  assert.equal(squat.record.reps, 4);
  assert.equal(squat.record.newRecord, true);
  assert.equal(squat.status.code, "TRENDING_UP");
});

test("more reps at the same top load counts as progress without estimating a max", () => {
  const history = [
    execution({ date: "2026-07-21", sets: [{ load: 135, reps: 5, rpe: 7 }] }),
    execution({ date: "2026-07-28", sets: [{ load: 135, reps: 7, rpe: 8 }] })
  ];
  const squat = intelligence.exerciseTrajectories(history, plan()).find((item) => item.exerciseCode === "BACK_SQUAT");
  assert.equal(squat.status.code, "TRENDING_UP");
  assert.equal(squat.record.value, 135);
  assert.equal(squat.record.reps, 7);
});

test("four stable verified exposures create a plateau review instead of an automatic change", () => {
  const history = ["2026-07-07", "2026-07-14", "2026-07-21", "2026-07-28"].map((date) =>
    execution({ date, sets: [{ load: 135, reps: 5, rpe: 7.5 }] })
  );
  const squat = intelligence.exerciseTrajectories(history, plan()).find((item) => item.exerciseCode === "BACK_SQUAT");
  assert.equal(squat.status.code, "PLATEAU_REVIEW");
  assert.match(squat.status.detail, /Four verified exposures/);
});

test("repeated high effort produces a fatigue review", () => {
  const history = [
    execution({ date: "2026-07-21", sets: [{ load: 135, reps: 5, rpe: 9 }] }),
    execution({ date: "2026-07-28", sets: [{ load: 135, reps: 5, rpe: 9.5 }] })
  ];
  const result = intelligence.buildStrengthIntelligence(history, plan(), { today: "2026-07-30" });
  assert.equal(result.fatigue.code, "DELOAD_REVIEW");
  assert.equal(result.posture.code, "DELOAD_REVIEW");
  assert.match(result.posture.detail, /explicitly approved/);
});

test("pain is always the highest-priority safety signal", () => {
  const history = [
    execution({ date: "2026-07-21", sets: [{ load: 135, reps: 5, rpe: 7 }] }),
    execution({ date: "2026-07-28", sets: [{ load: 145, reps: 5, rpe: 7 }], painReported: true, state: "STOPPED" })
  ];
  const result = intelligence.buildStrengthIntelligence(history, plan(), { today: "2026-07-30" });
  assert.equal(result.fatigue.code, "SAFETY_HOLD");
  assert.equal(result.posture.code, "SAFETY_HOLD");
  assert.equal(result.verifiedRecords[0].record.value, 135);
});

test("a weekly workload spike needs at least two prior nonzero baselines", () => {
  const noBaseline = [
    execution({ date: "2026-07-06", sets: [{ load: 100, reps: 5, rpe: 7 }] }),
    execution({ date: "2026-07-27", sets: [{ load: 200, reps: 10, rpe: 7 }] })
  ];
  assert.equal(intelligence.buildStrengthIntelligence(noBaseline, plan(), { today: "2026-07-30" }).fatigue.code, "STABLE");

  const withBaseline = [
    execution({ date: "2026-07-06", sets: [{ load: 100, reps: 5, rpe: 7 }] }),
    execution({ date: "2026-07-13", sets: [{ load: 100, reps: 5, rpe: 7 }] }),
    execution({ date: "2026-07-27", sets: [{ load: 200, reps: 10, rpe: 7 }] })
  ];
  assert.equal(intelligence.buildStrengthIntelligence(withBaseline, plan(), { today: "2026-07-30" }).fatigue.code, "DELOAD_REVIEW");
});

test("retries count as one scheduled session while all recorded workload remains visible", () => {
  const history = [
    execution({ id: "attempt-1", date: "2026-07-28", state: "STOPPED", attempt: 1, sets: [{ load: 135, reps: 5, rpe: 8 }] }),
    execution({ id: "attempt-2", date: "2026-07-28", state: "COMPLETE", attempt: 2, sets: [{ load: 135, reps: 5, rpe: 7 }, { load: 135, reps: 5, rpe: 7 }] })
  ];
  const result = intelligence.buildStrengthIntelligence(history, plan(), { today: "2026-07-30" });
  assert.equal(result.summary.sessions, 1);
  assert.equal(result.summary.attempts, 2);
  assert.equal(result.summary.workSets, 3);
});

test("recent movement-pattern balance excludes evidence outside the 28-day window", () => {
  const history = [
    execution({ date: "2026-06-01", sets: [{ load: 100, reps: 5, rpe: 7 }] }),
    execution({ date: "2026-07-28", sets: [{ load: 135, reps: 5, rpe: 7 }, { load: 135, reps: 5, rpe: 7 }] })
  ];
  const patterns = intelligence.recentPatternBalance(history, "2026-07-30");
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].code, "SQUAT");
  assert.equal(patterns[0].workSets, 2);
});

test("017F integration loads the engine and exposes strength intelligence in the product", () => {
  const root = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(html, /strength-intelligence\.js/);
  assert.match(html, /BUILD 017F/);
  assert.match(app, /DominionStrengthIntelligence/);
  assert.match(app, /renderStrengthIntelligence/);
  assert.match(css, /Build 017F/);
  assert.match(pkg.scripts.test, /strength-intelligence\.test\.js/);
});

console.log("All Build 017F strength intelligence tests passed.");
