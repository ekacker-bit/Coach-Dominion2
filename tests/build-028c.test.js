const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("one This doesn't fit coach replaces scattered recruit feedback", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  assert.match(html, /id="atlas-command-adjustment-reasons"/);
  assert.match(html, /id="atlas-command-adjustment-proposal"/);
  assert.match(html, /What changed\?/);
  assert.match(app, /function selectAtlasCoachReason/);
  assert.match(app, /openAtlasDailyCommandAdjustment\(\{ reasonId: proposal\?\.safetyOverride \? "PAIN" : "FATIGUE", source: "LIVE_ADAPTATION" \}\)/);
  assert.doesNotMatch(html, /id="atlas-live-adaptation-feedback"/);
});

test("the coach explains the proposed change and tradeoff before approval", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const styles = read("assets/styles.css");
  assert.match(html, />WHAT CHANGES</);
  assert.match(html, />TRADEOFF</);
  assert.match(html, />Apply for today</);
  assert.match(html, />Keep original</);
  assert.match(app, /DominionAtlasCoach\.buildProposal/);
  assert.match(app, /DominionAtlasCoach\.responseContext/);
  assert.match(styles, /\.atlas-command-adjustment-reasons/);
  assert.match(styles, /\.atlas-command-adjustment-proposal/);
});

test("approved changes use the dated account decision and remain reversible", () => {
  const app = read("assets/js/app.js");
  const command = read("assets/js/atlas-daily-command.js");
  assert.match(app, /persistClosedLoopState\("DECISION", atlasDailyCommandStateKey\(response\.date\), response\)/);
  assert.match(app, /clearAtlasDailyCommandResponse/);
  assert.match(command, /coach: context\.coachProposal/);
  assert.match(command, /futureWeekChanged: false/);
  assert.match(command, /proposalId: context\.proposalId/);
});

test("028C is loaded before the app and cached for offline use", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  assert.match(html, /atlas-coach\.js\?v=028c/);
  assert.ok(html.indexOf("atlas-coach.js?v=028c") < html.indexOf("app.js?v="));
  assert.match(worker, /atlas-coach\.js\?v=028c/);
  assert.match(worker, /028a-028b-028c/);
  assert.match(app, /register\("\/sw\.js\?v=028c"/);
});

test("the recruit-facing coach contains no release language", () => {
  const html = read("app.html").replace(/<!--[^]*?-->/g, "");
  const dialog = html.match(/<dialog id="atlas-command-adjustment-dialog"[^]*?<\/dialog>/)?.[0] || "";
  assert.ok(dialog);
  assert.doesNotMatch(dialog, /028C|BUILD|RELEASE/i);
});
