(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecruitFirstCommandCenter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030Y.1";
  const STAGES = Object.freeze({
    RECOVERY: "RECOVERY",
    SETUP: "SETUP",
    EXECUTE: "EXECUTE",
    CLOSE: "CLOSE",
    SECURED: "SECURED"
  });
  const SETUP_STATES = new Set([
    "CONTRACT_REQUIRED",
    "SIGNATURE_REQUIRED",
    "PLANS_REQUIRED",
    "WEEK_REQUIRED",
    "CONFLICT",
    "ROLL_CALL_REQUIRED",
    "AUTHORIZATION_REQUIRED"
  ]);
  const TECHNICAL_SELECTORS = Object.freeze([
    "#morning-command-activation",
    "#command-completion-certification",
    "#next-day-command-handoff",
    "#mission-execution-spine",
    "#atlas-live-adaptation",
    "#atlas-command-adjustment-status",
    "#unified-blocker-resolution-receipt",
    "#activation-repair",
    "#morning-verification",
    "#atlas-adaptive-horizon",
    "#atlas-adaptation-outcome",
    "#atlas-progression-order",
    "#atlas-decision-center",
    "#adaptive-coaching"
  ]);
  const SUPPORT_SELECTORS = Object.freeze([
    "#mission-execution",
    "#frictionless-execution",
    "#today-body-checkpoint",
    "#today-mission-details",
    ".lower-grid"
  ]);

  function text(value = "") {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function concise(value = "", limit = 120) {
    const normalized = text(value);
    if (normalized.length <= limit) return normalized;
    const sentence = normalized.match(/^(.{1,160}?[.!?])(?:\s|$)/)?.[1];
    if (sentence && sentence.length <= limit) return sentence;
    const clipped = normalized.slice(0, Math.max(1, limit - 1));
    const wordBreak = clipped.lastIndexOf(" ");
    return `${clipped.slice(0, wordBreak > limit * 0.68 ? wordBreak : clipped.length).trim()}…`;
  }

  function stageFor(input = {}) {
    const model = input.model || {};
    const recovery = input.recovery || {};
    const queue = input.queue || {};
    const recoveryState = String(recovery.state || "CLEAR").toUpperCase();
    const modelState = String(model.state || "").toUpperCase();
    const currentId = String(queue.current?.id || "").toLowerCase();
    if (recoveryState && recoveryState !== "CLEAR") return STAGES.RECOVERY;
    if (model.secured || modelState === "SECURED") return STAGES.SECURED;
    if (model.mode === "SETUP" || SETUP_STATES.has(modelState)) return STAGES.SETUP;
    if (model.closeoutReady || currentId === "record" || queue.complete) return STAGES.CLOSE;
    return STAGES.EXECUTE;
  }

  function stageCopy(stage) {
    return ({
      RECOVERY: { eyebrow: "RESTORE TODAY", stateLabel: "ACTION NEEDED" },
      SETUP: { eyebrow: "SET UP TODAY", stateLabel: "ACTION NEEDED" },
      EXECUTE: { eyebrow: "DO THIS NOW", stateLabel: "READY" },
      CLOSE: { eyebrow: "CLOSE THE DAY", stateLabel: "READY TO CLOSE" },
      SECURED: { eyebrow: "DAY SECURED", stateLabel: "SAVED" }
    })[stage] || { eyebrow: "TODAY", stateLabel: "READY" };
  }

  function build(input = {}) {
    const original = input.model || {};
    const stage = stageFor(input);
    const copy = stageCopy(stage);
    const progress = original.progress || { complete: 0, total: 0, percent: 0, current: "Today" };
    const model = {
      ...original,
      eyebrow: copy.eyebrow,
      stateLabel: copy.stateLabel,
      title: concise(original.title || "Open today’s command", 78),
      detail: concise(original.detail || "Complete the next required action.", 118),
      reason: concise(original.reason || original.detail || "This is the next required action.", 104),
      after: concise(original.after || "The next action will appear when this is complete.", 92),
      progressLabel: `${Number(progress.complete || 0)}/${Number(progress.total || 0)} done`,
      primary: {
        ...(original.primary || {}),
        label: concise(original.primary?.label || "Continue", 34)
      },
      secondary: { ...(original.secondary || {}), label: "Why this?" },
      context: {
        ...(original.context || {}),
        source: concise(original.context?.source || "Your signed program", 100),
        evidence: concise(original.context?.evidence || "Evidence updates as you work", 92),
        conflict: original.context?.conflict ? concise(original.context.conflict, 110) : null
      }
    };
    return Object.freeze({
      version: VERSION,
      stage,
      model,
      showCloseout: stage === STAGES.CLOSE,
      recoveryOwnsCommand: stage === STAGES.RECOVERY,
      onePrimaryAction: true,
      detailLabel: "Details & history",
      detailSummary: "Schedule, logging, rationale, and account status"
    });
  }

  function elementsFor(doc, selector) {
    if (typeof doc?.querySelectorAll === "function") return Array.from(doc.querySelectorAll(selector));
    const element = doc?.querySelector?.(selector) || (selector.startsWith("#") ? doc?.getElementById?.(selector.slice(1)) : null);
    return element ? [element] : [];
  }

  function apply(documentRef) {
    const doc = documentRef || (typeof document !== "undefined" ? document : null);
    const today = doc?.getElementById?.("today");
    const command = doc?.getElementById?.("one-command");
    const more = doc?.getElementById?.("today-more-context");
    const stack = more?.querySelector?.(".today-more-context-stack");
    if (!today || !command || !more || !stack) return false;

    const header = today.querySelector?.(":scope > .today-command-header");
    const flow = doc.getElementById?.("today-flow-map");
    [header, flow].filter(Boolean).forEach((element) => {
      element.hidden = true;
      element.setAttribute?.("aria-hidden", "true");
    });

    const moved = new Set();
    const move = (selector, kind) => {
      elementsFor(doc, selector).forEach((element) => {
        if (!element || element === command || element === more || element === stack || stack.contains?.(element) || moved.has(element)) return;
        element.dataset.recruitDetail = kind;
        stack.appendChild(element);
        moved.add(element);
      });
    };
    SUPPORT_SELECTORS.forEach((selector) => move(selector, "support"));
    TECHNICAL_SELECTORS.forEach((selector) => move(selector, "technical"));

    command.dataset.primaryCommand = "true";
    command.dataset.recruitCommand = VERSION;
    command.insertAdjacentElement?.("afterend", doc.getElementById?.("daily-ritual"));
    doc.getElementById?.("daily-ritual")?.insertAdjacentElement?.("afterend", more);
    if ("open" in more) more.open = false;
    const summary = more.querySelector?.(":scope > summary");
    const summaryLabel = summary?.querySelector?.("span");
    const summaryDetail = summary?.querySelector?.("small");
    if (summaryLabel) summaryLabel.textContent = "Details & history";
    if (summaryDetail) summaryDetail.textContent = "Schedule, logging, rationale, and account status";
    today.dataset.commandOrder = "030Y";
    if (doc.documentElement?.dataset) doc.documentElement.dataset.recruitFirstCommand = VERSION;
    return true;
  }

  function present(documentRef, view = {}) {
    const doc = documentRef || (typeof document !== "undefined" ? document : null);
    const today = doc?.getElementById?.("today");
    if (!today) return false;
    today.dataset.recruitFirstStage = String(view.stage || STAGES.EXECUTE).toLowerCase();
    today.dataset.recoveryOwnsCommand = view.recoveryOwnsCommand ? "true" : "false";
    today.dataset.onePrimaryAction = "true";
    const ritualAction = doc.getElementById?.("daily-ritual-action");
    if (ritualAction) ritualAction.hidden = true;
    const more = doc.getElementById?.("today-more-context");
    if (more && !more.dataset.userOpened) more.open = false;
    return true;
  }

  return Object.freeze({
    VERSION,
    STAGES,
    SUPPORT_SELECTORS: [...SUPPORT_SELECTORS],
    TECHNICAL_SELECTORS: [...TECHNICAL_SELECTORS],
    concise,
    stageFor,
    build,
    apply,
    present
  });
});
