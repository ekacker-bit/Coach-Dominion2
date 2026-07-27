const assert = require('assert');
const { summarizeRecentPerformance } = require('../assets/js/app.js');

function todayISODate() {
  return new Date().toLocaleDateString('en-CA');
}

const deterministicEntries = [
  { performanceDate: '2026-07-20', domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Squat', metrics: {} },
  { performanceDate: '2026-07-21', domain: 'running', entryType: 'WORKOUT SUMMARY', activityName: 'Easy Run', metrics: {} },
  { performanceDate: '2026-07-22', domain: 'strength', entryType: 'BENCHMARK', activityName: 'Bench Press', metrics: {} }
];
const deterministicSnapshot = JSON.stringify(deterministicEntries);
const deterministicSummary = summarizeRecentPerformance(deterministicEntries, { referenceDate: '2026-07-22' });
assert.equal(deterministicSummary.entriesThisWeek, 3, 'deterministic fixture date preserves expected weekly summary count');
assert.equal(JSON.stringify(deterministicEntries), deterministicSnapshot, 'summary with fixture reference date does not mutate inputs');

const currentWeekEntries = [
  { performanceDate: todayISODate(), domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Bench Press', metrics: {} },
  { performanceDate: todayISODate(), domain: 'running', entryType: 'WORKOUT SUMMARY', activityName: 'Easy Run', metrics: {} }
];
const currentSummary = summarizeRecentPerformance(currentWeekEntries);
assert.equal(currentSummary.entriesThisWeek, 2, 'production default counts current-week entries as current');

const oldEntries = [
  { performanceDate: '2000-01-01', domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Old Lift', metrics: {} },
  { performanceDate: '2000-01-02', domain: 'running', entryType: 'WORKOUT SUMMARY', activityName: 'Old Run', metrics: {} }
];
const oldSummary = summarizeRecentPerformance(oldEntries);
assert.equal(oldSummary.entriesThisWeek, 0, 'production default excludes old historical entries from current-week summary');

console.log('performance summary regression tests passed');
