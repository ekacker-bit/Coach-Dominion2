const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  buildCoreWorkspaceModel,
  derivePerformanceIntelligenceViewState,
  normalizePerformanceViewCode
} = require('../assets/js/app.js');

const appHtml = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');

const trainingDestinations = [...appHtml.matchAll(/data-performance-view="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(trainingDestinations, ['today_training', 'log', 'running', 'core', 'progress'], 'training workspace exposes exactly five primary destinations');
assert.ok(appHtml.includes('TODAY’S TRAINING'), 'training workspace has TODAY’S TRAINING destination');
assert.ok(appHtml.includes('ABS / CORE'), 'training workspace has dedicated ABS / CORE destination');
assert.ok(appHtml.includes('id="performance-view-progress"'), 'training workspace consolidates progress tools');
assert.ok(appHtml.includes('id="performance-intelligence-status"'), 'intelligence status strip exists');
assert.ok(appHtml.includes('id="performance-intelligence-panel"'), 'intelligence panel exists');
assert.ok(appHtml.includes('id="fitness-test-history"'), 'fitness test history remains available');
assert.ok(appHtml.includes('id="performance-pr-list"'), 'personal records remain available');
assert.ok(appHtml.includes('id="performance-milestone-history"'), 'milestone history remains available');

assert.equal(normalizePerformanceViewCode('overview'), 'today_training', 'legacy overview links route to today training');
assert.equal(normalizePerformanceViewCode('programming'), 'today_training', 'legacy programming links route to today training');
assert.equal(normalizePerformanceViewCode('recovery'), 'today_training', 'legacy recovery links route to today training');
assert.equal(normalizePerformanceViewCode('fitness_tests'), 'progress', 'legacy fitness test links route to progress');
assert.equal(normalizePerformanceViewCode('records'), 'progress', 'legacy record links route to progress');
assert.equal(normalizePerformanceViewCode('intelligence'), 'progress', 'legacy intelligence links route to progress');
assert.equal(normalizePerformanceViewCode('abs_core'), 'core', 'abs/core alias routes to the core workspace');

const coreModel = buildCoreWorkspaceModel([
  { performanceDate: '2026-07-28', domain: 'core', entryType: 'BENCHMARK', activityCode: 'plank', activityName: 'Plank', metrics: { duration_seconds: 90 } },
  { performanceDate: '2026-07-29', domain: 'core', entryType: 'TRAINING_SET', activityCode: 'sit_up', activityName: 'Sit-Up', metrics: { repetitions: 30 } },
  { performanceDate: '2026-07-20', domain: 'core', entryType: 'TRAINING_SET', activityCode: 'hanging_leg_raise', activityName: 'Hanging Leg Raise', metrics: { repetitions: 12 } },
  { performanceDate: '2026-07-29', domain: 'strength', entryType: 'TRAINING_SET', activityCode: 'squat', activityName: 'Squat', metrics: { sets: 3, repetitions: 5 } }
], [], { referenceDate: '2026-07-29' });
assert.equal(coreModel.sessionsThisWeek, 2, 'core workspace counts only this week core sessions');
assert.equal(coreModel.totalRepetitions, 30, 'core workspace totals this week repetitions');
assert.equal(coreModel.totalDurationSeconds, 90, 'core workspace totals this week time under tension');
assert.equal(coreModel.activeDays, 2, 'core workspace counts distinct active days');
assert.equal(coreModel.nextMilestone.code, 'PLANK_2MIN', 'core workspace chooses the next unmet core objective');
assert.equal(coreModel.nextMilestone.progressPercent, 75, 'core objective exposes deterministic progress');

const noHistory = derivePerformanceIntelligenceViewState({ hasHistory: false, hasComparableHistory: false });
assert.equal(noHistory.state, 'no_history', 'no history state remains explicit');
const remoteFailure = derivePerformanceIntelligenceViewState({ remoteLoadFailed: true, hasHistory: false, hasComparableHistory: false });
assert.equal(remoteFailure.state, 'remote_load_failed', 'remote load failure is distinct from empty state');
const localFallback = derivePerformanceIntelligenceViewState({ localFallbackActive: true, hasHistory: true, hasComparableHistory: true });
assert.equal(localFallback.state, 'local_fallback_active', 'local fallback active state remains explicit');

console.log('performance ux tests passed');
