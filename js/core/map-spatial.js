/**
 * Calibrated / UVTT map helpers for MapPanel (measure, grid, tokens, import).
 * DM spatial aid — not a full VTT combat UI.
 */
window.MapSpatial = (function () {
  "use strict";

  function escape(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function newId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  async function loadCalibratedMaps(campaignId) {
    if (!window.LocalApiClient?.isAvailable?.()) return [];
    try {
      return await LocalApiClient.listCampaignMaps(campaignId);
    } catch (err) {
      console.warn("listCampaignMaps failed", err);
      return [];
    }
  }

  function summaryToMapDef(summary) {
    return {
      id: summary.id,
      title: summary.name || summary.id,
      kind: summary.kind || "uvtt",
      sourceFormat: summary.sourceFormat,
      image: summary.imageUrl,
      imageUrl: summary.imageUrl,
      widthPx: summary.widthPx,
      heightPx: summary.heightPx,
      grid: summary.grid,
      scale: summary.scale,
      display: summary.display,
      import: summary.import,
      pins: [],
      calibrated: true
    };
  }

  function attachChrome(panelBody) {
    if (!panelBody || document.getElementById("map-spatial-chrome")) return;
    const chrome = document.createElement("div");
    chrome.id = "map-spatial-chrome";
    chrome.className = "map-spatial-chrome";
    chrome.innerHTML = `
      <div class="map-spatial-row">
        <label class="map-uvtt-import btn-like">
          Import UVTT
          <input type="file" id="map-uvtt-file" accept=".dd2vtt,.uvtt,application/json" hidden>
        </label>
        <span id="map-kind-badge" class="map-kind-badge" hidden></span>
      </div>
      <p id="map-spatial-meta" class="map-spatial-meta" hidden></p>
      <div id="map-calibrated-tools" class="map-calibrated-tools" hidden>
        <label class="map-tool-check"><input type="checkbox" id="map-show-grid"> Grid</label>
        <label class="map-tool-check"><input type="checkbox" id="map-snap-measure"> Snap measure</label>
        <button type="button" class="map-tool-btn" id="map-measure-btn" aria-pressed="false">Measure</button>
        <button type="button" class="map-tool-btn" id="map-add-token-btn">+ Token</button>
        <label class="map-scale-label">ft/grid
          <input type="number" id="map-scale-input" min="0.1" step="0.5" value="5">
        </label>
      </div>
      <p id="map-measure-readout" class="map-measure-readout" hidden></p>
      <p id="map-token-distance" class="map-token-distance" hidden></p>
    `;
    const mapSelect = document.getElementById("map-select");
    if (mapSelect && mapSelect.parentNode) {
      mapSelect.parentNode.insertBefore(chrome, mapSelect.nextSibling);
    } else {
      panelBody.insertBefore(chrome, panelBody.firstChild);
    }
  }

  function ensureLayers(mapWorld) {
    if (!mapWorld) return {};
    let grid = document.getElementById("map-grid-overlay");
    if (!grid) {
      grid = document.createElement("div");
      grid.id = "map-grid-overlay";
      grid.className = "map-grid-overlay";
      grid.setAttribute("aria-hidden", "true");
      mapWorld.appendChild(grid);
    }
    let measure = document.getElementById("map-measure-layer");
    if (!measure) {
      measure = document.createElement("svg");
      measure.id = "map-measure-layer";
      measure.className = "map-measure-layer";
      measure.setAttribute("aria-hidden", "true");
      mapWorld.appendChild(measure);
    }
    let tokens = document.getElementById("map-tokens");
    if (!tokens) {
      tokens = document.createElement("div");
      tokens.id = "map-tokens";
      tokens.className = "map-tokens";
      mapWorld.appendChild(tokens);
    }
    return { grid, measure, tokens };
  }

  function bind(ctx) {
    const {
      campaignId,
      mapWorld,
      mapImage,
      mapViewport,
      getActiveMapId,
      getMaps,
      onMapsChanged,
      refreshPins
    } = ctx;

    attachChrome(document.querySelector(".map-panel__body"));
    const layers = ensureLayers(mapWorld);

    let measuring = false;
    let measureStart = null;
    let selectedTokenIds = [];
    let fullMapCache = {};

    const els = {
      file: document.getElementById("map-uvtt-file"),
      badge: document.getElementById("map-kind-badge"),
      meta: document.getElementById("map-spatial-meta"),
      tools: document.getElementById("map-calibrated-tools"),
      showGrid: document.getElementById("map-show-grid"),
      snap: document.getElementById("map-snap-measure"),
      measureBtn: document.getElementById("map-measure-btn"),
      addToken: document.getElementById("map-add-token-btn"),
      scale: document.getElementById("map-scale-input"),
      measureOut: document.getElementById("map-measure-readout"),
      tokenDist: document.getElementById("map-token-distance")
    };

    function activeMap() {
      return getMaps()?.[getActiveMapId()] || null;
    }

    function isCalibrated(map) {
      return Boolean(map && (map.calibrated || map.kind === "uvtt" || map.kind === "calibrated") && map.grid);
    }

    async function ensureFull(mapId) {
      if (fullMapCache[mapId]) return fullMapCache[mapId];
      if (!window.LocalApiClient?.isAvailable?.()) return null;
      try {
        const map = await LocalApiClient.getCampaignMap(campaignId, mapId);
        fullMapCache[mapId] = map;
        return map;
      } catch {
        return null;
      }
    }

    function loadTokens() {
      const all = window.CampaignMapState?.get(campaignId)?.tokens;
      return all && typeof all === "object" ? all : {};
    }

    function saveTokens(data) {
      if (window.CampaignMapState) CampaignMapState.patch(campaignId, { tokens: data });
    }

    function tokensForMap(mapId) {
      const list = loadTokens()[mapId];
      return Array.isArray(list) ? list : [];
    }

    function setTokensForMap(mapId, list) {
      const all = { ...loadTokens(), [mapId]: list };
      saveTokens(all);
    }

    function clientToWorld(clientX, clientY, map) {
      if (!mapImage || !map?.grid || !window.MapDistance) return null;
      const rect = mapImage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const px = ((clientX - rect.left) / rect.width) * (map.widthPx || rect.width);
      const py = ((clientY - rect.top) / rect.height) * (map.heightPx || rect.height);
      return MapDistance.pixelToWorld(px, py, map.grid);
    }

    function worldToStyle(wx, wy, map) {
      const pct = window.MapDistance?.worldToPercent(wx, wy, map);
      if (!pct) return { left: "0%", top: "0%" };
      return { left: `${pct.x}%`, top: `${pct.y}%` };
    }

    function renderGrid(map) {
      const el = layers.grid;
      if (!el) return;
      if (!isCalibrated(map) || !map.display?.showGrid) {
        el.innerHTML = "";
        el.hidden = true;
        return;
      }
      el.hidden = false;
      const sx = Number(map.grid.sizeX) || 1;
      const sy = Number(map.grid.sizeY) || 1;
      const lines = [];
      for (let i = 0; i <= Math.ceil(sx); i++) {
        const x = (i / sx) * 100;
        lines.push(`<span class="map-grid-line map-grid-line--v" style="left:${x}%"></span>`);
      }
      for (let j = 0; j <= Math.ceil(sy); j++) {
        const y = (j / sy) * 100;
        lines.push(`<span class="map-grid-line map-grid-line--h" style="top:${y}%"></span>`);
      }
      el.innerHTML = lines.join("");
    }

    function updateTokenDistance(map) {
      if (!els.tokenDist) return;
      if (!isCalibrated(map) || selectedTokenIds.length !== 2) {
        els.tokenDist.hidden = true;
        return;
      }
      const toks = tokensForMap(map.id);
      const a = toks.find((t) => t.id === selectedTokenIds[0]);
      const b = toks.find((t) => t.id === selectedTokenIds[1]);
      if (!a || !b || !window.MapDistance) {
        els.tokenDist.hidden = true;
        return;
      }
      const d = MapDistance.distanceBetween(a, b, map.scale || { distancePerGrid: 5, unit: "ft" }, {
        snap: Boolean(els.snap?.checked)
      });
      if (!d) {
        els.tokenDist.hidden = true;
        return;
      }
      els.tokenDist.hidden = false;
      els.tokenDist.innerHTML = `<strong>${escape(a.label || a.id)}</strong><span class="map-token-dist-arrow">↕ ${escape(d.label)}</span><strong>${escape(b.label || b.id)}</strong>`;
    }

    function renderTokens(map) {
      const el = layers.tokens;
      if (!el) return;
      if (!isCalibrated(map)) {
        el.innerHTML = "";
        return;
      }
      const list = tokensForMap(map.id).filter((t) => t.visible !== false);
      el.innerHTML = list
        .map((t) => {
          const pos = worldToStyle(t.x, t.y, map);
          const sel = selectedTokenIds.includes(t.id) ? " is-selected" : "";
          const size = Math.max(0.5, Number(t.size) || 1);
          return `<button type="button" class="map-token${sel}" data-token-id="${escape(t.id)}"
            style="left:${pos.left};top:${pos.top};--token-size:${size}"
            title="${escape(t.label || t.id)}">${escape((t.label || "?").slice(0, 2))}</button>`;
        })
        .join("");

      el.querySelectorAll(".map-token").forEach((btn) => {
        const id = btn.getAttribute("data-token-id");
        let dragging = false;
        let moved = false;
        btn.addEventListener("pointerdown", (e) => {
          e.stopPropagation();
          e.preventDefault();
          dragging = true;
          moved = false;
          btn.setPointerCapture(e.pointerId);
        });
        btn.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          moved = true;
          const world = clientToWorld(e.clientX, e.clientY, map);
          if (!world) return;
          const next = tokensForMap(map.id).map((t) =>
            t.id === id ? { ...t, x: world.x, y: world.y } : t
          );
          setTokensForMap(map.id, next);
          const pos = worldToStyle(world.x, world.y, map);
          btn.style.left = pos.left;
          btn.style.top = pos.top;
        });
        btn.addEventListener("pointerup", (e) => {
          if (!dragging) return;
          dragging = false;
          try {
            btn.releasePointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          if (!moved) {
            if (e.shiftKey || selectedTokenIds.length === 1) {
              if (selectedTokenIds.includes(id)) {
                selectedTokenIds = selectedTokenIds.filter((x) => x !== id);
              } else {
                selectedTokenIds = [...selectedTokenIds.slice(-1), id].slice(-2);
              }
            } else {
              selectedTokenIds = [id];
            }
            renderTokens(map);
            updateTokenDistance(map);
          } else {
            updateTokenDistance(map);
          }
        });
        btn.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          if (!window.confirm("Remove this token?")) return;
          setTokensForMap(
            map.id,
            tokensForMap(map.id).filter((t) => t.id !== id)
          );
          selectedTokenIds = selectedTokenIds.filter((x) => x !== id);
          renderTokens(map);
          updateTokenDistance(map);
        });
      });
      updateTokenDistance(map);
    }

    async function refreshChrome() {
      const map = activeMap();
      if (!map) return;
      let detail = map;
      if (map.calibrated) {
        const full = await ensureFull(map.id);
        if (full) {
          detail = { ...map, ...full, calibrated: true, title: full.name || map.title };
          Object.assign(map, {
            grid: full.grid,
            scale: full.scale,
            display: full.display,
            widthPx: full.widthPx,
            heightPx: full.heightPx,
            geometry: full.geometry
          });
        }
      }

      const kind = map.calibrated
        ? map.kind === "calibrated"
          ? "Calibrated"
          : "Universal VTT"
        : map.fromCatalogue
          ? "Image map"
          : "Image map";
      if (els.badge) {
        els.badge.hidden = false;
        els.badge.textContent = kind;
        els.badge.dataset.kind = map.kind || "image";
      }

      if (els.meta) {
        if (isCalibrated(detail) && detail.grid) {
          const st = detail.import?.stats || {};
          els.meta.hidden = false;
          els.meta.textContent = [
            `${detail.grid.sizeX} × ${detail.grid.sizeY} grid`,
            `${detail.grid.pixelsPerGrid} px/grid`,
            `Scale: ${detail.scale?.distancePerGrid ?? 5} ${detail.scale?.unit || "ft"}/grid`,
            st.walls != null ? `${st.walls} LOS` : null,
            st.portals != null ? `${st.portals} portals` : null,
            st.lights != null ? `${st.lights} lights` : null
          ]
            .filter(Boolean)
            .join(" · ");
        } else {
          els.meta.hidden = true;
        }
      }

      if (els.tools) {
        els.tools.hidden = !isCalibrated(detail);
      }
      if (els.showGrid && detail.display) {
        els.showGrid.checked = Boolean(detail.display.showGrid);
      }
      if (els.snap && detail.display) {
        els.snap.checked = Boolean(detail.display.snapToGrid);
      }
      if (els.scale && detail.scale) {
        els.scale.value = detail.scale.distancePerGrid ?? 5;
      }

      renderGrid(detail);
      renderTokens(detail);
      if (els.measureOut) els.measureOut.hidden = true;
      if (layers.measure) layers.measure.innerHTML = "";
    }

    if (els.file) {
      els.file.addEventListener("change", async () => {
        const file = els.file.files && els.file.files[0];
        els.file.value = "";
        if (!file || !window.LocalApiClient?.importUvttMap) return;
        const sizeMb = file.size / (1024 * 1024);
        try {
          if (els.importBtn) {
            els.importBtn.setAttribute("aria-busy", "true");
            els.importBtn.dataset.label = els.importBtn.dataset.label || els.importBtn.textContent;
            els.importBtn.textContent =
              sizeMb >= 1 ? `Importing (${sizeMb.toFixed(1)} MB)…` : "Importing…";
          }
          const text = await file.text();
          const result = await LocalApiClient.importUvttMap(campaignId, {
            text,
            filename: file.name
          });
          fullMapCache[result.map.id] = result.map;
          await onMapsChanged?.(result.map.id);
          window.alert(
            [
              result.map.name,
              `${result.map.grid.sizeX} × ${result.map.grid.sizeY} grid`,
              `${result.map.grid.pixelsPerGrid} px/grid`,
              `Scale: ${result.map.scale.distancePerGrid} ${result.map.scale.unit}/grid`,
              `${result.map.import?.stats?.walls ?? 0} LOS segments`,
              `${result.map.import?.stats?.portals ?? 0} portals`,
              `${result.map.import?.stats?.lights ?? 0} lights`
            ].join("\n")
          );
        } catch (err) {
          const networkFail =
            err?.name === "TypeError" ||
            /failed to fetch|networkerror|load failed/i.test(String(err?.message || err));
          const msg = networkFail
            ? `UVTT import failed to reach the server (${sizeMb.toFixed(1)} MB file). Hard-refresh after updating, confirm npm start is running, and retry.`
            : err.message || "UVTT import failed";
          window.alert(msg);
        } finally {
          if (els.importBtn) {
            els.importBtn.removeAttribute("aria-busy");
            if (els.importBtn.dataset.label) {
              els.importBtn.textContent = els.importBtn.dataset.label;
            }
          }
        }
      });
    }

    async function persistDisplayPatch(partial) {
      const map = activeMap();
      if (!map?.calibrated || !LocalApiClient?.patchCampaignMap) return;
      const patch = {};
      if (partial.display) patch.display = { ...(map.display || {}), ...partial.display };
      if (partial.scale) patch.scale = { ...(map.scale || {}), ...partial.scale };
      try {
        const res = await LocalApiClient.patchCampaignMap(campaignId, map.id, patch);
        fullMapCache[map.id] = res.map;
        Object.assign(map, {
          display: res.map.display,
          scale: res.map.scale
        });
        await refreshChrome();
      } catch (err) {
        console.warn(err);
      }
    }

    els.showGrid?.addEventListener("change", () => {
      persistDisplayPatch({ display: { showGrid: els.showGrid.checked } });
    });
    els.snap?.addEventListener("change", () => {
      persistDisplayPatch({ display: { snapToGrid: els.snap.checked } });
      updateTokenDistance(activeMap());
    });
    els.scale?.addEventListener("change", () => {
      const v = Number(els.scale.value);
      if (!Number.isFinite(v) || v <= 0) return;
      persistDisplayPatch({ scale: { distancePerGrid: v } });
    });

    els.measureBtn?.addEventListener("click", () => {
      measuring = !measuring;
      els.measureBtn.setAttribute("aria-pressed", measuring ? "true" : "false");
      els.measureBtn.classList.toggle("is-active", measuring);
      measureStart = null;
      if (layers.measure) layers.measure.innerHTML = "";
      if (els.measureOut) els.measureOut.hidden = true;
    });

    els.addToken?.addEventListener("click", () => {
      const map = activeMap();
      if (!isCalibrated(map)) return;
      const label = window.prompt("Token label", "Marker");
      if (!label || !label.trim()) return;
      const list = tokensForMap(map.id);
      list.push({
        id: newId("tok"),
        label: label.trim(),
        ref: null,
        x: (Number(map.grid?.sizeX) || 10) / 2,
        y: (Number(map.grid?.sizeY) || 10) / 2,
        size: 1,
        visible: true,
        imageUrl: null
      });
      setTokensForMap(map.id, list);
      renderTokens(map);
    });

    mapViewport?.addEventListener("pointerdown", (e) => {
      if (!measuring) return;
      if (e.target.closest?.(".map-token, .map-pin")) return;
      const map = activeMap();
      if (!isCalibrated(map)) return;
      const world = clientToWorld(e.clientX, e.clientY, map);
      if (!world) return;
      if (!measureStart) {
        measureStart = world;
        return;
      }
      const end = world;
      const d = window.MapDistance?.distanceBetween(measureStart, end, map.scale || {}, {
        snap: Boolean(els.snap?.checked)
      });
      if (d && els.measureOut) {
        els.measureOut.hidden = false;
        els.measureOut.textContent = d.label;
      }
      if (layers.measure && window.MapDistance) {
        const a = MapDistance.worldToPercent(measureStart.x, measureStart.y, map);
        const b = MapDistance.worldToPercent(end.x, end.y, map);
        if (a && b) {
          layers.measure.setAttribute("viewBox", "0 0 100 100");
          layers.measure.innerHTML = `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="map-measure-line" />`;
        }
      }
      measureStart = null;
    });

    return {
      refreshChrome,
      summaryToMapDef,
      loadCalibratedMaps
    };
  }

  return { loadCalibratedMaps, summaryToMapDef, bind, attachChrome, ensureLayers };
})();
