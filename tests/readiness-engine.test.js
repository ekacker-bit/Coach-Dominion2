const assert = require('node:assert/strict');
const {
  evaluateReadiness,
  generateMission,
  dailyIntelligence,
  buildCommandEvents,
  __setSessionForTests
} = require('../assets/js/app.js');

const base = { date: '2026-07-16', energy: 8, soreness: 3, pain: false };

assert.equal(evaluateReadiness({ ...base, pain: true }).state, 'RED', 'Pain true selects RED');
assert.equal(evaluateReadiness(base).state, 'GREEN', 'Energy 8, soreness 3, no pain selects GREEN');
assert.equal(evaluateReadiness({ ...base, energy: 6 }).state, 'YELLOW', 'Energy 6 selects YELLOW');
assert.equal(evaluateReadiness({ ...base, soreness: 6 }).state, 'YELLOW', 'Soreness 6 selects YELLOW');
assert.equal(evaluateReadiness(base).confidence, 0.60, 'Required fields only provide 60% confidence');
assert.equal(evaluateReadiness({ ...base, sleep: 8, resting_heart_rate: 55, weight: 185, steps: 9000 }).confidence, 1, 'All optional evidence provides 100% confidence');
assert.deepEqual(evaluateReadiness(base).missingEvidence, ['Sleep', 'Resting heart rate', 'Weight', 'Steps'], 'Missing optional evidence is listed');

const yellow = evaluateReadiness({ ...base, energy: 6 });
assert.deepEqual(dailyIntelligence(yellow), ['YELLOW protocol', yellow.headline, yellow.instruction, yellow.primaryRisk], 'Daily Intelligence consumes engine output');
assert.equal(generateMission(yellow).generatedFromReadiness, yellow.state, 'Mission generation consumes engine state');

__setSessionForTests({ user: { id: 'test-user' } });
const events = buildCommandEvents(base, { ...base });
assert.equal(events.filter((event) => event.event_type === 'READINESS_UPDATED').length, 0, 'Same-state resubmission does not create a false readiness transition event');

console.log('readiness-engine tests passed');
