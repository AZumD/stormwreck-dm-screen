/**
 * Player Map tab — full-bleed map from PC token location, fog, tokens, pan/zoom. Polls player-safe API.
 */
window.PlayerMapView = (function () {
  "use strict";

  const POLL_MS = 1500;
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 1.12;

  let root = null;
  let pollTimer = null;
  let lastRevision = null;
  let lastMapId = null;
  let ctx = null;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let dragStart = null;
  let pinchStart = null;

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function worldToPercent(wx, wy, view) {
    if (!view?.grid || !view.widthPx || !view.heightPx) return null;
    const ppg = Number(view.grid.pixelsPerGrid) || 1;
    const ox = Number(view.grid.origin?.x) || 0;
    const oy = Number(view.grid.origin?.y) || 0;
    const px = (Number(wx) - ox) * ppg;
    const py = (Number(wy) - oy) * ppg;
    return { x: (px / view.widthPx) * 100, y: (py / view.heightPx) * 100 };
  }

  function tokenPosition(token, view) {
    if (!token) return null;
    if (token.percent) return token.percent;
    if (token.world) return worldToPercent(token.world.x, token.world.y, view);
    return null;
  }

  function collectTokens(view) {
    if (Array.isArray(view.tokens) && view.tokens.length) return view.tokens;
    if (view.token) {
      return [
        {
          ...view.token,
          id: view.token.id || "self",
          kind: view.token.kind || "pc",
          isSelf: true
        }
      ];
    }
    return [];
  }

  function tokenSpan(token, view) {
    const cells = Math.max(1, Number(token.gridCells) || 1);
    if (token.spanW != null && token.spanH != null) {
      return { w: token.spanW, h: token.spanH, cells };
    }
    if (view.calibrated && view.grid) {
      const sx = Number(view.grid.sizeX) || 1;
      const sy = Number(view.grid.sizeY) || 1;
      return { w: (cells / sx) * 100, h: (cells / sy) * 100, cells };
    }
    return null;
  }

  function tokenStyle(token, view) {
    const pos = tokenPosition(token, view);
    if (!pos) return null;
    const span = tokenSpan(token, view);
    if (span) {
      const w = span.w;
      const h = span.h;
      return {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${w}%`,
        height: `${h}%`,
        margin: `calc(-${h / 2}% 0 0 calc(-${w / 2}%)`
      };
    }
    return {
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      transform: "translate(-50%, -50%)"
    };
  }

  function applyTransform() {
    const world = root?.querySelector(".player-map-world");
    if (!world) return;
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    world.classList.toggle("is-zoomed", zoom > 1.01);
  }

  function resetView() {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  function zoomAt(nextZoom, clientX, clientY) {
    const viewport = root?.querySelector(".player-map-viewport");
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const mx = clientX != null ? clientX - rect.left : rect.width / 2;
    const my = clientY != null ? clientY - rect.top : rect.height / 2;
    const wx = (mx - panX) / zoom;
    const wy = (my - panY) / zoom;
    zoom = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
    if (zoom <= ZOOM_MIN + 0.001) {
      zoom = 1;
      panX = 0;
      panY = 0;
    } else {
      panX = mx - wx * zoom;
      panY = my - wy * zoom;
    }
    applyTransform();
  }

  function syncMapAspect(img) {
    const world = root?.querySelector(".player-map-world");
    if (!world || !img) return;
    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;
    if (w > 0 && h > 0) {
      world.style.setProperty("--map-aspect", String(w / h));
    } else {
      world.style.removeProperty("--map-aspect");
    }
  }

  function bindPanZoom() {
    const viewport = root?.querySelector(".player-map-viewport");
    if (!viewport) return;

    const activePointers = new Map();

    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
        zoomAt(zoom * factor, e.clientX, e.clientY);
      },
      { passive: false }
    );

    viewport.addEventListener("pointerdown", (e) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 2) {
        const pts = [...activePointers.values()];
        pinchStart = {
          distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
          zoom,
          panX,
          panY,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2
        };
        dragging = false;
        dragStart = null;
        return;
      }

      if (zoom <= 1.01 || e.button !== 0) return;
      dragging = true;
      dragStart = { x: e.clientX - panX, y: e.clientY - panY };
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (pinchStart && activePointers.size >= 2) {
        const pts = [...activePointers.values()];
        if (pts.length < 2) return;
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (!dist || !pinchStart.distance) return;
        const rect = viewport.getBoundingClientRect();
        const mx = pinchStart.midX - rect.left;
        const my = pinchStart.midY - rect.top;
        const wx = (mx - pinchStart.panX) / pinchStart.zoom;
        const wy = (my - pinchStart.panY) / pinchStart.zoom;
        zoom = clamp(pinchStart.zoom * (dist / pinchStart.distance), ZOOM_MIN, ZOOM_MAX);
        if (zoom <= ZOOM_MIN + 0.001) {
          zoom = 1;
          panX = 0;
          panY = 0;
        } else {
          panX = mx - wx * zoom;
          panY = my - wy * zoom;
        }
        applyTransform();
        return;
      }

      if (!dragging || !dragStart) return;
      panX = e.clientX - dragStart.x;
      panY = e.clientY - dragStart.y;
      applyTransform();
    });

    function endPointer(e) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchStart = null;
      dragging = false;
      dragStart = null;
    }

    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
  }

  function bindZoomChrome() {
    root?.querySelector(".player-map-zoom-out")?.addEventListener("click", () => {
      const viewport = root?.querySelector(".player-map-viewport");
      const rect = viewport?.getBoundingClientRect();
      zoomAt(zoom / ZOOM_STEP, rect ? rect.left + rect.width / 2 : null, rect ? rect.top + rect.height / 2 : null);
    });
    root?.querySelector(".player-map-zoom-in")?.addEventListener("click", () => {
      const viewport = root?.querySelector(".player-map-viewport");
      const rect = viewport?.getBoundingClientRect();
      zoomAt(zoom * ZOOM_STEP, rect ? rect.left + rect.width / 2 : null, rect ? rect.top + rect.height / 2 : null);
    });
    root?.querySelector(".player-map-fit-btn")?.addEventListener("click", resetView);
  }

  function renderFog(canvas, fog) {
    if (!canvas || !window.MapFog) return;
    const fake = {
      enabled: Boolean(fog?.enabled),
      revealedAll: Boolean(fog?.revealedAll),
      strokes: {}
    };
    (fog?.strokes || []).forEach((s) => {
      if (s?.id) fake.strokes[s.id] = s;
    });
    MapFog.render(canvas, fake, { dm: false });
  }

  function renderTokens(view) {
    const layer = root?.querySelector(".player-map-tokens");
    if (!layer) return;
    let tokens = collectTokens(view);
    if (window.MapFog?.filterVisibleTokens) {
      tokens = MapFog.filterVisibleTokens(tokens, view.fog);
    }
    layer.innerHTML = tokens
      .map((token) => {
        const style = tokenStyle(token, view);
        if (!style) return "";
        const kind = token.kind || "pc";
        const selfClass = token.isSelf ? " player-map-token--self" : "";
        const span = tokenSpan(token, view);
        const hasImg = Boolean(token.imageUrl);
        const roundClass = span && span.cells === 1 && !hasImg ? " player-map-token--round" : "";
        const imgClass = hasImg ? " player-map-token--has-img" : "";
        const styleStr = Object.entries(style)
          .map(([k, v]) => `${k}:${v}`)
          .join(";");
        const label = token.label || "?";
        const fallback = token.fallbackUrl && token.fallbackUrl !== token.imageUrl ? escapeAttr(token.fallbackUrl) : "";
        const onerr = fallback ? ` onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback='';}else{this.remove();}"` : ` onerror="this.remove()"`;
        const inner = token.imageUrl
          ? `<img class="player-map-token__img" src="${escapeAttr(token.imageUrl)}"${fallback ? ` data-fallback="${fallback}"` : ""} alt="" draggable="false"${onerr}>`
          : `<span class="player-map-token__label">${escapeHtml(label.slice(0, 2))}</span>`;
        return `<div class="player-map-token player-map-token--${kind}${selfClass}${roundClass}${imgClass}" style="${styleStr}" title="${escapeAttr(label)}">${inner}</div>`;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  function renderView(view) {
    if (!root) return;
    const empty = root.querySelector(".player-map-empty");
    const stage = root.querySelector(".player-map-stage");
    if (!view?.available) {
      if (empty) {
        empty.hidden = false;
        empty.textContent = "No map available.";
      }
      if (stage) stage.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (stage) stage.hidden = false;

    const img = root.querySelector(".player-map-image");
    const world = root.querySelector(".player-map-world");
    const fogCanvas = root.querySelector(".player-map-fog");
    const title = root.querySelector(".player-map-title");

    if (title) title.textContent = view.mapName || view.mapId || "Map";
    if (img && view.imageUrl) {
      if (img.getAttribute("src") !== view.imageUrl) {
        img.onload = () => syncMapAspect(img);
        img.src = view.imageUrl;
      } else if (img.complete) {
        syncMapAspect(img);
      }
    }

    renderTokens(view);

    if (fogCanvas && world) {
      const w = world.clientWidth || 1;
      const h = world.clientHeight || 1;
      if (fogCanvas.width !== w || fogCanvas.height !== h) {
        fogCanvas.width = w;
        fogCanvas.height = h;
      }
      renderFog(fogCanvas, view.fog);
      fogCanvas.classList.toggle(
        "player-map-fog--active",
        Boolean(view.fog?.enabled) && !view.fog?.revealedAll
      );
    }

    if (view.mapId !== lastMapId) {
      resetView();
      lastMapId = view.mapId;
    }
    applyTransform();
  }

  async function refresh() {
    if (!ctx?.api || !ctx.campaignId || !ctx.characterId) return;
    try {
      const data = await ctx.api.mapView(ctx.campaignId, ctx.characterId);
      const view = data?.view;
      if (!view) return;
      if (view.revision === lastRevision) return;
      lastRevision = view.revision;
      renderView(view);
    } catch (err) {
      console.warn("player map refresh failed", err);
    }
  }

  function startPoll() {
    stopPoll();
    refresh();
    pollTimer = setInterval(refresh, POLL_MS);
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function mount(container, options) {
    unmount();
    ctx = options || {};
    lastRevision = null;
    lastMapId = null;
    zoom = 1;
    panX = 0;
    panY = 0;
    container.innerHTML = `
      <div class="player-map-root">
        <p class="player-map-empty">Loading map…</p>
        <div class="player-map-stage" hidden>
          <div class="player-map-toolbar">
            <p class="player-map-title"></p>
            <div class="player-map-toolbar__actions">
              <button type="button" class="player-map-fit-btn" title="Reset view">Fit</button>
              <button type="button" class="player-map-zoom-out" title="Zoom out">−</button>
              <button type="button" class="player-map-zoom-in" title="Zoom in">+</button>
            </div>
          </div>
          <div class="player-map-viewport">
            <div class="player-map-world">
              <img class="player-map-image" alt="" draggable="false">
              <canvas class="player-map-fog" aria-hidden="true"></canvas>
              <div class="player-map-tokens"></div>
            </div>
          </div>
        </div>
      </div>`;
    root = container.querySelector(".player-map-root");
    bindPanZoom();
    bindZoomChrome();
    startPoll();
  }

  function unmount() {
    stopPoll();
    root = null;
    ctx = null;
    lastRevision = null;
    lastMapId = null;
  }

  return { mount, unmount, refresh };
})();
