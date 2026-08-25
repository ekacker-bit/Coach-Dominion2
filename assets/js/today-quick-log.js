(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionTodayQuickLog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030P.1";
  const SETUP_STATES = new Set(["CONTRACT_REQUIRED", "SIGNATURE_REQUIRED", "PLANS_REQUIRED", "WEEK_REQUIRED"]);

  function text(value = "") {
    return String(value ?? "").trim();
  }

  function number(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function hasAny(values = {}) {
    return Object.values(values || {}).some((value) => value !== null && value !== undefined && text(value) !== "");
  }

  function normalizeRun(input = {}) {
    const distance = number(input.runDistance ?? input.distance);
    const durationMinutes = number(input.runMinutes ?? input.durationMinutes);
    const totalSeconds = durationMinutes === null ? null : Math.max(0, Math.round(durationMinutes * 60));
    return {
      runType: text(input.runType || "EASY").toUpperCase(),
      distance,
      unit: text(input.runUnit || input.unit || "mi").toLowerCase() === "km" ? "km" : "mi",
      durationMinutes,
      hours: totalSeconds === null ? null : Math.floor(totalSeconds / 3600),
      minutes: totalSeconds === null ? null : Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds === null ? null : totalSeconds % 60
    };
  }

  function normalizeFuel(input = {}) {
    return {
      calories: number(input.calories),
      protein: number(input.protein),
      carbs: number(input.carbs),
      fat: number(input.fat)
    };
  }

  function normalizeCloseout(input = {}) {
    return { selfReportedSteps: number(input.selfReportedSteps ?? input.steps) };
  }

  function validate(input = {}, options = {}) {
    const rawRun = {
      runDistance: input.runDistance,
      runMinutes: input.runMinutes,
      runType: input.runType,
      runUnit: input.runUnit
    };
    const rawFuel = { calories: input.calories, protein: input.protein, carbs: input.carbs, fat: input.fat };
    const rawCloseout = { selfReportedSteps: input.selfReportedSteps };
    const run = normalizeRun(rawRun);
    const fuel = normalizeFuel(rawFuel);
    const closeout = normalizeCloseout(rawCloseout);
    const sections = {
      run: hasAny(rawRun) && (text(input.runDistance) !== "" || text(input.runMinutes) !== ""),
      fuel: hasAny(rawFuel),
      closeout: hasAny(rawCloseout)
    };
    const errors = [];
    if (sections.run) {
      if (!(run.distance > 0)) errors.push({ field: "runDistance", message: "Enter run distance." });
      if (!(run.durationMinutes > 0)) errors.push({ field: "runMinutes", message: "Enter run time." });
    }
    if (sections.fuel) {
      ["calories", "protein", "carbs", "fat"].forEach((field) => {
        if (fuel[field] === null || fuel[field] < 0) errors.push({ field, message: `Enter ${field}.` });
      });
    }
    if (sections.closeout && (closeout.selfReportedSteps === null || closeout.selfReportedSteps < 0 || closeout.selfReportedSteps > 250000)) {
      errors.push({ field: "selfReportedSteps", message: "Enter valid steps." });
    }
    const closeoutReady = options.closeoutReady === true || options.hasCloseout === true;
    return {
      version: VERSION,
      valid: errors.length === 0 && Object.values(sections).some(Boolean),
      empty: !Object.values(sections).some(Boolean),
      errors,
      sections,
      run,
      fuel,
      closeout,
      closeoutReady,
      stepsWillDraft: sections.closeout && !closeoutReady
    };
  }

  function progress(input = {}) {
    const items = [
      { id: "workout", label: text(input.workoutLabel || "Strength/Core"), applicable: input.workoutApplicable !== false, complete: input.workoutComplete === true },
      { id: "run", label: "Run", applicable: input.runApplicable === true, complete: input.runComplete === true },
      { id: "fuel", label: "Fuel", applicable: input.fuelApplicable !== false, complete: input.fuelComplete === true },
      { id: "closeout", label: "Closeout", applicable: input.closeoutApplicable !== false, complete: input.closeoutComplete === true }
    ].filter((item) => item.applicable);
    const completed = items.filter((item) => item.complete).length;
    const missing = items.filter((item) => !item.complete);
    return { items, missing, missingLabels: missing.map((item) => item.label), completed, total: items.length, percent: items.length ? Math.round(completed / items.length * 100) : 0 };
  }

  function resumeAction(input = {}) {
    const state = text(input.workoutState).toUpperCase().replaceAll(" ", "_");
    if (["IN_PROGRESS", "PAUSED", "REVIEW", "PARTIAL"].includes(state)) return { visible: true, label: "Resume workout", state };
    if (input.workoutApplicable === true && input.workoutComplete !== true) return { visible: true, label: "Start workout", state: state || "READY" };
    return { visible: false, label: "", state: state || "NOT_APPLICABLE" };
  }

  function shouldSuppressSetup(input = {}) {
    const programState = text(input.programState).toUpperCase();
    const truthState = text(input.truthState).toUpperCase();
    const hardBlocker = text(input.hardBlocker).toUpperCase();
    return programState === "ACTIVE"
      && input.hasCommittedWeek === true
      && !hardBlocker
      && SETUP_STATES.has(truthState);
  }

  function draftSections(input = {}) {
    const runStarted = text(input.runDistance) !== "" || text(input.runMinutes) !== "";
    const run = normalizeRun(input);
    return {
      running: runStarted ? {
        distance: text(input.runDistance),
        unit: text(input.runUnit || "mi"),
        hours: run.hours === null ? "" : String(run.hours),
        minutes: run.minutes === null ? "" : String(run.minutes),
        seconds: run.seconds === null ? "" : String(run.seconds),
        runType: text(input.runType || "EASY")
      } : {},
      fuel: {
        calories: text(input.calories),
        protein: text(input.protein),
        carbs: text(input.carbs),
        fat: text(input.fat)
      },
      closeout: { selfReportedSteps: text(input.selfReportedSteps) }
    };
  }

  return Object.freeze({
    VERSION,
    SETUP_STATES: [...SETUP_STATES],
    hasAny,
    normalizeRun,
    normalizeFuel,
    normalizeCloseout,
    validate,
    progress,
    resumeAction,
    shouldSuppressSetup,
    draftSections
  });
});
