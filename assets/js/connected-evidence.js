(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionConnectedEvidence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "027D.1";
  const TRAINING_DOMAINS = new Set(["strength", "running", "core", "conditioning"]);
  const PROVIDER_PRIORITY = Object.freeze({ FITBOD: 60, HEALTH_CONNECT: 50, APPLE_HEALTH: 45, GARMIN: 40, STRAVA: 35, MYFITNESSPAL: 30 });

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function text(value) { return String(value ?? "").trim(); }
  function upper(value) { return text(value).toUpperCase().replace(/[\s-]+/g, "_"); }
  function dateOf(value) {
    const direct = text(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
  }
  function finite(value) { const parsed = Number(value); return value === "" || value === null || value === undefined || !Number.isFinite(parsed) ? null : parsed; }
  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }
  function stableId(prefix, value) {
    const source = stableSerialize(value); let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) { hash ^= source.charCodeAt(index); hash = Math.imul(hash, 16777619); }
    return `${prefix}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  function normalizeDomain(value) {
    const code = upper(value);
    if (["RUN", "RUNNING", "CARDIO", "WALK", "RIDE", "SWIM"].includes(code)) return "running";
    if (["WORKOUT", "LIFT", "STRENGTH", "STRENGTH_SESSION", "EXERCISE_SET"].includes(code)) return "strength";
    if (["CORE", "ABS", "ABS_CORE", "CORE_SESSION"].includes(code)) return "core";
    if (["FUEL", "NUTRITION", "CALORIES", "MACRONUTRIENTS"].includes(code)) return "nutrition";
    if (["READINESS", "ROLL_CALL", "HEART_RATE", "HEART_RATE_VARIABILITY", "SLEEP", "BODYWEIGHT"].includes(code)) return "readiness";
    if (["STEPS", "CLOSEOUT", "DAILY_CLOSEOUT"].includes(code)) return "closeout";
    if (["CONDITIONING", "CONDITIONING_SESSION"].includes(code)) return "conditioning";
    return code.toLowerCase();
  }
  function tokens(value) {
    return new Set(text(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((item) => item.length > 2 && !["workout", "session", "training", "today"].includes(item)));
  }
  function tokenScore(left, right) {
    const a = tokens(left), b = tokens(right);
    if (!a.size || !b.size) return 0;
    return [...a].filter((item) => b.has(item)).length / Math.max(a.size, b.size);
  }
  function recordIdentity(record = {}) {
    return text(record.sourceRecordFingerprint || record.source_record_fingerprint || record.providerRecordId || record.provider_record_id || record.id || stableId("record", record));
  }
  function validRecord(record = {}) {
    return upper(record.validationStatus || record.validation_status || "VALID") === "VALID"
      && !["DUPLICATE", "INVALIDATED", "REJECTED"].includes(upper(record.importStatus || record.import_status));
  }
  function payloadOf(record = {}) { return clone(record.normalizedPayload || record.normalized_payload || {}); }
  function baseEvidence(provider, date, domain, label, metrics, records) {
    const refs = records.map((record) => ({ provider, recordId: recordIdentity(record), fingerprint: record.sourceRecordFingerprint || record.source_record_fingerprint || recordIdentity(record) }));
    return {
      id: stableId("connected", { provider, date, domain, refs: refs.map((item) => item.fingerprint).sort() }),
      provider, date, domain, label, metrics: clone(metrics), sourceRefs: refs,
      completeness: Object.values(metrics || {}).filter((value) => value !== null && value !== undefined && value !== "").length
    };
  }

  function nutritionEvidence(records) {
    const groups = new Map();
    records.filter((record) => record.providerCode === "MYFITNESSPAL" && ["CALORIES", "MACRONUTRIENTS"].includes(record.dataType)).forEach((record) => {
      const date = dateOf(record.occurredAt); if (!date) return;
      const key = `${record.providerCode}|${date}`, payload = payloadOf(record);
      const group = groups.get(key) || { provider: record.providerCode, date, records: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
      group.records.push(record); group.calories += finite(payload.calories) || 0; group.protein += finite(payload.protein_grams ?? payload.protein) || 0;
      group.carbs += finite(payload.carbohydrate_grams ?? payload.carbs) || 0; group.fat += finite(payload.fat_grams ?? payload.fat) || 0; groups.set(key, group);
    });
    return [...groups.values()].map((item) => baseEvidence(item.provider, item.date, "nutrition", "Daily Fuel total", { calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat }, item.records));
  }

  function strengthEvidence(records) {
    const groups = new Map();
    records.filter((record) => record.providerCode === "FITBOD" && record.dataType === "EXERCISE_SET").forEach((record) => {
      const payload = payloadOf(record), date = dateOf(record.occurredAt); if (!date) return;
      const label = text(payload.workout_name) || "Fitbod workout", key = `${date}|${label.toLowerCase()}`;
      const group = groups.get(key) || { date, label, records: [], sets: 0, reps: 0, volume: 0, exercises: new Set() };
      const sets = finite(payload.sets) || 1, reps = finite(payload.repetitions) || 0, load = finite(payload.load) || 0;
      group.records.push(record); group.sets += sets; group.reps += sets * reps; group.volume += sets * reps * load; group.exercises.add(text(payload.exercise_name)); groups.set(key, group);
    });
    return [...groups.values()].map((item) => baseEvidence("FITBOD", item.date, "strength", item.label, { sets: item.sets, reps: item.reps, volume: item.volume, exercises: item.exercises.size }, item.records));
  }

  function healthEvidence(records) {
    const groups = new Map();
    records.filter((record) => ["APPLE_HEALTH", "HEALTH_CONNECT", "GARMIN"].includes(record.providerCode) && ["STEPS", "HEART_RATE", "HEART_RATE_VARIABILITY", "SLEEP", "BODYWEIGHT"].includes(record.dataType)).forEach((record) => {
      const date = dateOf(record.occurredAt); if (!date) return;
      const domain = record.dataType === "STEPS" ? "closeout" : "readiness", key = `${record.providerCode}|${date}|${domain}`, payload = payloadOf(record);
      const group = groups.get(key) || { provider: record.providerCode, date, domain, records: [], metrics: {}, sleepAsleep: 0, sleepInBed: 0 };
      group.records.push(record);
      if (record.dataType === "STEPS") group.metrics.steps = (group.metrics.steps || 0) + (finite(payload.value) || 0);
      if (record.dataType === "HEART_RATE") group.metrics.restingHeartRate = finite(payload.value);
      if (record.dataType === "HEART_RATE_VARIABILITY") group.metrics.heartRateVariability = finite(payload.value);
      if (record.dataType === "SLEEP" && /InBed/i.test(payload.sleep_stage || "")) group.sleepInBed += finite(payload.value) || 0;
      if (record.dataType === "SLEEP" && !/InBed/i.test(payload.sleep_stage || "")) group.sleepAsleep += finite(payload.value) || 0;
      if (record.dataType === "BODYWEIGHT") {
        const rawWeight = finite(payload.value);
        group.metrics.weight = rawWeight === null ? null : /kg/i.test(payload.unit || "") ? Math.round(rawWeight * 2.2046226218 * 10) / 10 : rawWeight;
        group.metrics.weightUnit = "lb";
      }
      groups.set(key, group);
    });
    return [...groups.values()].map((item) => {
      if (item.domain === "readiness" && (item.sleepAsleep || item.sleepInBed)) item.metrics.sleep = Math.round((item.sleepAsleep || item.sleepInBed) * 100) / 100;
      return baseEvidence(item.provider, item.date, item.domain, item.domain === "closeout" ? "Daily steps" : "Health metrics", item.metrics, item.records);
    });
  }

  function workoutEvidence(records) {
    return records.filter((record) => ["RUN", "WALK", "RIDE", "SWIM", "STRENGTH_SESSION", "CORE_SESSION", "CONDITIONING_SESSION"].includes(record.dataType)).map((record) => {
      const payload = payloadOf(record), domain = normalizeDomain(record.dataType), date = dateOf(record.occurredAt);
      return baseEvidence(record.providerCode, date, domain, payload.activity_name || payload.workout_name || record.dataType.replaceAll("_", " "), {
        durationSeconds: finite(payload.duration_seconds), distance: finite(payload.distance), distanceUnit: payload.distance_unit || null,
        calories: finite(payload.calories), sourceActivityCode: payload.activity_code || null
      }, [record]);
    }).filter((item) => item.date);
  }

  function buildProviderEvidence(records = []) {
    const usable = records.filter(validRecord);
    return [...strengthEvidence(usable), ...nutritionEvidence(usable), ...healthEvidence(usable), ...workoutEvidence(usable)]
      .sort((left, right) => `${right.date}|${right.provider}|${right.id}`.localeCompare(`${left.date}|${left.provider}|${left.id}`));
  }

  function normalizeAssignments(assignments = [], evidence = []) {
    const normalized = assignments.map((item, index) => {
      const domain = normalizeDomain(item.domain || item.module || item.type);
      const date = dateOf(item.date || item.scheduledDate || item.scheduled_date);
      return date && domain ? { id: text(item.id || item.activityId || `${date}:${domain}:${index}`), date, domain, label: text(item.label || item.title || item.name || domain), synthetic: false } : null;
    }).filter(Boolean);
    evidence.filter((item) => !TRAINING_DOMAINS.has(item.domain)).forEach((item) => {
      if (!normalized.some((assignment) => assignment.date === item.date && assignment.domain === item.domain)) normalized.push({ id: `${item.date}:${item.domain}`, date: item.date, domain: item.domain, label: item.label, synthetic: true });
    });
    return normalized;
  }

  function assignmentFor(evidence, assignments) {
    const matches = assignments.filter((item) => item.date === evidence.date && item.domain === evidence.domain);
    if (matches.length <= 1) return matches[0] || null;
    const ranked = matches.map((item) => ({ item, score: tokenScore(evidence.label, item.label) })).sort((left, right) => right.score - left.score);
    return ranked[0].score > 0 ? ranked[0].item : null;
  }
  function commonNumericDifferences(left = {}, right = {}) {
    return Object.keys(left).filter((key) => finite(left[key]) !== null && finite(right[key]) !== null).map((key) => {
      const a = finite(left[key]), b = finite(right[key]), base = Math.max(Math.abs(a), Math.abs(b), 1);
      return { key, left: a, right: b, percent: Math.round((Math.abs(a - b) / base) * 100) };
    });
  }
  function materiallyConflicts(left, right) { return commonNumericDifferences(left.metrics, right.metrics).some((item) => item.percent > 12); }
  function selectPrimary(items) {
    return [...items].sort((left, right) => (PROVIDER_PRIORITY[right.provider] || 0) - (PROVIDER_PRIORITY[left.provider] || 0) || right.completeness - left.completeness || left.id.localeCompare(right.id))[0];
  }
  function proofSource(match) {
    const evidence = match.evidence, assignment = match.assignment;
    return {
      id: stableId("connected-proof", `${assignment.date}|${assignment.domain}|${assignment.id}`),
      sourceType: "CONNECTED_EVIDENCE", sourceId: evidence.id, date: assignment.date, domain: assignment.domain,
      kind: TRAINING_DOMAINS.has(assignment.domain) ? "SESSION" : assignment.domain === "nutrition" ? "INTAKE" : assignment.domain === "readiness" ? "ROLL_CALL" : "CLOSEOUT",
      state: "COMPLETE", provider: evidence.provider, source: evidence.provider, machineVerified: true,
      sessionId: assignment.id, sessionName: assignment.label, label: assignment.label, metrics: clone(evidence.metrics), sourceRefs: clone(evidence.sourceRefs)
    };
  }

  function reconcile(input = {}) {
    const generatedAt = input.generatedAt || new Date().toISOString();
    const evidence = buildProviderEvidence(input.records || []);
    const assignments = normalizeAssignments(input.assignments || [], evidence);
    const grouped = new Map(), exceptions = [], ignored = [];
    evidence.forEach((item) => {
      const assignment = assignmentFor(item, assignments);
      if (!assignment) {
        exceptions.push({ id: stableId("exception", `UNMATCHED|${item.id}`), type: "UNMATCHED_ACTIVITY", date: item.date, domain: item.domain, title: `Unmatched ${item.label}`, detail: `${item.provider} evidence does not match a committed ${item.domain} assignment.`, evidence: item });
        return;
      }
      const key = `${assignment.date}|${assignment.domain}|${assignment.id}`;
      if (!grouped.has(key)) grouped.set(key, { assignment, evidence: [] });
      const group = grouped.get(key);
      if (group.evidence.some((existing) => existing.id === item.id || existing.sourceRefs.some((ref) => item.sourceRefs.some((candidate) => candidate.fingerprint === ref.fingerprint)))) ignored.push({ ...item, reason: "DUPLICATE_SOURCE" });
      else group.evidence.push(item);
    });
    const matches = [];
    grouped.forEach((group) => {
      const primary = selectPrimary(group.evidence), conflicts = group.evidence.filter((item) => item.id !== primary.id && materiallyConflicts(primary, item));
      if (conflicts.length) {
        exceptions.push({ id: stableId("exception", `CONFLICT|${group.assignment.date}|${group.assignment.domain}|${group.assignment.id}`), type: "CONFLICTING_EVIDENCE", date: group.assignment.date, domain: group.assignment.domain, title: `Conflicting ${group.assignment.label} evidence`, detail: `${primary.provider} and ${conflicts.map((item) => item.provider).join(" / ")} differ materially.`, assignment: group.assignment, evidence: primary, alternatives: conflicts, differences: conflicts.flatMap((item) => commonNumericDifferences(primary.metrics, item.metrics)) });
        return;
      }
      const combined = { ...primary, metrics: Object.assign({}, ...group.evidence.slice().reverse().map((item) => item.metrics), primary.metrics), sourceRefs: group.evidence.flatMap((item) => item.sourceRefs) };
      matches.push({ assignment: group.assignment, evidence: combined, providers: group.evidence.map((item) => item.provider) });
    });
    const proofSources = matches.map(proofSource);
    const status = exceptions.length ? "REVIEW" : evidence.length ? "CLEAR" : "EMPTY";
    return {
      version: VERSION, id: stableId("connected-evidence", { assignments: assignments.map((item) => item.id), evidence: evidence.map((item) => item.id) }), generatedAt, status,
      headline: status === "REVIEW" ? `${exceptions.length} exception${exceptions.length === 1 ? "" : "s"} need review` : status === "CLEAR" ? "Evidence reconciled" : "No connected evidence yet",
      detail: status === "REVIEW" ? "Only conflicts or unmatched evidence are shown." : status === "CLEAR" ? `${matches.length} assignment${matches.length === 1 ? "" : "s"} verified automatically. No action required.` : "Connect a source when you want automatic proof.",
      counts: { imported: evidence.length, matched: matches.length, exceptions: exceptions.length, ignored: ignored.length }, assignments, matches, exceptions, resolvedExceptions: [], ignored, proofSources
    };
  }

  function resolve(report, exceptionId, resolution, options = {}) {
    const next = clone(report), index = (next.exceptions || []).findIndex((item) => item.id === exceptionId);
    if (index < 0) return next;
    const exception = next.exceptions[index], code = upper(resolution);
    if (code === "USE_PRIMARY" && exception.assignment && exception.evidence) {
      const match = { assignment: exception.assignment, evidence: exception.evidence, providers: [exception.evidence.provider] };
      next.matches.push(match); next.proofSources.push(proofSource(match));
    } else if (code !== "IGNORE") return next;
    next.exceptions.splice(index, 1);
    next.resolvedExceptions = [...(next.resolvedExceptions || []), { ...exception, resolution: code, resolvedAt: options.resolvedAt || new Date().toISOString() }];
    next.counts.exceptions = next.exceptions.length; next.counts.matched = next.matches.length;
    next.status = next.exceptions.length ? "REVIEW" : next.counts.imported ? "CLEAR" : "EMPTY";
    next.headline = next.status === "CLEAR" ? "Evidence reconciled" : next.status === "REVIEW" ? `${next.exceptions.length} exception${next.exceptions.length === 1 ? "" : "s"} need review` : "No connected evidence yet";
    next.detail = next.status === "CLEAR" ? `${next.matches.length} assignment${next.matches.length === 1 ? "" : "s"} verified automatically. No action required.` : "Only conflicts or unmatched evidence are shown.";
    return next;
  }

  function upsertHistory(history = [], report, limit = 90) {
    const items = Array.isArray(history) ? clone(history) : [];
    const index = items.findIndex((item) => item.id === report.id);
    if (index >= 0) items[index] = clone(report); else items.unshift(clone(report));
    return items.sort((left, right) => text(right.generatedAt).localeCompare(text(left.generatedAt))).slice(0, limit);
  }

  return Object.freeze({ VERSION, normalizeDomain, buildProviderEvidence, reconcile, resolve, upsertHistory, proofSource, stableId });
});
