const assert = require('assert');
const {
  normalizeSectionKey,
  shouldWarnBeforeNavigation,
  deriveDirtyState,
  deriveFinalizeConfirmationState,
  isFinalizedReadOnlyInspection,
  deriveOnboardingVisibility,
  getStatusMessage,
  deriveSaveState,
  deriveInputImmutabilityState
} = require('../assets/js/app.js');

assert.equal(normalizeSectionKey('record'), 'record');
assert.equal(normalizeSectionKey('unknown'), 'today');
assert.equal(normalizeSectionKey('INSPECTION'), 'inspection');
assert.equal(shouldWarnBeforeNavigation('trends', true), true);
assert.equal(shouldWarnBeforeNavigation('today', false), false);
assert.equal(deriveDirtyState({ mission: { status: 'completed' } }, { mission: { status: 'partial' } }), true);
assert.equal(deriveDirtyState({ mission: { status: 'completed' } }, { mission: { status: 'completed' } }), false);
const finalizeState = deriveFinalizeConfirmationState(true, 80);
assert.equal(finalizeState.confirmationRequired, true);
assert.equal(finalizeState.readOnlyMessage.includes('read-only historical snapshot'), true);
assert.equal(isFinalizedReadOnlyInspection({ finalizedAt: '2026-06-01T00:00:00.000Z' }), true);
assert.equal(isFinalizedReadOnlyInspection({ inspectionStatus: 'INSPECTION COMPLETE' }), true);
assert.equal(deriveOnboardingVisibility(false).visible, false);
assert.equal(deriveOnboardingVisibility(true).visible, true);
assert.equal(getStatusMessage('saving'), 'Saving…');
assert.equal(getStatusMessage('locally saved'), 'Locally saved');
assert.equal(deriveSaveState('saving').label, 'Saving…');
assert.equal(deriveSaveState('failed').tone, 'failed');
assert.deepEqual(deriveInputImmutabilityState(true), { readOnly: true, disabled: true });
assert.deepEqual(deriveInputImmutabilityState(false), { readOnly: false, disabled: false });

console.log('ux build 004d tests passed');
