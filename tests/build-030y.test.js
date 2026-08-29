"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030Y is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030Y\.1"/);
  assert.match(html, /recruit-first-command-center\.js\?v=030y/);
  assert.ok(html.indexOf("recruit-first-command-center.js?v=030y") < html.indexOf("app.js?v="));
  assert.match(html, /styles\.css\?v=[^"]*-030y/);
  assert.match(html, /app\.js\?v=[^"]*-030y/);
  assert.match(worker, /030y-recruit-first-command-center/);
  assert.match(worker, /recruit-first-command-center\.js\?v=030y/);
  assert.match(app, /register\("\/sw\.js\?v=030y"/);
  assert.match(health, /release: "030Y\.1"/);
  assert.match(health, /recruitFirstCommand: "one-visible-action"/);
  assert.match(workflow, /npm run test:030y/);
  assert.match(workflow, /--expected-release 030Y\.1/);
});

test("030Y uses the canonical model and preserves 030X recovery authority", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /model = applyRecruitContinuityRecoveryToModel\(model\)/);
  assert.ok(app.indexOf("applyRecruitContinuityRecoveryToModel(model)") < app.indexOf("DominionRecruitFirstCommandCenter.build"));
  assert.match(app, /recovery: currentRecruitContinuityRecovery/);
  assert.match(app, /model = recruitFirstView\.model/);
  assert.match(app, /DominionRecruitFirstCommandCenter\.present\(document/);
  assert.match(app, /window\.DominionRecruitFirstCommandCenter\?\.apply/);
});

test("030Y hides duplicate machinery and keeps Closeout stage-driven", () => {
  const css = read("assets/styles.css");
  const engine = read("assets/js/recruit-first-command-center.js");
  assert.match(css, /data-recruit-first-command="030Y\.1"/);
  assert.match(css, /data-recruit-detail="technical"/);
  assert.match(css, /#today-more-context-stack > #mobile-command/);
  assert.match(css, /data-recruit-first-stage="close"/);
  assert.match(css, /#daily-ritual-action/);
  assert.match(engine, /onePrimaryAction: true/);
  assert.match(engine, /showCloseout: stage === STAGES\.CLOSE/);
  assert.match(engine, /"#frictionless-execution"/);
  assert.match(engine, /"#mission-execution"/);
  assert.match(engine, /"#morning-command-activation"/);
});

test("030Y makes the mobile command compact and word-light", () => {
  const css = read("assets/styles.css");
  const engine = read("assets/js/recruit-first-command-center.js");
  assert.match(css, /min-height: 0 !important/);
  assert.match(css, /#one-command-primary[\s\S]*width: 100%/);
  assert.match(engine, /title: concise\([^,]+, 78\)/);
  assert.match(engine, /detail: concise\([^,]+, 118\)/);
  assert.match(engine, /stateLabel: "ACTION NEEDED"/);
  assert.match(engine, /detailLabel: "Details & history"/);
});

test("030Y remains invisible as release language to recruits", () => {
  const html = read("app.html").replace(/<!--[^]*?-->/g, "");
  const body = html.slice(html.indexOf("<body"), html.indexOf("<script src="));
  assert.doesNotMatch(body, /(?:BUILD|RELEASE)\s+030Y/i);
  assert.doesNotMatch(body, /Recruit-First Command Center/i);
});

test("030Y ships a rendered-state fixture for desktop and phone verification", () => {
  const fixture = read("tests/fixtures/recruit-first-command-center.html");
  assert.match(fixture, /id="one-command"/);
  assert.match(fixture, /DominionRecruitFirstCommandCenter\.apply\(document\)/);
  assert.match(fixture, /DominionRecruitFirstCommandCenter\.present\(document, commandView\)/);
});
