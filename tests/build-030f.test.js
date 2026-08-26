const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("030F routes the exact active Calendar strength order into the logger", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function currentStrengthCalendarAssignment/);
  assert.match(app, /function strengthExecutionMatchesPrescription/);
  assert.match(app, /data-calendar-assignment-id=/);
  assert.match(app, /data-today-assignment-id=/);
  assert.match(app, /launchMobileModule\("strength", \{\s*assignmentId:/);
  assert.match(app, /That Calendar order is no longer active/);
});

test("030F preserves assignment identity through schedule, execution, sets, and evidence", () => {
  const weekly = read("assets/js/weekly-orchestrator.js");
  const canonical = read("assets/js/canonical-daily-command.js");
  const strength = read("assets/js/strength-training.js");
  const mission = read("assets/js/mission-execution.js");
  assert.match(weekly, /assignmentId: item\.assignmentId \|\| item\.id/);
  assert.match(canonical, /item\.assignmentId \|\| item\.id \|\| item\.activityId/);
  assert.match(strength, /assignmentId: prescription\.assignmentId \|\| prescription\.calendarAssignmentId/);
  assert.match(strength, /assignmentId: execution\.assignmentId \|\| null/);
  assert.match(mission, /assignmentId: execution\.assignmentId \|\| input\.assignmentId \|\| null/);
});

test("030F is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030[FGHIJKLMNOPQ]\.1/);
  assert.match(worker, /030f-strength-calendar-execution/);
  assert.match(app, /register\("\/sw\.js\?v=030[fghijklmnopq]"/);
  assert.match(health, /release: "030[FGHIJKLMNOPQ]\.1"/);
  assert.match(health, /strengthAssignment: "calendar-linked"/);
  assert.match(workflow, /npm run test:030[fghijklmnopq]/);
  assert.match(workflow, /--expected-release 030[FGHIJKLMNOPQ]\.1/);
});
