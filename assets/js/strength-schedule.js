(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionStrengthSchedule = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "017E.1";
  const DAY_LABELS = Object.freeze(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
  const DEFAULT_DAYS = Object.freeze({
    2: Object.freeze([1, 4]),
    3: Object.freeze([0, 2, 4]),
    4: Object.freeze([0, 1, 3, 5]),
    5: Object.freeze([0, 1, 2, 4, 5]),
    6: Object.freeze([0, 1, 2, 3, 4, 5])
  });
  const HARD_RUN_TYPES = Object.freeze(["TEMPO", "INTERVAL", "LONG"]);
  const TERMINAL_STATES = Object.freeze(["COMPLETE", "PARTIAL", "STOPPED"]);

  function dateIso(value) {
    const text = String(value || "");
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function addDays(date, offset) {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
  }

  function weekStartIso(value) {
    const date = new Date(`${dateIso(value) || new Date().toISOString().slice(0, 10)}T00:00:00Z`);
    const day = date.getUTCDay();
    date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
    return date.toISOString().slice(0, 10);
  }

  function dayOffset(weekStart, date) {
    const start = Date.parse(`${weekStart}T00:00:00Z`);
    const target = Date.parse(`${date}T00:00:00Z`);
    return Math.round((target - start) / 86400000);
  }

  function normalizePreferredDays(daysPerWeek, preferred = []) {
    const count = Math.max(2, Math.min(6, Number(daysPerWeek || 3)));
    const normalized = [...new Set((preferred || []).map(Number).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6))].sort((a, b) => a - b);
    return normalized.length === count ? normalized : [...DEFAULT_DAYS[count]];
  }

  function operatingWeekStart(today, preferredDays, sessionCount, requestedWeekStart = null) {
    if (dateIso(requestedWeekStart)) return weekStartIso(requestedWeekStart);
    const currentWeek = weekStartIso(today);
    const todayIndex = dayOffset(currentWeek, dateIso(today) || currentWeek);
    const remaining = preferredDays.filter((item) => item >= todayIndex).length;
    return remaining >= sessionCount ? currentWeek : addDays(currentWeek, 7);
  }

  function sessionDate(item = {}) {
    return dateIso(item.date || item.scheduledDate || item.scheduled_date || item.sessionDate || item.session_date);
  }

  function sessionCollection(plan = {}) {
    if (!plan || typeof plan !== "object") return [];
    if (Array.isArray(plan.sessions)) return plan.sessions;
    if (Array.isArray(plan.weeks)) return plan.weeks.flatMap((week) => week?.sessions || []);
    if (plan.plan && typeof plan.plan === "object") return sessionCollection(plan.plan);
    if (plan.weeklyPlan && typeof plan.weeklyPlan === "object") return sessionCollection(plan.weeklyPlan);
    if (plan.approvedPlan && typeof plan.approvedPlan === "object") return sessionCollection(plan.approvedPlan);
    return [];
  }

  function runningSessions(plan = {}) {
    const source = plan?.plan || plan?.weeklyPlan || plan?.approvedPlan || plan;
    if (!["READY", "APPROVED"].includes(String(source?.status || plan?.status || "").toUpperCase())) return [];
    return sessionCollection(source)
      .map((item) => ({
        ...item,
        date: sessionDate(item),
        type: String(item.type || item.sessionType || item.session_type || "EASY").toUpperCase()
      }))
      .filter((item) => item.date);
  }

  function coreSessions(plan = {}) {
    const source = plan?.plan || plan?.approvedPlan || plan;
    if (String(source?.status || plan?.status || "").toUpperCase() !== "APPROVED") return [];
    return sessionCollection(source)
      .map((item) => ({ ...item, date: sessionDate(item) }))
      .filter((item) => item.date);
  }

  function contextForDate(date, context = {}) {
    const run = runningSessions(context.runningPlan).find((item) => item.date === date) || null;
    const core = coreSessions(context.corePlan).find((item) => item.date === date) || null;
    return {
      run,
      core,
      hardRun: Boolean(run && HARD_RUN_TYPES.includes(run.type)),
      easyRun: Boolean(run && run.type !== "REST" && !HARD_RUN_TYPES.includes(run.type)),
      runLabel: run && run.type !== "REST" ? `${run.type} run` : null,
      coreLabel: core ? core.title || "Core session" : null
    };
  }

  function terminalHistory(history = [], planId) {
    return (history || []).filter((item) => item?.planId === planId && TERMINAL_STATES.includes(item.state));
  }

  function placementScore(index, requestedIndex, placedIndexes, weekStart, context) {
    const day = contextForDate(addDays(weekStart, index), context);
    const previous = contextForDate(addDays(weekStart, index - 1), context);
    const next = contextForDate(addDays(weekStart, index + 1), context);
    let score = Math.abs(index - requestedIndex) * 10;
    if (day.hardRun) score += 1000;
    if (previous.hardRun || next.hardRun) score += 40;
    if (day.easyRun) score += 24;
    if (day.core) score += 80;
    if (previous.core || next.core) score += 8;
    if (placedIndexes.some((placed) => Math.abs(placed - index) === 1)) score += 20;
    return score;
  }

  function choosePlacements(sessionCount, preferredDays, weekStart, context) {
    const placed = [];
    for (let position = 0; position < sessionCount; position += 1) {
      const requested = preferredDays[position];
      const remaining = sessionCount - position - 1;
      const minimum = placed.length ? placed[placed.length - 1] + 1 : 0;
      const maximum = 6 - remaining;
      const candidates = Array.from({ length: Math.max(0, maximum - minimum + 1) }, (_, index) => minimum + index)
        .sort((left, right) => {
          const scoreDifference = placementScore(left, requested, placed, weekStart, context) - placementScore(right, requested, placed, weekStart, context);
          return scoreDifference || left - right;
        });
      placed.push(candidates[0]);
    }
    return placed;
  }

  function assignmentState(assignment, history = [], today = new Date().toISOString().slice(0, 10)) {
    const result = (history || []).find((item) => item.planId === assignment.planId && item.sessionId === assignment.sessionId && item.date === assignment.date && TERMINAL_STATES.includes(item.state));
    if (result) return result.state;
    if (assignment.date < today) return "MISSED";
    if (assignment.date === today) return "TODAY";
    return "UPCOMING";
  }

  function assignmentConflicts(assignment, context = {}) {
    const day = contextForDate(assignment.date, context);
    const conflicts = [];
    if (day.hardRun) conflicts.push({ code: "HARD_RUN_COLLISION", severity: "BLOCKING", detail: `${day.run.type} running and strength are both scheduled.` });
    if (day.core) conflicts.push({ code: "CORE_COMBINED", severity: "ADVISORY", detail: `${day.coreLabel} is deliberately combined because no cleaner recovery slot was available; complete strength first and keep core controlled.` });
    if (day.easyRun) conflicts.push({ code: "EASY_RUN_COMBINED", severity: "ADVISORY", detail: `${day.runLabel} is also scheduled; keep the run easy and separate sessions when practical.` });
    const previous = contextForDate(addDays(assignment.date, -1), context);
    const next = contextForDate(addDays(assignment.date, 1), context);
    if (previous.hardRun || next.hardRun) conflicts.push({ code: "ADJACENT_HARD_RUN", severity: "ADVISORY", detail: "A hard run is scheduled on an adjacent day; readiness governs execution." });
    return conflicts;
  }

  function scheduleDays(schedule = {}, context = {}, history = [], today = new Date().toISOString().slice(0, 10)) {
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(schedule.weekStart, dayIndex);
      const assignment = (schedule.assignments || []).find((item) => item.date === date) || null;
      const dayContext = contextForDate(date, context);
      return {
        date,
        dayIndex,
        dayLabel: DAY_LABELS[dayIndex],
        assignment: assignment ? {
          ...assignment,
          state: assignmentState(assignment, history, today),
          conflicts: assignmentConflicts(assignment, context)
        } : null,
        run: dayContext.run,
        core: dayContext.core,
        load: dayContext.hardRun || assignment ? "TRAINING" : dayContext.core ? "CORE" : "RECOVERY"
      };
    });
  }

  function buildWeeklySchedule(plan = {}, history = [], context = {}, options = {}) {
    if (plan.status !== "APPROVED" || !Array.isArray(plan.sessions) || !plan.sessions.length) {
      return { version: VERSION, status: "PLAN_REQUIRED", assignments: [], days: [], message: "Approve a strength program before scheduling the week." };
    }
    const sessionCount = Math.max(2, Math.min(6, Number(plan.profile?.daysPerWeek || plan.sessions.length)));
    const preferredDays = normalizePreferredDays(sessionCount, options.preferredDays);
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const weekStart = operatingWeekStart(today, preferredDays, sessionCount, options.weekStart);
    const placements = choosePlacements(sessionCount, preferredDays, weekStart, context);
    const completedCount = new Set(terminalHistory(history, plan.id).map((item) => `${item.date || "undated"}:${item.sessionId || item.id}`)).size;
    const assignments = placements.map((dayIndex, index) => {
      const session = plan.sessions[(completedCount + index) % plan.sessions.length];
      const requestedDayIndex = preferredDays[index];
      const date = addDays(weekStart, dayIndex);
      return {
        id: `${plan.id}:${weekStart}:${session.id}`,
        planId: plan.id,
        planRevision: Number(plan.revision || 1),
        sessionId: session.id,
        sessionName: session.name,
        sequence: index + 1,
        requestedDayIndex,
        originalDate: date,
        date,
        placement: dayIndex === requestedDayIndex ? "PREFERRED" : "COORDINATED",
        placementReason: dayIndex === requestedDayIndex
          ? "Placed on the preferred training day."
          : "Shifted to reduce collision with running, core, or adjacent strength work."
      };
    });
    const blockingConflicts = assignments.flatMap((item) => assignmentConflicts(item, context)).filter((item) => item.severity === "BLOCKING");
    const schedule = {
      version: VERSION,
      id: `strength-week:${plan.id}:${weekStart}`,
      status: "DRAFT",
      planId: plan.id,
      planRevision: Number(plan.revision || 1),
      revision: 1,
      weekStart,
      weekEnd: addDays(weekStart, 6),
      preferredDays,
      createdAt: options.createdAt || new Date().toISOString(),
      assignments,
      approvalBlocked: blockingConflicts.length > 0,
      blockingConflictCount: blockingConflicts.length,
      safeguards: [
        "Hard running and strength sessions are not approved on the same day.",
        "Core and easy running are separated from strength when recovery space exists.",
        "Missed strength work is rescheduled deliberately; it is never counted as complete.",
        "Readiness and pain may remove work but never add compensatory volume.",
        "Running and core plans remain unchanged."
      ]
    };
    return {
      ...schedule,
      days: scheduleDays(schedule, context, history, today),
      message: schedule.approvalBlocked
        ? "Resolve the hard-session collision before approval."
        : "The seven-day strength queue is coordinated and ready for approval."
    };
  }

  function approveSchedule(schedule = {}, approvedAt = new Date().toISOString()) {
    if (schedule.status !== "DRAFT" || !Array.isArray(schedule.assignments) || !schedule.assignments.length) throw new Error("A complete schedule draft is required.");
    if (schedule.approvalBlocked) throw new Error("Resolve blocking schedule conflicts before approval.");
    return JSON.parse(JSON.stringify({ ...schedule, status: "APPROVED", approvedAt }));
  }

  function availableMoveDates(schedule = {}, assignmentId, context = {}, today = new Date().toISOString().slice(0, 10)) {
    const occupied = new Set((schedule.assignments || []).filter((item) => item.id !== assignmentId).map((item) => item.date));
    return Array.from({ length: 7 }, (_, index) => addDays(schedule.weekStart, index))
      .filter((date) => date >= today && !occupied.has(date) && !contextForDate(date, context).hardRun);
  }

  function moveAssignment(schedule = {}, assignmentId, newDate, context = {}, options = {}) {
    if (schedule.status !== "APPROVED") return { valid: false, schedule, message: "Approve the weekly schedule before rescheduling a session." };
    const date = dateIso(newDate);
    const assignment = (schedule.assignments || []).find((item) => item.id === assignmentId);
    if (!assignment || !date) return { valid: false, schedule, message: "Select a valid strength session and destination date." };
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    if (assignmentState(assignment, options.history || [], today) === "COMPLETE") return { valid: false, schedule, message: "Completed sessions cannot be moved." };
    if (!availableMoveDates(schedule, assignmentId, context, today).includes(date)) {
      return { valid: false, schedule, message: "Choose an open future day without a hard running session." };
    }
    const changedAt = options.changedAt || new Date().toISOString();
    const assignments = schedule.assignments.map((item) => item.id === assignmentId ? {
      ...item,
      date,
      originalDate: item.originalDate || item.date,
      placement: "RESCHEDULED",
      placementReason: options.reason || "Moved deliberately in Weekly Strength Command.",
      rescheduledAt: changedAt
    } : item).sort((left, right) => left.date.localeCompare(right.date) || left.sequence - right.sequence);
    const next = {
      ...schedule,
      revision: Number(schedule.revision || 1) + 1,
      assignments,
      updatedAt: changedAt,
      lastReschedule: { assignmentId, from: assignment.date, to: date, at: changedAt }
    };
    return {
      valid: true,
      schedule: {
        ...next,
        days: scheduleDays(next, context, options.history || [], today)
      },
      message: `${assignment.sessionName} moved from ${assignment.date} to ${date}. No completion credit was created.`
    };
  }

  function assignmentForDate(schedule = {}, date) {
    if (schedule.status !== "APPROVED") return null;
    return (schedule.assignments || []).find((item) => item.date === date) || null;
  }

  function scheduleSummary(schedule = {}, history = [], today = new Date().toISOString().slice(0, 10)) {
    const counts = {};
    (schedule.assignments || []).forEach((item) => {
      const state = assignmentState(item, history, today);
      counts[state] = Number(counts[state] || 0) + 1;
    });
    return {
      scheduled: (schedule.assignments || []).length,
      completed: Number(counts.COMPLETE || 0),
      partial: Number(counts.PARTIAL || 0),
      missed: Number(counts.MISSED || 0),
      upcoming: Number(counts.UPCOMING || 0) + Number(counts.TODAY || 0),
      counts
    };
  }

  return Object.freeze({
    VERSION,
    DAY_LABELS,
    DEFAULT_DAYS,
    HARD_RUN_TYPES,
    addDays,
    weekStartIso,
    normalizePreferredDays,
    contextForDate,
    assignmentState,
    assignmentConflicts,
    scheduleDays,
    buildWeeklySchedule,
    approveSchedule,
    availableMoveDates,
    moveAssignment,
    assignmentForDate,
    scheduleSummary
  });
});
