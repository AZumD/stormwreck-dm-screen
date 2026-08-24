/**
 * Client map-space distance (mirrors server/lib/map-distance.js).
 */
window.MapDistance = (function () {
  "use strict";

  function hypot(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  }

  function distanceBetween(a, b, scale, opts) {
    opts = opts || {};
    const ax = Number(a && a.x);
    const ay = Number(a && a.y);
    const bx = Number(b && b.x);
    const by = Number(b && b.y);
    if (![ax, ay, bx, by].every(Number.isFinite)) return null;
    const per = Number(scale && scale.distancePerGrid);
    if (!Number.isFinite(per) || per <= 0) return null;
    const unit = scale.unit != null ? String(scale.unit) : "ft";
    const mode = opts.mode || "euclidean";
    let cells;
    if (mode === "grid-euclidean") {
      cells = hypot(Math.abs(Math.round(bx) - Math.round(ax)), Math.abs(Math.round(by) - Math.round(ay)));
    } else {
      cells = hypot(bx - ax, by - ay);
    }
    let distance = cells * per;
    if (opts.snap) distance = Math.round(distance / per) * per;
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

  function pixelToWorld(px, py, grid) {
    const ppg = Number(grid && grid.pixelsPerGrid) || 1;
    const ox = Number(grid && grid.origin && grid.origin.x) || 0;
    const oy = Number(grid && grid.origin && grid.origin.y) || 0;
    return { x: ox + Number(px) / ppg, y: oy + Number(py) / ppg };
  }

  function worldToPercent(wx, wy, map) {
    if (!map || !map.grid || !map.widthPx || !map.heightPx) return null;
    const ppg = Number(map.grid.pixelsPerGrid) || 1;
    const ox = Number(map.grid.origin && map.grid.origin.x) || 0;
    const oy = Number(map.grid.origin && map.grid.origin.y) || 0;
    const px = (Number(wx) - ox) * ppg;
    const py = (Number(wy) - oy) * ppg;
    return {
      x: (px / map.widthPx) * 100,
      y: (py / map.heightPx) * 100
    };
  }

  function percentToWorld(pctX, pctY, map) {
    if (!map || !map.grid || !map.widthPx || !map.heightPx) return null;
    return pixelToWorld((Number(pctX) / 100) * map.widthPx, (Number(pctY) / 100) * map.heightPx, map.grid);
  }

  return { distanceBetween, formatDistance, pixelToWorld, worldToPercent, percentToWorld };
})();
