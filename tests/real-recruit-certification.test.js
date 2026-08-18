"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const journey = require("../assets/js/beta-journey-certification.js");
const certification = require("../assets/js/real-recruit-certification.js");
const { scenarios, lineageSnapshot, withEvidence } = require("../scripts/real-recruit-scenarios.js");

const dependencies = {
  evaluate: journey.evaluate,
  certificationReceipt: journey.certificationReceipt
};

test("certifies all six real recruit journeys and twenty-one checkpoints", () => {
  const report = certification.runSuite(scenarios(), dependencies);
  assert.equal(report.status, "CERTIFIED");
  assert.equal(report.certified, true);
  assert.equal(report.scenarioCount, 6);
  assert.equal(report.passedScenarioCount, 6);
  assert.equal(report.checkpointCount, 21);
  assert.equal(report.failures.length, 0);
  assert.match(report.receipt.id, /^real-recruit-[a-f0-9]{8}$/);
});

test("returns the same suite receipt for an unchanged second run", () => {
  const first = certification.runSuite(scenarios(), dependencies);
  const second = certification.runSuite(scenarios(), dependencies);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(first.receipt.id, second.receipt.id);
});

test("fails visibly when a journey returns the wrong first action", () => {
  const broken = [{
    id: "BROKEN_SETUP",
    steps: [{ id: "setup", input: lineageSnapshot(), expect: { state: "ACTION_REQUIRED", firstProblemCode: "CONTRACT_REQUIRED" } }]
  }];
  const report = certification.runSuite(broken, dependencies);
  assert.equal(report.status, "FAILED");
  assert.equal(report.receipt, null);
  assert.ok(report.failures.some((failure) => /state CERTIFIED/.test(failure.detail)));
});

test("fails visibly when protected evidence disappears between sessions", () => {
  const saved = withEvidence(lineageSnapshot(), ["strength-proof", "fuel-proof"]);
  const lost = withEvidence(lineageSnapshot(), ["strength-proof"]);
  const report = certification.runSuite([{
    id: "EVIDENCE_LOSS",
    steps: [
      { id: "saved", input: saved, expect: { state: "CERTIFIED", receipt: true } },
      { id: "restored", input: lost, expect: { state: "CERTIFIED", receipt: true, preserveEvidenceFrom: "saved" } }
    ]
  }], dependencies);
  assert.equal(report.status, "FAILED");
  assert.ok(report.failures.some((failure) => /was not preserved/.test(failure.detail)));
});
