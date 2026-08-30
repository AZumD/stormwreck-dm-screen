/** Sidebar + map panel collapse / expand modes — independent of campaign-app init */
window.LayoutPanels = (function () {
  "use strict";

  const SIDEBAR_WIDTH = "268px";
  const MAP_WIDTH = "300px";
  const MAP_EXPANDED_WIDTH = "40vw";

  /** @type {"sidebar" | "expanded" | "combat" | "workspace"} */
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

  function isWideMapMode() {
    return mapMode === "expanded" || mapMode === "combat" || mapMode === "workspace";
  }

  function syncMapColumn() {
    const app = appEl();
    const body = document.body;
    if (!app || body.classList.contains("map-panel-collapsed")) return;

    if (isWideMapMode()) {
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
    const isWide = isWideMapMode();

    if (panel) panel.dataset.mapMode = mapMode;
    body.dataset.mapMode = mapMode;
    body.classList.toggle("map-mode-expanded", mapMode === "expanded");
    body.classList.toggle("map-mode-combat", mapMode === "combat");
    body.classList.toggle("map-mode-workspace", mapMode === "workspace");
    document.documentElement.classList.toggle("map-mode-expanded", mapMode === "expanded");
    document.documentElement.classList.toggle("map-mode-combat", mapMode === "combat");
    document.documentElement.classList.toggle("map-mode-workspace", mapMode === "workspace");

    if (expandBtn) {
      const hideExpand = mapMode === "workspace" || body.classList.contains("workspace-map");
      expandBtn.hidden = hideExpand;
      expandBtn.setAttribute("aria-pressed", isWide && mapMode !== "workspace" ? "true" : "false");
      expandBtn.textContent = mapMode === "expanded" || mapMode === "combat"
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
   * - sidebar: default right column (Party/Music utility in Run/Prep)
   * - expanded: legacy full-content widen (shim; Map workspace preferred)
   * - combat: reserved — same shell as expanded for now
   * - workspace: first-class Map workspace (campaign activeWorkspace === "map")
   */
  function setMapMode(next, save = false) {
    const allowed =
      next === "sidebar" || next === "expanded" || next === "combat" || next === "workspace";
    if (!allowed) return;
    mapMode = next;

    const body = document.body;
    if (mapMode !== "sidebar" && body.classList.contains("map-panel-collapsed")) {
      setMapCollapsed(false, false);
    }

    syncMapColumn();
    syncExpandChrome();

    if (save) {
      /* Expanded/combat/workspace are session UI — workspace also persisted via CampaignPrefs.workspace */
    }
  }

  /**
   * Sync layout shell with campaign Run | Prep | Map | Session workspace.
   * @param {"run"|"prep"|"map"|"session"} workspace
   * @param {{ panelOpen?: boolean }} [opts]
   */
  function setCampaignWorkspace(workspace, opts = {}) {
    const body = document.body;
    const panelOpen = !!opts.panelOpen;
    body.classList.toggle("workspace-map--panel", workspace === "map" && panelOpen);
    body.classList.toggle("workspace-session--reference", workspace === "session" && panelOpen);

    if (workspace === "map") {
      setMapCollapsed(false, false);
      if (panelOpen) {
        /* Reference/Session: show main column; map rail becomes utility width */
        setMapMode("sidebar");
      } else {
        setMapMode("workspace");
      }
    } else if (mapMode === "workspace" || mapMode === "expanded" || mapMode === "combat") {
      setMapMode("sidebar");
    } else {
      syncExpandChrome();
      syncMapColumn();
    }

    window.MapPanel?.onWorkspaceChange?.(workspace);
  }

  function toggleMapExpanded() {
    if (document.body.dataset.workspace === "map") return;
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

    /* Map workspace owns the canvas — do not collapse it away */
    if (collapsed && mapMode === "workspace") return;

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
      collapse.setAttribute(
        "aria-label",
        collapsed ? t.showMap || "Show utilities" : t.hideMap || "Hide utilities"
      );
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
      /* Legacy toggle — prefer Map workspace; still toggles utility rail if present */
      if (typeof window.CampaignWorkspace?.set === "function" && !document.getElementById("map-panel-toggle")?.dataset?.legacyRail) {
        /* If toggle removed from DOM this branch is unused */
      }
      setMapCollapsed(!document.body.classList.contains("map-panel-collapsed"));
      return;
    }

    if (button.id === "map-panel-collapse") {
      if (mapMode === "workspace") {
        if (typeof window.CampaignWorkspace?.set === "function") {
          window.CampaignWorkspace.set("run");
        }
        return;
      }
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
      if (isWideMapMode()) syncExpandChrome();
    });
  }

  return {
    init,
    setNavCollapsed,
    setMapCollapsed,
    setMapMode,
    getMapMode,
    toggleMapExpanded,
    setCampaignWorkspace,
    applyChromeFromPrefs
  };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => LayoutPanels.init());
} else {
  LayoutPanels.init();
}
