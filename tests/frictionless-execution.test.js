const test = require("node:test");
const assert = require("node:assert/strict");
const Execution = require("../assets/js/frictionless-execution.js");

test("builds one direct route for every daily execution surface", () => {
  assert.equal(Execution.VERSION, "028B.1");
  assert.deepEqual(Execution.MODULES.map((item) => item.id), ["strength", "running", "core", "fuel", "recovery", "closeout"]);
  assert.deepEqual(Execution.routeFor("strength"), { section: "today", target: "daily-assignment-panel" });
  assert.deepEqual(Execution.routeFor("running"), { section: "performance", target: "running-command-panel" });
  assert.deepEqual(Execution.routeFor("fuel"), { section: "today", target: "mobile-nutrition-form" });
});

test("resumes an active session before a merely ready logger", () => {
  const dashboard = Execution.buildDashboard({
    date: "2026-08-16",
    modules: {
      strength: { state: "IN_PROGRESS", planned: true, updatedAt: "2026-08-16T12:00:00Z" },
      running: { state: "READY", planned: true },
      core: { state: "READY", planned: true },
      fuel: { state: "NOT_LOGGED", planned: true },
      recovery: { state: "READY", planned: true },
      closeout: { state: "WAITING", planned: false }
    }
  });
  assert.equal(dashboard.resume.id, "strength");
  assert.equal(dashboard.modules.find((item) => item.id === "strength").actionLabel, "Resume");
});

test("unfinished form values survive in a dated draft envelope", () => {
  const first = Execution.updateDraftEnvelope({}, "fuel", { calories: "2200", protein: "180" }, {
    date: "2026-08-16", now: "2026-08-16T12:00:00Z"
  });
  const second = Execution.updateDraftEnvelope(first, "closeout", { selfReportedSteps: "9000" }, {
    date: "2026-08-16", now: "2026-08-16T23:00:00Z", activate: false
  });
  assert.equal(second.activeModule, "fuel");
  assert.equal(second.drafts.fuel.values.protein, "180");
  assert.equal(second.drafts.closeout.values.selfReportedSteps, "9000");

  const dashboard = Execution.buildDashboard({
    lastModule: second.activeModule,
    modules: {
      fuel: { state: "EMPTY", draft: second.drafts.fuel },
      closeout: { state: "WAITING", draft: second.drafts.closeout }
    }
  });
  assert.equal(dashboard.resume.id, "fuel");
  assert.equal(dashboard.modules.find((item) => item.id === "closeout").state, "DRAFT");
});

test("clearing a submitted draft does not erase other unfinished work", () => {
  const envelope = Execution.updateDraftEnvelope({
    date: "2026-08-16",
    activeModule: "fuel",
    drafts: { fuel: { values: { calories: "2200" } }, closeout: { values: { selfReportedSteps: "9000" } } }
  }, "fuel", null, { clear: true, date: "2026-08-16", activate: false, now: "2026-08-16T23:10:00Z" });
  assert.equal(envelope.drafts.fuel, undefined);
  assert.equal(envelope.drafts.closeout.values.selfReportedSteps, "9000");
});
