const assert = require("node:assert/strict");
const experience = require("../assets/js/contract-experience.js");

function approvedContract(overrides = {}) {
  return {
    id: "rc-dominion-r2",
    fingerprint: "rc-dominion",
    revision: 2,
    status: "APPROVED",
    primaryGoal: "BUILD_ENDURANCE",
    target: "Finish a fall half marathon with strength",
    targetDate: "2026-10-18",
    effectiveDate: "2026-08-03",
    trainingDaysPerWeek: 6,
    strengthDaysPerWeek: 3,
    runningDaysPerWeek: 4,
    coreDaysPerWeek: 3,
    nutritionCommitment: "TRACK_5_DAYS",
    ...overrides
  };
}

{
  assert.equal(experience.VERSION, "019A.1");
  assert.equal(experience.SETUP_STEPS.length, 4);
  assert.deepEqual(experience.SETUP_STEPS.map((step) => step.id), ["outcome", "capacity", "standards", "review"]);
}

{
  const lines = experience.commitmentLines(approvedContract());
  assert.ok(lines.some((line) => /6 purposeful training days/i.test(line)));
  assert.ok(lines.some((line) => /3 strength sessions/i.test(line)));
  assert.ok(lines.some((line) => /4 running sessions/i.test(line)));
  assert.ok(lines.some((line) => /five days each week/i.test(line)));
  assert.ok(lines.some((line) => /1 recovery day/i.test(line)));
}

{
  const missing = experience.validateSignature({ signerName: "", accepted: false });
  assert.equal(missing.valid, false);
  assert.equal(missing.errors.length, 2);
  const valid = experience.validateSignature({ signerName: "  Eric   Kacker ", accepted: true });
  assert.equal(valid.valid, true);
  assert.equal(valid.signerName, "Eric Kacker");
}

{
  const original = approvedContract();
  const signed = experience.signApprovedContract(original, { signerName: "Eric Kacker", accepted: true }, {
    signedAt: "2026-07-31T15:00:00.000Z"
  });
  assert.equal(original.signature, undefined, "signing must not mutate the approved revision");
  assert.equal(signed.signature.signerName, "Eric Kacker");
  assert.equal(signed.signature.contractId, original.id);
  assert.equal(signed.signature.contractRevision, 2);
  assert.equal(experience.signatureStatus(signed).status, "SIGNED");
  assert.equal(experience.signatureStatus({ ...signed, revision: 3 }).status, "SIGNATURE_REQUIRED", "a signature cannot carry into an amended revision");
}

{
  assert.throws(
    () => experience.signApprovedContract({ ...approvedContract(), status: "READY_FOR_APPROVAL" }, { signerName: "Eric Kacker", accepted: true }),
    /approve the contract/i
  );
}

{
  const signed = experience.signApprovedContract(approvedContract(), { signerName: "Eric Kacker", accepted: true }, {
    signedAt: "2026-07-31T15:00:00.000Z"
  });
  const artifact = experience.artifact(signed);
  assert.equal(artifact.title, "The Dominion Contract");
  assert.equal(artifact.signature.valid, true);
  assert.equal(artifact.identity.revision, 2);
  assert.equal(artifact.oath.length, 5);
  assert.ok(artifact.commitments.length >= 6);
}

{
  const signed = experience.signApprovedContract(approvedContract(), { signerName: "Eric Kacker", accepted: true });
  const ready = experience.progression(signed, "READY_TO_BUILD");
  assert.equal(ready[0].complete, true);
  assert.equal(ready[1].complete, true);
  assert.equal(ready[2].current, true);
  const active = experience.progression(signed, "ACTIVE");
  assert.equal(active.every((step) => step.complete), true);
  assert.equal(experience.nextAction(signed, { status: "ACTIVE", next: { action: "OPEN_TODAY" } }).label, "Begin Day One");
}

console.log("Build 019A Dominion Contract experience tests passed.");

