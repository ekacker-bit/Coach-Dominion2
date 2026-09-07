"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const engine = read("assets/js/campaign-lifecycle.js");
const migration = read("supabase/migrations/20260907120000_new_campaign_lifecycle.sql");
const worker = read("sw.js");
const health = read("api/health.js");
const workflow = read(".github/workflows/release-integrity.yml");
const pkg = read("package.json");

test("031H provides one deliberate Account and Start Over experience", () => {
  assert.match(engine, /const VERSION = "031H\.1"/);
  assert.match(html, /id="account-dialog"/);
  assert.match(html, /data-account-action="open"/);
  assert.match(html, /Type START OVER to confirm/);
  assert.match(html, /Your sign-in, account access, connected sources, progress photos, and archived campaign stay/);
  assert.match(app, /async function resetAccountCampaign/);
  assert.match(app, /reset_dominion_campaign/);
  assert.match(app, /receiptMatches\(receipt, command\)/);
  assert.match(app, /window\.location\.replace\(`\/app\?campaign=/);
});

test("031H reset is atomic, account-scoped, archived, and stale-client safe", () => {
  assert.match(migration, /create table if not exists public\.dominion_campaign_archive/);
  assert.match(migration, /alter table public\.dominion_campaign_archive enable row level security/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /revoke all on function public\.reset_dominion_campaign/);
  assert.match(migration, /grant execute on function public\.reset_dominion_campaign[\s\S]+to authenticated/);
  assert.match(migration, /DOMINION_CAMPAIGN_STALE_CLIENT/);
  assert.match(migration, /DOMINION_ACCOUNT_CLIENT_UPGRADE_REQUIRED/);
  assert.match(migration, /insert into public\.dominion_campaign_archive[\s\S]+delete from public\.recruit_contract_state[\s\S]+update public\.dominion_continuity_state/);
  assert.doesNotMatch(migration, /delete from public\.(?:connected_accounts|imported_records|nutrition_feed_tokens|body_progress_photos)/);
});

test("031H refuses partial browser resets and keeps the Account layout usable on phones", () => {
  assert.match(app, /pendingWrites: canonicalPendingWriteState\(\)\.count/);
  assert.match(app, /online: navigator\.onLine !== false/);
  assert.match(app, /clearLocalCampaignStorage/);
  assert.match(engine, /PENDING_WRITES/);
  assert.match(engine, /OFFLINE_BLOCKED/);
  assert.match(css, /\.account-dialog/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /\.account-reset-actions \{ align-items: stretch; flex-direction: column-reverse; \}/);
});

test("031H ships a fresh cache, health identity, and release gate", () => {
  assert.match(html, /coach-dominion-release" content="031H\.1"/);
  assert.match(html, /campaign-lifecycle\.js\?v=031h/);
  assert.match(html, /styles\.css\?v=[^"]*-031h/);
  assert.match(html, /app\.js\?v=[^"]*-031h/);
  assert.match(worker, /031h-new-campaign/);
  assert.match(worker, /campaign-lifecycle\.js\?v=031h/);
  assert.match(app, /\/sw\.js\?v=031h/);
  assert.match(health, /release: "031H\.1"/);
  assert.match(health, /campaignLifecycle: "atomic-archive-reset"/);
  assert.match(workflow, /npm run test:031h/);
  assert.match(workflow, /--expected-release 031H\.1/);
  assert.match(pkg, /"test:031h"/);
});

test("031H does not expose build or release codes in the Account experience", () => {
  const account = html.match(/<dialog id="account-dialog"[\s\S]*?<\/dialog>/)?.[0] || "";
  assert.doesNotMatch(account, /\b(?:BUILD|RELEASE)\s+0?31H\b/i);
  assert.doesNotMatch(account, /031H\.1/);
});
