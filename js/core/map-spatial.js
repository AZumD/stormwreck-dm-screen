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

  async function loadCalibratedMaps() {
    /* Legacy campaign-maps API removed — maps come from location catalogue via MapPanel. */
    return [];
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

  /**
   * Prefer static markup in campaign HTML (primary actions + collapsible settings).
   * Falls back to injecting chrome when older pages lack the slots.
   */
  function attachChrome(panelBody) {
    if (document.getElementById("map-measure-btn") && document.getElementById("map-show-grid")) {
      return;
    }
    if (!panelBody || document.getElementById("map-spatial-chrome")) return;

    const settingsBody = document.getElementById("map-settings-body");
    const primary = document.getElementById("map-primary-actions");

    if (!document.getElementById("map-measure-btn") && primary) {
      primary.insertAdjacentHTML(
        "afterbegin",
        `<button type="button" class="map-tool-btn" id="map-measure-btn" aria-pressed="false" hidden>Measure</button>
         <button type="button" class="map-tool-btn" id="map-fog-btn" aria-pressed="false" hidden>Fog</button>
         <button type="button" class="map-tool-btn" id="map-add-token-btn" hidden>+ Token</button>`
      );
    }

    const settingsHtml = `
      <div id="map-spatial-chrome" class="map-spatial-chrome">
        <div class="map-spatial-row">
          <a class="map-uvtt-import btn-like" id="map-uvtt-catalogue-link" href="/location-katalog/index.html">
            Manage UVTT in Location catalogue
          </a>
          <span id="map-kind-badge" class="map-kind-badge" hidden></span>
        </div>
        <p id="map-spatial-meta" class="map-spatial-meta" hidden></p>
        <div id="map-calibrated-tools" class="map-calibrated-tools" hidden>
          <label class="map-tool-check"><input type="checkbox" id="map-show-grid"> Grid</label>
          <label class="map-tool-check"><input type="checkbox" id="map-snap-measure"> Snap measure</label>
          <label class="map-scale-label">ft/grid
            <input type="number" id="map-scale-input" min="0.1" step="0.5" value="5">
          </label>
        </div>
        <div id="map-fog-tools" class="map-fog-tools" hidden>
          <label class="map-tool-check"><input type="checkbox" id="map-fog-enabled"> Fog enabled</label>
          <span class="map-fog-modes">
            <button type="button" class="map-tool-btn map-fog-mode is-active" data-fog-mode="reveal">Reveal</button>
            <button type="button" class="map-tool-btn map-fog-mode" data-fog-mode="hide">Hide</button>
          </span>
          <span class="map-fog-brushes" id="map-fog-brushes"></span>
          <button type="button" class="map-tool-btn" id="map-fog-undo">Undo</button>
          <button type="button" class="map-tool-btn" id="map-fog-clear">Hide all</button>
          <button type="button" class="map-tool-btn" id="map-fog-reveal-all">Reveal all</button>
        </div>
      </div>`;

    if (settingsBody && !document.getElementById("map-spatial-chrome")) {
      settingsBody.insertAdjacentHTML("beforeend", settingsHtml);
    } else if (!document.getElementById("map-spatial-chrome")) {
      const chrome = document.createElement("div");
      chrome.innerHTML = settingsHtml;
      const node = chrome.firstElementChild;
      const mapSelect = document.getElementById("map-select");
      if (mapSelect && mapSelect.parentNode) {
        mapSelect.parentNode.insertBefore(node, mapSelect.nextSibling);
      } else {
        panelBody.insertBefore(node, panelBody.firstChild);
      }
    }

    if (!document.getElementById("map-measure-readout") && panelBody) {
      panelBody.insertAdjacentHTML(
        "beforeend",
        `<p id="map-measure-readout" class="map-measure-readout" hidden></p>
         <p id="map-token-distance" class="map-token-distance" hidden></p>`
      );
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
    let fogging = false;
    let fogMode = "reveal";
    let fogBrush = window.MapFog?.BRUSH_PRESETS?.[1] || 0.025;
    let measureStart = null;
    let selectedTokenIds = [];
    let fullMapCache = {};

    const els = {
      badge: document.getElementById("map-kind-badge"),
      meta: document.getElementById("map-spatial-meta"),
      tools: document.getElementById("map-calibrated-tools"),
      showGrid: document.getElementById("map-show-grid"),
      snap: document.getElementById("map-snap-measure"),
      measureBtn: document.getElementById("map-measure-btn"),
      addToken: document.getElementById("map-add-token-btn"),
      fogBtn: document.getElementById("map-fog-btn"),
      fogTools: document.getElementById("map-fog-tools"),
      fogEnabled: document.getElementById("map-fog-enabled"),
      fogBrushes: document.getElementById("map-fog-brushes"),
      fogUndo: document.getElementById("map-fog-undo"),
      fogClear: document.getElementById("map-fog-clear"),
      fogRevealAll: document.getElementById("map-fog-reveal-all"),
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
      const summary = activeMap();
      const catalogueId =
        summary?.catalogueId ||
        (summary?.id ? `sw-${summary.id}` : null) ||
        mapId;
      if (catalogueId && window.LocalApiClient?.getLocationUvttMap) {
        try {
          const full = await LocalApiClient.getLocationUvttMap(catalogueId);
          if (full) {
            fullMapCache[mapId] = { ...full, id: mapId, name: summary?.title || full.name };
            return fullMapCache[mapId];
          }
        } catch (err) {
          console.warn("location UVTT load failed", err);
        }
      }
      return null;
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

    function tokenTitle(t) {
      const hp =
        t.hpMax != null && t.hpMax !== ""
          ? `${t.hpCurrent ?? "?"}/${t.hpMax}`
          : t.hpCurrent != null && t.hpCurrent !== ""
            ? String(t.hpCurrent)
            : "?";
      if (t.kind === "monster" || t.kind === "npc" || t.kind === "pc") {
        return `${t.label || t.kind} · HP ${hp} · AC ${t.ac ?? "?"}`;
      }
      return t.label || t.id;
    }

    function snapWorld(world, map) {
      if (!world || !map?.grid || !els.snap?.checked) return world;
      return window.MapDistance?.snapWorldToCellCenter?.(world) || world;
    }

    function resolveCombatTokenImages(t) {
      const kind = t.kind === "monster" || t.kind === "npc" || t.kind === "pc" ? t.kind : t.memberType || "npc";
      let entry = null;
      if (t.catalogueId && window.CatalogueStore?.get) {
        entry = CatalogueStore.get(kind, t.catalogueId);
        if (entry && window.CatalogueImages?.hydrate) entry = CatalogueImages.hydrate(kind, entry);
      }
      if (window.MapTokenSize?.resolvePinImageUrls) {
        return MapTokenSize.resolvePinImageUrls(kind, entry, {
          entityId: t.entityId,
          partyId: t.partyId
        });
      }
      const url = t.imageUrl || t.tokenImage || entry?.tokenImage || entry?.portrait || null;
      return { url, fallbackUrl: null };
    }

    function renderGridToken(t, map, pos, sel, extraClass, title, labelHtml) {
      const MTS = window.MapTokenSize;
      const cells =
        Number(t.gridCells) ||
        MTS?.dndSizeToGridCells?.(t.dndSize || t.catalogueSize) ||
        1;
      const span = MTS?.cellSpanPercent?.(cells, map) || { w: 2, h: 2, cells: 1 };
      const style = MTS?.gridTokenStyle?.(pos, span) || `left:${pos.left};top:${pos.top}`;
      const roundClass = span.cells === 1 ? " map-grid-token--round" : "";
      const resolved = resolveCombatTokenImages(t);
      const imgUrl = resolved.url || t.imageUrl || t.tokenImage || null;
      const hasImg = !!imgUrl;
      const inner =
        labelHtml != null
          ? labelHtml
          : hasImg
            ? MTS?.tokenImageHtml?.(imgUrl, t.label || t.id, resolved.fallbackUrl || t.fallbackUrl) ||
              `<img class="map-grid-token__img" src="${escape(imgUrl)}" alt="" loading="lazy" draggable="false" onerror="this.remove()">`
            : `<span class="map-grid-token__label">${escape((t.label || "?").slice(0, 2))}</span>`;
      return `<button type="button" class="map-grid-token${extraClass}${roundClass}${hasImg ? " map-grid-token--has-img" : ""}${sel}" data-token-id="${escape(t.id)}"
            style="${style}"
            title="${escape(title)}" aria-label="${escape(title)}">${inner}</button>`;
    }

    function tokenSpawnPos(map, choice) {
      const mid = {
        x: (Number(map?.grid?.sizeX) || Number(map?.grid?.width) || 10) / 2,
        y: (Number(map?.grid?.sizeY) || Number(map?.grid?.height) || 10) / 2
      };
      if (!choice?.partyId || !map?.id) return mid;
      const partySaved = window.CampaignMapState?.get(campaignId)?.partyPositions || {};
      const saved = partySaved[choice.partyId];
      if (!saved || saved.mapId !== map.id || saved.x == null || saved.y == null) return mid;
      const world = window.MapDistance?.percentToWorld?.(saved.x, saved.y, map);
      return world || mid;
    }

    function ensurePartyPcCombatTokens(map) {
      if (!isCalibrated(map) || !window.PARTY?.length || !window.CombatSheetModal?.buildPcToken) return;
      const partySaved = window.CampaignMapState?.get(campaignId)?.partyPositions || {};
      let list = tokensForMap(map.id);
      let changed = false;

      for (const member of PARTY.filter((m) => m.memberType === "pc" && m.catalogueId)) {
        const saved = partySaved[member.id];
        if (!saved || saved.mapId !== map.id || saved.x == null || saved.y == null) continue;
        if (list.some((t) => t.kind === "pc" && t.catalogueId === member.catalogueId)) continue;

        let entry = window.CatalogueStore?.get?.("pc", member.catalogueId);
        if (entry && window.CatalogueImages?.hydrate) entry = CatalogueImages.hydrate("pc", entry);
        if (!entry) {
          entry = { id: member.catalogueId, name: member.name || "PC", race: "" };
        }

        const world = window.MapDistance?.percentToWorld?.(saved.x, saved.y, map);
        if (!world) continue;
        const token = CombatSheetModal.buildPcToken(entry, world);
        token.partyId = member.id;
        list.push(token);
        changed = true;
      }

      if (changed) {
        setTokensForMap(map.id, list);
      }
    }

    function refreshTokens() {
      const map = activeMap();
      if (!map) return;
      ensurePartyPcCombatTokens(map);
      renderTokens(map);
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
          if (t.kind === "monster" || t.kind === "npc" || t.kind === "pc") {
            return renderGridToken(
              t,
              map,
              pos,
              sel,
              ` map-grid-token--${t.kind}`,
              tokenTitle(t),
              null
            );
          }
          const cells = Number(t.gridCells);
          if (cells > 0) {
            return renderGridToken(t, map, pos, sel, "", t.label || t.id, null);
          }
          const size = Math.max(0.5, Number(t.size) || 1);
          return `<button type="button" class="map-token${sel}" data-token-id="${escape(t.id)}"
            style="left:${pos.left};top:${pos.top};--token-size:${size}"
            title="${escape(t.label || t.id)}">${escape((t.label || "?").slice(0, 2))}</button>`;
        })
        .join("");

      el.querySelectorAll("[data-token-id]").forEach((btn) => {
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
          let world = clientToWorld(e.clientX, e.clientY, map);
          if (!world) return;
          world = snapWorld(world, map);
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
          if (moved) {
            const tok = tokensForMap(map.id).find((t) => t.id === id);
            if (tok?.kind === "pc" && window.MapPcPlacement?.syncTokenDrag) {
              MapPcPlacement.syncTokenDrag(campaignId, map.id, tok, map);
            }
          }
          if (!moved) {
            const tok = tokensForMap(map.id).find((t) => t.id === id);
            if (!e.shiftKey && window.CombatSheetModal?.open) {
              if (tok?.kind === "monster") {
                CombatSheetModal.open({
                  kind: "monster-token",
                  token: tok,
                  mapId: map.id,
                  campaignId,
                  onRemoved: () => {
                    selectedTokenIds = selectedTokenIds.filter((x) => x !== id);
                    renderTokens(map);
                    updateTokenDistance(map);
                  }
                });
                return;
              }
              if (tok?.kind === "npc" && tok.catalogueId) {
                CombatSheetModal.open({
                  kind: "npc",
                  catalogueId: tok.catalogueId,
                  entityId: tok.entityId,
                  name: tok.label
                });
                return;
              }
              if (tok?.kind === "pc" && tok.catalogueId) {
                CombatSheetModal.open({
                  kind: "pc",
                  catalogueId: tok.catalogueId,
                  entityId: tok.entityId,
                  name: tok.label
                });
                return;
              }
            }
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
          const tok = tokensForMap(map.id).find((t) => t.id === id);
          const label = tok?.label || tok?.id || "this token";
          if (!window.confirm(`Remove “${label}” from this map?`)) return;
          if (tok?.kind === "pc" && window.MapPcPlacement?.removePcToken) {
            MapPcPlacement.removePcToken(campaignId, map.id, tok, map);
          } else {
            setTokensForMap(
              map.id,
              tokensForMap(map.id).filter((t) => t.id !== id)
            );
          }
          selectedTokenIds = selectedTokenIds.filter((x) => x !== id);
          renderTokens(map);
          updateTokenDistance(map);
          refreshPins?.();
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

      const calibrated = isCalibrated(detail);
      if (els.tools) {
        els.tools.hidden = !calibrated;
      }
      if (els.measureBtn) els.measureBtn.hidden = !calibrated;
      if (els.addToken) els.addToken.hidden = !calibrated;
      if (els.fogBtn) els.fogBtn.hidden = false;
      if (els.fogTools) els.fogTools.hidden = false;
      if (window.MapFog) {
        const fog = MapFog.getFogState(campaignId, map.id);
        if (els.fogEnabled) els.fogEnabled.checked = Boolean(fog.enabled);
        MapFog.refresh(campaignId, map.id, mapWorld, { dm: true });
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
      ensurePartyPcCombatTokens(detail);
      renderTokens(detail);
      measureStart = null;
      if (els.measureOut) els.measureOut.hidden = true;
      if (layers.measure) layers.measure.innerHTML = "";
    }

    async function persistDisplayPatch(partial) {
      const map = activeMap();
      if (!map?.calibrated) return;
      const catalogueId = map.catalogueId || (map.id ? `sw-${map.id}` : null);
      if (!catalogueId || !LocalApiClient?.patchLocationUvtt) return;
      const patch = {};
      if (partial.display) patch.display = { ...(map.display || {}), ...partial.display };
      if (partial.scale) patch.scale = { ...(map.scale || {}), ...partial.scale };
      try {
        const res = await LocalApiClient.patchLocationUvtt("location", catalogueId, patch);
        const next = res.map || {};
        fullMapCache[map.id] = { ...next, id: map.id, name: map.title || next.name };
        Object.assign(map, {
          display: next.display || patch.display,
          scale: next.scale || patch.scale
        });
        if (res.mapCalibration && window.CatalogueStore?.upsert) {
          const entry = CatalogueStore.get?.("location", catalogueId);
          if (entry) {
            await CatalogueStore.upsert("location", {
              ...entry,
              mapCalibration: res.mapCalibration
            });
          }
        }
        await refreshChrome();
      } catch (err) {
        console.warn(err);
        window.alert(err?.message || "Could not save map display settings.");
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

    function clearMeasureGraphics() {
      measureStart = null;
      if (layers.measure) layers.measure.innerHTML = "";
      if (els.measureOut) els.measureOut.hidden = true;
    }

    function paintMeasure(start, end, map, { preview = false } = {}) {
      if (!layers.measure || !window.MapDistance || !start || !end || !map) return null;
      const a = MapDistance.worldToPercent(start.x, start.y, map);
      const b = MapDistance.worldToPercent(end.x, end.y, map);
      if (!a || !b) return null;
      const lineClass = preview ? "map-measure-line map-measure-line--preview" : "map-measure-line";
      layers.measure.setAttribute("viewBox", "0 0 100 100");
      layers.measure.innerHTML =
        `<circle class="map-measure-dot" cx="${a.x}" cy="${a.y}" r="0.7" />` +
        `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${lineClass}" />` +
        (preview ? "" : `<circle class="map-measure-dot" cx="${b.x}" cy="${b.y}" r="0.7" />`);
      const d = MapDistance.distanceBetween(start, end, map.scale || {}, {
        snap: Boolean(els.snap?.checked)
      });
      if (d && els.measureOut) {
        els.measureOut.hidden = false;
        els.measureOut.textContent = preview ? `${d.label}…` : d.label;
      }
      return d;
    }

    els.measureBtn?.addEventListener("click", () => {
      measuring = !measuring;
      if (measuring) {
        fogging = false;
        els.fogBtn?.classList.remove("is-active");
        els.fogBtn?.setAttribute("aria-pressed", "false");
      }
      els.measureBtn.setAttribute("aria-pressed", measuring ? "true" : "false");
      els.measureBtn.classList.toggle("is-active", measuring);
      clearMeasureGraphics();
    });

    if (els.fogBrushes && window.MapFog) {
      els.fogBrushes.innerHTML = MapFog.BRUSH_PRESETS.map(
        (r, i) =>
          `<button type="button" class="map-fog-brush${i === 1 ? " is-active" : ""}" data-fog-brush="${r}" title="Brush ${Math.round(r * 1000) / 10}%">${i + 1}</button>`
      ).join("");
    }

    els.fogBtn?.addEventListener("click", () => {
      fogging = !fogging;
      if (fogging) {
        measuring = false;
        els.measureBtn?.classList.remove("is-active");
        els.measureBtn?.setAttribute("aria-pressed", "false");
        clearMeasureGraphics();
      }
      els.fogBtn.setAttribute("aria-pressed", fogging ? "true" : "false");
      els.fogBtn.classList.toggle("is-active", fogging);
      mapViewport?.classList.toggle("map-viewport--fog-paint", fogging);
    });

    document.querySelectorAll(".map-fog-mode").forEach((btn) => {
      btn.addEventListener("click", () => {
        fogMode = btn.getAttribute("data-fog-mode") === "hide" ? "hide" : "reveal";
        document.querySelectorAll(".map-fog-mode").forEach((b) => b.classList.toggle("is-active", b === btn));
      });
    });

    els.fogBrushes?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-fog-brush]");
      if (!btn) return;
      fogBrush = Number(btn.getAttribute("data-fog-brush")) || fogBrush;
      els.fogBrushes.querySelectorAll(".map-fog-brush").forEach((b) => b.classList.toggle("is-active", b === btn));
    });

    els.fogEnabled?.addEventListener("change", () => {
      const map = activeMap();
      if (!map || !window.MapFog) return;
      MapFog.setEnabled(campaignId, map.id, els.fogEnabled.checked);
      MapFog.refresh(campaignId, map.id, mapWorld, { dm: true });
    });

    els.fogUndo?.addEventListener("click", () => {
      const map = activeMap();
      if (!map || !window.MapFog) return;
      MapFog.undoLastStroke(campaignId, map.id);
      MapFog.refresh(campaignId, map.id, mapWorld, { dm: true });
    });

    els.fogClear?.addEventListener("click", () => {
      const map = activeMap();
      if (!map || !window.MapFog) return;
      if (!window.confirm("Reset fog on this map (fully hidden)?")) return;
      MapFog.clearFog(campaignId, map.id);
      if (els.fogEnabled) els.fogEnabled.checked = true;
      MapFog.refresh(campaignId, map.id, mapWorld, { dm: true });
    });

    els.fogRevealAll?.addEventListener("click", () => {
      const map = activeMap();
      if (!map || !window.MapFog) return;
      MapFog.revealAll(campaignId, map.id);
      MapFog.refresh(campaignId, map.id, mapWorld, { dm: true });
    });

    if (window.MapFog) {
      MapFog.bindDm({
        campaignId,
        mapWorld,
        mapViewport,
        getActiveMapId,
        isFogToolActive: () => fogging && Boolean(els.fogEnabled?.checked),
        getFogMode: () => fogMode,
        getBrushRadius: () => fogBrush
      });
    }

    mapViewport?.addEventListener(
      "pointerdown",
      (e) => {
        if (fogging) e.stopPropagation();
      },
      true
    );

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
      if (e.target.closest?.(".map-token, .map-pin, .map-grid-token")) return;
      const map = activeMap();
      if (!isCalibrated(map)) return;
      const world = clientToWorld(e.clientX, e.clientY, map);
      if (!world) return;
      if (!measureStart) {
        measureStart = world;
        if (layers.measure && window.MapDistance) {
          const a = MapDistance.worldToPercent(measureStart.x, measureStart.y, map);
          if (a) {
            layers.measure.setAttribute("viewBox", "0 0 100 100");
            layers.measure.innerHTML = `<circle class="map-measure-dot" cx="${a.x}" cy="${a.y}" r="0.7" />`;
          }
        }
        if (els.measureOut) {
          els.measureOut.hidden = false;
          els.measureOut.textContent = "Click end point…";
        }
        return;
      }
      paintMeasure(measureStart, world, map, { preview: false });
      measureStart = null;
    });

    mapViewport?.addEventListener("pointermove", (e) => {
      if (!measuring || !measureStart) return;
      const map = activeMap();
      if (!isCalibrated(map)) return;
      const world = clientToWorld(e.clientX, e.clientY, map);
      if (!world) return;
      paintMeasure(measureStart, world, map, { preview: true });
    });

    function spawnCombatToken(kind, entry, choice) {
      const map = activeMap();
      if (!isCalibrated(map)) {
        return { ok: false, error: "Import or open a calibrated / UVTT map to place combat tokens." };
      }
      const pos = tokenSpawnPos(map, choice);
      let token = null;
      if (kind === "npc" && window.CombatSheetModal?.buildNpcToken) {
        token = CombatSheetModal.buildNpcToken(entry, pos);
      } else if (kind === "pc" && window.CombatSheetModal?.buildPcToken) {
        token = CombatSheetModal.buildPcToken(entry, pos);
        if (token && choice?.partyId) token.partyId = choice.partyId;
        if (token && window.MapPcPlacement?.placePcOnMap) {
          const pct = window.MapDistance?.worldToPercent?.(token.x, token.y, map);
          MapPcPlacement.placePcOnMap(campaignId, {
            partyId: choice?.partyId,
            catalogueId: token.catalogueId || entry?.id,
            mapId: map.id,
            map,
            percent: pct,
            world: { x: token.x, y: token.y },
            token
          });
          renderTokens(map);
          return { ok: true, token };
        }
      } else {
        token =
          window.CombatSheetModal?.buildMonsterToken?.(entry, pos) ||
          window.CombatSheetModal?.buildCombatToken?.(kind || "monster", entry, pos) ||
          null;
      }
      if (!token) return { ok: false, error: "Combat sheet helper unavailable." };
      const list = tokensForMap(map.id);
      list.push(token);
      setTokensForMap(map.id, list);
      renderTokens(map);
      return { ok: true, token };
    }

    function spawnMonsterToken(entry) {
      return spawnCombatToken("monster", entry);
    }

    return {
      refreshChrome,
      summaryToMapDef,
      loadCalibratedMaps,
      spawnMonsterToken,
      spawnCombatToken,
      refreshTokens
    };
  }

  return { loadCalibratedMaps, summaryToMapDef, bind, attachChrome, ensureLayers };
})();
