const assert = require('assert');
const {
  getRankCatalog,
  getCurrentRankDefinition,
  getNextRankDefinition,
  calculatePromotionMetrics,
  calculateConsecutiveQualifyingWeeks,
  evaluatePromotionEligibility,
  derivePromotionState,
  buildPromotionEvidence,
  generateAtlasPromotionReview,
  finalizePromotionSnapshot,
  validateRankTransition,
  buildRankStatusEvent,
  deriveCorrectivePeriodState,
  summarizePromotionHistory,
  deriveRankStatusFromRecord,
  formatPromotionMetric,
  normalizeRankCode
} = require('../assets/js/app.js');

const catalog = getRankCatalog();
assert.ok(Array.isArray(catalog), 'rank catalog should be an array');
assert.equal(catalog[0].code, 'RECRUIT', 'new users start as recruit');
assert.ok(catalog.every((item, index) => item.sequenceOrder === index + 1), 'rank catalog should remain in sequence order');

const currentRank = getCurrentRankDefinition('RECRUIT');
assert.equal(currentRank.code, 'RECRUIT', 'current rank definition resolves recruit');
assert.equal(getNextRankDefinition('RECRUIT').code, 'CADET', 'next rank definition resolves the next step');
assert.equal(validateRankTransition('RECRUIT', 'CADET').valid, true, 'rank transition from recruit to cadet should be valid');
assert.equal(validateRankTransition('RECRUIT', 'OPERATOR').valid, false, 'rank skipping should be blocked');

const metrics = calculatePromotionMetrics({
  finalizedInspections: 1,
  recentAverageDisciplineScore: 72,
  recentAverageEvidenceCoverage: 62,
  consecutiveQualifyingWeeks: 1,
  unresolvedConfirmedViolations: 0,
  unresolvedLevelTwoViolations: 0,
  unresolvedLevelThreeViolations: 0,
  activeCorrectivePeriod: false,
  domainScores: { mission: 76, strength: 74, cardio: 72, recovery: 70, nutrition: 74 },
  currentRank: 'RECRUIT'
}, 'CADET');
assert.equal(metrics.finalizedInspectionsRequired, 2, 'cadet requires two finalized inspections');
assert.equal(metrics.state, 'PROGRESSING', 'partial progress should be progressing');

const eligible = evaluatePromotionEligibility({
  currentRank: 'CADET',
  finalizedInspections: 2,
  recentAverageDisciplineScore: 70,
  recentAverageEvidenceCoverage: 60,
  consecutiveQualifyingWeeks: 2,
  unresolvedConfirmedViolations: 0,
  unresolvedLevelTwoViolations: 0,
  unresolvedLevelThreeViolations: 0,
  activeCorrectivePeriod: false,
  domainScores: { mission: 80, strength: 78, cardio: 76, recovery: 74, nutrition: 78 },
  weeklyHistory: [
    { weekStartDate: '2026-06-01', weekEndDate: '2026-06-07', finalizedAt: true, score: 72, evidenceCoverage: 62, kind: 'FINALIZED' },
    { weekStartDate: '2026-06-08', weekEndDate: '2026-06-14', finalizedAt: true, score: 74, evidenceCoverage: 64, kind: 'FINALIZED' }
  ]
}, 'CADET');
assert.equal(eligible.status, 'ELIGIBLE', 'meeting the requirements should produce eligible');
assert.equal(derivePromotionState(eligible).state, 'ELIGIBLE', 'eligible status should stay eligible until finalized');

const pending = finalizePromotionSnapshot({
  currentRank: 'CADET',
  nextRank: 'OPERATOR',
  status: 'ELIGIBLE',
  effectiveDate: '2026-07-15',
  promotionAuthorized: false
}, false);
assert.equal(pending.status, 'ELIGIBLE', 'promotion requires deliberate authorization');
const promoted = finalizePromotionSnapshot({
  currentRank: 'CADET',
  nextRank: 'OPERATOR',
  status: 'ELIGIBLE',
  effectiveDate: '2026-07-15',
  promotionAuthorized: true
}, true);
assert.equal(promoted.currentRank, 'OPERATOR', 'promotion finalization should advance one rank');
assert.equal(promoted.promotionState, 'PROMOTED', 'promotion should become promoted when finalized');

const evidence = buildPromotionEvidence({
  currentRank: 'RECRUIT',
  nextRank: 'CADET',
  finalizedInspections: 1,
  recentAverageDisciplineScore: 68,
  recentAverageEvidenceCoverage: 55,
  consecutiveQualifyingWeeks: 0,
  unresolvedConfirmedViolations: 0,
  unresolvedLevelTwoViolations: 0,
  unresolvedLevelThreeViolations: 0,
  activeCorrectivePeriod: false,
  requirements: []
});
assert.ok(Array.isArray(evidence.requirements), 'evidence should include structured requirements');
assert.ok(evidence.requirements.some((item) => item.requirement === 'finalized_inspections'), 'evidence should include the inspection requirement');

