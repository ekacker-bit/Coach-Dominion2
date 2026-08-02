const assert = require("node:assert/strict");
const Autosave = require("../assets/js/contract-autosave.js");

async function run() {
  assert.equal(Autosave.VERSION, "021G.1");

  const failures = [];
  let executed = 0;
  const poisoned = Promise.reject(new Error("previous save failed"));
  const recovered = await Autosave.enqueue(poisoned, async () => {
    executed += 1;
    return "saved";
  }, (error, phase) => failures.push({ message: error.message, phase }));
  assert.equal(recovered, "saved", "a rejected prior save must not poison the next autosave");
  assert.equal(executed, 1, "the next save must execute after queue recovery");
  assert.deepEqual(failures, [{ message: "previous save failed", phase: "previous" }]);

  const currentFailures = [];
  const failed = await Autosave.enqueue(Promise.resolve(), async () => {
    throw new Error("current save failed");
  }, (error, phase) => currentFailures.push({ message: error.message, phase }));
  assert.equal(failed, false, "a current save failure must settle the queue instead of rejecting it");
  assert.deepEqual(currentFailures, [{ message: "current save failed", phase: "current" }]);

  await assert.rejects(
    Autosave.withTimeout(new Promise(() => {}), 10),
    (error) => error.code === "CONTRACT_SYNC_TIMEOUT"
  );

  assert.equal(await Autosave.withTimeout(Promise.resolve(true), 100), true);
  console.log("Contract autosave recovery tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
