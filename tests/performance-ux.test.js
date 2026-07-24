const assert = require('assert');
const {
  buildPerformanceOverviewModel,
  buildPerformanceFitnessScorecardModel,
  buildPerformanceRecordTimelineModel,
  buildPerformanceMilestoneWallModel,
  buildPerformanceViewModel
} = require('../assets/js/app.js');

const entries = [
  { id: 'entry-1', performanceDate: '2026-07-21', domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Bench Press', evidenceStatus: 'VERIFIED', metrics: { weight: 225, weight_unit: 'lb' } },
  { id: 'entry-2', performanceDate: '2026-07-22', domain: 'running', entryType: 'WORKOUT_SUMMARY', activityName: 'Tempo Run', evidenceStatus: 'SELF REPORTED', metrics: { distance: 5, duration_seconds: 1800 } },
  { id: 'entry-3', performanceDate: '2026-07-23', domain: 'fitness_test', entryType: 'FORMAL_TEST', activityName: 'Dominion Monthly Fitness Test', evidenceStatus: 'VERIFIED', metrics: { overall_score: 84 } }
];
const personalRecords = [
  { recordCategory: 'LOAD_PR', activityName: 'Bench Press', normalizedValue: 225, unit: 'lb', recordStatus: 'CONFIRMED' }
];
const milestoneAchievements = [
  { milestoneCode: 'FIRST_STRENGTH_BENCHMARK', title: 'First strength benchmark logged', achievedDate: '2026-07-21' }
];
const fitnessAttempts = [
  { id: 'attempt-1', status: 'COMPLETE', protocolName: 'Dominion Monthly Fitness Test', completedAt: '2026-07-23', overallScore: 84 }
];

const overview = buildPerformanceOverviewModel(entries, personalRecords, milestoneAchievements, fitnessAttempts, [{ status: 'TEST COMPLETED' }]);
assert.equal(overview.summaryMetrics[1].value, 1, 'overview summary includes the personal-record tally');
assert.equal(overview.latestSignals[0].label, 'Latest strength', 'overview includes latest strength signal');
assert.equal(overview.achievementFeed[0].title, 'Bench Press', 'overview turns the latest PR into an achievement feed item');

const fitnessCards = buildPerformanceFitnessScorecardModel(fitnessAttempts, personalRecords);
assert.equal(fitnessCards[0].title, 'Dominion Monthly Fitness Test', 'fitness scorecards surface the test title');
assert.equal(fitnessCards[0].score, 84, 'fitness scorecards carry the recorded overall score');

const recordTimeline = buildPerformanceRecordTimelineModel(personalRecords, entries);
assert.equal(recordTimeline[0].category, 'LOAD_PR', 'record timeline carries the personal-record category');
assert.equal(recordTimeline[0].metric, '225 lb', 'record timeline formats the record metric');

const milestoneWall = buildPerformanceMilestoneWallModel(milestoneAchievements, [
  { code: 'FIRST_STRENGTH_BENCHMARK', title: 'First strength benchmark logged', commandNote: 'Strength baseline established.' }
]);
assert.equal(milestoneWall[0].title, 'First strength benchmark logged', 'milestone wall renders the achieved milestone title');

const viewModel = buildPerformanceViewModel(entries, personalRecords, milestoneAchievements, fitnessAttempts, [{ status: 'TEST COMPLETED' }]);
assert.ok(viewModel.overview.summaryMetrics.length >= 4, 'view model exposes overview metrics');
assert.ok(viewModel.records.length >= 1, 'view model exposes record cards');
assert.ok(viewModel.milestones.length >= 1, 'view model exposes milestone cards');

console.log('performance UX view-model tests passed');
