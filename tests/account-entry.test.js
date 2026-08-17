const test = require("node:test");
const assert = require("node:assert/strict");
const entry = require("../assets/js/account-entry.js");

test("new recruit details are normalized and validated before Supabase signup", () => {
  const valid = entry.validateSignup({ email: " Recruit@Example.com ", password: "standard-earned", confirmation: "standard-earned" });
  assert.equal(valid.valid, true);
  assert.equal(valid.email, "recruit@example.com");
  assert.equal(entry.validateSignup({ email: "bad", password: "short", confirmation: "different" }).errors.length, 3);
});
test("confirmation returns new recruits to the Contract", () => {
  const options = entry.signupOptions("https://coach-dominion2.vercel.app/");
  assert.equal(options.emailRedirectTo, "https://coach-dominion2.vercel.app/app#contract");
  assert.equal(options.data.signup_source, "self_service");
  assert.deepEqual(entry.signupOutcome({ session: { access_token: "test" } }), { state: "SESSION_ACTIVE", destination: "/app#contract" });
  assert.deepEqual(entry.signupOutcome({ user: { id: "recruit" }, session: null }), { state: "CONFIRMATION_REQUIRED", destination: null });
});

test("future paid access is derived only from server-controlled app metadata", () => {
  const forged = entry.accountAccess({ user_metadata: { account_access: "ACTIVE" }, app_metadata: {} });
  assert.equal(forged.status, "CLOSED_ALPHA");
  assert.equal(forged.entitled, true);
  const paid = entry.accountAccess({ app_metadata: { account_access: "ACTIVE" } });
  assert.equal(paid.status, "ACTIVE");
  assert.equal(paid.billingManaged, true);
  const pastDue = entry.accountAccess({ app_metadata: { subscription_status: "PAST_DUE" } });
  assert.equal(pastDue.entitled, false);
});
