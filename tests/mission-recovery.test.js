const assert = require("node:assert/strict");
const recovery = require("../assets/js/mission-recovery.js");

const debrief = {
  id: "mission-debrief:2026-08-10:am",
  date: "2026-08-10",
  windowId: "am-window",
  windowLabel: "AM",
  fingerprint: "debrief-1",
  painReported: false
};

const decision = {
  code: "RECOVER_AND_REVIEW",
  headline: "Recovery takes priority",
  detail: "Secure the recovery window.",
  requirements: ["Hydrate", "Refuel", "Protect sleep"],
  action: "CLOSEOUT",
  actionLabel: "Close the day",
  atlasReviewRequired: true
};

let order = recovery.buildOrder({ debrief, decision, now: "2026-08-10T18:00:00.000Z" });
assert.equal(order.version, "025D.1");
assert.equal(order.status, "ACTIVE");
assert.equal(order.tasks.length, 3);
assert.deepEqual(order.tasks.map((task) => task.routeAction), ["NONE", "FUEL", "CLOSEOUT"]);
assert.equal(recovery.progress(order).percent, 0);
assert.equal(recovery.nextTask(order).label, "Hydrate");

assert.throws(
  () => recovery.completeTask(order, order.tasks[1].id, {}, "2026-08-10T18:01:00.000Z"),
  /current recovery action/i,
  "Recovery actions must be completed in sequence"
);

order = recovery.completeTask(order, order.tasks[0].id, { note: "24 oz water" }, "2026-08-10T18:02:00.000Z");
assert.equal(order.status, "IN_PROGRESS");
assert.equal(order.tasks[0].evidence.type, "RECRUIT_CONFIRMED");
assert.equal(recovery.nextTask(order).label, "Refuel");

order = recovery.completeTask(order, order.tasks[1].id, {}, "2026-08-10T18:10:00.000Z");
order = recovery.completeTask(order, order.tasks[2].id, {}, "2026-08-10T21:00:00.000Z");
assert.equal(order.status, "COMPLETE");
assert.equal(order.completedAt, "2026-08-10T21:00:00.000Z");
assert.equal(recovery.progress(order).percent, 100);

const idempotent = recovery.buildOrder({ debrief, decision, previous: order, now: "2026-08-10T22:00:00.000Z" });
assert.equal(idempotent, order, "The same debrief and Atlas decision must not reset completed recovery work");

const reopened = recovery.reopenTask(order, order.tasks[1].id, "2026-08-10T22:05:00.000Z");
assert.equal(reopened.tasks[0].status, "COMPLETE");
assert.equal(reopened.tasks[1].status, "PENDING");
assert.equal(reopened.tasks[2].status, "PENDING");
assert.equal(reopened.status, "IN_PROGRESS");

const safety = recovery.buildOrder({
  debrief: { ...debrief, id: "mission-debrief:2026-08-10:pm", painReported: true },
  decision: {
    code: "SAFETY_HOLD",
    requirements: ["Stop training", "Update pain status"],
    action: "ROLL_CALL"
  },
  now: "2026-08-10T22:10:00.000Z"
});
assert.equal(safety.status, "SAFETY_HOLD");
assert.equal(safety.safetyHold, true);
assert.equal(safety.tasks[1].routeAction, "ROLL_CALL");

const carried = recovery.latestRelevant([order, reopened, safety], "2026-08-11");
assert.equal(carried.id, safety.id, "The newest unresolved order carries into the next day");

const summary = recovery.summarizeForAtlas([order, reopened, safety], "2026-08-10", "2026-08-10");
assert.deepEqual(summary, { orders: 3, completed: 1, unresolved: 2, adherencePercent: 33, safetyHolds: 1 });

console.log("Mission Recovery engine tests passed.");
