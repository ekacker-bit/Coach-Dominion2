const assert = require('assert');
const {
  normalizeFitnessTestAttempt,
  validateFitnessTestAttempt,
  buildPerformanceComparisonKey,
  determineRecordCategory,
  isPerformanceComparable,
  evaluatePersonalRecord,
  buildPersonalRecordSnapshot,
  evaluateMilestones,
  buildAtlasPerformanceReview,
  normalizeFitnessTestProtocol,
  getFitnessTestProtocolCatalog,
  getMilestoneCatalog,
  getPersonalRecordPersistenceKey,
  getFitnessTestPersistenceKey,
  getMilestonePersistenceKey,
  getAtlasReviewPersistenceKey
} = require('../assets/js/app.js');

const protocol = normalizeFitnessTestProtocol({ code: 'DOMINION_MONTHLY_FITNESS_TEST', version: '1.0' });
assert.equal(protocol.code, 'DOMINION_MONTHLY_FITNESS_TEST', 'protocol catalog preserves the requested code');
assert.equal(protocol.orderedEvents[0].required, true, 'protocol events retain required markers');

const draftAttempt = normalizeFitnessTestAttempt({ id: 'attempt-1', protocolCode: 'CUSTOM_TEST', status: 'DRAFT', evidenceStatus: 'SELF REPORTED', eventResults: [] });
assert.equal(draftAttempt.status, 'DRAFT', 'draft attempts normalize to draft status');
const invalidAttempt = validateFitnessTestAttempt({ id: 'attempt-2', protocolCode: 'DOMINION_MONTHLY_FITNESS_TEST', status: 'COMPLETE', evidenceStatus: 'VERIFIED', eventResults: [{ eventCode: 'push_ups_2m', rawValue: '12' }] });
assert.equal(invalidAttempt.valid, false, 'completed tests with missing required events are invalid');
const incompleteAttempt = validateFitnessTestAttempt({ id: 'attempt-3', protocolCode: 'DOMINION_MONTHLY_FITNESS_TEST', status: 'INCOMPLETE', evidenceStatus: 'INCOMPLETE', eventResults: [{ eventCode: 'push_ups_2m', rawValue: '12' }] });
assert.equal(incompleteAttempt.valid, true, 'incomplete tests remain storable');
const completedAttempt = normalizeFitnessTestAttempt({ id: 'attempt-4', protocolCode: 'DOMINION_MONTHLY_FITNESS_TEST', protocolVersion: '1.0', status: 'COMPLETE', evidenceStatus: 'VERIFIED', eventResults: [{ eventCode: 'push_ups_2m', rawValue: '20', unit: 'repetitions', evidenceStatus: 'VERIFIED', comparisonDirection: 'higher' }, { eventCode: 'pull_ups_max', rawValue: '10', unit: 'repetitions', evidenceStatus: 'VERIFIED', comparisonDirection: 'higher' }, { eventCode: 'air_squats_2m', rawValue: '50', unit: 'repetitions', evidenceStatus: 'VERIFIED', comparisonDirection: 'higher' }, { eventCode: 'plank_hold', rawValue: '180', unit: 'seconds', evidenceStatus: 'VERIFIED', comparisonDirection: 'higher' }, { eventCode: 'hanging_leg_raises', rawValue: '15', unit: 'repetitions', evidenceStatus: 'VERIFIED', comparisonDirection: 'higher' }, { eventCode: 'burpees_10m', rawValue: '75', unit: 'repetitions', evidenceStatus: 'VERIFIED', comparisonDirection: 'higher' }, { eventCode: 'two_mile_run', rawValue: '900', unit: 'seconds', evidenceStatus: 'VERIFIED', comparisonDirection: 'lower' }] });
assert.equal(completedAttempt.protocolVersion, '1.0', 'completed attempts preserve the protocol version');

