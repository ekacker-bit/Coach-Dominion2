(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionFastingExecution = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "023D.1";
  const FINAL_STATES = new Set(["COMPLETED", "ENDED EARLY", "OVERRIDDEN", "PAUSED"]);
  const PROTOCOL_ORDER = ["OFF", "12_12", "14_10", "16_8"];

  function clean(value) {
    return String(value || "").trim();
  }

  function asDate(value, fallback = new Date()) {
    const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value || fallback);
    return Number.isNaN(parsed.getTime()) ? new Date(fallback) : parsed;
  }

  function isoDate(value) {
    const parsed = asDate(value);
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }

  function clockParts(value, fallback = "10:00") {
    const match = clean(value || fallback).match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return clockParts(fallback, "10:00");
    return { hour: Math.max(0, Math.min(23, Number(match[1]))), minute: Math.max(0, Math.min(59, Number(match[2]))) };
  }

  function nextClock(nowValue, clockValue) {
    const now = asDate(nowValue);
    const parts = clockParts(clockValue);
    const result = new Date(now.getTime());
    result.setHours(parts.hour, parts.minute, 0, 0);
    if (result.getTime() <= now.getTime()) result.setDate(result.getDate() + 1);
    return result;
  }

  function minutesBetween(start, end) {
    return Math.max(0, Math.round((asDate(end).getTime() - asDate(start).getTime()) / 60000));
  }

  function durationLabel(totalMinutes) {
    const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return `${remainder}m`;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }

  function countdownLabel(totalMinutes) {
    const minutes = Math.max(0, Math.ceil(Number(totalMinutes) || 0));
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }

  function recordId(now) {
    const stamp = asDate(now);
    return `fast-${isoDate(stamp)}-${stamp.getTime()}`;
  }

  function startFast(input = {}, options = {}) {
    const protocol = input.protocol || {};
    if (!protocol.enabled || protocol.status !== "APPROVED") throw new Error("Approve a fasting protocol before starting the clock.");
    if (input.active?.status === "ACTIVE") throw new Error("A fast is already active.");
    const now = asDate(options.now);
    const expectedEnd = nextClock(now, protocol.eatingStart || "10:00");
    return {
      version: VERSION,
      id: recordId(now),
      status: "ACTIVE",
      protected: false,
      protocol: protocol.protocol,
      protocolLabel: protocol.label,
      protocolRevision: Number(protocol.revision || 0),
      targetPolicy: protocol.targetPolicy || "APPROVED DAILY TARGETS UNCHANGED",
      startedAt: now.toISOString(),
      expectedEndAt: expectedEnd.toISOString(),
      plannedMinutes: minutesBetween(now, expectedEnd),
      date: isoDate(expectedEnd),
      closeout: null,
      updatedAt: now.toISOString()
    };
  }

  function finishFast(execution, options = {}) {
    if (!execution || execution.status !== "ACTIVE") throw new Error("No active fast is available to close.");
    const now = asDate(options.now);
    const reason = clean(options.reason || "COMPLETE").toUpperCase();
    const status = reason === "TRAINING" ? "OVERRIDDEN" : reason === "PAUSE" || reason === "SAFETY" ? "PAUSED" : now.getTime() + 60000 < asDate(execution.expectedEndAt).getTime() ? "ENDED EARLY" : "COMPLETED";
    const protectedRecord = ["OVERRIDDEN", "PAUSED", "ENDED EARLY"].includes(status);
    return {
      ...execution,
      version: VERSION,
      status,
      protected: protectedRecord,
      outcomeReason: reason,
      outcomeDetail: clean(options.detail) || (status === "OVERRIDDEN" ? "Training fuel overrode the fasting clock." : status === "PAUSED" ? "The fast was paused without penalty." : status === "ENDED EARLY" ? "The fast ended early without penalty." : "The planned fast was completed."),
      endedAt: now.toISOString(),
      actualMinutes: minutesBetween(execution.startedAt, now),
      updatedAt: now.toISOString()
    };
  }

  function protectDay(input = {}, options = {}) {
    const protocol = input.protocol || {};
    if (!protocol.enabled || protocol.status !== "APPROVED") throw new Error("No active fasting protocol needs an override.");
    const active = input.active?.status === "ACTIVE" ? input.active : startFast({ protocol }, options);
    return finishFast(active, {
      now: options.now,
      reason: options.reason === "TRAINING" ? "TRAINING" : "PAUSE",
      detail: options.detail
    });
  }

  function rating(value, label, optional = false) {
    if (optional && (value === "" || value === null || value === undefined)) return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 5) throw new Error(`${label} must be rated from 1 to 5.`);
    return number;
  }

  function attachCloseout(execution, input = {}, options = {}) {
    if (!execution || !FINAL_STATES.has(execution.status)) throw new Error("Finish or pause the fast before recording the daily check-in.");
    const symptoms = clean(input.symptoms || "NONE").toUpperCase();
    const allowed = ["NONE", "DIZZINESS", "SHAKING", "NAUSEA", "HEADACHE", "OTHER"];
    if (!allowed.includes(symptoms)) throw new Error("Choose the symptom response that best fits the day.");
    const now = asDate(options.now);
    return {
      ...execution,
      closeout: {
        hunger: rating(input.hunger, "Hunger"),
        energy: rating(input.energy, "Energy"),
        trainingQuality: rating(input.trainingQuality, "Training quality", true),
        symptoms,
        note: clean(input.note).slice(0, 280),
        recordedAt: now.toISOString()
      },
      updatedAt: now.toISOString()
    };
  }

  function normalizeHistory(history = []) {
    const unique = new Map();
    (Array.isArray(history) ? history : []).forEach((item) => {
      if (!item?.id || !FINAL_STATES.has(item.status)) return;
      const current = unique.get(item.id);
      if (!current || clean(item.updatedAt) > clean(current.updatedAt)) unique.set(item.id, { ...item });
    });
    return [...unique.values()].sort((left, right) => clean(right.endedAt || right.startedAt).localeCompare(clean(left.endedAt || left.startedAt)));
  }

  function mergeRecord(history, record, limit = 90) {
    return normalizeHistory([record, ...(Array.isArray(history) ? history : [])]).slice(0, limit);
  }

  function liveCommand(input = {}) {
    const context = input.context || {};
    const active = input.active?.status === "ACTIVE" ? input.active : null;
    const now = asDate(input.now);
    if (!context.enabled || context.status === "OFF") {
      return { version: VERSION, visible: false, status: "OFF", headline: "Fasting is off", detail: "Use normal meal timing and the approved daily targets.", primaryAction: null, secondaryActions: [] };
    }
    if (context.suspended || context.status === "SUSPENDED TODAY") {
      return { version: VERSION, visible: true, status: "SUSPENDED TODAY", tone: "protected", headline: "Fuel the assignment", detail: context.detail, countdown: null, primaryAction: null, secondaryActions: [], protected: true };
    }
    if (active) {
      const remaining = Math.max(0, Math.ceil((asDate(active.expectedEndAt).getTime() - now.getTime()) / 60000));
      return {
        version: VERSION,
        visible: true,
        status: remaining ? "FAST ACTIVE" : "READY TO END",
        tone: remaining ? "active" : "ready",
        headline: remaining ? "Hold the window" : "Eating window is ready",
        detail: remaining ? `${durationLabel(minutesBetween(active.startedAt, now))} complete. Hydration, symptoms, medication, and training fuel still override.` : "End the fast and open the approved eating window.",
        countdown: countdownLabel(remaining),
        countdownLabel: remaining ? "UNTIL EATING WINDOW" : "WINDOW READY",
        elapsedMinutes: minutesBetween(active.startedAt, now),
        remainingMinutes: remaining,
        primaryAction: { id: "END_FAST", label: remaining ? "End fast" : "Open eating window" },
        secondaryActions: [{ id: "TRAINING_OVERRIDE", label: "Fuel training" }, { id: "PAUSE_TODAY", label: "Pause today" }]
      };
    }
    if (context.status === "FAST ACTIVE") {
      return {
        version: VERSION,
        visible: true,
        status: "FAST PLANNED",
        tone: "planned",
        headline: "Start the fasting clock",
        detail: `The planned eating window opens at ${context.eatingStart || "the approved time"}. Start only if you feel well and no training fuel is due.`,
        countdown: null,
        primaryAction: { id: "START_FAST", label: "Start fast" },
        secondaryActions: [{ id: "TRAINING_OVERRIDE", label: "Fuel training" }, { id: "PAUSE_TODAY", label: "Pause today" }]
      };
    }
    return {
      version: VERSION,
      visible: true,
      status: "EATING WINDOW OPEN",
      tone: "open",
      headline: "Complete today's Fuel targets",
      detail: `${context.windowLabel || "The approved eating window"} is open. Start the next fast when the window closes or when you finish eating.`,
      countdown: null,
      primaryAction: { id: "START_FAST", label: "Start next fast" },
      secondaryActions: [{ id: "PAUSE_TODAY", label: "Pause today" }]
    };
  }

  function average(values) {
    const numbers = values.filter((value) => Number.isFinite(Number(value))).map(Number);
    return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
  }

  function adjacentProtocol(protocol, delta) {
    const index = Math.max(0, PROTOCOL_ORDER.indexOf(clean(protocol).toUpperCase()));
    return PROTOCOL_ORDER[Math.max(0, Math.min(PROTOCOL_ORDER.length - 1, index + delta))];
  }

  function weeklyVerdict(input = {}) {
    const protocol = input.protocol || null;
    if (!protocol?.enabled || protocol.status !== "APPROVED") {
      return { version: VERSION, status: "OFF", verdict: "OFF", evidenceDays: 0, headline: "No active fasting protocol", detail: "Activate a protocol only if it fits the Recruit Contract and safety screen.", suggestedProtocol: "OFF", requiresApproval: false };
    }
    const history = normalizeHistory(input.history).slice(0, 7);
    const evidence = history.filter((item) => item.closeout);
    const protectedDays = history.filter((item) => item.protected).length;
    const eligible = history.filter((item) => !item.protected);
    const completed = eligible.filter((item) => item.status === "COMPLETED").length;
    const adherence = eligible.length ? completed / eligible.length : null;
    const hunger = average(evidence.map((item) => item.closeout?.hunger));
    const energy = average(evidence.map((item) => item.closeout?.energy));
    const trainingQuality = average(evidence.map((item) => item.closeout?.trainingQuality));
    const symptomDays = evidence.filter((item) => item.closeout?.symptoms && item.closeout.symptoms !== "NONE").length;
    const base = { version: VERSION, evidenceDays: evidence.length, protectedDays, eligibleDays: eligible.length, completedDays: completed, adherence, averages: { hunger, energy, trainingQuality }, symptomDays, requiresApproval: true, currentProtocol: protocol.protocol };
    if (evidence.length < 3) {
      return { ...base, status: "LEARNING", verdict: "LEARNING", headline: "Keep gathering honest evidence", detail: `${evidence.length} of 3 minimum daily check-ins captured. Overrides remain protected, not failed.`, suggestedProtocol: protocol.protocol, requiresApproval: false };
    }
    if (symptomDays > 0) {
      return { ...base, status: "ACTION REQUIRED", verdict: "PAUSE", headline: "Pause the fasting protocol", detail: "Symptoms were reported. Return to normal meal timing and seek qualified guidance before resuming.", suggestedProtocol: "OFF" };
    }
    if ((energy !== null && energy <= 2.5) || (trainingQuality !== null && trainingQuality <= 2.5) || (hunger !== null && hunger >= 4.5)) {
      return { ...base, status: "ADJUST", verdict: "SHORTEN", headline: "Shorten the fasting window", detail: "Energy, training quality, or hunger indicates that the current window is too aggressive.", suggestedProtocol: adjacentProtocol(protocol.protocol, -1) };
    }
    if (evidence.length >= 7 && adherence !== null && adherence >= 0.85 && energy >= 4 && (trainingQuality === null || trainingQuality >= 4) && hunger <= 3 && protocol.protocol !== "16_8") {
      return { ...base, status: "OPTIONAL", verdict: "WIDEN", headline: "A wider window may be tolerable", detail: "Seven strong check-ins support reviewing the next protocol. This is optional and requires the full safety review.", suggestedProtocol: adjacentProtocol(protocol.protocol, 1) };
    }
    return { ...base, status: "HOLD", verdict: "MAINTAIN", headline: "Maintain the current protocol", detail: "Available evidence does not justify a change. Keep the approved window and continue reporting honestly.", suggestedProtocol: protocol.protocol };
  }

  return Object.freeze({
    VERSION,
    FINAL_STATES,
    PROTOCOL_ORDER: [...PROTOCOL_ORDER],
    startFast,
    finishFast,
    protectDay,
    attachCloseout,
    mergeRecord,
    normalizeHistory,
    liveCommand,
    weeklyVerdict,
    durationLabel,
    countdownLabel,
    nextClock
  });
}));
