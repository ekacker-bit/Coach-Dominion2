
const test = require("node:test");
const assert = require("node:assert/strict");
const body = require("../assets/js/body-progress.js");

test("022B estimates body fat for a man from profile height, waist, and neck", () => {
  const result = body.estimateBodyFat({ unit: "in", waist: 34, neck: 15 }, { gender: "MAN", heightCm: 177.8 });
  assert.equal(result.valid, true);
  assert.ok(result.value > 10 && result.value < 25);
  assert.equal(result.method, "US_NAVY_CIRCUMFERENCE");
  assert.equal(result.rangeHigh - result.rangeLow, 7);
});

test("022B uses hips in the circumference estimate for a woman", () => {
  const missing = body.estimateBodyFat({ unit: "in", waist: 30, neck: 13 }, { gender: "WOMAN", heightCm: 165.1 });
  assert.equal(missing.valid, false);
  assert.deepEqual(missing.missing, ["hips"]);
  const result = body.estimateBodyFat({ unit: "in", waist: 30, neck: 13, hips: 40 }, { gender: "WOMAN", heightCm: 165.1 });
  assert.equal(result.valid, true);
  assert.ok(result.value > 18 && result.value < 35);
});

test("022B refuses to infer a formula sex from an unspecified profile", () => {
  const result = body.estimateBodyFat({ unit: "in", waist: 34, neck: 15 }, { gender: "NON_BINARY", heightCm: 177.8 });
  assert.equal(result.valid, false);
  assert.ok(result.missing.includes("profile sex"));
});

test("022B validates private photo uploads before storage", () => {
  assert.equal(body.validatePhotoFile({ type: "image/jpeg", size: 500000 }).valid, true);
  assert.equal(body.validatePhotoFile({ type: "application/pdf", size: 500000 }).valid, false);
  assert.equal(body.validatePhotoFile({ type: "image/png", size: body.MAX_PHOTO_BYTES + 1 }).valid, false);
});

test("022B builds an account-owned deterministic photo path", () => {
  assert.equal(body.photoPath("user-123", "2026-08-02", "SIDE"), "user-123/2026-08-02/side.jpg");
  assert.equal(body.photoPath("user-123", "tomorrow", "SIDE"), null);
});

test("022B compares the earliest and latest photo checkpoints", () => {
  const rows = [
    { id: "1", performance_date: "2026-07-01", angle: "FRONT", storage_path: "u/2026-07-01/front.jpg" },
    { id: "2", performance_date: "2026-08-01", angle: "FRONT", storage_path: "u/2026-08-01/front.jpg" },
    { id: "3", performance_date: "2026-08-01", angle: "SIDE", storage_path: "u/2026-08-01/side.jpg" }
  ];
  const result = body.comparison(rows);
  assert.equal(result.ready, true);
  assert.equal(result.from.date, "2026-07-01");
  assert.equal(result.to.date, "2026-08-01");
  assert.equal(result.to.count, 2);
});

console.log("Build 022B body progress tests passed.");

