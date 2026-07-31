(function runningCommandModule(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.DominionRunning = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRunningCommand() {
  "use strict";

  const GOALS = Object.freeze(["GENERAL_FITNESS", "5K", "10K", "HALF_MARATHON", "MARATHON"]);
  const UNITS = Object.freeze(["mi", "km"]);
  const DISTANCE_KM = Object.freeze({ "1_MILE": 1.609344, "5K": 5, "10K": 10, "HALF_MARATHON": 21.0975, "MARATHON": 42.195 });
  const ZONE_RULES = Object.freeze([
    { code: "RECOVERY", label: "Recovery", fast: 1.30, slow: 1.45, purpose: "Low-stress movement and recovery." },
    { code: "EASY", label: "Easy", fast: 1.20, slow: 1.35, purpose: "Aerobic development and routine mileage." },
    { code: "LONG", label: "Long", fast: 1.15, slow: 1.30, purpose: "Durability at controlled effort." },
    { code: "TEMPO", label: "Tempo", fast: 1.03, slow: 1.10, purpose: "Sustained, comfortably hard work." },
    { code: "INTERVAL", label: "Interval", fast: 0.92, slow: 1.00, purpose: "Short controlled repetitions with recovery." }
  ]);
  const EFFORT_RULES = Object.freeze({
    RECOVERY: { rpe: "2-3", cue: "Very easy. You should be able to breathe through your nose and speak freely." },
    EASY: { rpe: "3-4", cue: "Conversational effort. Finish feeling like you could continue." },
    LONG: { rpe: "3-5", cue: "Controlled aerobic effort. Keep the final third as calm as the first." },
    TEMPO: { rpe: "6-7", cue: "Comfortably hard, controlled, and never straining." },
    INTERVAL: { rpe: "7-8", cue: "Fast but repeatable. Stop the set before form or pace breaks down." }
  });
  const BLOCK_PHASES = Object.freeze([
    { code: "FOUNDATION", label: "Foundation", multiplier: 1 },
    { code: "BUILD_1", label: "Build", multiplier: 1.05 },
    { code: "BUILD_2", label: "Build", multiplier: 1.10 },
    { code: "CONSOLIDATE", label: "Consolidate", multiplier: 0.90 }
  ]);

  function finite(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function dateIso(value) {
    const text = String(value || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }
  function normalizeGoal(value) {
    const goal = String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
    return GOALS.includes(goal) ? goal : "GENERAL_FITNESS";
  }
  function normalizeUnit(value) { return UNITS.includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "mi"; }
  function normalizeProfile(input = {}) {
    const benchmarkDistance = String(input.benchmarkDistance || input.benchmark_distance || "").toUpperCase();
    const profile = {
      goal: normalizeGoal(input.goal),
      targetDate: dateIso(input.targetDate || input.target_date),
      runningDaysPerWeek: clamp(Math.round(finite(input.runningDaysPerWeek ?? input.running_days_per_week) || 3), 1, 7),
      preferredUnit: normalizeUnit(input.preferredUnit || input.preferred_unit),
      declaredWeeklyDistance: finite(input.declaredWeeklyDistance ?? input.declared_weekly_distance),
      benchmarkDistance: DISTANCE_KM[benchmarkDistance] ? benchmarkDistance : null,
      benchmarkSeconds: Math.round(finite(input.benchmarkSeconds ?? input.benchmark_seconds) || 0) || null,
      benchmarkDate: dateIso(input.benchmarkDate || input.benchmark_date),
      approvedAt: input.approvedAt || input.approved_at || null,
      updatedAt: input.updatedAt || input.updated_at || null
    };
    const recruitContractId = input.recruitContractId || input.recruit_contract_id || null;
    const recruitContractRevision = finite(input.recruitContractRevision ?? input.recruit_contract_revision);
    if (recruitContractId) profile.recruitContractId = String(recruitContractId);
    if (recruitContractRevision !== null) profile.recruitContractRevision = Math.max(1, Math.round(recruitContractRevision));
    return profile;
  }
  function distanceToKm(distance, unit = "mi") {
    const value = finite(distance);
    if (!(value > 0)) return null;
    return normalizeUnit(unit) === "mi" ? value * 1.609344 : value;
  }
  function distanceFromKm(distanceKm, unit = "mi") {
    return normalizeUnit(unit) === "mi" ? distanceKm / 1.609344 : distanceKm;
  }
  function formatDuration(seconds) {
    const value = Math.max(0, Math.round(finite(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const remaining = value % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}` : `${minutes}:${String(remaining).padStart(2, "0")}`;
  }
  function formatPace(secondsPerUnit, unit = "mi") {
    return `${formatDuration(secondsPerUnit)}/${normalizeUnit(unit)}`;
  }
  function runningEntryEvidence(entry = {}) {
    const metrics = entry.metrics || {};
    const distanceKm = distanceToKm(metrics.distance, metrics.distance_unit || metrics.distanceUnit || "mi");
    const durationSeconds = finite(metrics.duration_seconds ?? metrics.durationSeconds);
    if (entry.domain !== "running" || !(distanceKm > 0) || !(durationSeconds > 0)) return null;
    return {
      id: entry.id || null,
      date: dateIso(entry.performanceDate || entry.performance_date),
      distanceKm,
      durationSeconds,
      entryType: String(entry.entryType || entry.entry_type || "").toUpperCase(),
      evidenceStatus: String(entry.evidenceStatus || entry.evidence_status || "SELF REPORTED").toUpperCase(),
      source: entry.provenance?.sourceProvider || entry.source || "MANUAL"
    };
  }
  function selectBenchmark(profileInput = {}, entries = []) {
    const profile = normalizeProfile(profileInput);
    const candidates = (entries || []).map(runningEntryEvidence).filter(Boolean)
      .filter((item) => item.entryType === "RACE" || item.entryType === "FORMAL_TEST" || item.entryType === "BENCHMARK")
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    if (profile.benchmarkDistance && profile.benchmarkSeconds > 0) {
      return {
        source: "PROFILE",
        sourceLabel: "Approved profile benchmark",
        date: profile.benchmarkDate,
        distanceKm: DISTANCE_KM[profile.benchmarkDistance],
        durationSeconds: profile.benchmarkSeconds,
        evidenceStatus: "SELF REPORTED"
      };
    }
    const candidate = candidates[0];
    return candidate ? { ...candidate, sourceLabel: `${candidate.source} ${candidate.entryType.replaceAll("_", " ").toLowerCase()}` } : null;
  }
  function equivalentFiveKilometerPace(benchmark) {
    if (!benchmark || !(benchmark.distanceKm > 0) || !(benchmark.durationSeconds > 0)) return null;
    const fiveKilometerSeconds = benchmark.durationSeconds * Math.pow(5 / benchmark.distanceKm, 1.06);
    return fiveKilometerSeconds / 5;
  }
  function derivePaceZones(profileInput = {}, entries = []) {
    const profile = normalizeProfile(profileInput);
    const benchmark = selectBenchmark(profile, entries);
    const pacePerKm = equivalentFiveKilometerPace(benchmark);
    if (!pacePerKm) return { status: "INSUFFICIENT_EVIDENCE", benchmark: null, zones: [], message: "Add an approved benchmark or a timed race/test to calculate planning pace zones." };
    const multiplier = profile.preferredUnit === "mi" ? 1.609344 : 1;
    const zones = ZONE_RULES.map((rule) => ({
      code: rule.code,
      label: rule.label,
      fastSecondsPerUnit: Math.round(pacePerKm * rule.fast * multiplier),
      slowSecondsPerUnit: Math.round(pacePerKm * rule.slow * multiplier),
      purpose: rule.purpose
    }));
    return {
      status: "READY",
      benchmark,
      zones,
      message: "Planning estimates derived deterministically from the selected benchmark; effort, terrain, weather, and pain still govern execution."
    };
  }
  function deriveMileageBaseline(entries = [], options = {}) {
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    const end = Date.parse(`${today}T23:59:59Z`);
    const start = end - (27 * 86400000);
    const runs = (entries || []).map(runningEntryEvidence).filter(Boolean).filter((run) => {
      const epoch = Date.parse(`${run.date || ""}T12:00:00Z`);
      return Number.isFinite(epoch) && epoch >= start && epoch <= end;
    });
    const distanceKm = runs.reduce((total, run) => total + run.distanceKm, 0);
    const preferredUnit = normalizeUnit(options.preferredUnit);
    return {
      status: runs.length ? "OBSERVED" : "NO_DATA",
      runCount: runs.length,
      fourWeekDistance: Number(distanceFromKm(distanceKm, preferredUnit).toFixed(1)),
      averageWeeklyDistance: Number(distanceFromKm(distanceKm / 4, preferredUnit).toFixed(1)),
      unit: preferredUnit,
      windowStart: new Date(start).toISOString().slice(0, 10),
      windowEnd: today
    };
  }
  function buildRunningCommand(profileInput = {}, entries = [], options = {}) {
    const profile = normalizeProfile(profileInput);
    const pace = derivePaceZones(profile, entries);
    const baseline = deriveMileageBaseline(entries, { ...options, preferredUnit: profile.preferredUnit });
    const readiness = !profile.approvedAt ? "PROFILE_DRAFT" : pace.status !== "READY" ? "BENCHMARK_REQUIRED" : baseline.status !== "OBSERVED" ? "BASELINE_LIMITED" : "READY";
    return {
      profile,
      readiness,
      benchmark: pace.benchmark,
      zones: pace.zones,
      baseline,
      message: readiness === "PROFILE_DRAFT" ? "Approve the running profile to establish the planning contract." : readiness === "BENCHMARK_REQUIRED" ? pace.message : readiness === "BASELINE_LIMITED" ? "Pace zones are available, but recent mileage is missing. Begin conservatively until four weeks of evidence accumulates." : pace.message
    };
  }
  function weekStartIso(today) {
    const date = new Date(`${dateIso(today) || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
    const offset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  }
  function addDays(date, days) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }
  function runningDayIndexes(days) {
    return {
      1: [5], 2: [2, 5], 3: [1, 3, 6], 4: [1, 3, 5, 6],
      5: [0, 1, 3, 5, 6], 6: [0, 1, 2, 3, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6]
    }[clamp(days, 1, 7)];
  }
  function sessionTypes(profile, preferredIndexes = null) {
    const normalizedIndexes = Array.isArray(preferredIndexes)
      ? [...new Set(preferredIndexes.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))]
      : [];
    const indexes = normalizedIndexes.length === profile.runningDaysPerWeek
      ? normalizedIndexes.sort((a, b) => a - b)
      : runningDayIndexes(profile.runningDaysPerWeek);
    const types = new Map(indexes.map((day) => [day, "EASY"]));
    if (indexes.length >= 2) types.set(indexes[indexes.length - 1], "LONG");
    if (indexes.length >= 3) types.set(indexes[Math.floor(indexes.length / 2) - 1], profile.goal === "5K" ? "INTERVAL" : "TEMPO");
    if (indexes.length >= 6) types.set(indexes[0], "INTERVAL");
    return types;
  }
  function resolvePlanBaseline(profile, baseline) {
    if (baseline.status === "OBSERVED" && baseline.averageWeeklyDistance > 0) return { distance: baseline.averageWeeklyDistance, source: "OBSERVED_28_DAY_AVERAGE" };
    if (profile.declaredWeeklyDistance > 0) return { distance: profile.declaredWeeklyDistance, source: "ATHLETE_DECLARED" };
    return null;
  }
  function zoneForType(type, zones) {
    const code = type === "REST" ? null : type;
    return zones.find((zone) => zone.code === code) || zones.find((zone) => zone.code === "EASY") || null;
  }
  function buildWeeklyRunningPlan(profileInput = {}, entries = [], options = {}) {
    const command = buildRunningCommand(profileInput, entries, options);
    const profile = command.profile;
    const weekStart = weekStartIso(options.today);
    if (!profile.approvedAt) return { status: "PROFILE_REQUIRED", weekStart, sessions: [], command, message: "Approve the running profile before generating a weekly plan." };
    const overrideDistance = finite(options.weeklyDistance);
    const planBaseline = overrideDistance > 0
      ? { distance: overrideDistance, source: options.baselineSource || "BLOCK_PRESCRIPTION" }
      : resolvePlanBaseline(profile, command.baseline);
    if (!planBaseline) return { status: "BASELINE_REQUIRED", weekStart, sessions: [], command, message: "Add recent running evidence or declare a current weekly distance before generating a plan." };
    const weeklyDistance = Number(planBaseline.distance.toFixed(1));
    const types = sessionTypes(profile, options.runningDayIndexes);
    const weights = { EASY: 1, RECOVERY: 0.75, TEMPO: 0.85, INTERVAL: 0.75, LONG: 1.4 };
    const weightTotal = [...types.values()].reduce((total, type) => total + weights[type], 0);
    const raw = [...types.entries()].map(([dayIndex, type]) => ({
      dayIndex, type, distance: weeklyDistance * weights[type] / weightTotal
    }));
    const longSession = raw.find((item) => item.type === "LONG");
    if (longSession) longSession.distance = Math.min(longSession.distance, weeklyDistance * 0.35);
    raw.filter((item) => ["TEMPO", "INTERVAL"].includes(item.type)).forEach((item) => {
      item.distance = Math.min(item.distance, weeklyDistance * 0.20);
    });
    const allocated = raw.reduce((total, item) => total + item.distance, 0);
    const remainder = weeklyDistance - allocated;
    const easySessions = raw.filter((item) => item.type === "EASY");
    if (remainder > 0 && easySessions.length) easySessions.forEach((item) => { item.distance += remainder / easySessions.length; });
    const sessions = Array.from({ length: 7 }, (_, dayIndex) => {
      const run = raw.find((item) => item.dayIndex === dayIndex);
      if (!run) return { date: addDays(weekStart, dayIndex), dayIndex, type: "REST", title: "Recovery / no prescribed run", distance: 0, unit: profile.preferredUnit, zone: null, estimatedMinutes: 0 };
      const zone = zoneForType(run.type, command.zones);
      const effort = EFFORT_RULES[run.type] || EFFORT_RULES.EASY;
      const distance = Number(run.distance.toFixed(1));
      const averagePace = zone
        ? (zone.fastSecondsPerUnit + zone.slowSecondsPerUnit) / 2
        : profile.preferredUnit === "mi" ? 660 : 410;
      return {
        date: addDays(weekStart, dayIndex), dayIndex, type: run.type,
        title: run.type === "LONG" ? "Controlled long run" : run.type === "TEMPO" ? "Tempo development" : run.type === "INTERVAL" ? "Interval session" : "Easy aerobic run",
        distance, unit: profile.preferredUnit, zone: zone?.code || null,
        paceFast: zone?.fastSecondsPerUnit || null, paceSlow: zone?.slowSecondsPerUnit || null,
        effortRpe: effort.rpe, effortCue: effort.cue,
        estimatedMinutes: Math.round(distance * averagePace / 60)
      };
    });
    return {
      status: "READY", weekStart, weekEnd: addDays(weekStart, 6), weeklyDistance, unit: profile.preferredUnit,
      baselineSource: planBaseline.source, sessions, command,
      prescriptionMode: command.zones.length ? "PACE" : "EFFORT",
      safeguards: {
        progressionPercent: 0,
        longRunSharePercent: Math.round((sessions.find((item) => item.type === "LONG")?.distance || 0) / weeklyDistance * 100),
        qualitySessions: sessions.filter((item) => ["TEMPO", "INTERVAL"].includes(item.type)).length,
        approvalRequired: true
      },
      message: command.zones.length
        ? "Pace and effort are anchored to the approved benchmark. Readiness and pain still govern execution."
        : "No benchmark is required to begin. Sessions use RPE and talk-test guidance until valid pace evidence is available."
    };
  }

  function contractRunDayIndexes(schedule = [], expectedDays = null) {
    if (!Array.isArray(schedule)) return [];
    const indexes = schedule
      .map((day, index) => ({ day, index }))
      .filter(({ day }) => Array.isArray(day?.activities) && day.activities.includes("RUNNING"))
      .map(({ index }) => index);
    return expectedDays === null || indexes.length === Number(expectedDays) ? indexes : [];
  }

  function runningFingerprint(value = {}) {
    const text = JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `rb-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function buildRunningBlock(profileInput = {}, entries = [], options = {}) {
    const profile = normalizeProfile(profileInput);
    const startDate = weekStartIso(options.startDate || options.today);
    const command = buildRunningCommand(profile, entries, { today: options.today || startDate });
    if (!profile.approvedAt) {
      return { status: "PROFILE_REQUIRED", id: null, weeks: [], profile, command, message: "Approve the running setup before building a four-week plan." };
    }
    if (profile.runningDaysPerWeek > 6) {
      return { status: "RECOVERY_REQUIRED", id: null, weeks: [], profile, command, message: "Running plans are capped at six days so one full recovery day remains protected." };
    }
    const baseline = resolvePlanBaseline(profile, command.baseline);
    if (!baseline) {
      return { status: "BASELINE_REQUIRED", id: null, weeks: [], profile, command, message: "Add a current weekly distance or recent running evidence before committing a plan." };
    }
    const scheduledIndexes = contractRunDayIndexes(options.contractSchedule, profile.runningDaysPerWeek);
    const fallbackIndexes = runningDayIndexes(profile.runningDaysPerWeek);
    const runDayIndexes = scheduledIndexes.length ? scheduledIndexes : fallbackIndexes;
    const weeks = BLOCK_PHASES.map((phase, index) => {
      const weekStart = addDays(startDate, index * 7);
      const weeklyDistance = Number((baseline.distance * phase.multiplier).toFixed(1));
      const week = buildWeeklyRunningPlan(profile, entries, {
        today: weekStart,
        weeklyDistance,
        baselineSource: baseline.source,
        runningDayIndexes: runDayIndexes
      });
      return {
        ...week,
        weekNumber: index + 1,
        phase: phase.code,
        phaseLabel: phase.label,
        progressionFromBaselinePercent: Math.round((phase.multiplier - 1) * 100)
      };
    });
    const contractId = options.recruitContractId || profile.recruitContractId || null;
    const contractRevision = finite(options.recruitContractRevision ?? profile.recruitContractRevision);
    const identityInput = {
      startDate,
      profile,
      contractId,
      contractRevision,
      weeklyDistance: weeks.map((week) => week.weeklyDistance),
      runDayIndexes
    };
    const id = runningFingerprint(identityInput);
    return {
      id,
      revision: null,
      status: "DRAFT",
      startDate,
      endDate: weeks[weeks.length - 1].weekEnd,
      generatedAt: options.generatedAt || new Date().toISOString(),
      approvedAt: null,
      recruitContractId: contractId,
      recruitContractRevision: contractRevision === null ? null : Math.round(contractRevision),
      profile,
      command,
      runDayIndexes,
      baselineSource: baseline.source,
      baselineDistance: Number(baseline.distance.toFixed(1)),
      prescriptionMode: command.zones.length ? "PACE" : "EFFORT",
      weeks,
      safeguards: {
        recoveryDaysPerWeek: 7 - profile.runningDaysPerWeek,
        maximumWeeklyProgressionPercent: 5,
        consolidationWeek: 4,
        approvalRequired: true,
        activePlanProtected: true
      },
      message: command.zones.length
        ? "Four weeks are ready for review with pace and effort guidance. Approval is required before the block becomes active."
        : "Four weeks are ready for review using effort guidance. Add a benchmark later to sharpen pace targets without blocking training."
    };
  }

  function approveRunningBlock(draft = {}, previousApproved = null, options = {}) {
    if (draft.status !== "DRAFT" || !draft.id || !Array.isArray(draft.weeks) || draft.weeks.length !== 4) {
      throw new Error("Only a complete four-week running draft can be approved.");
    }
    const approvedAt = options.approvedAt || new Date().toISOString();
    return {
      ...draft,
      revision: previousApproved?.status === "APPROVED" ? Number(previousApproved.revision || 0) + 1 : 1,
      status: "APPROVED",
      approvedAt,
      supersedesId: previousApproved?.id || null,
      safeguards: { ...draft.safeguards, approvalRequired: false }
    };
  }

  function weeklyPlanForDate(block = {}, value = null) {
    if (block.status !== "APPROVED" || !Array.isArray(block.weeks)) return null;
    const date = dateIso(value) || new Date().toISOString().slice(0, 10);
    const week = block.weeks.find((item) => date >= item.weekStart && date <= item.weekEnd);
    return week ? { ...week, status: "READY", blockId: block.id, blockRevision: block.revision, blockApprovedAt: block.approvedAt } : null;
  }

  function blockContractState(block = null, contract = null) {
    if (!block) return "PLAN_REQUIRED";
    if (!contract?.id) return "UNLINKED";
    if (block.recruitContractId === contract.id && Number(block.recruitContractRevision || 0) === Number(contract.revision || 0)) return "ALIGNED";
    return "CONTRACT_UPDATE_AVAILABLE";
  }
  function reconcileWeeklyRunningPlan(plan = {}, entries = [], options = {}) {
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    if (plan.status !== "READY" || !Array.isArray(plan.sessions)) {
      return { status: "PLAN_REQUIRED", days: [], unmatchedRuns: [], summary: {}, message: "Approve a valid weekly plan before reconciling run evidence." };
    }
    const evidence = (entries || []).map(runningEntryEvidence).filter(Boolean);
    const plannedDates = new Set(plan.sessions.map((session) => session.date));
    const weekEvidence = evidence.filter((run) => run.date >= plan.weekStart && run.date <= plan.weekEnd);
    const unmatchedRuns = weekEvidence.filter((run) => !plannedDates.has(run.date));
    const days = plan.sessions.map((session) => {
      const runs = weekEvidence.filter((run) => run.date === session.date);
      const actualDistanceKm = runs.reduce((total, run) => total + run.distanceKm, 0);
      const actualDistance = Number(distanceFromKm(actualDistanceKm, session.unit || plan.unit).toFixed(2));
      const actualDurationSeconds = runs.reduce((total, run) => total + run.durationSeconds, 0);
      const actualPace = actualDistance > 0 ? actualDurationSeconds / actualDistance : null;
      if (session.type === "REST") {
        return { ...session, classification: runs.length ? "UNPLANNED" : "REST", runs, actualDistance, actualDurationSeconds, actualPace, reason: runs.length ? "Run evidence exists on a non-running day; review before changing the plan." : "No run prescribed." };
      }
      if (!runs.length) {
        const classification = session.date > today ? "UPCOMING" : session.date === today ? "AWAITING_EVIDENCE" : "MISSED";
        return { ...session, classification, runs: [], actualDistance: 0, actualDurationSeconds: 0, actualPace: null, reason: classification === "MISSED" ? "No run evidence was found after the planned date." : classification === "UPCOMING" ? "Planned date has not arrived." : "Waiting for imported or manual run evidence." };
      }
      const distanceRatio = session.distance > 0 ? actualDistance / session.distance : 0;
      const paceInside = !actualPace || !session.paceFast || (actualPace >= session.paceFast * 0.90 && actualPace <= session.paceSlow * 1.10);
      let classification = "REVIEW_REQUIRED";
      let reason = "Completed evidence differs materially from the approved prescription.";
      if (distanceRatio >= 0.90 && distanceRatio <= 1.10 && paceInside) {
        classification = "MATCHED";
        reason = "Distance and pace align with the approved session.";
      } else if (distanceRatio >= 0.60 && distanceRatio < 0.90) {
        classification = "PARTIAL";
        reason = "At least 60% of planned distance was observed.";
      } else if (distanceRatio > 1.10) {
        reason = "Observed distance exceeds the approved session by more than 10%.";
      } else if (!paceInside) {
        reason = "Observed pace falls outside the plan tolerance.";
      } else {
        reason = "Less than 60% of planned distance was observed.";
      }
      return { ...session, classification, runs, actualDistance, actualDurationSeconds, actualPace, distanceRatio: Number(distanceRatio.toFixed(3)), reason };
    });
    const counts = {};
    days.forEach((day) => { counts[day.classification] = (counts[day.classification] || 0) + 1; });
    const completed = (counts.MATCHED || 0) + (counts.PARTIAL || 0);
    const prescribed = days.filter((day) => day.type !== "REST").length;
    const needsReview = days.some((day) => ["REVIEW_REQUIRED", "UNPLANNED"].includes(day.classification)) || unmatchedRuns.length;
    const stillOpen = days.some((day) => ["UPCOMING", "AWAITING_EVIDENCE"].includes(day.classification));
    return {
      status: needsReview ? "REVIEW_REQUIRED" : stillOpen ? "IN_PROGRESS" : "READY",
      days, unmatchedRuns,
      summary: { ...counts, prescribed, completed, completionPercent: prescribed ? Math.round(completed / prescribed * 100) : 0, evidenceRunCount: weekEvidence.length },
      message: "Imported and manual evidence is matched by calendar date. Ambiguous or excess work requires explicit review."
    };
  }
  function buildDailyRunPrescription(plan = {}, options = {}) {
    const today = dateIso(options.today) || new Date().toISOString().slice(0, 10);
    if (plan.status !== "READY" || !Array.isArray(plan.sessions)) return { status: "PLAN_REQUIRED", date: today, session: null, steps: [], message: "Approve a weekly running plan first." };
    const planned = plan.sessions.find((session) => session.date === today);
    if (!planned || planned.type === "REST") return { status: "REST_DAY", date: today, session: planned || null, steps: [], message: "No run is prescribed today. Preserve recovery." };
    const readiness = options.readiness || {};
    const pain = readiness.pain === true || String(readiness.pain).toLowerCase() === "yes";
    const energy = finite(readiness.energy);
    const soreness = finite(readiness.soreness);
    let factor = 1, type = planned.type, reason = "No readiness adjustment.";
    if (pain) { factor = 0; reason = "Pain reported: running is held."; }
    else if ((energy !== null && energy <= 3) || (soreness !== null && soreness >= 8)) { factor = 0.5; type = "RECOVERY"; reason = "Low readiness: distance reduced 50% and intensity removed."; }
    else if ((energy !== null && energy <= 5) || (soreness !== null && soreness >= 6)) { factor = 0.8; type = "EASY"; reason = "Moderate readiness: distance reduced 20% and intensity capped at easy."; }
    const distance = Number((planned.distance * factor).toFixed(1));
    const paceZone = factor < 1 ? plan.command?.zones?.find((zone) => zone.code === (type === "RECOVERY" ? "RECOVERY" : "EASY")) : null;
    const paceFast = paceZone?.fastSecondsPerUnit || planned.paceFast;
    const paceSlow = paceZone?.slowSecondsPerUnit || planned.paceSlow;
    const effort = EFFORT_RULES[type] || EFFORT_RULES.EASY;
    const work = type === "INTERVAL"
      ? `Complete controlled repetitions totaling ${distance} ${planned.unit}; recover easily between efforts.`
      : type === "TEMPO"
        ? `Run ${distance} ${planned.unit} with the middle portion at tempo effort.`
        : `Run ${distance} ${planned.unit} continuously at ${type.toLowerCase()} effort.`;
    return {
      status: pain ? "PAIN_HOLD" : factor < 1 ? "ADJUSTED" : "READY",
      date: today,
      original: planned,
      session: {
        ...planned,
        type,
        distance,
        paceFast,
        paceSlow,
        effortRpe: effort.rpe,
        effortCue: effort.cue,
        estimatedMinutes: factor === 0 ? 0 : Math.max(1, Math.round((planned.estimatedMinutes || 0) * factor))
      },
      adjustment: { factor, distanceDelta: Number((distance - planned.distance).toFixed(1)), typeChanged: type !== planned.type, reason },
      steps: pain ? [{ code: "STOP", title: "Do not start", instruction: "Report pain and choose a non-impact recovery action." }] : [
        { code: "WARM_UP", title: "Warm-up", instruction: "5–10 minutes easy movement, then dynamic drills and two relaxed strides." },
        { code: "WORK", title: "Main run", instruction: work },
        { code: "COOL_DOWN", title: "Cooldown", instruction: "5–10 minutes easy movement, then record pain, effort, distance, and duration." }
      ],
      message: reason
    };
  }

  return {
    GOALS, DISTANCE_KM, ZONE_RULES, EFFORT_RULES, BLOCK_PHASES, normalizeProfile, distanceToKm, formatDuration, formatPace,
    runningEntryEvidence, selectBenchmark, equivalentFiveKilometerPace, derivePaceZones,
    deriveMileageBaseline, buildRunningCommand, weekStartIso, runningDayIndexes, buildWeeklyRunningPlan,
    contractRunDayIndexes, buildRunningBlock, approveRunningBlock, weeklyPlanForDate, blockContractState,
    reconcileWeeklyRunningPlan, buildDailyRunPrescription
  };
});
