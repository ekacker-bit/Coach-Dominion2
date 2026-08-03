(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionPlanCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "022D.1";
  const DAY_MS = 86400000;
  const TERMINAL_STATES = Object.freeze(["HELD", "REJECTED", "RETAINED", "ROLLED_BACK"]);
  const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const dateOnly = (value) => String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || null;
  const shiftDate = (value, days) => {
    const date = dateOnly(value);
    return date ? new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10) : null;
  };
  const nextOperatingWeek = (value) => {
    const date = new Date(`${dateOnly(value) || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
    const days = ((8 - date.getUTCDay()) % 7) || 7;
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));
  const roundToTen = (value) => Math.round(Number(value || 0) / 10) * 10;

  function nutritionProposal(current = {}, context = {}) {
    if (!current?.recoveryTargets || !current?.trainingTargets) return null;
    const currentCalories = finite(current.recoveryTargets.calories);
    const currentCarbs = finite(current.recoveryTargets.carbs);
    if (!(currentCalories > 0) || !(currentCarbs > 0)) return null;
    const proposedCalories = Math.max(1200, roundToTen(currentCalories * 0.95));
    if (proposedCalories === currentCalories) return null;
    const energyDelta = proposedCalories - currentCalories;
    const trainingAdjustments = clone(current.trainingAdjustments || {});
    const recoveryTargets = {
      ...clone(current.recoveryTargets),
      calories: proposedCalories,
      carbs: Math.max(50, Math.round(currentCarbs + energyDelta / 4))
    };
    const trainingTargets = {
      ...clone(current.trainingTargets),
      calories: proposedCalories + Number(trainingAdjustments.calories || 0),
      protein: recoveryTargets.protein,
      carbs: recoveryTargets.carbs + Number(trainingAdjustments.carbs || 0),
      fat: recoveryTargets.fat
    };
    return {
      domain: "NUTRITION",
      lever: "ENERGY_TARGET",
      headline: "Reduce one fuel lever by 5%",
      detail: "Daily energy decreases by the smallest bounded step. Protein and every training plan stay unchanged.",
      currentPlan: clone(current),
      proposedPlan: {
        ...clone(current), id: `plan-command-nutrition:${context.reviewId || context.effectiveDate}`,
        status: "PROPOSED", effectiveDate: context.effectiveDate,
        recoveryTargets, trainingTargets, trainingAdjustments, sourceReviewId: context.reviewId || null
      },
      change: {
        label: `${Math.abs(energyDelta)} fewer kcal/day`, value: energyDelta, unit: "kcal/day",
        calendar: "Training days and session duration stay unchanged."
      },
      impact: { sessionsAffected: 0, weeklyMinutesDelta: 0, weeklyDistanceDelta: 0 }
    };
  }

  function strengthProposal(current = {}, context = {}) {
    if (current.status !== "APPROVED" || !Array.isArray(current.sessions) || !current.sessions.length) return null;
    let changedSets = 0;
    const sessions = current.sessions.map((session) => ({
      ...clone(session),
      exercises: (session.exercises || []).map((exercise) => {
        const sets = finite(exercise.recommendedSets);
        if (!(sets > 2)) return clone(exercise);
        changedSets += 1;
        return {
          ...clone(exercise),
          recommendedSets: sets - 1,
          plannedSets: finite(exercise.plannedSets) === null ? exercise.plannedSets : Math.max(2, Number(exercise.plannedSets) - 1),
          action: "VOLUME_CONSOLIDATED",
          rationale: "Progress Review reduced one work set while preserving load and exercise selection."
        };
      })
    }));
    if (!changedSets) return null;
    const sessionsAffected = Number(current.profile?.daysPerWeek || sessions.length || 0);
    return {
      domain: "STRENGTH", lever: "WORK_SETS", headline: "Consolidate one work set",
      detail: "One set comes off movements above two sets. Load, exercise selection, and training days stay fixed.",
      currentPlan: clone(current),
      proposedPlan: {
        ...clone(current), id: `${current.id || "strength-plan"}-r${Number(current.revision || 1) + 1}-${context.effectiveDate}`,
        status: "APPROVED", revision: Number(current.revision || 1) + 1,
        effectiveDate: context.effectiveDate, approvedAt: null, sessions, sourceReviewId: context.reviewId || null,
        adaptation: { code: "VOLUME_CONSOLIDATION", changedSets }
      },
      change: {
        label: `${changedSets} movement${changedSets === 1 ? "" : "s"} lose one set`, value: -changedSets,
        unit: "work sets", calendar: "Strength days stay fixed; planned weekly time decreases."
      },
      impact: { sessionsAffected, weeklyMinutesDelta: -Math.max(5, sessionsAffected * 8), weeklyDistanceDelta: 0 }
    };
  }

  function shiftedRunningWeeks(current = {}, effectiveDate) {
    return (current.weeks || []).map((week, weekIndex) => {
      const weekStart = shiftDate(effectiveDate, weekIndex * 7);
      const weekEnd = shiftDate(weekStart, 6);
      const sessions = (week.sessions || []).map((session) => {
        const dayIndex = Number.isInteger(Number(session.dayIndex))
          ? Number(session.dayIndex)
          : Math.max(0, Math.min(6, Math.round((new Date(`${session.date}T12:00:00Z`) - new Date(`${week.weekStart}T12:00:00Z`)) / DAY_MS)));
        if (session.type === "REST") return { ...clone(session), date: shiftDate(weekStart, dayIndex), dayIndex };
        const distance = round(Number(session.distance || 0) * 0.95, 1);
        return {
          ...clone(session), date: shiftDate(weekStart, dayIndex), dayIndex, distance,
          estimatedMinutes: Math.max(1, Math.round(Number(session.estimatedMinutes || 0) * 0.95)),
          durationCapMinutes: session.type === "LONG" ? null : session.durationCapMinutes,
          durationPolicy: session.type === "LONG" ? "UNCAPPED_BY_TIME" : session.durationPolicy
        };
      });
      return {
        ...clone(week), weekStart, weekEnd,
        weeklyDistance: round(Number(week.weeklyDistance || 0) * 0.95, 1), sessions
      };
    });
  }

  function runningProposal(current = {}, context = {}) {
    if (current.status !== "APPROVED" || !Array.isArray(current.weeks) || current.weeks.length !== 4) return null;
    const weeks = shiftedRunningWeeks(current, context.effectiveDate);
    const currentMinutes = (current.weeks[0]?.sessions || []).reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0);
    const proposedMinutes = (weeks[0]?.sessions || []).reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0);
    const currentDistance = Number(current.weeks[0]?.weeklyDistance || current.baselineDistance || 0);
    const proposedDistance = Number(weeks[0]?.weeklyDistance || 0);
    const revision = Number(current.revision || 1) + 1;
    return {
      domain: "RUNNING", lever: "WEEKLY_DISTANCE", headline: "Consolidate weekly distance by 5%",
      detail: "Run days and session types stay fixed. Distance eases for one cycle; long-run time remains uncapped.",
      currentPlan: clone(current),
      proposedPlan: {
        ...clone(current), id: `${current.id || "running-block"}-r${revision}-${context.effectiveDate}`,
        revision, status: "APPROVED", startDate: context.effectiveDate, endDate: shiftDate(context.effectiveDate, 27),
        effectiveDate: context.effectiveDate, approvedAt: null, supersedesId: current.id || null,
        baselineDistance: round(Number(current.baselineDistance || currentDistance) * 0.95, 1),
        weeks, sourceReviewId: context.reviewId || null
      },
      change: {
        label: `${round(proposedDistance - currentDistance, 1)} ${current.profile?.preferredUnit || "mi"}/week`,
        value: round(proposedDistance - currentDistance, 1), unit: `${current.profile?.preferredUnit || "mi"}/week`,
        calendar: "Run days and session types stay fixed; long-run time remains uncapped."
      },
      impact: {
        sessionsAffected: Number(current.profile?.runningDaysPerWeek || 0),
        weeklyMinutesDelta: proposedMinutes - currentMinutes,
        weeklyDistanceDelta: round(proposedDistance - currentDistance, 1)
      }
    };
  }

  function coreProposal(current = {}, context = {}) {
    if (current.status !== "APPROVED" || !Array.isArray(current.weeks) || current.weeks.length !== 4) return null;
    const currentMinutes = Number(current.profile?.sessionMinutes || 0);
    const proposedMinutes = currentMinutes > 10 ? Math.max(10, currentMinutes - 5) : currentMinutes;
    if (proposedMinutes === currentMinutes) return null;
    const weeks = (current.weeks || []).map((week) => ({
      ...clone(week),
      sessions: (week.sessions || []).map((session) => ({ ...clone(session), estimatedMinutes: proposedMinutes }))
    }));
    const sessionsAffected = Number(current.profile?.sessionsPerWeek || 0);
    return {
      domain: "CORE", lever: "SESSION_MINUTES", headline: "Shorten Core by five minutes",
      detail: "Core remains tertiary work on the same days while the session becomes easier to complete.",
      currentPlan: clone(current),
      proposedPlan: {
        ...clone(current), id: `${current.id || "core-plan"}-r${Number(current.revision || 1) + 1}-${context.effectiveDate}`,
        status: "APPROVED", revision: Number(current.revision || 1) + 1,
        effectiveDate: context.effectiveDate,
        approvedAt: null,
        profile: { ...clone(current.profile), sessionMinutes: proposedMinutes },
        weeks, sourceReviewId: context.reviewId || null
      },
      change: {
        label: `${proposedMinutes} minutes/session`, value: proposedMinutes - currentMinutes,
        unit: "minutes/session", calendar: "Core stays paired with its current Run or Strength window."
      },
      impact: {
        sessionsAffected,
        weeklyMinutesDelta: (proposedMinutes - currentMinutes) * sessionsAffected,
        weeklyDistanceDelta: 0
      }
    };
  }

  function proposalFor(domain, currentPlans = {}, context = {}) {
    if (domain === "NUTRITION") return nutritionProposal(currentPlans.nutrition, context);
    if (domain === "STRENGTH") return strengthProposal(currentPlans.strength, context);
    if (domain === "RUNNING") return runningProposal(currentPlans.running, context);
    if (domain === "CORE") return coreProposal(currentPlans.core, context);
    return null;
  }

  function refreshLifecycle(record = null, today) {
    if (!record) return null;
    const date = dateOnly(today) || new Date().toISOString().slice(0, 10);
    if (record.status === "SCHEDULED" && date >= record.effectiveDate) {
      return { ...record, status: record.appliedAt ? "OBSERVING" : "SCHEDULED" };
    }
    if (record.status === "OBSERVING" && date > record.observationEnd) return { ...record, status: "REVIEW_DUE" };
    return record;
  }

  function buildPlanCommand(input = {}) {
    const today = dateOnly(input.today) || new Date().toISOString().slice(0, 10);
    const review = input.review || {};
    const recommendation = review.recommendation || {};
    const prior = refreshLifecycle(input.priorCommand || null, today);
    if (prior?.sourceReviewId === review.id) return prior;
    if (review.status !== "CONFIRMED" || !recommendation.requiresPlanApproval) {
      return {
        version: VERSION, id: null, sourceReviewId: review.id || null, status: "WAITING",
        domain: recommendation.domain || null, headline: "No plan decision is waiting",
        detail: "Confirm a Progress Review recommendation before Atlas drafts a plan change.",
        plansChanged: false
      };
    }
    const domain = String(recommendation.domain || "").toUpperCase();
    const effectiveDate = nextOperatingWeek(today);
    const proposal = proposalFor(domain, input.currentPlans || {}, { effectiveDate, reviewId: review.id });
    if (!proposal) {
      return {
        version: VERSION, id: `plan-command:${review.id}:${domain || "unknown"}`,
        sourceReviewId: review.id, status: "BLOCKED", domain,
        headline: `${domain || "Module"} plan needs attention`,
        detail: `An approved ${domain ? domain.toLowerCase() : "module"} plan is required before Atlas can compare one bounded change.`,
        approvalBlocked: true, plansChanged: false,
        generatedAt: input.generatedAt || new Date().toISOString()
      };
    }
    return {
      version: VERSION, id: `plan-command:${review.id}:${domain}`, sourceReviewId: review.id,
      sourceReviewDate: review.sourceLatestDate || null, status: "DRAFT", domain,
      lever: proposal.lever, headline: proposal.headline, detail: proposal.detail,
      currentPlan: proposal.currentPlan, proposedPlan: proposal.proposedPlan,
      change: proposal.change, impact: proposal.impact,
      effectiveDate, observationEnd: shiftDate(effectiveDate, 13),
      approvalBlocked: false, generatedAt: input.generatedAt || new Date().toISOString(),
      plansChanged: false
    };
  }

  function withCalendarPreview(command = {}, preview = {}) {
    if (command.status !== "DRAFT") return command;
    const blockers = Number(preview.blockingConflictCount || 0);
    return {
      ...command,
      calendarPreview: clone(preview),
      approvalBlocked: Boolean(preview.approvalBlocked) || blockers > 0,
      blockerCount: blockers
    };
  }

  function resolvePlanCommand(command = {}, action, options = {}) {
    if (command.status !== "DRAFT") throw new Error("No plan command is awaiting a decision.");
    if (!["APPROVE", "HOLD", "REJECT"].includes(action)) throw new Error("Approve, hold, or reject the proposed change.");
    if (action === "APPROVE" && command.approvalBlocked) throw new Error("Resolve the calendar blockers before approving this change.");
    const now = options.resolvedAt || new Date().toISOString();
    if (action === "APPROVE") {
      return { ...command, status: "SCHEDULED", decision: action, approvedAt: now, approvedBy: options.userId || null, plansChanged: false };
    }
    if (action === "HOLD") return { ...command, status: "HELD", decision: action, resolvedAt: now, plansChanged: false };
    return { ...command, status: "REJECTED", decision: action, resolvedAt: now, rejectionReason: options.reason || null, plansChanged: false };
  }

  function markApplied(command = {}, options = {}) {
    if (!["SCHEDULED", "OBSERVING"].includes(command.status)) throw new Error("Only an approved plan command can become active.");
    const appliedAt = options.appliedAt || new Date().toISOString();
    if (dateOnly(appliedAt) < command.effectiveDate) throw new Error("The approved effective date has not arrived.");
    return {
      ...command, status: "OBSERVING", appliedAt,
      appliedPlanId: options.planId || command.proposedPlan?.id || null,
      appliedCalendarId: options.calendarId || command.calendarPreview?.id || null,
      plansChanged: true
    };
  }

  function completeObservation(command = {}, action, options = {}) {
    if (!["SCHEDULED", "OBSERVING", "REVIEW_DUE"].includes(command.status)) throw new Error("No approved plan command can be closed.");
    if (!["RETAIN", "ROLLBACK"].includes(action)) throw new Error("Retain or roll back the observed change.");
    const closedAt = options.closedAt || new Date().toISOString();
    if (action === "RETAIN") {
      return { ...command, status: "RETAINED", observationDecision: action, closedAt, plansChanged: true };
    }
    return {
      ...command, status: "ROLLED_BACK", observationDecision: action, closedAt,
      rollbackPlanId: options.planId || command.currentPlan?.id || null,
      rollbackCalendarId: options.calendarId || null, plansChanged: false
    };
  }

  return Object.freeze({
    VERSION, TERMINAL_STATES, dateOnly, shiftDate, nextOperatingWeek,
    nutritionProposal, strengthProposal, runningProposal, coreProposal, proposalFor,
    refreshLifecycle, buildPlanCommand, withCalendarPreview, resolvePlanCommand,
    markApplied, completeObservation
  });
});
