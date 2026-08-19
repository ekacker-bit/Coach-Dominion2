const test = require("node:test");
const assert = require("node:assert/strict");
const Biometrics = require("../assets/js/biometric-integrity.js");

const history = [158.4, 157.9, 158.1, 157.6, 158.2].map((weight, index) => ({ date: `2026-08-${17 - index}`, weight }));

test("57.4 pounds is quarantined against a 157.4-ish baseline", () => {
  const result = Biometrics.evaluateReading("weight", 57.4, history);
  assert.equal(Biometrics.VERSION, "030C.1");
  assert.equal(result.quarantined, true);
  assert.match(result.reasons.join(" "), /plausible minimum|sharp change/i);
});

test("quarantined reading is removed from the coaching payload until confirmed", () => {
  const result = Biometrics.inspectPayload({ date: "2026-08-18", weight: 57.4, resting_heart_rate: 52 }, history);
  assert.equal(result.state, "CONFIRMATION_REQUIRED");
  assert.notEqual(result.safe.weight, 57.4);
  assert.equal(result.safe.resting_heart_rate, 52);
  assert.equal(result.original.weight, 57.4);
});

test("confirmation and correction create immutable audit facts", () => {
  const pending = { date: "2026-08-18", metric: "weight", originalValue: 57.4, baseline: 158.1, reasons: ["sharp change"] };
  const confirmed = Biometrics.resolveQuarantine(pending, "CONFIRM", null, { at: "2026-08-18T12:00:00.000Z" });
  assert.equal(confirmed.value, 57.4);
  assert.equal(confirmed.audit.resolution, "CONFIRMED");
  assert.equal(confirmed.audit.originalValue, 57.4);
  const corrected = Biometrics.resolveQuarantine(pending, "CORRECT", 157.4, { at: "2026-08-18T12:01:00.000Z" });
  assert.equal(corrected.value, 157.4);
  assert.equal(corrected.audit.resolution, "CORRECTED");
  assert.equal(corrected.audit.originalValue, 57.4);
});
