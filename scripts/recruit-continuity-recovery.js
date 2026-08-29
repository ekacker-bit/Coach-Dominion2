"use strict";

const assert = require("node:assert/strict");
const recovery = require("../assets/js/recruit-continuity-recovery.js");

const date = "2026-08-28";
const authority = { contractRevision: 4, weekId: "week-1", weekRevision: 2, calendarCommitId: "calendar-2" };
const verified = (key) => ({ key, status: "VERIFIED" });
const stages = (key, status) => ["account", "authority", "priorDay", "handoff", "morning", "execution"].map((name) => name === key ? { key: name, status } : verified(name));
const target = { assignmentId: "run:tempo:1", module: "running", title: "Tempo Run", route: { section: "performance", module: "running", anchor: "running-command-panel" } };
const base = (key, status, extra = {}) => ({
  targetDate: date,
  userId: "user-1",
  authority,
  online: true,
  serverConfirmed: true,
  pendingWrites: 0,
  accountReceipts: [],
  loop: { targetDate: date, state: "WAITING", stages: stages(key, status), links: { assignmentId: target.assignmentId, morning: { target } } },
  ...extra
});

const scenarios = [
  ["CERTIFIED_LOOP_IS_CLEAR", { ...base("execution", "VERIFIED"), loop: { ...base("execution", "VERIFIED").loop, state: "CERTIFIED" } }, "CLEAR", null],
  ["ONLINE_SAVE_RETRIES_SILENTLY", base("account", "PROTECTED", { serverConfirmed: false, pendingWrites: 1 }), "AUTO_REPAIR", "RETRY_PROTECTED_SAVE"],
  ["OFFLINE_SAVE_STAYS_PROTECTED", base("account", "PROTECTED", { online: false, serverConfirmed: false, pendingWrites: 1 }), "PROTECTED", "RETRY_PROTECTED_SAVE"],
  ["MISSING_CONTRACT_OPENS_COMMITMENT", base("authority", "BROKEN", { authority: {} }), "ACTION_REQUIRED", "OPEN_CONTRACT"],
  ["MISSING_CALENDAR_REQUIRES_REVIEW", base("authority", "BROKEN", { authority: { ...authority, calendarCommitId: null } }), "DECISION_REQUIRED", "OPEN_CALENDAR"],
  ["CERTIFIED_PRIOR_DAY_REBUILDS_HANDOFF", base("handoff", "WAITING", { canRebuildHandoff: true }), "AUTO_REPAIR", "REBUILD_HANDOFF"],
  ["CERTIFIED_HANDOFF_ACTIVATES_TODAY", base("morning", "WAITING", { canActivateMorning: true }), "AUTO_REPAIR", "ACTIVATE_TODAY"],
  ["EXACT_RUN_RESUMES", base("execution", "WAITING"), "ACTION_REQUIRED", "RESUME_ASSIGNMENT"],
  ["DRIFT_NEVER_INVENTS_COMPLETION", base("execution", "BROKEN"), "DECISION_REQUIRED", "OPEN_CALENDAR"]
];

for (const [id, value, expectedState, expectedAction] of scenarios) {
  const result = recovery.evaluate(value);
  assert.equal(result.state, expectedState, id);
  assert.equal(result.order?.code || null, expectedAction, id);
  if (result.order) {
    assert.equal(result.order.mutatesSignedAuthority, false, id);
    assert.equal(result.order.inventsCompletion, false, id);
  }
  process.stdout.write(`${id}: PASS\n`);
}
