/** Sidebar + map panel collapse / expand modes — independent of campaign-app init */
window.LayoutPanels = (function () {
  "use strict";

  const SIDEBAR_WIDTH = "268px";
  const MAP_WIDTH = "300px";
  const MAP_EXPANDED_WIDTH = "40vw";

  /** @type {"sidebar" | "expanded" | "combat"} */
  let mapMode = "sidebar";

  function campaignId() {
    return document.body.dataset.campaignId || "stormwreck-isle";
  }

  function sidebarStorageKey() {
    return `${campaignId()}-sidebar-collapsed`;
  }

  function mapStorageKey() {
    return `${campaignId()}-map-panel-collapsed`;
  }

  function labels() {
    return window.I18N || {};
  }

  function appEl() {
    return document.querySelector(".app");
  }

  function getMapMode() {
    return mapMode;
  }

  function syncMapColumn() {
    const app = appEl();
    const body = document.body;
    if (!app || body.classList.contains("map-panel-collapsed")) return;

    if (mapMode === "expanded" || mapMode === "combat") {
      app.style.setProperty("--map-col", "minmax(0, 1fr)");
      return;
    }

    const navCollapsed = body.classList.contains("sidebar-collapsed");
    app.style.setProperty("--map-col", navCollapsed ? MAP_EXPANDED_WIDTH : MAP_WIDTH);
  }

  function syncExpandChrome() {
    const body = document.body;
    const panel = document.getElementById("map-panel");
    const expandBtn = document.getElementById("map-expand-btn");
    const titleEl = document.getElementById("map-expanded-title");
    const select = document.getElementById("map-select");
    const t = labels();
    const isWide = mapMode === "expanded" || mapMode === "combat";

    if (panel) panel.dataset.mapMode = mapMode;
    body.dataset.mapMode = mapMode;
    body.classList.toggle("map-mode-expanded", isWide);
    body.classList.toggle("map-mode-combat", mapMode === "combat");
    document.documentElement.classList.toggle("map-mode-expanded", isWide);
    document.documentElement.classList.toggle("map-mode-combat", mapMode === "combat");

    if (expandBtn) {
      expandBtn.setAttribute("aria-pressed", isWide ? "true" : "false");
      expandBtn.textContent = isWide
        ? t.collapseMap || "Collapse"
        : t.expandMap || "Expand";
    }

    if (titleEl) {
      if (isWide && select) {
        const label = select.options[select.selectedIndex]?.textContent || select.value || "Map";
        titleEl.textContent = label;
        titleEl.hidden = false;
      } else {
        titleEl.hidden = true;
        titleEl.textContent = "";
      }
    }

    window.MediaBar?.onLayoutChange?.();
    window.MapPanel?.onLayoutChange?.();
  }

  /**
   * Map rail display mode.
   * - sidebar: default right column
   * - expanded: ~full content area (no combat chrome)
   * - combat: reserved — same shell as expanded for now; Combat Mode builds on this later
   */
  function setMapMode(next, save = false) {
    const allowed = next === "sidebar" || next === "expanded" || next === "combat";
    if (!allowed) return;
    mapMode = next;

    const body = document.body;
    if (mapMode !== "sidebar" && body.classList.contains("map-panel-collapsed")) {
      setMapCollapsed(false, false);
    }

    syncMapColumn();
    syncExpandChrome();

    if (save) {
      /* Expanded/combat are session UI only — do not persist across reload */
    }
  }

  function toggleMapExpanded() {
    if (mapMode === "expanded" || mapMode === "combat") setMapMode("sidebar");
    else setMapMode("expanded");
  }

  function setNavCollapsed(collapsed, save = true) {
    const body = document.body;
    const root = document.documentElement;
    const app = appEl();
    const t = labels();

    body.classList.toggle("sidebar-collapsed", collapsed);
    root.classList.toggle("sidebar-collapsed", collapsed);
    body.dataset.navCollapsed = collapsed ? "true" : "false";

    if (app) {
      app.style.setProperty("--nav-col", collapsed ? "0px" : SIDEBAR_WIDTH);
      syncMapColumn();
    }

    const toggle = document.getElementById("sidebar-toggle");
    const collapse = document.getElementById("sidebar-collapse");

    if (toggle) {
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.setAttribute("aria-label", collapsed ? t.showNav || "Show navigation" : t.hideNav || "Hide navigation");
      toggle.classList.toggle("active", !collapsed);
    }

    if (collapse) {
      collapse.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapse.setAttribute("aria-label", collapsed ? t.showNav || "Show navigation" : t.hideNav || "Hide navigation");
    }

    if (save) {
      localStorage.setItem(sidebarStorageKey(), collapsed ? "1" : "0");
      if (window.CampaignPrefs?.patch) {
        CampaignPrefs.patch(campaignId(), { sidebarCollapsed: collapsed });
      }
    }
  }

  function setMapCollapsed(collapsed, save = true) {
    const body = document.body;
    const root = document.documentElement;
    const app = appEl();
    const t = labels();

    if (collapsed && (mapMode === "expanded" || mapMode === "combat")) {
      setMapMode("sidebar");
    }

    body.classList.toggle("map-panel-collapsed", collapsed);
    root.classList.toggle("map-panel-collapsed", collapsed);
    body.dataset.mapCollapsed = collapsed ? "true" : "false";

    if (app) {
      if (collapsed) {
        app.style.setProperty("--map-col", "0px");
      } else {
        syncMapColumn();
      }
    }

    const toggle = document.getElementById("map-panel-toggle");
    const collapse = document.getElementById("map-panel-collapse");

    if (toggle) {
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.setAttribute("aria-label", collapsed ? t.showMap || "Show map" : t.hideMap || "Hide map");
      toggle.classList.toggle("active", !collapsed);
    }

    if (collapse) {
      collapse.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapse.setAttribute("aria-label", collapsed ? t.showMap || "Show map" : t.hideMap || "Hide map");
    }

    if (save) {
      localStorage.setItem(mapStorageKey(), collapsed ? "1" : "0");
      if (window.CampaignPrefs?.patch) {
        CampaignPrefs.patch(campaignId(), { mapPanelCollapsed: collapsed });
      }
    }
  }

  function handleClick(event) {
    const button = event.target.closest(
      "#sidebar-toggle, #sidebar-collapse, #map-panel-toggle, #map-panel-collapse, #map-expand-btn"
    );
    if (!button) return;

    if (button.id === "sidebar-toggle") {
      setNavCollapsed(!document.body.classList.contains("sidebar-collapsed"));
      return;
    }

    if (button.id === "sidebar-collapse") {
      setNavCollapsed(true);
      return;
    }

    if (button.id === "map-panel-toggle") {
      setMapCollapsed(!document.body.classList.contains("map-panel-collapsed"));
      return;
    }

    if (button.id === "map-panel-collapse") {
      if (mapMode === "expanded" || mapMode === "combat") {
        setMapMode("sidebar");
        return;
      }
      setMapCollapsed(true);
      return;
    }

    if (button.id === "map-expand-btn") {
      toggleMapExpanded();
    }
  }

  function applyChromeFromPrefs(prefs) {
    if (!prefs || typeof prefs !== "object") return;
    if (typeof prefs.sidebarCollapsed === "boolean") {
      setNavCollapsed(prefs.sidebarCollapsed, false);
      localStorage.setItem(sidebarStorageKey(), prefs.sidebarCollapsed ? "1" : "0");
    }
    if (typeof prefs.mapPanelCollapsed === "boolean") {
      setMapCollapsed(prefs.mapPanelCollapsed, false);
      localStorage.setItem(mapStorageKey(), prefs.mapPanelCollapsed ? "1" : "0");
    }
  }

  function init() {
    const app = appEl();
    if (!app) return;

    app.style.setProperty("--nav-col", SIDEBAR_WIDTH);
    app.style.setProperty("--map-col", MAP_WIDTH);

    document.addEventListener("click", handleClick);

    const prefs = window.CampaignPrefs?.get?.(campaignId());
    const navCollapsed =
      typeof prefs?.sidebarCollapsed === "boolean"
        ? prefs.sidebarCollapsed
        : localStorage.getItem(sidebarStorageKey()) === "1";
    const mapCollapsed =
      typeof prefs?.mapPanelCollapsed === "boolean"
        ? prefs.mapPanelCollapsed
        : localStorage.getItem(mapStorageKey()) === "1";

    mapMode = "sidebar";
    setMapCollapsed(mapCollapsed, false);
    setNavCollapsed(navCollapsed, false);
    syncExpandChrome();

    document.getElementById("map-select")?.addEventListener("change", () => {
      if (mapMode === "expanded" || mapMode === "combat") syncExpandChrome();
    });
  }

  return {
    init,
    setNavCollapsed,
    setMapCollapsed,
    setMapMode,
    getMapMode,
    toggleMapExpanded,
    applyChromeFromPrefs
  };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => LayoutPanels.init());
} else {
  LayoutPanels.init();
}
