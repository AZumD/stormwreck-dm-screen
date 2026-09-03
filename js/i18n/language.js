(function () {
  "use strict";

  const STORAGE_KEY = "stormwreck-language";
  const DEFAULT_LANGUAGE = "sv";
  const SUPPORTED = new Set(["sv", "en"]);

  const SITE_EN = {
    language: { label: "Language", swedish: "Svenska", english: "English" },
    home: {
      choosePath: "Choose your path",
      lede: "Enter as Dungeon Master or as a player at the table.",
      dmLogin: "DM login",
      playerLogin: "Player login"
    },
    dm: {
      loginTitle: "DM login",
      loginLead: "Sign in with your Dungeon Master account.",
      signIn: "Sign in",
      backToGate: "← Back to gate",
      personalTool: "Personal tool",
      library: "DM Library",
      libraryLead: "Your desk for campaigns, prep, and session tools.",
      logout: "Log out",
      continue: "Continue",
      campaigns: "Campaigns",
      newCampaign: "+ New campaign",
      tools: "Tools",
      compendium: "Compendium",
      compendiumDesc: "Characters, creatures, rules, and world data",
      schedule: "Schedule",
      scheduleDesc: "Plan sessions and availability",
      playerApp: "Player App",
      playerAppDesc: "Open the player-facing campaign tools",
      nextSession: "Next session",
      dataBackup: "Data & backup",
      importBrowser: "Import browser data",
      exportLibrary: "Export library JSON",
      createCampaign: "Create new campaign",
      title: "Title",
      descriptionOptional: "Description (optional)",
      createAndOpen: "Create & open",
      cancel: "Cancel"
    },
    compendium: {
      back: "← DM Library",
      browse: "Browse",
      newEntry: "New entry",
      search: "Search…",
      footer: "Local storage · no login · just for you",
      groups: {
        characters: "Characters",
        creatures: "Creatures",
        world: "World",
        rules: "Rules",
        media: "Media"
      },
      types: {
        pc: "PCs",
        npc: "NPCs",
        monster: "Monsters",
        location: "Locations",
        item: "Items",
        race: "Species",
        background: "Backgrounds",
        class: "Classes",
        skill: "Skills",
        feature: "Features",
        spell: "Spells",
        rule: "Rules",
        source: "Sources",
        music: "Music"
      }
    },
    player: {
      signInTitle: "Player sign in",
      signInLead: "Access your campaigns and characters.",
      signIn: "Sign in",
      home: "Player home",
      dmLibrary: "DM Library",
      logout: "Log out",
      myCharacter: "My character",
      newCharacter: "New character",
      board: "Board",
      newPost: "New post",
      campaigns: "My campaigns",
      schedule: "Schedule",
      character: "Character",
      sheet: "Sheet",
      play: "Play",
      library: "Library",
      notes: "Notes",
      close: "Close",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      editCharacter: "Edit character",
      name: "Name",
      portrait: "Portrait",
      race: "Race",
      class: "Class",
      subclass: "Subclass",
      level: "Level",
      background: "Background",
      alignment: "Alignment",
      abilities: "Abilities",
      combat: "Combat",
      armorClass: "AC",
      speed: "Speed",
      proficiency: "Proficiency",
      hitDice: "Hit dice",
      hpCurrent: "HP current",
      hpMax: "HP max",
      hpTemp: "Temp HP",
      currency: "Currency",
      skills: "Skills",
      features: "Features",
      spells: "Spells"
    },
    creator: {
      brand: "Player Companion",
      draftSaved: "Draft saved locally",
      resetTitle: "Reset character",
      playerHome: "Player home",
      title: "Character Creator",
      previous: "← Previous step",
      next: "Next →",
      step: "Step {current} of {total}",
      resetHeading: "Reset this character?",
      resetBody: "This clears the local creator draft. Characters already saved to the Player Companion are untouched.",
      keepDraft: "Keep draft",
      resetDraft: "Reset draft"
    },
    campaign: {
      backLibrary: "← DM Library",
      activeCampaign: "Active campaign",
      dmScreen: "DM Screen",
      scenes: "Scenes",
      tools: "Tools",
      reference: "Reference",
      run: "Run",
      prep: "Prep",
      map: "Map",
      session: "Session",
      search: "Search…",
      currentScene: "Current Scene",
      campaignTime: "Campaign Time",
      day: "Day",
      time: "Time",
      morning: "Morning",
      noon: "Noon",
      evening: "Evening",
      night: "Night",
      utilities: "Utilities",
      party: "Party",
      music: "Music",
      measure: "Measure",
      token: "+ Token",
      layers: "Layers",
      fit: "Fit",
      expand: "Expand",
      fullscreen: "Fullscreen",
      mapSettings: "Map settings",
      grid: "Grid",
      snapMeasure: "Snap measure",
      addMusic: "Add music",
      addParty: "Add to party",
      addMap: "Add to map",
      addLocation: "Add location to campaign",
      searchResults: "Search Results",
      close: "Close"
    },
    map: {
      fullscreenTitle: "Fullscreen map",
      mapTools: "Map tools",
      hideTools: "Hide tools",
      showTools: "Show tools",
      backCampaign: "← Back to campaign"
    },
    catalogue: {
      search: "Search…",
      newEntry: "New entry",
      edit: "Edit",
      save: "Save",
      delete: "Delete",
      cancel: "Cancel",
      source: "Source",
      ruleset: "Ruleset",
      name: "Name",
      description: "Description",
      notes: "Notes",
      tags: "Tags",
      summary: "Summary",
      type: "Type",
      level: "Level",
      category: "Category"
    },
    terms: {
      gameMaster: "Dungeon Master (DM)",
      playerCharacter: "player character (PC)",
      npc: "non-player character (NPC)",
      skill: "skill",
      abilityScore: "ability score",
      abilityCheck: "ability check",
      savingThrow: "saving throw",
      armorClass: "Armor Class (AC)",
      hitPoints: "hit points (HP)",
      shortRest: "short rest",
      longRest: "long rest",
      advantage: "advantage",
      disadvantage: "disadvantage",
      condition: "condition",
      exhaustion: "exhaustion",
      concentration: "concentration",
      criticalHit: "critical hit",
      damage: "damage",
      spell: "spell",
      spellSlot: "spell slot",
      cantrip: "cantrip",
      proficiency: "proficiency",
      feat: "feat"
    }
  };

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (!value || typeof value !== "object") return value;
    const out = {};
    Object.entries(value).forEach(([key, child]) => { out[key] = clone(child); });
    return out;
  }

  function merge(base, overlay) {
    const out = clone(base || {});
    Object.entries(overlay || {}).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        out[key] = merge(out[key] || {}, value);
      } else {
        out[key] = clone(value);
      }
    });
    return out;
  }

  const englishBase = merge(window.I18N || {}, { site: SITE_EN });
  const swedishBase = merge(englishBase, window.I18N_SV || {});

  function normalizeLanguage(value) {
    const lang = String(value || "").trim().toLowerCase().split("-")[0];
    return SUPPORTED.has(lang) ? lang : DEFAULT_LANGUAGE;
  }

  function readLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return normalizeLanguage(stored);
    } catch {
      /* storage can be unavailable in private/sandboxed contexts */
    }
    return DEFAULT_LANGUAGE;
  }

  let language = readLanguage();

  function dictionary(lang = language) {
    return normalizeLanguage(lang) === "sv" ? swedishBase : englishBase;
  }

  function getPath(obj, path) {
    return String(path || "")
      .split(".")
      .filter(Boolean)
      .reduce((value, key) => value?.[key], obj);
  }

  function format(value, vars) {
    let text = value == null ? "" : String(value);
    Object.entries(vars || {}).forEach(([key, replacement]) => {
      text = text.replaceAll(`{${key}}`, String(replacement));
    });
    return text;
  }

  function t(path, fallback, vars) {
    const value = getPath(dictionary(), path);
    if (value == null || typeof value === "object") return format(fallback ?? path, vars);
    return format(value, vars);
  }

  function applyElement(el) {
    if (!el?.dataset) return;
    if (el.dataset.i18n) el.textContent = t(el.dataset.i18n, el.textContent);
    if (el.dataset.i18nPlaceholder) el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder, el.getAttribute("placeholder") || ""));
    if (el.dataset.i18nTitle) el.setAttribute("title", t(el.dataset.i18nTitle, el.getAttribute("title") || ""));
    if (el.dataset.i18nAria) el.setAttribute("aria-label", t(el.dataset.i18nAria, el.getAttribute("aria-label") || ""));
  }

  function apply(root = document) {
    if (!root) return;
    if (root.nodeType === 1) applyElement(root);
    root.querySelectorAll?.("[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria]").forEach(applyElement);
    document.documentElement.lang = language;
  }

  function writeLanguage(next) {
    language = normalizeLanguage(next);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
    window.I18N = dictionary(language);
    document.documentElement.lang = language;
  }

  function setLanguage(next, options = {}) {
    const normalized = normalizeLanguage(next);
    if (normalized === language) return;
    writeLanguage(normalized);
    if (options.reload === false) {
      apply(document);
      window.dispatchEvent(new CustomEvent("stormwreck:languagechange", { detail: { language } }));
      return;
    }
    location.reload();
  }

  function ensureStyles() {
    if (document.querySelector('link[data-stormwreck-language-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/language.css?v=20260904i1";
    link.dataset.stormwreckLanguageCss = "true";
    document.head.appendChild(link);
  }

  function ensureSwitcher() {
    if (document.querySelector(".site-language-switcher")) return;
    const wrap = document.createElement("div");
    wrap.className = "site-language-switcher";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", t("site.language.label", "Language"));
    wrap.innerHTML = `
      <button type="button" data-site-language="sv" aria-pressed="${language === "sv" ? "true" : "false"}" title="${t("site.language.swedish", "Svenska")}">SV</button>
      <button type="button" data-site-language="en" aria-pressed="${language === "en" ? "true" : "false"}" title="${t("site.language.english", "English")}">EN</button>`;
    wrap.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-site-language]");
      if (btn) setLanguage(btn.dataset.siteLanguage);
    });
    document.body.appendChild(wrap);
  }

  writeLanguage(language);
  ensureStyles();

  window.AppI18n = {
    STORAGE_KEY,
    DEFAULT_LANGUAGE,
    get language() { return language; },
    isSwedish: () => language === "sv",
    t,
    format,
    apply,
    setLanguage,
    dictionary,
    terms: () => dictionary().site?.terms || {}
  };

  function boot() {
    apply(document);
    ensureSwitcher();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) apply(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
