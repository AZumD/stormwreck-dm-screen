/** Fullscreen map in a new tab + collapsible tools drawer on the fullscreen page */
window.MapFullscreen = (function () {
  "use strict";

  function pageCampaignId() {
    return (
      document.body.dataset.campaignId ||
      window.ADVENTURE?.meta?.id ||
      "stormwreck-isle"
    );
  }

  function drawerStorageKey() {
    return `${pageCampaignId()}-map-fullscreen-drawer-collapsed`;
  }

  function campaignRouteKey(campaignId) {
    if (campaignId === "stormwreck-isle") return "stormwreck-isle";
    if (location.pathname.includes("/sandbox/")) return "sandbox";
    return campaignId;
  }

  function buildFullscreenUrl(campaignId, activeMapId) {
    const routeKey = campaignRouteKey(campaignId);
    const params = new URLSearchParams({ campaign: routeKey });
    if (activeMapId) params.set("map", activeMapId);
    if (routeKey === "sandbox") {
      const sandboxId =
        campaignId && campaignId !== "sandbox"
          ? campaignId
          : new URLSearchParams(location.search).get("id");
      if (sandboxId) params.set("id", sandboxId);
    }
    return `/campaigns/map-fullscreen/index.html?${params}`;
  }

  function openInNewTab() {
    const campaignId = pageCampaignId();
    const activeMap =
      window.MapPanel?.getActiveMapId?.() ||
      window.CampaignMapState?.get(campaignId)?.activeMap ||
      "";
    window.open(buildFullscreenUrl(campaignId, activeMap), "_blank", "noopener,noreferrer");
  }

  function setDrawerCollapsed(drawer, toggle, collapsed) {
    drawer.dataset.collapsed = collapsed ? "true" : "false";
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.textContent = collapsed ? "Map tools" : "Hide tools";
    try {
      localStorage.setItem(drawerStorageKey(), collapsed ? "true" : "false");
    } catch {
      /* ignore */
    }
  }

  let drawerInitialized = false;

  function initDrawer() {
    const drawer = document.getElementById("map-fullscreen-drawer");
    const toggle = document.getElementById("map-fullscreen-drawer-toggle");
    if (!drawer || !toggle || drawerInitialized) return;
    drawerInitialized = true;

    let collapsed = false;
    try {
      collapsed = localStorage.getItem(drawerStorageKey()) === "true";
    } catch {
      /* ignore */
    }
    setDrawerCollapsed(drawer, toggle, collapsed);

    toggle.addEventListener("click", () => {
      const nextCollapsed = drawer.dataset.collapsed !== "true";
      setDrawerCollapsed(drawer, toggle, nextCollapsed);
    });
  }

  function initBackLink() {
    const back = document.getElementById("map-fullscreen-back");
    if (!back) return;
    const params = new URLSearchParams(location.search);
    const campaign = params.get("campaign") || "stormwreck-isle";
    const sandboxId = params.get("id");
    if (campaign === "sandbox" && sandboxId) {
      back.href = `/campaigns/sandbox/?id=${encodeURIComponent(sandboxId)}`;
    } else if (campaign === "stormwreck-isle") {
      back.href = "/campaigns/stormwreck-isle/";
    } else {
      back.href = `/campaigns/${encodeURIComponent(campaign)}/`;
    }
  }

  function initCampaignChrome() {
    document.getElementById("map-fullscreen-btn")?.addEventListener("click", openInNewTab);
  }

  function init() {
    if (document.body.classList.contains("map-fullscreen-page")) {
      initDrawer();
      initBackLink();
      return;
    }
    initCampaignChrome();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    openInNewTab,
    buildFullscreenUrl,
    initDrawer,
    initBackLink
  };
})();
