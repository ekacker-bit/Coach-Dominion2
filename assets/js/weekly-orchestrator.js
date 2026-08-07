(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionWeeklyOrchestrator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "024D.1";
  const DAY_LABELS = Object.freeze(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
  const HARD_RUN_TYPES = Object.freeze(["INTERVAL", "TEMPO", "LONG"]);
  const TWO_A_DAY_TARGET_MINUTES = 121;
  const TWO_A_DAY_MAX_MINUTES = 240;
  const TWO_A_DAY_MINIMUM_SEPARATION_MINUTES = 240;
  const SINGLE_WINDOW_MAX_MINUTES = 120;

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

  function buildTrainingWindows(contract = {}, activities = []) {
    const sessions = Array.isArray(activities) ? activities : [];
    const primary = sessions
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => String(item?.module || "").toUpperCase() !== "CORE")
      .sort((left, right) => sessionPriority(contract, left.item, left.originalIndex) - sessionPriority(contract, right.item, right.originalIndex));
    const core = sessions
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => String(item?.module || "").toUpperCase() === "CORE");
    const windows = primary.map(({ item, originalIndex }) => ({
      activities: [{ item, originalIndex, tertiary: false }],
      estimatedMinutes: Math.max(0, Number(item?.estimatedMinutes || 0)),
      longRunUncapped: item?.module === "RUNNING" && String(item?.type || "").toUpperCase() === "LONG"
    }));

    core.forEach(({ item, originalIndex }) => {
      const minutes = Math.max(0, Number(item?.estimatedMinutes || 0));
      const candidates = windows
        .map((window, index) => ({ window, index }))
        .filter(({ window }) => window.activities.some((entry) => ["STRENGTH", "RUNNING"].includes(String(entry.item?.module || "").toUpperCase()))
          && window.estimatedMinutes + minutes <= SINGLE_WINDOW_MAX_MINUTES)
        .sort((left, right) => {
          const leftModule = String(left.window.activities[0]?.item?.module || "").toUpperCase();
          const rightModule = String(right.window.activities[0]?.item?.module || "").toUpperCase();
          return left.window.estimatedMinutes - right.window.estimatedMinutes
            || Number(rightModule === "STRENGTH") - Number(leftModule === "STRENGTH")
            || left.index - right.index;
        });
      if (candidates.length) {
        candidates[0].window.activities.push({ item, originalIndex, tertiary: true });
        candidates[0].window.estimatedMinutes += minutes;
      } else {
        windows.push({
          activities: [{ item, originalIndex, tertiary: false }],
          estimatedMinutes: minutes,
          longRunUncapped: false
        });
      }
    });

    return windows.map((window, index) => ({
      ...window,
      id: `window-${index + 1}`,
      order: index + 1,
      corePaired: window.activities.some((entry) => entry.tertiary),
      activityIds: window.activities.map((entry) => String(entry.item?.id || ""))
    }));
  }

  function dailyDurationPolicy(contract = {}, activities = []) {
    const sessions = Array.isArray(activities) ? activities : [];
    const trainingWindows = buildTrainingWindows(contract, sessions);
    const estimatedMinutes = sessions.reduce((total, item) => total + Math.max(0, Number(item?.estimatedMinutes || 0)), 0);
    const longRunUncapped = trainingWindows.some((window) => window.longRunUncapped);
    const twoADaysEnabled = contract.twoADays === true;
    const twoADayCandidate = twoADaysEnabled && trainingWindows.length === 2;
    const twoADay = twoADayCandidate && estimatedMinutes >= TWO_A_DAY_TARGET_MINUTES;
    const twoADayAuthorizationRequired = !twoADaysEnabled && trainingWindows.length === 2 && estimatedMinutes >= TWO_A_DAY_TARGET_MINUTES;
    const durationTargetUnmet = twoADayCandidate && estimatedMinutes < TWO_A_DAY_TARGET_MINUTES;
    const pairedCoreWindow = trainingWindows.length === 1 && trainingWindows[0]?.corePaired;
    const maximumMinutes = longRunUncapped
      ? null
      : twoADayCandidate
        ? TWO_A_DAY_MAX_MINUTES
        : pairedCoreWindow
          ? SINGLE_WINDOW_MAX_MINUTES
          : Number(contract.sessionMinutes || 60);
    return {
      estimatedMinutes,
      activityCount: sessions.length,
      sessionCount: trainingWindows.length,
      trainingWindows,
      corePaired: trainingWindows.some((window) => window.corePaired),
      tertiaryActivityCount: trainingWindows.reduce((count, window) => count + window.activities.filter((entry) => entry.tertiary).length, 0),
      twoADaysEnabled,
      twoADayCandidate,
      twoADay,
      twoADayAuthorizationRequired,
      targetMinutes: twoADayCandidate ? TWO_A_DAY_TARGET_MINUTES : Number(contract.sessionMinutes || 60),
      maximumMinutes,
      longRunUncapped,
      sessionLimitExceeded: trainingWindows.length > 2,
      durationTargetUnmet,
      durationLimitExceeded: maximumMinutes !== null && estimatedMinutes > maximumMinutes
    };
  }

  function sessionPriority(contract = {}, item = {}, originalIndex = 0) {
    const module = String(item.module || "").toUpperCase();
    const type = String(item.type || "").toUpperCase();
    const goal = String(contract.primaryGoal || "").toUpperCase();
    if (module === "RUNNING" && type === "LONG") return -100;
    if (["RUN_FASTER", "BUILD_ENDURANCE"].includes(goal) && module === "RUNNING") return -50;
    if (goal === "BUILD_STRENGTH" && module === "STRENGTH") return -50;
    return ({ STRENGTH: 10, RUNNING: 20, CORE: 30 }[module] ?? 40) + originalIndex / 100;
  }

  function buildSessionSequence(contract = {}, activities = [], durationPolicy = null) {
    const sessions = Array.isArray(activities) ? activities : [];
    const duration = durationPolicy || dailyDurationPolicy(contract, sessions);
    return duration.trainingWindows.flatMap((window, windowIndex) => {
      const windowName = duration.twoADay ? (windowIndex === 0 ? "AM" : "PM") : null;
      return window.activities.map(({ item, tertiary }, activityIndex) => ({
        ...item,
        sessionOrder: windowIndex + 1,
        activityOrder: activityIndex + 1,
        sessionWindow: windowName,
        trainingWindowId: window.id,
        tertiary,
        sessionLabel: tertiary
          ? `${windowName ? `${windowName} ` : ""}CORE FINISHER`
          : duration.twoADay
            ? `${windowName} SESSION`
            : duration.sessionCount > 1
              ? `BLOCK ${windowIndex + 1}`
              : "SESSION",
        separationBeforeMinutes: duration.twoADay && windowIndex > 0 && activityIndex === 0 ? TWO_A_DAY_MINIMUM_SEPARATION_MINUTES : 0,
        fuelingCheckpoint: Boolean(duration.twoADay && windowIndex > 0 && activityIndex === 0),
        command: tertiary
          ? "FINISH THE WINDOW"
          : duration.twoADay
            ? windowIndex === 0 ? "EXECUTE FIRST" : "EXECUTE AFTER REFUEL"
            : "EXECUTE"
      }));
    });
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

  function dayIndexForDate(value, weekStart) {
    const date = dateIso(value);
    if (!date) return null;
    const index = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${weekStart}T12:00:00Z`)) / 86400000);
    return index >= 0 && index <= 6 ? index : null;
  }

  function atlasActivityPriority(item = {}) {
    const module = String(item.module || "").toUpperCase();
    const type = String(item.type || "").toUpperCase();
    if (module === "RUNNING" && type === "LONG") return 0;
    if (module === "RUNNING" && HARD_RUN_TYPES.includes(type)) return 10;
    if (module === "STRENGTH") return 20;
    if (module === "RUNNING") return 30;
    if (module === "CORE") return 40;
    return 50;
  }

  function atlasProgramActivities(input = {}, contract = {}, weekStart) {
    const expected = {
      strength: committedCount(contract, "STRENGTH"),
      running: committedCount(contract, "RUNNING"),
      core: committedCount(contract, "CORE")
    };
    const strengthSessions = input.strengthPlan?.status === "APPROVED"
      ? (Array.isArray(input.strengthPlan.sessions) ? input.strengthPlan.sessions : []).slice(0, expected.strength)
      : [];
    const runSessions = runningSessions(input.runningBlock, weekStart).slice(0, expected.running);
    const coreSessions = String(input.corePlan?.status || "").toUpperCase() === "APPROVED"
      ? sessionsForWeek(input.corePlan, weekStart).slice(0, expected.core)
      : [];

    const activities = [
      ...strengthSessions.map((session, index) => activity("STRENGTH", session, {
        id: `strength-${index + 1}`,
        title: `Strength session ${index + 1}`,
        estimatedMinutes: contract.sessionMinutes,
        planId: input.strengthPlan?.id,
        planRevision: input.strengthPlan?.revision,
        date: dateIso(session.date || session.scheduledDate) || null,
        sourceId: session.id || session.sessionId || null
      })),
      ...runSessions.map((session, index) => activity("RUNNING", session, {
        id: `running-${index + 1}`,
        estimatedMinutes: session.estimatedMinutes,
        planId: input.runningBlock?.id,
        planRevision: input.runningBlock?.revision,
        date: session.date,
        sourceId: session.id || null
      })),
      ...coreSessions.map((session, index) => activity("CORE", session, {
        id: `core-${index + 1}`,
        estimatedMinutes: input.corePlan?.profile?.sessionMinutes || 15,
        planId: input.corePlan?.id,
        planRevision: input.corePlan?.revision,
        date: session.date,
        sourceId: session.id || null
      }))
    ].map((item, index) => ({
      ...item,
      atlasSequence: index + 1,
      requestedDayIndex: dayIndexForDate(item.sourceDate, weekStart),
      originalPlanDate: item.sourceDate
    }));
    return { expected, activities, counts: { strength: strengthSessions.length, running: runSessions.length, core: coreSessions.length } };
  }

  function placementHardCollision(activities = []) {
    const hardRun = activities.some((item) => item.module === "RUNNING" && HARD_RUN_TYPES.includes(String(item.type || "").toUpperCase()));
    const strength = activities.some((item) => item.module === "STRENGTH");
    return hardRun && strength;
  }

  function atlasPlacementScore(contract = {}, days = [], day = {}, item = {}, occupiedDays = 0) {
    if (day.isRecoveryDay) return Number.POSITIVE_INFINITY;
    if ((day.activities || []).some((existing) => existing.module === item.module)) return Number.POSITIVE_INFINITY;
    const combined = [...(day.activities || []), item];
    if (placementHardCollision(combined)) return Number.POSITIVE_INFINITY;
    const duration = dailyDurationPolicy(contract, combined);
    if (duration.sessionLimitExceeded || duration.durationLimitExceeded) return Number.POSITIVE_INFINITY;

    const module = String(item.module || "").toUpperCase();
    const type = String(item.type || "").toUpperCase();
    const preferred = day.committedActivities.includes(module);
    const requested = Number.isInteger(item.requestedDayIndex) ? item.requestedDayIndex : null;
    let score = preferred ? -55 : 20;
    if (requested !== null) score += Math.abs(day.dayIndex - requested) * 8;
    if (!day.activities.length) score += occupiedDays < Number(contract.trainingDaysPerWeek || 5) ? -18 : 75;
    else score += module === "CORE" ? -10 : contract.twoADays ? 12 : 90;

    if (module === "RUNNING" && type === "LONG") {
      if (day.activities.some((existing) => existing.module !== "CORE")) return Number.POSITIVE_INFINITY;
      score += day.dayIndex >= 5 ? -80 : day.dayIndex * -3;
    }
    if (module === "RUNNING" && HARD_RUN_TYPES.includes(type) && day.activities.some((existing) => existing.module !== "CORE")) score += 500;
    if (module === "CORE") {
      if (duration.corePaired) score -= 90;
      else if (!day.activities.length) score += 140;
    }
    if (duration.twoADayAuthorizationRequired) score += 350;
    if (duration.twoADay) score += contract.twoADays ? -15 : 350;

    const sameModuleAdjacent = days.some((candidate) => Math.abs(candidate.dayIndex - day.dayIndex) === 1
      && candidate.activities.some((existing) => existing.module === module));
    if (sameModuleAdjacent) score += module === "CORE" ? 8 : 32;
    return score;
  }

  function placeAtlasProgramActivities(contract = {}, days = [], activities = []) {
    const decisions = [];
    [...activities]
      .sort((left, right) => atlasActivityPriority(left) - atlasActivityPriority(right) || left.atlasSequence - right.atlasSequence)
      .forEach((item) => {
        const occupiedDays = days.filter((day) => day.activities.length).length;
        const ranked = days
          .map((day) => ({ day, score: atlasPlacementScore(contract, days, day, item, occupiedDays) }))
          .filter((candidate) => Number.isFinite(candidate.score))
          .sort((left, right) => left.score - right.score || left.day.dayIndex - right.day.dayIndex);
        const target = ranked[0]?.day || days.filter((day) => !day.isRecoveryDay).sort((left, right) => left.activities.length - right.activities.length || left.dayIndex - right.dayIndex)[0];
        if (!target) return;
        const preferred = target.committedActivities.includes(item.module);
        const preserved = item.requestedDayIndex === target.dayIndex;
        const reason = preferred
          ? "Placed on the signed Contract pattern."
          : preserved
            ? "Preserved the module plan day after whole-program checks."
            : "Placed by Atlas after checking the complete Strength, Cardio, Core, recovery, and time load.";
        target.activities.push({
          ...item,
          sourceDate: target.date,
          atlasCalendarDate: target.date,
          placement: preferred ? "CONTRACT_PATTERN" : preserved ? "PLAN_DAY_PRESERVED" : "ATLAS_COORDINATED",
          placementReason: reason
        });
        decisions.push({
          activityId: item.id,
          module: item.module,
          type: item.type,
          originalPlanDate: item.originalPlanDate || null,
          scheduledDate: target.date,
          placement: preferred ? "CONTRACT_PATTERN" : preserved ? "PLAN_DAY_PRESERVED" : "ATLAS_COORDINATED",
          reason
        });
      });
    return decisions;
  }

  function coordinateDay(contract = {}, sourceDay = {}) {
    const day = { ...sourceDay, activities: Array.isArray(sourceDay.activities) ? sourceDay.activities : [], conflicts: [] };
    const modules = new Set(day.activities.map((item) => item.module));
    const hardRun = day.activities.find((item) => item.module === "RUNNING" && HARD_RUN_TYPES.includes(item.type));
    const duration = dailyDurationPolicy(contract, day.activities);
    day.activities = buildSessionSequence(contract, day.activities, duration);
    day.sessionSequence = day.activities.map((item) => ({
      activityId: item.id,
      module: item.module,
      title: item.title,
      type: item.type,
      estimatedMinutes: item.estimatedMinutes,
      sessionOrder: item.sessionOrder,
      activityOrder: item.activityOrder,
      sessionWindow: item.sessionWindow,
      trainingWindowId: item.trainingWindowId,
      tertiary: item.tertiary,
      sessionLabel: item.sessionLabel,
      separationBeforeMinutes: item.separationBeforeMinutes,
      fuelingCheckpoint: item.fuelingCheckpoint,
      command: item.command
    }));
    day.trainingWindows = duration.trainingWindows.map((window) => ({
      id: window.id,
      order: window.order,
      estimatedMinutes: window.estimatedMinutes,
      longRunUncapped: window.longRunUncapped,
      corePaired: window.corePaired,
      activityIds: window.activityIds
    }));
    Object.assign(day, {
      activityCount: duration.activityCount,
      estimatedMinutes: duration.estimatedMinutes,
      sessionCount: duration.sessionCount,
      twoADayCandidate: duration.twoADayCandidate,
      twoADay: duration.twoADay,
      twoADayAuthorizationRequired: duration.twoADayAuthorizationRequired,
      durationTargetMinutes: duration.targetMinutes,
      durationLimitMinutes: duration.maximumMinutes,
      longRunUncapped: duration.longRunUncapped,
      corePaired: duration.corePaired,
      tertiaryActivityCount: duration.tertiaryActivityCount,
      minimumSeparationMinutes: duration.twoADay ? TWO_A_DAY_MINIMUM_SEPARATION_MINUTES : 0,
      betweenSessionFuelingRequired: duration.twoADay
    });
    day.durationPolicy = duration.longRunUncapped ? "LONG_RUN_UNCAPPED" : duration.twoADay ? "TWO_A_DAY" : duration.twoADayCandidate ? "TWO_A_DAY_TARGET_UNMET" : duration.corePaired ? "CORE_TERTIARY_WINDOW" : "STANDARD";

    if (day.isRecoveryDay && day.activities.length) day.conflicts.push(conflict("RECOVERY_DAY_COLLISION", "BLOCKING", "Training landed on the Recruit Contract recovery day. Move the work or change the Contract before commitment.", day.date));
    if (hardRun && modules.has("STRENGTH")) day.conflicts.push(conflict("HARD_RUN_STRENGTH_COLLISION", "BLOCKING", `${hardRun.type} running and loaded Strength cannot share this day. Move one activity.`, day.date));
    if (duration.corePaired) {
      const pairedWindow = duration.trainingWindows.find((window) => window.corePaired);
      const primary = pairedWindow?.activities.find((entry) => !entry.tertiary)?.item?.module || "primary training";
      day.conflicts.push(conflict("CORE_TERTIARY_PAIRING", "ADVISORY", `Core is attached after ${primary} inside one ${pairedWindow?.estimatedMinutes || 0}-minute training window; it does not consume another session.`, day.date, "CORE"));
    }
    if (modules.has("STRENGTH") && modules.has("RUNNING") && !hardRun) {
      day.conflicts.push(contract.twoADays === true && duration.twoADay
        ? conflict("TWO_A_DAY_SEPARATION", "ADVISORY", "Two-a-Day authorized: separate Strength and the easy run by at least four hours and refuel between windows.", day.date)
        : conflict("EASY_RUN_STRENGTH_STACK", "ADVISORY", "Strength and the easy run occupy separate training windows. Separate them when practical.", day.date));
    }
    if (modules.size >= 3 && duration.sessionCount > 2) day.conflicts.push(conflict("TRIPLE_TRAINING_WINDOW", "ADVISORY", "Three separate training windows remain on this day. Move one activity before commitment.", day.date));
    if (duration.sessionLimitExceeded) day.conflicts.push(conflict("TWO_A_DAY_SESSION_LIMIT", "BLOCKING", "This day contains more than two training windows. Core only stays tertiary when it fits with Run or Strength inside 120 minutes.", day.date));
    if (duration.twoADayAuthorizationRequired) {
      day.conflicts.push(conflict("TWO_A_DAY_AUTHORIZATION_REQUIRED", "ADVISORY", `${day.estimatedMinutes} planned minutes form an AM/PM split, but Two-a-Days are OFF in the signed Contract. Amend the Contract to authorize up to 240 combined minutes.`, day.date));
    } else if (duration.durationLimitExceeded) {
      day.conflicts.push(conflict(
        duration.twoADay ? "TWO_A_DAY_CAP_EXCEEDED" : "TIME_COMMITMENT_EXCEEDED",
        duration.twoADay ? "BLOCKING" : "ADVISORY",
        duration.twoADay ? `${day.estimatedMinutes} planned minutes exceed the 240-minute Two-a-Day ceiling.` : `${day.estimatedMinutes} planned minutes exceed the ${duration.maximumMinutes}-minute training-window commitment.`,
        day.date
      ));
    }
    if (duration.durationTargetUnmet) day.conflicts.push(conflict("TWO_A_DAY_TARGET_UNMET", "ADVISORY", `${day.estimatedMinutes} planned minutes use two windows but remain below the 121-minute Two-a-Day threshold.`, day.date));
    day.load = !day.activities.length ? "RECOVERY" : duration.twoADay ? "TWO_A_DAY" : duration.sessionCount > 1 ? "COMBINED" : "SINGLE";
    return day;
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

    const programActivities = atlasProgramActivities(input, contract, weekStart);
    const placementDecisions = placeAtlasProgramActivities(contract, days, programActivities.activities);

    if (expected.strength && input.strengthPlan?.status !== "APPROVED") conflicts.push(conflict("STRENGTH_PLAN_REQUIRED", "BLOCKING", "Approve a Strength program before committing this week.", null, "STRENGTH"));
    if (expected.running && input.runningBlock?.status !== "APPROVED") conflicts.push(conflict("RUNNING_PLAN_REQUIRED", "BLOCKING", "Approve a Running block before committing this week.", null, "RUNNING"));
    if (expected.core && input.corePlan?.status !== "APPROVED") conflicts.push(conflict("CORE_PLAN_REQUIRED", "BLOCKING", "Approve a Core plan before committing this week.", null, "CORE"));
    if (!input.nutritionBaseline) conflicts.push(conflict("NUTRITION_BASELINE_REQUIRED", "BLOCKING", "Approve a Nutrition baseline before committing this week.", null, "NUTRITION"));

    const actual = {
      strength: programActivities.counts.strength,
      running: programActivities.counts.running,
      core: programActivities.counts.core
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
      Object.assign(day, coordinateDay(contract, day));
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
      generatedBy: "ATLAS_PROGRAM",
      programId: options.programId || `atlas-program:${contract.id || "contract"}:r${Number(contract.revision || 0)}`,
      programRevision: Number(contract.revision || 0),
      placementDecisions,
      calendarPolicy: {
        twoADays: contract.twoADays === true,
        sessionMinutes: Number(contract.sessionMinutes || 60),
        primaryGoal: contract.primaryGoal || null
      },
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
          ? "Two-a-Days permit two training windows and up to 240 combined minutes, with at least four hours and refueling between them; long-run time remains uncapped."
          : "Standard daily session limits remain active.",
        "Core may finish a Run or Strength window without becoming another session when the combined window is 120 minutes or less.",
        "Completion credit still requires execution evidence."
      ],
      message: blockingConflictCount
        ? `${blockingConflictCount} blocking item${blockingConflictCount === 1 ? "" : "s"} must be resolved before commitment.`
        : advisoryCount
          ? `Atlas built the complete week with ${advisoryCount} visible coaching note${advisoryCount === 1 ? "" : "s"}.`
          : "Atlas built the complete program calendar from the signed Contract."
    };
  }

  function recalculateDraftWeek(draft = {}) {
    if (draft.status !== "DRAFT" || !Array.isArray(draft.days) || draft.days.length !== 7) throw new Error("A complete weekly draft is required.");
    const contract = {
      twoADays: draft.calendarPolicy?.twoADays === true || draft.twoADaysEnabled === true,
      sessionMinutes: Number(draft.calendarPolicy?.sessionMinutes || 60),
      primaryGoal: draft.calendarPolicy?.primaryGoal || null
    };
    const days = draft.days.map((day) => coordinateDay(contract, { ...day, conflicts: [] }));
    const retained = (draft.conflicts || []).filter((item) => !item.date && item.code !== "RECOVERY_MINIMUM_VIOLATED");
    const conflicts = [...retained, ...days.flatMap((day) => day.conflicts || [])];
    const trainingDays = days.filter((day) => day.activities.length).length;
    const recoveryDays = 7 - trainingDays;
    if (trainingDays > 6 || recoveryDays < 1) conflicts.push(conflict("RECOVERY_MINIMUM_VIOLATED", "BLOCKING", "At least one full recovery day must remain protected."));
    const blockingConflictCount = conflicts.filter((item) => item.severity === "BLOCKING").length;
    const advisoryCount = conflicts.filter((item) => item.severity === "ADVISORY").length;
    const editedAt = new Date().toISOString();
    return {
      ...draft,
      version: VERSION,
      id: `${fingerprint({ originalId: draft.id, days, editedAt })}:${draft.weekStart}`,
      days,
      conflicts,
      approvalBlocked: blockingConflictCount > 0,
      blockingConflictCount,
      advisoryCount,
      trainingDays,
      recoveryDays,
      twoADayCount: days.filter((day) => day.twoADay).length,
      editedAt,
      message: blockingConflictCount
        ? `${blockingConflictCount} blocking item${blockingConflictCount === 1 ? "" : "s"} must be resolved before commitment.`
        : advisoryCount
          ? `Edited calendar is ready to commit with ${advisoryCount} visible coaching note${advisoryCount === 1 ? "" : "s"}.`
          : "The edited calendar is coordinated and ready to commit."
    };
  }

  function moveDraftActivity(draft = {}, activityId = "", targetDate = "") {
    if (draft.status !== "DRAFT") throw new Error("Only a draft calendar can be edited.");
    const next = JSON.parse(JSON.stringify(draft));
    const target = next.days.find((day) => day.date === dateIso(targetDate));
    if (!target) throw new Error("Choose a day inside this operating week.");
    let moved = null;
    let originalDate = null;
    next.days.forEach((day) => {
      const index = day.activities.findIndex((item) => String(item.id) === String(activityId));
      if (index < 0) return;
      originalDate = day.date;
      [moved] = day.activities.splice(index, 1);
    });
    if (!moved) throw new Error("That calendar activity could not be found.");
    if (originalDate === target.date) return recalculateDraftWeek(next);
    target.activities.push({
      ...moved,
      originalCalendarDate: moved.originalCalendarDate || originalDate,
      calendarEdited: true
    });
    return recalculateDraftWeek(next);
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
    TWO_A_DAY_MINIMUM_SEPARATION_MINUTES,
    SINGLE_WINDOW_MAX_MINUTES,
    addDays,
    weekStartIso,
    planningDateForWeek,
    buildTrainingWindows,
    dailyDurationPolicy,
    buildSessionSequence,
    atlasProgramActivities,
    placeAtlasProgramActivities,
    buildUnifiedWeek,
    recalculateDraftWeek,
    moveDraftActivity,
    approveWeek,
    weekState,
    mergeCommittedWeek,
    weekForDate,
    dayForDate,
    strengthScheduleFromWeek
  });
});
