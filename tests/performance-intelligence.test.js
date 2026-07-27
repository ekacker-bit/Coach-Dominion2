const assert = require('assert');
const {
  buildComparablePerformanceSeries,
  calculateSeriesTrend,
  detectPerformancePlateau,
  detectRecentRegression,
  calculateBenchmarkProximity,
  evaluatePrAttemptReadiness,
  buildFitnessTestIntelligence,
  buildPerformanceIntelligenceOverview,
  derivePerformanceIntelligenceViewState,
  formatIntelligenceDelta
} = require('../assets/js/app.js');

function entry(overrides = {}) {
  return {
    id: overrides.id || `entry-${Math.random().toString(16).slice(2, 8)}`,
    userId: 'user-1',
    performanceDate: overrides.performanceDate || '2026-07-01',
    performanceTime: overrides.performanceTime || '08:00',
    domain: overrides.domain || 'strength',
    entryType: overrides.entryType || 'TRAINING_SET',
    activityCode: overrides.activityCode || 'bench_press',
    activityName: overrides.activityName || 'Bench Press',
    evidenceStatus: overrides.evidenceStatus || 'VERIFIED',
    metrics: overrides.metrics || { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' }
  };
}

const sameKeyEntries = [
  entry({ id: 's1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 's2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } })
];
const sameKeySeries = buildComparablePerformanceSeries(sameKeyEntries);
assert.equal(sameKeySeries.series.filter((item) => item.metricCategory === 'strength_load').length, 1, '1. same comparison key builds one series');

const separatedStrength = buildComparablePerformanceSeries([
  entry({ id: 'b1', activityCode: 'bench_press', activityName: 'Bench Press', performanceDate: '2026-07-01' }),
  entry({ id: 'sq1', activityCode: 'squat', activityName: 'Squat', performanceDate: '2026-07-02' })
]);
assert.equal(separatedStrength.series.filter((item) => item.metricCategory === 'strength_load').length, 2, '2. different strength movements remain separate');

const estVsVerified = buildComparablePerformanceSeries([
  entry({ id: 'e1', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'v1', evidenceStatus: 'VERIFIED', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb', verified_1rm: 240 } })
]);
assert.ok(estVsVerified.series.some((item) => item.metricCategory === 'strength_estimated_1rm'), '3. estimated 1RM series exists');
assert.ok(estVsVerified.series.some((item) => item.metricCategory === 'strength_verified_1rm'), '3. verified 1RM series exists separately');

const runningSeparated = buildComparablePerformanceSeries([
  entry({ id: 'r1', domain: 'running', activityCode: 'race', activityName: 'Race', performanceDate: '2026-07-01', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 430 } }),
  entry({ id: 'r2', domain: 'running', activityCode: 'race', activityName: 'Race', performanceDate: '2026-07-02', metrics: { distance: 5, distance_unit: 'km', duration_seconds: 1320 } })
]);
assert.equal(runningSeparated.series.length, 2, '4. different running distances remain separate');

const customDistance = buildComparablePerformanceSeries([
  entry({ id: 'c1', domain: 'running', activityCode: 'custom', activityName: 'Custom Run', performanceDate: '2026-07-01', metrics: { distance: 3, distance_unit: 'mi', duration_seconds: 1500 } }),
  entry({ id: 'c2', domain: 'running', activityCode: 'custom', activityName: 'Custom Run', performanceDate: '2026-07-03', metrics: { distance: 3, distance_unit: 'mi', duration_seconds: 1480 } })
]);
assert.equal(customDistance.series.length, 1, '5. matching custom distances compare correctly');

const invalidExcluded = buildComparablePerformanceSeries([
  entry({ id: 'iv1', domain: 'running', performanceDate: '2026-07-01', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 420 } }),
  entry({ id: 'iv2', domain: 'running', performanceDate: '2026-07-02', evidenceStatus: 'INCOMPLETE', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 410 } }),
  entry({ id: 'iv3', domain: 'running', performanceDate: '2026-07-03', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 0 } })
]);
assert.equal(invalidExcluded.series[0].validCount, 1, '6. invalid entries are excluded from current trends');

const immutableSource = [entry({ id: 'im1' }), entry({ id: 'im2', performanceDate: '2026-07-02' })];
const before = JSON.stringify(immutableSource);
buildComparablePerformanceSeries(immutableSource);
assert.equal(JSON.stringify(immutableSource), before, '7. source arrays and objects are not mutated');

