/**
 * Fullscreen map tab bootstrap — minimal campaign deps, no scene shell.
 */
(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search || "");
  const campaignKey = params.get("campaign") || "stormwreck-isle";
  const sandboxId = String(params.get("id") || "").trim();

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadCampaignBundle() {
    const root = "../../js/";
    const coreSeeds = [
      "catalogue-seeds/core-rules.js",
      "catalogue-seeds/core-spells.js",
      "catalogue-seeds/core-skills.js",
      "catalogue-seeds/core-features.js"
    ];
    for (const file of coreSeeds) await loadScript(root + file);

    if (campaignKey === "stormwreck-isle") {
      await loadScript(root + "catalogue-seeds/stormwreck-isle.js");
      await loadScript(root + "campaigns/stormwreck-isle/adventure.js");
      await loadScript(root + "campaigns/stormwreck-isle/maps.js");
      await loadScript(root + "campaigns/stormwreck-isle/party.js");
      return;
    }

    if (campaignKey === "sandbox") {
      await loadScript(root + "core/campaign-registry.js");
      await loadScript(root + "campaigns/sandbox/adventure.js");
      await loadScript(root + "campaigns/sandbox/party.js");
      return;
    }

    throw new Error(`Unknown campaign for fullscreen map: ${campaignKey}`);
  }

  function syncBodyCampaignId() {
    if (campaignKey === "sandbox" && sandboxId) {
      document.body.dataset.campaignId = sandboxId;
      return;
    }
    if (campaignKey === "stormwreck-isle") {
      document.body.dataset.campaignId = "stormwreck-isle";
      return;
    }
    document.body.dataset.campaignId = campaignKey;
  }

  async function bootstrap() {
    syncBodyCampaignId();
    await loadCampaignBundle();

    const campaignId = window.ADVENTURE?.meta?.id || document.body.dataset.campaignId;
    if (!campaignId || campaignId === "missing-campaign") {
      document.body.classList.remove("is-booting");
      return;
    }

    if (window.LocalApiClient) await LocalApiClient.ready();
    if (window.CatalogueStore) await CatalogueStore.bootstrap();
    if (window.CampaignMapState) await CampaignMapState.bootstrap(campaignId);
    if (window.CampaignLocations) await CampaignLocations.bootstrap(campaignId);

    if (window.CatalogueImages) {
      try {
        const imageTypes = window.CatalogueTypes?.ids?.() || [
          "pc",
          "npc",
          "item",
          "monster",
          "location",
          "race",
          "class",
          "spell"
        ];
        await CatalogueImages.preload(imageTypes);
        await CatalogueImages.migrateAll(imageTypes);
      } catch (err) {
        console.warn("CatalogueImages preload failed:", err);
      }
    }

    if (window.EntityRegistry) {
      try {
        await EntityRegistry.build();
      } catch (err) {
        console.error("EntityRegistry.build failed:", err);
      }
    }

    EntityUI.init({
      tooltip: document.getElementById("entity-tooltip"),
      modal: document.getElementById("entity-modal"),
      modalTitle: document.getElementById("modal-title"),
      modalBody: document.getElementById("modal-body")
    });

    if (window.PartyRoster) PartyRoster.init();

    MapPanel.init(campaignId);
    MapFullscreen.initDrawer();
    MapFullscreen.initBackLink();

    const title = window.ADVENTURE?.meta?.title || "Map";
    document.title = `${title} — Fullscreen map`;

    window.addEventListener("focus", async () => {
      if (window.PartyRoster?.syncWindowParty) PartyRoster.syncWindowParty();
      if (window.CatalogueStore?.bootstrap) {
        try {
          await CatalogueStore.bootstrap(["pc", "npc", "monster"]);
        } catch {
          /* ignore */
        }
      }
      if (window.EntityRegistry?.build) {
        try {
          await EntityRegistry.build();
        } catch {
          /* ignore */
        }
      }
      window.MapPanel?.refreshPins?.();
      window.MapPanel?.refreshTokens?.();
      window.MapPanel?.refreshInitiative?.();
    });

    document.body.classList.remove("is-booting");
  }

  bootstrap().catch((err) => {
    console.error("Fullscreen map bootstrap failed:", err);
    document.body.classList.remove("is-booting");
  });
})();