const review = generateAtlasPromotionReview({ currentRank: 'CADET', nextRank: 'OPERATOR', status: 'PROGRESSING', blockers: ['weak evidence'], remainingActions: ['improve evidence coverage'] });
assert.ok(review.text.includes('ATLAS // PROMOTION REVIEW'), 'promotion review should include the atlas header');

const event = buildRankStatusEvent('status_changed', 'RECRUIT', 'CADET', 'ELIGIBLE', 'PROMOTED', { note: 'earned promotion' });
assert.equal(event.newRank, 'CADET', 'rank events preserve the new rank');

const corrective = deriveCorrectivePeriodState({ activeCorrectivePeriod: true, correctivePeriodStatus: 'ACTIVE', correctivePeriodReason: 'serious unresolved issue' });
assert.equal(corrective.blocksPromotion, true, 'corrective periods should block promotion');
assert.equal(corrective.state, 'CORRECTIVE PERIOD', 'corrective periods should derive the proper state');

const history = summarizePromotionHistory([{ currentRank: 'RECRUIT', nextRank: 'CADET', promotionState: 'PROMOTED' }, { currentRank: 'CADET', nextRank: 'OPERATOR', promotionState: 'PROMOTED' }]);
assert.equal(history.totalPromotions, 2, 'promotion summaries should count finalized promotions');

const statusFromRecord = deriveRankStatusFromRecord({ current_rank: 'OPERATOR', promotion_state: 'PROMOTED' });
assert.equal(statusFromRecord.currentRank, 'OPERATOR', 'rank status records should hydrate to the runtime shape');
assert.equal(formatPromotionMetric(82.345, 'score'), '82.35', 'display formatting should round only for presentation');
assert.equal(normalizeRankCode('cadet'), 'CADET', 'rank codes normalize consistently');

const consecutive = calculateConsecutiveQualifyingWeeks([
  { weekStartDate: '2025-12-22', weekEndDate: '2025-12-28', kind: 'FINALIZED', finalizedAt: true, score: 80, evidenceCoverage: 80 },
  { weekStartDate: '2025-12-29', weekEndDate: '2026-01-04', kind: 'FINALIZED', finalizedAt: true, score: 80, evidenceCoverage: 80 },
  { weekStartDate: '2026-01-05', weekEndDate: '2026-01-11', kind: 'FINALIZED', finalizedAt: true, score: 80, evidenceCoverage: 80 }
], { minimumDisciplineScore: 70, minimumEvidenceCoverage: 60 });
assert.equal(consecutive, 3, 'consecutive qualifying weeks should work across year boundaries');

const noCount = calculateConsecutiveQualifyingWeeks([
  { weekStartDate: '2026-07-01', weekEndDate: '2026-07-07', kind: 'PROVISIONAL', finalizedAt: false, score: 80, evidenceCoverage: 80 },
  { weekStartDate: '2026-07-08', weekEndDate: '2026-07-14', kind: 'FINALIZED', finalizedAt: true, score: 80, evidenceCoverage: 80 }
], { minimumDisciplineScore: 70, minimumEvidenceCoverage: 60 });
assert.equal(noCount, 0, 'provisional weeks should not count');

const skipped = calculateConsecutiveQualifyingWeeks([
  { weekStartDate: '2026-07-01', weekEndDate: '2026-07-07', kind: 'FINALIZED', finalizedAt: true, score: 80, evidenceCoverage: 80 },
  { weekStartDate: '2026-07-15', weekEndDate: '2026-07-21', kind: 'FINALIZED', finalizedAt: true, score: 80, evidenceCoverage: 80 }
], { minimumDisciplineScore: 70, minimumEvidenceCoverage: 60 });
assert.equal(skipped, 1, 'missing weeks should break the sequence');

const blockedLevelThree = evaluatePromotionEligibility({
  currentRank: 'CADET',
  finalizedInspections: 2,
  recentAverageDisciplineScore: 70,
  recentAverageEvidenceCoverage: 60,
  consecutiveQualifyingWeeks: 2,
  unresolvedConfirmedViolations: 0,
  unresolvedLevelTwoViolations: 0,
  unresolvedLevelThreeViolations: 1,
  activeCorrectivePeriod: false,
  domainScores: { mission: 80, strength: 78, cardio: 76, recovery: 74, nutrition: 78 }
}, 'CADET');
assert.equal(blockedLevelThree.status, 'BLOCKED', 'unresolved Level III violations should block promotion');

const excuseNotBlock = evaluatePromotionEligibility({
  currentRank: 'CADET',
  finalizedInspections: 2,
  recentAverageDisciplineScore: 70,
  recentAverageEvidenceCoverage: 60,
  consecutiveQualifyingWeeks: 2,
  unresolvedConfirmedViolations: 0,
  unresolvedLevelTwoViolations: 0,
  unresolvedLevelThreeViolations: 0,
  activeCorrectivePeriod: false,
  domainScores: { mission: 80, strength: 78, cardio: 76, recovery: 74, nutrition: 78 },
  standardsHistory: [{ status: 'EXCUSED' }, { status: 'DISMISSED' }]
}, 'CADET');
assert.equal(excuseNotBlock.status, 'ELIGIBLE', 'dismissed and excused violations should not block promotion');

console.log('rank promotion tests passed');
