(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionFuelCalendar = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "023B.1";
  const WINDOWS = ["MORNING", "MIDDAY", "EVENING", "UNSCHEDULED"];

  function clean(value) {
    return String(value || "").trim();
  }

  function titleCase(value) {
    return clean(value).toLowerCase().replace(/(^|\s|_)([a-z])/g, (_, lead, letter) => `${lead === "_" ? " " : lead}${letter.toUpperCase()}`);
  }

  function normalizeActivity(item = {}, index = 0) {
    return {
      id: clean(item.id || `activity-${index + 1}`),
      module: clean(item.module || "TRAINING").toUpperCase(),
      title: clean(item.title || item.name || item.module || "Training"),
      type: clean(item.type || item.sessionType || item.module || "TRAINING").toUpperCase(),
      estimatedMinutes: Math.max(0, Number(item.estimatedMinutes || 0)),
      sessionOrder: Math.max(1, Number(item.sessionOrder || 1)),
      sessionWindow: clean(item.sessionWindow).toUpperCase() || null,
      trainingWindowId: clean(item.trainingWindowId || `window-${item.sessionOrder || 1}`),
      tertiary: item.tertiary === true
    };
  }

  function groupSessions(activities = []) {
    const groups = new Map();
    activities.forEach((activity) => {
      const key = activity.trainingWindowId || `window-${activity.sessionOrder}`;
      if (!groups.has(key)) groups.set(key, { id: key, order: activity.sessionOrder, window: activity.sessionWindow, activities: [], estimatedMinutes: 0 });
      const group = groups.get(key);
      group.activities.push(activity);
      group.estimatedMinutes += activity.estimatedMinutes;
      if (!group.window && activity.sessionWindow) group.window = activity.sessionWindow;
    });
    return [...groups.values()].sort((left, right) => left.order - right.order);
  }

  function sessionLabel(session, index, splitDay) {
    const modules = [...new Set(session.activities.map((activity) => activity.module))]
      .map((module) => module === "RUNNING" ? "Run" : titleCase(module));
    const prefix = splitDay ? (session.window || (index === 0 ? "AM" : "PM")) : null;
    return `${prefix ? `${prefix} · ` : ""}${modules.join(" + ")}${session.estimatedMinutes ? ` · ${session.estimatedMinutes} min` : ""}`;
  }

  function inferredMealWindow({ splitDay, longRun, sessions, fallbackWindow }) {
    if (splitDay) return "SPLIT_DAY";
    if (longRun) return "LONG_RUN";
    const scheduled = sessions[0]?.window;
    if (scheduled === "AM") return "MORNING";
    if (scheduled === "PM") return "EVENING";
    return WINDOWS.includes(fallbackWindow) ? fallbackWindow : "UNSCHEDULED";
  }

  function buildFuelCalendarContext(input = {}) {
    const day = input.committedDay && typeof input.committedDay === "object" ? input.committedDay : null;
    const activities = (Array.isArray(day?.activities) ? day.activities : []).map(normalizeActivity);
    const sessions = groupSessions(activities);
    const hasCommittedDay = Boolean(day);
    const plannedTraining = activities.length > 0;
    const recordedTraining = input.importedTrainingDay === true;
    const trainingDay = hasCommittedDay ? plannedTraining : recordedTraining;
    const longRun = day?.longRunUncapped === true || activities.some((activity) => activity.module === "RUNNING" && activity.type === "LONG");
    const splitDay = day?.twoADay === true || sessions.length > 1 && activities.some((activity) => activity.sessionWindow === "AM") && activities.some((activity) => activity.sessionWindow === "PM");
    const corePaired = day?.corePaired === true || activities.some((activity) => activity.module === "CORE" && activity.tertiary);
    const estimatedMinutes = Math.max(0, Number(day?.estimatedMinutes || activities.reduce((total, activity) => total + activity.estimatedMinutes, 0)));
    const mealWindow = inferredMealWindow({ splitDay, longRun, sessions, fallbackWindow: clean(input.fallbackWindow).toUpperCase() });
    const source = hasCommittedDay ? "COMMITTED CALENDAR" : recordedTraining ? "RECORDED TRAINING" : "NO COMMITTED DAY";
    const blocker = !hasCommittedDay;
    const phase = splitDay && input.splitCheckpoint?.refueled === true ? "BETWEEN_SESSIONS" : trainingDay ? "PRE_TRAINING" : "RECOVERY";

    let headline = "Recovery day";
    let detail = "Use the approved recovery targets and normal meal timing.";
    if (splitDay) {
      headline = `Two-a-Day · ${estimatedMinutes || "planned"}${estimatedMinutes ? " min" : ""}`;
      detail = "Fuel Session 1, recover between windows, then fuel Session 2.";
    } else if (longRun) {
      headline = "Long run · duration open";
      detail = "Start fueled, carry familiar fuel and fluids for the full duration, then recover normally.";
    } else if (trainingDay && activities.length) {
      headline = `${activities.filter((activity) => !activity.tertiary).map((activity) => activity.title).join(" + ")}${estimatedMinutes ? ` · ${estimatedMinutes} min` : ""}`;
      detail = corePaired
        ? "Fuel the primary session; Core stays inside the same training window."
        : "Place familiar carbohydrate and protein around the planned session.";
    } else if (trainingDay) {
      headline = "Training recorded · calendar missing";
      detail = "Using recorded training as a fallback. Commit the week so Fuel can plan ahead.";
    } else if (!hasCommittedDay) {
      headline = "Commit the week to plan Fuel";
      detail = "No committed calendar day is available. Recovery targets remain the safe fallback.";
    }

    return {
      version: VERSION,
      date: clean(input.date || day?.date) || null,
      status: hasCommittedDay ? "CALENDAR ACTIVE" : recordedTraining ? "RECORDED FALLBACK" : "CALENDAR REQUIRED",
      source,
      blocker,
      trainingDay,
      recoveryDay: hasCommittedDay && !plannedTraining,
      splitDay,
      longRun,
      longRunUncapped: longRun,
      corePaired,
      estimatedMinutes,
      sessionCount: sessions.length,
      mealWindow,
      phase,
      headline,
      detail,
      activities,
      sessions: sessions.map((session, index) => ({
        ...session,
        label: sessionLabel(session, index, splitDay)
      })),
      targetPolicy: trainingDay ? "APPROVED TRAINING TARGETS" : "APPROVED RECOVERY TARGETS",
      safeguard: "Calendar context changes timing guidance, never approved daily targets."
    };
  }

  return { VERSION, normalizeActivity, groupSessions, buildFuelCalendarContext };
}));
