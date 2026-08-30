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

function pointInRect(rect, x, y) {
  if (!Array.isArray(rect) || rect.length < 4) return false;
  const x0 = Number(rect[0]);
  const y0 = Number(rect[1]);
  const x1 = Number(rect[2]);
  const y1 = Number(rect[3]);
  if (![x0, y0, x1, y1, x, y].every(Number.isFinite)) return false;
  return x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && y >= Math.min(y0, y1) && y <= Math.max(y0, y1);
}

function pointInStroke(stroke, x, y) {
  if (stroke?.shape === "rect") return pointInRect(stroke.rect, x, y);
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
  pointInRect,
  pointInStroke,
  isPointHidden,
  isPercentHidden,
  filterVisibleTokens
};
