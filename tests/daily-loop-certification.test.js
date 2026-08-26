"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const certification = require("../assets/js/daily-loop-certification");
const { entry, fixture } = require("../scripts/real-daily-loop-scenarios");

test("a sealed day records complete, partial, and missed assignment outcomes", () => {
  const entries = [
    entry("assignment:strength", "strength", "completed"),
    entry("assignment:run", "running", "draft_evidence"),
    entry("assignment:core", "core", "scheduled")
  ];
  const ids = entries.map((item) => item.assignmentId);
  const result = certification.evaluate(fixture({ entries, surfaceAssignments: { calendar: ids, today: ids, train: ids, quickLog: ids } }));
  assert.equal(result.state, certification.STATES.PROTECTED);
  assert.equal(result.counts.COMPLETE, 1);
  assert.equal(result.counts.PARTIAL, 1);
  assert.equal(result.counts.MISSED, 1);
  assert.equal(result.counts.UNRESOLVED, 0);
});

test("one surface with a missing assignment stops certification", () => {
  const result = certification.evaluate(fixture({ surfaceAssignments: {
    calendar: ["assignment:strength", "assignment:fuel"],
    today: ["assignment:strength", "assignment:fuel"],
    train: ["assignment:strength"],
    quickLog: ["assignment:strength", "assignment:fuel"]
  } }));
  assert.equal(result.state, certification.STATES.ACTION_REQUIRED);
  assert.equal(result.issues[0].code, "ASSIGNMENT_SURFACE_MISMATCH");
  assert.equal(result.surfaces.reports.find((item) => item.surface === "train").missing[0], "assignment:fuel");
});

test("an unresolved assignment identity blocks a sealed day", () => {
  const broken = { module: "strength", state: "completed", complete: true, identityValid: false };
  const result = certification.evaluate(fixture({
    entries: [broken],
    surfaceAssignments: { calendar: [], today: [], train: [], quickLog: [] }
  }));
  assert.equal(result.state, certification.STATES.ACTION_REQUIRED);
  assert.ok(result.issues.some((item) => item.code === "ASSIGNMENT_OUTCOME_UNRESOLVED"));
});

test("a sealed closeout waits until Atlas creates a next-day decision", () => {
  const result = certification.evaluate(fixture({ decision: null }));
  assert.equal(result.state, certification.STATES.SETTLING);
  assert.equal(result.receipt, null);
  assert.match(result.view.headline, /Finalizing/);
});

test("account confirmation upgrades the exact device receipt without changing its id", () => {
  const protectedResult = certification.evaluate(fixture());
  const certifiedResult = certification.evaluate(fixture({
    accountReceipts: [protectedResult.receipt],
    serverConfirmed: true,
    accountConfirmedAt: "2026-08-27T02:16:00.000Z"
  }));
  assert.equal(protectedResult.state, certification.STATES.PROTECTED);
  assert.equal(certifiedResult.state, certification.STATES.CERTIFIED);
  assert.equal(certifiedResult.receipt.id, protectedResult.receipt.id);
  assert.equal(certifiedResult.view.headline, "Day secured");
});

test("the same evidence restores the same receipt on a second device", () => {
  const desktop = certification.evaluate(fixture());
  const mobile = certification.evaluate(fixture({ accountReceipts: [{ ...desktop.receipt, status: "CERTIFIED" }], serverConfirmed: true }));
  assert.equal(mobile.receipt.id, desktop.receipt.id);
  assert.equal(mobile.receipt.fingerprint, desktop.receipt.fingerprint);
  assert.equal(certification.upsertHistory([desktop.receipt], mobile.receipt).length, 1);
});

test("a next-day decision must point beyond the sealed operating date", () => {
  const result = certification.evaluate(fixture({ decision: { id: "bad", date: "2026-08-26", effectiveDate: "2026-08-26", status: "ACTIVE", verdict: "MAINTAIN" } }));
  assert.equal(result.state, certification.STATES.SETTLING);
});
