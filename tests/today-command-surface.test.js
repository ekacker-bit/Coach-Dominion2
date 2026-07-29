const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const app = require("../assets/js/app.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");

assert.equal(app.normalizeSectionKey("nutrition"), "nutrition", "nutrition is a first-class workspace");
assert.equal(app.normalizeSectionKey("fuel"), "nutrition", "fuel deep links resolve to nutrition");
assert.equal(app.normalizeSectionKey("train"), "performance", "train deep links resolve to performance");
assert.equal(app.normalizeSectionKey("review"), "inspection", "review deep links resolve to inspection");
assert.equal(app.normalizeSectionKey("settings"), "connected", "settings deep links resolve to connected");
assert.match(html, /TODAY’S PLAN/);
assert.match(html, /class="mobile-command-bar"/);
assert.match(html, /id="today-sequence-training"/);
assert.match(html, /id="today-sequence-fueling"/);
assert.match(html, /id="today-sequence-recovery"/);
assert.match(html, /id="today-sequence-evidence"/);
assert.match(html, /NEEDS ATTENTION/);
assert.match(html, /id="today-standards-panel"/);
assert.match(html, /id="today-command-state"/);
assert.match(html, /id="today-setup-attention"/);
assert.match(html, /id="data-truth-grid"/);
assert.match(html, /id="data-truth-state"/);
assert.match(html, /id="activation-guide"/);
assert.match(html, /id="activation-guide-list"/);
assert.match(html, /id="review-hub-state"/);
assert.match(html, /id="review-journey"/);
assert.match(html, /BUILD 012E \/\/ UNIFIED WEEKLY REVIEW/);
assert.match(html, /class="today-supporting-detail today-workout-detail"/);
assert.match(html, /class="today-supporting-detail today-intelligence-detail"/);
assert.match(html, />Do this next</);
assert.match(html, />Train · Fuel · Recover · Record</);
assert.match(js, /function renderTodayStandardsDuty/);
assert.match(js, /Training evidence is not current/);
assert.match(js, /function buildDataTruthModel/);
assert.match(js, /function buildActivationGuide/);
assert.match(js, /function buildReviewJourney/);
assert.match(js, /function detectStandardsPatterns/);
assert.match(js, /function organizeWorkspaceSections/);
assert.match(js, /element\.hidden = !isMatch/);
assert.match(css, /\.mobile-command-bar\{display:none\}/);
assert.match(css, /position:fixed;display:grid/);
assert.match(css, /Build 012A/);
assert.match(css, /#today>\.daily-coaching-loop\{order:1\}/);
assert.match(css, /\.data-truth-grid/);

const truth = app.buildDataTruthModel({
  date: "2026-07-29",
  dailyState: { date: "2026-07-29" },
  fitbodSessions: [{ date: "2026-07-27" }],
  nutritionDays: [{ date: "2026-07-29" }],
  appleHealthDays: [],
  compliance: { compliance_date: "2026-07-29" },
  storageMode: "SUPABASE"
});
assert.equal(truth.state, "MIXED DATES");
assert.equal(truth.counts.CURRENT, 3);
assert.equal(truth.counts.HISTORICAL, 1);
assert.equal(truth.counts.MISSING, 1);
assert.equal(truth.sources.find((item) => item.label === "Training").status, "HISTORICAL");

const missingRequired = app.buildDataTruthModel({ date: "2026-07-29" });
assert.equal(missingRequired.state, "ACTION NEEDED");
assert.deepEqual(missingRequired.requiredMissing, ["Readiness", "Dominion Record"]);

const activation = app.buildActivationGuide({
  date: "2026-07-29",
  dailyState: { date: "2026-07-29" },
  hasFuelingBaseline: true,
  importedRecords: [{ isDemo: false, importStatus: "IMPORTED" }],
  compliance: { compliance_date: "2026-07-29" },
  inspections: []
});
assert.equal(activation.completed, 4);
assert.equal(activation.complete, false);
assert.equal(activation.steps.find((step) => step.id === "inspection").complete, false);

const operational = app.buildActivationGuide({
  date: "2026-07-29",
  dailyState: { date: "2026-07-29" },
  hasFuelingBaseline: true,
  importedRecords: [{ isDemo: false, importStatus: "IMPORTED" }],
  compliance: { compliance_date: "2026-07-29" },
  inspections: [{ finalizedAt: "2026-07-29T12:00:00Z" }]
});
assert.equal(operational.complete, true);

const reviewReady = app.buildReviewJourney({
  inspection: { canFinalize: true },
  standardsItems: [],
  finalizedInspections: []
});
assert.equal(reviewReady.state, "READY TO FINALIZE");
assert.equal(reviewReady.next.section, "inspection");

const reviewBlocked = app.buildReviewJourney({
  inspection: { finalizedAt: "2026-07-29T12:00:00Z" },
  standardsItems: [{ status: "CONFIRMED" }],
  finalizedInspections: [{ finalizedAt: "2026-07-29T12:00:00Z" }]
});
assert.equal(reviewBlocked.state, "ACTION NEEDED");
assert.equal(reviewBlocked.next.section, "standards");

const reviewComplete = app.buildReviewJourney({
  inspection: { finalizedAt: "2026-07-29T12:00:00Z" },
  standardsItems: [{ status: "RESOLVED" }],
  finalizedInspections: [{ finalizedAt: "2026-07-22T12:00:00Z" }, { finalizedAt: "2026-07-29T12:00:00Z" }]
});
assert.equal(reviewComplete.state, "REVIEW COMPLETE");
assert.equal(reviewComplete.next.section, "trends");

console.log("today command surface tests passed");
