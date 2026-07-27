const assert = require("node:assert/strict");
const connected = require("../assets/js/connected.js");

const exportXml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" unit="count" creationDate="2026-07-27 08:00:00 -0500" startDate="2026-07-27 07:00:00 -0500" endDate="2026-07-27 08:00:00 -0500" value="1250"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" creationDate="2026-07-27 12:00:00 -0500" startDate="2026-07-27 08:00:00 -0500" endDate="2026-07-27 12:00:00 -0500" value="2750"/>
  <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="2026-07-27 07:00:00 -0500" startDate="2026-07-27 07:00:00 -0500" endDate="2026-07-27 07:00:00 -0500" value="56"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Smart Scale" unit="kg" creationDate="2026-07-27 06:00:00 -0500" startDate="2026-07-27 06:00:00 -0500" endDate="2026-07-27 06:00:00 -0500" value="82.5"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" creationDate="2026-07-27 06:00:00 -0500" startDate="2026-07-26 22:00:00 -0500" endDate="2026-07-27 06:00:00 -0500" value="HKCategoryValueSleepAnalysisInBed"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" creationDate="2026-07-27 06:00:00 -0500" startDate="2026-07-26 22:30:00 -0500" endDate="2026-07-27 05:30:00 -0500" value="HKCategoryValueSleepAnalysisAsleepCore"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="2026-07-27 08:00:00 -0500" startDate="2026-07-27 08:00:00 -0500" endDate="2026-07-27 08:00:00 -0500" value="90"/>
</HealthData>`;

{
  const parsed = connected.parseAppleHealthExportXml(exportXml, {
    userId: "user-1",
    connectedAccountId: "apple-account",
    sourceSyncJobId: "job-1"
  });
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.supportedCount, 6);
  assert.equal(parsed.ignoredCount, 1);
  assert.equal(parsed.records.length, 5);
  const steps = parsed.records.find((record) => record.dataType === "STEPS");
  assert.equal(steps.normalizedPayload.value, 4000);
  assert.equal(steps.rawPayload.contributing_records, 2);
  assert.equal(steps.isDemo, false);

  const summary = connected.summarizeAppleHealthByDate(parsed.records);
  assert.equal(summary.length, 1);
  assert.equal(summary[0].steps, 4000);
  assert.equal(summary[0].restingHeartRate, 56);
  assert.equal(summary[0].weight, 82.5);
  assert.equal(summary[0].weightUnit, "kg");
  assert.equal(summary[0].sleep, 7);

  const reconciled = connected.reconcileImportedRecord(steps, parsed.records);
  assert.equal(reconciled.importStatus, "DUPLICATE");
}

{
  const parsed = connected.parseAppleHealthExportXml("<not-health-data/>");
  assert.equal(parsed.records.length, 0);
  assert.match(parsed.errors[0], /HealthData root/);
}

{
  const first = connected.parseAppleHealthExportXml(exportXml).records.map((record) => record.deduplicationKey);
  const second = connected.parseAppleHealthExportXml(exportXml).records.map((record) => record.deduplicationKey);
  assert.deepEqual(first, second);
}

console.log("Apple Health import tests passed.");
