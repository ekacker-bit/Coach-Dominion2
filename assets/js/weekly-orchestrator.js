(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionWeeklyOrchestrator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "019G.2";
  const DAY_LABELS = Object.freeze(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
  const HARD_RUN_TYPES = Object.freeze(["INTERVAL", "TEMPO", "LONG"]);
  const TWO_A_DAY_TARGET_MINUTES = 121;
  const TWO_A_DAY_MAX_MINUTES = 240;

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function addDays(date, amount) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + Number(amount || 0));
    return value.toISOString().slice(0, 10);
  }

  function weekStartIso(value) {
    const candidate = dateIso(value) || new Date().toISOString().slice(0, 10);
    const date = new Date(`${candidate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  }

  function planningDateForWeek(value, todayValue = null) {
    const weekStart = weekStartIso(value);
    const weekEnd = addDays(weekStart, 6);
    const today = dateIso(todayValue) || new Date().toISOString().slice(0, 10);
    return today >= weekStart && today <= weekEnd ? today : weekStart;
  }

  function stableSerialize(value) {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function fingerprint(value) {
    const text = stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `uw-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function contractDays(contract = {}, weekStart) {
    const schedule = Array.isArray(contract.schedule) ? contract.schedule : [];
    return DAY_LABELS.map((weekday, dayIndex) => {
      const source = schedule[dayIndex] || {};
      return {
        weekday,
        dayIndex,
        date: addDays(weekStart, dayIndex),
        isTrainingDay: source.isTrainingDay !== false && !source.isRecoveryDay,
        isRecoveryDay: Boolean(source.isRecoveryDay) || source.isTrainingDay === false,
        committedActivities: Array.isArray(source.activities) ? source.activities.map((item) => String(item).toUpperCase()) : []
      };
    });
  }

  function planSessions(plan = {}) {
    if (!plan || typeof plan !== "object") return [];
    if (Array.isArray(plan.sessions)) return plan.sessions;
    if (Array.isArray(plan.weeks)) return plan.weeks.flatMap((week) => week?.sessions || []);
    if (plan.plan) return planSessions(plan.plan);
    return [];
  }

  function sessionsForWeek(plan = {}, weekStart) {
    const weekEnd = addDays(weekStart, 6);
    return planSessions(plan)
      .map((session) => ({ ...session, date: dateIso(session.date || session.scheduledDate || session.scheduled_date) }))
      .filter((session) => session.date && session.date >= weekStart && session.date <= weekEnd);
  }

  function runningSessions(block = {}, weekStart) {
    if (String(block?.status || "").toUpperCase() !== "APPROVED") return [];
    const week = (block.weeks || []).find((item) => item.weekStart === weekStart || (weekStart >= item.weekStart && weekStart <= item.weekEnd));
    return (week?.sessions || [])
      .map((session) => ({ ...session, date: dateIso(session.date) }))
      .filter((session) => session.date && String(session.type || "").toUpperCase() !== "REST");
  }

  function committedCount(contract, module) {
    if (module === "STRENGTH") return Number(contract.strengthDaysPerWeek || 0);
    if (module === "RUNNING") return Number(contract.runningDaysPerWeek || 0);
    if (module === "CORE") return Number(contract.coreDaysPerWeek || 0);
    return 0;
  }

  function conflict(code, severity, detail, date = null, module = null) {
    return { code, severity, detail, date, module };
  }

  function activity(module, source = {}, defaults = {}) {
    return {
      module,
      id: String(source.id || defaults.id || `${module.toLowerCase()}-${defaults.date || "assignment"}`),
      title: String(source.sessionName || source.name || source.title || defaults.title || module),
      type: String(source.type || source.sessionType || defaults.type || module).toUpperCase(),
      estimatedMinutes: Math.max(0, Number(source.estimatedMinutes || source.sessionMinutes || defaults.estimatedMinutes || 0)),
      planId: source.planId || defaults.planId || null,
      planRevision: Number(source.planRevision || defaults.planRevision || 1),
      sourceId: source.sessionId || source.id || defaults.sourceId || null,
      sourceDate: dateIso(source.date || source.scheduledDate || source.scheduled_date) || defaults.date || null
    };
  }

  function dailyDurationPolicy(contract = {}, activities = []) {
    const sessions = Array.isArray(activities) ? activities : [];
    const estimatedMinutes = sessions.reduce((total, item) => total + Math.max(0, Number(item?.estimatedMinutes || 0)), 0);
    const longRunUncapped = sessions.some((item) => item?.module === "RUNNING" && String(item?.type || "").toUpperCase() === "LONG");
    const twoADaysEnabled = contract.twoADays === true;
    const twoADayCandidate = twoADaysEnabled && sessions.length === 2;
    const twoADay = twoADayCandidate && estimatedMinutes >= TWO_A_DAY_TARGET_MINUTES;
    const durationTargetUnmet = twoADayCandidate && estimatedMinutes < TWO_A_DAY_TARGET_MINUTES;
    const maximumMinutes = longRunUncapped ? null : twoADayCandidate ? TWO_A_DAY_MAX_MINUTES : Number(contract.sessionMinutes || 60);
    return {
      estimatedMinutes,
      sessionCount: sessions.length,
      twoADaysEnabled,
      twoADayCandidate,
      twoADay,
      targetMinutes: twoADayCandidate ? TWO_A_DAY_TARGET_MINUTES : Number(contract.sessionMinutes || 60),
      maximumMinutes,
      longRunUncapped,
      sessionLimitExceeded: Boolean(twoADaysEnabled && sessions.length > 2),
      durationTargetUnmet,
      durationLimitExceeded: maximumMinutes !== null && estimatedMinutes > maximumMinutes
    };
  }

  function strengthPlacementScore(index, preferred, placed, runningByDay, coreByDay) {
    const run = runningByDay.get(index);
    let score = Math.abs(index - preferred) * 12;
    if (run && HARD_RUN_TYPES.includes(String(run.type || "").toUpperCase())) score += 10000;
    else if (run) score += 24;
    if (coreByDay.has(index)) score += 18;
    if (placed.some((item) => Math.abs(item - index) === 1)) score += 10;
    return score;
  }

  function buildStrengthActivities(contract, strengthPlan, days, runningByDay, coreByDay) {
    const count = committedCount(contract, "STRENGTH");
    if (!count || strengthPlan?.status !== "APPROVED") return [];
    const sessions = Array.isArray(strengthPlan.sessions) ? strengthPlan.sessions : [];
    const eligible = days.filter((day) => day.isTrainingDay).map((day) => day.dayIndex);
    const preferred = days.filter((day) => day.committedActivities.includes("STRENGTH")).map((day) => day.dayIndex);
    const placements = [];
    for (let position = 0; position < Math.min(count, sessions.length); position += 1) {
      const requested = preferred[position] ?? eligible[position] ?? position;
      const candidates = eligible.filter((index) => !placements.includes(index)).sort((left, right) => {
        return strengthPlacementScore(left, requested, placements, runningByDay, coreByDay)
          - strengthPlacementScore(right, requested, placements, runningByDay, coreByDay)
          || left - right;
      });
      if (candidates.length) placements.push(candidates[0]);
    }
    return placements.map((dayIndex, index) => ({
      dayIndex,
      assignment: activity("STRENGTH", sessions[index], {
        id: `strength-${index + 1}`,
        title: `Strength session ${index + 1}`,
        estimatedMinutes: contract.sessionMinutes,
        planId: strengthPlan.id,
        planRevision: strengthPlan.revision,
        date: addDays(days[0].date, dayIndex)
      }),
      sequence: index + 1,
      requestedDayIndex: preferred[index] ?? dayIndex
    }));
  }

  function buildUnifiedWeek(input = {}, options = {}) {
    const contract = input.contract || {};
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const weekStart = weekStartIso(options.weekStart || today);
    const weekEnd = addDays(weekStart, 6);
    const days = contractDays(contract, weekStart).map((day) => ({ ...day, activities: [], conflicts: [], nutrition: null }));
    const conflicts = [];
    const expected = {
      strength: committedCount(contract, "STRENGTH"),
      running: committedCount(contract, "RUNNING"),
      core: committedCount(contract, "CORE")
    };

    if (contract.status !== "APPROVED") conflicts.push(conflict("CONTRACT_REQUIRED", "BLOCKING", "Approve the Recruit Contract before committing a week."));

    const runSessions = runningSessions(input.runningBlock, weekStart);
    const coreSessions = String(input.corePlan?.status || "").toUpperCase() === "APPROVED" ? sessionsForWeek(input.corePlan, weekStart) : [];
    const runningByDay = new Map(runSessions.map((session) => [Math.round((Date.parse(`${session.date}T12:00:00Z`) - Date.parse(`${weekStart}T12:00:00Z`)) / 86400000), session]));
    const coreByDay = new Map(coreSessions.map((session) => [Math.round((Date.parse(`${session.date}T12:00:00Z`) - Date.parse(`${weekStart}T12:00:00Z`)) / 86400000), session]));

    runSessions.forEach((session) => {
      const dayIndex = Math.round((Date.parse(`${session.date}T12:00:00Z`) - Date.parse(`${weekStart}T12:00:00Z`)) / 86400000);
      if (days[dayIndex]) days[dayIndex].activities.push(activity("RUNNING", session, { estimatedMinutes: session.estimatedMinutes, date: session.date, planId: input.runningBlock?.id, planRevision: input.runningBlock?.revision }));
    });
    coreSessions.forEach((session) => {
      const dayIndex = Math.round((Date.parse(`${session.date}T12:00:00Z`) - Date.parse(`${weekStart}T12:00:00Z`)) / 86400000);
      if (days[dayIndex]) days[dayIndex].activities.push(activity("CORE", session, { estimatedMinutes: input.corePlan?.profile?.sessionMinutes || 15, date: session.date, planId: input.corePlan?.id, planRevision: input.corePlan?.revision }));
    });

    const strengthActivities = buildStrengthActivities(contract, input.strengthPlan, days, runningByDay, coreByDay);
    strengthActivities.forEach((item) => {
      if (days[item.dayIndex]) days[item.dayIndex].activities.push({ ...item.assignment, sequence: item.sequence, requestedDayIndex: item.requestedDayIndex });
    });

    if (expected.strength && input.strengthPlan?.status !== "APPROVED") conflicts.push(conflict("STRENGTH_PLAN_REQUIRED", "BLOCKING", "Approve a Strength program before committing this week.", null, "STRENGTH"));
    if (expected.running && input.runningBlock?.status !== "APPROVED") conflicts.push(conflict("RUNNING_PLAN_REQUIRED", "BLOCKING", "Approve a Running block before committing this week.", null, "RUNNING"));
    if (expected.core && input.corePlan?.status !== "APPROVED") conflicts.push(conflict("CORE_PLAN_REQUIRED", "BLOCKING", "Approve a Core plan before committing this week.", null, "CORE"));
    if (!input.nutritionBaseline) conflicts.push(conflict("NUTRITION_BASELINE_REQUIRED", "BLOCKING", "Approve a Nutrition baseline before committing this week.", null, "NUTRITION"));

    const actual = {
      strength: strengthActivities.length,
      running: runSessions.length,
      core: coreSessions.length
    };
    Object.keys(expected).forEach((key) => {
      if (expected[key] > 0 && actual[key] < expected[key]) {
        conflicts.push(conflict(`${key.toUpperCase()}_COVERAGE_INCOMPLETE`, "BLOCKING", `${key[0].toUpperCase()}${key.slice(1)} provides ${actual[key]} of ${expected[key]} committed sessions for this week.`, null, key.toUpperCase()));
      } else if (actual[key] > expected[key]) {
        conflicts.push(conflict(`${key.toUpperCase()}_COVERAGE_EXCEEDS_CONTRACT`, "ADVISORY", `${key[0].toUpperCase()}${key.slice(1)} has ${actual[key]} sessions against a ${expected[key]}-session commitment.`, null, key.toUpperCase()));
      }
    });

    days.forEach((day) => {
      if (input.nutritionBaseline) {
        const targets = day.activities.length
          ? input.nutritionBaseline.trainingTargets || input.nutritionBaseline.recoveryTargets || input.nutritionBaseline
          : input.nutritionBaseline.recoveryTargets || input.nutritionBaseline;
        day.nutrition = {
          module: "NUTRITION",
          title: "Fueling targets active",
          calories: Number(targets.calories || 0),
          protein: Number(targets.protein || 0),
          sourceId: input.nutritionBaseline.id || input.nutritionBaseline.approvedAt || null
        };
      }
      const modules = new Set(day.activities.map((item) => item.module));
      const hardRun = day.activities.find((item) => item.module === "RUNNING" && HARD_RUN_TYPES.includes(item.type));
      if (day.isRecoveryDay && day.activities.length) {
        day.conflicts.push(conflict("RECOVERY_DAY_COLLISION", "BLOCKING", "Training landed on the Recruit Contract recovery day.", day.date));
      }
      if (hardRun && modules.has("STRENGTH")) {
        day.conflicts.push(conflict("HARD_RUN_STRENGTH_COLLISION", "BLOCKING", `${hardRun.type} running and loaded Strength cannot share this day.`, day.date));
      }
      if (modules.has("STRENGTH") && modules.has("CORE")) {
        day.conflicts.push(conflict("STRENGTH_CORE_STACK", "ADVISORY", "Complete Strength first and keep Core controlled.", day.date));
      }
      if (modules.has("STRENGTH") && modules.has("RUNNING") && !hardRun) {
        day.conflicts.push(contract.twoADays === true
          ? conflict("TWO_A_DAY_SEPARATION", "ADVISORY", "Two-a-Day authorized: separate Strength and the easy run by several hours and refuel between sessions.", day.date)
          : conflict("EASY_RUN_STRENGTH_STACK", "ADVISORY", "Separate the easy run and Strength session when practical.", day.date));
      }
      if (modules.size >= 3) day.conflicts.push(conflict("TRIPLE_SESSION_DAY", "ADVISORY", "Three training modules share this day; use readiness to reduce, never add, work.", day.date));
      const duration = dailyDurationPolicy(contract, day.activities);
      day.estimatedMinutes = duration.estimatedMinutes;
      day.sessionCount = duration.sessionCount;
      day.twoADayCandidate = duration.twoADayCandidate;
      day.twoADay = duration.twoADay;
      day.durationTargetMinutes = duration.targetMinutes;
      day.durationLimitMinutes = duration.maximumMinutes;
      day.longRunUncapped = duration.longRunUncapped;
      day.durationPolicy = duration.longRunUncapped ? "LONG_RUN_UNCAPPED" : duration.twoADay ? "TWO_A_DAY" : duration.twoADayCandidate ? "TWO_A_DAY_TARGET_UNMET" : "STANDARD";
      if (duration.sessionLimitExceeded) {
        day.conflicts.push(conflict("TWO_A_DAY_SESSION_LIMIT", "BLOCKING", "Two-a-Days permit no more than two scheduled sessions on one day.", day.date));
      }
      if (duration.durationLimitExceeded) {
        day.conflicts.push(conflict(
          duration.twoADay ? "TWO_A_DAY_CAP_EXCEEDED" : "TIME_COMMITMENT_EXCEEDED",
          duration.twoADay ? "BLOCKING" : "ADVISORY",
          duration.twoADay
            ? `${day.estimatedMinutes} planned minutes exceed the 240-minute Two-a-Day ceiling.`
            : `${day.estimatedMinutes} planned minutes exceed the ${contract.sessionMinutes}-minute commitment.`,
          day.date
        ));
      }
      if (duration.durationTargetUnmet) {
        day.conflicts.push(conflict("TWO_A_DAY_TARGET_UNMET", "ADVISORY", `${day.estimatedMinutes} planned minutes remain a combined day; Two-a-Day designation begins at 121 minutes.`, day.date));
      }
      day.load = !day.activities.length ? "RECOVERY" : duration.twoADay ? "TWO_A_DAY" : modules.size > 1 ? "COMBINED" : "SINGLE";
      conflicts.push(...day.conflicts);
    });

    const trainingDays = days.filter((day) => day.activities.length).length;
    const recoveryDays = 7 - trainingDays;
    if (trainingDays > 6 || recoveryDays < 1) conflicts.push(conflict("RECOVERY_MINIMUM_VIOLATED", "BLOCKING", "At least one full recovery day must remain protected."));

    const blockingConflictCount = conflicts.filter((item) => item.severity === "BLOCKING").length;
    const advisoryCount = conflicts.filter((item) => item.severity === "ADVISORY").length;
    const generatedAt = options.generatedAt || new Date().toISOString();
    const identity = fingerprint({ contractId: contract.id, contractRevision: contract.revision, weekStart, days, generatedAt });
    return {
      version: VERSION,
      id: `${identity}:${weekStart}`,
      status: "DRAFT",
      state: "DRAFT",
      weekStart,
      weekEnd,
      contractId: contract.id || null,
      contractRevision: Number(contract.revision || 0),
      createdAt: generatedAt,
      days,
      conflicts,
      approvalBlocked: blockingConflictCount > 0,
      blockingConflictCount,
      advisoryCount,
      trainingDays,
      recoveryDays,
      twoADaysEnabled: contract.twoADays === true,
      twoADayCount: days.filter((day) => day.twoADay).length,
      expected,
      actual,
      moduleStatus: {
        strength: expected.strength ? input.strengthPlan?.status === "APPROVED" && actual.strength >= expected.strength ? "READY" : "ACTION_REQUIRED" : "NOT_COMMITTED",
        running: expected.running ? input.runningBlock?.status === "APPROVED" && actual.running >= expected.running ? "READY" : "ACTION_REQUIRED" : "NOT_COMMITTED",
        core: expected.core ? input.corePlan?.status === "APPROVED" && actual.core >= expected.core ? "READY" : "ACTION_REQUIRED" : "NOT_COMMITTED",
        nutrition: input.nutritionBaseline ? "READY" : "ACTION_REQUIRED"
      },
      sourceRefs: {
        strengthPlanId: input.strengthPlan?.id || null,
        strengthPlanRevision: Number(input.strengthPlan?.revision || 0),
        runningBlockId: input.runningBlock?.id || null,
        runningBlockRevision: Number(input.runningBlock?.revision || 0),
        corePlanId: input.corePlan?.id || null,
        corePlanRevision: Number(input.corePlan?.revision || 0),
        nutritionBaselineId: input.nutritionBaseline?.id || input.nutritionBaseline?.approvedAt || null
      },
      safeguards: [
        "The active week is never replaced by a future draft.",
        "Pain and RED readiness may remove work but never add compensatory volume.",
        "Hard running and loaded Strength cannot share a committed day.",
        "At least one full recovery day remains protected.",
        contract.twoADays === true
          ? "Two-a-Days permit two sessions and up to 240 combined minutes; long-run time remains uncapped."
          : "Standard daily session limits remain active.",
        "Completion credit still requires execution evidence."
      ],
      message: blockingConflictCount
        ? `${blockingConflictCount} blocking item${blockingConflictCount === 1 ? "" : "s"} must be resolved before commitment.`
        : advisoryCount
          ? `Ready to commit with ${advisoryCount} visible coaching note${advisoryCount === 1 ? "" : "s"}.`
          : "The complete week is coordinated and ready to commit."
    };
  }

  function approveWeek(draft = {}, previous = null, options = {}) {
    if (draft.status !== "DRAFT" || !Array.isArray(draft.days) || draft.days.length !== 7) throw new Error("A complete weekly draft is required.");
    if (draft.approvalBlocked) throw new Error("Resolve blocking weekly conflicts before commitment.");
    const approvedAt = options.approvedAt || new Date().toISOString();
    const revision = previous?.weekStart === draft.weekStart ? Number(previous.revision || 0) + 1 : 1;
    return JSON.parse(JSON.stringify({
      ...draft,
      id: `${fingerprint({ draftId: draft.id, revision, approvedAt })}:${draft.weekStart}`,
      status: "COMMITTED",
      state: "COMMITTED",
      revision,
      approvedAt,
      supersedesId: previous?.weekStart === draft.weekStart ? previous.id : null
    }));
  }

  function weekState(week = {}, value = null) {
    if (week.status === "REPLACED" || week.state === "REPLACED") return "REPLACED";
    if (week.status === "DRAFT") return "DRAFT";
    const today = dateIso(value) || new Date().toISOString().slice(0, 10);
    if (today < week.weekStart) return "COMMITTED";
    if (today > week.weekEnd) return "COMPLETED";
    return "ACTIVE";
  }

  function mergeCommittedWeek(history = [], approved = {}) {
    const replaced = (history || []).map((item) => item.weekStart === approved.weekStart && item.status !== "REPLACED"
      ? { ...item, status: "REPLACED", state: "REPLACED", replacedAt: approved.approvedAt, replacedById: approved.id }
      : item);
    return [approved, ...replaced.filter((item) => item.id !== approved.id)].slice(0, 52);
  }

  function weekForDate(history = [], value = null) {
    const date = dateIso(value) || new Date().toISOString().slice(0, 10);
    return (history || [])
      .filter((item) => item.status !== "REPLACED" && item.weekStart <= date && item.weekEnd >= date)
      .sort((left, right) => Number(right.revision || 0) - Number(left.revision || 0))[0] || null;
  }

  function dayForDate(week = {}, value = null) {
    const date = dateIso(value) || new Date().toISOString().slice(0, 10);
    return (week.days || []).find((day) => day.date === date) || null;
  }

  function strengthScheduleFromWeek(week = {}) {
    const assignments = (week.days || []).flatMap((day) => day.activities
      .filter((item) => item.module === "STRENGTH")
      .map((item, index) => ({
        id: `${week.id}:${item.sourceId || item.id}`,
        planId: item.planId,
        planRevision: item.planRevision,
        sessionId: item.sourceId,
        sessionName: item.title,
        sequence: item.sequence || index + 1,
        requestedDayIndex: item.requestedDayIndex ?? day.dayIndex,
        originalDate: day.date,
        date: day.date,
        placement: item.requestedDayIndex === day.dayIndex ? "PREFERRED" : "COORDINATED",
        placementReason: item.requestedDayIndex === day.dayIndex ? "Placed on the Recruit Contract day." : "Shifted by the unified weekly coordinator."
      })));
    const first = assignments[0] || {};
    return {
      version: VERSION,
      id: `unified-strength:${week.id}`,
      status: "APPROVED",
      planId: first.planId || week.sourceRefs?.strengthPlanId || null,
      planRevision: first.planRevision || week.sourceRefs?.strengthPlanRevision || 1,
      revision: week.revision || 1,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      approvedAt: week.approvedAt,
      orchestratorWeekId: week.id,
      assignments,
      approvalBlocked: false
    };
  }

  return Object.freeze({
    VERSION,
    DAY_LABELS,
    HARD_RUN_TYPES,
    TWO_A_DAY_TARGET_MINUTES,
    TWO_A_DAY_MAX_MINUTES,
    addDays,
    weekStartIso,
    planningDateForWeek,
    dailyDurationPolicy,
    buildUnifiedWeek,
    approveWeek,
    weekState,
    mergeCommittedWeek,
    weekForDate,
    dayForDate,
    strengthScheduleFromWeek
  });
});
