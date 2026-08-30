/**
 * Live campaign quick-reference overlay: overview, scene context, pins, recents, categories.
 */
window.ReferenceUI = (function () {
  "use strict";

  const { escapeHtml } = ContentParser;

  const VIEWS = [
    { id: "overview", label: "Overview" },
    { id: "npcs", label: "NPCs" },
    { id: "monsters", label: "Monsters" },
    { id: "locations", label: "Locations" }
  ];
  const VIEW_IDS = new Set(VIEWS.map((v) => v.id));
  const QUICK_TYPES = new Set(["npc", "monster", "location"]);
  const CONTENT_LINK_TYPES = "npc|monster|location";
  const RECENT_MAX = 8;

  let campaignId = null;
  let api = null;
  let labels = {};
  let panelRoot = null;
  let panelBound = false;

  function t(key, fallback) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let value = labels;
      for (const part of parts) value = value?.[part];
      if (value) return value;
    }
    return labels[key] || fallback || key;
  }

  function typeLabel(type) {
    return labels.typeLabels?.[type] || type || "Entity";
  }

  function normalizeTab(tab) {
    const id = String(tab || "").trim();
    if (VIEW_IDS.has(id)) return id;
    if (id === "reference") return "overview";
    return "overview";
  }

  function resolveEntity(id) {
    return window.EntityRegistry?.resolve?.(id) || window.ENTITIES?.[id] || null;
  }

  function getPrefs() {
    return window.CampaignPrefs?.get(campaignId) || {};
  }

  function normalizePinEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    const id = String(raw.id || "").trim();
    const type = String(raw.type || "").trim().toLowerCase();
    if (!id) return null;
    return { id, type: type || resolveEntity(id)?.type || "npc" };
  }

  function getPins() {
    const raw = getPrefs().referencePins;
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizePinEntry).filter(Boolean);
  }

  function getRecent() {
    const raw = getPrefs().referenceRecent;
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizePinEntry).filter(Boolean);
  }

  function savePins(pins) {
    if (!window.CampaignPrefs) return;
    CampaignPrefs.patch(campaignId, { referencePins: pins });
  }

  function saveRecent(recent) {
    if (!window.CampaignPrefs) return;
    CampaignPrefs.patch(campaignId, { referenceRecent: recent });
  }

  function isPinned(entityId) {
    return getPins().some((p) => p.id === entityId);
  }

  function togglePin(entityId, entityType) {
    const entity = resolveEntity(entityId);
    const type = (entityType || entity?.type || "npc").toLowerCase();
    if (!QUICK_TYPES.has(type)) return false;
    const pins = getPins();
    const idx = pins.findIndex((p) => p.id === entityId);
    if (idx >= 0) {
      pins.splice(idx, 1);
      savePins(pins);
      return false;
    }
    pins.unshift({ id: entityId, type });
    savePins(pins);
    return true;
  }

  function unpin(entityId) {
    savePins(getPins().filter((p) => p.id !== entityId));
  }

  /**
   * Central entity-open tracking (called from EntityUI.openModal).
   * Deduped, most-recent-first, stable id refs only.
   */
  function trackEntityOpen(entityId, entity) {
    if (!entityId || !entity) return;
    const type = (entity.type || "").toLowerCase();
    if (!QUICK_TYPES.has(type)) return;
    const entry = { id: entityId, type };
    const next = [entry, ...getRecent().filter((r) => r.id !== entityId)].slice(0, RECENT_MAX);
    saveRecent(next);
    refreshIfOpen();
  }

  function extractContentEntityRefs(content) {
    const refs = [];
    if (!content) return refs;
    const atRe = new RegExp(`@(${CONTENT_LINK_TYPES}):([\\w-]+)`, "gi");
    const bracketRe = new RegExp(`\\[\\[(${CONTENT_LINK_TYPES}):([\\w-]+)`, "gi");
    let match;
    while ((match = atRe.exec(content))) {
      refs.push({ type: match[1].toLowerCase(), id: match[2] });
    }
    while ((match = bracketRe.exec(content))) {
      refs.push({ type: match[1].toLowerCase(), id: match[2] });
    }
    return refs;
  }

  /**
   * Scene context: SceneMeta entities + location + explicit @npc|monster|location links in prose.
   * Does not fuzzy-match prose text.
   */
  function getSceneContextEntities(sceneId) {
    if (!sceneId || !api?.getSectionById) return [];
    const section = api.getSectionById(sceneId);
    if (!section) return [];

    const seen = new Set();
    const out = [];

    function add(id) {
      if (!id || seen.has(id)) return;
      const entity = resolveEntity(id);
      if (!entity || !QUICK_TYPES.has((entity.type || "").toLowerCase())) return;
      seen.add(id);
      out.push(entity);
    }

    if (window.SceneMeta) {
      const meta = SceneMeta.get(campaignId, sceneId, api.getSectionBase?.(sceneId) || section);
      if (meta.locationId) add(meta.locationId);
      (meta.entities || []).forEach((ref) => add(ref.id));
    }

    const data = api.getSectionData?.(section) || section;
    extractContentEntityRefs(data.content || "").forEach((ref) => add(ref.id));

    return out;
  }

  function resolveStoredEntities(entries) {
    return entries
      .map((entry) => {
        const entity = resolveEntity(entry.id);
        if (!entity) return null;
        return entity;
      })
      .filter(Boolean);
  }

  function entitySubtitle(entity) {
    const type = typeLabel(entity.type);
    if (entity.type === "monster" && entity.stats?.CR) return `${type} · CR ${entity.stats.CR}`;
    if (entity.summary) return `${type} · ${entity.summary}`;
    return type;
  }

  function renderQuickCard(entity, opts = {}) {
    const pinned = opts.pinned || isPinned(entity.id);
    const unpinBtn =
      opts.showUnpin && pinned
        ? `<button type="button" class="ref-quick-card__unpin" data-ref-unpin="${escapeHtml(entity.id)}" aria-label="${escapeHtml(t("referenceUnpin", "Unpin from Reference"))}">${escapeHtml(t("referenceUnpinShort", "Unpin"))}</button>`
        : "";
    return `
      <div class="ref-quick-card-wrap">
        <button type="button" class="ref-quick-card" data-ref-entity="${escapeHtml(entity.id)}">
          <span class="ref-quick-card__name">${escapeHtml(entity.name || entity.id)}</span>
          <span class="ref-quick-card__meta">${escapeHtml(entitySubtitle(entity))}</span>
        </button>${unpinBtn}
      </div>`;
  }

  function renderSection(title, cardsHtml) {
    if (!cardsHtml) return "";
    return `
      <section class="ref-overview__section">
        <h2 class="ref-overview__heading">${escapeHtml(title)}</h2>
        <div class="ref-overview__cards">${cardsHtml}</div>
      </section>`;
  }

  function renderOverview(sceneId) {
    const sceneEntities = getSceneContextEntities(sceneId);
    const sceneIds = new Set(sceneEntities.map((e) => e.id));
    const pinned = resolveStoredEntities(getPins()).filter((e) => !sceneIds.has(e.id));
    const pinnedIds = new Set(pinned.map((e) => e.id));
    const recent = resolveStoredEntities(getRecent()).filter(
      (e) => !sceneIds.has(e.id) && !pinnedIds.has(e.id)
    );

    const sceneHtml = sceneEntities.map((e) => renderQuickCard(e)).join("");
    const pinnedHtml = pinned.map((e) => renderQuickCard(e, { showUnpin: true, pinned: true })).join("");
    const recentHtml = recent.map((e) => renderQuickCard(e)).join("");

    const browse = `
      <section class="ref-overview__section ref-overview__browse">
        <h2 class="ref-overview__heading">${escapeHtml(t("referenceBrowse", "Browse"))}</h2>
        <div class="ref-overview__browse-row">
          ${VIEWS.filter((v) => v.id !== "overview")
            .map(
              (v) =>
                `<button type="button" class="ref-overview__browse-btn" data-reference-tab="${v.id}">${escapeHtml(v.label)}</button>`
            )
            .join("")}
        </div>
      </section>`;

    return `
      <div class="ref-overview">
        ${renderSection(t("referenceInThisScene", "In this scene"), sceneHtml)}
        ${renderSection(t("referencePinned", "Pinned"), pinnedHtml)}
        ${renderSection(t("referenceRecent", "Recent"), recentHtml)}
        ${browse}
      </div>`;
  }

  function renderCategory(type, title, gridHtml) {
    return `<h1 class="panel-workspace__section-title">${escapeHtml(title)}</h1>${gridHtml}`;
  }

  function renderShell(activeView) {
    const view = normalizeTab(activeView);
    return `
      <div class="panel-workspace reference-workspace" data-workspace="reference">
        <header class="panel-workspace__header">
          <h1 class="panel-workspace__title">${escapeHtml(t("referenceTitle", "Reference"))}</h1>
          <div class="panel-workspace__tabs reference-workspace__tabs" role="tablist" aria-label="Reference sections">
            ${VIEWS.map(
              (tab) => `
              <button
                type="button"
                class="panel-workspace__tab reference-workspace__tab${tab.id === view ? " is-active" : ""}"
                role="tab"
                aria-selected="${tab.id === view ? "true" : "false"}"
                data-reference-tab="${tab.id}"
              >${escapeHtml(tab.label)}</button>`
            ).join("")}
          </div>
        </header>
        <div class="panel-workspace__body reference-workspace__body"></div>
      </div>`;
  }

  function renderBody(view, bodyHost) {
    const tab = normalizeTab(view);
    if (tab === "overview") {
      bodyHost.innerHTML = renderOverview(api?.getContextSceneId?.() || null);
      return;
    }
    if (tab === "locations" && window.CampaignLocationsUI) {
      bodyHost.innerHTML = renderCategory("location", t("headings.locations", "Locations"), `<div id="campaign-locations-panel"></div>`);
      CampaignLocationsUI.mount(document.getElementById("campaign-locations-panel"), campaignId);
      return;
    }
    const typeMap = { npcs: "npc", monsters: "monster", locations: "location" };
    const headingMap = {
      npcs: t("headings.npcs", "NPCs"),
      monsters: t("headings.monsters", "Monsters"),
      locations: t("headings.locations", "Locations")
    };
    const type = typeMap[tab];
    bodyHost.innerHTML = renderCategory(type, headingMap[tab], api?.renderEntityGrid?.(type) || "");
  }

  function bindPanelOnce() {
    if (panelBound || !panelRoot) return;
    panelBound = true;
    panelRoot.addEventListener("click", (e) => {
      const tabBtn = e.target.closest("[data-reference-tab]");
      if (tabBtn) {
        const tab = tabBtn.getAttribute("data-reference-tab");
        if (tab) api?.showReferenceTab?.(tab);
        return;
      }
      const entityBtn = e.target.closest("[data-ref-entity]");
      if (entityBtn) {
        api?.openEntity?.(entityBtn.getAttribute("data-ref-entity"));
        return;
      }
      const unpinBtn = e.target.closest("[data-ref-unpin]");
      if (unpinBtn) {
        unpin(unpinBtn.getAttribute("data-ref-unpin"));
        refreshIfOpen();
        return;
      }
      const card = e.target.closest(".ref-card[data-id]");
      if (card) {
        api?.openEntity?.(card.getAttribute("data-id"));
      }
    });
  }

  function mount(panelEl, view) {
    if (!panelEl) return;
    panelRoot = panelEl;
    const tab = normalizeTab(view);
    panelEl.innerHTML = renderShell(tab);
    bindPanelOnce();
    const bodyHost = panelEl.querySelector(".reference-workspace__body");
    renderBody(tab, bodyHost);
  }

  function refreshIfOpen() {
    if (!panelRoot || !api?.isReferenceOpen?.()) return;
    const tab = api.getReferenceTab?.() || "overview";
    const bodyHost = panelRoot.querySelector(".reference-workspace__body");
    if (bodyHost && normalizeTab(tab) === "overview") renderBody("overview", bodyHost);
  }

  function renderPinEnricher(entity, bodyEl) {
    if (!entity?.id || !QUICK_TYPES.has((entity.type || "").toLowerCase())) return;
    const pinned = isPinned(entity.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "entity-pin-btn" + (pinned ? " is-pinned" : "");
    btn.dataset.pinEntity = entity.id;
    btn.setAttribute(
      "aria-label",
      pinned ? t("referenceUnpin", "Unpin from Reference") : t("referencePin", "Pin to Reference")
    );
    btn.innerHTML = pinned
      ? `<span aria-hidden="true">★</span> ${escapeHtml(t("referencePinnedLabel", "Pinned"))}`
      : `<span aria-hidden="true">☆</span> ${escapeHtml(t("referencePin", "Pin to Reference"))}`;
    btn.addEventListener("click", () => {
      const nowPinned = togglePin(entity.id, entity.type);
      btn.classList.toggle("is-pinned", nowPinned);
      btn.setAttribute(
        "aria-label",
        nowPinned ? t("referenceUnpin", "Unpin from Reference") : t("referencePin", "Pin to Reference")
      );
      btn.innerHTML = nowPinned
        ? `<span aria-hidden="true">★</span> ${escapeHtml(t("referencePinnedLabel", "Pinned"))}`
        : `<span aria-hidden="true">☆</span> ${escapeHtml(t("referencePin", "Pin to Reference"))}`;
      refreshIfOpen();
    });
    const actions = document.createElement("div");
    actions.className = "entity-modal__ref-actions";
    actions.appendChild(btn);
    bodyEl.prepend(actions);
  }

  function init(options = {}) {
    campaignId = options.campaignId;
    api = options.api || {};
    labels = options.labels || window.I18N || {};
    if (window.EntityUI?.addOpenListener) EntityUI.addOpenListener(trackEntityOpen);
    if (window.EntityUI?.addModalEnricher) EntityUI.addModalEnricher(renderPinEnricher);
  }

  return {
    init,
    mount,
    normalizeTab,
    trackEntityOpen,
    refreshIfOpen,
    getSceneContextEntities,
    VIEWS,
    VIEW_IDS
  };
})();
