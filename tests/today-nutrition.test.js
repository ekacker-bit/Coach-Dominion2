const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  buildExecutionMetric,
  buildFreshness,
  buildTodayNutritionExecution
} = require("../assets/js/today-nutrition.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

test("016B remaining amount is deterministic", () => {
  const metric = buildExecutionMetric("protein", 92, 150);
  assert.equal(metric.remaining, 58);
  assert.equal(metric.percent, 61);
  assert.equal(metric.status, "REMAINING");
});

test("016B missing targets requires deliberate setup", () => {
  const result = buildTodayNutritionExecution({ date: "2026-07-30", actual: { calories: 1400 }, actualDate: "2026-07-30" });
  assert.equal(result.status, "SETUP REQUIRED");
  assert.equal(result.actions[0].id, "set-baseline");
  assert.match(result.instruction, /Approve a fueling baseline/);
});

test("016B targets without current intake await evidence without declaring failure", () => {
  const result = buildTodayNutritionExecution({
    date: "2026-07-30",
    targets: { calories: 2200, protein: 160, carbs: 240, fat: 70 },
    latestEvidenceDate: "2026-07-29",
    source: "MYFITNESSPAL"
  });
  assert.equal(result.status, "AWAITING INTAKE");
  assert.match(result.instruction, /Missing evidence is not a missed standard/);
  assert.ok(result.warnings.some((item) => item.includes("2026-07-29")));
});

test("016B current intake becomes an executable remaining order", () => {
  const result = buildTodayNutritionExecution({
    date: "2026-07-30",
    actualDate: "2026-07-30",
    actual: { calories: 1300, protein: 90, carbs: 120, fat: 45 },
    targets: { calories: 2200, protein: 160, carbs: 240, fat: 70 },
    source: "MYFITNESSPAL",
    trainingDay: false
  });
  assert.equal(result.status, "EXECUTE");
  assert.equal(result.metrics.calories.remaining, 900);
  assert.equal(result.metrics.protein.remaining, 70);
  assert.match(result.instruction, /70 g protein/);
});

test("016B uses approved training context and timing", () => {
  const result = buildTodayNutritionExecution({
    date: "2026-07-30",
    actualDate: "2026-07-30",
    actual: { calories: 1400, protein: 100, carbs: 130, fat: 40 },
    targets: { calories: 2500, protein: 170, carbs: 300, fat: 75 },
    source: "MANUAL",
    trainingDay: true,
    trainingWindow: "EVENING"
  });
  assert.equal(result.trainingWindowLabel, "Evening session");
  assert.match(result.instruction, /evening session/);
  assert.match(result.instruction, /carbohydrate/);
});

test("016B on-plan evidence maintains the approved plan", () => {
  const result = buildTodayNutritionExecution({
    date: "2026-07-30",
    actualDate: "2026-07-30",
    actual: { calories: 2100, protein: 155, carbs: 220, fat: 68 },
    targets: { calories: 2200, protein: 160, carbs: 240, fat: 70 },
    source: "MYFITNESSPAL"
  });
  assert.equal(result.status, "ON PLAN");
  assert.equal(result.warnings.length, 0);
});

test("016B above-range evidence never recommends compensation", () => {
  const result = buildTodayNutritionExecution({
    date: "2026-07-30",
    actualDate: "2026-07-30",
    actual: { calories: 2800, protein: 175, carbs: 300, fat: 90 },
    targets: { calories: 2200, protein: 160, carbs: 240, fat: 70 },
    source: "MYFITNESSPAL"
  });
  assert.equal(result.status, "REVIEW EVIDENCE");
  assert.match(result.instruction, /do not compensate with restriction/);
  assert.ok(result.safeguards.some((item) => item.includes("No compensatory restriction")));
});

test("016B reduced readiness cannot authorize restrictive eating", () => {
  const result = buildTodayNutritionExecution({
    date: "2026-07-30",
    actualDate: "2026-07-30",
    actual: { calories: 1300, protein: 100, carbs: 150, fat: 40 },
    targets: { calories: 2200, protein: 160, carbs: 240, fat: 70 },
    readiness: "RED"
  });
  assert.match(result.instruction, /do not restrict intake/);
});

test("016B freshness distinguishes current, historical, and missing evidence", () => {
  assert.equal(buildFreshness("2026-07-30", "2026-07-30").state, "CURRENT");
  assert.equal(buildFreshness("2026-07-30", null, "2026-07-29").state, "HISTORICAL");
  assert.equal(buildFreshness("2026-07-30").state, "MISSING");
});

test("016B replaces the Today placeholder and wires the live surface", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
  assert.ok(html.includes('id="today-nutrition-card"'));
  assert.ok(html.includes('/assets/js/today-nutrition.js'));
  assert.ok(!html.includes("<h2>Fuel module</h2><p class=\"muted\">Placeholder for nutrition guidance.</p>"));
  assert.ok(app.includes("function renderTodayNutritionExecution()"));
  assert.ok(app.includes('data-today-nutrition-action'));
  assert.ok(app.includes('setConnectedActiveView("nutrition")'));
});

console.log(`Build 016B Today nutrition: ${passed} assertions passed.`);
