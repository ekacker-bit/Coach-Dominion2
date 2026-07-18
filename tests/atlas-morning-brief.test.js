const assert = require('node:assert/strict');
const {
  evaluateReadiness,
  generateMorningBrief,
  formatAtlasBriefVoice
} = require('../assets/js/app.js');

const greenState = { energy: 8, soreness: 3, pain: false };
const yellowState = { energy: 6, soreness: 3, pain: false };
const redState = { energy: 8, soreness: 3, pain: true };

const rollCall = generateMorningBrief(evaluateReadiness(null));
assert.equal(rollCall.commandState, 'ROLL CALL REQUIRED');
assert.equal(rollCall.authorization, 'NOT AUTHORIZED');
assert.match(formatAtlasBriefVoice(rollCall), /Missing evidence: Energy, Soreness, Pain/);

const green = generateMorningBrief(evaluateReadiness(greenState));
assert.equal(green.commandState, 'MISSION AUTHORIZED');
assert.equal(green.authorization, 'AUTHORIZED');
assert.equal(green.readiness, 'GREEN');
assert.match(green.orders.join(' '), /Proceed exactly as written/);

const yellow = generateMorningBrief(evaluateReadiness(yellowState));
assert.equal(yellow.commandState, 'MISSION REDUCED');
assert.equal(yellow.authorization, 'AUTHORIZED WITH REDUCTIONS');
assert.match(yellow.orders.join(' '), /remove optional intensity/i);
assert.ok(yellow.restrictions.includes('No additional volume'));

const red = generateMorningBrief(evaluateReadiness(redState));
assert.equal(red.commandState, 'HARD TRAINING DENIED');
assert.equal(red.authorization, 'NOT AUTHORIZED');
assert.match(red.directive, /recovery protocol/i);
assert.ok(red.restrictions.includes('No hard training'));
assert.ok(red.restrictions.some((restriction) => /professional assessment/i.test(restriction)));
assert.doesNotMatch(formatAtlasBriefVoice(red), /train through|push through/i);

const formatted = formatAtlasBriefVoice(green);
for (const section of ['ATLAS // MORNING BRIEF', 'STATUS', 'DIRECTIVE', 'COMMAND NOTE', 'ORDERS', 'RESTRICTIONS']) {
  assert.ok(formatted.includes(section));
}
assert.match(formatted, /Confidence: 60%/);

console.log('atlas morning brief tests passed');
