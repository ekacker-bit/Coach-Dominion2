const assert = require('node:assert/strict');
const {
  normalizeComplianceStatus,
  scoreComplianceDomain,
  calculateDisciplineScore,
  formatDisciplineScore,
  buildComplianceExplanation,
  deriveDailyComplianceState
} = require('../assets/js/app.js');

const domainKeys = ['mission', 'strength', 'cardio', 'recovery', 'nutrition'];
const domainsWithStatuses = (statuses) => Object.fromEntries(
  domainKeys.map((key, index) => [key, { status: statuses[index] }])
);

const allComplete = calculateDisciplineScore(domainsWithStatuses([
  'completed', 'completed', 'completed', 'completed', 'completed'
]));
assert.equal(allComplete.score, 100, 'All five completed domains produce 100');

const mixed = calculateDisciplineScore(domainsWithStatuses([
  'completed', 'partial', 'completed', 'partial', 'completed'
]));
assert.equal(mixed.score, 80, 'Complete and partial results use an equal-weight average');

const withMissed = calculateDisciplineScore(domainsWithStatuses([
  'completed', 'missed', 'completed', 'completed', 'completed'
]));
assert.equal(withMissed.score, 80, 'A missed domain contributes zero and reduces the score');

const withExcused = calculateDisciplineScore(domainsWithStatuses([
  'completed', 'excused', 'completed', 'completed', 'completed'
]));
assert.equal(withExcused.score, 100, 'Excused domains are excluded from the denominator');
assert.equal(withExcused.includedCount, 4);

const withNotApplicable = calculateDisciplineScore(domainsWithStatuses([
  'completed', 'not_applicable', 'completed', 'not_applicable', 'completed'
]));
assert.equal(withNotApplicable.score, 100, 'N/A domains are excluded from the denominator');
assert.equal(withNotApplicable.includedCount, 3);

const unscored = deriveDailyComplianceState(domainsWithStatuses([
  null, 'excused', 'not_applicable', '', 'invalid'
]));
assert.equal(unscored.score, null, 'No applicable assessed domains returns an unscored value');
assert.equal(unscored.displayScore, 'UNSCORED');

assert.equal(normalizeComplianceStatus('unknown'), null, 'Invalid status normalizes to unassessed');
assert.deepEqual(
  scoreComplianceDomain({ status: 'invalid' }),
  { status: null, included: false, score: null, reason: 'Not assessed; no completion credit assigned.' },
  'Missing or invalid status receives no completion credit'
);

const restricted = deriveDailyComplianceState({
  mission: { status: 'excused', restriction: 'RED readiness denied hard training', approvedModification: true },
  strength: { status: 'not_applicable' },
  cardio: { status: 'not_applicable' },
  recovery: { status: 'completed', target: 'Recovery protocol' },
  nutrition: { status: 'completed' }
});
assert.equal(restricted.score, 100, 'Approved readiness restrictions are represented without penalty');
assert.match(restricted.evidence.find((item) => item.key === 'mission').reason, /RED readiness denied hard training/);
assert.deepEqual(restricted.violations, [], 'An excused restriction is not classified as a violation');

const explanation = buildComplianceExplanation(withExcused);
assert.ok(explanation.included.some((line) => line.startsWith('Mission Compliance:')));
assert.ok(explanation.excluded.some((line) => line.startsWith('Strength Compliance: excused')));

const mutableInput = {
  mission: { status: 'completed', note: 'Original' },
  strength: { status: 'partial' }
};
const snapshot = structuredClone(mutableInput);
calculateDisciplineScore(mutableInput);
assert.deepEqual(mutableInput, snapshot, 'Score calculation does not mutate input data');

const repeating = calculateDisciplineScore(domainsWithStatuses([
  'completed', 'partial', 'partial', 'excused', 'not_applicable'
]));
assert.equal(repeating.score, 200 / 3, 'Internal score retains JavaScript division precision');
assert.equal(formatDisciplineScore(repeating.score), '67%', 'Rounding occurs only for display');

console.log('compliance foundation tests passed');
