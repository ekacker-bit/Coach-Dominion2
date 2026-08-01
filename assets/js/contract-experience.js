(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionContractExperience = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021C.1";
  const OATH_VERSION = "DOMINION_OATH_019A";
  const OATH_LINES = Object.freeze([
    "I commit to discipline.",
    "I commit to honest evidence.",
    "I commit to responsible recovery.",
    "I commit to weekly inspection.",
    "I commit to the Dominion standard."
  ]);
  const SETUP_STEPS = Object.freeze([
    { id: "profile", label: "Profile", prompt: "Give Atlas the recruit context it needs." },
    { id: "outcome", label: "Outcome", prompt: "Name the mission." },
    { id: "capacity", label: "Capacity", prompt: "Commit only what you can sustain." },
    { id: "standards", label: "Standards", prompt: "Define the conditions of execution." },
    { id: "review", label: "Review", prompt: "Read every commitment before signing." }
  ]);

  function cleanText(value, maximum = 80) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maximum);
  }

  function titleCase(value = "") {
    return String(value || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function nutritionCommitment(value = "") {
    return {
      TRACK_DAILY: "log nutrition every day",
      TRACK_5_DAYS: "log nutrition at least five days each week",
      PROTEIN_FIRST: "put protein first at every meal",
      FOUNDATION_ONLY: "practice the nutrition foundations every day"
    }[value] || titleCase(value).toLowerCase();
  }

  function commitmentLines(contract = {}) {
    const lines = [];
    const trainingDays = Number(contract.trainingDaysPerWeek || 0);
    const recoveryDays = Math.max(0, 7 - trainingDays);
    if (contract.target) lines.push(`I will pursue: ${cleanText(contract.target, 120)}.`);
    lines.push(`I will protect ${trainingDays} purposeful training day${trainingDays === 1 ? "" : "s"} each week.`);
    if (Number(contract.strengthDaysPerWeek || 0) > 0) {
      lines.push(`I will complete ${Number(contract.strengthDaysPerWeek)} strength session${Number(contract.strengthDaysPerWeek) === 1 ? "" : "s"} each week.`);
    }
    if (Number(contract.runningDaysPerWeek || 0) > 0) {
      lines.push(`I will complete ${Number(contract.runningDaysPerWeek)} running session${Number(contract.runningDaysPerWeek) === 1 ? "" : "s"} each week.`);
    }
    if (Number(contract.coreDaysPerWeek || 0) > 0) {
      lines.push(`I will complete ${Number(contract.coreDaysPerWeek)} core session${Number(contract.coreDaysPerWeek) === 1 ? "" : "s"} each week.`);
    }
    if (contract.twoADays === true) {
      lines.push("I authorize designated Two-a-Days with two sessions and up to 240 combined minutes. Long runs remain uncapped by time.");
    }
    lines.push(`I will ${nutritionCommitment(contract.nutritionCommitment)}.`);
    lines.push(`I will protect ${recoveryDays} recovery day${recoveryDays === 1 ? "" : "s"} each week.`);
    return lines;
  }

  function signatureStatus(contract = {}) {
    const signature = contract.signature || null;
    const valid = Boolean(
      signature
      && cleanText(signature.signerName, 80).length >= 2
      && signature.accepted === true
      && signature.contractId === contract.id
      && Number(signature.contractRevision || 0) === Number(contract.revision || 0)
      && signature.oathVersion === OATH_VERSION
      && signature.signedAt
    );
    return {
      valid,
      status: valid ? "SIGNED" : contract.status === "APPROVED" ? "SIGNATURE_REQUIRED" : "NOT_SIGNED",
      signature: valid ? signature : null
    };
  }

  function validateSignature(input = {}) {
    const signerName = cleanText(input.signerName, 80);
    const errors = [];
    if (signerName.length < 2) errors.push("Enter the name you are signing under.");
    if (input.accepted !== true) errors.push("Affirm the Dominion oath before signing.");
    return { valid: errors.length === 0, signerName, errors };
  }

  function signApprovedContract(contract = {}, input = {}, options = {}) {
    if (contract.status !== "APPROVED" || !contract.id || !contract.revision) {
      throw new Error("Approve the Contract before applying a signature.");
    }
    const validation = validateSignature(input);
    if (!validation.valid) throw new Error(validation.errors[0]);
    return {
      ...contract,
      signature: {
        signerName: validation.signerName,
        signedAt: options.signedAt || new Date().toISOString(),
        accepted: true,
        oathVersion: OATH_VERSION,
        contractId: contract.id,
        contractRevision: Number(contract.revision),
        fingerprint: contract.fingerprint || null
      }
    };
  }

  function artifact(contract = {}) {
    const signature = signatureStatus(contract);
    return {
      version: VERSION,
      title: "The Dominion Contract",
      preamble: "This is your commitment to disciplined action, honest evidence, responsible recovery, and weekly inspection.",
      oath: OATH_LINES,
      commitments: commitmentLines(contract),
      signature,
      identity: {
        id: contract.id || null,
        revision: Number(contract.revision || 0) || null,
        effectiveDate: contract.effectiveDate || null,
        targetDate: contract.targetDate || null
      }
    };
  }

  function progression(contract = null, activationStatus = "CONTRACT_REQUIRED") {
    const signed = contract ? signatureStatus(contract).valid : false;
    const plansLinked = signed && ["READY_TO_BUILD", "WEEK_READY", "ACTIVE"].includes(activationStatus);
    const weekCommitted = signed && activationStatus === "ACTIVE";
    return [
      { id: "contract", label: "Contract Signed", complete: signed, current: Boolean(contract) && !signed },
      { id: "plans", label: "Plans Linked", complete: plansLinked, current: signed && !plansLinked },
      { id: "week", label: "Week Committed", complete: weekCommitted, current: plansLinked && !weekCommitted },
      { id: "day-one", label: "Day One Ready", complete: weekCommitted, current: weekCommitted }
    ];
  }

  function nextAction(contract = null, activation = {}) {
    if (!contract) return { action: "SET_CONTRACT", label: "Build the Contract" };
    if (!signatureStatus(contract).valid) return { action: "SIGN_CONTRACT", label: "Sign the Contract" };
    const action = activation.next || {};
    if (activation.status === "ACTION_REQUIRED") return { action: action.action || "STAGE_DRAFTS", label: action.label || "Finish plan setup", module: action.module || null };
    if (activation.status === "READY_TO_BUILD") return { action: "BUILD_WEEK", label: "Build the first week" };
    if (activation.status === "WEEK_READY") return { action: "COMMIT_WEEK", label: "Commit the week" };
    if (activation.status === "ACTIVE") return { action: "OPEN_TODAY", label: "Begin Day One" };
    return { action: action.action || "STAGE_DRAFTS", label: action.label || "Continue activation", module: action.module || null };
  }

  return {
    VERSION,
    OATH_VERSION,
    OATH_LINES,
    SETUP_STEPS,
    commitmentLines,
    signatureStatus,
    validateSignature,
    signApprovedContract,
    artifact,
    progression,
    nextAction
  };
});
