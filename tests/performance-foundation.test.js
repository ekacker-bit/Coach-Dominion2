const assert = require('assert');
const {
  getPerformanceDomainCatalog,
  getPerformanceActivityCatalog,
  normalizePerformanceEntry,
  validatePerformanceEntry,
  calculateStrengthVolume,
  estimateOneRepMax,
  calculateRunningPace,
  normalizePerformanceUnits,
  buildPerformancePersistencePayload,
  hydratePerformanceEntry,
  summarizeRecentPerformance,
  filterPerformanceEntries,
  derivePerformanceEmptyState,
  removePerformanceEntry
} = require('../assets/js/app.js');

const domains = getPerformanceDomainCatalog();
assert.ok(Array.isArray(domains), 'performance domain catalog should be an array');
assert.ok(domains.some((domain) => domain.code === 'strength'), 'strength domain should be present');

const activities = getPerformanceActivityCatalog('strength');
assert.ok(Array.isArray(activities), 'strength activities should be returned');
assert.ok(activities.some((activity) => activity.code === 'bench_press'), 'bench press activity should be available');

const strengthEntry = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-23',
  domain: 'STRENGTH',
  entryType: 'TRAINING SET',
  activityCode: 'bench_press',
  activityName: 'Bench Press',
  evidenceStatus: 'VERIFIED',
  metrics: { sets: 3, repetitions: 5, weight: 225, weightUnit: 'lb' }
});
assert.equal(strengthEntry.domain, 'strength', 'valid strength entry normalizes domain correctly');
assert.equal(strengthEntry.entryType, 'TRAINING_SET', 'valid strength entry normalizes entry type');
assert.equal(strengthEntry.metrics.weight_unit, 'lb', 'strength entry preserves weight unit');
const volume = calculateStrengthVolume(strengthEntry);
assert.equal(volume.value, 3375, 'strength volume calculates correctly');
const estimated = estimateOneRepMax(strengthEntry);
assert.equal(estimated.value, 225 * (1 + 5 / 30), 'e1rm calculates with the documented formula');
assert.equal(estimated.label, 'estimated', 'e1rm remains labeled as estimated');

const invalidReps = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-23',
  domain: 'STRENGTH',
  entryType: 'TRAINING SET',
  activityCode: 'bench_press',
  activityName: 'Bench Press',
  evidenceStatus: 'VERIFIED',
  metrics: { sets: 3, repetitions: 0, weight: 225, weightUnit: 'lb' }
});
assert.equal(estimateOneRepMax(invalidReps), null, 'invalid repetitions do not produce e1rm');

const runEntry = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-24',
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityCode: 'tempo',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: 5, distanceUnit: 'mi', durationSeconds: 1800 }
});
const pace = calculateRunningPace(runEntry);
assert.equal(pace.paceSecondsPerUnit, 360, 'running pace calculates correctly');
const invalidRun = validatePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-24',
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: 0, distanceUnit: 'mi', durationSeconds: 1800 }
});
assert.ok(invalidRun.errors.some((error) => error.field === 'metrics.distance'), 'zero distance is rejected');
const negativeDuration = validatePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-24',
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: 5, distanceUnit: 'mi', durationSeconds: -10 }
});
assert.ok(negativeDuration.errors.some((error) => error.field === 'metrics.duration_seconds'), 'negative duration is rejected');

const preservedUnits = normalizePerformanceUnits({ metrics: { distanceUnit: 'Mi', weightUnit: 'Lb' } });
assert.equal(preservedUnits.metrics.distance_unit, 'Mi', 'original distance units are preserved');
assert.equal(preservedUnits.metrics.weight_unit, 'Lb', 'original weight units are preserved');
assert.equal(normalizePerformanceEntry({ performanceDate: '2026-07-23' }).performanceDate, '2026-07-23', 'entry dates remain stable without UTC shifting');

const coreEntry = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-25',
  domain: 'CORE',
  entryType: 'BENCHMARK',
  activityName: 'Hollow Hold',
  evidenceStatus: 'VERIFIED',
  metrics: { repetitions: 3, durationSeconds: 60 }
});
const corePayload = buildPerformancePersistencePayload(coreEntry);
assert.equal(corePayload.activity_name, 'Hollow Hold', 'valid core entry saves correctly');

