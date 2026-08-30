/**
 * Unified Compendium shell — category rail + single CatalogueApp host.
 */
window.CompendiumApp = (function () {
  "use strict";

  const STORAGE_KEY = "compendiumLastType";
  const DEFAULT_TYPE = "npc";

  /** User-facing nav labels (internal ids unchanged). */
  const LABELS = {
    pc: "PCs",
    npc: "NPCs",
    monster: "Monsters",
    location: "Locations",
    item: "Items",
    race: "Species",
    class: "Classes",
    skill: "Skills",
    feature: "Features",
    spell: "Spells",
    source: "Sources",
    music: "Music"
  };

  /** @type {{ id: string, label: string, types: string[] }[]} */
  const GROUPS = [
    { id: "characters", label: "Characters", types: ["pc", "npc"] },
    { id: "creatures", label: "Creatures", types: ["monster"] },
    { id: "world", label: "World", types: ["location", "item"] },
    { id: "rules", label: "Rules", types: ["race", "class", "skill", "feature", "spell", "source"] },
    { id: "media", label: "Media", types: ["music"] }
  ];

  const ALL_TYPES = GROUPS.flatMap((g) => g.types);

  function validType(type) {
    return typeof type === "string" && ALL_TYPES.includes(type);
  }

  function readStoredType() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return validType(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  function storeType(type) {
    try {
      localStorage.setItem(STORAGE_KEY, type);
    } catch {
      /* ignore */
    }
  }

  function parseRoute() {
    const params = new URLSearchParams(window.location.search);
    let type = params.get("type") || "";
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (!type && hash) {
      const parts = hash.split("/");
      type = parts[0] || "";
    }
    if (!validType(type)) type = readStoredType() || DEFAULT_TYPE;
    const id =
      params.get("id") ||
      (hash.includes("/") ? decodeURIComponent(hash.split("/").slice(1).join("/")) : "") ||
      "";
    return { type, id: id.trim() };
  }

  function buildUrl(type, id) {
    let url = `/dm/compendium/?type=${encodeURIComponent(type)}`;
    if (id) url += `&id=${encodeURIComponent(id)}`;
    return url;
  }

  function syncUrl(type, id, replace) {
    const url = buildUrl(type, id);
    const state = { compendiumType: type, compendiumId: id || null };
    if (replace) window.history.replaceState(state, "", url);
    else window.history.pushState(state, "", url);
  }

  function groupForType(type) {
    return GROUPS.find((g) => g.types.includes(type)) || null;
  }

  function renderNav(navEl, activeType) {
    if (!navEl) return;
    const activeGroup = groupForType(activeType);
    navEl.innerHTML = GROUPS.map((group) => {
      const links = group.types
        .map((type) => {
          const isActive = type === activeType;
          return `<button type="button" class="compendium-nav__link${isActive ? " is-active" : ""}" data-type="${type}" aria-current="${isActive ? "page" : "false"}">${LABELS[type] || type}</button>`;
        })
        .join("");
      const openClass = activeGroup?.id === group.id ? " is-open" : "";
      return `
        <div class="compendium-nav__group${openClass}" data-group="${group.id}">
          <div class="compendium-nav__heading" aria-hidden="true">${group.label}</div>
          <div class="compendium-nav__items">${links}</div>
        </div>`;
    }).join("");
  }

  function setActiveNav(navEl, type) {
    navEl?.querySelectorAll("[data-type]").forEach((btn) => {
      const active = btn.dataset.type === type;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-current", active ? "page" : "false");
    });
    navEl?.querySelectorAll("[data-group]").forEach((groupEl) => {
      const g = GROUPS.find((x) => x.id === groupEl.dataset.group);
      groupEl.classList.toggle("is-open", g?.types.includes(type) || false);
    });
  }

  function setPageTitle(type) {
    const titleEl = document.getElementById("cat-title");
    if (titleEl) titleEl.textContent = LABELS[type] || type;
    document.title = `${LABELS[type] || type} — Compendium — DM Library`;
  }

  async function selectType(type, options = {}) {
    if (!validType(type)) type = DEFAULT_TYPE;
    const { replaceHistory = false, entryId = "", skipUrl = false } = options;

    setActiveNav(document.getElementById("compendium-nav"), type);
    setPageTitle(type);
    storeType(type);

    if (!skipUrl) syncUrl(type, entryId, replaceHistory);

    if (type === "music") document.body.classList.add("catalogue-page--music");
    else document.body.classList.remove("catalogue-page--music");

    await window.CatalogueApp.setType(type, {
      titleOverride: LABELS[type],
      entryId: entryId || undefined
    });

    const navToggle = document.getElementById("compendium-nav-toggle");
    if (navToggle && window.matchMedia("(max-width: 900px)").matches) {
      document.body.classList.remove("compendium-nav-open");
    }
  }

  function bindNav(navEl) {
    navEl?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-type]");
      if (!btn) return;
      const type = btn.dataset.type;
      if (!validType(type) || type === window.CatalogueApp.getCurrentType()) return;
      selectType(type).catch((err) => console.error("Compendium navigation failed", err));
    });
  }

  function bindNavToggle() {
    const toggle = document.getElementById("compendium-nav-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("compendium-nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (!document.body.classList.contains("compendium-nav-open")) return;
      const layout = document.querySelector(".compendium-layout");
      if (layout && !layout.contains(e.target)) {
        document.body.classList.remove("compendium-nav-open");
      }
    });
  }

  async function init() {
    const navEl = document.getElementById("compendium-nav");
    const route = parseRoute();
    renderNav(navEl, route.type);
    bindNav(navEl);
    bindNavToggle();

    window.addEventListener("popstate", () => {
      const next = parseRoute();
      selectType(next.type, { entryId: next.id, skipUrl: true }).catch((err) =>
        console.error("Compendium popstate failed", err)
      );
    });

    await selectType(route.type, { replaceHistory: true, entryId: route.id });
  }

  return {
    init,
    selectType,
    GROUPS,
    LABELS,
    ALL_TYPES,
    validType,
    DEFAULT_TYPE,
    _test: { parseRoute, buildUrl, validType, groupForType }
  };
})();
