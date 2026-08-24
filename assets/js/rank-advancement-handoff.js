(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRankAdvancementHandoff = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030O.1";
  const TYPE = "RANK_ADVANCEMENT_HANDOFF";
  const RANKS = Object.freeze(["RECRUIT", "CADET", "OPERATOR", "VANGUARD", "DOMINION", "ASCENDANT"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function isoDate(value = "") {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }
  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function hash(value = "") {
    let result = 2166136261;
    for (const char of String(value)) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function rankIndex(value = "") { return RANKS.indexOf(upper(value)); }
  function nextRank(value = "") {
    const index = rankIndex(value);
    return index >= 0 && index < RANKS.length - 1 ? RANKS[index + 1] : null;
  }
  function certified(items = []) {
    return (Array.isArray(items) ? items : [])
      .filter((item) => item?.locked === true && upper(item?.status) === "CERTIFIED" && text(item?.id))
      .sort((left, right) => {
        const rankDifference = rankIndex(right.newRank || right.targetRank) - rankIndex(left.newRank || left.targetRank);
        return rankDifference || String(right.certifiedAt || "").localeCompare(String(left.certifiedAt || ""));
      });
  }
  function rankDefinition(catalog = [], code = "") {
    return (Array.isArray(catalog) ? catalog : []).find((item) => upper(item?.code) === upper(code)) || null;
  }
  function matchingHandoff(items = [], certification = {}) {
    return (Array.isArray(items) ? items : [])
      .filter((item) => item?.locked === true && upper(item?.status) === "ACKNOWLEDGED")
      .find((item) => item.certificationId === certification.id || (item.certificationFingerprint && item.certificationFingerprint === certification.fingerprint)) || null;
  }
  function assess(input = {}) {
    const certification = certified(input.certifications)[0] || null;
    if (!certification) return {
      version: VERSION,
      type: TYPE,
      status: "NONE",
      visible: false,
      locked: false,
      certification: null,
      handoff: null
    };
    const rank = upper(certification.newRank || certification.targetRank);
    const priorRank = upper(certification.priorRank || certification.currentRank);
    const next = nextRank(rank);
    const definition = rankDefinition(input.rankCatalog, next);
    const nextStandard = next
      ? text(definition?.promotionCommandNote || definition?.description || `Earn ${next.toLowerCase()} through finalized evidence.`)
      : "Highest rank secured. Hold the standard through continued execution.";
    const existing = matchingHandoff(input.handoffs, certification);
    if (existing) return {
      ...clone(existing),
      version: VERSION,
      type: TYPE,
      status: "ACKNOWLEDGED",
      visible: true,
      locked: true,
      rank,
      priorRank,
      nextRank: next,
      nextStandard,
      certification: clone(certification),
      handoff: clone(existing),
      idempotent: true
    };
    const proof = {
      certificationId: certification.id,
      certificationFingerprint: certification.fingerprint || null,
      rank,
      priorRank,
      nextRank: next,
      nextStandard
    };
    return {
      version: VERSION,
      type: TYPE,
      status: "PENDING",
      visible: true,
      locked: false,
      canAcknowledge: true,
      rank,
      priorRank,
      nextRank: next,
      nextStandard,
      certification: clone(certification),
      handoff: null,
      proof,
      fingerprint: `rank-handoff:${certification.id}:${hash(stableJson(proof))}`
    };
  }
  function acknowledge(input = {}) {
    const candidate = assess(input);
    if (candidate.status === "ACKNOWLEDGED") return candidate;
    if (candidate.status !== "PENDING" || !candidate.certification?.id) return candidate;
    const acknowledgedAt = input.acknowledgedAt || new Date().toISOString();
    return {
      version: VERSION,
      type: TYPE,
      id: `${TYPE.toLowerCase()}:${hash(candidate.fingerprint)}`,
      status: "ACKNOWLEDGED",
      locked: true,
      certificationId: candidate.certification.id,
      certificationFingerprint: candidate.certification.fingerprint || null,
      rank: candidate.rank,
      priorRank: candidate.priorRank,
      nextRank: candidate.nextRank,
      nextStandard: candidate.nextStandard,
      acknowledgedAt,
      effectiveDate: isoDate(acknowledgedAt),
      fingerprint: candidate.fingerprint
    };
  }
  function upsertHistory(history = [], receipt = null, limit = 12) {
    const current = (Array.isArray(history) ? history : []).filter(Boolean);
    if (!receipt?.id) return current.slice(0, Math.max(1, Number(limit || 12)));
    const existing = current.find((item) => item.id === receipt.id || item.certificationId === receipt.certificationId);
    const selected = existing?.locked ? existing : receipt;
    return [selected, ...current.filter((item) => item !== existing && item.id !== selected.id)]
      .sort((left, right) => String(right.acknowledgedAt || "").localeCompare(String(left.acknowledgedAt || "")))
      .slice(0, Math.max(1, Number(limit || 12)));
  }

  return Object.freeze({ VERSION, TYPE, RANKS: [...RANKS], assess, acknowledge, upsertHistory, nextRank, matchingHandoff });
});
