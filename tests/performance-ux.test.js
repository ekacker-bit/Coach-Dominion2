const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { derivePerformanceIntelligenceViewState } = require('../assets/js/app.js');

const appHtml = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');

assert.ok(appHtml.includes('data-performance-view="overview"'), 'performance view has OVERVIEW tab');
assert.ok(appHtml.includes('data-performance-view="log"'), 'performance view has LOG tab');
assert.ok(appHtml.includes('data-performance-view="fitness_tests"'), 'performance view has FITNESS TESTS tab');
assert.ok(appHtml.includes('data-performance-view="records"'), 'performance view has RECORDS tab');
assert.ok(appHtml.includes('data-performance-view="milestones"'), 'performance view has MILESTONES tab');
assert.ok(appHtml.includes('data-performance-view="intelligence"'), 'performance view has INTELLIGENCE tab');
assert.ok(appHtml.includes('id="performance-intelligence-status"'), 'intelligence status strip exists');
assert.ok(appHtml.includes('id="performance-intelligence-panel"'), 'intelligence panel exists');

const noHistory = derivePerformanceIntelligenceViewState({ hasHistory: false, hasComparableHistory: false });
assert.equal(noHistory.state, 'no_history', 'no history state remains explicit');
const remoteFailure = derivePerformanceIntelligenceViewState({ remoteLoadFailed: true, hasHistory: false, hasComparableHistory: false });
assert.equal(remoteFailure.state, 'remote_load_failed', 'remote load failure is distinct from empty state');
const localFallback = derivePerformanceIntelligenceViewState({ localFallbackActive: true, hasHistory: true, hasComparableHistory: true });
assert.equal(localFallback.state, 'local_fallback_active', 'local fallback active state remains explicit');

console.log('performance ux tests passed');
