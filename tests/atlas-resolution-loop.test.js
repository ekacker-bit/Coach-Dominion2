const assert = require("assert");
const loop = require("../assets/js/atlas-resolution-loop.js");

const decision = { id: "strength-hold", fingerprint: "abc123" };
const feedback = { id: "feedback-1", reasonCode: "CONSTRAINT" };
const prompt = loop.buildPrompt(feedback, decision);
assert.equal(loop.VERSION, "025X.1");
assert.equal(prompt.status, "AWAITING_RESPONSE");
assert.equal(prompt.options.length, 5);
assert.equal(prompt.options[0].code, "SCHEDULE");
assert.match(prompt.safeguard, /unchanged/);

const receipt = loop.resolvePrompt(prompt, "equipment", { recordedAt: "2026-08-12T18:00:00.000Z", userId: "recruit-1", note: "No cable stack at this gym." });
assert.equal(receipt.type, "ATLAS_RESOLUTION");
assert.equal(receipt.outcome, "OPEN_SOURCE");
assert.equal(receipt.constraintDraft.type, "EQUIPMENT");
assert.equal(receipt.constraintDraft.note, "No cable stack at this gym.");
assert.match(receipt.safeguard, /No approved plan was changed/);
assert.throws(() => loop.resolvePrompt(prompt, "UNKNOWN"), /Choose one response/);
assert.throws(() => loop.buildPrompt({}, decision), /Recorded feedback/);

const timing = loop.buildPrompt({ id: "feedback-2", reasonCode: "TIMING" }, decision);
const nextWindow = loop.resolvePrompt(timing, "NEXT_WINDOW", { recordedAt: "2026-08-12T18:01:00.000Z" });
assert.equal(nextWindow.constraintDraft.type, "SCHEDULE");
assert.ok(nextWindow.constraintDraft.note);

console.log("Atlas Resolution Loop tests passed.");