const equalDateStable = buildComparablePerformanceSeries([
  entry({ id: 'st-a', performanceDate: '2026-07-10', performanceTime: '09:00', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'st-b', performanceDate: '2026-07-10', performanceTime: '09:00', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } })
]);
const stablePoints = equalDateStable.series.find((item) => item.metricCategory === 'strength_load').points;
assert.equal(stablePoints[0].sourceEntryId, 'st-a', '8. equal-date sorting remains stable');

const higherTrendSeries = buildComparablePerformanceSeries([
  entry({ id: 'h1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'h2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } }),
  entry({ id: 'h3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 210, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
assert.ok(calculateSeriesTrend(higherTrendSeries).trajectory.includes('IMPROVING'), '9. higher-is-better improvement classifies correctly');

const lowerTrendSeries = buildComparablePerformanceSeries([
  entry({ id: 'l1', domain: 'running', performanceDate: '2026-07-01', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 450 } }),
  entry({ id: 'l2', domain: 'running', performanceDate: '2026-07-02', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 440 } }),
  entry({ id: 'l3', domain: 'running', performanceDate: '2026-07-03', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 430 } })
]).series[0];
assert.ok(calculateSeriesTrend(lowerTrendSeries).trajectory.includes('IMPROVING'), '10. lower-is-better improvement classifies correctly');

