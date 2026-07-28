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
    return {
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
  function sessionTypes(profile) {
    const indexes = runningDayIndexes(profile.runningDaysPerWeek);
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
    const planBaseline = resolvePlanBaseline(profile, command.baseline);
    if (!planBaseline) return { status: "BASELINE_REQUIRED", weekStart, sessions: [], command, message: "Add recent running evidence or declare a current weekly distance before generating a plan." };
    if (!command.zones.length) return { status: "PACE_REQUIRED", weekStart, sessions: [], command, message: "Add a valid benchmark before generating pace-governed sessions." };
    const weeklyDistance = Number(planBaseline.distance.toFixed(1));
    const types = sessionTypes(profile);
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
      const distance = Number(run.distance.toFixed(1));
      const averagePace = zone ? (zone.fastSecondsPerUnit + zone.slowSecondsPerUnit) / 2 : 0;
      return {
        date: addDays(weekStart, dayIndex), dayIndex, type: run.type,
        title: run.type === "LONG" ? "Controlled long run" : run.type === "TEMPO" ? "Tempo development" : run.type === "INTERVAL" ? "Interval session" : "Easy aerobic run",
        distance, unit: profile.preferredUnit, zone: zone?.code || null,
        paceFast: zone?.fastSecondsPerUnit || null, paceSlow: zone?.slowSecondsPerUnit || null,
        estimatedMinutes: Math.round(distance * averagePace / 60)
      };
    });
    return {
      status: "READY", weekStart, weekEnd: addDays(weekStart, 6), weeklyDistance, unit: profile.preferredUnit,
      baselineSource: planBaseline.source, sessions, command,
      safeguards: {
        progressionPercent: 0,
        longRunSharePercent: Math.round((sessions.find((item) => item.type === "LONG")?.distance || 0) / weeklyDistance * 100),
        qualitySessions: sessions.filter((item) => ["TEMPO", "INTERVAL"].includes(item.type)).length,
        approvalRequired: true
      },
      message: "This first weekly plan holds the established baseline. Future progression requires completed-week evidence and readiness review."
    };
  }

  return {
    GOALS, DISTANCE_KM, ZONE_RULES, normalizeProfile, distanceToKm, formatDuration, formatPace,
    runningEntryEvidence, selectBenchmark, equivalentFiveKilometerPace, derivePaceZones,
    deriveMileageBaseline, buildRunningCommand, weekStartIso, runningDayIndexes, buildWeeklyRunningPlan
  };
});
