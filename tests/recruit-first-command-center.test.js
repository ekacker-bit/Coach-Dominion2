"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const commandCenter = require("../assets/js/recruit-first-command-center.js");

function model(overrides = {}) {
  return {
    state: "MODULE_READY",
    mode: "EXECUTE",
    title: "Complete Lower A",
    detail: "Open the assigned workout and record every working set.",
    reason: "Lower A is the first unfinished assignment in the signed Calendar.",
    after: "Your run will become the next command.",
    stateLabel: "READY",
    secured: false,
    closeoutReady: false,
    primary: { action: "MODULE", label: "Start Lower A", section: "today", module: "strength" },
    secondary: { label: "Open decision context" },
    progress: { complete: 1, total: 4, percent: 25, current: "Lower A" },
    context: { source: "Signed Contract 9 and committed week 35", evidence: "1/4 actions proved", conflict: null },
    ...overrides
  };
}

test("execution stays one concise command without changing its route", () => {
  const source = model();
  const result = commandCenter.build({ model: source, recovery: { state: "CLEAR" }, queue: { current: { id: "strength" } } });
  assert.equal(result.stage, commandCenter.STAGES.EXECUTE);
  assert.equal(result.model.eyebrow, "DO THIS NOW");
  assert.equal(result.model.primary.action, "MODULE");
  assert.equal(result.model.primary.module, "strength");
  assert.equal(result.model.progressLabel, "1/4 done");
  assert.equal(source.eyebrow, undefined);
});

test("recovery overrides every normal command", () => {
  const result = commandCenter.build({
    model: model({ title: "Resume Lower A", primary: { action: "CONTINUITY_RECOVERY", label: "Resume Lower A", section: "today", module: "strength" } }),
    recovery: { state: "ACTION_REQUIRED" }
  });
  assert.equal(result.stage, commandCenter.STAGES.RECOVERY);
  assert.equal(result.recoveryOwnsCommand, true);
  assert.equal(result.model.eyebrow, "RESTORE TODAY");
  assert.equal(result.model.stateLabel, "ACTION NEEDED");
  assert.equal(result.model.primary.action, "CONTINUITY_RECOVERY");
});

test("setup, Closeout, and secured days have distinct recruit states", () => {
  const setup = commandCenter.build({ model: model({ mode: "SETUP", state: "CONTRACT_REQUIRED" }) });
  const close = commandCenter.build({ model: model({ closeoutReady: true }), queue: { current: { id: "record" } } });
  const secured = commandCenter.build({ model: model({ secured: true, state: "SECURED" }) });
  assert.equal(setup.stage, commandCenter.STAGES.SETUP);
  assert.equal(setup.model.eyebrow, "SET UP TODAY");
  assert.equal(close.stage, commandCenter.STAGES.CLOSE);
  assert.equal(close.showCloseout, true);
  assert.equal(secured.stage, commandCenter.STAGES.SECURED);
  assert.equal(secured.showCloseout, false);
  assert.equal(secured.model.stateLabel, "SAVED");
});

test("word diet bounds every primary sentence", () => {
  const long = "This is a deliberately long sentence with too much internal implementation detail that a recruit should never need to read before beginning the assigned work because it delays the actual command.";
  const result = commandCenter.build({ model: model({ title: long, detail: long, reason: long, after: long }) });
  assert.ok(result.model.title.length <= 78);
  assert.ok(result.model.detail.length <= 118);
  assert.ok(result.model.reason.length <= 104);
  assert.ok(result.model.after.length <= 92);
  assert.equal(result.onePrimaryAction, true);
});

test("presentation marks one authority and suppresses the duplicate ritual action", () => {
  const elements = new Map();
  const element = (id) => ({
    id,
    dataset: {},
    hidden: false,
    open: true,
    setAttribute(name, value) { this[name] = value; }
  });
  ["today", "daily-ritual-action", "today-more-context"].forEach((id) => elements.set(id, element(id)));
  const doc = { getElementById(id) { return elements.get(id) || null; } };
  assert.equal(commandCenter.present(doc, { stage: "CLOSE", recoveryOwnsCommand: false }), true);
  assert.equal(elements.get("today").dataset.recruitFirstStage, "close");
  assert.equal(elements.get("today").dataset.onePrimaryAction, "true");
  assert.equal(elements.get("daily-ritual-action").hidden, true);
  assert.equal(elements.get("today-more-context").open, false);
});
