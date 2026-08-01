(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionDailyRitual = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "019C.1";
  const MILESTONES = Object.freeze([
    { id: "execute", label: "Execute" },
    { id: "record", label: "Record" },
    { id: "verify", label: "Verify" },
    { id: "adapt", label: "Adapt" }
  ]);

  function isoDate(value = "") {
    const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function addDays(date, days) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setUTCDate(parsed.getUTCDate() + days);
    return parsed.toISOString().slice(0, 10);
  }

  function closedDates(history = []) {
    return [...new Set((Array.isArray(history) ? history : [])
      .filter((item) => item?.status === "CLOSED" || item?.review?.status === "CLOSED")
      .map((item) => isoDate(item.date || item.review?.date))
      .filter(Boolean))].sort().reverse();
  }

  function securedDayStats(history = [], today = null) {
    const dates = closedDates(history);
    if (!dates.length) return { total: 0, streak: 0, latest: null };
    let cursor = dates[0];
    let streak = 0;
    const set = new Set(dates);
    while (cursor && set.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    const todayDate = isoDate(today);
    const latestIsCurrent = !todayDate || dates[0] === todayDate || dates[0] === addDays(todayDate, -1);
    return { total: dates.length, streak: latestIsCurrent ? streak : 0, latest: dates[0] };
  }

  function milestoneState(queue = {}, loop = {}) {
    const record = (queue.steps || []).find((step) => step.id === "record");
    const reviewClosed = loop.review?.status === "CLOSED";
    const adaptationApproved = loop.adaptation?.status === "APPROVED" || loop.state === "LOOP CLOSED";
    const completion = {
      execute: Boolean(queue.complete),
      record: Boolean(record?.complete),
      verify: Boolean(reviewClosed),
      adapt: Boolean(adaptationApproved)
    };
    const currentId = MILESTONES.find((item) => !completion[item.id])?.id || null;
    return MILESTONES.map((item) => ({
      ...item,
      complete: completion[item.id],
      current: item.id === currentId
    }));
  }

  function buildDailyRitual(input = {}) {
    const queue = input.queue || { steps: [], completed: 0, total: 6, percent: 0, complete: false };
    const loop = input.closedLoop || {};
    const milestones = milestoneState(queue, loop);
    const stats = securedDayStats(input.history, input.date);
    const reviewClosed = loop.review?.status === "CLOSED";
    const adaptationApproved = loop.adaptation?.status === "APPROVED" || loop.state === "LOOP CLOSED";
    const reconciliation = loop.reconciliation?.summary || loop.review?.reconciliation?.summary || {};
    let state = "LOCKED";
    let eyebrow = "THE DAILY SEAL";
    let title = "Earn today’s seal";
    let detail = "Execute the orders and preserve the evidence before closing the day.";
    let action = "continue_execution";
    let actionLabel = "Continue Today";

    if (Number(queue.completed || 0) > 0 && !queue.complete) {
      state = "IN_MOTION";
      title = `${queue.completed} of ${queue.total} commitments secured`;
      detail = `Finish ${queue.current?.label?.toLowerCase() || "the current order"}. The seal remains open until the record is complete.`;
    }
    if (queue.complete && !loop.review?.status && loop.state !== "REVIEW READY") {
      state = "EVIDENCE_CHECK";
      title = "Verify the evidence";
      detail = "The daily queue is complete. Reconcile every required domain before sealing the record.";
    }
    if (loop.state === "REVIEW READY") {
      state = "READY_TO_SEAL";
      eyebrow = "FINAL REVIEW";
      title = "Seal the day with evidence";
      detail = "The approved decision and actual work agree. Close the review to preserve today’s lesson.";
      action = "close_review";
      actionLabel = "Seal the Day";
    }
    if (reviewClosed && !adaptationApproved) {
      state = "LESSON_READY";
      eyebrow = "LESSON EXTRACTED";
      title = "Carry the lesson forward";
      detail = loop.adaptation?.reason || "Today’s evidence produced a bounded proposal for the next exposure.";
      action = "approve_adaptation";
      actionLabel = "Approve Next Move";
    }
    if (adaptationApproved) {
      state = "SEALED";
      eyebrow = "DAY SECURED";
      title = "The day is sealed";
      detail = loop.adaptation?.label
        ? `${loop.adaptation.label}. The lesson is approved for ${loop.adaptation.effectiveDate || "the next operating day"}.`
        : "The evidence is preserved and the next operating day has a clear starting point.";
      action = "view_history";
      actionLabel = "View Secured Days";
    }

    const readiness = String(input.readinessState || "").toUpperCase();
    return {
      version: VERSION,
      state,
      tone: readiness === "RED" ? "protect" : state === "SEALED" ? "sealed" : state === "READY_TO_SEAL" || state === "LESSON_READY" ? "ready" : "active",
      eyebrow,
      title,
      detail,
      action,
      actionLabel,
      milestones,
      stats,
      evidence: {
        percent: Number.isFinite(Number(reconciliation.completionPercent)) ? Number(reconciliation.completionPercent) : Number(queue.percent || 0),
        confidence: reconciliation.confidence || (queue.complete ? "CHECKING" : "OPEN"),
        completed: Number(queue.completed || 0),
        total: Number(queue.total || 6)
      },
      rank: String(input.rank || "RECRUIT").replaceAll("_", " "),
      sealed: state === "SEALED"
    };
  }

  return Object.freeze({ VERSION, MILESTONES: MILESTONES.map((item) => ({ ...item })), isoDate, securedDayStats, milestoneState, buildDailyRitual });
});
