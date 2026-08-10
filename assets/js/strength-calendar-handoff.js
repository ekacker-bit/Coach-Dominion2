(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DominionStrengthCalendarHandoff = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025K.1";
  const PROTECTED_EXECUTION_STATES = Object.freeze([
    "IN_PROGRESS", "PAUSED", "REVIEW", "COMPLETE", "PARTIAL", "STOPPED", "PAIN_HOLD"
  ]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function planStructure(plan = {}) {
    const structure = clone(plan || {});
    [
      "version", "revision", "adjustedAt", "lastAdjustmentId", "lastAdjustmentActivation",
      "lastCalendarHandoff", "rolledBackAdjustmentId"
    ].forEach((key) => delete structure[key]);
    (structure.sessions || []).forEach((session) => {
      (session.exercises || []).forEach((exercise) => {
        ["recommendedLoad", "unit", "action", "rationale"].forEach((key) => delete exercise[key]);
      });
    });
    return structure;
  }

  function classifyPlanChange(previousPlan = {}, nextPlan = {}) {
    if (!previousPlan?.id || previousPlan.id !== nextPlan?.id) {
      return { code: "STRUCTURAL_REVIEW", loadOnly: false, requiresReview: true, reason: "The approved program identity changed." };
    }
    if (Number(nextPlan.revision || 0) <= Number(previousPlan.revision || 0)) {
      return { code: "NO_NEW_REVISION", loadOnly: false, requiresReview: false, reason: "No newer plan revision is available." };
    }
    if (JSON.stringify(planStructure(previousPlan)) !== JSON.stringify(planStructure(nextPlan))) {
      return { code: "STRUCTURAL_REVIEW", loadOnly: false, requiresReview: true, reason: "Session structure changed, so the calendar needs explicit review." };
    }
    return { code: "LOAD_ONLY", loadOnly: true, requiresReview: false, reason: "Only approved exercise targets changed; dates and session structure can remain fixed." };
  }

  function protectedDatesForExecution(execution = {}, today = "") {
    const state = String(execution?.state || "").toUpperCase();
    const date = String(execution?.date || today || "").slice(0, 10);
    return date && PROTECTED_EXECUTION_STATES.includes(state) ? [date] : [];
  }

  function rebindCommittedWeek(week = {}, previousPlan = {}, nextPlan = {}, options = {}) {
    const change = classifyPlanChange(previousPlan, nextPlan);
    if (change.requiresReview) return { status: "REVIEW_REQUIRED", change, week: clone(week), changedAssignments: [], protectedAssignments: [] };
    if (!change.loadOnly || !week?.id || !Array.isArray(week.days) || ["REPLACED", "COMPLETED"].includes(String(week.status || "").toUpperCase())) {
      return { status: "UNCHANGED", change, week: clone(week), changedAssignments: [], protectedAssignments: [] };
    }

    const today = String(options.today || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const reconciledAt = options.reconciledAt || new Date().toISOString();
    const protectedDates = new Set((options.protectedDates || []).map((item) => String(item).slice(0, 10)));
    const changedAssignments = [];
    const protectedAssignments = [];
    const days = clone(week.days).map((day) => ({
      ...day,
      activities: (day.activities || []).map((activity) => {
        const matching = String(activity.module || "").toUpperCase() === "STRENGTH"
          && activity.planId === previousPlan.id
          && Number(activity.planRevision || 0) < Number(nextPlan.revision || 0);
        if (!matching) return activity;
        const protectedAssignment = String(day.date || "") < today || protectedDates.has(String(day.date || ""));
        const summary = { id: activity.id, sessionId: activity.sourceId || null, title: activity.title, date: day.date, priorPlanRevision: Number(activity.planRevision || 0) };
        if (protectedAssignment) {
          protectedAssignments.push(summary);
          return activity;
        }
        changedAssignments.push({ ...summary, planRevision: Number(nextPlan.revision || 0) });
        return {
          ...activity,
          planRevision: Number(nextPlan.revision || 0),
          revisionSource: "EARNED_PROGRESSION",
          reconciledAt
        };
      })
    }));

    if (!changedAssignments.length) {
      return { status: "UNCHANGED", change, week: clone(week), changedAssignments, protectedAssignments };
    }

    const priorRevision = Number(week.revision || 1);
    const revision = priorRevision + 1;
    const receiptId = `strength-calendar:${week.id}:plan-r${Number(nextPlan.revision || 0)}`;
    const receipt = {
      version: VERSION,
      id: receiptId,
      type: "STRENGTH_CALENDAR_HANDOFF",
      status: "REBOUND",
      reconciledAt,
      weekStart: week.weekStart,
      priorWeekId: week.id,
      priorWeekRevision: priorRevision,
      calendarRevision: revision,
      planId: nextPlan.id,
      priorPlanRevision: Number(previousPlan.revision || 0),
      planRevision: Number(nextPlan.revision || 0),
      changedAssignmentCount: changedAssignments.length,
      protectedAssignmentCount: protectedAssignments.length,
      changedDates: [...new Set(changedAssignments.map((item) => item.date))],
      datesUnchanged: true
    };
    return {
      status: "REBOUND",
      change,
      changedAssignments,
      protectedAssignments,
      receipt,
      week: {
        ...clone(week),
        id: `${week.id}:plan-r${Number(nextPlan.revision || 0)}:calendar-r${revision}`,
        status: "COMMITTED",
        state: "COMMITTED",
        revision,
        approvedAt: reconciledAt,
        supersedesId: week.id,
        days,
        sourceRefs: {
          ...(week.sourceRefs || {}),
          strengthPlanId: nextPlan.id,
          strengthPlanRevision: Number(nextPlan.revision || 0)
        },
        calendarReconciliation: receipt
      }
    };
  }

  function reconcileCommittedWeeks(history = [], previousPlan = {}, nextPlan = {}, options = {}) {
    const change = classifyPlanChange(previousPlan, nextPlan);
    if (change.requiresReview) {
      return {
        status: "REVIEW_REQUIRED",
        change,
        replacements: [],
        receipt: {
          version: VERSION,
          type: "STRENGTH_CALENDAR_HANDOFF",
          status: "REVIEW_REQUIRED",
          planId: nextPlan?.id || null,
          priorPlanRevision: Number(previousPlan?.revision || 0),
          planRevision: Number(nextPlan?.revision || 0),
          changedAssignmentCount: 0,
          protectedAssignmentCount: 0,
          datesUnchanged: true,
          detail: change.reason
        }
      };
    }

    const activeWeeks = (history || []).filter((week) => week?.status !== "REPLACED");
    const results = activeWeeks.map((week) => rebindCommittedWeek(week, previousPlan, nextPlan, options));
    const replacements = results.filter((item) => item.status === "REBOUND").map((item) => item.week);
    const changedAssignmentCount = results.reduce((sum, item) => sum + item.changedAssignments.length, 0);
    const protectedAssignmentCount = results.reduce((sum, item) => sum + item.protectedAssignments.length, 0);
    const changedDates = [...new Set(results.flatMap((item) => item.changedAssignments.map((assignment) => assignment.date)))].sort();
    const reconciledAt = options.reconciledAt || new Date().toISOString();
    const status = replacements.length ? "REBOUND" : "NO_FUTURE_ASSIGNMENTS";
    return {
      status,
      change,
      replacements,
      receipt: {
        version: VERSION,
        id: `strength-calendar-handoff:${nextPlan.id}:r${Number(nextPlan.revision || 0)}`,
        type: "STRENGTH_CALENDAR_HANDOFF",
        status,
        reconciledAt,
        planId: nextPlan.id,
        priorPlanRevision: Number(previousPlan.revision || 0),
        planRevision: Number(nextPlan.revision || 0),
        changedAssignmentCount,
        protectedAssignmentCount,
        changedDates,
        weekStarts: replacements.map((week) => week.weekStart),
        calendarRevisions: replacements.map((week) => ({ weekStart: week.weekStart, revision: week.revision })),
        datesUnchanged: true,
        detail: replacements.length
          ? `Future Strength assignments now use Plan R${Number(nextPlan.revision || 0)}. Dates and training windows did not move.`
          : `Plan R${Number(nextPlan.revision || 0)} is active. The next calendar built will use it.`
      }
    };
  }

  function rebindActiveBlock(block = {}, previousPlan = {}, nextPlan = {}, options = {}) {
    const change = classifyPlanChange(previousPlan, nextPlan);
    if (!change.loadOnly || block?.status !== "ACTIVE" || block.planId !== previousPlan.id) {
      return { status: change.requiresReview ? "REVIEW_REQUIRED" : "UNCHANGED", change, block: clone(block) };
    }
    if (Number(block.planRevision || 0) >= Number(nextPlan.revision || 0)) return { status: "UNCHANGED", change, block: clone(block) };
    const reboundAt = options.reconciledAt || new Date().toISOString();
    const revision = Number(block.revision || 1) + 1;
    return {
      status: "REBOUND",
      change,
      block: {
        ...clone(block),
        id: `${block.id}:plan-r${Number(nextPlan.revision || 0)}:block-r${revision}`,
        revision,
        planRevision: Number(nextPlan.revision || 0),
        activatedPlanRevision: Number(nextPlan.revision || 0),
        sourceBlockId: block.id,
        reboundAt,
        planRevisionHistory: [
          ...(block.planRevisionHistory || []),
          { planRevision: Number(block.planRevision || previousPlan.revision || 0), blockRevision: Number(block.revision || 1), endedAt: reboundAt }
        ]
      }
    };
  }

  function rebindApprovedSchedule(schedule = {}, previousPlan = {}, nextPlan = {}, options = {}) {
    const change = classifyPlanChange(previousPlan, nextPlan);
    if (!change.loadOnly || schedule?.status !== "APPROVED" || schedule.planId !== previousPlan.id) {
      return { status: change.requiresReview ? "REVIEW_REQUIRED" : "UNCHANGED", change, schedule: clone(schedule), changedAssignments: [] };
    }
    const today = String(options.today || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const protectedDates = new Set((options.protectedDates || []).map((item) => String(item).slice(0, 10)));
    const reconciledAt = options.reconciledAt || new Date().toISOString();
    const changedAssignments = [];
    const assignments = (schedule.assignments || []).map((assignment) => {
      const shouldChange = assignment.date >= today && !protectedDates.has(assignment.date)
        && Number(assignment.planRevision || schedule.planRevision || 0) < Number(nextPlan.revision || 0);
      if (!shouldChange) return clone(assignment);
      changedAssignments.push(assignment.id);
      return { ...clone(assignment), planRevision: Number(nextPlan.revision || 0), revisionSource: "EARNED_PROGRESSION", reconciledAt };
    });
    if (!changedAssignments.length && Number(schedule.planRevision || 0) >= Number(nextPlan.revision || 0)) {
      return { status: "UNCHANGED", change, schedule: clone(schedule), changedAssignments };
    }
    const revision = Number(schedule.revision || 1) + 1;
    return {
      status: "REBOUND",
      change,
      changedAssignments,
      schedule: {
        ...clone(schedule),
        id: `${schedule.id}:plan-r${Number(nextPlan.revision || 0)}:schedule-r${revision}`,
        revision,
        planRevision: Number(nextPlan.revision || 0),
        assignments,
        supersedesId: schedule.id,
        reconciledAt
      }
    };
  }

  return Object.freeze({
    VERSION,
    PROTECTED_EXECUTION_STATES,
    planStructure,
    classifyPlanChange,
    protectedDatesForExecution,
    rebindCommittedWeek,
    reconcileCommittedWeeks,
    rebindActiveBlock,
    rebindApprovedSchedule
  });
});
