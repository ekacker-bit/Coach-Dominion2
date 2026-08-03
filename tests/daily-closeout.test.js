const test = require("node:test");
const assert = require("node:assert/strict");
const closeout = require("../assets/js/daily-closeout.js");

test("022F creates one amendable daily closeout with final self-reported steps", () => {
  const first = closeout.buildCloseout({
    date: "2026-08-03",
    selfReportedSteps: "12840",
    connectedSteps: 12000,
    alcoholAbstained: "MET",
    masturbationCount: "0",
    friedFoodAvoided: "MET",
    dessertDeclined: "NOT_APPLICABLE",
    processedFoodStatus: "LISTED",
    processedFoods: "protein bar, deli turkey\nprotein bar",
    win: "Finished the prescribed work.",
    adjustment: "Start earlier tomorrow."
  }, { now: "2026-08-03T23:00:00.000Z" });

  assert.equal(first.id, "daily-closeout:2026-08-03");
  assert.equal(first.status, "SEALED");
  assert.equal(first.revision, 1);
  assert.equal(first.steps.effective, 12840);
  assert.equal(first.steps.source, "SELF_REPORTED_CLOSEOUT");
  assert.deepEqual(first.discipline.processedFoods, ["protein bar", "deli turkey"]);
  assert.equal(first.discipline.answered, 5);
  assert.equal(first.discipline.assessed, 4);
  assert.equal(first.discipline.met, 3);
  assert.equal(first.discipline.score, 75);

  const amended = closeout.buildCloseout({
    date: "2026-08-03",
    selfReportedSteps: 13100,
    alcoholAbstained: "MET",
    masturbationCount: 0,
    friedFoodAvoided: "MET",
    dessertDeclined: "MET",
    processedFoodStatus: "NONE"
  }, { previous: first, now: "2026-08-03T23:15:00.000Z" });
  assert.equal(amended.id, first.id);
  assert.equal(amended.revision, 2);
  assert.equal(amended.sealedAt, first.sealedAt);
  assert.equal(amended.steps.effective, 13100);
  assert.equal(amended.discipline.score, 100);
});

test("022F keeps missing discipline responses unknown instead of scoring them as failures", () => {
  const record = closeout.buildCloseout({ date: "2026-08-04", selfReportedSteps: 0 }, { now: "2026-08-04T23:00:00.000Z" });
  assert.equal(record.steps.effective, 0);
  assert.equal(record.discipline.answered, 0);
  assert.equal(record.discipline.coverage, 0);
  assert.equal(record.discipline.score, null);
  assert.equal(record.discipline.observations.every((item) => item.response === "UNANSWERED"), true);
});

test("022F distinguishes no processed food from an unanswered or listed response", () => {
  assert.equal(closeout.disciplineObservation({ processedFoodStatus: "NONE" }).score, 100);
  assert.equal(closeout.disciplineObservation({ processedFoodStatus: "LISTED", processedFoods: "chips" }).score, 0);
  assert.equal(closeout.disciplineObservation({}).score, null);
  assert.throws(() => closeout.disciplineObservation({ processedFoodStatus: "NONE", processedFoods: "chips" }), /either no processed food/i);
  assert.throws(() => closeout.disciplineObservation({ processedFoodStatus: "LISTED" }), /List the processed food/i);
});

test("022F summarizes only answered and applicable weekly discipline evidence", () => {
  const complete = closeout.buildCloseout({
    date: "2026-08-03", selfReportedSteps: 10000, alcoholAbstained: "MET", masturbationCount: 0,
    friedFoodAvoided: "MET", dessertDeclined: "NOT_APPLICABLE", processedFoodStatus: "NONE"
  }, { now: "2026-08-03T23:00:00.000Z" });
  const partial = closeout.buildCloseout({
    date: "2026-08-04", selfReportedSteps: 8000, alcoholAbstained: "NOT_MET"
  }, { now: "2026-08-04T23:00:00.000Z" });
  const outside = closeout.buildCloseout({ date: "2026-07-28", selfReportedSteps: 9000 }, { now: "2026-07-28T23:00:00.000Z" });
  const summary = closeout.summarizeWeek([complete, partial, outside], { weekStartDate: "2026-08-03", weekEndDate: "2026-08-09" });
  assert.equal(summary.sealedDays, 2);
  assert.equal(summary.averageSteps, 9000);
  assert.equal(summary.disciplineAnswered, 6);
  assert.equal(summary.disciplinePossible, 10);
  assert.equal(summary.disciplineCoverage, 60);
  assert.equal(summary.disciplineAssessed, 5);
  assert.equal(summary.disciplineMet, 4);
  assert.equal(summary.observedAdherence, 80);
});

console.log("Build 022F Daily Closeout engine verified.");
