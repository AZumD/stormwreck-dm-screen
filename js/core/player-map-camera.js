/**
 * Player Map camera helpers — PC-centered tactical zoom (no free pan).
 * Shared by the browser PlayerMapView and Node validation tests.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) root.PlayerMapCamera = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /** Closest tactical view (inspect immediate surroundings). */
  const PLAYER_MAP_MAX_ZOOM = 3.2;
  /**
   * Widest tactical view. Kept above 1 so the fitted full-map overview
   * (world sized to the viewport at scale 1) is not reachable.
   */
  const PLAYER_MAP_MIN_ZOOM = 1.45;
  /** Sensible middle tactical zoom for first open / session default. */
  const PLAYER_MAP_DEFAULT_ZOOM = 2;
  const PLAYER_MAP_ZOOM_STEP = 1.12;

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function clampZoom(z) {
    return clamp(Number(z) || PLAYER_MAP_DEFAULT_ZOOM, PLAYER_MAP_MIN_ZOOM, PLAYER_MAP_MAX_ZOOM);
  }

  /**
   * Pan offsets that place percent-position `pos` at the viewport center
   * for the current world size and zoom. Camera anchor is always the PC.
   */
  function computeCenterPan(pos, worldW, worldH, viewportW, viewportH, z) {
    const tx = (Number(pos.x) / 100) * worldW;
    const ty = (Number(pos.y) / 100) * worldH;
    return {
      panX: viewportW / 2 - tx * z,
      panY: viewportH / 2 - ty * z
    };
  }

  return {
    PLAYER_MAP_MIN_ZOOM,
    PLAYER_MAP_MAX_ZOOM,
    PLAYER_MAP_DEFAULT_ZOOM,
    PLAYER_MAP_ZOOM_STEP,
    clampZoom,
    computeCenterPan
  };
});
