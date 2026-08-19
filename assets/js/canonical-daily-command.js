(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCanonicalDailyCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029B.1";
  const LIFECYCLE = Object.freeze({
    DRAFT: "DRAFT",
    READY_TO_COMMIT: "READY_TO_COMMIT",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    SUPERSEDED: "SUPERSEDED"
  });
  const TRAINING_DOMAINS = Object.freeze(["strength", "running", "core"]);
  const ALL_DOMAINS = Object.freeze([...TRAINING_DOMAINS, "nutrition", "recovery"]);
  const COMPLETE_STATES = new Set(["COMPLETE", "COMPLETED", "FINALIZED", "SECURED", "DONE"]);

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function domainName(value = "") {
    const normalized = String(value || "").trim().toLowerCase();
    if (["cardio", "run"].includes(normalized)) return "running";
    if (["abs", "abs/core"].includes(normalized)) return "core";
    if (["fuel", "nutrition_plan"].includes(normalized)) return "nutrition";
    return normalized;
  }

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
  }

  function isSuperseded(value = {}) {
    return ["REPLACED", "SUPERSEDED"].includes(upper(value.status || value.state));
  }

  function weekLifecycle(week = null, draft = null, date = null) {
    if (week) {
      if (isSuperseded(week)) return LIFECYCLE.SUPERSEDED;
      const current = dateIso(date);
      if (week.weekEnd && current > week.weekEnd) return LIFECYCLE.COMPLETED;
      return LIFECYCLE.ACTIVE;
    }
    if (!draft) return LIFECYCLE.DRAFT;
    const complete = Array.isArray(draft.days) && draft.days.length === 7;
    return complete && draft.approvalBlocked !== true ? LIFECYCLE.READY_TO_COMMIT : LIFECYCLE.DRAFT;
  }

  function dayLifecycle(weekState, day = null, options = {}) {
    if (weekState === LIFECYCLE.SUPERSEDED) return LIFECYCLE.SUPERSEDED;
    if (weekState === LIFECYCLE.COMPLETED || options.complete === true) return LIFECYCLE.COMPLETED;
    if (weekState === LIFECYCLE.ACTIVE && day) return LIFECYCLE.ACTIVE;
    return weekState === LIFECYCLE.READY_TO_COMMIT ? LIFECYCLE.READY_TO_COMMIT : LIFECYCLE.DRAFT;
  }

  function normalizeSessions(day = null) {
    if (!day || !Array.isArray(day.activities)) return [];
    const sequence = Array.isArray(day.sessionSequence) && day.sessionSequence.length ? day.sessionSequence : day.activities;
    return sequence.map((item, index) => {
      const assignmentId = item.assignmentId || item.id || item.activityId || `${domainName(item.module || item.domain)}-${index + 1}`;
      return {
        id: assignmentId,
        assignmentId,
        activityId: item.activityId || item.id || assignmentId,
        sessionId: item.sessionId || item.sourceId || null,
        planId: item.planId || null,
        planRevision: Number(item.planRevision || 0) || null,
        module: domainName(item.module || item.domain || "training"),
        title: item.title || item.label || "Training session",
        window: upper(item.sessionWindow || item.sessionLabel || (day.twoADay ? index ? "PM" : "AM" : "TODAY")),
        windowId: item.trainingWindowId || null,
        order: Number(item.sessionOrder || index + 1),
        estimatedMinutes: Number(item.estimatedMinutes || 0) || null,
        tertiary: item.tertiary === true,
        longRunUncapped: Boolean(day.longRunUncapped && domainName(item.module) === "running")
      };
    });
  }

  function draftDayForDate(draft = null, date = null) {
    if (!Array.isArray(draft?.days)) return null;
    const target = dateIso(date);
    return draft.days.find((day) => day?.date === target) || null;
  }

  function buildCanonicalDailyCommand(input = {}) {
    const date = dateIso(input.date || input.operatingDate);
    const committedWeek = input.committedWeek || null;
    const draftWeek = input.draftWeek || null;
    const committedDay = committedWeek ? input.committedDay || null : null;
    const draftDay = draftDayForDate(draftWeek, date);
    const weekState = weekLifecycle(committedWeek, draftWeek, date);
    const committed = weekState === LIFECYCLE.ACTIVE && Boolean(committedDay);
    const sessions = committed ? normalizeSessions(committedDay) : [];
    const recoveryDay = committed && sessions.length === 0;
    const complete = input.dayComplete === true || (sessions.length > 0 && sessions.every((session) => COMPLETE_STATES.has(upper(input.executions?.[session.module]?.state || input.executions?.[session.module]?.status))));
    const currentDayState = dayLifecycle(weekState, committedDay, { complete });
    const setupBlocker = !input.contract ? {
      code: "CONTRACT_REQUIRED",
      title: "Build your Contract",
      detail: "Set the outcome and commitment before Atlas creates the coordinated program week.",
      reason: "The Contract is the first source of program authority.",
      action: { action: "CONTRACT", label: "Build Contract", section: "contract", module: "" }
    } : draftWeek ? {
      code: "WEEK_COMMIT_REQUIRED",
      title: "Commit the coordinated week",
      detail: "The draft is visible in Calendar, but it cannot authorize training, Fuel timing, or Recovery until it is committed.",
      reason: "Only a committed program week can create an executable day.",
      action: { action: "COMMIT_WEEK", label: "Commit the coordinated week", section: "calendar", module: "" }
    } : {
      code: "WEEK_BUILD_REQUIRED",
      title: "Build the coordinated week",
      detail: "Build and commit the coordinated Calendar before training, Fuel timing, or Recovery can be authorized.",
      reason: "The signed Contract needs a complete operating week.",
      action: { action: "BUILD_WEEK", label: "Build the coordinated week", section: "calendar", module: "" }
    };
    const blocker = committed ? null : {
      ...setupBlocker,
      affectedDomains: [...TRAINING_DOMAINS, "recovery"],
      priority: 130
    };
    const nutrition = committed && committedDay?.nutrition && typeof committedDay.nutrition === "object"
      ? { ...committedDay.nutrition }
      : null;
    const fuelContext = committed ? {
      type: recoveryDay ? "RECOVERY_DAY" : "TRAINING_DAY",
      state: recoveryDay ? "RECOVERY_TARGET" : "TRAINING_TARGET",
      trainingDay: !recoveryDay,
      recoveryDay,
      schedulePending: false,
      headline: recoveryDay ? "Recovery-day Fuel" : committedDay.twoADay ? "Fuel both training windows" : "Fuel today's training",
      detail: recoveryDay ? "Use the recovery target from the committed day." : "Targets follow the committed training schedule.",
      target: nutrition
    } : {
      type: "SCHEDULE_PENDING",
      state: "SCHEDULE_PENDING",
      trainingDay: false,
      recoveryDay: false,
      schedulePending: true,
      headline: "Schedule pending",
      detail: "Commit the coordinated week before choosing training-day or recovery-day targets.",
      target: null
    };
    const programState = committedWeek
      ? isSuperseded(committedWeek) ? LIFECYCLE.SUPERSEDED : weekState === LIFECYCLE.COMPLETED ? LIFECYCLE.COMPLETED : LIFECYCLE.ACTIVE
      : weekState;
    const result = {
      version: VERSION,
      date,
      lifecycle: {
        program: programState,
        week: weekState,
        day: currentDayState,
        draft: draftWeek ? weekLifecycle(null, draftWeek, date) : null
      },
      program: { lifecycle: programState, committed: Boolean(committedWeek), id: committedWeek?.programId || committedWeek?.sourceRefs?.programId || null },
      week: {
        lifecycle: weekState,
        committed: Boolean(committedWeek),
        id: committedWeek?.id || null,
        revision: Number(committedWeek?.revision || 0),
        draftId: draftWeek?.id || null
      },
      day: {
        lifecycle: currentDayState,
        committed,
        source: committed ? committedDay : null,
        draftPreview: draftDay,
        recoveryDay,
        twoADay: committed && committedDay?.twoADay === true,
        longRunUncapped: committed && committedDay?.longRunUncapped === true
      },
      schedule: {
        available: committed,
        recoveryDay,
        twoADay: committed && committedDay?.twoADay === true,
        longRunUncapped: committed && committedDay?.longRunUncapped === true,
        sessions,
        scheduledDomains: [...new Set(sessions.map((session) => session.module))],
        estimatedMinutes: committed ? Number(committedDay?.estimatedMinutes || sessions.reduce((sum, session) => sum + Number(session.estimatedMinutes || 0), 0)) || 0 : 0
      },
      draftSchedule: {
        visible: Boolean(draftDay),
        executable: false,
        sessions: normalizeSessions(draftDay)
      },
      fuelContext,
      executable: committed && !recoveryDay,
      blocked: !committed,
      blocker,
      primaryAction: blocker?.action || (recoveryDay
        ? { action: "RECOVERY", label: "Open recovery plan", section: "today", module: "recovery" }
        : sessions[0]
          ? { action: "START", label: `Start ${sessions[0].title}`, section: "today", module: sessions[0].module, sessionId: sessions[0].id }
          : { action: "CLOSEOUT", label: "Close today", section: "today", module: "closeout" })
    };
    result.id = `canonical-day-${date}-${stableHash({
      week: result.week.id,
      revision: result.week.revision,
      lifecycle: result.lifecycle,
      sessions: sessions.map((session) => [session.id, session.window]),
      fuel: fuelContext.state
    })}`;
    return result;
  }

  function moduleState(command = null, domain = "strength", fallback = null) {
    const normalized = domainName(domain === "training" ? "strength" : domain);
    if (!command) return fallback || { status: "LOADING", executable: false, progressionAllowed: false, detail: "Checking today's order." };
    if (command.blocked) {
      if (TRAINING_DOMAINS.includes(normalized)) return {
        status: "BLOCKED",
        executable: false,
        progressionAllowed: false,
        scheduled: false,
        complete: false,
        detail: command.blocker.detail,
        action: command.primaryAction
      };
      if (normalized === "recovery") return {
        status: "PROTECTED",
        executable: false,
        progressionAllowed: false,
        scheduled: false,
        complete: false,
        detail: "Recovery is not cleared until the coordinated week is committed.",
        action: command.primaryAction
      };
      if (normalized === "nutrition") return {
        status: "SCHEDULE PENDING",
        executable: true,
        progressionAllowed: false,
        scheduled: false,
        complete: false,
        detail: command.fuelContext.detail,
        action: command.primaryAction
      };
    }
    if (fallback) return fallback;
    const sessions = command.schedule.sessions.filter((session) => session.module === normalized);
    if (TRAINING_DOMAINS.includes(normalized)) {
      if (command.schedule.recoveryDay) return { status: "REST", executable: false, progressionAllowed: false, scheduled: false, complete: false, detail: "No training is assigned on the committed recovery day." };
      const scheduled = sessions.length > 0;
      return { status: scheduled ? "AUTHORIZED" : "NOT SCHEDULED", executable: scheduled, progressionAllowed: scheduled, scheduled, complete: false, detail: scheduled ? "Scheduled by the committed day." : "Not scheduled today." };
    }
    return { status: "AVAILABLE", executable: true, progressionAllowed: false, scheduled: normalized === "recovery" || Boolean(command.fuelContext.target), complete: false, detail: normalized === "nutrition" ? command.fuelContext.detail : "Available from the committed day." };
  }

  function consistencyReport(command = {}) {
    const conflicts = [];
    if (!command.week?.committed && command.schedule?.sessions?.length) conflicts.push("A draft week produced executable sessions.");
    if (!command.week?.committed && command.fuelContext?.type !== "SCHEDULE_PENDING") conflicts.push("Fuel inferred a day type from an uncommitted week.");
    if (!command.week?.committed && command.day?.recoveryDay) conflicts.push("An uncommitted week was labeled as a recovery day.");
    if (command.schedule?.twoADay && command.schedule.sessions.some((session) => !["AM", "PM"].includes(session.window))) conflicts.push("A committed Two-a-Day is missing AM/PM windows.");
    if (command.schedule?.recoveryDay && command.executable) conflicts.push("A recovery day exposed executable training.");
    return { valid: conflicts.length === 0, conflicts };
  }

  return Object.freeze({
    VERSION,
    LIFECYCLE,
    TRAINING_DOMAINS: [...TRAINING_DOMAINS],
    ALL_DOMAINS: [...ALL_DOMAINS],
    stableHash,
    weekLifecycle,
    dayLifecycle,
    normalizeSessions,
    buildCanonicalDailyCommand,
    build: buildCanonicalDailyCommand,
    moduleState,
    consistencyReport
  });
});
