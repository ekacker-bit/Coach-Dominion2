const assert = require("assert");
const connected = require("../assets/js/connected.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

function record(overrides = {}) {
  return connected.normalizeImportedRecord({
    id: "source-1",
    userId: "user-1",
    providerCode: "FITBOD",
    providerRecordId: "workout-row-1",
    providerRecordType: "EXERCISE_SET",
    dataType: "EXERCISE_SET",
    occurredAt: "2026-07-27T12:00:00Z",
    normalizedPayload: {
      exercise_code: "back_squat",
      exercise_name: "Back Squat",
      sets: 1,
      repetitions: 5,
      load: 225
    },
    ...overrides
  });
}

test("file checksum normalizes line endings", () => {
  assert.equal(connected.buildFileChecksum("a,b\r\n1,2\r\n"), connected.buildFileChecksum("a,b\n1,2\n"));
});

test("record fingerprint is independent of object key order", () => {
  const first = record({ normalizedPayload: { exercise_name: "Squat", repetitions: 5, load: 225 } });
  const second = record({ normalizedPayload: { load: 225, exercise_name: "Squat", repetitions: 5 } });
  assert.equal(first.sourceFingerprint, second.sourceFingerprint);
});

test("an exact prior file produces a repeat-safe batch identity", () => {
  const first = connected.buildImportBatch({ userId: "user-1", providerCode: "FITBOD", source: "same file" });
  const repeated = connected.buildImportBatch({
    userId: "user-1",
    providerCode: "FITBOD",
    source: "same file",
    existingJobs: [{ id: "job-1", summary: { idempotencyKey: first.idempotencyKey } }]
  });
  assert.equal(repeated.repeatedBatch, true);
  assert.equal(repeated.priorJobId, "job-1");
  assert.equal(repeated.idempotencyKey, first.idempotencyKey);
});

test("exact source records classify as duplicate", () => {
  const existing = record({ importStatus: "MAPPED", mappedPerformanceEntryId: "entry-1" });
  const result = connected.reconcileImportedRecord(record({ id: "source-2" }), [existing]);
  assert.equal(result.importClassification, "DUPLICATE");
  assert.equal(result.importStatus, "DUPLICATE");
  assert.equal(result.mappedPerformanceEntryId, "entry-1");
});

test("changed source records classify as updated", () => {
  const existing = record({ importStatus: "MAPPED", mappedPerformanceEntryId: "entry-1" });
  const result = connected.reconcileImportedRecord(record({
    id: "source-2",
    normalizedPayload: {
      exercise_code: "back_squat",
      exercise_name: "Back Squat",
      sets: 1,
      repetitions: 5,
      load: 235
    }
  }), [existing]);
  assert.equal(result.importClassification, "UPDATED");
  assert.equal(result.importStatus, "VALIDATED");
  assert.equal(result.mappedPerformanceEntryId, "entry-1");
});

test("rollback invalidates only the selected batch", () => {
  const first = record({ importBatchId: "batch-1", sourceSyncJobId: "batch-1", mappedPerformanceEntryId: "entry-1" });
  const second = record({ id: "source-2", providerRecordId: "workout-row-2", importBatchId: "batch-2", sourceSyncJobId: "batch-2", mappedPerformanceEntryId: "entry-2" });
  const rollback = connected.rollbackImportBatch([first, second], "batch-1");
  assert.equal(rollback.records[0].importStatus, "INVALIDATED");
  assert.equal(rollback.records[0].mappedPerformanceEntryId, null);
  assert.equal(rollback.records[1].mappedPerformanceEntryId, "entry-2");
  assert.deepEqual(rollback.mappedPerformanceEntryIds, ["entry-1"]);
});

test("integrity metadata survives the raw-payload persistence envelope", () => {
  const restored = connected.normalizeImportedRecord({
    ...record(),
    sourceFingerprint: undefined,
    importClassification: undefined,
    importBatchId: undefined,
    fileChecksum: undefined,
    rawPayload: {
      _dominion_import_integrity: {
        sourceFingerprint: "record_saved",
        importClassification: "NEW",
        importBatchId: "batch-saved",
        fileChecksum: "file_saved"
      }
    }
  });
  assert.equal(restored.sourceFingerprint, "record_saved");
  assert.equal(restored.importClassification, "NEW");
  assert.equal(restored.importBatchId, "batch-saved");
  assert.equal(restored.fileChecksum, "file_saved");
});

console.log(`Import integrity: ${passed} assertions passed.`);
