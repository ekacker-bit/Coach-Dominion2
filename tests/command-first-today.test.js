const test = require("node:test");
const assert = require("node:assert/strict");

const CommandFirst = require("../assets/js/command-first-today.js");

test("the command and execution path precede context and Closeout", () => {
  assert.equal(CommandFirst.VERSION, "029D.1");
  assert.deepEqual(CommandFirst.sequence().slice(0, 5), [
    "#one-command",
    "#mission-execution",
    "#frictionless-execution",
    ".lower-grid",
    "#morning-verification"
  ]);
  assert.ok(CommandFirst.sequence().indexOf("#daily-ritual") < CommandFirst.sequence().indexOf("#today-more-context"));
});

test("applying the hierarchy hides competing chrome and marks the command", () => {
  const moved = [];
  const elements = new Map();
  const element = (id) => ({
    id,
    dataset: {},
    hidden: false,
    open: true,
    setAttribute(name, value) { this[name] = value; },
    insertAdjacentElement(_where, next) { moved.push(next.id); }
  });
  ["today", "one-command", "today-flow-map", "mission-execution", "frictionless-execution", "lower-grid", "morning-verification", "daily-ritual", "today-more-context", "header"].forEach((id) => elements.set(id, element(id)));
  const today = elements.get("today");
  today.querySelector = (selector) => selector === ":scope > .today-command-header" ? elements.get("header") : selector === ".lower-grid" ? elements.get("lower-grid") : null;
  const doc = {
    documentElement: { dataset: {} },
    getElementById(id) { return elements.get(id) || null; },
    querySelector(selector) {
      if (selector === ".lower-grid") return elements.get("lower-grid");
      if (selector.startsWith("#")) return elements.get(selector.slice(1)) || null;
      return null;
    }
  };

  assert.equal(CommandFirst.apply(doc), true);
  assert.equal(elements.get("header").hidden, true);
  assert.equal(elements.get("today-flow-map").hidden, true);
  assert.equal(elements.get("one-command").dataset.primaryCommand, "true");
  assert.equal(today.dataset.commandOrder, "029D");
  assert.equal(doc.documentElement.dataset.todayHierarchy, "029D.1");
  assert.equal(elements.get("today-more-context").open, false);
  assert.deepEqual(moved.slice(0, 5), ["mission-execution", "frictionless-execution", "lower-grid", "morning-verification", "daily-ritual"]);
});
