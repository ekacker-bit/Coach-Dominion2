(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasWeeklyCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025U.1";
  const LABELS = { STRENGTH: "Strength", RUNNING: "Running", CORE: "Core", FUELING: "Fuel", RECOVERY: "Recovery" };
  function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
  function domainState(percent) { return percent === null ? "LEARNING" : percent >= 90 ? "SECURED" : percent >= 70 ? "WATCH" : "LIMITING"; }

  function buildCommand(input = {}) {
    const proposal = input.proposal || null;
    if (!proposal) return null;
    const metrics = proposal.metrics || {};
    const values = {
      STRENGTH: finite(metrics.strengthPercent),
      RUNNING: finite(metrics.runningPercent),
      CORE: finite(metrics.corePercent),
      FUELING: finite(metrics.fuelPercent),
      RECOVERY: finite(metrics.recoveryPercent)
    };
    const domains = Object.entries(values).map(([code, percent]) => ({ code, label: LABELS[code], percent, state: domainState(percent) }));
    const scored = domains.filter((domain) => domain.percent !== null).sort((left, right) => right.percent - left.percent);
    const win = scored[0] || { code: "EVIDENCE", label: "Evidence", percent: null, state: "LEARNING" };
    const watch = scored.at(-1) || { code: "EVIDENCE", label: "Evidence", percent: null, state: "LEARNING" };
    const running = input.runningProgression || null;
    const fuel = input.fuelSummary || null;
    const proposedChanges = (proposal.changes || []).map((change) => ({ domain: change.domain, label: LABELS[change.domain] || change.domain, action: change.action, detail: change.detail || change.label || "Bounded next-week change" }));
    if (running?.status === "PROPOSED" && !proposedChanges.some((change) => change.domain === "RUNNING")) proposedChanges.push({ domain: "RUNNING", label: "Running", action: running.code, detail: running.detail });
    const command = {
      version: VERSION,
      id: `atlas-weekly-command:${proposal.id || proposal.targetWeekStart || "current"}`,
      status: proposal.status,
      code: proposal.code,
      tone: proposal.tone || "neutral",
      targetWeekStart: proposal.targetWeekStart || null,
      targetWeekEnd: proposal.targetWeekEnd || null,
      headline: proposal.headline || proposal.label || "Repeat the current week",
      detail: proposal.detail || proposal.reason || "Atlas is reconciling the week.",
      win: { ...win, detail: win.percent === null ? "More evidence is required." : `${win.percent}% of planned evidence secured.` },
      watch: { ...watch, detail: watch.percent === null ? "More evidence is required." : `${watch.percent}% of planned evidence secured.` },
      priority: proposal.code === "PROTECT" ? "Clear recovery before adding demand." : proposal.code === "DELOAD" ? "Restore quality under a reduced dose." : proposal.code === "REBALANCE" ? `Remove friction in ${watch.label}.` : proposal.code === "PROGRESS" ? `Advance the coordinated week without breaking ${watch.label}.` : "Repeat the plan and improve evidence quality.",
      domains,
      proposedChanges,
      runningDecision: running ? { code: running.code, status: running.status, detail: running.detail } : null,
      fuelRead: fuel ? { closedDays: fuel.closedDays || 0, confidence: fuel.confidence || "LIMITED", recommendation: fuel.recommendation || null } : null,
      approvalRequired: proposal.status === "PROPOSED",
      safeguard: "One decision applies the coordinated next week. The current week and completed evidence remain immutable."
    };
    return command;
  }

  function approveCommand(command = {}, approvedAt = new Date().toISOString()) {
    if (command.status !== "PROPOSED") throw new Error("The weekly command is not awaiting approval.");
    return { ...command, status: "APPROVED", decision: command.code, approvedAt };
  }

  function holdCommand(command = {}, heldAt = new Date().toISOString()) {
    if (!command.id || !["PROPOSED", "APPROVED"].includes(command.status)) throw new Error("The weekly command is not awaiting a decision.");
    return { ...command, status: "HELD", decision: "HOLD", code: "HOLD", headline: "Repeat the current week", detail: "The recruit retained the coordinated prescription for another evidence cycle.", proposedChanges: [], heldAt };
  }

  function attachToDecision(decision = {}, command = {}) {
    return { ...decision, atlasWeeklyCommand: { version: VERSION, id: command.id, decision: command.decision || command.code, win: command.win, watch: command.watch, priority: command.priority, proposedChanges: command.proposedChanges, approvedAt: command.approvedAt || command.heldAt || null } };
  }

  return Object.freeze({ VERSION, buildCommand, approveCommand, holdCommand, attachToDecision });
});
