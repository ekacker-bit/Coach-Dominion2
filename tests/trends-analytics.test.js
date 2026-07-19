const assert = require('node:assert/strict');
const {
  sortInspectionHistory,
  selectTrendWindow,
  calculateLinearTrend,
  deriveTrajectoryState,
  calculateDomainTrends,
  calculateComplianceStreaks,
  summarizeInspectionHistory,
  identifyBestAndLowestWeeks,
  buildChartSeries,
  generateAtlasTrendReport,
  formatDisciplineScore
} = require('../assets/js/app.js');

const domains = ['mission', 'strength', 'cardio', 'recovery', 'nutrition'];
const week = (date, score, evidence = 100, finalized = true, domainValues = {}) => ({
  week_start_date: date,
  week_end_date: date,
  weekly_discipline_score: score,
  evidence_coverage: evidence,
  finalized_at: finalized ? `${date}T12:00:00Z` : null,
  domain_scores: Object.fromEntries(domains.map((key) => [key, { score: Object.hasOwn(domainValues, key) ? domainValues[key] : score }]))
});
const dates = ['2026-05-04', '2026-05-11', '2026-05-18', '2026-05-25'];

assert.equal(deriveTrajectoryState([week(dates[0], 50)]).state, 'INSUFFICIENT HISTORY', '1. fewer than two finalized weeks is insufficient');
assert.equal(deriveTrajectoryState(dates.map((date, i) => week(date, 50 + i * 10))).state, 'IMPROVING', '2. improving scores improve');
assert.equal(deriveTrajectoryState(dates.map((date, i) => week(date, 90 - i * 10))).state, 'DECLINING', '3. declining scores decline');
assert.equal(deriveTrajectoryState(dates.map((date, i) => week(date, 75 + i))).state, 'STABLE', '4. changes below two points/week are stable');
assert.equal(deriveTrajectoryState(dates.map((date, i) => week(date, 90 + i, 40))).state, 'LIMITED EVIDENCE', '5. weak average evidence overrides direction');
assert.equal(deriveTrajectoryState(dates.map((date, i) => week(date, 30 - i * 5, 100))).state, 'DECLINING', '6. low scores with strong evidence remain valid');

const unscoredHistory = [week(dates[0], 50), week(dates[1], null), week(dates[2], 70)];
assert.equal(summarizeInspectionHistory(unscoredHistory).recentAverageScore, 60, '7. UNSCORED weeks leave averages');
assert.equal(calculateLinearTrend([{ date: dates[0], value: 50 }, { date: dates[2], value: 70 }]), 10, '8. missing week is elapsed time, not zero');

const mixedSeries = buildChartSeries([week(dates[0], 60)], week(dates[1], 65, 70, false));
assert.deepEqual(mixedSeries.map((item) => item.kind), ['FINALIZED', 'PROVISIONAL'], '9. finalized and provisional remain labeled');

const extrema = identifyBestAndLowestWeeks([week(dates[2], 80), week(dates[0], 80), week(dates[1], 40)]);
assert.equal(extrema.bestWeek.weekStartDate, dates[0], '10/11. best tie resolves to earliest date');
assert.equal(extrema.lowestWeek.weekStartDate, dates[1]);

const domainHistory = dates.map((date, i) => week(date, 70, 100, true, { mission: 50 + i * 5, strength: 70 + i, cardio: 90 - i * 5 }));
const directions = calculateDomainTrends(domainHistory);
assert.equal(directions.mission.direction, 'UP', '12. domain UP works');
assert.equal(directions.strength.direction, 'FLAT', 'domain FLAT works');
assert.equal(directions.cardio.direction, 'DOWN', 'domain DOWN works');
assert.equal(calculateDomainTrends([week(dates[0], 50)]).mission.direction, 'LIMITED EVIDENCE', '13. one domain point has limited evidence');
assert.equal(calculateDomainTrends(dates.map((date) => week(date, 50, 100, true, { recovery: null }))).recovery.direction, 'NO DATA');

