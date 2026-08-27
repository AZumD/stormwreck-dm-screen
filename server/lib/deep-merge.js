/**
 * Recursive JSON merge for campaign document PATCH.
 * Objects merge deeply; arrays replace; null deletes a key (RFC 7396-style).
 * Prototype pollution keys are ignored.
 */
"use strict";

const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isPlainObject(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

function copyOwn(source) {
  const out = {};
  if (!isPlainObject(source)) return out;
  for (const key of Object.keys(source)) {
    if (BLOCKED_KEYS.has(key)) continue;
    out[key] = cloneJson(source[key]);
  }
  return out;
}

/**
 * @param {*} target - current value (not mutated)
 * @param {*} patch - patch value
 * @returns {*} merged result
 */
function deepMerge(target, patch) {
  if (patch === undefined) {
    return cloneJson(target);
  }
  if (patch === null || Array.isArray(patch) || !isPlainObject(patch)) {
    return cloneJson(patch);
  }
  const base = copyOwn(target);
  for (const key of Object.keys(patch)) {
    if (BLOCKED_KEYS.has(key)) continue;
    const patchVal = patch[key];
    if (patchVal === null) {
      delete base[key];
      continue;
    }
    if (isPlainObject(patchVal) && isPlainObject(base[key])) {
      base[key] = deepMerge(base[key], patchVal);
    } else if (isPlainObject(patchVal)) {
      base[key] = deepMerge({}, patchVal);
    } else {
      base[key] = cloneJson(patchVal);
    }
  }
  return base;
}

module.exports = {
  deepMerge,
  isPlainObject,
  BLOCKED_KEYS
};
