/**
 * Player Map tab — full-bleed map from PC token location, fog, pan/zoom. Polls player-safe API.
 */
window.PlayerMapView = (function () {
  "use strict";

  const POLL_MS = 1500;
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

  function worldToPercent(wx, wy, view) {
    if (!view?.grid || !view.widthPx || !view.heightPx) return null;
    const ppg = Number(view.grid.pixelsPerGrid) || 1;
    const ox = Number(view.grid.origin?.x) || 0;
    const oy = Number(view.grid.origin?.y) || 0;
    const px = (Number(wx) - ox) * ppg;
    const py = (Number(wy) - oy) * ppg;
    return { x: (px / view.widthPx) * 100, y: (py / view.heightPx) * 100 };
  }

  function tokenPosition(view) {
    const t = view.token;
    if (!t) return null;
    if (t.percent) return t.percent;
    if (t.world) return worldToPercent(t.world.x, t.world.y, view);
    return null;
  }

  function applyTransform() {
    const world = root?.querySelector(".player-map-world");
    if (!world) return;
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  }

  function bindPanZoom() {
    const viewport = root?.querySelector(".player-map-viewport");
    const world = root?.querySelector(".player-map-world");
    if (!viewport || !world) return;

    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const wx = (mx - panX) / zoom;
        const wy = (my - panY) / zoom;
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        zoom = Math.min(4, Math.max(1, zoom * factor));
        if (zoom <= 1.01) {
          zoom = 1;
          panX = 0;
          panY = 0;
        } else {
          panX = mx - wx * zoom;
          panY = my - wy * zoom;
        }
        applyTransform();
      },
      { passive: false }
    );

    viewport.addEventListener("pointerdown", (e) => {
      if (zoom <= 1.01) return;
      dragging = true;
      dragStart = { x: e.clientX - panX, y: e.clientY - panY };
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!dragging || !dragStart) return;
      panX = e.clientX - dragStart.x;
      panY = e.clientY - dragStart.y;
      applyTransform();
    });
    viewport.addEventListener("pointerup", () => {
      dragging = false;
      dragStart = null;
    });
    viewport.addEventListener("pointercancel", () => {
      dragging = false;
      dragStart = null;
    });
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
    const token = root.querySelector(".player-map-token");
    const fogCanvas = root.querySelector(".player-map-fog");
    const title = root.querySelector(".player-map-title");

    if (title) title.textContent = view.mapName || view.mapId || "Map";
    if (img && view.imageUrl && img.getAttribute("src") !== view.imageUrl) {
      img.src = view.imageUrl;
    }

    const pos = tokenPosition(view);
    if (token && pos) {
      token.hidden = false;
      token.style.left = `${pos.x}%`;
      token.style.top = `${pos.y}%`;
      const inner = token.querySelector(".player-map-token__inner");
      if (inner) {
        if (view.token?.imageUrl) {
          inner.innerHTML = `<img src="${view.token.imageUrl}" alt="" draggable="false">`;
        } else {
          inner.textContent = (view.token?.label || "?").slice(0, 2);
        }
      }
      token.title = view.token?.label || "";
    } else if (token) {
      token.hidden = true;
    }

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
      zoom = 1;
      panX = 0;
      panY = 0;
      lastMapId = view.mapId;
      applyTransform();
    }
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
    zoom = 1;
    panX = 0;
    panY = 0;
    container.innerHTML = `
      <div class="player-map-root">
        <p class="player-map-empty">Loading map…</p>
        <div class="player-map-stage" hidden>
          <p class="player-map-title"></p>
          <div class="player-map-viewport">
            <div class="player-map-world">
              <img class="player-map-image" alt="" draggable="false">
              <canvas class="player-map-fog" aria-hidden="true"></canvas>
              <div class="player-map-token" hidden>
                <span class="player-map-token__inner"></span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    root = container.querySelector(".player-map-root");
    bindPanZoom();
    startPoll();
  }

  function unmount() {
    stopPoll();
    root = null;
    ctx = null;
    lastRevision = null;
  }

  return { mount, unmount, refresh };
})();
