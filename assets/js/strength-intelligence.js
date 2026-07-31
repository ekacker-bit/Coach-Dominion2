(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionStrengthIntelligence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "017F.1";
  const TERMINAL_STATES = Object.freeze(["COMPLETE", "PARTIAL", "STOPPED"]);
  const PATTERN_LABELS = Object.freeze({
    SQUAT: "Squat",
    HINGE: "Hinge",
    HORIZONTAL_PUSH: "Horizontal push",
    VERTICAL_PUSH: "Vertical push",
    HORIZONTAL_PULL: "Horizontal pull",
    VERTICAL_PULL: "Vertical pull",
    UNILATERAL: "Unilateral",
    CARRY: "Carry",
    CORE: "Core"
  });

  function dateIso(value) {
    const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function addDays(value, offset) {
    const parsed = dateIso(value);
    if (!parsed) return null;
    const date = new Date(`${parsed}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(offset || 0));
    return date.toISOString().slice(0, 10);
  }

  function weekStartIso(value) {
    const parsed = dateIso(value);
    if (!parsed) return null;
    const date = new Date(`${parsed}T00:00:00Z`);
    const offset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  }

  function round(value, places = 1) {
    const factor = 10 ** places;
    return Math.round(Number(value || 0) * factor) / factor;
  }

  function average(values = []) {
    const usable = values.map(Number).filter(Number.isFinite);
    return usable.length ? round(usable.reduce((sum, value) => sum + value, 0) / usable.length) : null;
  }

  function normalizeName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function exerciseFromExecution(execution = {}, exerciseCode) {
    return (execution.sessionSnapshot?.exercises || []).find((item) =>
      (item.exerciseCode || item.id) === exerciseCode
    ) || null;
  }

  function workSets(execution = {}, exerciseCode = null) {
    return Object.entries(execution.setLogs || {}).flatMap(([code, logs]) => {
      if (exerciseCode && code !== exerciseCode) return [];
      return (Array.isArray(logs) ? logs : [])
        .filter((item) => String(item.kind || "WORK").toUpperCase() !== "WARMUP")
        .map((item) => ({ ...item, exerciseCode: code }));
    });
  }

  function executionExposures(execution = {}) {
    if (!TERMINAL_STATES.includes(String(execution.state || ""))) return [];
    return Object.keys(execution.setLogs || {}).flatMap((exerciseCode) => {
      const sets = workSets(execution, exerciseCode);
      if (!sets.length) return [];
      const definition = exerciseFromExecution(execution, exerciseCode) || {};
      const substitution = execution.substitutions?.[exerciseCode] || null;
      const substituted = Boolean(substitution?.name);
      const metricCode = substituted ? `SUB_${normalizeName(substitution.name)}` : exerciseCode;
      const exerciseName = substitution?.name || definition.exerciseName || definition.name || exerciseCode;
      const loadSets = sets.filter((item) => Number(item.load) > 0 && Number(item.reps) > 0);
      const topLoad = loadSets.length ? Math.max(...loadSets.map((item) => Number(item.load))) : 0;
      const topLoadReps = topLoad
        ? Math.max(...loadSets.filter((item) => Number(item.load) === topLoad).map((item) => Number(item.reps)))
        : 0;
      const repBest = sets.length ? Math.max(...sets.map((item) => Number(item.reps || 0))) : 0;
      const setVolumeBest = loadSets.length
        ? Math.max(...loadSets.map((item) => Number(item.load) * Number(item.reps)))
        : 0;
      const volume = loadSets.reduce((sum, item) => sum + Number(item.load) * Number(item.reps), 0);
      return [{
        executionId: execution.id || null,
        sessionId: execution.sessionId || null,
        sessionName: execution.sessionName || "Strength session",
        date: dateIso(execution.date || execution.completedAt || execution.updatedAt),
        state: execution.state,
        exerciseCode: metricCode,
        sourceExerciseCode: exerciseCode,
        exerciseName,
        pattern: definition.pattern || "OTHER",
        patternLabel: definition.patternLabel || PATTERN_LABELS[definition.pattern] || "Other",
        unit: definition.unit || sets.find((item) => item.unit)?.unit || "lb",
        repUnit: definition.repUnit || "reps",
        sets: sets.length,
        reps: sets.reduce((sum, item) => sum + Number(item.reps || 0), 0),
        topLoad: round(topLoad),
        topLoadReps: Math.round(topLoadReps),
        repBest: Math.round(repBest),
        setVolumeBest: Math.round(setVolumeBest),
        volume: Math.round(volume),
        averageRpe: average(sets.map((item) => item.rpe)),
        substituted,
        painReported: Boolean(execution.painReported),
        verifiedForRecord: !substituted && !execution.painReported && ["COMPLETE", "PARTIAL"].includes(execution.state)
      }];
    });
  }

  function terminalExecutions(history = []) {
    return (Array.isArray(history) ? history : [])
      .filter((item) => TERMINAL_STATES.includes(String(item?.state || "")))
      .sort((left, right) => String(left.completedAt || left.updatedAt || left.date || "")
        .localeCompare(String(right.completedAt || right.updatedAt || right.date || "")));
  }

  function planExercises(plan = {}) {
    const seen = new Set();
    return (plan.sessions || []).flatMap((session) => (session.exercises || []).map((exercise) => ({
      ...exercise,
      sessionId: session.id,
      sessionName: session.name
    }))).filter((exercise) => {
      const code = exercise.exerciseCode || exercise.id;
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
  }

  function recordForExposures(exposures = []) {
    const verified = exposures.filter((item) => item.verifiedForRecord);
    if (!verified.length) return null;
    const loaded = verified.filter((item) => item.topLoad > 0);
    if (loaded.length) {
      const ordered = [...loaded].sort((left, right) =>
        right.topLoad - left.topLoad
        || right.topLoadReps - left.topLoadReps
        || String(right.date || "").localeCompare(String(left.date || ""))
      );
      const best = ordered[0];
      const beforeBest = loaded.filter((item) => item !== best && String(item.date || "") <= String(best.date || ""));
      const previousLoad = beforeBest.length ? Math.max(...beforeBest.map((item) => item.topLoad)) : 0;
      const previousReps = beforeBest
        .filter((item) => item.topLoad === best.topLoad)
        .reduce((maximum, item) => Math.max(maximum, item.topLoadReps), 0);
      return {
        type: "LOAD",
        value: best.topLoad,
        unit: best.unit,
        reps: best.topLoadReps,
        date: best.date,
        executionId: best.executionId,
        newRecord: previousLoad > 0 && (best.topLoad > previousLoad || (best.topLoad === previousLoad && best.topLoadReps > previousReps))
      };
    }
    const ordered = [...verified].sort((left, right) =>
      right.repBest - left.repBest || String(right.date || "").localeCompare(String(left.date || ""))
    );
    const best = ordered[0];
    const previous = ordered.slice(1).reduce((maximum, item) => Math.max(maximum, item.repBest), 0);
    return {
      type: "REPS",
      value: best.repBest,
      unit: best.repUnit || "reps",
      reps: best.repBest,
      date: best.date,
      executionId: best.executionId,
      newRecord: previous > 0 && best.repBest > previous
    };
  }

  function exerciseStatus(exposures = []) {
    if (!exposures.length) {
      return { code: "NO_EVIDENCE", label: "Baseline needed", tone: "neutral", detail: "No recorded work sets yet." };
    }
    const recent = exposures.slice(-4);
    if (recent.some((item) => item.painReported)) {
      return { code: "SAFETY_HOLD", label: "Safety hold", tone: "red", detail: "Pain evidence requires readiness review before progression." };
    }
    const highRpe = recent.slice(-3).filter((item) => item.averageRpe !== null && item.averageRpe >= 9).length;
    if (highRpe >= 2) {
      return { code: "FATIGUE_REVIEW", label: "Fatigue review", tone: "red", detail: "Two recent high-effort exposures warrant recovery review." };
    }
    const verified = recent.filter((item) => item.verifiedForRecord);
    if (verified.length >= 2) {
      const latest = verified.at(-1);
      const previous = verified.slice(0, -1);
      const previousLoad = previous.reduce((maximum, item) => Math.max(maximum, item.topLoad), 0);
      const previousRepsAtLoad = previous
        .filter((item) => item.topLoad === latest.topLoad)
        .reduce((maximum, item) => Math.max(maximum, item.topLoadReps), 0);
      if (latest.topLoad > previousLoad || (latest.topLoad > 0 && latest.topLoad === previousLoad && latest.topLoadReps > previousRepsAtLoad)) {
        return { code: "TRENDING_UP", label: "Progressing", tone: "green", detail: "The latest verified work set improved load or reps." };
      }
      if (!latest.topLoad) {
        const previousRepBest = previous.reduce((maximum, item) => Math.max(maximum, item.repBest), 0);
        if (latest.repBest > previousRepBest) {
          return { code: "TRENDING_UP", label: "Progressing", tone: "green", detail: "The latest verified bodyweight or timed set improved." };
        }
      }
    }
    if (verified.length >= 4) {
      const loadSignature = verified.map((item) => `${item.topLoad}:${item.topLoadReps}`);
      const repSignature = verified.map((item) => item.repBest);
      const stableLoaded = verified.every((item) => item.topLoad > 0) && new Set(loadSignature).size === 1;
      const stableUnloaded = verified.every((item) => item.topLoad === 0) && new Set(repSignature).size === 1;
      if (stableLoaded || stableUnloaded) {
        return { code: "PLATEAU_REVIEW", label: "Plateau review", tone: "yellow", detail: "Four verified exposures are stable without a load or rep improvement." };
      }
    }
    if (exposures.length === 1) {
      return { code: "BASELINE", label: "Baseline recorded", tone: "neutral", detail: "One exposure is recorded; more evidence is needed for a trend." };
    }
    return { code: "STAY_COURSE", label: "Stay course", tone: "neutral", detail: "Evidence supports repeating the current prescription." };
  }

  function exerciseTrajectories(history = [], plan = {}) {
    const exposures = terminalExecutions(history).flatMap(executionExposures);
    const groups = new Map();
    exposures.forEach((item) => {
      const current = groups.get(item.exerciseCode) || [];
      current.push(item);
      groups.set(item.exerciseCode, current);
    });
    const planItems = planExercises(plan);
    planItems.forEach((item) => {
      const code = item.exerciseCode || item.id;
      if (!groups.has(code)) groups.set(code, []);
    });
    const planOrder = new Map(planItems.map((item, index) => [item.exerciseCode || item.id, index]));
    return [...groups.entries()].map(([exerciseCode, items]) => {
      const planned = planItems.find((item) => (item.exerciseCode || item.id) === exerciseCode) || {};
      const sorted = [...items].sort((left, right) => String(left.date || "").localeCompare(String(right.date || "")));
      const latest = sorted.at(-1) || null;
      return {
        exerciseCode,
        exerciseName: latest?.exerciseName || planned.exerciseName || planned.name || exerciseCode,
        pattern: latest?.pattern || planned.pattern || "OTHER",
        patternLabel: latest?.patternLabel || planned.patternLabel || PATTERN_LABELS[planned.pattern] || "Other",
        unit: latest?.unit || planned.unit || "lb",
        exposureCount: sorted.length,
        workSets: sorted.reduce((sum, item) => sum + item.sets, 0),
        totalVolume: sorted.reduce((sum, item) => sum + item.volume, 0),
        latest,
        record: recordForExposures(sorted),
        status: exerciseStatus(sorted),
        exposures: sorted
      };
    }).sort((left, right) => {
      const leftOrder = planOrder.has(left.exerciseCode) ? planOrder.get(left.exerciseCode) : 999;
      const rightOrder = planOrder.has(right.exerciseCode) ? planOrder.get(right.exerciseCode) : 999;
      return leftOrder - rightOrder || left.exerciseName.localeCompare(right.exerciseName);
    });
  }

  function weeklyWorkload(history = []) {
    const groups = new Map();
    terminalExecutions(history).forEach((execution) => {
      const date = dateIso(execution.date || execution.completedAt || execution.updatedAt);
      const weekStart = weekStartIso(date);
      if (!weekStart) return;
      const sets = workSets(execution);
      const current = groups.get(weekStart) || {
        weekStart,
        weekEnd: addDays(weekStart, 6),
        sessionKeys: new Set(),
        attempts: 0,
        workSets: 0,
        volume: 0,
        rpeValues: [],
        units: new Set(),
        stopped: 0,
        pain: 0
      };
      current.sessionKeys.add(`${date || "undated"}:${execution.sessionId || execution.id || "session"}`);
      current.attempts += 1;
      current.workSets += sets.length;
      current.volume += sets.reduce((sum, item) => sum + Number(item.load || 0) * Number(item.reps || 0), 0);
      sets.filter((item) => Number(item.load || 0) > 0).forEach((item) => current.units.add(String(item.unit || "lb").toLowerCase()));
      current.rpeValues.push(...sets.map((item) => item.rpe).filter((item) => item !== null && item !== undefined && item !== ""));
      current.stopped += execution.state === "STOPPED" ? 1 : 0;
      current.pain += execution.painReported ? 1 : 0;
      groups.set(weekStart, current);
    });
    return [...groups.values()].sort((left, right) => left.weekStart.localeCompare(right.weekStart)).map((item) => {
      const units = [...item.units];
      const mixedUnits = units.length > 1;
      return {
        weekStart: item.weekStart,
        weekEnd: item.weekEnd,
        sessions: item.sessionKeys.size,
        attempts: item.attempts,
        workSets: item.workSets,
        volume: mixedUnits ? null : Math.round(item.volume),
        unit: units[0] || null,
        mixedUnits,
        averageRpe: average(item.rpeValues),
        stopped: item.stopped,
        pain: item.pain
      };
    });
  }

  function recentPatternBalance(history = [], today = new Date().toISOString().slice(0, 10)) {
    const cutoff = addDays(today, -27);
    const groups = new Map();
    terminalExecutions(history).flatMap(executionExposures)
      .filter((item) => item.date && item.date >= cutoff && item.date <= today)
      .forEach((item) => {
        const current = groups.get(item.pattern) || {
          code: item.pattern,
          label: item.patternLabel,
          workSets: 0,
          exposures: 0,
          lastDate: null
        };
        current.workSets += item.sets;
        current.exposures += 1;
        current.lastDate = !current.lastDate || item.date > current.lastDate ? item.date : current.lastDate;
        groups.set(item.pattern, current);
      });
    return [...groups.values()].sort((left, right) => right.workSets - left.workSets || left.label.localeCompare(right.label));
  }

  function fatigueSignal(weeks = [], trajectories = []) {
    const painCount = trajectories.reduce((sum, item) => sum + item.exposures.slice(-3).filter((entry) => entry.painReported).length, 0);
    if (painCount) {
      return { code: "SAFETY_HOLD", label: "Safety hold", tone: "red", detail: "Recent pain evidence blocks any implied progression." };
    }
    const highRpeExecutions = new Set(trajectories.flatMap((item) =>
      item.exposures.slice(-3)
        .filter((entry) => entry.averageRpe !== null && entry.averageRpe >= 9)
        .map((entry) => entry.executionId || `${entry.date}:${entry.sessionId}`)
    ));
    const highRpeCount = highRpeExecutions.size;
    const currentWeek = weeks.at(-1) || null;
    const baselineWeeks = weeks.slice(-4, -1).filter((item) => Number.isFinite(item.volume) && item.volume > 0);
    const baselineVolume = baselineWeeks.length >= 2 ? average(baselineWeeks.map((item) => item.volume)) : null;
    const volumeSpike = Boolean(currentWeek && baselineVolume && currentWeek.volume > baselineVolume * 1.3);
    if (highRpeCount >= 2 || volumeSpike) {
      return {
        code: "DELOAD_REVIEW",
        label: "Deload review",
        tone: "yellow",
        detail: volumeSpike
          ? "Recent recorded workload is more than 30% above the established weekly baseline."
          : "Repeated high-effort evidence warrants a recovery or deload review."
      };
    }
    if (highRpeCount === 1 || Number(currentWeek?.stopped || 0) > 0) {
      return { code: "MONITOR", label: "Monitor fatigue", tone: "yellow", detail: "A recent high-effort or stopped attempt warrants observation before progression." };
    }
    return { code: "STABLE", label: "Stable", tone: "green", detail: "Recorded effort and workload do not currently trigger a fatigue guardrail." };
  }

  function coachingPosture(trajectories = [], fatigue = {}) {
    if (fatigue.code === "SAFETY_HOLD") {
      return { code: "SAFETY_HOLD", label: "Safety hold", tone: "red", detail: fatigue.detail };
    }
    if (fatigue.code === "DELOAD_REVIEW") {
      return { code: "DELOAD_REVIEW", label: "Review recovery", tone: "yellow", detail: `${fatigue.detail} Any deload remains a draft until explicitly approved.` };
    }
    const evidence = trajectories.filter((item) => item.exposureCount > 0);
    if (!evidence.length) {
      return { code: "BASELINE_REQUIRED", label: "Establish baselines", tone: "neutral", detail: "Complete work sets before Coach Dominion claims a trend." };
    }
    const plateaus = trajectories.filter((item) => item.status.code === "PLATEAU_REVIEW").length;
    if (plateaus >= 2) {
      return { code: "PLATEAU_REVIEW", label: "Review plateaus", tone: "yellow", detail: `${plateaus} exercises have four stable verified exposures. Review technique, recovery, or a small future programming change.` };
    }
    const improving = trajectories.filter((item) => item.status.code === "TRENDING_UP").length;
    if (improving) {
      return { code: "PROGRESSING", label: "Progressing", tone: "green", detail: `${improving} exercise${improving === 1 ? "" : "s"} improved a verified load or rep best. Keep current safeguards in force.` };
    }
    return { code: "STAY_COURSE", label: "Stay course", tone: "neutral", detail: "The evidence supports repeating the approved program while more exposures accumulate." };
  }

  function buildStrengthIntelligence(history = [], plan = {}, options = {}) {
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const executions = terminalExecutions(history);
    const trajectories = exerciseTrajectories(executions, plan);
    const weeks = weeklyWorkload(executions);
    const patterns = recentPatternBalance(executions, today);
    const fatigue = fatigueSignal(weeks, trajectories);
    const posture = coachingPosture(trajectories, fatigue);
    const occurrenceKeys = new Set(executions.map((item) => `${dateIso(item.date || item.completedAt || item.updatedAt) || "undated"}:${item.sessionId || item.id || "session"}`));
    const verifiedRecords = trajectories.filter((item) => item.record).sort((left, right) =>
      String(right.record.date || "").localeCompare(String(left.record.date || ""))
      || Number(right.record.value || 0) - Number(left.record.value || 0)
    );
    return {
      version: VERSION,
      generatedAt: options.generatedAt || new Date().toISOString(),
      throughDate: today,
      status: executions.length ? "READY" : "BASELINE_REQUIRED",
      summary: {
        sessions: occurrenceKeys.size,
        attempts: executions.length,
        workSets: executions.reduce((sum, item) => sum + workSets(item).length, 0),
        exercisesWithEvidence: trajectories.filter((item) => item.exposureCount > 0).length,
        newRecords: verifiedRecords.filter((item) => item.record.newRecord).length
      },
      posture,
      fatigue,
      trajectories,
      verifiedRecords,
      weeks,
      patterns,
      safeguards: [
        "Warm-up sets are excluded from workload and records.",
        "Substitutions remain visible but never become records for the original exercise.",
        "Missing evidence is neutral; it is not a plateau or a failed workout.",
        "Fatigue and plateau signals propose review only and never alter the approved program."
      ]
    };
  }

  return Object.freeze({
    VERSION,
    TERMINAL_STATES,
    dateIso,
    weekStartIso,
    workSets,
    executionExposures,
    exerciseTrajectories,
    weeklyWorkload,
    recentPatternBalance,
    fatigueSignal,
    coachingPosture,
    buildStrengthIntelligence
  });
});
