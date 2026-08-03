(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAtlasIntervention = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "022A.1";

  const DEFINITIONS = Object.freeze({
    SETUP_REQUIRED: {
      issue: "Finish setup",
      move: "Connect the Contract and approved plans before Atlas adjusts training.",
      action: "OPEN_CONTRACT"
    },
    OBSERVATION_REQUIRED: {
      issue: "Atlas needs today's signal",
      move: "Complete Roll Call before changing the plan.",
      action: "OPEN_ROLL_CALL"
    },
    COLLECT_EVIDENCE: {
      issue: "Build the evidence",
      move: "Keep the plan and log today's work.",
      action: "CONTINUE"
    },
    PROTECT: {
      issue: "Pain comes first",
      move: "Replace loaded work with recovery until tomorrow's check.",
      question: {
        id: "pain-limits-movement",
        prompt: "Is pain changing how you move today?",
        answers: [
          { id: "YES_LIMITING", label: "Yes — protect me", disposition: "APPROVE", recommended: true },
          { id: "NO_LIMITING", label: "No — discomfort only", disposition: "REVIEW_ROLL_CALL" }
        ]
      }
    },
    DELOAD: {
      issue: "Fatigue is accumulating",
      move: "Reduce today's strength and running demand.",
      question: {
        id: "systemic-fatigue",
        prompt: "Does this feel like whole-body fatigue, not normal soreness?",
        answers: [
          { id: "YES_SYSTEMIC", label: "Yes — reduce demand", disposition: "APPROVE", recommended: true },
          { id: "NO_NORMAL", label: "No — normal soreness", disposition: "HOLD" }
        ]
      }
    },
    REBALANCE: {
      issue: "The week is not executable",
      move: "Simplify the next exposure and protect recovery.",
      question: {
        id: "execution-blocker",
        prompt: "What is blocking execution most?",
        answers: [
          { id: "TIME", label: "Time", disposition: "APPROVE", recommended: true },
          { id: "RECOVERY", label: "Recovery", disposition: "APPROVE" },
          { id: "PLAN_FIT", label: "Plan fit", disposition: "APPROVE" }
        ]
      }
    },
    PROGRESS: {
      issue: "You may be ready to progress",
      move: "Stage the smallest increase for the next cycle.",
      question: {
        id: "clean-execution",
        prompt: "Did the last hard session finish with clean technique and reserve?",
        answers: [
          { id: "YES_CLEAN", label: "Yes — clean and controlled", disposition: "APPROVE", recommended: true },
          { id: "NO_NOT_READY", label: "No — repeat the dose", disposition: "HOLD" }
        ]
      }
    },
    MONITOR: {
      issue: "Hold progression",
      move: "Finish the baseline window before increasing demand.",
      action: "CONTINUE"
    },
    HOLD: {
      issue: "Stay the course",
      move: "Repeat the current prescription and collect another exposure.",
      action: "CONTINUE"
    }
  });

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function definitionFor(code) {
    return DEFINITIONS[code] || DEFINITIONS.HOLD;
  }

  function validResponse(proposal, question, response) {
    if (!question || !response) return null;
    if (response.proposalId !== proposal.id || response.questionId !== question.id) return null;
    const answer = question.answers.find((item) => item.id === response.answerId);
    return answer ? { ...clone(response), answer: clone(answer) } : null;
  }

  function signalLine(proposal = {}) {
    const readiness = proposal.signals?.readiness || {};
    const evidence = proposal.signals?.evidence || {};
    const execution = evidence.adherencePercent == null ? "execution still building" : `${evidence.adherencePercent}% execution`;
    if (Number(readiness.painDays || 0) > 0) return `${readiness.painDays} pain flag${readiness.painDays === 1 ? "" : "s"} · ${execution}`;
    if (readiness.strainFlag) return `recovery strain · ${execution}`;
    if (readiness.averageEnergy != null) return `energy ${readiness.averageEnergy}/10 · ${execution}`;
    return execution;
  }

  function stateLabel(proposal, response) {
    if (proposal.status === "APPROVED") return "ACTIVE";
    if (proposal.status === "HELD") return "PLAN KEPT";
    if (proposal.code === "SETUP_REQUIRED") return "SETUP";
    if (["OBSERVATION_REQUIRED", "COLLECT_EVIDENCE", "MONITOR"].includes(proposal.code)) return "MONITORING";
    if (proposal.status === "PROPOSED") return response ? "READY" : "YOUR CALL";
    return "ON TRACK";
  }

  function actionLabel(code, disposition) {
    if (disposition === "HOLD") return "Keep current plan";
    if (disposition === "REVIEW_ROLL_CALL") return "Review Roll Call";
    return ({
      PROTECT: "Approve protection",
      DELOAD: "Approve reduced demand",
      REBALANCE: "Approve simpler next step",
      PROGRESS: "Approve staged progression"
    })[code] || "Approve adjustment";
  }

  function buildIntervention(proposal = {}, storedResponse = null) {
    const definition = definitionFor(proposal.code);
    const question = clone(definition.question || null);
    const response = validResponse(proposal, question, storedResponse || proposal.atlasIntervention?.response);
    const disposition = response?.answer?.disposition || definition.action || null;
    return {
      version: VERSION,
      proposalId: proposal.id || null,
      code: proposal.code || "HOLD",
      proposalStatus: proposal.status || "CURRENT",
      stateLabel: stateLabel(proposal, response),
      issue: definition.issue,
      move: definition.move,
      signal: signalLine(proposal),
      question,
      response,
      disposition,
      canApprove: proposal.status === "PROPOSED" && disposition === "APPROVE",
      canHold: proposal.status === "PROPOSED" && disposition === "HOLD",
      needsRollCallReview: proposal.status === "PROPOSED" && disposition === "REVIEW_ROLL_CALL",
      primaryLabel: actionLabel(proposal.code, disposition),
      effectiveDate: proposal.effectiveDate || null,
      reviewDate: proposal.reviewDate || null,
      confidence: proposal.confidence || "LOW",
      changes: clone(proposal.changes || [])
    };
  }

  function answerIntervention(intervention = {}, answerId, answeredAt = new Date().toISOString()) {
    const question = intervention.question;
    const answer = question?.answers?.find((item) => item.id === answerId);
    if (!intervention.proposalId || !question || !answer) return null;
    return {
      version: VERSION,
      proposalId: intervention.proposalId,
      questionId: question.id,
      answerId: answer.id,
      label: answer.label,
      disposition: answer.disposition,
      answeredAt
    };
  }

  function attachResponse(proposal = {}, response = null) {
    if (!proposal.id || !response || response.proposalId !== proposal.id) return null;
    const intervention = buildIntervention(proposal, response);
    return clone({
      ...proposal,
      atlasIntervention: {
        version: VERSION,
        issue: intervention.issue,
        move: intervention.move,
        questionId: response.questionId,
        response
      }
    });
  }

  return Object.freeze({
    VERSION,
    DEFINITIONS,
    definitionFor,
    buildIntervention,
    answerIntervention,
    attachResponse
  });
});
