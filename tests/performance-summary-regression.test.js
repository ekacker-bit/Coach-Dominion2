const assert = require('assert');
const { summarizeRecentPerformance } = require('../assets/js/app.js');

const entries = [
  { performanceDate: '2026-07-20', domain: 'strength', entryType: 'TRAINING_SET', activityName: 'Squat', metrics: {} },
  { performanceDate: '2026-07-21', domain: 'running', entryType: 'WORKOUT SUMMARY', activityName: 'Easy Run', metrics: {} },
  { performanceDate: '2026-07-22', domain: 'strength', entryType: 'BENCHMARK', activityName: 'Bench Press', metrics: {} }
];

const snapshot = JSON.stringify(entries);
const summary = summarizeRecentPerformance(entries);
assert.equal(summary.entriesThisWeek, 3, 'recent summary stays scoped to applicable entry week rather than wall-clock drift');
assert.equal(JSON.stringify(entries), snapshot, 'summarizeRecentPerformance does not mutate source entries');

console.log('performance summary regression tests passed');
