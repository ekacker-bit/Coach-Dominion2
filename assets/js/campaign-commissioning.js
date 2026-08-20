(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCampaignCommissioning = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030H.1";
  const STEP_DEFINITIONS = Object.freeze([
    { id: "contract", label: "Contract" },
    { id: "baseline", label: "Baseline" },
    { id: "program", label: "Program" },
    { id: "calendar", label: "Calendar" },
    { id: "launch", label: "Launch" }
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function text(value, fallback = "") {
    return String(value === undefined || value === null ? fallback : value).trim();
  }

  function upper(value, fallback = "") {
    return text(value, fallback).toUpperCase().replace(/[\s-]+/g, "_");
  }

  function contractId(contract = {}) {
    return contract.id || contract.contractId || contract.recruitContractId || null;
  }

  function contractRevision(contract = {}) {
    return Number(contract.revision || contract.contractRevision || contract.recruitContractRevision || 0);
  }

  function linkedToContract(record = {}, contract = {}) {
    if (!record || !contractId(contract)) return false;
    return (record.contractId || record.recruitContractId) === contractId(contract)
      && Number(record.contractRevision || record.recruitContractRevision || 0) === contractRevision(contract);
  }

  function programActive(record = {}, contract = {}) {
    return linkedToContract(record, contract) && upper(record.status) === "ACTIVE";
  }

  function commissioningActive(record = {}, contract = {}) {
    return linkedToContract(record, contract) && upper(record.status) === "ACTIVE";
  }

  function recruitProfile(contract = {}, profile = {}) {
    const source = { ...(contract.athleteProfile || {}), ...contract, ...profile };
    const height = Number(source.heightCm || source.heightValue || 0);
    const weight = Number(source.weightKg || source.weightValue || 0);
    const age = Number(source.age || 0);
    const trainingYears = Number(source.trainingYears ?? source.yearsOfTraining ?? -1);
    const missing = [];
    if (!(age >= 13 && age <= 100)) missing.push("age");
    if (!(height > 0)) missing.push("height");
    if (!(weight > 0)) missing.push("current weight");
    if (!(trainingYears >= 0)) missing.push("training history");
    return {
      complete: missing.length === 0,
      missing,
      age: age || null,
      height: height || null,
      weight: weight || null,
      trainingYears: trainingYears >= 0 ? trainingYears : null,
      athleteType: source.athleteType || null
    };
  }

  function baselineSignals(input = {}) {
    const signals = [
      { id: "body", label: "Body starting point", captured: Boolean(input.bodyBaseline), detail: "Weight is required. Measurements and photos strengthen the outcome record." },
      { id: "performance", label: "Performance starting point", captured: Boolean(input.performanceBaseline), detail: "Completed Strength, Cardio, or Core evidence gives Atlas a comparison point." },
      { id: "recovery", label: "Recovery starting point", captured: Boolean(input.recoveryBaseline), detail: "A Roll Call establishes the first sleep, RHR, HRV, soreness, and pain context." }
    ];
    return {
      signals,
      captured: signals.filter((item) => item.captured).length,
      total: signals.length,
      recommended: signals.filter((item) => !item.captured)
    };
  }

  function normalizedBlockers(items = []) {
    return (Array.isArray(items) ? items : []).map((item, index) => ({
      id: item.id || item.code || `blocker-${index + 1}`,
      title: text(item.title || item.label, "Commissioning issue"),
      detail: text(item.detail || item.message, "Atlas found an issue that must be resolved before launch."),
      action: text(item.action, "Review the affected plan or calendar."),
      source: upper(item.source || item.module || "PROGRAM")
    }));
  }

  function stepState(id, complete, current, detail) {
    return { id, label: STEP_DEFINITIONS.find((item) => item.id === id)?.label || id, complete: Boolean(complete), current: Boolean(current), detail };
  }

  function buildCommissioning(input = {}) {
    const contract = input.contract || null;
    const draftContract = input.draftContract || null;
    const signed = Boolean(contract && upper(contract.status) === "APPROVED" && input.signatureValid !== false);
    const profile = recruitProfile(contract || {}, input.profile || {});
    const orientationComplete = upper(input.orientation?.status) === "COMPLETE";
    const packageReady = upper(input.programPackage?.status) === "READY_FOR_APPROVAL";
    const preflightReady = upper(input.preflight?.status) === "READY_TO_ACTIVATE";
    const activeProgram = signed && programActive(input.programReceipt, contract);
    const activeCommission = signed && commissioningActive(input.receipt, contract);
    const committedWeek = Boolean(input.committedWeek && upper(input.committedWeek.status || input.committedWeek.state) !== "REPLACED");
    const baseline = baselineSignals(input.baseline || {});
    let status = "CONTRACT_REQUIRED";
    let headline = "Declare the mission";
    let message = "Sign one Recruit Contract before Atlas commissions the campaign.";
    let nextAction = { code: "EDIT_CONTRACT", label: "Set the Contract", target: "recruit-contract-editor" };
    let blockers = [];

    if (signed && activeProgram && committedWeek) {
      status = "ACTIVE";
      headline = "Campaign commissioned";
      message = draftContract
        ? `R${contractRevision(contract)} signed · R${contractRevision(draftContract)} draft open. The active campaign stays under R${contractRevision(contract)} until the draft is signed or discarded.`
        : `R${contractRevision(contract)} signed. The complete program and opening calendar are active under one campaign order.`;
      nextAction = { code: "OPEN_TODAY", label: "Open Today", target: "today" };
    } else if (signed && draftContract) {
      status = "DRAFT_PENDING";
      headline = `Finish R${contractRevision(draftContract)} draft`;
      message = `R${contractRevision(contract)} signed · R${contractRevision(draftContract)} draft open. Campaign setup is paused until R${contractRevision(draftContract)} is signed or discarded.`;
      nextAction = { code: "EDIT_CONTRACT", label: `Finish R${contractRevision(draftContract)} draft`, target: "recruit-contract-editor" };
    } else if (signed && (!profile.complete || !orientationComplete)) {
      status = "BASELINE_REQUIRED";
      headline = "Establish the operating baseline";
      message = profile.complete
        ? "Protect the Week One protocol before Atlas launches the complete program."
        : `Complete ${profile.missing.join(", ")} so Atlas can build a safe, specific opening week.`;
      nextAction = { code: "OPEN_ORIENTATION", label: "Complete baseline order", target: "first-week-orientation" };
      if (!profile.complete) blockers.push({ id: "profile", title: "Recruit profile incomplete", detail: `Missing ${profile.missing.join(", ")}.`, action: "Complete the recruit profile in Week One orientation.", source: "BASELINE" });
    } else if (signed && (!packageReady || !preflightReady)) {
      blockers = normalizedBlockers(input.preflight?.blockers || []);
      if (packageReady && blockers.length) {
        status = "BLOCKED";
        headline = "Clear the launch blockers";
        message = `${blockers.length} specific issue${blockers.length === 1 ? "" : "s"} prevent the program and calendar from activating together.`;
        nextAction = { code: "REVIEW_BLOCKERS", label: "Review blockers", target: "contract-activation" };
      } else {
        status = "PROGRAM_REQUIRED";
        headline = "Assemble the complete program";
        message = "Atlas will coordinate Strength, Cardio, Core, Fuel, and the opening calendar from this Contract.";
        nextAction = { code: "STAGE_PROGRAM", label: "Build complete program", target: "contract-activation" };
      }
    } else if (signed) {
      status = "READY_TO_LAUNCH";
      headline = "Ready to begin";
      message = "One action activates every approved plan, commits the opening calendar, and starts the campaign clock.";
      nextAction = { code: "BEGIN_CAMPAIGN", label: "Begin Campaign", target: "campaign-commissioning" };
    }

    if (activeCommission && activeProgram && committedWeek) {
      status = "ACTIVE";
      headline = "Campaign commissioned";
      message = draftContract
        ? `R${contractRevision(contract)} signed · R${contractRevision(draftContract)} draft open. The active campaign stays under R${contractRevision(contract)} until the draft is signed or discarded.`
        : `R${contractRevision(contract)} signed. The complete program and opening calendar are active under one campaign order.`;
    }

    const state = {
      contract: signed,
      baseline: signed && profile.complete && orientationComplete,
      program: activeProgram || packageReady,
      calendar: activeProgram ? committedWeek : preflightReady,
      launch: status === "ACTIVE"
    };
    const currentId = STEP_DEFINITIONS.find((item) => !state[item.id])?.id || "launch";
    const steps = STEP_DEFINITIONS.map((item) => stepState(item.id, state[item.id], item.id === currentId && !state[item.id], {
      contract: signed
        ? `R${contractRevision(contract)} signed${draftContract ? ` · R${contractRevision(draftContract)} draft open` : ""}`
        : "Signature required",
      baseline: orientationComplete ? "Week One order secured" : "Profile and protocol",
      program: activeProgram ? "Complete program active" : packageReady ? "Prescription ready" : "Atlas package required",
      calendar: committedWeek ? "Opening week committed" : preflightReady ? "Opening week verified" : "Calendar verification required",
      launch: status === "ACTIVE" ? "Campaign clock active" : "One final authorization"
    }[item.id]));
    const complete = steps.filter((item) => item.complete).length;

    return {
      version: VERSION,
      status,
      tone: status === "ACTIVE" ? "green" : status === "BLOCKED" ? "red" : status === "READY_TO_LAUNCH" ? "gold" : "yellow",
      headline,
      message,
      contractId: contractId(contract || {}),
      contractRevision: contractRevision(contract || {}),
      draftContractRevision: draftContract ? contractRevision(draftContract) : null,
      profile,
      baseline,
      blockers,
      steps,
      progress: { complete, total: steps.length, percent: Math.round(complete / steps.length * 100) },
      nextAction,
      activeProgram,
      committedWeek,
      legacyActive: status === "ACTIVE" && !activeCommission,
      receipt: activeCommission ? clone(input.receipt) : null
    };
  }

  function createReceipt(model = {}, programReceipt = {}, week = {}, options = {}) {
    if (!["READY_TO_LAUNCH", "ACTIVE"].includes(model.status)) throw new Error("Campaign commissioning is not ready to finalize.");
    if (!model.contractId || !programActive(programReceipt, { id: model.contractId, revision: model.contractRevision })) {
      throw new Error("The active program does not match the commissioned Contract.");
    }
    const launchedAt = options.launchedAt || programReceipt.activatedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `commission:${model.contractId}:r${model.contractRevision}`,
      status: "ACTIVE",
      contractId: model.contractId,
      contractRevision: model.contractRevision,
      programReceiptId: programReceipt.id || programReceipt.receiptId || null,
      weekId: week.id || null,
      weekStart: week.weekStart || programReceipt.weekStart || null,
      baseline: {
        profileComplete: model.profile?.complete === true,
        captured: model.baseline?.captured || 0,
        total: model.baseline?.total || 3,
        signals: clone(model.baseline?.signals || [])
      },
      launchedAt,
      updatedAt: options.updatedAt || launchedAt,
      source: options.source || (model.legacyActive ? "ACTIVE_PROGRAM_BACKFILL" : "BEGIN_CAMPAIGN")
    };
  }

  return {
    VERSION,
    STEP_DEFINITIONS,
    linkedToContract,
    programActive,
    commissioningActive,
    recruitProfile,
    baselineSignals,
    buildCommissioning,
    createReceipt
  };
});