const daily = (date, statuses = ['completed', null, null, null, null]) => ({ compliance_date: date, ...Object.fromEntries(domains.map((key, i) => [`${key}_status`, statuses[i]])) });
const full = ['completed', 'partial', 'missed', 'excused', 'not_applicable'];
let streaks = calculateComplianceStreaks([daily('2026-06-01'), daily('2026-06-02'), daily('2026-06-03')], '2026-06-03');
assert.equal(streaks.currentAssessedDayStreak, 3, '14. current assessed streak works');
streaks = calculateComplianceStreaks([daily('2026-06-01'), daily('2026-06-02'), daily('2026-06-04'), daily('2026-06-05')], '2026-06-05');
assert.equal(streaks.longestAssessedDayStreak, 2, '15. longest streak works');
streaks = calculateComplianceStreaks([daily('2026-06-02', full), daily('2026-06-03', full)], '2026-06-03');
assert.equal(streaks.currentFullyAssessedDayStreak, 2, '16. five intentional statuses make a full streak');
assert.equal(calculateComplianceStreaks([daily('2026-01-31'), daily('2026-02-01')], '2026-02-01').currentAssessedDayStreak, 2, '17. month boundary works');
assert.equal(calculateComplianceStreaks([daily('2026-12-31'), daily('2027-01-01')], '2027-01-01').currentAssessedDayStreak, 2, '18. year boundary works');
assert.equal(calculateComplianceStreaks([daily('2027-01-01'), daily('2027-01-02')], '2027-01-01').currentAssessedDayStreak, 1, '19. future dates are ignored');

const originalWeeks = dates.map((date, i) => week(date, 50 + i));
const originalDaily = [daily('2026-06-01')];
const weeksCopy = structuredClone(originalWeeks);
const dailyCopy = structuredClone(originalDaily);
deriveTrajectoryState(originalWeeks); calculateDomainTrends(originalWeeks); calculateComplianceStreaks(originalDaily, '2026-06-01');
assert.deepEqual(originalWeeks, weeksCopy, '20. weekly inputs are not mutated');
assert.deepEqual(originalDaily, dailyCopy, 'daily inputs are not mutated');

const precision = calculateLinearTrend([{ date: dates[0], value: 50 }, { date: dates[1], value: 50.5 }, { date: dates[2], value: 51.25 }]);
assert.equal(precision, 0.625, '21. slope retains full precision');
assert.equal(formatDisciplineScore(200 / 3), '67%', '22. display rounding is separate');

const unordered = buildChartSeries([week(dates[2], 70), week(dates[0], 50), week(dates[1], 60)]);
assert.deepEqual(unordered.map((item) => item.weekStartDate), dates.slice(0, 3), '23. chart series is chronological');

const finalizedSnapshot = week(dates[0], 88);
const changedDaily = [daily(dates[0], ['missed', 'missed', 'missed', 'missed', 'missed'])];
assert.equal(buildChartSeries([finalizedSnapshot], { weekStartDate: dates[1], score: 0, evidenceCoverage: 100 })[0].score, 88, '24. finalized chart value uses stored snapshot');
assert.equal(changedDaily[0].mission_status, 'missed');

const weakAnalytics = {
  trajectory: deriveTrajectoryState([week(dates[0], 100, 40), week(dates[1], 100, 40)]),
  domainTrends: calculateDomainTrends([week(dates[0], 100, 40), week(dates[1], 100, 40)]),
  streaks: { currentAssessedDayStreak: 0, longestAssessedDayStreak: 0 },
  summary: summarizeInspectionHistory([week(dates[0], 100, 40), week(dates[1], 100, 40)])
};
assert.match(generateAtlasTrendReport(weakAnalytics).commandNote, /Weak evidence/, '25. report identifies weak evidence rather than claiming success');
const poorAnalytics = { ...weakAnalytics, trajectory: deriveTrajectoryState([week(dates[0], 50), week(dates[1], 40)]), domainTrends: calculateDomainTrends([week(dates[0], 50), week(dates[1], 40)]), summary: summarizeInspectionHistory([week(dates[0], 50), week(dates[1], 40)]) };
assert.match(generateAtlasTrendReport(poorAnalytics).commandNote, /below standard/, 'report distinguishes documented poor performance');

assert.deepEqual(sortInspectionHistory([week(dates[1], 2), week(dates[0], 1)]).map((item) => item.weekStartDate), dates.slice(0, 2));
assert.equal(selectTrendWindow(dates.map((date, i) => week(date, i))).length, 4);
console.log('trends analytics tests passed');
