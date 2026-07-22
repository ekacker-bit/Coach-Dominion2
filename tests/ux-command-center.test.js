const assert = require('assert');
const { deriveCommandCenterOverview } = require('../assets/js/app.js');

const overview = deriveCommandCenterOverview({ state: 'RED' }, { inspectionStatus: 'INSPECTION COMPLETE' }, 'DECLINING');

assert.equal(overview.readinessLabel, 'RED', 'overview preserves the readiness state');
assert.equal(overview.weeklyLabel, 'INSPECTION COMPLETE', 'overview preserves the inspection status');
assert.equal(overview.trendLabel, 'DECLINING', 'overview preserves the trend trajectory');
assert.match(overview.focus, /Recovery|recovery/i, 'overview prioritizes recovery when readiness is RED');
assert.match(overview.summary, /Pain overrides|recovery/i, 'overview explains the current posture clearly');

console.log('ux command center tests passed');
