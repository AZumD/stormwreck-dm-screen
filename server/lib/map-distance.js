/**
 * Map-space distance helpers (server + shared algorithm).
 * Distance uses application scale.distancePerGrid — never hard-coded feet.
 */
"use strict";

function hypot(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @param {{ distancePerGrid: number, unit?: string }} scale
 * @param {{ mode?: "euclidean" | "grid-euclidean", snap?: boolean }} [opts]
 */
function distanceBetween(a, b, scale, opts = {}) {
  const ax = Number(a?.x);
  const ay = Number(a?.y);
  const bx = Number(b?.x);
  const by = Number(b?.y);
  if (![ax, ay, bx, by].every(Number.isFinite)) {
    const err = new Error("Invalid coordinates");
    err.status = 400;
    throw err;
  }
  const per = Number(scale?.distancePerGrid);
  if (!Number.isFinite(per) || per <= 0) {
    const err = new Error("Invalid distancePerGrid");
    err.status = 400;
    throw err;
  }
  const unit = scale?.unit != null ? String(scale.unit) : "ft";
  const mode = opts.mode || "euclidean";

  let cells;
  if (mode === "grid-euclidean") {
    const dx = Math.abs(Math.round(bx) - Math.round(ax));
    const dy = Math.abs(Math.round(by) - Math.round(ay));
    cells = hypot(dx, dy);
  } else {
    cells = hypot(bx - ax, by - ay);
  }

  let distance = cells * per;
  if (opts.snap) {
    distance = Math.round(distance / per) * per;
  }

  return {
    cells,
    distance,
    unit,
    mode,
    snapped: Boolean(opts.snap),
    label: formatDistance(distance, unit)
  };
}

function formatDistance(distance, unit) {
  const n = Number(distance);
  if (!Number.isFinite(n)) return "";
  const rounded = Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${rounded} ${unit || "ft"}`;
}

/** Pixel → world (grid cells), UVTT convention. */
function pixelToWorld(px, py, grid) {
  const ppg = Number(grid?.pixelsPerGrid) || 1;
  const ox = Number(grid?.origin?.x) || 0;
  const oy = Number(grid?.origin?.y) || 0;
  return {
    x: ox + Number(px) / ppg,
    y: oy + Number(py) / ppg
  };
}

function worldToPixel(wx, wy, grid) {
  const ppg = Number(grid?.pixelsPerGrid) || 1;
  const ox = Number(grid?.origin?.x) || 0;
  const oy = Number(grid?.origin?.y) || 0;
  return {
    x: (Number(wx) - ox) * ppg,
    y: (Number(wy) - oy) * ppg
  };
}

/** Percent-of-image → world, for legacy pins on calibrated maps. */
function percentToWorld(pctX, pctY, map) {
  const w = Number(map?.widthPx) || 0;
  const h = Number(map?.heightPx) || 0;
  if (w <= 0 || h <= 0 || !map?.grid) return null;
  return pixelToWorld((Number(pctX) / 100) * w, (Number(pctY) / 100) * h, map.grid);
}

module.exports = {
  distanceBetween,
  formatDistance,
  pixelToWorld,
  worldToPixel,
  percentToWorld
};
