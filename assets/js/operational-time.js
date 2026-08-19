(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionOperationalTime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030E.1";

  function text(value = "") { return String(value ?? "").trim(); }
  function validTimeZone(value = "") {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: text(value) }).format();
      return Boolean(text(value));
    } catch (_error) {
      return false;
    }
  }
  function resolveZone(...candidates) {
    return candidates.flat().map(text).find(validTimeZone)
      || Intl.DateTimeFormat().resolvedOptions().timeZone
      || "UTC";
  }
  function dateInZone(input = new Date(), timeZone = resolveZone()) {
    const date = input instanceof Date ? input : new Date(input);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: resolveZone(timeZone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date).reduce((output, part) => {
      if (part.type !== "literal") output[part.type] = part.value;
      return output;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function stamp(input = new Date(), timeZone = resolveZone()) {
    const date = input instanceof Date ? input : new Date(input);
    const zone = resolveZone(timeZone);
    return Object.freeze({
      recordedAt: date.toISOString(),
      operationalDate: dateInZone(date, zone),
      timeZone: zone
    });
  }

  return Object.freeze({ VERSION, validTimeZone, resolveZone, dateInZone, stamp });
});
