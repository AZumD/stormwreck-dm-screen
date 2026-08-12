/** Sidebar + map panel collapse — independent of campaign-app init */
window.LayoutPanels = (function () {
  "use strict";

  const SIDEBAR_WIDTH = "268px";
  const MAP_WIDTH = "300px";
  const MAP_EXPANDED_WIDTH = "40vw";

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

  function syncMapColumn() {
    const app = appEl();
    const body = document.body;
    if (!app || body.classList.contains("map-panel-collapsed")) return;

    const expanded = body.classList.contains("sidebar-collapsed");
    app.style.setProperty("--map-col", expanded ? MAP_EXPANDED_WIDTH : MAP_WIDTH);
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

    if (save) localStorage.setItem(sidebarStorageKey(), collapsed ? "1" : "0");
  }

  function setMapCollapsed(collapsed, save = true) {
    const body = document.body;
    const root = document.documentElement;
    const app = appEl();
    const t = labels();

    body.classList.toggle("map-panel-collapsed", collapsed);
    root.classList.toggle("map-panel-collapsed", collapsed);
    body.dataset.mapCollapsed = collapsed ? "true" : "false";

    if (app) {
      app.style.setProperty("--map-col", collapsed ? "0px" : body.classList.contains("sidebar-collapsed") ? MAP_EXPANDED_WIDTH : MAP_WIDTH);
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

    if (save) localStorage.setItem(mapStorageKey(), collapsed ? "1" : "0");
  }

  function handleClick(event) {
    const button = event.target.closest(
      "#sidebar-toggle, #sidebar-collapse, #map-panel-toggle, #map-panel-collapse"
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
      setMapCollapsed(true);
    }
  }

  function init() {
    const app = appEl();
    if (!app) return;

    app.style.setProperty("--nav-col", SIDEBAR_WIDTH);
    app.style.setProperty("--map-col", MAP_WIDTH);

    document.addEventListener("click", handleClick);

    const navCollapsed = localStorage.getItem(sidebarStorageKey()) === "1";
    const mapCollapsed = localStorage.getItem(mapStorageKey()) === "1";

    setMapCollapsed(mapCollapsed, false);
    setNavCollapsed(navCollapsed, false);
  }

  return { init, setNavCollapsed, setMapCollapsed };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => LayoutPanels.init());
} else {
  LayoutPanels.init();
}
