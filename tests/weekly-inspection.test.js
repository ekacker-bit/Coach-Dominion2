const assert = require('node:assert/strict');
const {
  aggregateWeeklyCompliance,
  calculateEvidenceCoverage,
  deriveInspectionStatus,
  finalizeWeeklyInspectionSnapshot,
  formatDisciplineScore,
  getInspectionWeekRange,
  WEEKLY_EVIDENCE_THRESHOLD
} = require('../assets/js/app.js');

const domains = ['mission', 'strength', 'cardio', 'recovery', 'nutrition'];
const record = (date, statuses, extras = {}) => ({
  compliance_date: date,
  ...Object.fromEntries(domains.flatMap((key, index) => [
    [`${key}_status`, Array.isArray(statuses) ? statuses[index] : statuses],
    [`${key}_target`, `${key} target`],
    [`${key}_restriction`, ''],
    [`${key}_approved_modification`, false]
  ])),
  ...extras
});
const dates = ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'];
const week = (statuses) => dates.map((date) => record(date, statuses));

const complete = aggregateWeeklyCompliance(week('completed'), dates[0]);
assert.equal(complete.score, 100, '1. seven completed days score 100');
assert.equal(complete.evidenceCoverage, 100);

const mixed = aggregateWeeklyCompliance([
  record(dates[0], ['completed', 'partial', 'missed', 'completed', 'partial']),
  ...dates.slice(1).map((date) => record(date, 'completed'))
], dates[0]);
assert.equal(mixed.score, (32 * 100 + 2 * 50) / 35, '2. underlying observations aggregate exactly');

const excused = aggregateWeeklyCompliance(week(['completed', 'excused', 'completed', 'completed', 'completed']), dates[0]);
assert.equal(excused.score, 100, '3. excused observations leave denominator');
assert.equal(excused.domainScores.strength.score, null);

const na = aggregateWeeklyCompliance(week(['completed', 'not_applicable', 'completed', 'completed', 'completed']), dates[0]);
assert.equal(na.score, 100, '4. N/A observations leave denominator');
assert.equal(na.evidenceCoverage, 100);

const missing = aggregateWeeklyCompliance([record(dates[0], 'completed')], dates[0]);
assert.ok(Math.abs(missing.evidenceCoverage - 100 / 7) < Number.EPSILON * 10, '5. missing days reduce coverage');
assert.equal(missing.inspectionStatus, 'LIMITED EVIDENCE', '6. sparse high score has limited evidence');
assert.equal(missing.score, 100);

const poor = aggregateWeeklyCompliance(week('missed'), dates[0]);
assert.equal(poor.score, 0, '7. documented poor execution scores low');
assert.equal(poor.evidenceCoverage, 100);
assert.equal(poor.inspectionStatus, 'READY FOR INSPECTION');

const unscored = aggregateWeeklyCompliance(week('excused'), dates[0]);
assert.equal(unscored.score, null, '8. no applicable observation is UNSCORED');
assert.equal(formatDisciplineScore(unscored.score), 'UNSCORED');

const ranked = aggregateWeeklyCompliance(week(['completed', 'partial', 'missed', 'completed', 'partial']), dates[0]);
assert.deepEqual(ranked.strongestDomains, ['mission', 'recovery'], '9/10. tied strongest domains preserve configured order');
assert.deepEqual(ranked.weakestDomains, ['cardio']);

const safety = aggregateWeeklyCompliance([
  record(dates[0], ['missed', 'completed', 'completed', 'missed', 'completed']),
  record(dates[1], ['missed', 'completed', 'completed', 'missed', 'completed']),
  ...dates.slice(2).map((date) => record(date, 'completed'))
], dates[0]);
assert.equal(safety.nextWeekPriority.code, 'RECOVERY_SAFETY', '11. recovery concern outranks mission misses');

const missionMisses = aggregateWeeklyCompliance([
  record(dates[0], ['missed', 'completed', 'completed', 'completed', 'completed']),
  record(dates[1], ['missed', 'completed', 'completed', 'completed', 'completed']),
  ...dates.slice(2).map((date) => record(date, 'completed'))
], dates[0]);
assert.equal(missionMisses.nextWeekPriority.code, 'MISSION_EXECUTION', '12. repeated mission misses set priority');

const modified = aggregateWeeklyCompliance([
  record(dates[0], ['missed', 'completed', 'completed', 'completed', 'completed'], { mission_approved_modification: true }),
  ...dates.slice(1).map((date) => record(date, 'completed'))
], dates[0]);
assert.equal(modified.missedRequirements.length, 0, '13. approved modifications are not missed requirements');
assert.equal(modified.approvedModificationCompliance[0].followed, false, 'modification adherence remains transparent');

const source = week('completed');
const aggregate = aggregateWeeklyCompliance(source, dates[0]);
const finalized = finalizeWeeklyInspectionSnapshot(aggregate, '2027-01-04T00:00:00.000Z');
source[0].mission_status = 'missed';
assert.equal(finalized.score, 100, '14. finalized snapshot is stable after source changes');

const invalid = aggregateWeeklyCompliance(week(['invalid', 'completed', 'completed', 'completed', 'completed']), dates[0]);
assert.equal(invalid.counts.completed, 28, '15. invalid statuses get no completion credit');
assert.equal(invalid.evidenceCoverage, 80);

const immutableInput = week('completed');
const immutableCopy = structuredClone(immutableInput);
aggregateWeeklyCompliance(immutableInput, dates[0]);
assert.deepEqual(immutableInput, immutableCopy, '16. aggregation does not mutate daily records');

const precision = aggregateWeeklyCompliance([record(dates[0], ['completed', 'partial', 'partial', 'excused', 'not_applicable'])], dates[0]);
assert.equal(precision.score, 200 / 3, '17. internal precision is retained');
assert.equal(formatDisciplineScore(precision.score), '67%');

assert.deepEqual(getInspectionWeekRange('2027-01-01'), { weekStartDate: '2026-12-28', weekEndDate: '2027-01-03' }, '18. year boundary normalizes Monday-Sunday');
assert.deepEqual(getInspectionWeekRange('2026-03-01'), { weekStartDate: '2026-02-23', weekEndDate: '2026-03-01' }, 'month boundary normalizes Monday-Sunday');

assert.equal(WEEKLY_EVIDENCE_THRESHOLD, 60);
assert.throws(() => finalizeWeeklyInspectionSnapshot(missing), /requires at least 60%/, '19. limited evidence blocks finalization');
assert.equal(deriveInspectionStatus({ counts: { assessedObservations: 0 }, evidenceCoverage: 0 }), 'NOT READY');

assert.deepEqual(calculateEvidenceCoverage([{ status: 'not_applicable' }]), { expectedObservations: 0, assessedObservations: 0, intentionalNACount: 1, percentage: 100 });
console.log('weekly inspection tests passed');
