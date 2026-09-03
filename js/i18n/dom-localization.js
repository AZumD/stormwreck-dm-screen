(function () {
  "use strict";

  const i18n = window.AppI18n;
  if (!i18n) return;

  function text(selector, key, root = document) {
    root.querySelectorAll?.(selector).forEach((el) => {
      el.textContent = i18n.t(key, el.textContent);
    });
  }

  function attr(selector, name, key, root = document) {
    root.querySelectorAll?.(selector).forEach((el) => {
      el.setAttribute(name, i18n.t(key, el.getAttribute(name) || ""));
    });
  }

  function leadingText(selector, key, root = document) {
    root.querySelectorAll?.(selector).forEach((el) => {
      const first = [...el.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (!first) return;
      const suffix = /\s$/.test(first.textContent) ? " " : "";
      first.textContent = `${i18n.t(key, first.textContent.trim())}${suffix}`;
    });
  }

  const EXACT = {
    "Sign in": "site.player.signIn",
    "Log out": "site.player.logout",
    "Close": "site.player.close",
    "Cancel": "site.player.cancel",
    "Save": "site.player.save",
    "Delete": "site.player.delete",
    "Edit character": "site.player.editCharacter",
    "New character": "site.player.newCharacter",
    "New post": "site.player.newPost",
    "Schedule": "site.player.schedule",
    "Play": "site.player.play",
    "Library": "site.player.library",
    "Notes": "site.player.notes",
    "Map": "site.campaign.map",
    "Party": "site.campaign.party",
    "Music": "site.campaign.music",
    "Reference": "site.campaign.reference",
    "Run": "site.campaign.run",
    "Prep": "site.campaign.prep",
    "Session": "site.campaign.session",
    "Measure": "site.campaign.measure",
    "+ Token": "site.campaign.token",
    "Layers": "site.campaign.layers",
    "Fit": "site.campaign.fit",
    "Expand": "site.campaign.expand",
    "Fullscreen": "site.campaign.fullscreen",
    "Map settings": "site.campaign.mapSettings",
    "Grid": "site.campaign.grid",
    "Snap measure": "site.campaign.snapMeasure",
    "Add music": "site.campaign.addMusic",
    "Add to party": "site.campaign.addParty",
    "Add to map": "site.campaign.addMap",
    "Search Results": "site.campaign.searchResults",
    "Browse": "site.compendium.browse",
    "New entry": "site.compendium.newEntry",
    "Character Creator": "site.creator.title",
    "Getting Started": "site.creator.steps.start",
    "Class": "site.player.class",
    "Species": "site.player.race",
    "Background": "site.player.background",
    "Abilities": "site.player.abilities",
    "Feats": "site.creator.steps.feats",
    "Spells": "site.player.spells",
    "Equipment": "site.creator.steps.equipment",
    "Identity": "site.creator.steps.identity",
    "About": "site.creator.steps.about",
    "Review": "site.creator.steps.review"
  };

  const PLACEHOLDER_EXACT = {
    "Search…": "site.campaign.search",
    "Type to search…": "site.compendium.search",
    "Character name": "site.creator.characterName"
  };

  function translateExact(root = document) {
    const selectors = [
      "button",
      "summary",
      "option",
      "[role='menuitem']",
      "input[type='button']",
      "input[type='submit']"
    ];
    if (document.body?.classList.contains("creator-body")) {
      selectors.push(".creator-steps button", ".creator-content h1", ".creator-content h2", ".creator-content h3");
    }
    if (document.body?.classList.contains("player-body")) {
      selectors.push(".home-section-head h2", ".dialog h2", ".sheet-form-heading");
    }

    root.querySelectorAll?.(selectors.join(",")).forEach((el) => {
      const current = String(el.textContent || "").trim();
      const key = EXACT[current];
      if (key) el.textContent = i18n.t(key, current);
    });

    root.querySelectorAll?.("input[placeholder], textarea[placeholder]").forEach((el) => {
      const current = el.getAttribute("placeholder") || "";
      const key = PLACEHOLDER_EXACT[current];
      if (key) el.setAttribute("placeholder", i18n.t(key, current));
    });
  }

  function translateHome() {
    text(".home-title", "site.home.choosePath");
    text(".home-lede", "site.home.lede");
    text(".home-btn--dm", "site.home.dmLogin");
    text(".home-btn--player", "site.home.playerLogin");
  }

  function translateDmLibrary() {
    text("#view-login h1", "site.dm.loginTitle");
    text("#view-login .lead", "site.dm.loginLead");
    text("#dm-login-form button[type='submit']", "site.dm.signIn");
    text(".dm-login-back a", "site.dm.backToGate");
    text(".landing-header--library .eyebrow", "site.dm.personalTool");
    text(".landing-header--library h1", "site.dm.library");
    text(".landing-header--library .lead", "site.dm.libraryLead");
    text("#dm-logout", "site.dm.logout");
    text("#continue-heading", "site.dm.continue");
    text("#campaigns-heading", "site.dm.campaigns");
    text("#create-campaign-btn", "site.dm.newCampaign");
    text("#tools-heading", "site.dm.tools");
    text(".library-tool-card[href*='compendium'] .library-tool-card__title", "site.dm.compendium");
    text(".library-tool-card[href*='compendium'] .library-tool-card__desc", "site.dm.compendiumDesc");
    text(".library-tool-card[data-library-view='schedule'] .library-tool-card__title", "site.dm.schedule");
    text(".library-tool-card[data-library-view='schedule'] .library-tool-card__desc", "site.dm.scheduleDesc");
    text(".library-tool-card[href='/player/'] .library-tool-card__title", "site.dm.playerApp");
    text(".library-tool-card[href='/player/'] .library-tool-card__desc", "site.dm.playerAppDesc");
    text("#library-next-session .library-next-session__title", "site.dm.nextSession");
    text("#library-home-footer .library-utilities__title", "site.dm.dataBackup");
    text("#import-browser-data", "site.dm.importBrowser");
    text("#export-library", "site.dm.exportLibrary");
    text("#create-campaign-dialog h2", "site.dm.createCampaign");
    leadingText("#create-campaign-form label[for], #create-campaign-form .create-campaign-field:first-of-type", "site.dm.title");
    text("#create-campaign-form .create-campaign-submit", "site.dm.createAndOpen");
  }

  function translateCompendium() {
    text(".compendium-rail__back", "site.compendium.back");
    text("#compendium-nav-toggle", "site.compendium.browse");
    attr(".compendium-rail", "aria-label", "site.dm.compendium");
    attr("#cat-search", "placeholder", "site.compendium.search");
    text("#cat-new", "site.compendium.newEntry");
    text(".compendium-footer p", "site.compendium.footer");
  }

  function translateCreator() {
    text("#creator-save-state", "site.creator.draftSaved");
    attr("#creator-reset", "title", "site.creator.resetTitle");
    attr(".creator-topbar__end a[href='/player/']", "title", "site.creator.playerHome");
    text(".creator-sidebar__title", "site.creator.title");
    text("#creator-prev", "site.creator.previous");
    text("#creator-next", "site.creator.next");
    text("#creator-confirm-reset h2", "site.creator.resetHeading");
    text("#creator-confirm-reset p", "site.creator.resetBody");
    text("#creator-confirm-reset [value='cancel']", "site.creator.keepDraft");
    text("#creator-confirm-reset [value='reset']", "site.creator.resetDraft");
  }

  function translatePlayer() {
    text("#view-login h1", "site.player.signInTitle");
    text("#view-login .lede", "site.player.signInLead");
    text("#login-form button[type='submit']", "site.player.signIn");
    text("#view-home .topbar h1", "site.player.home");
    text("#player-to-dm", "site.player.dmLibrary");
    text("#logout-home, #logout-character, #logout-shell", "site.player.logout");
    text("#home-character-heading", "site.player.myCharacter");
    text("a[href='/character-creator/'].btn", "site.player.newCharacter");
    text("[data-platform-board-new]", "site.player.newPost");
    text(".home-section--board .home-section-head h2", "site.player.board");
    text(".home-section--campaigns .home-section-head h2", "site.player.campaigns");
    text(".player-schedule-view__title", "site.player.schedule");
    text("#character-shell-eyebrow", "site.player.character");
    text("#character-shell-title", "site.player.sheet");
    text("[data-campaign-section='play']", "site.player.play");
    text("[data-campaign-section='schedule']", "site.player.schedule");
    text("[data-campaign-section='board']", "site.player.board");
    text("[data-campaign-nav-home]", "site.player.home");
    text(".tabs [data-tab='map']", "site.campaign.map");
    text(".tabs [data-tab='party']", "site.campaign.party");
    text(".tabs [data-tab='library']", "site.player.library");
    text(".tabs [data-tab='notes']", "site.player.notes");
    text("#sheet-dialog h2", "site.player.editCharacter");
    text("#sheet-actions button[type='submit']", "site.player.save");
    leadingText("#sheet-form label:has(input[name='name'])", "site.player.name");
    leadingText("#sheet-form label:has(input[name='race'])", "site.player.race");
    leadingText("#sheet-form label:has(input[name='class'])", "site.player.class");
    leadingText("#sheet-form label:has(input[name='subclass'])", "site.player.subclass");
    leadingText("#sheet-form label:has(input[name='level'])", "site.player.level");
    leadingText("#sheet-form label:has(input[name='background'])", "site.player.background");
    leadingText("#sheet-form label:has(input[name='alignment'])", "site.player.alignment");
    const headings = document.querySelectorAll("#sheet-form .sheet-form-heading");
    if (headings[0]) headings[0].textContent = i18n.t("site.player.abilities", headings[0].textContent);
    if (headings[1]) headings[1].textContent = i18n.t("site.player.combat", headings[1].textContent);
    if (headings[2]) headings[2].textContent = i18n.t("site.player.currency", headings[2].textContent);
  }

  function translateCampaign() {
    text(".campaign-page .back-link", "site.campaign.backLibrary");
    text(".campaign-page .sidebar-eyebrow", "site.campaign.activeCampaign");
    text("#workspace-run", "site.campaign.run");
    text("#workspace-prep", "site.campaign.prep");
    text("#workspace-map", "site.campaign.map");
    text("#workspace-session", "site.campaign.session");
    attr("#search", "placeholder", "site.campaign.search");
    text("#current-scene-btn", "site.campaign.currentScene");
    text(".campaign-time__heading", "site.campaign.campaignTime");
    text("[data-time-preset='morning']", "site.campaign.morning");
    text("[data-time-preset='noon']", "site.campaign.noon");
    text("[data-time-preset='evening']", "site.campaign.evening");
    text("[data-time-preset='night']", "site.campaign.night");
    text("#map-tab-btn", "site.campaign.map");
    text("#party-tab-btn", "site.campaign.party");
    text("#music-tab-btn", "site.campaign.music");
    text("#map-measure-btn", "site.campaign.measure");
    text("#map-add-token-btn", "site.campaign.token");
    text("#map-layers-btn", "site.campaign.layers");
    text("#map-reset-view-btn", "site.campaign.fit");
    text("#map-expand-btn", "site.campaign.expand");
    text("#map-fullscreen-btn", "site.campaign.fullscreen");
    text("#map-settings-toggle, .map-settings__summary", "site.campaign.mapSettings");
    text("#music-mixer-dialog-title", "site.campaign.addMusic");
    text("#party-dialog-title", "site.campaign.addParty");
    text("#map-pin-dialog-title", "site.campaign.addMap");
    text("#campaign-location-picker h2", "site.campaign.addLocation");
    text("#search-modal h2", "site.campaign.searchResults");
  }

  function translateFullscreenMap() {
    text("#map-fullscreen-drawer-toggle", "site.map.hideTools");
    text("#map-fullscreen-back", "site.map.backCampaign");
    text("#map-measure-btn", "site.campaign.measure");
    text("#map-add-token-btn", "site.campaign.token");
    text("#map-layers-btn", "site.campaign.layers");
    text("#map-reset-view-btn", "site.campaign.fit");
    text("#map-settings-toggle, .map-settings__summary", "site.campaign.mapSettings");
    text("#map-pin-dialog-title", "site.campaign.addMap");
  }

  function translateAll(root = document) {
    translateExact(root);
    if (document.body?.classList.contains("home-page")) translateHome();
    if (document.body?.classList.contains("landing-page") && document.getElementById("view-library")) translateDmLibrary();
    if (document.body?.classList.contains("compendium-page")) translateCompendium();
    if (document.body?.classList.contains("creator-body")) translateCreator();
    if (document.body?.classList.contains("player-body")) translatePlayer();
    if (document.body?.classList.contains("campaign-page")) translateCampaign();
    if (document.body?.classList.contains("map-fullscreen-page")) translateFullscreenMap();
  }

  function boot() {
    translateAll(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) translateAll(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
