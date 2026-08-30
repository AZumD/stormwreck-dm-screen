/**
 * Manual fog of war — normalized stroke storage + canvas rendering.
 * Strokes live in CampaignMapState.fog[mapId] (object keyed by stroke id for safe PATCH merge).
 */
window.MapFog = (function () {
  "use strict";

  const BRUSH_PRESETS = [0.012, 0.025, 0.05, 0.09];
  /** DM preview: light overlay so the map stays readable (20% opaque). */
  const DM_FOG_ALPHA = 0.2;
  /** Player view: fully opaque black fog. */
  const PLAYER_FOG_ALPHA = 1;
  let painting = false;
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

  function clientToNorm(clientX, clientY, mapWorld) {
    const rect = mapWorld.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
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
    const fogColor = `rgba(0, 0, 0, ${fogAlpha})`;
    const hideColor = fogColor;

    ctx.fillStyle = fogColor;
    ctx.fillRect(0, 0, w, h);

    strokeList(fog).forEach((stroke) => {
      const r = (Number(stroke.radius) || 0.025) * Math.min(w, h);
      const mode = stroke.mode === "hide" ? "source-over" : "destination-out";
      const color = stroke.mode === "hide" ? hideColor : "rgba(0,0,0,1)";
      (stroke.points || []).forEach((pt) => {
        if (!Array.isArray(pt) || pt.length < 2) return;
        drawDisk(ctx, pt[0] * w, pt[1] * h, r, color, mode);
      });
    });

    if (opts?.previewStroke && opts.previewStroke.points?.length) {
      const stroke = opts.previewStroke;
      const r = (Number(stroke.radius) || 0.025) * Math.min(w, h);
      const mode = stroke.mode === "hide" ? "source-over" : "destination-out";
      const color = stroke.mode === "hide" ? hideColor : "rgba(0,0,0,1)";
      stroke.points.forEach((pt) => {
        drawDisk(ctx, pt[0] * w, pt[1] * h, r, color, mode);
      });
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
    const next = {
      enabled: true,
      revealedAll: false,
      revision: (fog.revision || 0) + 1,
      strokes: {
        [id]: {
          id,
          seq: stroke.seq || nextSeq(fog),
          mode: stroke.mode === "hide" ? "hide" : "reveal",
          radius: Number(stroke.radius) || 0.025,
          points: stroke.points || []
        }
      }
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
    const { campaignId, mapWorld, mapViewport, getActiveMapId, isFogToolActive, getFogMode, getBrushRadius } =
      ctx;

    function activeMapId() {
      return getActiveMapId?.() || null;
    }

    function canPaint(e) {
      if (!isFogToolActive?.()) return false;
      if (e.target.closest?.(".map-pin, .map-grid-token, .map-token, .map-tool-btn")) return false;
      return true;
    }

    mapViewport?.addEventListener(
      "pointerdown",
      (e) => {
        if (!canPaint(e)) return;
        const mapId = activeMapId();
        if (!mapId) return;
        e.preventDefault();
        e.stopPropagation();
        const norm = clientToNorm(e.clientX, e.clientY, mapWorld);
        if (!norm) return;
        painting = true;
        lastNorm = norm;
        currentStroke = {
          id: newStrokeId(),
          mode: getFogMode?.() === "hide" ? "hide" : "reveal",
          radius: getBrushRadius?.() || BRUSH_PRESETS[1],
          points: [[norm.x, norm.y]]
        };
        mapViewport.setPointerCapture(e.pointerId);
        refresh(campaignId, mapId, mapWorld, { dm: true, previewStroke: currentStroke });
      },
      true
    );

    mapViewport?.addEventListener(
      "pointermove",
      (e) => {
        if (!painting || !currentStroke) return;
        const mapId = activeMapId();
        if (!mapId) return;
        e.preventDefault();
        const norm = clientToNorm(e.clientX, e.clientY, mapWorld);
        if (!norm) return;
        if (lastNorm && Math.hypot(norm.x - lastNorm.x, norm.y - lastNorm.y) < 0.002) return;
        lastNorm = norm;
        currentStroke.points.push([norm.x, norm.y]);
        refresh(campaignId, mapId, mapWorld, { dm: true, previewStroke: currentStroke });
      },
      true
    );

    function endPaint(e) {
      if (!painting || !currentStroke) return;
      painting = false;
      try {
        mapViewport?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const mapId = activeMapId();
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
    pointInStroke
  };
})();
