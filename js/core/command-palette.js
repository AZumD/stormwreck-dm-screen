/**
 * Universal campaign command palette: catalogue entities, scenes, workspaces,
 * session/reference destinations, and live DM commands.
 */
window.CommandPalette = (function () {
  "use strict";

  const { escapeHtml } = ContentParser;

  let root = null;
  let input = null;
  let resultsEl = null;
  let api = null;
  let labels = {};
  let staticItems = [];
  let sceneItems = [];
  let searchTimer = null;
  let hits = [];
  let activeIdx = -1;
  let queryToken = 0;
  let bound = false;

  const DEFAULT_IDS = ["current-scene", "workspace-map", "workspace-session", "reference-overview", "party", "music"];
  const TYPE_ORDER = { entity: 0, scene: 1, workspace: 2, session: 3, reference: 4, command: 5 };
  const GROUP_LABELS = {
    entity: "Entities",
    scene: "Scenes",
    workspace: "Workspaces",
    session: "Session",
    reference: "Reference",
    command: "Commands"
  };

  function t(key, fallback) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let value = labels;
      for (const part of parts) value = value?.[part];
      if (value) return value;
    }
    return labels[key] || fallback || key;
  }

  function typeLabel(type, entityType) {
    if (type === "entity") return labels.typeLabels?.[entityType] || entityType || "Entity";
    if (type === "scene") return t("commandPaletteScene", "Scene");
    if (type === "workspace") return t("commandPaletteWorkspace", "Workspace");
    if (type === "session") return t("commandPaletteSession", "Session");
    if (type === "reference") return t("commandPaletteReference", "Reference");
    return t("commandPaletteCommand", "Command");
  }

  function buildStaticItems() {
    staticItems = [
      { type: "workspace", id: "run", label: "Run", subtitle: t("commandPaletteWorkspace", "Workspace"), keywords: ["run", "play"] },
      { type: "workspace", id: "prep", label: "Prep", subtitle: t("commandPaletteWorkspace", "Workspace"), keywords: ["prep", "document", "edit"] },
      { type: "workspace", id: "map", label: "Map", subtitle: t("commandPaletteWorkspace", "Workspace"), keywords: ["map", "maps"] },
      { type: "workspace", id: "session", label: "Session", subtitle: t("commandPaletteWorkspace", "Workspace"), keywords: ["session"] },
      { type: "session", id: "notes", label: t("headings.notes", "Session Notes"), subtitle: t("commandPaletteSession", "Session"), keywords: ["notes", "session notes"] },
      { type: "session", id: "history", label: t("commandPaletteLog", "Session Log"), subtitle: t("commandPaletteSession", "Session"), keywords: ["log", "history"] },
      { type: "session", id: "chronicle", label: t("headings.chronicle", "Chronicle"), subtitle: t("commandPaletteSession", "Session"), keywords: ["chronicle", "story"] },
      { type: "session", id: "checklist", label: t("commandPaletteProgress", "Progress"), subtitle: t("commandPaletteSession", "Session"), keywords: ["progress", "checklist"] },
      { type: "reference", id: "overview", label: t("referenceTitle", "Reference"), subtitle: t("commandPaletteReference", "Reference"), keywords: ["reference", "overview"] },
      { type: "reference", id: "npcs", label: t("commandPaletteRefNpcs", "Reference: NPCs"), subtitle: t("commandPaletteReference", "Reference"), keywords: ["reference", "npcs", "npc"] },
      { type: "reference", id: "monsters", label: t("commandPaletteRefMonsters", "Reference: Monsters"), subtitle: t("commandPaletteReference", "Reference"), keywords: ["reference", "monsters", "monster"] },
      { type: "reference", id: "locations", label: t("commandPaletteRefLocations", "Reference: Locations"), subtitle: t("commandPaletteReference", "Reference"), keywords: ["reference", "locations", "location"] },
      { type: "command", id: "current-scene", label: t("jumpToCurrentScene", "Current Scene"), subtitle: t("commandPaletteCommand", "Command"), keywords: ["current", "current scene", "scene"] },
      { type: "command", id: "party", label: t("commandPaletteParty", "Open Party"), subtitle: t("commandPaletteCommand", "Command"), keywords: ["party", "roster", "pcs"] },
      { type: "command", id: "music", label: t("commandPaletteMusic", "Open Music"), subtitle: t("commandPaletteCommand", "Command"), keywords: ["music", "ambience", "audio"] },
      { type: "command", id: "campaign-time", label: t("commandPaletteCampaignTime", "Campaign Time"), subtitle: t("commandPaletteCommand", "Command"), keywords: ["time", "clock", "day", "campaign time"] }
    ];
  }

  function refreshSceneIndex() {
    if (!api?.getSections) {
      sceneItems = [];
      return;
    }
    const sections = api.getSections() || [];
    const groups = api.getGroups?.() || [];
    const groupTitle = new Map(groups.map((g) => [g.id, g.title || g.id]));
    sceneItems = sections.map((section) => {
      const title = api.getSectionTitle?.(section.id) || section.title || section.id;
      const group = section.groupId ? groupTitle.get(section.groupId) : "";
      return {
        type: "scene",
        id: section.id,
        label: title,
        subtitle: group ? `${t("commandPaletteScene", "Scene")} · ${group}` : t("commandPaletteScene", "Scene"),
        keywords: [section.id, section.groupId, group].filter(Boolean)
      };
    });
  }

  function rankText(label, keywords, q) {
    const text = String(label || "").toLowerCase();
    const qLower = q.toLowerCase();
    if (!qLower) return 50;
    if (text === qLower) return 0;
    if (text.startsWith(qLower)) return 1;
    const words = text.split(/\s+/);
    if (words.some((w) => w.startsWith(qLower))) return 2;
    if (text.includes(qLower)) return 3;
    const hay = [text, ...(keywords || []).map(String)].join(" ").toLowerCase();
    if (hay.includes(qLower)) return 4;
    return 99;
  }

  function entityItems(q) {
    const entities = api?.getEntities?.() || [];
    return entities
      .map((entity) => {
        const rank = rankText(entity.name, [entity.summary, entity.details, entity.type, ...(entity.tags || [])], q);
        if (rank >= 99) return null;
        return {
          type: "entity",
          id: entity.id,
          entityType: entity.type,
          label: entity.name || entity.id,
          subtitle: entity.summary || "",
          rank
        };
      })
      .filter(Boolean);
  }

  function staticMatches(q) {
    return staticItems
      .map((item) => {
        const rank = rankText(item.label, [...(item.keywords || []), item.id, item.subtitle], q);
        if (rank >= 99) return null;
        return { ...item, rank };
      })
      .filter(Boolean);
  }

  function sceneMatches(q) {
    return sceneItems
      .map((item) => {
        const rank = rankText(item.label, item.keywords, q);
        if (rank >= 99) return null;
        return { ...item, rank };
      })
      .filter(Boolean);
  }

  function sortHits(list) {
    return list.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      const ta = TYPE_ORDER[a.type] ?? 9;
      const tb = TYPE_ORDER[b.type] ?? 9;
      if (ta !== tb) return ta - tb;
      return String(a.label).localeCompare(String(b.label));
    });
  }

  function findMatches(query) {
    const q = query.trim();
    if (!q) return defaultHits();
    const merged = sortHits([...entityItems(q), ...sceneMatches(q), ...staticMatches(q)]);
    return merged.slice(0, 24);
  }

  function defaultHits() {
    const byKey = new Map(staticItems.map((item) => [`${item.type}:${item.id}`, item]));
    return DEFAULT_IDS.map((key) => {
      if (key.startsWith("workspace-")) {
        const id = key.replace("workspace-", "");
        return byKey.get(`workspace:${id}`);
      }
      if (key.startsWith("reference-")) {
        const id = key.replace("reference-", "");
        return byKey.get(`reference:${id}`);
      }
      return byKey.get(`command:${key}`);
    }).filter(Boolean);
  }

  function hide() {
    if (!resultsEl) return;
    resultsEl.classList.add("hidden");
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    hits = [];
    activeIdx = -1;
    input?.setAttribute("aria-expanded", "false");
    root?.classList.remove("is-open");
  }

  function show() {
    if (!resultsEl || !input) return;
    root?.classList.add("is-open");
    resultsEl.classList.remove("hidden");
    resultsEl.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function renderResults(query) {
    if (!resultsEl) return;
    const token = ++queryToken;
    const q = query.trim();
    hits = findMatches(query);
    activeIdx = hits.length ? 0 : -1;

    if (token !== queryToken) return;

    if (!hits.length) {
      resultsEl.innerHTML = `<li class="catalogue-search__empty" role="option">${escapeHtml(t("searchNoResults", "No results for"))} “${escapeHtml(q)}”</li>`;
      show();
      return;
    }

    let html = "";
    let lastType = null;
    hits.forEach((hit, i) => {
      if (q && hit.type !== lastType) {
        lastType = hit.type;
        html += `<li class="catalogue-search__group" role="presentation">${escapeHtml(GROUP_LABELS[hit.type] || hit.type)}</li>`;
      }
      const active = i === activeIdx ? " is-active" : "";
      html += `
        <li class="catalogue-search__item${active}" role="option" data-idx="${i}" aria-selected="${i === activeIdx ? "true" : "false"}">
          <span class="catalogue-search__type">${escapeHtml(typeLabel(hit.type, hit.entityType))}</span>
          <span class="catalogue-search__name">${escapeHtml(hit.label)}</span>
          <span class="catalogue-search__meta">${escapeHtml(hit.subtitle || "")}</span>
        </li>`;
    });

    resultsEl.innerHTML = html;
    show();
  }

  function scheduleRender() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderResults(input?.value || ""), 80);
  }

  function highlightActive() {
    if (!resultsEl) return;
    resultsEl.querySelectorAll(".catalogue-search__item").forEach((el) => {
      const idx = Number(el.dataset.idx);
      const on = idx === activeIdx;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      if (on) el.scrollIntoView({ block: "nearest" });
    });
  }

  function activateHit(idx) {
    const hit = hits[idx];
    if (!hit) return;
    hide();
    if (input) input.value = "";

    switch (hit.type) {
      case "entity":
        api?.openEntity?.(hit.id);
        break;
      case "scene":
        api?.navigateToScene?.(hit.id);
        break;
      case "workspace":
        api?.setWorkspace?.(hit.id, { preservePanel: false });
        break;
      case "session":
        api?.setWorkspace?.("session", { sessionTab: hit.id, preservePanel: false });
        break;
      case "reference":
        api?.showReference?.(hit.id);
        break;
      case "command":
        if (hit.id === "current-scene") api?.jumpToCurrentScene?.();
        else if (hit.id === "party") api?.openParty?.();
        else if (hit.id === "music") api?.openMusic?.();
        else if (hit.id === "campaign-time") api?.openCampaignTime?.();
        break;
      default:
        break;
    }
  }

  function openPalette() {
    if (!input) return;
    input.focus();
    input.select();
    renderResults(input.value || "");
  }

  function isTypingContext(el) {
    if (!el || el === input) return false;
    const tag = el.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "SELECT") return true;
    if (tag === "INPUT") {
      const type = (el.type || "text").toLowerCase();
      return type !== "search";
    }
    if (el.isContentEditable) return true;
    return false;
  }

  function bindOnce() {
    if (bound || !input || !resultsEl) return;
    bound = true;

    if (labels.commandPalettePlaceholder) input.placeholder = labels.commandPalettePlaceholder;
    if (labels.commandPaletteLabel) input.setAttribute("aria-label", labels.commandPaletteLabel);

    input.addEventListener("input", scheduleRender);
    input.addEventListener("focus", () => {
      if (!hits.length) renderResults(input.value || "");
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hide();
        input.blur();
        return;
      }
      if (e.key === "ArrowDown") {
        if (!hits.length) renderResults(input.value || "");
        if (!hits.length) return;
        e.preventDefault();
        activeIdx = (activeIdx + 1) % hits.length;
        highlightActive();
        return;
      }
      if (e.key === "ArrowUp") {
        if (!hits.length) return;
        e.preventDefault();
        activeIdx = (activeIdx - 1 + hits.length) % hits.length;
        highlightActive();
        return;
      }
      if (e.key === "Enter") {
        if (activeIdx >= 0 && hits[activeIdx]) {
          e.preventDefault();
          activateHit(activeIdx);
        }
      }
    });

    resultsEl.addEventListener("mousedown", (e) => {
      const item = e.target.closest(".catalogue-search__item[data-idx]");
      if (!item) return;
      e.preventDefault();
      activateHit(Number(item.dataset.idx));
    });

    document.addEventListener("pointerdown", (e) => {
      if (!root?.classList.contains("is-open")) return;
      if (root.contains(e.target)) return;
      hide();
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        if (isTypingContext(document.activeElement)) return;
        e.preventDefault();
        openPalette();
      }
    });
  }

  function init(options = {}) {
    root = options.root || document.getElementById("catalogue-search");
    input = options.input || document.getElementById("search");
    resultsEl = options.results || document.getElementById("catalogue-search-results");
    api = options.api || {};
    labels = options.labels || window.I18N || {};
    buildStaticItems();
    refreshSceneIndex();
    bindOnce();
  }

  return {
    init,
    refreshSceneIndex,
    open: openPalette,
    hide,
    findMatches
  };
})();
