(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionStrengthWeekReview = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "017D.1";
  const TERMINAL_STATES = Object.freeze(["COMPLETE", "PARTIAL", "STOPPED", "MISSED"]);
  const NATIVE_TERMINAL_STATES = Object.freeze(["COMPLETE", "PARTIAL", "STOPPED"]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function dateIso(value) {
    const text = String(value || "");
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function addDays(value, offset) {
    const date = new Date(`${dateIso(value)}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  function normalizeExerciseName(value) {
    return String(value || "").toLowerCase()
      .replace(/\b(barbell|dumbbell|machine|cable|weighted)\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function exerciseMatches(left, right) {
    const a = normalizeExerciseName(left);
    const b = normalizeExerciseName(right);
    return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
  }

  function sessionForAssignment(plan = {}, assignment = {}) {
    return (plan.sessions || []).find((item) => item.id === assignment.sessionId) || null;
  }

  function exerciseId(exercise = {}) {
    return exercise.exerciseCode || exercise.id || normalizeExerciseName(exercise.exerciseName || exercise.name);
  }

  function exerciseName(exercise = {}) {
    return exercise.exerciseName || exercise.name || exercise.exerciseCode || exercise.id || "Unknown exercise";
  }

  function plannedSets(session = {}) {
    return (session.exercises || []).reduce((sum, exercise) => sum + Number(exercise.recommendedSets || exercise.sets || 0), 0);
  }

  function flattenSetLogs(execution = {}) {
    return Object.values(execution.setLogs || {}).flatMap((logs) => Array.isArray(logs) ? logs : []);
  }

  function averageRpe(logs = []) {
    const values = logs.map((item) => Number(item.rpe)).filter((value) => Number.isFinite(value));
    if (!values.length) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10;
  }

  function nativeEvidence(assignment = {}, session = {}, history = []) {
    const candidates = (history || []).filter((item) =>
      item?.planId === assignment.planId
      && item?.sessionId === assignment.sessionId
      && item?.date === assignment.date
      && NATIVE_TERMINAL_STATES.includes(item.state)
    ).sort((left, right) => String(right.completedAt || right.updatedAt || "").localeCompare(String(left.completedAt || left.updatedAt || "")));
    const execution = candidates[0];
    if (!execution) return null;
    const logs = flattenSetLogs(execution);
    const completedExerciseCodes = (session.exercises || []).filter((exercise) => {
      const id = exerciseId(exercise);
      return Number((execution.setLogs?.[id] || []).length) > 0;
    }).map(exerciseId);
    return {
      source: "NATIVE",
      sourceLabel: "Coach Dominion workout",
      sourceIds: [execution.id].filter(Boolean),
      state: execution.state,
      confidence: "CONFIRMED",
      completedSets: Number(execution.summary?.setsCompleted ?? logs.length),
      prescribedSets: Number(execution.summary?.setsPlanned ?? plannedSets(session)),
      volume: Number(execution.summary?.volume || 0),
      averageRpe: averageRpe(logs),
      rpeSampleCount: logs.filter((item) => Number.isFinite(Number(item.rpe))).length,
      painReported: Boolean(execution.painReported),
      substitutions: Number(execution.summary?.substitutions ?? Object.keys(execution.substitutions || {}).length),
      skippedExercises: Number(execution.summary?.skippedExercises ?? Object.keys(execution.skipped || {}).length),
      completedExerciseCodes,
      completedAt: execution.completedAt || execution.updatedAt || null,
      reason: execution.reason || null
    };
  }

  function scoreFitbodSession(session = {}, plannedSession = {}) {
    const completed = Array.isArray(session.exercises) ? session.exercises : [];
    const matches = (plannedSession.exercises || []).map((target) => {
      const found = completed.find((item) => exerciseMatches(item.name || item.code, exerciseName(target)));
      const targetSets = Number(target.recommendedSets || target.sets || 0);
      return {
        exerciseCode: exerciseId(target),
        exerciseName: exerciseName(target),
        targetSets,
        completedSets: Number(found?.sets || 0),
        completedExercise: found || null,
        setComplete: Boolean(found) && (!targetSets || Number(found.sets || 0) >= targetSets)
      };
    });
    const matched = matches.filter((item) => item.completedExercise);
    const matchedCodes = new Set(matched.map((item) => item.completedExercise.code));
    const completedSets = matched.reduce((sum, item) => sum + item.completedSets, 0);
    const prescribedSetCount = matches.reduce((sum, item) => sum + item.targetSets, 0);
    const substitutions = completed.filter((item) => !matchedCodes.has(item.code));
    let state = null;
    if (matches.length && matched.length === matches.length && matches.every((item) => item.setComplete)) state = "COMPLETE";
    else if (matched.length) state = "PARTIAL";
    return {
      session,
      state,
      matches,
      matchedExercises: matched.length,
      plannedExercises: matches.length,
      completedSets,
      prescribedSets: prescribedSetCount,
      substitutions,
      score: matched.length * 1000 + Math.min(completedSets, prescribedSetCount || completedSets)
    };
  }

  function fitbodEvidence(assignment = {}, plannedSession = {}, sessions = []) {
    const candidates = (sessions || []).filter((item) => item?.date === assignment.date)
      .map((item) => scoreFitbodSession(item, plannedSession))
      .sort((left, right) => right.score - left.score || String(left.session.id || "").localeCompare(String(right.session.id || "")));
    if (!candidates.length) return null;
    const best = candidates[0];
    const ambiguous = best.score > 0 && candidates.slice(1).some((item) => item.score === best.score);
    const recordIds = (best.session.records || []).map((item) => item.providerRecordId || item.id).filter(Boolean);
    const base = {
      source: "FITBOD",
      sourceLabel: best.session.workoutName || "Fitbod workout",
      sourceIds: recordIds.length ? recordIds : [best.session.id].filter(Boolean),
      sessionId: best.session.id || null,
      confidence: ambiguous ? "AMBIGUOUS" : best.state === "COMPLETE" ? "HIGH" : best.state === "PARTIAL" ? "MEDIUM" : "LOW",
      completedSets: best.completedSets,
      prescribedSets: best.prescribedSets,
      volume: best.matches.reduce((sum, item) => sum + Number(item.completedExercise?.volume || 0), 0),
      averageRpe: null,
      rpeSampleCount: 0,
      painReported: false,
      substitutions: best.substitutions.length,
      skippedExercises: Math.max(0, best.plannedExercises - best.matchedExercises),
      completedExerciseCodes: best.matches.filter((item) => item.completedExercise).map((item) => item.exerciseCode),
      matchedExercises: best.matchedExercises,
      plannedExercises: best.plannedExercises,
      candidateCount: candidates.length,
      ambiguous
    };
    if (ambiguous) return { ...base, state: null, evidenceStatus: "AMBIGUOUS_IMPORT" };
    if (!best.state) return { ...base, state: null, evidenceStatus: "UNMATCHED_IMPORT" };
    return { ...base, state: best.state, evidenceStatus: "IMPORTED_MATCH" };
  }

  function reconcileAssignment(assignment = {}, plan = {}, history = [], fitbodSessions = [], today = new Date().toISOString().slice(0, 10)) {
    const session = sessionForAssignment(plan, assignment) || { exercises: [] };
    const native = nativeEvidence(assignment, session, history);
    const imported = fitbodEvidence(assignment, session, fitbodSessions);
    let state;
    let primaryEvidence = null;
    let evidenceStatus = "NO_EVIDENCE";
    if (native) {
      state = native.state;
      primaryEvidence = native;
      evidenceStatus = imported?.state ? "NATIVE_WITH_IMPORT_CORROBORATION" : "NATIVE_CONFIRMED";
    } else if (imported?.state) {
      state = imported.state;
      primaryEvidence = imported;
      evidenceStatus = imported.evidenceStatus;
    } else if (assignment.date < today) {
      state = "MISSED";
      evidenceStatus = imported?.evidenceStatus || "NO_EVIDENCE";
    } else {
      state = assignment.date === today ? "TODAY" : "UPCOMING";
      evidenceStatus = imported?.evidenceStatus || "NO_EVIDENCE";
    }
    return {
      assignmentId: assignment.id,
      planId: assignment.planId,
      sessionId: assignment.sessionId,
      sessionName: assignment.sessionName,
      date: assignment.date,
      state,
      evidenceStatus,
      creditSource: primaryEvidence?.source || "NONE",
      primaryEvidence,
      importedEvidence: imported,
      prescribedSets: plannedSets(session),
      plannedExerciseCount: (session.exercises || []).length,
      plannedPatterns: [...new Set((session.exercises || []).map((item) => item.pattern).filter(Boolean))]
    };
  }

  function aggregateAssignments(assignments = []) {
    const counts = {};
    assignments.forEach((item) => { counts[item.state] = Number(counts[item.state] || 0) + 1; });
    const scheduled = assignments.length;
    const sessionCredits = Number(counts.COMPLETE || 0) + Number(counts.PARTIAL || 0) * 0.5;
    const evidence = assignments.map((item) => item.primaryEvidence).filter(Boolean);
    const rpeValues = evidence.flatMap((item) => item.averageRpe === null ? [] : Array.from({ length: Math.max(1, item.rpeSampleCount || 1) }, () => item.averageRpe));
    const plannedPatternSet = new Set(assignments.flatMap((item) => item.plannedPatterns || []));
    const completedPatternSet = new Set(assignments.filter((item) => ["COMPLETE", "PARTIAL"].includes(item.state)).flatMap((item) => {
      const codes = new Set(item.primaryEvidence?.completedExerciseCodes || []);
      return (item.plannedPatterns || []).filter(Boolean).concat(codes.size ? [] : []);
    }));
    const setsPrescribed = assignments.reduce((sum, item) => sum + Number(item.prescribedSets || 0), 0);
    const setsCompleted = evidence.reduce((sum, item) => sum + Number(item.completedSets || 0), 0);
    return {
      scheduled,
      completed: Number(counts.COMPLETE || 0),
      partial: Number(counts.PARTIAL || 0),
      stopped: Number(counts.STOPPED || 0),
      missed: Number(counts.MISSED || 0),
      upcoming: Number(counts.UPCOMING || 0) + Number(counts.TODAY || 0),
      adherencePercent: scheduled ? Math.round(sessionCredits / scheduled * 100) : 0,
      setsCompleted,
      setsPrescribed,
      setCompletionPercent: setsPrescribed ? Math.min(100, Math.round(setsCompleted / setsPrescribed * 100)) : 0,
      volume: Math.round(evidence.reduce((sum, item) => sum + Number(item.volume || 0), 0)),
      averageRpe: rpeValues.length ? Math.round(rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length * 10) / 10 : null,
      rpeSampleCount: evidence.reduce((sum, item) => sum + Number(item.rpeSampleCount || 0), 0),
      painCount: evidence.filter((item) => item.painReported).length,
      substitutions: evidence.reduce((sum, item) => sum + Number(item.substitutions || 0), 0),
      skippedExercises: evidence.reduce((sum, item) => sum + Number(item.skippedExercises || 0), 0),
      nativeSessionCount: evidence.filter((item) => item.source === "NATIVE").length,
      importedSessionCount: evidence.filter((item) => item.source === "FITBOD").length,
      unmatchedImportCount: assignments.filter((item) => ["AMBIGUOUS_IMPORT", "UNMATCHED_IMPORT"].includes(item.evidenceStatus)).length,
      movementCoverage: { completed: completedPatternSet.size, planned: plannedPatternSet.size },
      counts
    };
  }

  function recommendationFor(summary = {}, finalizable = false) {
    if (!finalizable) {
      return {
        code: "KEEP_RECORDING",
        label: "Keep recording",
        tone: "neutral",
        detail: "The strength week is still active. Finish scheduled work or let each training day resolve before closing the week."
      };
    }
    if (summary.painCount || summary.stopped) {
      return {
        code: "SAFETY_HOLD",
        label: "Safety hold",
        tone: "red",
        detail: "Pain or a stopped session blocks progression. Draft the next week only after readiness and exercise selection are reviewed."
      };
    }
    if (summary.adherencePercent < 50) {
      return {
        code: "REPEAT_FOUNDATION",
        label: "Repeat foundation",
        tone: "yellow",
        detail: "Repeat the approved program structure. Improve schedule fit before considering progression."
      };
    }
    if (!summary.rpeSampleCount) {
      return {
        code: "REPEAT_WITH_EVIDENCE",
        label: "Repeat + capture RPE",
        tone: "yellow",
        detail: "Keep the approved structure and capture exertion next week. Imported completion alone does not justify a load increase."
      };
    }
    if (summary.adherencePercent >= 90 && summary.averageRpe <= 8 && summary.nativeSessionCount >= 2) {
      return {
        code: "PROGRESSION_REVIEW",
        label: "Progression review",
        tone: "green",
        detail: "Execution quality supports reviewing the existing bounded exercise-level adjustment. No load change is applied automatically."
      };
    }
    if (summary.adherencePercent >= 75 && summary.averageRpe <= 8.5) {
      return {
        code: "CONTINUE",
        label: "Continue",
        tone: "green",
        detail: "Continue the approved program structure. Preserve current loads unless the separate exercise-level review earns a change."
      };
    }
    return {
      code: "REPEAT_WEEK",
      label: "Repeat week",
      tone: "yellow",
      detail: "Repeat the approved structure and close the execution gaps before progression."
    };
  }

  function buildWeekReview(schedule = {}, plan = {}, history = [], fitbodSessions = [], options = {}) {
    if (schedule.status !== "APPROVED" || !Array.isArray(schedule.assignments) || !schedule.assignments.length) {
      return {
        version: VERSION,
        status: "SCHEDULE_REQUIRED",
        finalizable: false,
        assignments: [],
        summary: aggregateAssignments([]),
        recommendation: recommendationFor({}, false),
        message: "Approve a weekly strength schedule before reconciling the week."
      };
    }
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const assignments = schedule.assignments.map((item) => reconcileAssignment(item, plan, history, fitbodSessions, today));
    const allResolved = assignments.every((item) => TERMINAL_STATES.includes(item.state));
    const finalizable = today > schedule.weekEnd || allResolved;
    const summary = aggregateAssignments(assignments);
    return {
      version: VERSION,
      id: `strength-review:${schedule.id}`,
      status: finalizable ? "READY" : "IN_PROGRESS",
      scheduleId: schedule.id,
      scheduleRevision: Number(schedule.revision || 1),
      planId: schedule.planId,
      planRevision: Number(schedule.planRevision || plan.revision || 1),
      weekStart: schedule.weekStart,
      weekEnd: schedule.weekEnd,
      today,
      generatedAt: options.generatedAt || new Date().toISOString(),
      finalizable,
      allResolved,
      assignments,
      summary,
      recommendation: recommendationFor(summary, finalizable),
      safeguards: [
        "Native Coach Dominion workout logs are authoritative when native and imported evidence overlap.",
        "Ambiguous or unmatched Fitbod sessions remain visible but receive no completion credit.",
        "Finalizing a review never edits the approved strength program or its workout history.",
        "Rollover creates a draft only; the next week still requires explicit approval."
      ]
    };
  }

  function finalizeWeekReview(review = {}, finalizedAt = new Date().toISOString()) {
    if (review.status === "FINALIZED") return clone(review);
    if (!review.finalizable || !review.scheduleId || !Array.isArray(review.assignments)) {
      throw new Error("The strength week cannot be finalized until every assignment resolves or the week ends.");
    }
    return clone({
      ...review,
      status: "FINALIZED",
      finalizedAt,
      immutableEvidence: true
    });
  }

  function rolloverIntent(review = {}) {
    if (review.status !== "FINALIZED") throw new Error("Finalize the strength week before drafting the rollover.");
    return {
      sourceReviewId: review.id,
      sourceScheduleId: review.scheduleId,
      weekStart: addDays(review.weekStart, 7),
      recommendationCode: review.recommendation?.code || "REPEAT_WEEK"
    };
  }

  return Object.freeze({
    VERSION,
    TERMINAL_STATES,
    normalizeExerciseName,
    exerciseMatches,
    plannedSets,
    nativeEvidence,
    scoreFitbodSession,
    fitbodEvidence,
    reconcileAssignment,
    aggregateAssignments,
    recommendationFor,
    buildWeekReview,
    finalizeWeekReview,
    rolloverIntent
  });
});