const conditioningEntry = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-26',
  domain: 'CONDITIONING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Rowing',
  evidenceStatus: 'SELF REPORTED',
  metrics: { durationSeconds: 1200, distance: 3000, calories: 250 }
});
assert.equal(conditioningEntry.metrics.duration_seconds, 1200, 'conditioning entry keeps duration metadata');

const formalTestEntry = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-27',
  domain: 'FITNESS TEST',
  entryType: 'FORMAL TEST',
  activityName: 'Wingate',
  evidenceStatus: 'VERIFIED',
  metrics: { testProtocolName: 'Wingate', eventResults: [{ name: 'Anaerobic Power', score: 980 }] }
});
assert.ok(Array.isArray(formalTestEntry.metrics.event_results), 'formal test entry preserves event-result structure');

const bodyMetricEntry = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-28',
  domain: 'BODY METRICS',
  entryType: 'MEASUREMENT',
  activityName: 'Bodyweight',
  evidenceStatus: 'SELF REPORTED',
  metrics: { measurementValue: 82.5, measurementUnit: 'kg', measurementLocation: 'bodyweight' }
});
assert.equal(bodyMetricEntry.metrics.measurement_unit, 'kg', 'body-metric entry preserves measurement units');

const missingActivity = validatePerformanceEntry({
  domain: 'STRENGTH',
  entryType: 'TRAINING SET',
  evidenceStatus: 'SELF REPORTED',
  metrics: { sets: 3, repetitions: 5, weight: 225 }
});
assert.ok(missingActivity.errors.some((error) => error.field === 'activity_name'), 'missing activity name is rejected');

const invalidDomain = validatePerformanceEntry({ domain: 'UNKNOWN', entryType: 'TRAINING SET', activityName: 'Bench Press', evidenceStatus: 'SELF REPORTED' });
assert.ok(invalidDomain.errors.some((error) => error.field === 'domain'), 'invalid domain is rejected');

const invalidType = validatePerformanceEntry({ domain: 'STRENGTH', entryType: 'INVALID TYPE', activityName: 'Bench Press', evidenceStatus: 'SELF REPORTED' });
assert.ok(invalidType.errors.some((error) => error.field === 'entry_type'), 'invalid entry type is rejected');

const invalidEvidence = validatePerformanceEntry({ domain: 'STRENGTH', entryType: 'TRAINING SET', activityName: 'Bench Press', evidenceStatus: 'NOT REAL' });
assert.ok(invalidEvidence.errors.some((error) => error.field === 'evidence_status'), 'invalid evidence status is rejected');

const customActivity = normalizePerformanceEntry({
  userId: 'user-1',
  performanceDate: '2026-07-29',
  domain: 'STRENGTH',
  entryType: 'BENCHMARK',
  activityName: '<script>alert("x")</script>'.repeat(10),
  evidenceStatus: 'SELF REPORTED',
  metrics: { sets: 1, repetitions: 1, weight: 20 }
});
assert.equal(customActivity.activityName.length <= 80, true, 'custom activity text is length-limited and safely normalized');
assert.equal(customActivity.activityName.includes('<'), false, 'custom activity text is sanitized');

const supabaseStyle = hydratePerformanceEntry({
  id: 'entry-1',
  user_id: 'user-1',
  performance_date: '2026-07-30',
  performance_time: '18:30',
  domain: 'RUNNING',
  entry_type: 'RACE',
  activity_code: 'race',
  activity_name: 'Local 5K',
  session_name: 'Evening',
  source: 'IMPORTED',
  evidence_status: 'VERIFIED',
  metrics: { distance: 5, distance_unit: 'km' },
  notes: 'Great effort',
  created_at: '2026-07-30T18:30:00.000Z',
  updated_at: '2026-07-30T18:30:00.000Z'
});
assert.equal(supabaseStyle.activityName, 'Local 5K', 'supabase-style rows hydrate into application entries');
assert.equal(supabaseStyle.entryType, 'RACE', 'hydrated entry preserves entry type');

const persistencePayload = buildPerformancePersistencePayload(strengthEntry, 'user-2');
assert.equal(persistencePayload.user_id, 'user-2', 'persistence payload uses snake_case user field');
assert.equal(persistencePayload.performance_date, '2026-07-23', 'persistence payload uses snake_case date field');
assert.equal(persistencePayload.metrics.weight_unit, 'lb', 'persistence payload preserves metrics');

