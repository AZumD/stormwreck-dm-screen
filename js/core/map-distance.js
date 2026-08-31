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

  /** Snap world coords to the center of the nearest grid cell (not line intersections). */
  function snapWorldToCellCenter(world) {
    if (!world || typeof world !== "object") return world;
    const x = Number(world.x);
    const y = Number(world.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return world;
    return { x: Math.round(x - 0.5) + 0.5, y: Math.round(y - 0.5) + 0.5 };
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

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  /** Visible image pixels when CSS letterboxes (object-fit: contain). */
  function imageContentRect(img) {
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const nw = img.naturalWidth || 0;
    const nh = img.naturalHeight || 0;
    if (!nw || !nh || !rect.width || !rect.height) return rect;
    const elAspect = rect.width / rect.height;
    const imgAspect = nw / nh;
    if (Math.abs(elAspect - imgAspect) < 0.001) return rect;
    if (elAspect > imgAspect) {
      const h = rect.height;
      const w = h * imgAspect;
      const left = rect.left + (rect.width - w) / 2;
      return { left, top: rect.top, width: w, height: h, right: left + w, bottom: rect.bottom };
    }
    const w = rect.width;
    const h = w / imgAspect;
    const top = rect.top + (rect.height - h) / 2;
    return { left: rect.left, top, width: w, height: h, right: rect.right, bottom: top + h };
  }

  /** Normalized 0–1 coords on map image (ignores letterbox padding). */
  function clientToNormalized(clientX, clientY, img, map) {
    const rect = imageContentRect(img);
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: clamp((clientX - rect.left) / rect.width, 0, 1),
      y: clamp((clientY - rect.top) / rect.height, 0, 1)
    };
  }

  function clientToPercent(clientX, clientY, img, map) {
    const norm = clientToNormalized(clientX, clientY, img, map);
    if (!norm) return null;
    return { x: norm.x * 100, y: norm.y * 100 };
  }

  /**
   * One shared box for map image + overlays so %/normalized coords match visible art.
   * Safe to call repeatedly (migrates existing DOM).
   */
  function ensureMapSurface(mapWorld, mapImage) {
    if (!mapWorld) return null;
    let surface = mapWorld.querySelector(":scope > .map-surface");
    if (!surface) {
      surface = document.createElement("div");
      surface.className = "map-surface";
      surface.id = mapWorld.id ? `${mapWorld.id}-surface` : "map-surface";
      mapWorld.insertBefore(surface, mapWorld.firstChild);
    }
    if (mapImage && mapImage.parentNode !== surface) surface.appendChild(mapImage);
    const pins = mapWorld.querySelector(":scope > .map-pins") || document.getElementById("map-pins");
    if (pins && pins.parentNode !== surface) surface.appendChild(pins);
    ["map-grid-overlay", "map-measure-layer", "map-tokens", "map-fog-layer"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.parentNode !== surface) surface.appendChild(el);
    });
    return surface;
  }

  return {
    distanceBetween,
    formatDistance,
    pixelToWorld,
    worldToPercent,
    percentToWorld,
    snapWorldToCellCenter,
    imageContentRect,
    clientToNormalized,
    clientToPercent,
    ensureMapSurface,
    clamp
  };
})();
