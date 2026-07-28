const assert = require("node:assert/strict");
const recovery = require("../assets/js/recovery.js");

function recommendation(overrides = {}) {
  return recovery.buildRecoveryRecommendation({
    readiness: { state: "GREEN", energy: 8, soreness: 2, pain: false },
    nutrition: { calories: 2000, protein: 170 },
    targets: { calories: 2000, protein: 170 },
    training: { volume: 2400, sets: 3 },
    generatedAt: "2026-07-27T12:00:00.000Z",
    ...overrides
  });
}

{
  const result = recommendation({ readiness: { state: "RED", energy: 6, soreness: 4, pain: true } });
  assert.equal(result.status, "PROTECT / RECOVER");
  assert.equal(result.priority, "CRITICAL");
  assert.equal(result.holdProgression, true);
}

{
  const result = recommendation({ nutrition: { calories: 1400, protein: 170 } });
  assert.equal(result.status, "REFUEL REQUIRED");
  assert.equal(result.calorieCoverage, 70);
  assert.equal(result.calorieGap, 600);
  assert.equal(result.holdProgression, true);
}

{
  const result = recommendation({ readiness: { state: "YELLOW", energy: 4, soreness: 8, pain: false } });
  assert.equal(result.status, "RECOVERY PRIORITY");
  assert.equal(result.holdProgression, true);
}

{
  const result = recommendation({ nutrition: { calories: 2000, protein: 120 } });
  assert.equal(result.status, "PROTEIN GAP");
  assert.equal(result.proteinCoverage, 71);
  assert.equal(result.proteinGap, 50);
  assert.equal(result.holdProgression, false);
}

{
  const result = recommendation();
  assert.equal(result.status, "ON PLAN");
  assert.equal(result.priority, "NORMAL");
  assert.equal(result.holdProgression, false);
  assert.equal(result.confidence, "HIGH");
}

{
  const stable = recovery.weightTrend([
    { domain: "body_metrics", performanceDate: "2026-07-20", metrics: { measurement_value: 185 } },
    { domain: "body_metrics", performanceDate: "2026-07-27", metrics: { measurement_value: 184.7 } }
  ]);
  const decreasing = recovery.weightTrend([
    { domain: "body_metrics", performanceDate: "2026-07-20", metrics: { measurement_value: 185 } },
    { domain: "body_metrics", performanceDate: "2026-07-27", metrics: { measurement_value: 183.5 } }
  ]);
  assert.equal(stable.state, "STABLE");
  assert.equal(decreasing.state, "DECREASING");
  assert.equal(decreasing.change, -1.5);
}

console.log("Recovery and fueling tests passed.");
