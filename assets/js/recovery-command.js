(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecoveryCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "027C.1";
  const POSTURES = Object.freeze(["UNKNOWN", "GREEN", "AMBER", "RED"]);
  const TRAINING_DOMAINS = new Set(["TRAINING", "STRENGTH", "RUNNING", "CORE", "CARDIO", "CONDITIONING"]);

  function text(value = "") {
    return String(value ?? "").trim();
  }

  function upper(value = "") {
    return text(value).toUpperCase().replaceAll(" ", "_");
  }

  function dateIso(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function number(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function stableHash(value = "") {
    const source = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function sentence(value = "") {
    const normalized = text(value).replace(/\s+/g, " ");
    if (!normalized) return "Atlas needs a current Roll Call before issuing a recovery command.";
    return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
  }

  function activityModule(activity = {}) {
    return upper(activity.module || activity.domain || activity.type);
  }

  function isTraining(activity = {}) {
    return TRAINING_DOMAINS.has(activityModule(activity));
  }

  function isLongRun(activity = {}, day = {}) {
    return Boolean(day.longRunUncapped || activity.longRunUncapped || activity.durationOpen)
      || (/LONG_RUN|LONG RUN/.test(upper(activity.runType || activity.title || activity.label)));
  }

  function isPriority(activity = {}, day = {}) {
    return activity.priority === true || activity.isPriority === true || isLongRun(activity, day)
      || /PRIORITY|TEST|RACE/.test(upper(activity.intent || activity.title || activity.label));
  }

  function baselineSignals(readiness = {}) {
    const profile = readiness.baseline || {};
    return ["sleep", "resting_heart_rate", "heart_rate_variability"].map((key) => {
      const metric = profile.metrics?.[key] || {};
      const signal = metric.signal || {};
      return {
        key,
        label: metric.label || ({ sleep: "Sleep", resting_heart_rate: "Resting HR", heart_rate_variability: "HRV" }[key]),
        status: upper(signal.status || (number(readiness[key]) === null ? "MISSING" : "RECORDED")),
        severity: Math.max(0, number(signal.severity) || 0),
        value: number(metric.current ?? readiness[key]),
        ratio: number(signal.ratio)
      };
    });
  }

  function readinessSignals(readiness = {}, trainingLoad = {}) {
    const objective = baselineSignals(readiness);
    const energy = number(readiness.energy);
    const soreness = number(readiness.soreness);
    const pain = readiness.pain === true;
    const loadStrain = Number(trainingLoad.consecutiveTrainingDays || 0) >= 4
      || Number(trainingLoad.sessionsLast7 || 0) >= 6
      || Number(trainingLoad.scheduledMinutes || 0) > 120;
    return [
      { key: "energy", label: "Energy", status: energy === null ? "MISSING" : energy <= 3 ? "SEVERE" : energy <= 5 ? "CONCERN" : "CLEAR", severity: energy === null ? 0 : energy <= 3 ? 2 : energy <= 5 ? 1 : 0, value: energy },
      { key: "soreness", label: "Soreness", status: soreness === null ? "MISSING" : soreness >= 9 ? "SEVERE" : soreness >= 7 ? "CONCERN" : "CLEAR", severity: soreness === null ? 0 : soreness >= 9 ? 2 : soreness >= 7 ? 1 : 0, value: soreness },
      { key: "pain", label: "Pain", status: typeof readiness.pain !== "boolean" ? "MISSING" : pain ? "SEVERE" : "CLEAR", severity: pain ? 3 : 0, value: typeof readiness.pain === "boolean" ? pain : null },
      ...objective,
      { key: "training_load", label: "Training load", status: loadStrain ? "CONCERN" : "CLEAR", severity: loadStrain ? 1 : 0, value: Number(trainingLoad.sessionsLast7 || 0), detail: `${Number(trainingLoad.sessionsLast7 || 0)} sessions in 7 days` }
    ];
  }

  function postureFor(readiness = {}, signals = []) {
    let state = upper(readiness.state || readiness.classification);
    const complete = readiness.complete === true || Boolean(dateIso(readiness.date)) || ["GREEN", "YELLOW", "RED"].includes(state);
    if (!complete) return "UNKNOWN";
    if (!["GREEN", "YELLOW", "RED"].includes(state)) {
      if (readiness.pain === true) state = "RED";
      else if (Number(readiness.energy) >= 7 && Number(readiness.soreness) <= 4 && readiness.pain === false) state = "GREEN";
      else if (Number.isFinite(Number(readiness.energy)) || Number.isFinite(Number(readiness.soreness)) || readiness.pain === false) state = "YELLOW";
      else return "UNKNOWN";
    }
    if (readiness.pain === true || state === "RED") return "RED";
    const concerns = signals.filter((signal) => signal.severity >= 1);
    const severe = concerns.filter((signal) => signal.severity >= 2);
    if (state === "YELLOW" || severe.length || concerns.length >= 2) return "AMBER";
    return "GREEN";
  }

  function priorityActivity(day = {}) {
    const activities = Array.isArray(day.activities) ? day.activities : [];
    return activities.find((activity) => isTraining(activity) && isPriority(activity, day)) || null;
  }

  function commandCopy(posture, input = {}, signals = []) {
    const day = input.day || {};
    const priority = priorityActivity(day);
    const missionTask = input.missionOrder?.tasks?.find((task) => upper(task.status) !== "COMPLETE") || null;
    if (posture === "UNKNOWN") return {
      tone: "neutral",
      headline: "Roll Call required",
      order: "Complete Roll Call before training is authorized.",
      difference: "Atlas cannot safely change today's plan without current readiness.",
      action: { type: "ROLL_CALL", label: "Complete Roll Call", section: "today", module: "roll_call" }
    };
    if (posture === "RED") return {
      tone: "red",
      headline: "Recovery governs today",
      order: missionTask?.label || "No loaded training; complete 20 minutes of pain-free recovery and reassess tomorrow.",
      difference: "Strength, Running, and Core are held; Fuel targets remain protected.",
      action: { type: "RECOVERY", label: missionTask ? "Complete recovery action" : "Open recovery", section: "today", module: "recovery" }
    };
    if (posture === "AMBER" && missionTask) return {
      tone: "yellow",
      headline: "Finish the open recovery order",
      order: missionTask.label,
      difference: "The carried recovery action must close before additional demand is added.",
      action: { type: "RECOVERY", label: "Complete recovery action", section: "today", module: "recovery" }
    };
    if (posture === "AMBER" && priority) return {
      tone: "yellow",
      headline: `Protect ${text(priority.title || priority.label || "the priority session")}`,
      order: isLongRun(priority, day)
        ? "Keep the long run time open, hold it easy, and remove secondary Strength and Core work."
        : "Execute the priority session at RPE 7 or lower and remove secondary work.",
      difference: "The priority session stays; tertiary and optional demand is removed.",
      action: { type: "TRAINING", label: `Open ${text(priority.title || priority.label || "priority session")}`, section: "performance", module: activityModule(priority).toLowerCase() }
    };
    if (posture === "AMBER") return {
      tone: "yellow",
      headline: "Reduce today, keep the intent",
      order: "Complete primary work only at RPE 7 or lower; cut optional volume and intensity.",
      difference: "Strength and Core volume drop 25%; Running becomes easy and 20% shorter.",
      action: { type: "TRAINING", label: "Open adjusted training", section: "performance", module: "" }
    };
    return {
      tone: "green",
      headline: "Cleared to execute",
      order: "Train exactly as prescribed; do not add unplanned volume.",
      difference: "No recovery change is required.",
      action: { type: "TRAINING", label: "Open today's training", section: "performance", module: "" }
    };
  }

  function changesFor(posture, day = {}) {
    const priority = priorityActivity(day);
    if (posture === "RED") return [
      { domain: "STRENGTH", action: "RECOVERY_ONLY", volumeDeltaPercent: -100 },
      { domain: "RUNNING", action: "RECOVERY_ONLY", volumeDeltaPercent: -100 },
      { domain: "CORE", action: "RECOVERY_ONLY", volumeDeltaPercent: -100 },
      { domain: "CALENDAR", action: "RECOVERY_ONLY", volumeDeltaPercent: -100 },
      { domain: "FUEL", action: "HOLD_TARGETS", volumeDeltaPercent: 0 }
    ];
    if (posture === "AMBER" && priority) return [
      { domain: activityModule(priority), action: isLongRun(priority, day) ? "PRESERVE_LONG_RUN" : "PRESERVE_PRIORITY", volumeDeltaPercent: 0 },
      { domain: "STRENGTH", action: activityModule(priority) === "STRENGTH" ? "PRESERVE_PRIORITY" : "HOLD_SECONDARY", volumeDeltaPercent: activityModule(priority) === "STRENGTH" ? 0 : -100 },
      { domain: "RUNNING", action: activityModule(priority) === "RUNNING" ? "PRESERVE_PRIORITY" : "HOLD_SECONDARY", volumeDeltaPercent: activityModule(priority) === "RUNNING" ? 0 : -100 },
      { domain: "CORE", action: "REMOVE_TERTIARY", volumeDeltaPercent: -100 },
      { domain: "CALENDAR", action: "KEEP_PRIORITY_ONLY", volumeDeltaPercent: 0 },
      { domain: "FUEL", action: "HOLD_TARGETS", volumeDeltaPercent: 0 }
    ];
    if (posture === "AMBER") return [
      { domain: "STRENGTH", action: "REDUCE_VOLUME", volumeDeltaPercent: -25 },
      { domain: "RUNNING", action: "EASY_SHORTER", volumeDeltaPercent: -20 },
      { domain: "CORE", action: "REDUCE_VOLUME", volumeDeltaPercent: -25 },
      { domain: "CALENDAR", action: "REDUCE_DAY", volumeDeltaPercent: 0 },
      { domain: "FUEL", action: "HOLD_TARGETS", volumeDeltaPercent: 0 }
    ];
    return [];
  }

  function buildCommand(input = {}) {
    const date = dateIso(input.date || input.readiness?.date);
    if (!date) return null;
    const readiness = { ...(input.readiness || {}), complete: input.readinessComplete === true || input.readiness?.complete === true };
    const trainingLoad = input.trainingLoad || {};
    const signals = readinessSignals(readiness, trainingLoad);
    let posture = postureFor(readiness, signals);
    const missionOpen = input.missionOrder?.tasks?.some((task) => upper(task.status) !== "COMPLETE");
    if (missionOpen && input.missionOrder?.safetyHold === true) posture = "RED";
    else if (missionOpen && posture === "GREEN") posture = "AMBER";
    const copy = commandCopy(posture, input, signals);
    const bindings = {
      contractId: input.contract?.id || null,
      contractRevision: Number(input.contract?.revision || 0),
      weekId: input.week?.id || null,
      weekRevision: Number(input.week?.revision || 0)
    };
    const source = {
      readiness: {
        state: upper(readiness.state || readiness.classification),
        energy: number(readiness.energy),
        soreness: number(readiness.soreness),
        pain: readiness.pain === true,
        sleep: number(readiness.sleep),
        restingHeartRate: number(readiness.resting_heart_rate ?? readiness.restingHeartRate),
        hrv: number(readiness.heart_rate_variability ?? readiness.hrv)
      },
      trainingLoad: {
        scheduledMinutes: Number(trainingLoad.scheduledMinutes || 0),
        sessionsToday: Number(trainingLoad.sessionsToday || 0),
        sessionsLast7: Number(trainingLoad.sessionsLast7 || 0),
        consecutiveTrainingDays: Number(trainingLoad.consecutiveTrainingDays || 0)
      }
    };
    const fingerprint = stableHash({ date, posture, bindings, source, activities: (input.day?.activities || []).map((item) => ({ id: item.id, module: activityModule(item), minutes: item.estimatedMinutes })) });
    const id = `recovery-command:${date}:${fingerprint}`;
    if (input.previous?.id === id && input.previous.status === "COMPLETE") return JSON.parse(JSON.stringify(input.previous));
    return {
      version: VERSION,
      id,
      type: "RECOVERY_COMMAND",
      date,
      status: posture === "UNKNOWN" ? "ROLL_CALL_REQUIRED" : "ACTIVE",
      posture,
      ...copy,
      changes: changesFor(posture, input.day || {}),
      signals,
      source,
      bindings,
      priorityActivityId: priorityActivity(input.day || {})?.id || null,
      generatedAt: input.generatedAt || new Date().toISOString(),
      safeguard: "This command may change only today's execution; it never changes the Recruit Contract, campaign goal, or Fuel targets."
    };
  }

  function commandApplies(command = null, context = {}) {
    if (!command?.id || command.date !== dateIso(context.date || command.date)) return false;
    if (context.contractRevision && Number(command.bindings?.contractRevision || 0) !== Number(context.contractRevision)) return false;
    if (context.weekRevision && Number(command.bindings?.weekRevision || 0) !== Number(context.weekRevision)) return false;
    return true;
  }

  function adjustedActivity(activity = {}, command = {}, day = {}) {
    const module = activityModule(activity);
    const minutes = Number(activity.estimatedMinutes || 0);
    const priority = activity.id === command.priorityActivityId;
    if (command.posture === "AMBER" && command.priorityActivityId) {
      if (!priority) return null;
      return { ...activity, durationOpen: isLongRun(activity, day), recoveryCommand: { posture: "AMBER", action: "PRESERVE_PRIORITY", rpeCap: 7 } };
    }
    if (command.posture !== "AMBER") return activity;
    const factor = module === "RUNNING" ? 0.8 : 0.75;
    const estimatedMinutes = minutes > 0 ? Math.max(10, Math.round(minutes * factor / 5) * 5) : minutes;
    return {
      ...activity,
      title: module === "RUNNING" ? `Easy: ${text(activity.title || "Run")}` : activity.title,
      estimatedMinutes,
      recoveryCommand: { posture: "AMBER", action: module === "RUNNING" ? "EASY_SHORTER" : "REDUCE_VOLUME", rpeCap: 7 }
    };
  }

  function applyToDay(day = null, command = null, context = {}) {
    if (!day || !commandApplies(command, { ...context, date: day.date })) return day;
    if (command.posture === "UNKNOWN" || command.posture === "GREEN") return { ...day, recoveryCommand: command };
    if (command.posture === "RED") return {
      ...day,
      originalActivities: day.originalActivities || day.activities || [],
      activities: [{ id: `recovery:${command.date}`, module: "RECOVERY", title: "Recovery command", estimatedMinutes: 20, recoveryCommand: { posture: "RED", action: "RECOVERY_ONLY" } }],
      sessionSequence: [{ id: `recovery:${command.date}`, module: "RECOVERY", title: "Recovery command", estimatedMinutes: 20 }],
      recoveryDay: true,
      recoveryCommand: command
    };
    const activities = (day.activities || []).map((item) => adjustedActivity(item, command, day)).filter(Boolean);
    return { ...day, activities, sessionSequence: activities, recoveryCommand: command };
  }

  function calendarOverride(command = null, context = {}) {
    if (!commandApplies(command, context) || !["AMBER", "RED"].includes(command.posture)) return null;
    return {
      status: "RECOVERY_COMMAND",
      date: command.date,
      label: command.headline,
      detail: command.order,
      window: command.posture === "RED" ? "RECOVERY" : "CURRENT",
      sourceCommandId: command.id,
      futureWeekChanged: false,
      longRunTimeOpen: command.changes.some((item) => item.action === "PRESERVE_LONG_RUN")
    };
  }

  function applyToCommand(base = {}, command = null, context = {}) {
    if (!commandApplies(command, context)) return base;
    if (command.posture === "UNKNOWN") return {
      ...base,
      state: "ROLL_CALL_REQUIRED",
      stateLabel: "ROLL CALL",
      title: command.headline,
      detail: command.order,
      reason: command.difference,
      primary: command.action,
      recoveryCommand: command
    };
    if (command.posture === "RED") return {
      ...base,
      state: "RECOVERY_REQUIRED",
      stateLabel: "RED",
      title: command.headline,
      detail: command.order,
      reason: command.difference,
      duration: { minutes: 20, label: "20 min", open: false },
      primary: command.action,
      recoveryCommand: command
    };
    if (command.posture === "AMBER") return {
      ...base,
      state: "RECOVERY_ADJUSTED",
      stateLabel: "AMBER",
      title: command.headline,
      detail: command.order,
      reason: command.difference,
      primary: command.action,
      recoveryCommand: command
    };
    return { ...base, recoveryCommand: command };
  }

  function moduleState(command = null, domain = "training", base = {}) {
    if (!command) return base;
    const normalized = upper(domain);
    if (command.posture === "UNKNOWN" && normalized !== "RECOVERY" && normalized !== "NUTRITION") return { ...base, status: "ROLL CALL", executable: false, progressionAllowed: false, detail: command.order, action: command.action };
    if (command.posture === "RED") {
      if (["RECOVERY", "NUTRITION"].includes(normalized)) return { ...base, status: "PROTECT", executable: true, progressionAllowed: false, detail: command.order, action: command.action };
      return { ...base, status: "RECOVERY ONLY", executable: false, progressionAllowed: false, detail: command.order, action: command.action };
    }
    if (command.posture === "AMBER" && TRAINING_DOMAINS.has(normalized)) return { ...base, status: "ADJUSTED", executable: true, progressionAllowed: false, detail: command.order, action: command.action };
    return base;
  }

  function complete(command = {}, options = {}) {
    if (!command?.id || command.posture === "UNKNOWN") throw new Error("A current recovery order is required.");
    return { ...command, status: "COMPLETE", completedAt: options.completedAt || new Date().toISOString(), completionSource: options.source || "RECRUIT_CONFIRMED" };
  }

  function postureScore(value = "UNKNOWN") {
    return { UNKNOWN: -1, RED: 0, AMBER: 1, GREEN: 2 }[upper(value)] ?? -1;
  }

  function buildOutcome(command = {}, readinessHistory = [], options = {}) {
    if (!command?.id || !["AMBER", "RED"].includes(command.posture)) return null;
    const later = (Array.isArray(readinessHistory) ? readinessHistory : [])
      .filter((item) => dateIso(item?.date) && item.date > command.date)
      .sort((left, right) => String(left.date).localeCompare(String(right.date)))[0] || null;
    const id = `recovery-outcome:${command.id}`;
    if (command.status !== "COMPLETE") return { version: VERSION, id, type: "RECOVERY_OUTCOME", commandId: command.id, date: command.date, status: "WAITING", code: "ACTION_UNCONFIRMED", headline: "Recovery action not yet secured", lesson: "Complete the recovery order before Atlas judges it.", verified: false };
    if (!later) return { version: VERSION, id, type: "RECOVERY_OUTCOME", commandId: command.id, date: command.date, status: "WAITING", code: "NEXT_ROLL_CALL_REQUIRED", headline: "Outcome pending", lesson: "The next Roll Call will show whether the recovery order helped.", verified: false };
    const nextSignals = readinessSignals({ ...later, complete: true }, {});
    const nextPosture = postureFor({ ...later, complete: true }, nextSignals);
    const source = command.source?.readiness || {};
    const energyGain = number(later.energy) !== null && number(source.energy) !== null ? number(later.energy) - number(source.energy) : 0;
    const sorenessDrop = number(later.soreness) !== null && number(source.soreness) !== null ? number(source.soreness) - number(later.soreness) : 0;
    const improved = postureScore(nextPosture) > postureScore(command.posture) || energyGain >= 2 || sorenessDrop >= 2;
    const unresolved = later.pain === true || nextPosture === "RED";
    const code = unresolved ? "NOT_RESOLVED" : improved ? "HELPED" : "STABLE";
    const copy = code === "HELPED"
      ? { tone: "green", headline: "Recovery order helped", lesson: `Readiness improved from ${command.posture} to ${nextPosture}.` }
      : code === "NOT_RESOLVED"
        ? { tone: "red", headline: "Recovery signal remains", lesson: "Pain or RED readiness remains; do not restore loaded work automatically." }
        : { tone: "yellow", headline: "Recovery held the line", lesson: `Readiness remains ${nextPosture}; keep the next dose conservative.` };
    return {
      version: VERSION,
      id,
      type: "RECOVERY_OUTCOME",
      commandId: command.id,
      date: command.date,
      reviewDate: later.date,
      status: "READY",
      code,
      tone: copy.tone,
      headline: copy.headline,
      lesson: sentence(copy.lesson),
      sourcePosture: command.posture,
      nextPosture,
      verified: true,
      evaluatedAt: options.evaluatedAt || new Date().toISOString()
    };
  }

  function upsert(items = [], item = {}, limit = 180) {
    if (!item?.id) return Array.isArray(items) ? items : [];
    return [item, ...(Array.isArray(items) ? items : []).filter((saved) => saved?.id !== item.id)]
      .sort((left, right) => String(right.updatedAt || right.evaluatedAt || right.generatedAt || "").localeCompare(String(left.updatedAt || left.evaluatedAt || left.generatedAt || "")))
      .slice(0, limit);
  }

  return Object.freeze({
    VERSION,
    POSTURES: [...POSTURES],
    stableHash,
    readinessSignals,
    postureFor,
    buildCommand,
    commandApplies,
    applyToDay,
    calendarOverride,
    applyToCommand,
    moduleState,
    complete,
    buildOutcome,
    upsert
  });
});
