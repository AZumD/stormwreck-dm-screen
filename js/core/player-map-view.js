/**
 * Player Map tab — PC-centered tactical view (limited zoom, no free pan).
 * Fog + tokens from player-safe API; polls for DM moves / map switches.
 */
window.PlayerMapView = (function () {
  "use strict";

  const Cam = window.PlayerMapCamera;
  if (!Cam) {
    throw new Error("PlayerMapCamera must load before PlayerMapView");
  }

  const POLL_MS = 1500;
  const {
    PLAYER_MAP_MIN_ZOOM,
    PLAYER_MAP_DEFAULT_ZOOM,
    PLAYER_MAP_ZOOM_STEP,
    clampZoom,
    computeCenterPan
  } = Cam;

  let root = null;
  let pollTimer = null;
  let resizeObserver = null;
  let lastRevision = null;
  let lastMapId = null;
  let lastSelfKey = null;
  let lastView = null;
  let ctx = null;
  let zoom = PLAYER_MAP_DEFAULT_ZOOM;
  let panX = 0;
  let panY = 0;
  let pinchStart = null;
  let pollStale = false;
  let consecutiveFailures = 0;
  /** Session-level zoom only (no x/y offsets). */
  let sessionZoom = PLAYER_MAP_DEFAULT_ZOOM;

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

  function findSelfToken(view) {
    if (!view?.available) return null;
    if (Array.isArray(view.tokens)) {
      const self = view.tokens.find((t) => t.isSelf && (t.percent || t.world));
      if (self) return self;
    }
    if (view.token?.percent || view.token?.world) {
      return { ...view.token, isSelf: true };
    }
    return null;
  }

  function selfPositionKey(view) {
    const self = findSelfToken(view);
    if (!self) return "";
    const pos = tokenPosition(self, view);
    if (!pos) return "";
    return `${view.mapId || ""}:${pos.x.toFixed(3)},${pos.y.toFixed(3)}`;
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
        transform: "translate(-50%, -50%)"
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
    world.classList.toggle("is-zoomed", zoom > PLAYER_MAP_MIN_ZOOM + 0.01);
  }

  function centerOnSelf(view) {
    if (!view?.available) return false;
    const self = findSelfToken(view);
    if (!self) return false;
    const pos = tokenPosition(self, view);
    if (!pos) return false;
    const viewport = root?.querySelector(".player-map-viewport");
    const world = root?.querySelector(".player-map-world");
    if (!viewport || !world) return false;
    const rect = viewport.getBoundingClientRect();
    const ww = world.offsetWidth || 1;
    const wh = world.offsetHeight || 1;
    if (rect.width < 2 || rect.height < 2 || ww < 2 || wh < 2) return false;
    const next = computeCenterPan(pos, ww, wh, rect.width, rect.height, zoom);
    panX = next.panX;
    panY = next.panY;
    applyTransform();
    return true;
  }

  function setZoomCenteredOnPc(nextZoom) {
    zoom = clampZoom(nextZoom);
    sessionZoom = zoom;
    if (lastView) centerOnSelf(lastView);
    else applyTransform();
  }

  function setStaleBanner(show) {
    pollStale = show;
    const el = root?.querySelector(".player-map-stale");
    if (el) el.hidden = !show;
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

  function bindZoomGestures() {
    const viewport = root?.querySelector(".player-map-viewport");
    if (!viewport) return;

    const activePointers = new Map();

    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? PLAYER_MAP_ZOOM_STEP : 1 / PLAYER_MAP_ZOOM_STEP;
        setZoomCenteredOnPc(zoom * factor);
      },
      { passive: false }
    );

    viewport.addEventListener("pointerdown", (e) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const pts = [...activePointers.values()];
        pinchStart = {
          distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
          zoom
        };
      }
    });

    viewport.addEventListener("pointermove", (e) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (!pinchStart || activePointers.size < 2) return;
      const pts = [...activePointers.values()];
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (!dist || !pinchStart.distance) return;
      setZoomCenteredOnPc(pinchStart.zoom * (dist / pinchStart.distance));
    });

    function endPointer(e) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchStart = null;
    }

    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
  }

  function bindZoomChrome() {
    root?.querySelector(".player-map-zoom-out")?.addEventListener("click", () => {
      setZoomCenteredOnPc(zoom / PLAYER_MAP_ZOOM_STEP);
    });
    root?.querySelector(".player-map-zoom-in")?.addEventListener("click", () => {
      setZoomCenteredOnPc(zoom * PLAYER_MAP_ZOOM_STEP);
    });
  }

  function bindResize() {
    const viewport = root?.querySelector(".player-map-viewport");
    if (!viewport || typeof ResizeObserver === "undefined") return;
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => {
      if (lastView) centerOnSelf(lastView);
    });
    resizeObserver.observe(viewport);
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
        const fallback =
          token.fallbackUrl && token.fallbackUrl !== token.imageUrl ? escapeAttr(token.fallbackUrl) : "";
        const onerr = fallback
          ? ` onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback='';}else{this.remove();}"`
          : ` onerror="this.remove()"`;
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
      lastView = view;
      lastSelfKey = null;
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
        img.onload = () => {
          syncMapAspect(img);
          centerOnSelf(view);
        };
        img.src = view.imageUrl;
      } else if (img.complete) {
        syncMapAspect(img);
      }
    }

    renderTokens(view);

    if (fogCanvas && world) {
      let surface = world.querySelector(".player-map-surface");
      if (!surface) {
        surface = document.createElement("div");
        surface.className = "player-map-surface";
        while (world.firstChild) surface.appendChild(world.firstChild);
        world.appendChild(surface);
      }
      const w = surface.clientWidth || 1;
      const h = surface.clientHeight || 1;
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

    if (view.mapId !== lastMapId) lastMapId = view.mapId;

    zoom = clampZoom(sessionZoom);
    lastView = view;
    lastSelfKey = selfPositionKey(view);
    if (!centerOnSelf(view)) applyTransform();
  }

  async function refresh() {
    if (!ctx?.api || !ctx.campaignId || !ctx.characterId) return;
    try {
      const data = await ctx.api.mapView(ctx.campaignId, ctx.characterId);
      const view = data?.view;
      if (!view) return;
      consecutiveFailures = 0;
      setStaleBanner(false);

      const nextSelfKey = selfPositionKey(view);
      const mapChanged = view.mapId !== lastMapId;
      const selfMoved = Boolean(nextSelfKey) && nextSelfKey !== lastSelfKey;
      const revisionChanged = view.revision !== lastRevision;

      if (!revisionChanged && !selfMoved && !mapChanged && lastView?.available) {
        return;
      }

      lastRevision = view.revision;
      renderView(view);
    } catch (err) {
      consecutiveFailures += 1;
      console.warn("player map refresh failed", err);
      if (consecutiveFailures >= 1) setStaleBanner(true);
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
    const prevKey = ctx ? `${ctx.campaignId}:${ctx.characterId}` : "";
    const nextKey = options ? `${options.campaignId}:${options.characterId}` : "";
    if (prevKey && prevKey !== nextKey) {
      lastRevision = null;
      lastMapId = null;
      lastSelfKey = null;
    }
    stopPoll();
    ctx = options || {};
    zoom = clampZoom(sessionZoom);
    if (!root) {
      container.innerHTML = `
      <div class="player-map-root">
        <p class="player-map-empty">Loading map…</p>
        <p class="player-map-stale" hidden>Map connection interrupted — retrying…</p>
        <div class="player-map-stage" hidden>
          <div class="player-map-toolbar">
            <p class="player-map-title"></p>
            <div class="player-map-toolbar__actions">
              <button type="button" class="player-map-zoom-out" title="Zoom out">−</button>
              <button type="button" class="player-map-zoom-in" title="Zoom in">+</button>
            </div>
          </div>
          <div class="player-map-viewport">
            <div class="player-map-world">
              <div class="player-map-surface">
                <img class="player-map-image" alt="" draggable="false">
                <canvas class="player-map-fog" aria-hidden="true"></canvas>
                <div class="player-map-tokens"></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
      root = container.querySelector(".player-map-root");
      bindZoomGestures();
      bindZoomChrome();
      bindResize();
    } else if (container && root.parentElement !== container) {
      container.appendChild(root);
    }
    consecutiveFailures = 0;
    setStaleBanner(false);
    startPoll();
  }

  function unmount() {
    sessionZoom = clampZoom(zoom);
    stopPoll();
    ctx = null;
    lastRevision = null;
    consecutiveFailures = 0;
    pollStale = false;
  }

  return { mount, unmount, refresh };
})();
