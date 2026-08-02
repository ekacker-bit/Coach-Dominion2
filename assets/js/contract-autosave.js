(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionContractAutosave = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021G.1";

  function report(onError, error, phase) {
    if (typeof onError === "function") onError(error, phase);
  }

  function enqueue(previous, task, onError) {
    return Promise.resolve(previous)
      .catch((error) => {
        report(onError, error, "previous");
        return null;
      })
      .then(() => task())
      .catch((error) => {
        report(onError, error, "current");
        return false;
      });
  }

  function withTimeout(value, timeoutMs = 8000, code = "CONTRACT_SYNC_TIMEOUT") {
    const duration = Math.max(1, Number(timeoutMs) || 8000);
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error("Contract account sync timed out.");
        error.code = code;
        reject(error);
      }, duration);
    });
    return Promise.race([Promise.resolve(value), timeout])
      .finally(() => clearTimeout(timer));
  }

  return Object.freeze({
    VERSION,
    enqueue,
    withTimeout
  });
});
