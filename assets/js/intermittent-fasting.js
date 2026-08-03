(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionIntermittentFasting = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "023D.1";
  const PROTOCOLS = {
    OFF: { label: "Off", fastHours: 0, eatingHours: 24 },
    "12_12": { label: "12:12", fastHours: 12, eatingHours: 12 },
    "14_10": { label: "14:10", fastHours: 14, eatingHours: 10 },
    "16_8": { label: "16:8", fastHours: 16, eatingHours: 8 }
  };

  function clean(value) {
    return String(value || "").trim();
  }

  function dateIso(value) {
    const result = clean(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(result) ? result : null;
  }

  function timeMinutes(value, fallback = 600) {
    const match = clean(value).match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return fallback;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? hour * 60 + minute : fallback;
  }

  function timeLabel(value) {
    const minutes = ((Number(value) % 1440) + 1440) % 1440;
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
  }

  function clockValue(value) {
    const minutes = ((Number(value) % 1440) + 1440) % 1440;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }

  function inWindow(nowMinutes, startMinutes, endMinutes) {
    if (startMinutes === endMinutes) return true;
    if (endMinutes > startMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }

  function protocolDefinition(value) {
    return PROTOCOLS[clean(value).toUpperCase()] || PROTOCOLS.OFF;
  }

  function reviewFastingProtocol(input = {}, options = {}) {
    const protocol = PROTOCOLS[clean(input.protocol).toUpperCase()] ? clean(input.protocol).toUpperCase() : "OFF";
    const definition = protocolDefinition(protocol);
    const age = Number(options.age ?? input.age);
    const startMinutes = timeMinutes(input.eatingStart, 600);
    const endMinutes = (startMinutes + definition.eatingHours * 60) % 1440;
    const enabled = protocol !== "OFF";
    const blockers = [];

    if (enabled && (!Number.isFinite(age) || age < 18)) blockers.push("Fasting requires an adult age in the Recruit Contract.");
    if (enabled && input.notPregnantOrBreastfeeding !== true) blockers.push("Do not activate during pregnancy or breastfeeding.");
    if (enabled && input.noEatingDisorderHistory !== true) blockers.push("A history of disordered eating requires qualified clinical guidance.");
    if (enabled && input.medicalClearanceConfirmed !== true) blockers.push("Diabetes, glucose-lowering medicine, or medicine that requires food needs clinician guidance before fasting.");
    if (enabled && input.trainingOverrideAccepted !== true) blockers.push("Training fuel, hydration, recovery, and safety must override the fasting clock.");

    return {
      version: VERSION,
      status: blockers.length ? "REVIEW REQUIRED" : "READY FOR APPROVAL",
      enabled,
      protocol,
      label: definition.label,
      fastHours: definition.fastHours,
      eatingHours: definition.eatingHours,
      eatingStart: clockValue(startMinutes),
      eatingEnd: clockValue(endMinutes),
      windowLabel: enabled ? `${timeLabel(startMinutes)}–${timeLabel(endMinutes)}` : "No fasting window",
      effectiveDate: dateIso(input.effectiveDate) || dateIso(options.today) || new Date().toISOString().slice(0, 10),
      targetPolicy: "APPROVED DAILY TARGETS UNCHANGED",
      blockers,
      screeningVersion: "023C-SAFETY-1",
      eligibilityConfirmed: enabled,
      trainingOverrideAccepted: input.trainingOverrideAccepted === true
    };
  }

  function approveFastingProtocol(proposal, previous = null, now = new Date().toISOString()) {
    if (!proposal || proposal.status !== "READY FOR APPROVAL") throw new Error("Review and clear the fasting protocol before activation.");
    return {
      version: VERSION,
      status: proposal.enabled ? "APPROVED" : "OFF",
      enabled: proposal.enabled,
      protocol: proposal.protocol,
      label: proposal.label,
      fastHours: proposal.fastHours,
      eatingHours: proposal.eatingHours,
      eatingStart: proposal.eatingStart,
      eatingEnd: proposal.eatingEnd,
      windowLabel: proposal.windowLabel,
      effectiveDate: proposal.effectiveDate,
      targetPolicy: proposal.targetPolicy,
      screeningVersion: proposal.screeningVersion,
      eligibilityConfirmed: proposal.enabled,
      trainingOverrideAccepted: proposal.trainingOverrideAccepted,
      revision: Math.max(0, Number(previous?.revision || 0)) + 1,
      approvedAt: now
    };
  }

  function alignWindow(protocol, calendarContext = {}) {
    const definition = protocolDefinition(protocol.protocol);
    let start = timeMinutes(protocol.eatingStart, 600);
    if (calendarContext.mealWindow === "MORNING") start = Math.min(start, 420);
    if (calendarContext.mealWindow === "EVENING") start = Math.max(start, 1260 - definition.eatingHours * 60);
    return {
      start,
      end: (start + definition.eatingHours * 60) % 1440,
      adjusted: start !== timeMinutes(protocol.eatingStart, 600)
    };
  }

  function dailyFastingContext(input = {}) {
    const protocol = input.protocol || null;
    const calendar = input.calendarContext || {};
    const date = dateIso(input.date) || new Date().toISOString().slice(0, 10);
    if (!protocol?.enabled || protocol.status !== "APPROVED" || date < protocol.effectiveDate) {
      return {
        version: VERSION,
        enabled: false,
        status: "OFF",
        headline: date < clean(protocol?.effectiveDate) ? `Fasting begins ${protocol.effectiveDate}` : "Fasting is off",
        detail: "Use the approved daily targets and normal meal timing.",
        targetPolicy: "APPROVED DAILY TARGETS UNCHANGED",
        mealWindow: null,
        safeguards: []
      };
    }

    const safetyHold = input.pain === true || clean(input.readiness).toUpperCase() === "RED";
    const trainingOverride = calendar.splitDay === true || calendar.longRun === true;
    if (safetyHold || trainingOverride) {
      const reason = safetyHold
        ? "Readiness or pain requires normal recovery fueling."
        : calendar.longRun
          ? "Long-run fuel and hydration override the fasting clock."
          : "Two-a-Day fuel and between-session recovery override the fasting clock.";
      return {
        version: VERSION,
        enabled: true,
        status: "SUSPENDED TODAY",
        suspended: true,
        headline: "Fasting paused · fuel the assignment",
        detail: reason,
        targetPolicy: protocol.targetPolicy,
        mealWindow: null,
        windowLabel: protocol.windowLabel,
        safeguards: ["No missed-fast penalty applies.", "Resume only on the next eligible day; do not compensate with restriction."]
      };
    }

    const aligned = alignWindow(protocol, calendar);
    const now = input.now instanceof Date ? input.now : new Date(input.now || Date.now());
    const nowMinutes = Number.isNaN(now.getTime()) ? 720 : now.getHours() * 60 + now.getMinutes();
    const open = inWindow(nowMinutes, aligned.start, aligned.end);
    const trainingDay = calendar.trainingDay === true;
    const windowLabel = `${timeLabel(aligned.start)}–${timeLabel(aligned.end)}`;
    return {
      version: VERSION,
      enabled: true,
      status: open ? "EATING WINDOW OPEN" : "FAST ACTIVE",
      suspended: false,
      open,
      headline: open ? `Eating window open · closes ${timeLabel(aligned.end)}` : `Fast active · eat at ${timeLabel(aligned.start)}`,
      detail: aligned.adjusted
        ? `The ${protocol.label} window moved around today's training assignment. Daily targets remain unchanged.`
        : `Follow the approved ${protocol.label} window. Water and normal non-caloric hydration remain available.`,
      protocol: protocol.protocol,
      label: protocol.label,
      eatingStart: clockValue(aligned.start),
      eatingEnd: clockValue(aligned.end),
      windowLabel,
      adjustedForTraining: aligned.adjusted,
      targetPolicy: protocol.targetPolicy,
      mealWindow: trainingDay ? "FASTING_TRAINING" : "FASTING_RECOVERY",
      safeguards: [
        "Fasting changes meal timing, never approved calories or macros.",
        "Training fuel, hydration, recovery, symptoms, and prescribed medication override the fasting clock.",
        "Do not compensate for a shortened or missed fast."
      ]
    };
  }

  return {
    VERSION,
    PROTOCOLS,
    reviewFastingProtocol,
    approveFastingProtocol,
    dailyFastingContext,
    timeMinutes,
    timeLabel,
    inWindow
  };
}));
