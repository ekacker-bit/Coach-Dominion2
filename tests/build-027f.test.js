const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("027F installs one canonical decision after the compatibility engine", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/daily-decision-integrity.js");
  const worker = read("sw.js");

  assert.match(engine, /const VERSION = "027F\.1"/);
  assert.match(engine, /function authorizationModel/);
  assert.match(engine, /function reviewSummary/);
  assert.match(engine, /function connectionState/);
  assert.match(engine, /function consistencyReport/);
  assert.match(html, /daily-decision-integrity\.js\?v=027f/);
  assert.ok(html.indexOf("daily-decision.js?v=026e") < html.indexOf("daily-decision-integrity.js?v=027f"));
  assert.ok(html.indexOf("daily-decision-integrity.js?v=027f") < html.indexOf("app.js?v="));
  assert.match(app, /DominionDailyDecisionIntegrity\.buildDailyDecision/);
  assert.match(app, /nutritionEvidence:/);
  assert.match(app, /executions: \{/);
  assert.match(app, /sw\.js\?v=027f/);
  assert.match(worker, /daily-decision-integrity\.js\?v=027f/);
  assert.match(worker, /027e-027f/);
});

test("027F keeps the first viewport and five mobile destinations authoritative", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const styles = read("assets/styles.css");

  for (const destination of ["today", "train", "fuel", "review", "more"]) {
    assert.match(html, new RegExp(`data-mobile-nav="${destination}"`));
  }
  assert.match(app, /DominionDailyDecisionIntegrity\.resolveMobileDestination/);
  assert.match(app, /DominionDailyDecisionIntegrity\.mobileNavForSection/);
  assert.match(styles, /Build 027F: Daily Decision integrity and mobile UX repair/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /scroll-margin-top: 106px/);
  assert.match(styles, /\.status-bar > div:nth-child\(n \+ 4\)/);
  assert.match(styles, /padding-bottom: calc\(110px \+ env\(safe-area-inset-bottom\)\)/);
});

test("027F presents thin Weekly Review evidence and finalized Contract state honestly", () => {
  const app = read("assets/js/app.js");
  const styles = read("assets/styles.css");

  assert.match(app, /DominionDailyDecisionIntegrity\.reviewSummary\(aggregate\)/);
  assert.match(app, /Scores describe assessed observations only/);
  assert.match(app, /Hidden until evidence is sufficient/);
  assert.match(app, /finalizeButton\.classList\.toggle\("is-unavailable"/);
  assert.match(app, /DominionDailyDecisionIntegrity\.contractMode/);
  assert.match(app, /editor\.toggleAttribute\("inert", finalizedReadOnly\)/);
  assert.match(styles, /#contract\[data-contract-mode="FINALIZED"\]/);
  assert.match(styles, /weekly-domain-scores \[data-evidence-state="UNSCORED"\]/);
});

test("027F Connections expose repairable user states and hide audit detail", () => {
  const app = read("assets/js/app.js");
  const styles = read("assets/styles.css");

  assert.match(app, /DominionReleaseStabilization\.connectionState/);
  assert.match(app, /data-connection-state/);
  assert.match(app, /Advanced evidence audit/);
  assert.match(styles, /data-connection-state="STALE"/);
  assert.match(styles, /data-connection-state="IMPORT_FAILED"/);
});

test("027F keeps release numbers and repetitive brand prefixes out of the product copy", () => {
  const html = read("app.html");
  const entry = read("index.html");
  const app = read("assets/js/app.js");
  const shell = require("../assets/js/experience-shell.js");
  const visibleHtml = `${html}\n${entry}`.replace(/<!--[\s\S]*?-->/g, "");

  assert.doesNotMatch(visibleHtml, />\s*(?:BUILD|RELEASE)\s+0?\d{2,3}[A-Z]?/i);
  assert.doesNotMatch(app, /<(?:span|div)[^>]*>\s*(?:BUILD|RELEASE)\s+0?\d{2,3}[A-Z]?/i);
  assert.equal(shell.cleanBuildKicker("BUILD 027F // TODAY'S ORDER"), "TODAY'S ORDER");
  assert.equal(shell.cleanBuildKicker("DOMINION // PROGRAM STATUS"), "PROGRAM STATUS");
  assert.match(html, />Coach Dominion<\/strong>/);
  assert.match(html, /The Dominion Contract/);
  assert.match(html, /Daily Record/);
});
