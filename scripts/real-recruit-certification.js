"use strict";

const journey = require("../assets/js/beta-journey-certification.js");
const certification = require("../assets/js/real-recruit-certification.js");
const { scenarios } = require("./real-recruit-scenarios.js");

function run() {
  return certification.runSuite(scenarios(), {
    evaluate: journey.evaluate,
    certificationReceipt: journey.certificationReceipt
  });
}

if (require.main === module) {
  const report = run();
  if (!report.certified) {
    console.error("Real recruit certification failed:");
    report.failures.forEach((failure) => console.error(`- ${failure.scenario} / ${failure.checkpoint}: ${failure.detail}`));
    process.exit(1);
  }
  console.log(`Real recruit certification passed: ${report.scenarioCount} journeys, ${report.checkpointCount} checkpoints, receipt ${report.receipt.id}.`);
}

module.exports = { run };
