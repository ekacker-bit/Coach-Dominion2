const assert = require('assert');
const {
  getStandardsCatalog,
  deriveViolationCandidates,
  detectProtectedException,
  classifyViolationCandidate,
  calculateViolationSeverity,
  validateViolationTransition,
  selectCorrectiveAction,
  generateAtlasStandardsReview,
  buildViolationAuditEvent,
  summarizeWeeklyViolationHistory,
  deriveStandardsState,
  buildStandardsPersistencePayload,
  dedupeViolationCandidates,
  buildStandardsReviewState,
  deriveStandardsReviewStateFromRecord,
  sanitizeStandardsReviewState
} = require('../assets/js/app.js');

const standards = getStandardsCatalog();
assert.ok(Array.isArray(standards), 'standards catalog is an array');
assert.ok(standards.some((item) => item.code === 'MISSION-EXECUTION-01'), 'catalog includes mission execution standard');

const missedDomain = deriveViolationCandidates([{ domain: 'mission', status: 'missed', evidence: 'missed', protectedException: null, sourceType: 'daily_compliance' }], []);
assert.equal(missedDomain.length, 1, 'a missed domain can create a candidate');
assert.equal(missedDomain[0].classification, 'CANDIDATE', 'missed domain remains a candidate until reviewed');

const excused = deriveViolationCandidates([{ domain: 'mission', status: 'excused', evidence: 'excused', protectedException: 'excused', sourceType: 'daily_compliance' }], []);
assert.equal(excused.length, 0, 'excused statuses do not become candidates');

const naState = deriveViolationCandidates([{ domain: 'nutrition', status: 'not_applicable', evidence: 'not applicable', protectedException: 'not_applicable', sourceType: 'daily_compliance' }], []);
assert.equal(naState.length, 0, 'N/A statuses do not become candidates');

const approved = deriveViolationCandidates([{ domain: 'recovery', status: 'partial', evidence: 'approved modification', protectedException: 'approved_modification', sourceType: 'daily_compliance' }], []);
assert.equal(approved.length, 0, 'approved modifications do not become candidates');

const readiness = deriveViolationCandidates([{ domain: 'recovery', status: 'missed', evidence: 'readiness restriction', protectedException: 'readiness_restriction', sourceType: 'daily_compliance' }], []);
assert.equal(readiness.length, 0, 'readiness restrictions do not become candidates');

const injury = deriveViolationCandidates([{ domain: 'recovery', status: 'missed', evidence: 'injury reported', protectedException: 'injury', sourceType: 'daily_compliance' }], []);
assert.equal(injury.length, 0, 'injury creates a protected exception');

const reportingCandidate = deriveViolationCandidates([{ domain: 'reporting', status: 'missed', evidence: 'missing evidence', protectedException: 'insufficient_evidence', sourceType: 'daily_compliance' }], []);
assert.equal(reportingCandidate.length, 0, 'insufficient evidence does not create a candidate');

const repeated = deriveViolationCandidates([
  { domain: 'mission', status: 'missed', evidence: 'missed repeatedly', protectedException: null, sourceType: 'daily_compliance' },
  { domain: 'mission', status: 'missed', evidence: 'missed repeatedly', protectedException: null, sourceType: 'daily_compliance' }
], []);
assert.equal(repeated.length, 1, 'repeated unexcused missed behavior creates a candidate');

const deduped = dedupeViolationCandidates([
  { id: 'one', domain: 'mission', status: 'missed', evidence: 'same', protectedException: null, sourceType: 'daily_compliance', sourceDate: '2026-07-01' },
  { id: 'two', domain: 'mission', status: 'missed', evidence: 'same', protectedException: null, sourceType: 'daily_compliance', sourceDate: '2026-07-01' }
]);
assert.equal(deduped.length, 1, 'duplicate candidates are collapsed');

const severity = calculateViolationSeverity({ currentSeverity: 'LEVEL I', repeatCount: 2, deliberate: false, safety: false });
assert.equal(severity.level, 'LEVEL II', 'repeated behavior escalates severity');