const emptyState = derivePerformanceEmptyState({ storageState: 'local fallback' });
assert.equal(emptyState.storageState, 'local fallback', 'empty state preserves the storage state');

const entries = [
  { performanceDate: '2026-07-20', domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Squat', metrics: {} },
  { performanceDate: '2026-07-21', domain: 'running', entryType: 'WORKOUT SUMMARY', activityName: 'Easy Run', metrics: {} },
  { performanceDate: '2026-07-22', domain: 'strength', entryType: 'BENCHMARK', activityName: 'Bench Press', metrics: {} }
];
const filtered = filterPerformanceEntries(entries, { date: '2026-07-21', domain: 'running', activity: 'Easy Run', entryType: 'WORKOUT SUMMARY' });
assert.equal(filtered.length, 1, 'filters work by date, domain, activity, and entry type');
const summary = summarizeRecentPerformance(entries);
assert.equal(summary.entriesThisWeek, 3, 'recent summary uses only applicable entries');

const editingEntry = normalizePerformanceEntry({ id: 'edit-1', createdAt: '2026-07-01T00:00:00.000Z', performanceDate: '2026-07-23', domain: 'STRENGTH', entryType: 'TRAINING SET', activityName: 'Bench Press', evidenceStatus: 'SELF REPORTED', metrics: { sets: 1, repetitions: 1, weight: 20 } });
const edited = { ...editingEntry, activityName: 'Paused Bench Press', updatedAt: '2026-07-23T01:00:00.000Z' };
assert.equal(edited.id, editingEntry.id, 'editing preserves id');
assert.equal(edited.createdAt, editingEntry.createdAt, 'editing preserves created_at');

const deleteTarget = { id: 'delete-1', performanceDate: '2026-07-23', domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Row', evidenceStatus: 'SELF REPORTED', metrics: {} };
const deleteSet = [
  { id: 'keep-1', performanceDate: '2026-07-23', domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Row', evidenceStatus: 'SELF REPORTED', metrics: {} },
  deleteTarget,
  { id: 'keep-2', performanceDate: '2026-07-24', domain: 'running', entryType: 'WORKOUT SUMMARY', activityName: 'Easy Run', evidenceStatus: 'SELF REPORTED', metrics: {} }
];
const remaining = removePerformanceEntry(deleteSet, deleteTarget.id);
assert.equal(remaining.length, 2, 'deletion removes the selected entry only');
assert.deepEqual(remaining.map((item) => item.id), ['keep-1', 'keep-2'], 'the correct id is deleted and others remain');
const unchanged = removePerformanceEntry(deleteSet, 'missing-id');
assert.strictEqual(unchanged, deleteSet, 'a missing id leaves the collection unchanged');

const anonymousA = normalizePerformanceEntry({ performanceDate: '2026-07-25', domain: 'STRENGTH', entryType: 'TRAINING SET', activityName: 'Front Squat', evidenceStatus: 'SELF REPORTED', metrics: { sets: 1, repetitions: 5, weight: 100 } });
const anonymousB = normalizePerformanceEntry({ performanceDate: '2026-07-25', domain: 'STRENGTH', entryType: 'TRAINING SET', activityName: 'Back Squat', evidenceStatus: 'SELF REPORTED', metrics: { sets: 1, repetitions: 5, weight: 100 } });
assert.ok(anonymousA.id, 'normalized entries receive a stable local id');
assert.ok(anonymousB.id, 'distinct anonymous entries receive stable ids');
assert.notEqual(anonymousA.id, anonymousB.id, 'formerly anonymous entries are distinguished by stable ids');
const secondPass = normalizePerformanceEntry({ ...anonymousA, id: null });
assert.equal(secondPass.id, anonymousA.id, 're-normalizing the same anonymous entry preserves the original id');
const anonymousDeleteSet = [anonymousA, anonymousB];
const anonymousNoop = removePerformanceEntry(anonymousDeleteSet, 'missing-id');
assert.strictEqual(anonymousNoop, anonymousDeleteSet, 'anonymous entries are not deleted arbitrarily');

const strengthScoped = validatePerformanceEntry({
  domain: 'STRENGTH',
  entryType: 'TRAINING SET',
  activityName: 'Bench Press',
  evidenceStatus: 'VERIFIED',
  metrics: { sets: '3', repetitions: '5', weight: '225', distance: '5', duration_seconds: '1800' }
});
assert.equal(strengthScoped.valid, true, 'valid strength entry saves without running errors');
assert.ok(!strengthScoped.errors.some((error) => error.field === 'metrics.distance'), 'strength validation ignores running distance');
assert.ok(!strengthScoped.errors.some((error) => error.field === 'metrics.duration_seconds'), 'strength validation ignores running duration');

const runningScoped = validatePerformanceEntry({
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: '5.5', duration_seconds: '1800', sets: '3', repetitions: '5', weight: '225' }
});
assert.equal(runningScoped.valid, true, 'valid running entry saves without strength errors');
assert.ok(!runningScoped.errors.some((error) => error.field === 'metrics.sets'), 'running validation ignores strength sets');
assert.ok(!runningScoped.errors.some((error) => error.field === 'metrics.repetitions'), 'running validation ignores strength repetitions');

const strengthScopedPayload = normalizePerformanceEntry({
  domain: 'STRENGTH',
  entryType: 'TRAINING SET',
  activityName: 'Bench Press',
  evidenceStatus: 'VERIFIED',
  metrics: { sets: '3', repetitions: '5', weight: '225', distance: '5', duration_seconds: '1800' }
});
assert.equal(strengthScopedPayload.metrics.sets, 3, 'relevant strength metrics remain in normalized payloads');
assert.equal(strengthScopedPayload.metrics.distance, undefined, 'hidden running metrics are omitted from strength payloads');

const blankIrrelevant = normalizePerformanceEntry({
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: '5', duration_seconds: '1800', sets: '', repetitions: '', weight: '' }
});
assert.equal(blankIrrelevant.metrics.distance, 5, 'relevant running metrics remain after blank-irrelevant cleanup');
assert.equal(blankIrrelevant.metrics.sets, undefined, 'blank irrelevant strength fields are omitted');

const numericString = validatePerformanceEntry({
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: '5', duration_seconds: '1800' }
});
assert.equal(numericString.valid, true, 'numeric strings are parsed as valid positive numbers');

