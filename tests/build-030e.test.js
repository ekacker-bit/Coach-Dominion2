"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030E installs a hard protected startup barrier", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  assert.match(html, /data-app-loading="true" data-startup-authority="authenticating"/);
  assert.match(html, /Restoring your protected program/);
  assert.match(app, /function reconcileStartupAccountState/);
  assert.match(app, /content\.hidden = Boolean\(isLoading\)/);
  assert.doesNotMatch(app, /function revealMobileShell\(\)[\s\S]{0,180}setLoading\(false\)/);
  assert.doesNotMatch(app, /syncDominionAccountTruth\(\{ reason: "startup" \}\)/);
  assert.ok(app.indexOf("setStartupAuthority(authoritativeStartup)") < app.indexOf('runStartupTask("scheduled plan command", activateDuePlanCommand'));
  assert.match(app, /permitsAccountWrite\(startupAuthorityState, "state_change"\)[\s\S]{0,180}scheduleOperatingTruthReconciliation/);
});

test("030E binds run evidence to one canonical assignment", () => {
  const app = read("assets/js/app.js");
  const manual = read("assets/js/manual-run.js");
  assert.match(app, /function currentRunningCalendarAssignment/);
  assert.match(app, /function currentRunningAssignmentState/);
  assert.match(app, /UNLINKED_ASSIGNMENT/);
  assert.match(app, /assignmentId: currentRunningCalendarAssignment\(\)\?\.assignmentId/);
  assert.match(manual, /assignment_id: run\.assignmentId/);
});

test("030E makes future week commitment independently provable", () => {
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(app, /function readCalendarCommitReceipts/);
  assert.match(app, /DominionCalendarCommitAuthority\.create/);
  assert.match(app, /contentHash: calendarCommitReceipt\?\.contentHash/);
  assert.match(app, /WEEK COMMIT/);
  assert.match(truth, /calendarCommitReceipts: 120/);
});

test("030E uses plain counters, explicit recovery rationale, and progressive Quick Log disclosure", () => {
  const app = read("assets/js/app.js");
  const weekly = read("assets/js/weekly-advancement.js");
  const recovery = read("assets/js/readiness-baselines.js");
  assert.match(app, /Entries saved: \$\{model\.completed\} of \$\{model\.total\}/);
  assert.match(app, /Assignments verified/);
  assert.match(weekly, /promotionConditions/);
  assert.match(weekly, /conditions met/);
  assert.match(recovery, /recent training load do not corroborate a recovery adjustment/);
  assert.match(app, /fuelFieldset\.hidden = fuelComplete/);
  assert.match(app, /closeFieldset\.hidden = closeoutComplete/);
});
