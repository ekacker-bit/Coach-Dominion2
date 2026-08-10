const assert = require("node:assert/strict");
const atlas = require("../assets/js/atlas-program.js");

function contract(overrides = {}) {
  return {
    id: "contract-atlas-1",
    revision: 3,
    status: "APPROVED",
    effectiveDate: "2026-08-10",
    age: 42,
    heightCm: 177.8,
    weightKg: 79.4,
    gender: "MAN",
    primaryGoal: "BALANCED_FITNESS",
    trainingDaysPerWeek: 5,
    twoADays: false,
    planningInputs: {
      strength: { daysPerWeek: 3 },
      running: { runningDaysPerWeek: 3 },
      core: { sessionsPerWeek: 3 },
      nutrition: { goal: "MAINTAIN" }
    },
    ...overrides
  };
}

const strengthDraft = { id: "strength-draft", sessions: [{}, {}, {}] };
const runningDraft = { id: "running-draft", status: "DRAFT", weeks: [{ sessions: [{ type: "EASY" }, { type: "REST" }, { type: "LONG" }] }, {}, {}, {}] };
const coreDraft = { id: "core-draft", profile: { sessionsPerWeek: 3 }, weeks: [{}, {}, {}, {}] };

{
  const estimate = atlas.estimateNutrition(contract());
  assert.equal(estimate.status, "READY_FOR_APPROVAL");
  assert.ok(estimate.input.calories >= 1400 && estimate.input.calories <= 4500);
  assert.ok(estimate.input.protein >= 90);
  assert.match(estimate.safeguards.join(" "), /not a medical diet/i);
}

{
  const estimate = atlas.estimateNutrition(contract({ weightKg: null, athleteProfile: { age: 42, heightCm: 177.8 } }));
  assert.equal(estimate.status, "PROFILE_REQUIRED");
  assert.match(estimate.message, /current weight/i);
}

{
  const estimate = atlas.estimateNutrition(contract({ age: null, heightCm: null, weightKg: null, athleteProfile: {} }), {
    age: 40,
    heightCm: 177.8,
    weightValue: 147.7,
    weightUnit: "lb"
  });
  assert.equal(estimate.status, "READY_FOR_APPROVAL");
  assert.ok(estimate.input.calories > 0);
}

{
  const recruitContract = contract();
  const nutrition = atlas.estimateNutrition(recruitContract);
  const nutritionProposal = {
    status: "READY FOR APPROVAL",
    recoveryTargets: { calories: nutrition.input.calories, protein: nutrition.input.protein }
  };
  const program = atlas.buildProgramPackage({ recruitContract, contract: recruitContract, strengthDraft, runningDraft, coreDraft, nutrition, nutritionProposal }, {
    generatedAt: "2026-08-06T12:00:00.000Z"
  });
  assert.equal(program.status, "READY_FOR_APPROVAL");
  assert.equal(program.progress.ready, 4);
  assert.equal(program.modules.length, 4);
  assert.deepEqual(program.modules.map((item) => item.label), ["Strength", "Cardio", "Core", "Fuel"]);
  assert.match(program.message, /Approve it once/i);
  assert.match(program.safeguards.join(" "), /no hidden module approvals/i);
}

{
  const recruitContract = contract();
  const nutrition = atlas.estimateNutrition(recruitContract);
  const program = atlas.buildProgramPackage({ contract: recruitContract, strengthDraft, runningDraft: null, coreDraft, nutrition, nutritionProposal: { status: "READY FOR APPROVAL", recoveryTargets: { calories: 2200, protein: 160 } } });
  assert.equal(program.status, "REVIEW_REQUIRED");
  assert.equal(program.modules.find((item) => item.id === "running").status, "NEEDS_REBUILD");
}

{
  const recruitContract = contract();
  const nutrition = atlas.estimateNutrition(recruitContract);
  const approved = {
    recruitContractId: recruitContract.id,
    recruitContractRevision: recruitContract.revision,
    status: "APPROVED"
  };
  const program = atlas.buildProgramPackage({
    contract: recruitContract,
    recruitContract,
    strengthDraft: { ...strengthDraft, ...approved },
    runningDraft: { ...runningDraft, ...approved },
    coreDraft: { ...coreDraft, ...approved },
    nutrition,
    nutritionProposal: { ...approved, recoveryTargets: { calories: nutrition.input.calories, protein: nutrition.input.protein } }
  });
  assert.equal(atlas.VERSION, "024E.1");
  assert.equal(program.status, "READY_FOR_APPROVAL");
  assert.equal(program.progress.ready, 4);
}

console.log("Build 024A Atlas Program tests passed.");
