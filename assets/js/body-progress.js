
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionBodyProgress = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "022B.1";
  const BUCKET = "body-progress-photos";
  const PHOTO_ANGLES = Object.freeze([
    { key: "FRONT", label: "Front" },
    { key: "SIDE", label: "Side" },
    { key: "BACK", label: "Back" }
  ]);
  const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
  const ALLOWED_PHOTO_TYPES = Object.freeze(["image/jpeg", "image/png", "image/webp"]);

  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, digits = 1) => value === null ? null : Number(Number(value).toFixed(digits));
  const dateOnly = (value) => String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || null;
  const normalizeUnit = (value) => String(value || "in").toLowerCase() === "cm" ? "cm" : "in";
  const inches = (value, unit) => {
    const numeric = finite(value);
    return numeric === null ? null : normalizeUnit(unit) === "cm" ? numeric / 2.54 : numeric;
  };

  function normalizeFormulaSex(value) {
    const normalized = String(value || "").trim().toUpperCase().replaceAll(" ", "_");
    if (["MAN", "MALE"].includes(normalized)) return "MAN";
    if (["WOMAN", "FEMALE"].includes(normalized)) return "WOMAN";
    return null;
  }

  function estimateBodyFat(input = {}, profile = {}) {
    const unit = normalizeUnit(input.unit || input.circumference_unit);
    const sex = normalizeFormulaSex(input.formulaSex || input.gender || profile.gender);
    const height = finite(input.heightInches) ?? (finite(profile.heightCm) === null ? null : finite(profile.heightCm) / 2.54);
    const waist = inches(input.waist, unit);
    const neck = inches(input.neck, unit);
    const hips = inches(input.hips, unit);
    const missing = [];
    if (!sex) missing.push("profile sex");
    if (height === null) missing.push("profile height");
    if (waist === null) missing.push("waist");
    if (neck === null) missing.push("neck");
    if (sex === "WOMAN" && hips === null) missing.push("hips");
    if (missing.length) {
      return {
        valid: false,
        value: null,
        missing,
        method: "US_NAVY_CIRCUMFERENCE",
        label: `Add ${missing.join(", ")} for an estimate.`
      };
    }
    const circumference = sex === "MAN" ? waist - neck : waist + hips - neck;
    if (height <= 0 || circumference <= 0) {
      return { valid: false, value: null, missing: [], method: "US_NAVY_CIRCUMFERENCE", label: "Check the height and circumference values." };
    }
    const raw = sex === "MAN"
      ? 86.010 * Math.log10(circumference) - 70.041 * Math.log10(height) + 36.76
      : 163.205 * Math.log10(circumference) - 97.684 * Math.log10(height) - 78.387;
    if (!Number.isFinite(raw) || raw <= 2 || raw > 70) {
      return { valid: false, value: null, missing: [], method: "US_NAVY_CIRCUMFERENCE", label: "These measurements do not produce a usable estimate." };
    }
    const value = round(raw, 1);
    return {
      valid: true,
      value,
      rangeLow: round(Math.max(2, value - 3.5), 1),
      rangeHigh: round(Math.min(75, value + 3.5), 1),
      sex,
      method: "US_NAVY_CIRCUMFERENCE",
      confidence: "APPROXIMATE",
      label: `${value}% estimated body fat`,
      detail: "Circumference estimate. Track the trend under the same conditions."
    };
  }

  function validatePhotoFile(file = {}) {
    const type = String(file.type || "").toLowerCase();
    const size = Number(file.size || 0);
    const errors = [];
    if (!ALLOWED_PHOTO_TYPES.includes(type)) errors.push("Use a JPEG, PNG, or WebP image.");
    if (!size) errors.push("Choose a photo.");
    if (size > MAX_PHOTO_BYTES) errors.push("Each photo must be 8 MB or smaller.");
    return { valid: errors.length === 0, errors, type, size };
  }

  function photoPath(userId, date, angle) {
    const owner = String(userId || "").trim();
    const captureDate = dateOnly(date);
    const normalizedAngle = String(angle || "").toUpperCase();
    if (!owner || !captureDate || !PHOTO_ANGLES.some((item) => item.key === normalizedAngle)) return null;
    return `${owner}/${captureDate}/${normalizedAngle.toLowerCase()}.jpg`;
  }

  function normalizePhotoRecord(row = {}) {
    return {
      id: row.id || null,
      userId: row.user_id || row.userId || null,
      date: dateOnly(row.performance_date || row.performanceDate || row.date),
      angle: String(row.angle || "").toUpperCase(),
      storagePath: row.storage_path || row.storagePath || null,
      contentType: row.content_type || row.contentType || "image/jpeg",
      sizeBytes: Number(row.size_bytes || row.sizeBytes || 0),
      width: finite(row.width),
      height: finite(row.height),
      createdAt: row.created_at || row.createdAt || null,
      updatedAt: row.updated_at || row.updatedAt || null
    };
  }

  function groupPhotos(records = []) {
    const groups = new Map();
    records.map(normalizePhotoRecord).filter((row) => row.date && row.storagePath).forEach((row) => {
      if (!groups.has(row.date)) groups.set(row.date, {});
      groups.get(row.date)[row.angle] = row;
    });
    return [...groups.entries()]
      .map(([date, photos]) => ({ date, photos, count: Object.keys(photos).length }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  function comparison(records = [], fromDate = null, toDate = null) {
    const groups = groupPhotos(records);
    const dates = groups.map((item) => item.date);
    const start = dates.includes(fromDate) ? fromDate : dates[0] || null;
    const end = dates.includes(toDate) ? toDate : dates.at(-1) || null;
    return {
      dates,
      from: groups.find((item) => item.date === start) || null,
      to: groups.find((item) => item.date === end) || null,
      ready: Boolean(start && end && start !== end)
    };
  }

  function checkpointStatus(records = [], date) {
    const captureDate = dateOnly(date);
    const photos = groupPhotos(records).find((item) => item.date === captureDate);
    return { date: captureDate, count: photos?.count || 0, complete: photos?.count === PHOTO_ANGLES.length, photos: photos?.photos || {} };
  }

  return Object.freeze({
    VERSION,
    BUCKET,
    PHOTO_ANGLES,
    MAX_PHOTO_BYTES,
    ALLOWED_PHOTO_TYPES,
    normalizeFormulaSex,
    estimateBodyFat,
    validatePhotoFile,
    photoPath,
    normalizePhotoRecord,
    groupPhotos,
    comparison,
    checkpointStatus
  });
});