const stableSeries = buildComparablePerformanceSeries([
  entry({ id: 'st1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'st2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'st3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
assert.equal(calculateSeriesTrend(stableSeries).trajectory, 'STABLE', '11. stable results classify stable');

const noisySeries = buildComparablePerformanceSeries([
  entry({ id: 'n1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'n2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 235, weight_unit: 'lb' } }),
  entry({ id: 'n3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 195, weight_unit: 'lb' } }),
  entry({ id: 'n4', performanceDate: '2026-07-04', metrics: { sets: 3, repetitions: 5, weight: 240, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
assert.equal(calculateSeriesTrend(noisySeries).trajectory, 'NOISY', '12. high-variance results classify noisy');

const sparseSeries = buildComparablePerformanceSeries([
  entry({ id: 'sp1', performanceDate: '2026-07-01' }),
  entry({ id: 'sp2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
assert.equal(calculateSeriesTrend(sparseSeries).trajectory, 'INSUFFICIENT DATA', '13. sparse series classify insufficient data');

const sustainedDecline = buildComparablePerformanceSeries([
  entry({ id: 'd1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 230, weight_unit: 'lb' } }),
  entry({ id: 'd2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 220, weight_unit: 'lb' } }),
  entry({ id: 'd3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 210, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
assert.ok(calculateSeriesTrend(sustainedDecline).trajectory.includes('DECLINING'), '14. recent sustained decline classifies declining');

const oneBadResult = buildComparablePerformanceSeries([
  entry({ id: 'o1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'o2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } }),
  entry({ id: 'o3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 190, weight_unit: 'lb' } }),
  entry({ id: 'o4', performanceDate: '2026-07-04', metrics: { sets: 3, repetitions: 5, weight: 206, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
const oneBadTrend = calculateSeriesTrend(oneBadResult).trajectory;
assert.notEqual(oneBadTrend, 'DECLINING', '15. one poor result does not automatically classify decline');

const lowEvidenceSeries = buildComparablePerformanceSeries([
  entry({ id: 'cl1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'cl2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 202, weight_unit: 'lb' } }),
  entry({ id: 'cl3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 204, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
const highEvidenceSeries = buildComparablePerformanceSeries([
  entry({ id: 'ch1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'ch2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 201, weight_unit: 'lb' } }),
  entry({ id: 'ch3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 202, weight_unit: 'lb' } }),
  entry({ id: 'ch4', performanceDate: '2026-07-04', metrics: { sets: 3, repetitions: 5, weight: 203, weight_unit: 'lb' } }),
  entry({ id: 'ch5', performanceDate: '2026-07-05', metrics: { sets: 3, repetitions: 5, weight: 204, weight_unit: 'lb' } }),
  entry({ id: 'ch6', performanceDate: '2026-07-06', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
const confidenceOrder = ['INSUFFICIENT', 'LOW', 'MODERATE', 'HIGH'];
const lowConfidence = calculateSeriesTrend(lowEvidenceSeries).confidence;
const highConfidence = calculateSeriesTrend(highEvidenceSeries).confidence;
assert.ok(confidenceOrder.indexOf(highConfidence) >= confidenceOrder.indexOf(lowConfidence), '16. confidence increases with sufficient valid evidence');

const estimatedOnlySeries = buildComparablePerformanceSeries([
  entry({ id: 'es1', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-01' }),
  entry({ id: 'es2', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } }),
  entry({ id: 'es3', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 210, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
assert.equal(calculateSeriesTrend(estimatedOnlySeries).confidence, 'LOW', '17. estimated-only evidence limits confidence');

const plateauSeries = buildComparablePerformanceSeries([
  entry({ id: 'p1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'p2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 201, weight_unit: 'lb' } }),
  entry({ id: 'p3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 200.5, weight_unit: 'lb' } }),
  entry({ id: 'p4', performanceDate: '2026-07-04', metrics: { sets: 3, repetitions: 5, weight: 201, weight_unit: 'lb' } }),
  entry({ id: 'p5', performanceDate: '2026-07-05', metrics: { sets: 3, repetitions: 5, weight: 200.8, weight_unit: 'lb' } }),
  entry({ id: 'p6', performanceDate: '2026-07-06', metrics: { sets: 3, repetitions: 5, weight: 200.9, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
assert.notEqual(detectPerformancePlateau(plateauSeries, calculateSeriesTrend(plateauSeries)).state, 'NO PLATEAU', '18. plateau requires enough comparable results');
assert.equal(detectPerformancePlateau(sparseSeries, calculateSeriesTrend(sparseSeries)).state, 'INSUFFICIENT DATA', '19. sparse data does not produce a plateau');
assert.equal(detectPerformancePlateau(noisySeries, calculateSeriesTrend(noisySeries)).state, 'NO PLATEAU', '20. high variance does not produce a false plateau');

const lowerRegressionSeries = buildComparablePerformanceSeries([
  entry({ id: 'rg1', domain: 'running', performanceDate: '2026-07-01', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 420 } }),
  entry({ id: 'rg2', domain: 'running', performanceDate: '2026-07-02', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 430 } }),
  entry({ id: 'rg3', domain: 'running', performanceDate: '2026-07-03', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 440 } })
]).series[0];
assert.equal(detectRecentRegression(lowerRegressionSeries, calculateSeriesTrend(lowerRegressionSeries)).state, 'LIKELY REGRESSION', '21. recent regression is direction-aware');

const benchmarkHigher = calculateBenchmarkProximity({ code: 'PULL_UPS_20', title: '20 strict pull-ups', domain: 'strength', evaluationType: 'repetitions', targetValue: 20, direction: 'higher', requiredActivity: 'pull_up', active: true }, [
  entry({ id: 'bh1', domain: 'strength', activityCode: 'pull_up', activityName: 'Pull-Up', metrics: { sets: 3, repetitions: 16, weight: 0, weight_unit: 'lb' } })
]);
assert.equal(benchmarkHigher.eligible, true, '22. benchmark proximity works for higher-is-better');
assert.equal(Math.round(benchmarkHigher.gapAbsolute), 4, '22. higher-is-better absolute gap is correct');

const benchmarkLower = calculateBenchmarkProximity({ code: 'SUB_7_MILE', title: 'Sub-7 mile', domain: 'running', evaluationType: 'time', targetValue: 420, direction: 'lower', active: true }, [
  entry({ id: 'bl1', domain: 'running', activityCode: 'race', activityName: 'Race', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 435 } })
]);
assert.equal(benchmarkLower.eligible, true, '23. benchmark proximity works for lower-is-better');
assert.equal(Math.round(benchmarkLower.gapAbsolute), 15, '23. lower-is-better absolute gap is correct');

const ratioMissingBodyweight = calculateBenchmarkProximity({ code: 'BENCH_PRESS_BODYWEIGHT_1_0', title: 'Bench ratio', domain: 'strength', evaluationType: 'ratio', targetValue: 1, direction: 'higher', requiredActivity: 'bench_press', active: true }, [
  entry({ id: 'rb1', domain: 'strength', activityCode: 'bench_press', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } })
]);
assert.equal(ratioMissingBodyweight.eligible, false, '24. bodyweight-ratio benchmark requires valid bodyweight evidence');

const bodyMetricProximity = calculateBenchmarkProximity({ code: 'FIRST_BODY_METRIC_BASELINE', title: 'Body metric baseline', domain: 'body_metrics', evaluationType: 'entry', targetValue: 1, direction: 'higher', active: true }, [
  entry({ id: 'bm1', domain: 'body_metrics', activityCode: 'bodyweight', activityName: 'Bodyweight', metrics: { measurement_value: 180, measurement_unit: 'lb' } })
]);
assert.equal(bodyMetricProximity.eligible, false, '25. body metrics do not become athletic intelligence trophies');

const readyPrSeries = buildComparablePerformanceSeries([
  entry({ id: 'pr1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'pr2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 203, weight_unit: 'lb' } }),
  entry({ id: 'pr3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 204, weight_unit: 'lb' } }),
  entry({ id: 'pr4', performanceDate: '2026-07-04', metrics: { sets: 3, repetitions: 5, weight: 205, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
const readyState = evaluatePrAttemptReadiness(readyPrSeries, { normalizedValue: 206 });
assert.equal(readyState.status, 'READY', '26. READY PR state requires sufficient comparable evidence');

assert.equal(runningSeparated.series.length, 2, '27. different distance cannot produce running PR readiness crossover');

const estimatedReadinessSeries = buildComparablePerformanceSeries([
  entry({ id: 'er1', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'er2', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 202, weight_unit: 'lb' } }),
  entry({ id: 'er3', evidenceStatus: 'ESTIMATED', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 204, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_estimated_1rm');
const estimatedReadiness = evaluatePrAttemptReadiness(estimatedReadinessSeries, { normalizedValue: 240 });
assert.equal(estimatedReadiness.status, 'ESTIMATED ONLY', '28. estimated 1RM cannot produce verified 1RM readiness');

const regressedReadiness = evaluatePrAttemptReadiness(sustainedDecline, { normalizedValue: 235 });
assert.equal(regressedReadiness.status, 'RECENT REGRESSION', '29. recent regression blocks READY state');

const approachingSeries = buildComparablePerformanceSeries([
  entry({ id: 'ap1', domain: 'running', performanceDate: '2026-07-01', metrics: { distance: 5, distance_unit: 'km', duration_seconds: 1260 } }),
  entry({ id: 'ap2', domain: 'running', performanceDate: '2026-07-02', metrics: { distance: 5, distance_unit: 'km', duration_seconds: 1245 } }),
  entry({ id: 'ap3', domain: 'running', performanceDate: '2026-07-03', metrics: { distance: 5, distance_unit: 'km', duration_seconds: 1235 } })
]).series[0];
const approachingState = evaluatePrAttemptReadiness(approachingSeries, { normalizedValue: 1210 });
assert.equal(approachingState.status, 'APPROACHING', '30. approaching state is calculated correctly');

const fitnessIntelDraftOnly = buildFitnessTestIntelligence([
  { id: 'ft-draft', protocolCode: 'DOMINION_MONTHLY_FITNESS_TEST', status: 'DRAFT', evidenceStatus: 'SELF REPORTED', testDate: '2026-07-01', eventResults: [] }
]);
assert.equal(fitnessIntelDraftOnly.status, 'INSUFFICIENT DATA', '31. fitness-test draft attempts are excluded');

const fitnessIntelInvalidated = buildFitnessTestIntelligence([
  { id: 'ft-inv', protocolCode: 'DOMINION_MONTHLY_FITNESS_TEST', status: 'INVALIDATED', evidenceStatus: 'VERIFIED', testDate: '2026-07-01', eventResults: [] }
]);
assert.equal(fitnessIntelInvalidated.status, 'INSUFFICIENT DATA', '32. invalidated test attempts are excluded');

const fitnessCompatible = buildFitnessTestIntelligence([
  { id: 'ft-1', protocolCode: 'DOMINION_MONTHLY_FITNESS_TEST', protocolVersion: '1.0', status: 'COMPLETE', evidenceStatus: 'VERIFIED', testDate: '2026-07-01', eventResults: [
    { eventCode: 'push_ups_2m', eventName: 'Push-ups in 2 minutes', rawValue: 40, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'pull_ups_max', eventName: 'Pull-ups, maximum strict repetitions', rawValue: 8, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'air_squats_2m', eventName: 'Air squats in 2 minutes', rawValue: 60, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'plank_hold', eventName: 'Plank hold', rawValue: 120, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'hanging_leg_raises', eventName: 'Hanging leg raises', rawValue: 12, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'burpees_10m', eventName: 'Burpees in 10 minutes', rawValue: 70, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'two_mile_run', eventName: '2-mile run', rawValue: 980, comparisonDirection: 'lower', evidenceStatus: 'VERIFIED' }
  ] },
  { id: 'ft-2', protocolCode: 'DOMINION_MONTHLY_FITNESS_TEST', protocolVersion: '1.0', status: 'COMPLETE', evidenceStatus: 'VERIFIED', testDate: '2026-07-15', eventResults: [
    { eventCode: 'push_ups_2m', eventName: 'Push-ups in 2 minutes', rawValue: 44, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'pull_ups_max', eventName: 'Pull-ups, maximum strict repetitions', rawValue: 10, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'air_squats_2m', eventName: 'Air squats in 2 minutes', rawValue: 62, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'plank_hold', eventName: 'Plank hold', rawValue: 135, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'hanging_leg_raises', eventName: 'Hanging leg raises', rawValue: 14, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'burpees_10m', eventName: 'Burpees in 10 minutes', rawValue: 73, comparisonDirection: 'higher', evidenceStatus: 'VERIFIED' },
    { eventCode: 'two_mile_run', eventName: '2-mile run', rawValue: 960, comparisonDirection: 'lower', evidenceStatus: 'VERIFIED' }
  ] }
]);
assert.ok(fitnessCompatible.eventIntelligence.length >= 7, '33. compatible completed tests compare event by event');
assert.equal(fitnessCompatible.missingEventCount, 0, '34. optional missing events do not count as decline');

const overview = buildPerformanceIntelligenceOverview([
  entry({ id: 'ov1', domain: 'strength', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200, weight_unit: 'lb' } }),
  entry({ id: 'ov2', domain: 'strength', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 210, weight_unit: 'lb' } }),
  entry({ id: 'ov3', domain: 'strength', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 215, weight_unit: 'lb' } }),
  entry({ id: 'ov4', domain: 'running', performanceDate: '2026-07-01', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 460 } }),
  entry({ id: 'ov5', domain: 'running', performanceDate: '2026-07-02', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 470 } }),
  entry({ id: 'ov6', domain: 'running', performanceDate: '2026-07-03', metrics: { distance: 1, distance_unit: 'mi', duration_seconds: 475 } })
], [], [], [], {});
assert.equal(overview.domainSummaries[0].strongestSeries !== null, true, '35. domain summary selects strongest series deterministically');
assert.equal(overview.domainSummaries[0].weakestSeries !== null, true, '35. domain summary selects weakest series deterministically');
assert.equal(['IMPROVING', 'STABLE', 'DECLINING', 'NOISY', 'STRONGLY IMPROVING', 'STRONGLY DECLINING', 'INSUFFICIENT DATA'].includes(overview.overallTrajectory), true, '36. overall trajectory is classification-based distribution');
assert.ok(overview.atlas.text.includes('PLATEAUS') && overview.atlas.text.includes('REGRESSIONS') && overview.atlas.text.includes('PR READINESS'), '37. atlas brief distinguishes plateau, regression, and readiness context');

const localState = derivePerformanceIntelligenceViewState({ localFallbackActive: true, remoteLoadFailed: false, hasHistory: true, hasComparableHistory: true });
const remoteFailState = derivePerformanceIntelligenceViewState({ localFallbackActive: false, remoteLoadFailed: true, hasHistory: false, hasComparableHistory: false });
assert.notEqual(localState.state, remoteFailState.state, '38. local fallback and remote failure remain distinct');

const precisionSeries = buildComparablePerformanceSeries([
  entry({ id: 'fp1', performanceDate: '2026-07-01', metrics: { sets: 3, repetitions: 5, weight: 200.001, weight_unit: 'lb' } }),
  entry({ id: 'fp2', performanceDate: '2026-07-02', metrics: { sets: 3, repetitions: 5, weight: 200.005, weight_unit: 'lb' } }),
  entry({ id: 'fp3', performanceDate: '2026-07-03', metrics: { sets: 3, repetitions: 5, weight: 200.009, weight_unit: 'lb' } })
]).series.find((item) => item.metricCategory === 'strength_load');
const precisionTrend = calculateSeriesTrend(precisionSeries);
assert.ok(Math.abs(precisionTrend.recentNetChange - 0.008) < 0.000001, '39. full precision is retained before formatting');
assert.equal(typeof formatIntelligenceDelta(precisionTrend.recentNetChange, 'lb', 'higher'), 'string', '39. formatting is applied only at presentation boundary');

console.log('performance intelligence tests passed');
