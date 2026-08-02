Exit code: 0
Wall time: 1.1 seconds
Output:
const assert = require("node:assert/strict");
const shell = require("../assets/js/experience-shell.js");

assert.equal(shell.VERSION, "021I.1");
assert.equal(shell.sectionMeta("nutrition").mode, "FUEL");
assert.equal(shell.sectionMeta("unknown").label, "Today");
assert.equal(shell.cleanBuildKicker("BUILD 018F // FOCUS MODE"), "DOMINION // FOCUS MODE");
assert.equal(shell.cleanBuildKicker("DOMINION // CLOSED ALPHA"), "DOMINION // CLOSED ALPHA");

let mission = shell.buildMissionState({});
assert.equal(mission.phase, "COMMIT");
assert.equal(mission.actionSection, "contract");
assert.equal(mission.journey[0].current, true);

mission = shell.buildMissionState({ hasApprovedContract: true, contractSigned: true, activationStatus: "ACTION_REQUIRED", activationNextModule: "nutrition" });
assert.equal(mission.phase, "LINK");
assert.equal(mission.actionSection, "nutrition");
assert.equal(mission.journey[0].complete, true);

mission = shell.buildMissionState({ hasApprovedContract: true, contractSigned: true, activationStatus: "READY_TO_BUILD" });
assert.equal(mission.phase, "PLAN");
assert.equal(mission.title, "Build the coordinated week");
assert.equal(mission.journey[1].complete, true);
assert.equal(mission.journey[2].current, true);

mission = shell.buildMissionState({ hasApprovedContract: true, contractSigned: true, activationStatus: "WEEK_READY" });
assert.equal(mission.title, "Commit the week");

mission = shell.buildMissionState({ hasApprovedContract: true, contractSigned: true, activationStatus: "ACTIVE", hasDailyState: false });
assert.equal(mission.phase, "REPORT");
assert.equal(mission.actionSection, "today");

mission = shell.buildMissionState({ hasApprovedContract: true, contractSigned: true, activationStatus: "ACTIVE", hasDailyState: true, readinessState: "RED" });
assert.equal(mission.phase, "PROTECT");

mission = shell.buildMissionState({ hasApprovedContract: true, contractSigned: true, activationStatus: "ACTIVE", hasDailyState: true, readinessState: "GREEN" });
assert.equal(mission.phase, "EXECUTE");
assert.equal(mission.journey.every((item) => item.complete), true);

console.log("Build 019B Dominion experience shell tests passed.");

