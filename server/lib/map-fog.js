/**
 * Fog visibility helpers (mirrors js/core/map-fog.js stroke semantics).
 */
"use strict";

function strokeList(fog) {
  if (!fog?.strokes) return [];
  const raw = fog.strokes;
  const list = Array.isArray(raw) ? raw.filter(Boolean) : Object.values(raw).filter(Boolean);
  return list.sort((a, b) => (a.seq || 0) - (b.seq || 0));
}

function pointInStroke(stroke, x, y) {
  const r = Number(stroke.radius) || 0.025;
  return (stroke.points || []).some((pt) => {
    if (!Array.isArray(pt) || pt.length < 2) return false;
    return Math.hypot(Number(x) - pt[0], Number(y) - pt[1]) <= r;
  });
}

/** Normalized 0–1 map coords. True when fog covers the point. */
function isPointHidden(fog, x, y) {
  if (!fog?.enabled || fog.revealedAll) return false;
  let hidden = true;
  for (const stroke of strokeList(fog)) {
    if (!pointInStroke(stroke, x, y)) continue;
    hidden = stroke.mode === "hide";
  }
  return hidden;
}

/** Token percent coords are 0–100. */
function isPercentHidden(fog, percent) {
  if (!percent || percent.x == null || percent.y == null) return false;
  return isPointHidden(fog, percent.x / 100, percent.y / 100);
}

function filterVisibleTokens(tokens, fog) {
  if (!fog?.enabled || fog.revealedAll) return tokens;
  return (tokens || []).filter((t) => t.isSelf || !isPercentHidden(fog, t.percent));
}

module.exports = {
  strokeList,
  pointInStroke,
  isPointHidden,
  isPercentHidden,
  filterVisibleTokens
};
