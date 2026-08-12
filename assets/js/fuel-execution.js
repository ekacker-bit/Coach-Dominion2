(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionFuelExecution = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025T.1";
  function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
  function ratio(metric = {}) { return finite(metric.actual) !== null && finite(metric.target) > 0 ? metric.actual / metric.target : null; }

  function buildVerdict(input = {}) {
    const execution = input.execution || {};
    const loop = input.loop || {};
    const metrics = execution.metrics || loop.reconciliation?.metrics || {};
    const calories = ratio(metrics.calories);
    const protein = ratio(metrics.protein);
    const evidence = [calories, protein].filter((value) => value !== null).length;
    let code = "INCOMPLETE_EVIDENCE";
    let tone = "neutral";
    let headline = "Fuel evidence incomplete";
    let detail = "Missing intake is not noncompliance. Sync or enter the day once before Atlas judges execution.";
    if (loop.reconciliation?.reviewRequired) {
      code = "REVIEW_EVIDENCE"; tone = "yellow"; headline = "Reconcile Fuel evidence";
      detail = "The meal record and daily total disagree. Refresh the source; do not enter food twice.";
    } else if (evidence === 2 && calories >= 0.9 && calories <= 1.1 && protein >= 0.9) {
      code = "ON_TARGET"; tone = "green"; headline = "Fuel order secured";
      detail = "Energy and protein landed inside the approved operating range.";
    } else if (evidence === 2 && (calories < 0.8 || protein < 0.8)) {
      code = "UNDER_FUELED"; tone = "yellow"; headline = "Recovery fuel is incomplete";
      detail = "Energy or protein finished materially below plan. Resume the approved target tomorrow; do not compensate or restrict.";
    } else if (calories !== null && calories > 1.15) {
      code = "EXCEEDED"; tone = "yellow"; headline = "Return to the Fuel plan";
      detail = "Energy exceeded the approved range. Record it honestly and resume the plan tomorrow without restriction.";
    } else if (evidence === 2) {
      code = "PARTIAL"; tone = "yellow"; headline = "Fuel order partially secured";
      detail = "The day is recorded, but one primary target finished outside the operating range.";
    }
    return { version: VERSION, code, tone, headline, detail, caloriesPercent: calories === null ? null : Math.round(calories * 100), proteinPercent: protein === null ? null : Math.round(protein * 100), evidenceCount: evidence, source: loop.reconciliation?.source || execution.sourceLabel || "No daily total", safeguard: "No compensatory restriction. Approved targets never change from a daily verdict." };
  }

  function trainingWindows(calendar = {}) {
    return (calendar.sessions || []).map((session) => session.windowLabel || session.window || session.label).filter(Boolean);
  }

  function buildOrder(input = {}) {
    const execution = input.execution || {};
    const loop = input.loop || {};
    const calendar = input.calendarContext || execution.calendarContext || {};
    const fasting = input.fastingContext || execution.fastingContext || {};
    const metric = (key) => execution.metrics?.[key] || {};
    const remaining = { calories: finite(metric("calories").remaining), protein: finite(metric("protein").remaining), carbs: finite(metric("carbs").remaining), fat: finite(metric("fat").remaining) };
    const windows = trainingWindows(calendar);
    const splitDay = Boolean(calendar.splitDay || windows.length > 1);
    const hydrationLiters = splitDay ? 3.5 : calendar.trainingDay ? 3.0 : 2.5;
    const verdict = loop.closeout?.verdict || buildVerdict({ execution, loop });
    let timing = "Distribute the remaining target across the rest of the day.";
    if (calendar.longRun) timing = "Fuel before the long run and begin recovery intake promptly after it. Long-run duration is never capped by this order.";
    else if (splitDay) timing = "Protect fuel between AM and PM sessions. Do not extend a fast through the recovery window.";
    else if (calendar.trainingDay) timing = "Place protein and carbohydrate around the committed training window.";
    if (fasting.suspended) timing = "Training and recovery override today’s fasting window.";
    return { version: VERSION, date: execution.date || loop.date || null, status: loop.closeout ? "CLOSED" : loop.status || execution.status || "EXECUTE", headline: loop.closeout ? verdict.headline : calendar.trainingDay ? "Fuel today’s training" : "Fuel recovery", detail: loop.closeout ? verdict.detail : timing, remaining, hydrationLiters, trainingWindows: windows, splitDay, longRun: Boolean(calendar.longRun), timing, verdict, primaryAction: loop.primaryAction || { id: "capture-total", label: "Record intake" }, safeguard: verdict.safeguard };
  }

  function attachVerdict(closeout = {}, order = {}) {
    if (!closeout?.date) throw new Error("Close the Fuel day before issuing a verdict.");
    return { ...closeout, version: VERSION, verdict: { ...(order.verdict || {}) }, dailyOrder: { hydrationLiters: order.hydrationLiters, trainingWindows: order.trainingWindows, splitDay: order.splitDay, longRun: order.longRun, timing: order.timing }, updatedAt: closeout.updatedAt || new Date().toISOString() };
  }

  return Object.freeze({ VERSION, buildVerdict, buildOrder, attachVerdict });
});
