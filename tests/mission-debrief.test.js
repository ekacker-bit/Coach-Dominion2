const assert = require("node:assert/strict");
const debrief = require("../assets/js/mission-debrief.js");

const date = "2026-08-09";
const strengthReceipt = { id: "strength-1", date, module: "STRENGTH", windowId: "am", windowLabel: "AM", state: "COMPLETE", painReported: false };
const coreReceipt = { id: "core-1", date, module: "CORE", windowId: "am", windowLabel: "AM", state: "COMPLETE", painReported: false };
const pairedCockpit = {
  date,
  twoADay: true,
  windows: [{ id: "am", label: "AM", complete: false, sessions: [
    { module: "STRENGTH", state: "COMPLETE", terminal: true },
    { module: "CORE", state: "READY", terminal: false, tertiary: true }
  ] }],
  current: { module: "CORE" },
  complete: false,
  splitGate: { status: "AWAITING_SESSION_1", allowed: false, blockers: ["Finish the AM window"] }
};

assert.equal(debrief.VERSION, "025C.1");
assert.equal(debrief.pendingDebrief({ cockpit: pairedCockpit, receipts: [strengthReceipt], debriefs: [] }), null, "paired Core work must finish before a normal debrief");

const completedCockpit = JSON.parse(JSON.stringify(pairedCockpit));
completedCockpit.windows[0].complete = true;
completedCockpit.windows[0].sessions[1].state = "COMPLETE";
completedCockpit.windows[0].sessions[1].terminal = true;
const pending = debrief.pendingDebrief({ cockpit: completedCockpit, receipts: [strengthReceipt, coreReceipt], debriefs: [] });
assert.equal(pending.id, `mission-debrief:${date}:am`);
assert.equal(pending.coverage.secured, 2);

const painReceipt = { ...strengthReceipt, id: "strength-pain", state: "PAIN_HOLD", painReported: true };
const painPending = debrief.pendingDebrief({ cockpit: pairedCockpit, receipts: [painReceipt], debriefs: [] });
assert.ok(painPending, "pain must open the debrief without waiting for paired work");
assert.equal(painPending.interrupted, true);

const secondStrengthWindow = { ...pairedCockpit, windows: [{ id: "pm", label: "PM", sessions: [{ module: "STRENGTH", state: "COMPLETE", terminal: true }] }] };
assert.equal(debrief.pendingDebrief({ cockpit: secondStrengthWindow, receipts: [strengthReceipt], debriefs: [] }), null, "an AM receipt must never satisfy a same-module PM window");

assert.throws(() => debrief.buildDebrief({ effort: 0, pain: "NO", executionQuality: "CONTROLLED", recoveryConfidence: 7 }, pending), /effort/i);
assert.throws(() => debrief.buildDebrief({ effort: 7, pain: "", executionQuality: "CONTROLLED", recoveryConfidence: 7 }, pending), /pain/i);

const record = debrief.buildDebrief({ effort: 7, pain: "NO", executionQuality: "CONTROLLED", recoveryConfidence: 8, notes: "  Felt solid.  " }, {
  date,
  window: pending.window,
  receipts: pending.receipts,
  submittedAt: "2026-08-09T14:00:00.000Z"
});
assert.equal(record.revision, 1);
assert.equal(record.notes, "Felt solid.");
assert.deepEqual(record.modules.sort(), ["CORE", "STRENGTH"]);

const idempotent = debrief.buildDebrief({ effort: 7, pain: "NO", executionQuality: "CONTROLLED", recoveryConfidence: 8, notes: "Felt solid." }, {
  date,
  window: pending.window,
  receipts: pending.receipts,
  previous: record,
  submittedAt: "2026-08-09T14:02:00.000Z"
});
assert.deepEqual(idempotent, record, "identical resubmission must not create a new revision");

const revised = debrief.buildDebrief({ effort: 8, pain: "NO", executionQuality: "CONTROLLED", recoveryConfidence: 8, notes: "Felt solid." }, {
  date,
  window: pending.window,
  receipts: pending.receipts,
  previous: record,
  submittedAt: "2026-08-09T14:03:00.000Z"
});
assert.equal(revised.revision, 2);
assert.notEqual(revised.fingerprint, record.fingerprint);

const safetyRecord = debrief.buildDebrief({ effort: 6, pain: "YES", executionQuality: "CONTROLLED", recoveryConfidence: 5 }, {
  date,
  window: painPending.window,
  receipts: painPending.receipts,
  submittedAt: "2026-08-09T14:00:00.000Z"
});
const safety = debrief.coachingDecision(safetyRecord, { cockpit: pairedCockpit, splitGate: pairedCockpit.splitGate });
assert.equal(safety.code, "SAFETY_HOLD");
assert.equal(safety.action, "ROLL_CALL");
assert.equal(safety.planMutationAllowed, false);
assert.equal(safety.atlasReviewRequired, true);

const technique = debrief.coachingDecision({ ...record, techniqueLimited: true }, { cockpit: completedCockpit });
assert.equal(technique.code, "RECOVER_AND_REVIEW");
assert.equal(technique.planMutationAllowed, false);

const splitRecovery = debrief.coachingDecision(record, {
  cockpit: { ...completedCockpit, current: { module: "RUNNING", locked: true }, complete: false },
  splitGate: { status: "RECOVERING", allowed: false, blockers: ["Refuel", "Wait 120 min"] }
});
assert.equal(splitRecovery.code, "RECOVER_BETWEEN_SESSIONS");
assert.equal(splitRecovery.action, "FUEL");
assert.deepEqual(splitRecovery.requirements, ["Refuel", "Wait 120 min"]);

const missionComplete = debrief.coachingDecision(record, { cockpit: { ...completedCockpit, current: null, complete: true, twoADay: false } });
assert.equal(missionComplete.code, "RECOVER_COMPLETE");
assert.equal(missionComplete.action, "CLOSEOUT");

const linked = debrief.attachDebrief([strengthReceipt, coreReceipt], record, missionComplete);
assert.ok(linked.every((receipt) => receipt.debriefId === record.id));
assert.deepEqual(debrief.attachDebrief(linked, record, missionComplete), linked, "receipt linkage must remain idempotent");

const summary = debrief.summarizeForAtlas([
  { ...record, id: "later", modules: ["STRENGTH"], techniqueLimited: true, outcomeState: "STOPPED", updatedAt: "2026-08-09T15:00:00.000Z" },
  record,
  { ...record, id: "outside", date: "2026-07-01", modules: ["CORE"] }
], "2026-08-04", "2026-08-10");
assert.equal(summary.events, 2, "Atlas summary must be unique by module and date");
assert.equal(summary.techniqueFlags, 1);
assert.equal(summary.stoppedSessions, 1);

console.log("Mission debrief tests passed.");
