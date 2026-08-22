/**
 * Parse stored entity reference strings (@type:id|Label).
 */
"use strict";

function parseEntityRef(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const m = text.match(/^@([^:]+):([^|]+)(?:\|(.*))?$/);
  if (!m) return { raw: text, type: null, id: null, label: text };
  return {
    raw: text,
    type: m[1],
    id: m[2].trim(),
    label: (m[3] != null ? m[3] : m[2]).trim()
  };
}

module.exports = { parseEntityRef };
