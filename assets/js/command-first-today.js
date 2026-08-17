(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCommandFirstToday = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029D.1";
  const COMMAND_SEQUENCE = Object.freeze([
    "#mission-execution",
    "#frictionless-execution",
    ".lower-grid",
    "#morning-verification",
    "#daily-ritual",
    "#today-body-checkpoint",
    "#atlas-adaptive-horizon",
    "#atlas-adaptation-outcome",
    "#atlas-progression-order",
    "#adaptive-coaching",
    "#today-more-context"
  ]);

  function sequence() {
    return ["#one-command", ...COMMAND_SEQUENCE];
  }

  function apply(documentRef) {
    const doc = documentRef || (typeof document !== "undefined" ? document : null);
    const today = doc?.getElementById?.("today");
    const command = doc?.getElementById?.("one-command");
    if (!today || !command) return false;

    const header = today.querySelector?.(":scope > .today-command-header");
    const flow = doc.getElementById?.("today-flow-map");
    [header, flow].filter(Boolean).forEach((element) => {
      element.hidden = true;
      element.setAttribute?.("aria-hidden", "true");
    });

    command.dataset.primaryCommand = "true";
    let cursor = command;
    COMMAND_SEQUENCE.map((selector) => today.querySelector?.(selector) || doc.querySelector?.(selector))
      .filter(Boolean)
      .forEach((element, index) => {
        cursor.insertAdjacentElement("afterend", element);
        element.dataset.commandLayer = index < 2 ? "execution" : index < 5 ? "context" : "support";
        cursor = element;
      });

    const more = doc.getElementById?.("today-more-context");
    if (more && "open" in more) more.open = false;
    today.dataset.commandOrder = "029D";
    if (doc.documentElement?.dataset) doc.documentElement.dataset.todayHierarchy = VERSION;
    return true;
  }

  return Object.freeze({ VERSION, COMMAND_SEQUENCE: [...COMMAND_SEQUENCE], sequence, apply });
});
