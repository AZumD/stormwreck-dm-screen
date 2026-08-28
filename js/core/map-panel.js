/** Floating map panel — catalogue images, pins, drag positions, party */
window.MapPanel = (function () {
  "use strict";

  const PIN_TYPES = ["pc", "npc", "poi", "item", "monster"];
  const MAP_ADD_LOCATION_VALUE = "__add_location__";
  const FILTER_LABELS = {
    pc: "PCs",
    npc: "NPCs",
    poi: "Points of interest",
    item: "Items",
    monster: "Monsters"
  };

  let activeInstance = null;

  function filtersKey(campaignId) {
    return `${campaignId}-map-filters`;
  }

  function mapKey(campaignId) {
    return `${campaignId}-active-map`;
  }

  function pinPosKey(campaignId) {
    return `${campaignId}-pin-positions`;
  }

  function partyPosKey(campaignId) {
    return `${campaignId}-party-positions`;
  }

  function customPinsKey(campaignId) {
    return `${campaignId}-custom-pins`;
  }

  function loadFilters(campaignId) {
    const saved = window.CampaignMapState?.get(campaignId)?.filters;
    if (saved && typeof saved === "object") return { ...defaultFilters(), ...saved };
    return defaultFilters();
  }

  function defaultFilters() {
    return Object.fromEntries(PIN_TYPES.map((t) => [t, true]));
  }

  function saveFilters(campaignId, filters) {
    if (window.CampaignMapState) CampaignMapState.patch(campaignId, { filters });
  }

  function loadPinPositions(campaignId) {
    const data = window.CampaignMapState?.get(campaignId)?.pinPositions;
    return data && typeof data === "object" ? data : {};
  }

  function savePinPositions(campaignId, data) {
    if (window.CampaignMapState) CampaignMapState.patch(campaignId, { pinPositions: data });
  }

  function loadPartyPositions(campaignId) {
    const data = window.CampaignMapState?.get(campaignId)?.partyPositions;
    return data && typeof data === "object" ? data : {};
  }

  function savePartyPositions(campaignId, data) {
    if (window.CampaignMapState) CampaignMapState.patch(campaignId, { partyPositions: data });
  }

  function loadCustomPins(campaignId) {
    const data = window.CampaignMapState?.get(campaignId)?.customPins;
    return data && typeof data === "object" ? data : {};
  }

  function saveCustomPins(campaignId, data) {
    if (window.CampaignMapState) CampaignMapState.patch(campaignId, { customPins: data });
  }

  function locationLinkId(entry) {
    if (entry.linkId) return entry.linkId;
    if (entry.id?.startsWith("sw-")) return entry.id.slice(3);
    return entry.id;
  }

  /** All location catalogue entries (seeds ∪ localStorage) */
  function loadLocationEntries() {
    const byId = new Map();
    (window.CatalogueSeeds?.location || []).forEach((e) => {
      if (e?.id) byId.set(e.id, e);
    });
    try {
      (window.CatalogueStore?.loadAll("location") || []).forEach((e) => {
        if (e?.id) byId.set(e.id, e);
      });
    } catch {
      /* ignore */
    }
    const entries = [...byId.values()];
    return window.CatalogueImages ? CatalogueImages.hydrateAll("location", entries) : entries;
  }

  function findLocationEntry(linkOrId) {
    if (!linkOrId) return null;
    const entries = loadLocationEntries();
    return (
      entries.find((e) => e.id === linkOrId) ||
      entries.find((e) => e.id === `sw-${linkOrId}`) ||
      entries.find((e) => locationLinkId(e) === linkOrId) ||
      null
    );
  }

  function resolveMapImage(map) {
    if (map?.calibrated && (map.imageUrl || map.image)) {
      return {
        src: map.imageUrl || map.image,
        source: "calibrated",
        locationName: map.title
      };
    }
    const locId = map.locationId || map.id;
    const entry = findLocationEntry(locId);
    if (entry?.mapImage) return { src: entry.mapImage, source: "catalogue", locationName: entry.name };
    return { src: map.image || "", source: "placeholder", locationName: entry?.name || map.title };
  }

  function normalizeAllowedLocationIds(campaignId) {
    const ids = window.CampaignLocations?.listIds?.(campaignId) || [];
    const allowed = new Set();
    ids.forEach((raw) => {
      allowed.add(raw);
      allowed.add(raw.replace(/^sw-/, ""));
      const entry = findLocationEntry(raw);
      if (entry) allowed.add(locationLinkId(entry));
    });
    return allowed;
  }

  /** Prefer catalogue link ids; ignore legacy campaign-map ids (map-…). */
  function resolveActiveMapId(campaignId, maps) {
    const saved = window.CampaignMapState?.get(campaignId)?.activeMap;
    if (saved && maps[saved]) return saved;
    if (saved) {
      const stripped = String(saved).replace(/^sw-/, "");
      if (maps[stripped]) return stripped;
      const withSw = saved.startsWith("sw-") ? saved : `sw-${saved}`;
      const entry = findLocationEntry(withSw) || findLocationEntry(stripped);
      if (entry) {
        const link = locationLinkId(entry);
        if (maps[link]) return link;
      }
    }
    return Object.keys(maps)[0] || null;
  }

  function locationEntryToMapDef(entry) {
    const linkId = locationLinkId(entry);
    const staticMap = window.MAPS?.[linkId];
    const def = {
      id: linkId,
      title: entry.name || staticMap?.title || linkId,
      locationId: linkId,
      catalogueId: entry.id,
      image: entry.mapImage || staticMap?.image || "",
      pins: [...(staticMap?.pins || [])],
      fromCatalogue: true
    };
    const cal = entry.mapCalibration;
    if (cal && cal.grid) {
      def.calibrated = true;
      def.kind = cal.kind || "uvtt";
      def.sourceFormat = cal.sourceFormat;
      def.imageUrl = entry.mapImage;
      def.image = entry.mapImage;
      def.widthPx = cal.widthPx;
      def.heightPx = cal.heightPx;
      def.grid = cal.grid;
      def.scale = cal.scale;
      def.display = cal.display;
      def.import = cal.import;
    }
    return def;
  }

  /**
   * Maps for this campaign — only locations added via CampaignLocations,
   * backed by the global location catalogue (map image / UVTT calibration).
   */
  function getEffectiveMaps(campaignId) {
    const allowed = normalizeAllowedLocationIds(campaignId);
    const maps = {};
    if (!allowed.size) return maps;

    loadLocationEntries().forEach((entry) => {
      const linkId = locationLinkId(entry);
      const inCampaign =
        allowed.has(entry.id) || allowed.has(linkId) || window.CampaignLocations?.has?.(campaignId, entry.id);
      if (!inCampaign) return;
      maps[linkId] = locationEntryToMapDef(entry);
    });
    return maps;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getPinLabel(pin) {
    if (pin.label) return pin.label;
    if (pin.entityId) {
      const entity = window.EntityRegistry?.resolve(pin.entityId) || window.ENTITIES?.[pin.entityId];
      if (entity) return entity.name;
    }
    if (pin.partyId && window.PARTY) {
      const m = PARTY.find((p) => p.id === pin.partyId);
      if (m) return m.name;
    }
    return pin.id;
  }

  function init(campaignId) {
    const panel = document.getElementById("map-panel");
    if (!panel) return;
    window.MAPS = window.MAPS || {};

    const mapSelect = document.getElementById("map-select");
    const mapStage = document.getElementById("map-stage");
    const mapViewport = document.getElementById("map-viewport") || mapStage;
    const mapWorld = document.getElementById("map-world") || mapStage;
    const mapImage = document.getElementById("map-image");
    const pinsLayer = document.getElementById("map-pins");
    const filtersEl = document.getElementById("map-filters");
    const partyList = document.getElementById("party-list");
    const addPinBtn = document.getElementById("map-add-pin");
    const pinDialog = document.getElementById("map-pin-dialog");
    const pinDialogTitle = document.getElementById("map-pin-dialog-title");
    const pinDialogBody = document.getElementById("map-pin-dialog-body");
    const pinDialogClose = document.getElementById("map-pin-dialog-close");
    const entityModal = document.getElementById("entity-modal");
    const modalBody = document.getElementById("modal-body");

    let filters = loadFilters(campaignId);
    let maps = getEffectiveMaps(campaignId);
    let activeMapId = resolveActiveMapId(campaignId, maps);
    if (!maps[activeMapId]) activeMapId = Object.keys(maps)[0] || null;

    let spatialApi = null;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 1.2;

    function applyMapTransform() {
      if (!mapWorld) return;
      mapWorld.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      const pinScale = 1 / Math.pow(zoom, 0.8);
      mapStage?.style.setProperty("--map-zoom", String(zoom));
      mapStage?.style.setProperty("--map-pin-scale", String(pinScale));
      mapStage?.classList.toggle("is-zoomed", zoom > 1.01);
    }

    /** Keep .map-stage aspect equal to the loaded image so % pins/grid match the art. */
    function syncMapAspect() {
      if (!mapStage) return;
      const w = mapImage?.naturalWidth || 0;
      const h = mapImage?.naturalHeight || 0;
      if (w > 0 && h > 0) {
        mapStage.style.setProperty("--map-aspect", String(w / h));
      } else {
        mapStage.style.removeProperty("--map-aspect");
      }
    }

    /** Expand/collapse may change stage box; re-apply transform + spatial chrome. */
    function onLayoutChange() {
      syncMapAspect();
      applyMapTransform();
      spatialApi?.refreshChrome?.();
    }

    function resetZoom() {
      zoom = 1;
      panX = 0;
      panY = 0;
      applyMapTransform();
    }

    document.getElementById("map-reset-view-btn")?.addEventListener("click", () => {
      resetZoom();
    });

    function selectMapByLocationId(locationId) {
      if (!locationId) return false;
      maps = getEffectiveMaps(campaignId);
      const entry = findLocationEntry(locationId);
      const candidates = [
        locationId,
        entry?.id,
        entry ? locationLinkId(entry) : null,
        entry?.id?.startsWith("sw-") ? entry.id.slice(3) : null
      ].filter(Boolean);
      let matchId = null;
      for (const c of candidates) {
        if (maps[c]) {
          matchId = c;
          break;
        }
        const hit = Object.values(maps).find(
          (m) => m.id === c || m.locationId === c || locationLinkId({ id: m.locationId || m.id }) === c
        );
        if (hit) {
          matchId = hit.id;
          break;
        }
      }
      if (!matchId) return false;
      activeMapId = matchId;
      if (mapSelect) mapSelect.value = matchId;
      if (window.CampaignMapState) CampaignMapState.patch(campaignId, { activeMap: activeMapId });
      resetZoom();
      renderMap();
      syncExpandedTitle();
      return true;
    }

    function showLocationOnMap(locationId) {
      if (window.LayoutPanels?.setMapCollapsed) LayoutPanels.setMapCollapsed(false);
      setActiveTab("map");
      return selectMapByLocationId(locationId);
    }

    function setZoomAt(nextZoom, clientX, clientY) {
      const rect = mapViewport.getBoundingClientRect();
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
      applyMapTransform();
    }

    function zoomBy(factor, clientX, clientY) {
      setZoomAt(zoom * factor, clientX, clientY);
    }

    mapViewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        zoomBy(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, e.clientX, e.clientY);
      },
      { passive: false }
    );

    /* Kill native image / HTML5 drag so pan owns the gesture */
    mapStage.addEventListener("dragstart", (e) => e.preventDefault());
    mapImage.addEventListener("dragstart", (e) => e.preventDefault());
    mapWorld.addEventListener("dragstart", (e) => e.preventDefault());

    let panning = false;
    let panStart = null;

    function canStartPan(e) {
      if (zoom <= 1.01) return false;
      if (e.button != null && e.button !== 0) return false;
      if (e.target.closest?.(".map-pin, .map-token, .map-grid-token")) return false;
      if (document.getElementById("map-measure-btn")?.getAttribute("aria-pressed") === "true") return false;
      return true;
    }

    function onPanDown(e) {
      if (!canStartPan(e)) return;
      e.preventDefault();
      e.stopPropagation();
      panning = true;
      panStart = { x: e.clientX, y: e.clientY, panX, panY };
      mapViewport.classList.add("is-panning");
      mapStage.classList.add("is-panning");
      try {
        mapViewport.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    function onPanMove(e) {
      if (!panning || !panStart) return;
      e.preventDefault();
      panX = panStart.panX + (e.clientX - panStart.x);
      panY = panStart.panY + (e.clientY - panStart.y);
      applyMapTransform();
    }

    function onPanUp(e) {
      if (!panning) return;
      panning = false;
      panStart = null;
      mapViewport.classList.remove("is-panning");
      mapStage.classList.remove("is-panning");
      try {
        mapViewport.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    mapViewport.addEventListener("pointerdown", onPanDown);
    mapViewport.addEventListener("pointermove", onPanMove);
    mapViewport.addEventListener("pointerup", onPanUp);
    mapViewport.addEventListener("pointercancel", onPanUp);
    mapViewport.addEventListener("lostpointercapture", () => {
      panning = false;
      panStart = null;
      mapViewport.classList.remove("is-panning");
      mapStage.classList.remove("is-panning");
    });

    function rebuildMapSelect() {
      maps = getEffectiveMaps(campaignId);
      if (!maps[activeMapId]) activeMapId = Object.keys(maps)[0] || null;
      const options = Object.values(maps).map((m) => {
        const resolved = resolveMapImage(m);
        const mark =
          m.calibrated || m.kind === "uvtt"
            ? " ▦"
            : resolved.source === "catalogue"
              ? " ●"
              : "";
        return `<option value="${m.id}"${m.id === activeMapId ? " selected" : ""}>${escape(m.title)}${mark}</option>`;
      });
      options.push(
        `<option value="${MAP_ADD_LOCATION_VALUE}">+ Add location…</option>`
      );
      if (!Object.values(maps).length) {
        mapSelect.innerHTML = `<option value="" disabled selected>No maps yet</option>${options.join("")}`;
        return;
      }
      mapSelect.innerHTML = options.join("");
    }

    function openAddLocationPicker() {
      if (!window.CampaignLocationsUI?.openPicker) {
        window.alert("Location picker unavailable.");
        return;
      }
      if (activeMapId && maps[activeMapId]) mapSelect.value = activeMapId;
      else rebuildMapSelect();

      CampaignLocationsUI.openPicker(campaignId, null, {
        onAdded(catalogueId) {
          const entry = findLocationEntry(catalogueId);
          activeMapId = entry ? locationLinkId(entry) : String(catalogueId).replace(/^sw-/, "");
          rebuildMapSelect();
          maps = getEffectiveMaps(campaignId);
          if (maps[activeMapId]) mapSelect.value = activeMapId;
          if (window.CampaignMapState) CampaignMapState.patch(campaignId, { activeMap: activeMapId });
          resetZoom();
          renderMap();
          syncExpandedTitle();
        }
      });
    }

    if (filtersEl) {
      filtersEl.innerHTML = PIN_TYPES.map(
        (type) => `
      <label class="map-filter">
        <input type="checkbox" data-filter="${type}" ${filters[type] ? "checked" : ""}>
        <span class="map-filter__dot map-filter__dot--${type}"></span>
        ${FILTER_LABELS[type]}
      </label>`
      ).join("");

      filtersEl.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", () => {
          filters[input.dataset.filter] = input.checked;
          saveFilters(campaignId, filters);
          renderPins();
        });
      });
    }

    const layersBtn = document.getElementById("map-layers-btn");
    const layersPopover = document.getElementById("map-layers-popover");
    const settingsEl = document.getElementById("map-settings");
    const settingsToggle = document.getElementById("map-settings-toggle");

    function setLayersOpen(open) {
      if (!layersPopover || !layersBtn) return;
      layersPopover.hidden = !open;
      layersBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    layersBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      setLayersOpen(layersPopover?.hidden !== false);
    });

    document.addEventListener("click", (e) => {
      if (!layersPopover || layersPopover.hidden) return;
      if (e.target.closest?.(".map-layers-wrap")) return;
      setLayersOpen(false);
    });

    settingsToggle?.addEventListener("click", () => {
      if (!settingsEl) return;
      settingsEl.open = !settingsEl.open;
      settingsToggle.setAttribute("aria-expanded", settingsEl.open ? "true" : "false");
    });
    settingsEl?.addEventListener("toggle", () => {
      settingsToggle?.setAttribute("aria-expanded", settingsEl.open ? "true" : "false");
    });

    function setActiveTab(tab) {
      const allowed = new Set(["map", "party", "music"]);
      const next = allowed.has(tab) ? tab : "map";
      panel.dataset.activeTab = next;
      panel.querySelectorAll("[data-map-tab]").forEach((btn) => {
        const on = btn.dataset.mapTab === next;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.classList.toggle("is-active", on);
      });
      panel.querySelectorAll("[data-map-tab-panel]").forEach((pane) => {
        const on = pane.dataset.mapTabPanel === next;
        pane.hidden = !on;
      });
      if (next === "party" && window.PartyRoster) {
        PartyRoster.syncWindowParty();
        PartyRoster.render(partyList);
      }
      if (next === "music" && window.MusicMixerUi) {
        MusicMixerUi.render(document.getElementById("music-mixer-list"));
      }
    }

    panel.querySelectorAll("[data-map-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setActiveTab(btn.dataset.mapTab));
    });
    setActiveTab("map");

    function syncExpandedTitle() {
      const titleEl = document.getElementById("map-expanded-title");
      if (!titleEl || titleEl.hidden) return;
      const map = maps[activeMapId];
      titleEl.textContent = map?.title || mapSelect?.options[mapSelect.selectedIndex]?.textContent || "Map";
    }

    mapSelect.addEventListener("change", () => {
      if (mapSelect.value === MAP_ADD_LOCATION_VALUE) {
        openAddLocationPicker();
        return;
      }
      if (!mapSelect.value) return;
      activeMapId = mapSelect.value;
      if (window.CampaignMapState) CampaignMapState.patch(campaignId, { activeMap: activeMapId });
      resetZoom();
      renderMap();
      syncExpandedTitle();
    });

    function renderMap() {
      maps = getEffectiveMaps(campaignId);
      const map = maps[activeMapId];
      if (!map) {
        mapStage.classList.add("map-stage--error");
        mapImage.classList.add("hidden");
        spatialApi?.refreshChrome?.();
        return;
      }

      const resolved = resolveMapImage(map);
      mapStage.classList.add("map-stage--loading");
      mapStage.classList.remove(
        "map-stage--error",
        "map-stage--catalogue",
        "map-stage--placeholder",
        "map-stage--calibrated"
      );
      if (resolved.source === "calibrated") mapStage.classList.add("map-stage--calibrated");
      else if (resolved.source === "catalogue") mapStage.classList.add("map-stage--catalogue");
      else mapStage.classList.add("map-stage--placeholder");

      if (resolved.src) {
        mapImage.src = resolved.src;
        mapImage.alt = map.title;
        mapImage.classList.remove("hidden");
        if (mapImage.complete && mapImage.naturalWidth) syncMapAspect();
      } else {
        mapImage.removeAttribute("src");
        mapImage.alt = "No map image yet";
        mapImage.classList.add("hidden");
        mapStage.classList.remove("map-stage--loading");
        mapStage.classList.add("map-stage--error");
        syncMapAspect();
      }

      applyMapTransform();
      renderPins();
      spatialApi?.refreshChrome?.();
    }

    function getCustomPinsForMap() {
      const all = loadCustomPins(campaignId);
      return Array.isArray(all[activeMapId]) ? all[activeMapId].map((p) => ({ ...p, custom: true })) : [];
    }

    function getAllPins() {
      const map = maps[activeMapId];
      const mapPins = (map?.pins || []).map((p) => ({ ...p }));
      const partySaved = loadPartyPositions(campaignId);

      const pcPins = (window.PARTY || [])
        .filter((m) => m.memberType !== "npc")
        .map((m) => {
          const override = partySaved[m.id];
          const mapId = override?.mapId ?? m.mapId;
          const x = override?.x ?? m.x;
          const y = override?.y ?? m.y;
          if (mapId !== activeMapId || x == null || y == null) return null;
          return {
            id: `pc-${m.id}`,
            pinType: "pc",
            partyId: m.id,
            x,
            y
          };
        })
        .filter(Boolean);

      const customPins = getCustomPinsForMap();
      const pinSaved = loadPinPositions(campaignId)[activeMapId] || {};

      return [...mapPins, ...pcPins, ...customPins].map((pin) => {
        const pos = pinSaved[pin.id];
        if (pin.partyId) return pin;
        if (pos) return { ...pin, x: pos.x, y: pos.y };
        return pin;
      });
    }

    function persistPinPosition(pin, x, y) {
      if (pin.partyId) {
        const partySaved = loadPartyPositions(campaignId);
        partySaved[pin.partyId] = { mapId: activeMapId, x, y };
        savePartyPositions(campaignId, partySaved);
        return;
      }

      if (pin.custom) {
        const all = loadCustomPins(campaignId);
        const list = Array.isArray(all[activeMapId]) ? all[activeMapId] : [];
        const idx = list.findIndex((p) => p.id === pin.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], x, y };
          all[activeMapId] = list;
          saveCustomPins(campaignId, all);
        }
      }

      const allPos = loadPinPositions(campaignId);
      if (!allPos[activeMapId]) allPos[activeMapId] = {};
      allPos[activeMapId][pin.id] = { x, y };
      savePinPositions(campaignId, allPos);
    }

    function removeCustomPin(pinId) {
      const all = loadCustomPins(campaignId);
      all[activeMapId] = (all[activeMapId] || []).filter((p) => p.id !== pinId);
      saveCustomPins(campaignId, all);
      const allPos = loadPinPositions(campaignId);
      if (allPos[activeMapId]) {
        delete allPos[activeMapId][pinId];
        savePinPositions(campaignId, allPos);
      }
    }

    function openPinDetails(pin) {
      if (window.CombatSheetModal?.open) {
        if (pin.partyId && window.PARTY) {
          const member = PARTY.find((p) => p.id === pin.partyId);
          if (
            member &&
            (member.memberType === "pc" || member.memberType === "npc") &&
            member.catalogueId
          ) {
            CombatSheetModal.open({
              kind: member.memberType,
              catalogueId: member.catalogueId,
              entityId: member.entityId,
              name: member.name,
              portrait: member.portrait
            });
            return;
          }
        }
        if (pin.entityId && window.EntityRegistry?.resolve) {
          const entity = EntityRegistry.resolve(pin.entityId);
          if (entity && (entity.type === "pc" || entity.type === "npc")) {
            CombatSheetModal.open({
              kind: entity.type,
              catalogueId: entity.catalogueId || entity.id,
              entityId: entity.id,
              name: entity.name
            });
            return;
          }
        }
      }

      EntityUI.openPinModal(pin);
      if (!pin.custom || !modalBody || !entityModal) return;

      const existing = modalBody.querySelector("[data-remove-map-pin]");
      if (existing) existing.remove();

      const actions = document.createElement("div");
      actions.className = "map-pin-modal-actions";
      actions.innerHTML = `<button type="button" class="btn btn-danger" data-remove-map-pin>Remove from map</button>`;
      modalBody.appendChild(actions);
      actions.querySelector("[data-remove-map-pin]").addEventListener("click", () => {
        if (!confirm(`Remove “${getPinLabel(pin)}” from this map?`)) return;
        removeCustomPin(pin.id);
        try {
          entityModal.close();
        } catch {
          entityModal.removeAttribute("open");
        }
        renderPins();
      });
    }

    function nextFreeSpot() {
      const existing = getAllPins();
      let x = 50;
      let y = 50;
      for (let i = 0; i < 24; i++) {
        const tx = 20 + ((i * 17) % 60);
        const ty = 20 + ((i * 13) % 60);
        const taken = existing.some((p) => Math.hypot(p.x - tx, p.y - ty) < 4);
        if (!taken) {
          x = tx;
          y = ty;
          break;
        }
      }
      return { x, y };
    }

    function listChoices(pinType) {
      if (pinType === "pc") {
        const partyRows = (window.PARTY || [])
          .filter((m) => m.memberType !== "npc")
          .map((m) => ({
            id: m.id,
            name: m.name,
            meta: m.class || "PC",
            partyId: m.id,
            catalogueId: m.catalogueId || null,
            entityId: m.entityId || null
          }));
        const seen = new Set(partyRows.map((r) => r.catalogueId).filter(Boolean));
        const catalogueRows = (
          window.EntityRegistry?.byType("pc") ||
          Object.values(window.ENTITIES || {}).filter((e) => e.type === "pc")
        )
          .filter((e) => {
            const cid = e.catalogueId || e.id;
            return cid && !seen.has(cid);
          })
          .map((e) => ({
            id: e.id,
            name: e.name,
            meta: e.summary || "PC",
            entityId: e.id,
            catalogueId: e.catalogueId || e.id
          }));
        return [...partyRows, ...catalogueRows].sort((a, b) => a.name.localeCompare(b.name));
      }

      const entities =
        window.EntityRegistry?.byType(pinType) ||
        Object.values(window.ENTITIES || {}).filter((e) => e.type === pinType);

      return entities
        .map((e) => ({
          id: e.id,
          name: e.name,
          meta: e.summary || pinType,
          entityId: e.id,
          catalogueId: e.catalogueId || e.id
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    function closePinDialog() {
      if (!pinDialog) return;
      try {
        pinDialog.close();
      } catch {
        pinDialog.removeAttribute("open");
      }
    }

    function showPinDialogStep(step, pinType) {
      if (!pinDialogBody || !pinDialogTitle) return;

      if (step === "type") {
        pinDialogTitle.textContent = "Add to map";
        pinDialogBody.innerHTML = `
          <p class="map-pin-dialog-lead">What do you want to add?</p>
          <div class="map-pin-type-grid">
            <button type="button" class="map-pin-type-btn" data-pin-type="npc"><span class="map-filter__dot map-filter__dot--npc"></span>NPC</button>
            <button type="button" class="map-pin-type-btn" data-pin-type="monster"><span class="map-filter__dot map-filter__dot--monster"></span>Monster</button>
            <button type="button" class="map-pin-type-btn" data-pin-type="item"><span class="map-filter__dot map-filter__dot--item"></span>Item</button>
            <button type="button" class="map-pin-type-btn" data-pin-type="pc"><span class="map-filter__dot map-filter__dot--pc"></span>PC</button>
          </div>`;
        pinDialogBody.querySelectorAll("[data-pin-type]").forEach((btn) => {
          btn.addEventListener("click", () => showPinDialogStep("pick", btn.dataset.pinType));
        });
        return;
      }

      const labels = { npc: "NPC", monster: "Monster", item: "Item", pc: "PC" };
      const choices = listChoices(pinType);
      const calibrated = window.MapTokenSize?.isCalibratedMap?.(maps[activeMapId]);
      pinDialogTitle.textContent = `Add ${labels[pinType] || pinType}`;
      const lead =
        pinType === "monster" || ((pinType === "npc" || pinType === "pc") && calibrated)
          ? `<p class="map-pin-dialog-lead">Places a combat token (independent HP/AC on monsters; NPC/PC open combat sheet). Requires a calibrated / UVTT map.</p>`
          : pinType === "npc" || pinType === "pc"
            ? `<p class="map-pin-dialog-lead">Places a map pin. Open a calibrated / UVTT map to place grid combat tokens instead.</p>`
            : "";
      pinDialogBody.innerHTML = `
        <button type="button" class="map-pin-back" data-pin-back>← Back</button>
        ${lead}
        <input type="search" class="map-pin-search" placeholder="Search…" autocomplete="off">
        <div class="map-pin-choice-list">
          ${
            choices.length
              ? choices
                  .map(
                    (c) => `
            <button type="button" class="map-pin-choice" data-choice-id="${escape(c.id)}" data-entity-id="${escape(c.entityId || "")}" data-party-id="${escape(c.partyId || "")}" data-catalogue-id="${escape(c.catalogueId || "")}" data-name="${escape(c.name)}">
              <strong>${escape(c.name)}</strong>
              <span>${escape(c.meta || "")}</span>
            </button>`
                  )
                  .join("")
              : `<p class="empty-state">Nothing in the catalogue yet.</p>`
          }
        </div>`;

      pinDialogBody.querySelector("[data-pin-back]")?.addEventListener("click", () => showPinDialogStep("type"));

      const search = pinDialogBody.querySelector(".map-pin-search");
      const list = pinDialogBody.querySelector(".map-pin-choice-list");
      search?.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        list.querySelectorAll(".map-pin-choice").forEach((el) => {
          const hay = `${el.dataset.name || ""} ${el.textContent || ""}`.toLowerCase();
          el.classList.toggle("hidden", q && !hay.includes(q));
        });
      });

      pinDialogBody.querySelectorAll(".map-pin-choice").forEach((btn) => {
        btn.addEventListener("click", () => {
          addPinFromChoice(pinType, {
            entityId: btn.dataset.entityId || null,
            partyId: btn.dataset.partyId || null,
            catalogueId: btn.dataset.catalogueId || null,
            name: btn.dataset.name
          });
          closePinDialog();
        });
      });

      search?.focus();
    }

    function addPinFromChoice(pinType, choice) {
      const map = maps[activeMapId];
      const calibrated = window.MapTokenSize?.isCalibratedMap?.(map);

      if (pinType === "monster" || ((pinType === "npc" || pinType === "pc") && calibrated)) {
        const entity = choice.entityId ? EntityRegistry?.resolve?.(choice.entityId) : null;
        let catalogueId =
          choice.catalogueId ||
          entity?.catalogueId ||
          (choice.partyId && window.PARTY?.find((p) => p.id === choice.partyId)?.catalogueId) ||
          choice.entityId ||
          null;
        if (pinType === "monster" && !catalogueId) catalogueId = choice.entityId || choice.id;
        const storeType = pinType === "pc" ? "pc" : pinType === "npc" ? "npc" : "monster";
        let entry = catalogueId && CatalogueStore?.get?.(storeType, catalogueId);
        if (!entry && catalogueId) {
          entry = {
            id: catalogueId,
            name: choice.name || entity?.name || pinType,
            race: entity?.race || "",
            hp: entity?.hp || "",
            ac: entity?.ac || ""
          };
        }
        if (!spatialApi?.spawnCombatToken && !spatialApi?.spawnMonsterToken) {
          window.alert("Open a calibrated / UVTT map to place combat tokens.");
          return;
        }
        const spawn =
          spatialApi.spawnCombatToken?.(storeType, entry || { name: choice.name }) ||
          (storeType === "monster"
            ? spatialApi.spawnMonsterToken?.(entry || { name: choice.name })
            : null);
        if (!spawn?.ok) {
          window.alert(spawn?.error || "Could not place combat token.");
        }
        return;
      }

      const spot = nextFreeSpot();

      if (pinType === "pc" && choice.partyId) {
        const partySaved = loadPartyPositions(campaignId);
        partySaved[choice.partyId] = { mapId: activeMapId, x: spot.x, y: spot.y };
        savePartyPositions(campaignId, partySaved);
        renderPins();
        return;
      }

      const all = loadCustomPins(campaignId);
      if (!all[activeMapId]) all[activeMapId] = [];
      const pin = {
        id: `custom-${pinType}-${choice.entityId || "x"}-${Date.now().toString(36)}`,
        pinType,
        entityId: choice.entityId || undefined,
        label: choice.name,
        x: spot.x,
        y: spot.y
      };
      all[activeMapId].push(pin);
      saveCustomPins(campaignId, all);
      renderPins();
    }

    function openAddPinDialog() {
      if (!pinDialog) return;
      showPinDialogStep("type");
      try {
        pinDialog.showModal();
      } catch {
        pinDialog.setAttribute("open", "");
      }
    }

    addPinBtn?.addEventListener("click", openAddPinDialog);
    pinDialogClose?.addEventListener("click", closePinDialog);
    pinDialog?.addEventListener("click", (e) => {
      if (e.target === pinDialog) closePinDialog();
    });

    function bindPinDrag(btn, pin) {
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startY = 0;

      btn.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        EntityUI.hideTooltip();
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        btn.classList.add(btn.classList.contains("map-grid-token") ? "map-grid-token--dragging" : "map-pin--dragging");
        btn.setPointerCapture(e.pointerId);
      });

      btn.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        moved = true;

        const rect = mapWorld.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        let x = clamp(((e.clientX - rect.left) / rect.width) * 100, 1, 99);
        let y = clamp(((e.clientY - rect.top) / rect.height) * 100, 1, 99);
        const map = maps[activeMapId];
        const snapOn = document.getElementById("map-snap-measure")?.checked;
        if (
          snapOn &&
          window.MapTokenSize?.isCalibratedMap?.(map) &&
          window.MapDistance?.percentToWorld &&
          window.MapDistance?.worldToPercent
        ) {
          const world = MapDistance.percentToWorld(x, y, map);
          if (world) {
            const snapped = { x: Math.round(world.x), y: Math.round(world.y) };
            const pct = MapDistance.worldToPercent(snapped.x, snapped.y, map);
            if (pct) {
              x = clamp(pct.x, 1, 99);
              y = clamp(pct.y, 1, 99);
            }
          }
        }
        btn.style.left = `${x}%`;
        btn.style.top = `${y}%`;
        btn.dataset.dragX = String(x);
        btn.dataset.dragY = String(y);
      });

      btn.addEventListener("pointerup", (e) => {
        if (!dragging) return;
        dragging = false;
        btn.classList.remove("map-pin--dragging", "map-grid-token--dragging");
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }

        if (moved) {
          const x = parseFloat(btn.dataset.dragX);
          const y = parseFloat(btn.dataset.dragY);
          if (!Number.isNaN(x) && !Number.isNaN(y)) {
            persistPinPosition(pin, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
          }
          return;
        }

        openPinDetails(pin);
      });

      btn.addEventListener("pointercancel", () => {
        dragging = false;
        btn.classList.remove("map-pin--dragging", "map-grid-token--dragging");
      });

      btn.addEventListener("mouseenter", (e) => {
        if (dragging) return;
        EntityUI.showTooltipForPin(pin, e);
      });
      btn.addEventListener("mousemove", (e) => {
        if (dragging) return;
        EntityUI.moveTooltip(e);
      });
      btn.addEventListener("mouseleave", () => EntityUI.hideTooltip());
      btn.addEventListener("focus", (e) => EntityUI.showTooltipForPin(pin, e));
      btn.addEventListener("blur", () => EntityUI.hideTooltip());
    }

    function renderPins() {
      const map = maps[activeMapId];
      const calibrated = window.MapTokenSize?.isCalibratedMap?.(map);
      const pins = getAllPins().filter((p) => filters[p.pinType] !== false);
      pinsLayer.innerHTML = pins
        .map((pin) => {
          const label = getPinLabel(pin);
          if (calibrated && window.MapTokenSize) {
            const sizeInfo = MapTokenSize.resolvePinSize(pin, { map });
            if (sizeInfo?.span) {
              const pos = { left: `${pin.x}%`, top: `${pin.y}%` };
              const style = MapTokenSize.gridTokenStyle(pos, sizeInfo.span);
              const roundClass = sizeInfo.gridCells === 1 ? " map-grid-token--round" : "";
              const title = `${label} (${sizeInfo.dndSize})`;
              const hasImg = !!sizeInfo.tokenUrl;
              const inner = hasImg
                ? MapTokenSize.tokenImageHtml(sizeInfo.tokenUrl, label, sizeInfo.fallbackUrl)
                : "";
              return `<button type="button" class="map-grid-token map-grid-token--${pin.pinType}${roundClass}${hasImg ? " map-grid-token--has-img" : ""}${pin.custom ? " map-grid-token--custom" : ""}"
          style="${style}"
          data-pin-id="${escape(pin.id)}"
          title="${escape(title)} · drag to move"
          aria-label="${escape(title)}">${inner}</button>`;
            }
          }
          return `<button type="button" class="map-pin map-pin--${pin.pinType}${pin.custom ? " map-pin--custom" : ""}"
          style="left:${pin.x}%;top:${pin.y}%"
          data-pin-id="${escape(pin.id)}"
          title="Drag to move · click for details"
          aria-label="${escape(label)}"></button>`;
        })
        .join("");

      pinsLayer.querySelectorAll("[data-pin-id]").forEach((btn) => {
        const pin = getAllPins().find((p) => p.id === btn.dataset.pinId);
        if (!pin) return;
        bindPinDrag(btn, pin);
      });
    }

    mapImage.addEventListener("load", () => {
      mapStage.classList.remove("map-stage--loading", "map-stage--error");
      syncMapAspect();
      applyMapTransform();
      spatialApi?.refreshChrome?.();
    });
    mapImage.addEventListener("error", () => {
      mapStage.classList.remove("map-stage--loading");
      mapStage.classList.add("map-stage--error");
      mapImage.alt = "Map image not found";
      syncMapAspect();
    });

    rebuildMapSelect();
    renderMap();
    if (window.PartyRoster) PartyRoster.render(partyList);
    else renderParty(partyList);

    if (window.MapSpatial) {
      spatialApi = MapSpatial.bind({
        campaignId,
        mapWorld,
        mapImage,
        mapViewport,
        getActiveMapId: () => activeMapId,
        getMaps: () => maps,
        refreshPins: renderPins,
        onMapsChanged: async (newId) => {
          if (newId) activeMapId = newId;
          if (window.CampaignMapState) {
            CampaignMapState.patch(campaignId, { activeMap: activeMapId });
          }
          rebuildMapSelect();
          resetZoom();
          renderMap();
        }
      });
    }

    function renderInitiativeList() {
      const el = document.getElementById("map-initiative");
      if (!el) return;
      const tracker = window.CampaignMapState?.get(campaignId)?.initiativeTracker || {};
      const rows = Object.entries(tracker)
        .map(([id, row]) => ({
          id,
          name: row?.name || id,
          initiative: Number(row?.initiative) || 0,
          kind: row?.kind || "combatant"
        }))
        .filter((r) => r.initiative !== 0)
        .sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
      if (!rows.length) {
        el.innerHTML = "";
        el.hidden = true;
        return;
      }
      el.hidden = false;
      el.innerHTML = rows
        .map(
          (r) =>
            `<li class="map-initiative__row" data-kind="${escape(r.kind)}"><span class="map-initiative__init">${escape(String(r.initiative))}</span><span class="map-initiative__name">${escape(r.name)}</span></li>`
        )
        .join("");
    }

    activeInstance = {
      refresh() {
        rebuildMapSelect();
        renderMap();
        renderInitiativeList();
        if (window.PartyRoster) {
          PartyRoster.syncWindowParty();
          PartyRoster.render(partyList);
        } else {
          renderParty(partyList);
        }
      },
      refreshInitiative: renderInitiativeList,
      onLayoutChange,
      setActiveTab,
      selectMapByLocationId,
      showLocationOnMap,
      resetZoom
    };
    renderInitiativeList();
  }

  function refresh() {
    activeInstance?.refresh?.();
  }

  function refreshInitiative() {
    activeInstance?.refreshInitiative?.();
  }

  function onLayoutChange() {
    activeInstance?.onLayoutChange?.();
  }

  function renderParty(container) {
    if (window.PartyRoster) {
      PartyRoster.render(container);
      return;
    }
    if (!container || !window.PARTY?.length) {
      if (container) container.innerHTML = `<p class="party-empty">Add PCs from the party panel</p>`;
      return;
    }

    container.innerHTML = PARTY.map((m) => {
      const initials = m.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const portrait = m.portrait
        ? `<img class="party-card__img" src="${escape(m.portrait)}" alt="">`
        : `<span class="party-card__initials" style="--pc-color:${escape(m.color || "#c4a035")}">${initials}</span>`;

      return `
        <button type="button" class="party-card" data-party-id="${escape(m.id)}">
          <div class="party-card__portrait">${portrait}</div>
          <div class="party-card__info">
            <span class="party-card__name">${escape(m.name)}</span>
            <span class="party-card__class">${escape(m.class)}</span>
            <span class="party-card__stats">HP ${escape(m.hp)} · AC ${escape(String(m.ac))}</span>
          </div>
        </button>`;
    }).join("");

    container.querySelectorAll(".party-card").forEach((btn) => {
      const member = PARTY.find((p) => p.id === btn.dataset.partyId);
      btn.addEventListener("mouseenter", (e) => EntityUI.showTooltipForParty(member, e));
      btn.addEventListener("mousemove", (e) => EntityUI.moveTooltip(e));
      btn.addEventListener("mouseleave", () => EntityUI.hideTooltip());
      btn.addEventListener("click", () => EntityUI.openPartyModal(member));
    });
  }

  function escape(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return {
    init,
    refresh,
    refreshInitiative,
    onLayoutChange,
    resolveMapImage,
    getEffectiveMaps,
    findLocationEntry,
    setActiveTab: (tab) => activeInstance?.setActiveTab?.(tab),
    selectMapByLocationId: (id) => activeInstance?.selectMapByLocationId?.(id),
    showLocationOnMap: (id) => activeInstance?.showLocationOnMap?.(id),
    resetZoom: () => activeInstance?.resetZoom?.(),
    refreshPins: () => activeInstance?.refreshPins?.()
  };
})();
