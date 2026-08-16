(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionWeeklyReplanning = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "028D.1";
  const DOMAIN_ORDER = ["STRENGTH", "RUNNING", "CORE", "FUELING", "RECOVERY"];
  const LABELS = Object.freeze({
    STRENGTH: "Strength",
    RUNNING: "Running",
    CORE: "Core",
    FUELING: "Fuel",
    RECOVERY: "Recovery",
    EVIDENCE: "Evidence"
  });
  const TRAINING = new Set(["STRENGTH", "RUNNING", "CORE", "CARDIO", "CONDITIONING"]);

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function percent(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : null;
  }

  function domainForActivity(activity = {}) {
    const source = String(activity.module || activity.domain || activity.type || "").toUpperCase();
    if (source === "CARDIO") return "RUNNING";
    return DOMAIN_ORDER.includes(source) ? source : null;
  }

  function emptyDomain(code) {
    return { code, label: LABELS[code], sessions: 0, minutes: 0 };
  }

  function weekSnapshot(week = null) {
    const domains = Object.fromEntries(DOMAIN_ORDER.map((code) => [code, emptyDomain(code)]));
    const days = Array.isArray(week?.days) ? week.days : [];
    let trainingWindows = 0;
    let plannedMinutes = 0;
    let recoveryDays = 0;

    days.forEach((day) => {
      const activities = Array.isArray(day?.activities) ? day.activities : [];
      const trainingActivities = activities.filter((activity) => TRAINING.has(String(activity.module || activity.domain || activity.type || "").toUpperCase()));
      if (!trainingActivities.length) recoveryDays += 1;
      trainingWindows += trainingActivities.length;
      activities.forEach((activity) => {
        const code = domainForActivity(activity);
        if (!code || code === "FUELING" || code === "RECOVERY") return;
        const minutes = Math.max(0, number(activity.estimatedMinutes));
        domains[code].sessions += 1;
        domains[code].minutes += minutes;
        plannedMinutes += minutes;
      });
      if (day?.nutrition) domains.FUELING.sessions += 1;
    });
    domains.RECOVERY.sessions = recoveryDays;
    return {
      id: week?.id || null,
      weekStart: week?.weekStart || null,
      weekEnd: week?.weekEnd || null,
      domains,
      trainingWindows,
      plannedMinutes,
      recoveryDays,
      blockerCount: Math.max(0, number(week?.blockingConflictCount, (week?.conflicts || []).filter((item) => String(item?.severity || "").toUpperCase() === "BLOCKING").length))
    };
  }

  function evidenceFor(proposal = {}, code) {
    const source = proposal?.signals?.evidence?.domains?.[code] || {};
    const metrics = proposal?.metrics || {};
    const metricKey = `${String(code).toLowerCase()}Percent`;
    const planned = Math.max(0, number(source.planned));
    const completed = Math.max(0, Math.min(planned, number(source.completed)));
    const measuredPercent = planned ? Math.round((completed / planned) * 100) : percent(metrics[metricKey]);
    return { planned, completed, missed: Math.max(0, planned - completed), percent: measuredPercent };
  }

  function scheduleLabel(snapshot = {}) {
    const sessions = Math.max(0, number(snapshot.sessions));
    const minutes = Math.max(0, number(snapshot.minutes));
    if (!sessions) return "No scheduled dose";
    if (!minutes) return `${sessions} day${sessions === 1 ? "" : "s"}`;
    return `${sessions} session${sessions === 1 ? "" : "s"} / ${minutes} min`;
  }

  function deltaLabel(before = {}, after = {}) {
    const sessionDelta = number(after.sessions) - number(before.sessions);
    const minuteDelta = number(after.minutes) - number(before.minutes);
    if (!sessionDelta && !minuteDelta) return "No schedule change";
    const parts = [];
    if (sessionDelta) parts.push(`${sessionDelta > 0 ? "+" : ""}${sessionDelta} session${Math.abs(sessionDelta) === 1 ? "" : "s"}`);
    if (minuteDelta) parts.push(`${minuteDelta > 0 ? "+" : ""}${minuteDelta} min`);
    return parts.join(" / ");
  }

  function domainComparisons(proposal = {}, current = {}, next = {}) {
    return DOMAIN_ORDER.map((code) => {
      const evidence = evidenceFor(proposal, code);
      const before = current.domains?.[code] || emptyDomain(code);
      const after = next.domains?.[code] || before;
      return {
        code,
        label: LABELS[code],
        ...evidence,
        before,
        after,
        beforeLabel: scheduleLabel(before),
        afterLabel: scheduleLabel(after),
        delta: deltaLabel(before, after),
        state: evidence.percent === null ? "LEARNING" : evidence.percent >= 90 ? "SECURED" : evidence.percent >= 70 ? "WATCH" : "LIMITING"
      };
    });
  }

  function limitingFactor(proposal = {}, domains = []) {
    const metrics = proposal.metrics || {};
    if (number(metrics.painDays) > 0) {
      return { code: "RECOVERY", label: "Pain signal", value: `${number(metrics.painDays)} day${number(metrics.painDays) === 1 ? "" : "s"}`, detail: "Pain blocks progression. Next week must protect the affected work." };
    }
    if (number(metrics.redDays) >= 2) {
      return { code: "RECOVERY", label: "Readiness", value: `${number(metrics.redDays)} red days`, detail: "Repeated low-readiness days make recovery the limiting factor." };
    }
    if (number(metrics.techniqueFlags) >= 2) {
      return { code: "STRENGTH", label: "Technique", value: `${number(metrics.techniqueFlags)} flags`, detail: "Repeated technique limits block another loaded progression." };
    }
    if (number(metrics.stoppedSessions) > 0) {
      return { code: "RECOVERY", label: "Session completion", value: `${number(metrics.stoppedSessions)} stopped`, detail: "A stopped session must be resolved before demand increases." };
    }
    const scored = domains
      .filter((domain) => domain.planned > 0 && domain.percent !== null && domain.code !== "RECOVERY")
      .sort((left, right) => left.percent - right.percent || DOMAIN_ORDER.indexOf(left.code) - DOMAIN_ORDER.indexOf(right.code));
    if (scored.length) {
      const factor = scored[0];
      return {
        code: factor.code,
        label: factor.label,
        value: `${factor.completed}/${factor.planned} complete`,
        detail: factor.missed ? `${factor.missed} prescribed item${factor.missed === 1 ? " was" : "s were"} not secured.` : "This is the narrowest completed margin in the week."
      };
    }
    return { code: "EVIDENCE", label: "Evidence", value: "Still forming", detail: "Atlas will hold demand until the week has enough completed proof." };
  }

  function adjustmentRows(command = {}, domains = []) {
    const changes = Array.isArray(command.proposedChanges) ? command.proposedChanges : [];
    return changes.map((change) => {
      const comparison = domains.find((domain) => domain.code === change.domain) || null;
      return {
        domain: change.domain,
        label: change.label || LABELS[change.domain] || change.domain,
        action: change.action || "HOLD",
        detail: change.detail || "Keep the current prescription.",
        before: comparison?.beforeLabel || "Current prescription",
        after: comparison?.afterLabel || "Current prescription",
        delta: comparison?.delta || "No schedule change"
      };
    });
  }

  function buildReplan(input = {}) {
    const command = input.command || null;
    const proposal = input.proposal || null;
    if (!command || !proposal) return null;
    const current = weekSnapshot(input.currentWeek);
    const next = weekSnapshot(input.proposedWeek || input.currentWeek);
    const domains = domainComparisons(proposal, current, next);
    const limiter = limitingFactor(proposal, domains);
    const adjustments = adjustmentRows(command, domains);
    const totalPlanned = domains.slice(0, 4).reduce((sum, domain) => sum + domain.planned, 0);
    const totalCompleted = domains.slice(0, 4).reduce((sum, domain) => sum + domain.completed, 0);
    const adherencePercent = totalPlanned ? Math.round((totalCompleted / totalPlanned) * 100) : percent(proposal.metrics?.executionPercent);
    const status = command.status || proposal.status || "MONITORING";
    const awaitingDecision = status === "PROPOSED";
    const approved = status === "APPROVED";
    const held = status === "HELD";
    return {
      version: VERSION,
      id: `weekly-replan:${command.id || proposal.id || proposal.targetWeekStart || "current"}`,
      status,
      tone: command.tone || proposal.tone || "neutral",
      targetWeekStart: proposal.targetWeekStart || command.targetWeekStart || next.weekStart,
      targetWeekEnd: proposal.targetWeekEnd || command.targetWeekEnd || next.weekEnd,
      headline: awaitingDecision ? command.headline : approved ? "Next week approved" : held ? "Current prescription retained" : command.headline,
      detail: command.detail,
      confidence: proposal.confidence || "LOW",
      evidence: { planned: totalPlanned, completed: totalCompleted, adherencePercent },
      limiter,
      domains,
      adjustments,
      current,
      next,
      approval: {
        required: awaitingDecision,
        primaryLabel: "Approve next week",
        secondaryLabel: "Repeat this week",
        decided: approved ? "APPROVED" : held ? "HELD" : null
      },
      safeguard: "Approval changes the next week only. The current week and completed evidence stay fixed."
    };
  }

  function decisionReceipt(replan = {}, decision = "APPROVED", decidedAt = new Date().toISOString()) {
    const status = String(decision || "APPROVED").toUpperCase() === "HELD" ? "HELD" : "APPROVED";
    return {
      version: VERSION,
      id: `${replan.id || "weekly-replan"}:${status.toLowerCase()}`,
      status,
      decidedAt,
      targetWeekStart: replan.targetWeekStart || null,
      limitingFactor: replan.limiter ? { code: replan.limiter.code, label: replan.limiter.label, value: replan.limiter.value } : null,
      evidence: { ...(replan.evidence || {}) },
      before: { weekStart: replan.current?.weekStart || null, trainingWindows: number(replan.current?.trainingWindows), plannedMinutes: number(replan.current?.plannedMinutes) },
      after: { weekStart: replan.next?.weekStart || null, trainingWindows: number(replan.next?.trainingWindows), plannedMinutes: number(replan.next?.plannedMinutes) },
      changes: status === "APPROVED" ? (replan.adjustments || []).map((item) => ({ domain: item.domain, action: item.action, delta: item.delta })) : []
    };
  }

  return Object.freeze({ VERSION, DOMAIN_ORDER, LABELS, weekSnapshot, evidenceFor, domainComparisons, limitingFactor, buildReplan, decisionReceipt });
});
