/**
 * Manual fog of war — normalized stroke storage + canvas rendering.
 * Strokes live in CampaignMapState.fog[mapId] (object keyed by stroke id for safe PATCH merge).
 */
window.MapFog = (function () {
  "use strict";

  const BRUSH_PRESETS = [0.012, 0.025, 0.05, 0.09];
  /** DM preview: visible fog indicator while map detail stays readable (~40% opaque). */
  const DM_FOG_ALPHA = 0.4;
  /** Player view: fully opaque black fog. */
  const PLAYER_FOG_ALPHA = 1;
  let painting = false;
  let rectDrag = null;
  let currentStroke = null;
  let lastNorm = null;

  function emptyFogMap() {
    return { enabled: false, revision: 0, revealedAll: false, strokes: {} };
  }

  function getFogState(campaignId, mapId) {
    const fogRoot = window.CampaignMapState?.get(campaignId)?.fog || {};
    const raw = fogRoot[mapId];
    if (!raw || typeof raw !== "object") return emptyFogMap();
    return {
      enabled: Boolean(raw.enabled),
      revision: Number(raw.revision) || 0,
      revealedAll: Boolean(raw.revealedAll),
      strokes: raw.strokes && typeof raw.strokes === "object" && !Array.isArray(raw.strokes) ? raw.strokes : {}
    };
  }

  function strokeList(fog) {
    return Object.values(fog.strokes || {}).sort((a, b) => (a.seq || 0) - (b.seq || 0));
  }

  function nextSeq(fog) {
    const list = strokeList(fog);
    return list.length ? Math.max(...list.map((s) => s.seq || 0)) + 1 : 1;
  }

  function patchFog(campaignId, mapId, partial) {
    if (!window.CampaignMapState) return;
    CampaignMapState.patch(campaignId, { fog: { [mapId]: partial } });
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

  /** Normalized 0–1 drag box; snaps to grid cells on calibrated maps when snapGrid is true. */
  function normRectFromDrag(startNorm, endNorm, map, snapGrid) {
    if (!startNorm || !endNorm) return null;
    if (
      snapGrid &&
      map?.grid &&
      map?.widthPx &&
      map?.heightPx &&
      window.MapDistance?.percentToWorld &&
      window.MapDistance?.worldToPercent
    ) {
      const ox = Number(map.grid.origin?.x) || 0;
      const oy = Number(map.grid.origin?.y) || 0;
      const toCell = (norm) => {
        const w = MapDistance.percentToWorld(norm.x * 100, norm.y * 100, map);
        if (!w) return null;
        return { cx: Math.floor(w.x - ox), cy: Math.floor(w.y - oy) };
      };
      const a = toCell(startNorm);
      const b = toCell(endNorm);
      if (!a || !b) return null;
      const minCx = Math.min(a.cx, b.cx);
      const maxCx = Math.max(a.cx, b.cx) + 1;
      const minCy = Math.min(a.cy, b.cy);
      const maxCy = Math.max(a.cy, b.cy) + 1;
      const cornerToNorm = (cx, cy) => {
        const pct = MapDistance.worldToPercent(ox + cx, oy + cy, map);
        if (!pct) return null;
        return { x: pct.x / 100, y: pct.y / 100 };
      };
      const tl = cornerToNorm(minCx, minCy);
      const br = cornerToNorm(maxCx, maxCy);
      if (!tl || !br) return null;
      return [
        Math.min(tl.x, br.x),
        Math.min(tl.y, br.y),
        Math.max(tl.x, br.x),
        Math.max(tl.y, br.y)
      ];
    }
    return [
      Math.min(startNorm.x, endNorm.x),
      Math.min(startNorm.y, endNorm.y),
      Math.max(startNorm.x, endNorm.x),
      Math.max(startNorm.y, endNorm.y)
    ];
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

  function isPercentHidden(fog, percent) {
    if (!percent || percent.x == null || percent.y == null) return false;
    return isPointHidden(fog, percent.x / 100, percent.y / 100);
  }

  function filterVisibleTokens(tokens, fog) {
    if (!fog?.enabled || fog.revealedAll) return tokens;
    return (tokens || []).filter((t) => t.isSelf || !isPercentHidden(fog, t.percent));
  }

  function ensureLayer(mapWorld) {
    if (!mapWorld) return null;
    let layer = document.getElementById("map-fog-layer");
    if (!layer) {
      layer = document.createElement("canvas");
      layer.id = "map-fog-layer";
      layer.className = "map-fog-layer";
      layer.setAttribute("aria-hidden", "true");
      mapWorld.appendChild(layer);
    } else if (layer.parentNode === mapWorld && layer !== mapWorld.lastElementChild) {
      mapWorld.appendChild(layer);
    }
    return layer;
  }

  function resizeCanvas(canvas, mapWorld) {
    if (!canvas || !mapWorld) return;
    const w = mapWorld.clientWidth || 1;
    const h = mapWorld.clientHeight || 1;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function clientToNorm(clientX, clientY, mapWorld, mapImage, map) {
    if (window.MapDistance?.clientToNormalized && mapImage) {
      return MapDistance.clientToNormalized(clientX, clientY, mapImage, map);
    }
    const rect = mapWorld?.getBoundingClientRect?.();
    if (!rect?.width || !rect.height) return null;
    return {
      x: clamp((clientX - rect.left) / rect.width, 0, 1),
      y: clamp((clientY - rect.top) / rect.height, 0, 1)
    };
  }

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function drawDisk(ctx, x, y, r, color, composite) {
    ctx.save();
    ctx.globalCompositeOperation = composite;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function render(canvas, fog, opts) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!fog?.enabled || fog.revealedAll) return;

    const dm = Boolean(opts?.dm);
    const fogAlpha = dm ? DM_FOG_ALPHA : PLAYER_FOG_ALPHA;

    /* Build an opaque hidden/revealed mask first so overlapping strokes never stack alpha. */
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, w, h);

    function paintOneStroke(stroke) {
      const hide = stroke.mode === "hide";
      const composite = hide ? "source-over" : "destination-out";
      if (stroke.shape === "rect" && Array.isArray(stroke.rect) && stroke.rect.length >= 4) {
        const [x0, y0, x1, y1] = stroke.rect.map(Number);
        if (![x0, y0, x1, y1].every(Number.isFinite)) return;
        ctx.save();
        ctx.globalCompositeOperation = composite;
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(x0 * w, y0 * h, (x1 - x0) * w, (y1 - y0) * h);
        ctx.restore();
        return;
      }
      const r = (Number(stroke.radius) || 0.025) * Math.min(w, h);
      (stroke.points || []).forEach((pt) => {
        if (!Array.isArray(pt) || pt.length < 2) return;
        drawDisk(ctx, pt[0] * w, pt[1] * h, r, "rgba(0, 0, 0, 1)", composite);
      });
    }

    function paintStrokes(strokes) {
      (strokes || []).forEach((stroke) => paintOneStroke(stroke));
    }

    paintStrokes(strokeList(fog));
    if (opts?.previewStroke?.points?.length) {
      paintStrokes([opts.previewStroke]);
    }

    if (fogAlpha < 1) {
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = `rgba(0, 0, 0, ${fogAlpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function refresh(campaignId, mapId, mapWorld, opts) {
    const canvas = ensureLayer(mapWorld);
    if (!canvas) return canvas;
    resizeCanvas(canvas, mapWorld);
    const fog = getFogState(campaignId, mapId);
    canvas.classList.toggle("map-fog-layer--active", fog.enabled && !fog.revealedAll);
    canvas.classList.toggle("map-fog-layer--dm", Boolean(opts?.dm));
    render(canvas, fog, opts);
    return canvas;
  }

  function newStrokeId() {
    return `fog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function commitStroke(campaignId, mapId, stroke) {
    const fog = getFogState(campaignId, mapId);
    const id = stroke.id || newStrokeId();
    const base = {
      id,
      seq: stroke.seq || nextSeq(fog),
      mode: stroke.mode === "hide" ? "hide" : "reveal"
    };
    const entry =
      stroke.shape === "rect" && Array.isArray(stroke.rect) && stroke.rect.length >= 4
        ? { ...base, shape: "rect", rect: stroke.rect.map(Number) }
        : {
            ...base,
            radius: Number(stroke.radius) || 0.025,
            points: stroke.points || []
          };
    const next = {
      enabled: true,
      revealedAll: false,
      revision: (fog.revision || 0) + 1,
      strokes: { [id]: entry }
    };
    patchFog(campaignId, mapId, next);
    return id;
  }

  function undoLastStroke(campaignId, mapId) {
    const fog = getFogState(campaignId, mapId);
    const list = strokeList(fog);
    if (!list.length) return false;
    const last = list[list.length - 1];
    patchFog(campaignId, mapId, {
      revision: (fog.revision || 0) + 1,
      strokes: { [last.id]: null }
    });
    return true;
  }

  function clearFog(campaignId, mapId) {
    patchFog(campaignId, mapId, {
      enabled: true,
      revealedAll: false,
      revision: (getFogState(campaignId, mapId).revision || 0) + 1,
      strokes: {}
    });
  }

  function revealAll(campaignId, mapId) {
    patchFog(campaignId, mapId, {
      enabled: true,
      revealedAll: true,
      revision: (getFogState(campaignId, mapId).revision || 0) + 1
    });
  }

  function setEnabled(campaignId, mapId, enabled) {
    const fog = getFogState(campaignId, mapId);
    patchFog(campaignId, mapId, {
      enabled: Boolean(enabled),
      revision: (fog.revision || 0) + 1
    });
  }

  function bindDm(ctx) {
    const {
      campaignId,
      mapWorld,
      mapImage,
      mapViewport,
      getActiveMapId,
      getActiveMap,
      isFogToolActive,
      getFogMode,
      getFogTool,
      getBrushRadius,
      shouldSnapSelectToGrid
    } = ctx;

    function activeMapId() {
      return getActiveMapId?.() || null;
    }

    function strokeMode() {
      return getFogMode?.() === "hide" ? "hide" : "reveal";
    }

    function isSelectTool() {
      return getFogTool?.() === "select";
    }

    function canPaint(e) {
      if (!isFogToolActive?.()) return false;
      if (e.target.closest?.(".map-pin, .map-grid-token, .map-token, .map-tool-btn")) return false;
      return true;
    }

    function previewRectStroke(startNorm, endNorm) {
      const map = getActiveMap?.() || null;
      const rect = normRectFromDrag(startNorm, endNorm, map, Boolean(shouldSnapSelectToGrid?.()));
      if (!rect) return null;
      return {
        id: newStrokeId(),
        shape: "rect",
        mode: strokeMode(),
        rect
      };
    }

    function rectLargeEnough(rect) {
      if (!Array.isArray(rect) || rect.length < 4) return false;
      return Math.abs(rect[2] - rect[0]) >= 0.003 && Math.abs(rect[3] - rect[1]) >= 0.003;
    }

    mapViewport?.addEventListener(
      "pointerdown",
      (e) => {
        if (!canPaint(e)) return;
        const mapId = activeMapId();
        if (!mapId) return;
        e.preventDefault();
        e.stopPropagation();
        const norm = clientToNorm(e.clientX, e.clientY, mapWorld, mapImage, getActiveMap?.());
        if (!norm) return;
        mapViewport.setPointerCapture(e.pointerId);
        if (isSelectTool()) {
          rectDrag = { startNorm: norm };
          currentStroke = previewRectStroke(norm, norm);
          refresh(campaignId, mapId, mapWorld, { dm: true, previewStroke: currentStroke });
          return;
        }
        painting = true;
        lastNorm = norm;
        currentStroke = {
          id: newStrokeId(),
          mode: strokeMode(),
          radius: getBrushRadius?.() || BRUSH_PRESETS[1],
          points: [[norm.x, norm.y]]
        };
        refresh(campaignId, mapId, mapWorld, { dm: true, previewStroke: currentStroke });
      },
      true
    );

    mapViewport?.addEventListener(
      "pointermove",
      (e) => {
        const mapId = activeMapId();
        if (!mapId) return;
        if (rectDrag) {
          e.preventDefault();
          const norm = clientToNorm(e.clientX, e.clientY, mapWorld, mapImage, getActiveMap?.());
          if (!norm) return;
          currentStroke = previewRectStroke(rectDrag.startNorm, norm);
          refresh(campaignId, mapId, mapWorld, { dm: true, previewStroke: currentStroke });
          return;
        }
        if (!painting || !currentStroke) return;
        e.preventDefault();
        const norm = clientToNorm(e.clientX, e.clientY, mapWorld, mapImage, getActiveMap?.());
        if (!norm) return;
        if (lastNorm && Math.hypot(norm.x - lastNorm.x, norm.y - lastNorm.y) < 0.002) return;
        lastNorm = norm;
        currentStroke.points.push([norm.x, norm.y]);
        refresh(campaignId, mapId, mapWorld, { dm: true, previewStroke: currentStroke });
      },
      true
    );

    function endPaint(e) {
      const mapId = activeMapId();
      if (rectDrag) {
        rectDrag = null;
        try {
          mapViewport?.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        const stroke = currentStroke;
        currentStroke = null;
        if (mapId && stroke?.shape === "rect" && rectLargeEnough(stroke.rect)) {
          commitStroke(campaignId, mapId, stroke);
        }
        if (mapId) refresh(campaignId, mapId, mapWorld, { dm: true });
        return;
      }
      if (!painting || !currentStroke) return;
      painting = false;
      try {
        mapViewport?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (mapId && currentStroke.points.length) {
        commitStroke(campaignId, mapId, currentStroke);
      }
      currentStroke = null;
      lastNorm = null;
      if (mapId) refresh(campaignId, mapId, mapWorld, { dm: true });
    }

    mapViewport?.addEventListener("pointerup", endPaint, true);
    mapViewport?.addEventListener("pointercancel", endPaint, true);
  }

  return {
    BRUSH_PRESETS,
    DM_FOG_ALPHA,
    PLAYER_FOG_ALPHA,
    emptyFogMap,
    getFogState,
    strokeList,
    patchFog,
    ensureLayer,
    refresh,
    commitStroke,
    undoLastStroke,
    clearFog,
    revealAll,
    setEnabled,
    bindDm,
    render,
    isPointHidden,
    isPercentHidden,
    filterVisibleTokens,
    pointInStroke,
    pointInRect,
    normRectFromDrag
  };
})();
