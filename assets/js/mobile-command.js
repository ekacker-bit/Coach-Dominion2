(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.DominionMobileCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "022G.1";
  const ACTIVE_STATES = new Set(["IN_PROGRESS", "PAUSED", "REVIEW"]);
  const COMPLETE_STATES = new Set(["COMPLETE", "COMPLETED"]);
  const MOBILE_DESTINATIONS = Object.freeze({
    today: { section: "today" },
    train: { section: "performance", performanceView: "today_training" },
    fuel: { section: "nutrition" },
    review: { section: "inspection" },
    more: { dialog: "mobile-more-dialog" }
  });
  const MORE_SECTIONS = new Set(["calendar", "contract", "trends", "standards", "rank", "record", "connected"]);

  function resolveMobileDestination(action = "today") {
    return MOBILE_DESTINATIONS[String(action || "today").toLowerCase()] || MOBILE_DESTINATIONS.today;
  }

  function mobileNavForSection(section = "today") {
    const normalized = String(section || "today").toLowerCase();
    if (normalized === "performance") return "train";
    if (normalized === "nutrition") return "fuel";
    if (normalized === "inspection") return "review";
    if (MORE_SECTIONS.has(normalized)) return "more";
    return "today";
  }

  function numeric(value, minimum, maximum, label, optional = false) {
    if ((value === "" || value === null || typeof value === "undefined") && optional) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
      throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
    }
    return parsed;
  }

  function normalizeRollCall(input = {}, options = {}) {
    const sources = {};
    const weight = numeric(input.weight, 50, 1000, "Weight", true);
    const restingHeartRate = numeric(input.resting_heart_rate, 25, 250, "Resting heart rate", true);
    const heartRateVariability = numeric(input.heart_rate_variability, 1, 500, "HRV", true);
    if (weight !== null) sources.weight = "MANUAL";
    if (restingHeartRate !== null) sources.resting_heart_rate = "MANUAL";
    if (heartRateVariability !== null) sources.heart_rate_variability = "MANUAL";
    return {
      user_id: options.userId || input.user_id || null,
      date: options.date || input.date,
      energy: numeric(input.energy, 1, 10, "Energy"),
      soreness: numeric(input.soreness, 1, 10, "Soreness"),
      pain: input.pain === true || input.pain === "yes",
      weight,
      resting_heart_rate: restingHeartRate,
      heart_rate_variability: heartRateVariability,
      objective_metric_sources: sources,
      objective_metrics_updated_at: Object.keys(sources).length ? (options.now || new Date().toISOString()) : null,
      comments: String(input.comments || "").trim().slice(0, 250) || null
    };
  }

  function normalizeNutrition(input = {}, options = {}) {
    const record = {
      date: options.date || input.date,
      updatedAt: options.now || new Date().toISOString()
    };
    ["calories", "protein", "carbs", "fat"].forEach((key) => {
      const value = input[key];
      record[key] = value === "" || value === null || typeof value === "undefined"
        ? null
        : numeric(value, 0, key === "calories" ? 10000 : 1500, key === "carbs" ? "Carbohydrates" : key[0].toUpperCase() + key.slice(1), true);
    });
    if (["calories", "protein", "carbs", "fat"].every((key) => record[key] === null)) {
      throw new Error("Enter at least one nutrition total.");
    }
    return record;
  }

  function executionState(execution = null) {
    return String(execution?.state || "").toUpperCase();
  }

  function moduleAction({ id, label, planned, blocked = false, blockLabel = "Not scheduled", execution = null, detail = "" } = {}) {
    const state = executionState(execution);
    if (COMPLETE_STATES.has(state)) {
      return { id, label, status: "COMPLETE", action: "OPEN", actionLabel: "Review", complete: true, active: false, enabled: true, detail };
    }
    if (blocked) {
      return { id, label, status: "SAFETY HOLD", action: "OPEN", actionLabel: "Review hold", complete: false, active: false, enabled: true, detail: detail || blockLabel };
    }
    if (ACTIVE_STATES.has(state)) {
      return { id, label, status: state, action: "RESUME", actionLabel: `Resume ${label.toLowerCase()}`, complete: false, active: true, enabled: true, detail };
    }
    if (planned) {
      return { id, label, status: "READY", action: "START", actionLabel: `Start ${label.toLowerCase()}`, complete: false, active: false, enabled: true, detail };
    }
    return { id, label, status: "NOT SCHEDULED", action: "OPEN", actionLabel: `Open ${label.toLowerCase()}`, complete: false, active: false, enabled: true, detail: detail || blockLabel };
  }

  function buildModules(input = {}) {
    const strength = moduleAction({
      id: "strength",
      label: "Strength",
      planned: Boolean(input.strengthAssignment?.exercises?.length) && input.strengthAssignment?.state !== "RECOVERY ONLY",
      blocked: input.strengthAssignment?.state === "RECOVERY ONLY",
      execution: input.strengthExecution,
      detail: input.strengthAssignment?.title || "Today’s approved workout"
    });
    const runningStatus = String(input.runningPrescription?.status || "").toUpperCase();
    const running = moduleAction({
      id: "running",
      label: "Run",
      planned: Boolean(input.runningPrescription?.session) && !["REST_DAY", "PAIN_HOLD"].includes(runningStatus),
      blocked: runningStatus === "PAIN_HOLD",
      blockLabel: runningStatus === "REST_DAY" ? "Recovery day" : "No run scheduled",
      execution: input.runningExecution,
      detail: input.runningPrescription?.session
        ? `${input.runningPrescription.session.distance || ""} ${input.runningPrescription.session.unit || ""} · ${input.runningPrescription.session.type || "Run"}`.trim()
        : input.runningPrescription?.message || "No run scheduled"
    });
    const coreStatus = String(input.corePrescription?.status || "").toUpperCase();
    const core = moduleAction({
      id: "core",
      label: "Core",
      planned: Boolean(input.corePrescription?.session) && !["RECOVERY_DAY", "SAFETY_HOLD", "PAIN_HOLD"].includes(coreStatus),
      blocked: ["SAFETY_HOLD", "PAIN_HOLD"].includes(coreStatus),
      blockLabel: coreStatus === "RECOVERY_DAY" ? "Recovery day" : "No core session scheduled",
      execution: input.coreExecution,
      detail: input.corePrescription?.session
        ? `${input.corePrescription.session.estimatedMinutes || ""} min · ${(input.corePrescription.exercises || []).length} movements`
        : input.corePrescription?.message || "No core session scheduled"
    });
    return [strength, running, core];
  }

  function buildMobileCommand(input = {}) {
    const date = input.date || new Date().toISOString().slice(0, 10);
    const rollCallComplete = input.dailyState?.date === date;
    const modules = buildModules(input);
    const active = modules.find((item) => item.active);
    const ready = modules.find((item) => item.status === "READY");
    const nutritionLogged = Boolean(input.nutrition?.date === date);
    let next;
    if (!rollCallComplete) {
      next = { action: "ROLL_CALL", label: "Complete Roll Call", detail: "Set readiness before training." };
    } else if (active) {
      next = { action: "MODULE", module: active.id, label: active.actionLabel, detail: `${active.label} is saved and ready to continue.` };
    } else if (ready) {
      next = { action: "MODULE", module: ready.id, label: ready.actionLabel, detail: ready.detail || `${ready.label} is ready.` };
    } else if (!nutritionLogged) {
      next = { action: "NUTRITION", label: "Log today’s fuel", detail: "Add current calories and macros in seconds." };
    } else {
      next = { action: "TODAY", label: "Review Today", detail: "Daily execution is current." };
    }
    const completed = Number(rollCallComplete) + modules.filter((item) => item.complete).length + Number(nutritionLogged);
    const total = modules.length + 2;
    return {
      version: VERSION,
      date,
      rollCallComplete,
      nutritionLogged,
      modules,
      next,
      progress: { completed, total, percent: Math.round((completed / total) * 100) },
      sync: {
        online: input.online !== false,
        pending: Math.max(0, Number(input.pendingWrites || 0)),
        label: input.online === false
          ? `${Math.max(0, Number(input.pendingWrites || 0))} saved offline`
          : Number(input.pendingWrites || 0)
            ? `Syncing ${Number(input.pendingWrites)} change${Number(input.pendingWrites) === 1 ? "" : "s"}`
            : "Up to date"
      }
    };
  }

  function enqueueWrite(writes = [], write = {}) {
    const normalized = {
      id: write.id || `${write.resource}:${write.key}`,
      resource: write.resource,
      key: write.key,
      payload: write.payload,
      createdAt: write.createdAt || new Date().toISOString(),
      updatedAt: write.updatedAt || new Date().toISOString(),
      attempts: Number(write.attempts || 0)
    };
    return [...writes.filter((item) => item.id !== normalized.id), normalized]
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  function acknowledgeWrite(writes = [], id = "") {
    return writes.filter((item) => item.id !== id);
  }

  return {
    VERSION,
    ACTIVE_STATES,
    MOBILE_DESTINATIONS,
    resolveMobileDestination,
    mobileNavForSection,
    normalizeRollCall,
    normalizeNutrition,
    moduleAction,
    buildModules,
    buildMobileCommand,
    enqueueWrite,
    acknowledgeWrite
  };
});