const deliberate = calculateViolationSeverity({ currentSeverity: 'LEVEL II', repeatCount: 1, deliberate: true, safety: false });
assert.equal(deliberate.level, 'LEVEL III', 'deliberate falsification escalates to Level III');

const safety = calculateViolationSeverity({ currentSeverity: 'LEVEL I', repeatCount: 1, deliberate: true, safety: true });
assert.equal(safety.level, 'LEVEL III', 'safety violations can be Level III');

const candidate = classifyViolationCandidate({ standardCode: 'REPORTING-01', evidence: 'missing evidence', protectedException: null, repeatCount: 1, deliberate: false, safety: false });
assert.equal(candidate.classification, 'CANDIDATE', 'classification defaults to candidate when unreviewed');
assert.equal(candidate.severity.level, 'LEVEL I', 'default severity is Level I');

const transition = validateViolationTransition('CANDIDATE', 'CONFIRMED');
assert.equal(transition.valid, true, 'candidate can transition to confirmed');
const invalid = validateViolationTransition('DISMISSED', 'CONFIRMED');
assert.equal(invalid.valid, false, 'dismissed cannot become confirmed without reopen');
const manualReview = validateViolationTransition('CANDIDATE', 'UNDER REVIEW');
assert.equal(manualReview.valid, true, 'manual review is allowed before confirmation');
const resolvedStable = validateViolationTransition('RESOLVED', 'CONFIRMED');
assert.equal(resolvedStable.valid, false, 'resolved records remain stable');

const action = selectCorrectiveAction({ classification: 'CONFIRMED', severity: 'LEVEL II', domain: 'mission' });
assert.equal(action.type, 'review_the_standard', 'corrective action is safe and deterministic');

const review = generateAtlasStandardsReview({ standardCode: 'MISSION-EXECUTION-01', status: 'CONFIRMED', severity: 'LEVEL II', evidence: 'missed execution target' });
assert.ok(review.text.includes('ATLAS // STANDARDS REVIEW'), 'review report includes expected header');

const auditEvent = buildViolationAuditEvent('viol-1', 'CANDIDATE', 'CONFIRMED', 'reviewed');
assert.equal(auditEvent.priorStatus, 'CANDIDATE', 'audit event preserves prior status');

const weeklySummary = summarizeWeeklyViolationHistory([{ status: 'CONFIRMED' }, { status: 'RESOLVED' }]);
assert.equal(weeklySummary.confirmedCount, 1, 'summary counts confirmed violations');

const derivedState = deriveStandardsState({ status: 'CONFIRMED' }, 'local');
assert.equal(derivedState.stateLabel, 'Confirmed', 'state labels are human-readable');
assert.equal(derivedState.storageLabel, 'LOCAL FALLBACK', 'local fallback is labeled');

const payload = buildStandardsPersistencePayload({ id: 'v-1', standardCode: 'MISSION-EXECUTION-01' });
assert.equal(payload.standard_code, 'MISSION-EXECUTION-01', 'persistence payload uses database field names');

const source = { domain: 'mission', evidence: 'missed', protectedException: null };
const reviewState = buildStandardsReviewState(source, '2026-07-01');
assert.equal(reviewState[0].sourceDate, '2026-07-01', 'review state carries the source date');
assert.equal(reviewState[0].classification, 'CANDIDATE', 'review state defaults to candidate');

const derivedReviewState = deriveStandardsReviewStateFromRecord({ compliance_date: '2026-07-02', mission_status: 'missed', mission_actual: 'missed', mission_note: 'late', mission_restriction: '' }, 'mission');
assert.equal(derivedReviewState.length, 1, 'a missed record can derive a standards review state');

const sanitized = sanitizeStandardsReviewState([{ id: 'one', status: 'CONFIRMED', protectedException: 'approved_modification', severity: { level: 'LEVEL II' } }]);
assert.equal(sanitized[0].status, 'CONFIRMED', 'sanitized state preserves confirmed status');

console.log('standards violations tests passed');
