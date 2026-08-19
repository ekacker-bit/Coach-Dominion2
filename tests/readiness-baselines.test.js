const assert = require("assert");
const {
  median,
  buildReadinessBaselineProfile,
  evaluatePersonalizedReadiness
} = require("../assets/js/readiness-baselines.js");

function dateOffset(date, offset) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function history(currentDate, count, overrides = {}) {
  return Array.from({ length: count }, (_, index) => ({
    date: dateOffset(currentDate, -(index + 1)),
    sleep: 8,
    resting_heart_rate: 50,
    heart_rate_variability: 50,
    steps: 9000,
    weight: 180,
    ...overrides
  }));
}

const green = {
  state: "GREEN",
  headline: "Recovery capacity acceptable.",
  rationale: ["No pain reported."],
  restrictions: ["No unplanned extra volume"],
  instruction: "Execute the prescribed mission exactly."
};

assert.strictEqual(median([3, 1, 2]), 2);
assert.strictEqual(median([4, 2, 1, 3]), 2.5);

{
  const current = { date: "2026-07-27", sleep: 4, resting_heart_rate: 70 };
  const profile = buildReadinessBaselineProfile(history(current.date, 6), current);
  assert.strictEqual(profile.state, "LEARNING");
  assert.strictEqual(evaluatePersonalizedReadiness(green, profile).state, "GREEN");
}

{
  const current = { date: "2026-07-27", sleep: 8, resting_heart_rate: 50 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  assert.strictEqual(profile.state, "ACTIVE");
  assert.strictEqual(evaluatePersonalizedReadiness(green, profile).state, "GREEN");
}

{
  const current = { date: "2026-07-27", sleep: 6, resting_heart_rate: 56 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  const result = evaluatePersonalizedReadiness(green, profile);
  assert.strictEqual(result.state, "YELLOW");
  assert.strictEqual(result.baselineAdjustment, "GREEN_TO_YELLOW");
}

{
  const current = { date: "2026-07-27", sleep: 7.5, resting_heart_rate: 56 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  assert.strictEqual(evaluatePersonalizedReadiness(green, profile).state, "GREEN");
}

{
  const current = { date: "2026-07-27", sleep: 5, resting_heart_rate: 50 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  assert.strictEqual(evaluatePersonalizedReadiness(green, profile).state, "YELLOW");
}

{
  const yellow = { ...green, state: "YELLOW" };
  const current = { date: "2026-07-27", sleep: 8, resting_heart_rate: 50 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  assert.strictEqual(evaluatePersonalizedReadiness(yellow, profile).state, "YELLOW");
}

{
  const red = { ...green, state: "RED" };
  const current = { date: "2026-07-27", sleep: 8, resting_heart_rate: 50 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  assert.strictEqual(evaluatePersonalizedReadiness(red, profile).state, "RED");
}

{
  const current = { date: "2026-07-27", sleep: 1, resting_heart_rate: 100 };
  const rows = [...history(current.date, 9), current];
  const profile = buildReadinessBaselineProfile(rows, current);
  assert.strictEqual(profile.metrics.sleep.baseline28.count, 9);
  assert.strictEqual(profile.state, "LEARNING");
}

{
  const current = { date: "2026-07-27", sleep: null, resting_heart_rate: null };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  assert.strictEqual(evaluatePersonalizedReadiness(green, profile).state, "GREEN");
}

{
  const current = { date: "2026-07-27", sleep: 8, resting_heart_rate: 50, heart_rate_variability: 30 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  assert.strictEqual(profile.metrics.heart_rate_variability.signal.status, "SEVERE");
  const hrvOnly = evaluatePersonalizedReadiness(green, profile);
  assert.strictEqual(hrvOnly.state, "GREEN", "HRV alone is not used as a punitive readiness trigger");
  assert.match(hrvOnly.rationale.join(" "), /do not corroborate a recovery adjustment/i, "green HRV concern explains why the other signals did not change training");
}

{
  const current = { date: "2026-07-27", sleep: 6.5, resting_heart_rate: 50, heart_rate_variability: 40 };
  const profile = buildReadinessBaselineProfile(history(current.date, 14), current);
  const result = evaluatePersonalizedReadiness(green, profile);
  assert.strictEqual(result.state, "YELLOW");
  assert.match(result.rationale.join(" "), /HRV/);
}

console.log("readiness baseline tests passed");