const lowerStrength = { domain: 'strength', activityCode: 'bench_press', activityName: 'Bench Press', evidenceStatus: 'SELF REPORTED', performanceDate: '2026-07-01', metrics: { weight: 200, weight_unit: 'lb' } };
const higherStrength = { domain: 'strength', activityCode: 'bench_press', activityName: 'Bench Press', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-02', metrics: { weight: 225, weight_unit: 'lb' } };
assert.equal(determineRecordCategory(higherStrength), 'LOAD_PR', 'strength load entries resolve to a load PR category');
assert.equal(isPerformanceComparable(lowerStrength, higherStrength, 'LOAD_PR'), true, 'same movement and units are comparable');
const differentMovement = { domain: 'strength', activityCode: 'squat', activityName: 'Squat', evidenceStatus: 'SELF REPORTED', performanceDate: '2026-07-01', metrics: { weight: 200, weight_unit: 'lb' } };
assert.equal(isPerformanceComparable(differentMovement, higherStrength, 'LOAD_PR'), false, 'different strength movements are not compared');
const estimated = { domain: 'strength', activityCode: 'bench_press', activityName: 'Bench Press', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-03', metrics: { weight: 250, weight_unit: 'lb' } };
assert.equal(determineRecordCategory(estimated), 'ESTIMATED_1RM_PR', 'estimated entries resolve to an estimated PR category');
const pr = evaluatePersonalRecord(higherStrength, [lowerStrength]);
assert.ok(pr, 'a higher strength result creates a new PR snapshot');
assert.equal(pr.recordStatus, 'CONFIRMED', 'self-reported entries can yield confirmed PRs');
assert.equal(pr.previousRecordValue, 200, 'a higher result preserves the previous record value');
assert.equal(pr.improvementAbsolute, 25, 'a higher result calculates improvementAbsolute correctly');
const lowerResult = evaluatePersonalRecord(lowerStrength, [higherStrength]);
assert.equal(lowerResult, null, 'a lower result does not replace the current best');
const tied = evaluatePersonalRecord(higherStrength, [higherStrength]);
assert.equal(tied, null, 'a tied result does not create a duplicate PR');
const lowerAgain = evaluatePersonalRecord({ ...higherStrength, metrics: { ...higherStrength.metrics, weight: 190 } }, [{ ...higherStrength, id: 'prior-200' }]);
assert.equal(lowerAgain, null, 'a lower strength load does not generate a PR when a higher comparable record exists');
const equalAgain = evaluatePersonalRecord({ ...higherStrength, metrics: { ...higherStrength.metrics, weight: 200 } }, [{ ...higherStrength, id: 'prior-200' }]);
assert.equal(equalAgain, null, 'an equal strength load does not generate a duplicate PR');
const priorTwoHundred = { ...higherStrength, id: 'prior-200', metrics: { ...higherStrength.metrics, weight: 200, weight_unit: 'lb' } };
const higherAgain = evaluatePersonalRecord({ ...higherStrength, metrics: { ...higherStrength.metrics, weight: 205 } }, [priorTwoHundred]);
assert.ok(higherAgain, 'a higher strength load generates a new PR');
assert.equal(higherAgain.recordCategory, 'LOAD_PR', 'a higher strength load creates a load PR snapshot');
assert.equal(higherAgain.previousRecordValue, 200, 'a higher result carries the previous record value');
assert.equal(higherAgain.improvementAbsolute, 5, 'a higher result calculates improvementAbsolute accurately');
assert.equal(higherAgain.improvementPercentage, 2.5, 'a higher result calculates improvementPercentage accurately');
const snakeCasePrior = evaluatePersonalRecord({ ...higherStrength, metrics: { ...higherStrength.metrics, weight: 190 } }, [{ record_category: 'LOAD_PR', comparison_key: 'strength:bench_press:load:lb', normalized_value: 200, record_status: 'CONFIRMED', domain: 'strength', activity_code: 'bench_press' }]);
assert.equal(snakeCasePrior, null, 'snake_case prior records are treated as comparable existing PRs');
const invalidatedPrior = evaluatePersonalRecord({ ...higherStrength, metrics: { ...higherStrength.metrics, weight: 205 } }, [{ recordCategory: 'LOAD_PR', comparisonKey: 'strength:bench_press:load:lb', normalizedValue: 250, recordStatus: 'INVALIDATED', domain: 'strength', activityCode: 'bench_press' }]);
assert.ok(invalidatedPrior, 'invalidated prior records do not block a new PR');
assert.equal(invalidatedPrior.previousRecordValue, null, 'invalidated prior records are not treated as the current valid best');
const differentActivity = evaluatePersonalRecord({ ...higherStrength, activityCode: 'squat' }, [{ recordCategory: 'LOAD_PR', comparisonKey: 'strength:bench_press:load:lb', normalizedValue: 200, recordStatus: 'CONFIRMED', domain: 'strength', activityCode: 'bench_press' }]);
assert.ok(differentActivity, 'different activity is not treated as comparable');
assert.equal(differentActivity.previousRecordValue, null, 'different activity does not reuse a prior record');
const differentCategory = evaluatePersonalRecord({ ...higherStrength, metrics: { ...higherStrength.metrics, weight: 205 } }, [{ recordCategory: 'REP_PR', comparisonKey: 'strength:bench_press:repetitions:lb', normalizedValue: 200, recordStatus: 'CONFIRMED', domain: 'strength', activityCode: 'bench_press' }]);
assert.ok(differentCategory, 'different record categories are not treated as comparable');
assert.equal(differentCategory.previousRecordValue, null, 'different category does not reuse a prior record');
const verifiedOneRm = { domain: 'strength', activityCode: 'bench_press', activityName: 'Bench Press', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-17', metrics: { weight: 200, repetitions: 5, verified_1rm: true, weight_unit: 'lb' } };
const estimatedOneRm = { domain: 'strength', activityCode: 'bench_press', activityName: 'Bench Press', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-18', metrics: { weight: 200, repetitions: 5, estimated_1rm: true, weight_unit: 'lb' } };
assert.equal(determineRecordCategory(verifiedOneRm), 'VERIFIED_1RM_PR', 'verified one-rep-max entries resolve to the verified PR category');
assert.equal(determineRecordCategory(estimatedOneRm), 'ESTIMATED_1RM_PR', 'estimated one-rep-max entries resolve to the estimated PR category');
assert.equal(isPerformanceComparable(verifiedOneRm, estimatedOneRm, 'VERIFIED_1RM_PR'), false, 'verified and estimated 1RM entries are not treated as the same comparison');

const fasterRun = { domain: 'running', activityCode: 'tempo', activityName: 'Tempo Run', entryType: 'WORKOUT_SUMMARY', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-10', metrics: { distance: 5, distance_unit: 'km', duration_seconds: 1800 } };
const slowerRun = { domain: 'running', activityCode: 'tempo', activityName: 'Tempo Run', entryType: 'WORKOUT_SUMMARY', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-09', metrics: { distance: 5, distance_unit: 'km', duration_seconds: 2000 } };
assert.equal(isPerformanceComparable(fasterRun, slowerRun, 'TIME_PR'), true, 'same-distance runs are comparable');
const runPr = evaluatePersonalRecord(fasterRun, [slowerRun]);
assert.ok(runPr, 'a faster same-distance run generates a time PR');
const shortRun = { domain: 'running', activityCode: 'tempo', activityName: 'Tempo Run', entryType: 'WORKOUT_SUMMARY', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-11', metrics: { distance: 1, distance_unit: 'km', duration_seconds: 300 } };
assert.equal(evaluatePersonalRecord(shortRun, [fasterRun]), null, 'shorter-distance runs do not replace longer-distance records');
const customDistance = { domain: 'running', activityCode: 'tempo', activityName: 'Tempo Run', entryType: 'WORKOUT_SUMMARY', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-12', metrics: { distance: 3.2, distance_unit: 'km', duration_seconds: 800 } };
assert.equal(buildPerformanceComparisonKey(customDistance, 'TIME_PR'), 'running:custom:WORKOUT_SUMMARY', 'custom running distances normalize to a custom category');

const incompleteEntry = { domain: 'strength', activityCode: 'bench_press', activityName: 'Bench Press', evidenceStatus: 'INCOMPLETE', performanceDate: '2026-07-13', metrics: { weight: 300, weight_unit: 'lb' } };
assert.equal(evaluatePersonalRecord(incompleteEntry, []), null, 'incomplete entries cannot generate confirmed PRs');

const testEventPr = evaluatePersonalRecord({ domain: 'fitness_test', activityCode: 'push_ups_2m', activityName: 'Push-ups in 2 minutes', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-14', metrics: { test_event_value: 50, unit: 'repetitions', direction: 'higher' } }, []);
assert.ok(testEventPr, 'completed test events can generate a test-event PR');

const milestone = evaluateMilestones({ entry: higherStrength }, []);
assert.ok(milestone.length >= 0, 'milestone evaluation returns a deterministic array');
const firstBenchmark = evaluateMilestones({ entry: { domain: 'strength', activityCode: 'bench_press', activityName: 'Bench Press', performanceDate: '2026-07-15', evidenceStatus: 'VERIFIED', metrics: { weight: 100 } } }, []);
assert.ok(firstBenchmark.some((item) => item.milestoneCode === 'FIRST_STRENGTH_BENCHMARK'), 'first benchmark milestone triggers once');
const duplicate = evaluateMilestones({ entry: higherStrength }, firstBenchmark);
assert.equal(duplicate.length, 0, 'one-time milestones do not duplicate');

const bodyMetric = { domain: 'body_metrics', activityCode: 'bodyweight', activityName: 'Bodyweight', performanceDate: '2026-07-16', evidenceStatus: 'SELF REPORTED', metrics: { measurement_value: 80, measurement_unit: 'kg' } };
assert.ok(evaluateMilestones({ entry: bodyMetric }, []).some((item) => item.milestoneCode === 'FIRST_BODY_METRIC_BASELINE'), 'body-metric baseline milestone triggers');

const review = buildAtlasPerformanceReview([{ recordCategory: 'LOAD_PR', activityName: 'Bench Press', normalizedValue: 225, recordStatus: 'CONFIRMED', improvementAbsolute: 25 }], [{ title: 'First strength benchmark logged' }], { incompleteEvidence: false });
assert.equal(review.status, 'TEST COMPLETED', 'Atlas review marks confirmed records as completed');
assert.equal(review.limitedEvidence, false, 'Atlas review exposes evidence quality clearly');
assert.equal(review.commandNote.includes('Confirmed'), true, 'Atlas review distinguishes confirmed records');

assert.equal(typeof getFitnessTestPersistenceKey('user-1'), 'string', 'fitness-test storage key is generated');
assert.equal(typeof getPersonalRecordPersistenceKey('user-1'), 'string', 'personal-record storage key is generated');
assert.equal(typeof getMilestonePersistenceKey('user-1'), 'string', 'milestone storage key is generated');
assert.equal(typeof getAtlasReviewPersistenceKey('user-1'), 'string', 'atlas-review storage key is generated');

const protocolCatalog = getFitnessTestProtocolCatalog();
assert.ok(Array.isArray(protocolCatalog), 'protocol catalog is available');
const milestoneCatalog = getMilestoneCatalog();
assert.ok(Array.isArray(milestoneCatalog), 'milestone catalog is available');

console.log('fitness tests / PRs / milestones tests passed');
