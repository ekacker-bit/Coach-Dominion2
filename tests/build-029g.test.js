const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const adaptation = read("assets/js/atlas-live-adaptation.js");

assert.ok(html.includes('/assets/js/final-beta-stabilization.js?v=029g'), "029G state authority is not loaded");
assert.ok(html.indexOf('final-beta-stabilization.js?v=029g') < html.indexOf('app.js?v='), "029G authority must load before the app");
assert.ok(adaptation.includes('ADAPTATION_PROPOSED') && adaptation.includes('ADAPTATION_ACCEPTED') && adaptation.includes('ADAPTATION_DECLINED'), "adaptation state machine is incomplete");
assert.ok(adaptation.includes('Atlas proposes recovery before the next exposure'), "required recovery proposal language is missing");
assert.ok(adaptation.includes('assignmentOutcome: recovery ? "ADAPTED_NOT_REQUIRED"'), "accepted recovery lacks adapted-not-required semantics");
assert.ok(app.includes('canonicalPendingWriteState().count'), "surfaces do not share one pending count");
assert.ok(app.includes('pendingState.count ? pendingState.label'), "header does not expose Sync count");
assert.ok(app.includes('data-weekly-orchestrator-action="view-active"') && app.includes('data-weekly-orchestrator-action="view-staged"'), "active and staged Calendar views are not explicit");
assert.ok(app.includes('document.body.dataset.calendarWeekView = "STAGED"'), "next-week creation does not enter the staged view");
assert.ok(app.includes('metrics.assessedExecutionScore === null ? "UNSCORED"'), "unassessed execution is still presented as a score");
assert.ok(!/function renderProgramCommand[\s\S]*?scheduleDominionCampaignReconciliation\(\);[\s\S]*?function renderProgramChangeImpact/.test(app), "Program rendering still schedules persistence");
assert.ok(css.includes('Build 029G: final beta stabilization') && css.includes('#today-body-capture > form { display: none !important; }'), "mobile density repair is missing");
assert.ok(worker.includes('coach-dominion-029g-final-beta-stabilization') && worker.includes('/assets/js/final-beta-stabilization.js?v=029g'), "029G offline shell is stale");

console.log("Build 029G final beta stabilization checks passed.");