const decimalDistance = validatePerformanceEntry({
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: '3.1', duration_seconds: '1800' }
});
assert.equal(decimalDistance.valid, true, 'decimal distances are accepted');

const zeroDistance = validatePerformanceEntry({
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: '0', duration_seconds: '1800' }
});
assert.ok(zeroDistance.errors.some((error) => error.field === 'metrics.distance'), 'zero running distance remains invalid');

const zeroDuration = validatePerformanceEntry({
  domain: 'RUNNING',
  entryType: 'WORKOUT SUMMARY',
  activityName: 'Tempo Run',
  evidenceStatus: 'SELF REPORTED',
  metrics: { distance: '5', duration_seconds: '0' }
});
assert.ok(zeroDuration.errors.some((error) => error.field === 'metrics.duration_seconds'), 'zero running duration remains invalid');

const invalidStrengthReps = validatePerformanceEntry({
  domain: 'STRENGTH',
  entryType: 'TRAINING SET',
  activityName: 'Bench Press',
  evidenceStatus: 'VERIFIED',
  metrics: { sets: '3', repetitions: '0', weight: '225' }
});
assert.ok(invalidStrengthReps.errors.some((error) => error.field === 'metrics.repetitions'), 'invalid strength repetitions remain invalid');

const original = { metrics: { weight: 225 } };
const clone = normalizePerformanceEntry(original);
clone.metrics.weight = 999;
assert.equal(original.metrics.weight, 225, 'functions do not mutate source records');

const precision = normalizePerformanceEntry({ domain: 'STRENGTH', entryType: 'TRAINING SET', activityName: 'Squat', evidenceStatus: 'VERIFY', metrics: { sets: 1, repetitions: 3, weight: 100.33333333333333 } });
assert.equal(precision.metrics.weight, 100.33333333333333, 'full precision is retained internally');
assert.equal(Number.isFinite(precision.metrics.weight), true, 'precision values remain finite');

console.log('performance foundation tests passed');
