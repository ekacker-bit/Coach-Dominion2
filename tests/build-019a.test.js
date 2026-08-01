const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

for (const id of [
  "contract-setup-progress",
  "recruit-contract-editor",
  "contract-signer-name",
  "contract-signature-accepted",
  "contract-signing-dialog",
  "contract-signing-dialog-summary"
]) assert.match(`${html}\n${app}`, new RegExp(id), `missing 019A contract surface: ${id}`);

assert.match(html, /BUILD (?:019A \/\/ THE DOMINION CONTRACT|021C \/\/ RECRUIT ENTRY)/);
assert.match(html, /This is your commitment to disciplined action/);
assert.match(html, /Do you swear to uphold this Contract\?/);
assert.match(html, /src="\/assets\/js\/contract-experience\.js"/);
assert.ok(html.indexOf("contract-experience.js") < html.indexOf("app.js"), "contract experience engine must load before app integration");

assert.match(app, /async function signRecruitContractFromCeremony/);
assert.match(app, /DominionContractExperience\.signApprovedContract/);
assert.match(app, /Amending revision/);
assert.match(app, /The signed Contract and active plans remain unchanged/);
assert.match(app, /contract-momentum/);
assert.match(app, /dominion-contract-artifact/);
assert.match(app, /activationSurface\.hidden = Boolean\(approved && \(!signed \|\| !orientationComplete\)\)/);

assert.match(styles, /Build 019A: Dominion Contract ceremony/);
assert.match(styles, /\.dominion-contract-artifact/);
assert.match(styles, /\.contract-signature-ceremony/);
assert.match(styles, /\.contract-signing-dialog::backdrop/);
assert.match(styles, /\.contract-momentum/);
assert.match(styles, /prefers-reduced-motion: reduce/);

assert.match(worker, /coach-dominion-[0-9]{3}[a-z]-v\d+/i);
assert.match(worker, /\/assets\/js\/contract-experience\.js/);
assert.match(packageJson, /node tests\/contract-experience\.test\.js/);
assert.match(packageJson, /node tests\/build-019a\.test\.js/);

console.log("Build 019A Dominion Contract integration passed.");
