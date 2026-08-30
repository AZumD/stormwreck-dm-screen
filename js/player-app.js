/**
 * Player companion UI — ids/classes match player/index.html and PlayerApiClient.
 */
(function () {
  "use strict";

  const api = window.PlayerApiClient;
  if (!api) return;

  const els = {
    login: document.getElementById("view-login"),
    home: document.getElementById("view-home"),
    shell: document.getElementById("view-shell"),
    characterShell: document.getElementById("view-character-shell"),
    loginForm: document.getElementById("login-form"),
    loginError: document.getElementById("login-error"),
    campaignList: document.getElementById("campaign-list"),
    characterList: document.getElementById("character-list"),
    shellCampaign: document.getElementById("shell-campaign"),
    shellTitle: document.getElementById("shell-title"),
    shellUserName: document.getElementById("shell-user-name"),
    homeUserEyebrow: document.getElementById("home-user-eyebrow"),
    characterUserName: document.getElementById("character-user-name"),
    playerToDm: document.getElementById("player-to-dm"),
    campaignMenuBtn: document.getElementById("campaign-menu-btn"),
    campaignMenu: document.getElementById("campaign-menu"),
    characterShellTitle: document.getElementById("character-shell-title"),
    characterShellEyebrow: document.getElementById("character-shell-eyebrow"),
    characterCampaigns: document.getElementById("character-campaigns"),
    switcher: document.getElementById("char-switcher"),
    main: document.getElementById("main"),
    characterMain: document.getElementById("character-main"),
    dialog: document.getElementById("detail-dialog"),
    detailTitle: document.getElementById("detail-title"),
    detailBody: document.getElementById("detail-body"),
    logoutHome: document.getElementById("logout-home"),
    logoutShell: document.getElementById("logout-shell"),
    logoutCharacter: document.getElementById("logout-character"),
    backFromCharacter: document.getElementById("back-from-character"),
    createCharacterHome: document.getElementById("create-character-home"),
    noteDialog: document.getElementById("note-dialog"),
    noteForm: document.getElementById("note-form"),
    noteTitle: document.getElementById("note-dialog-title"),
    noteTimestamps: document.getElementById("note-timestamps"),
    noteDelete: document.getElementById("note-delete"),
    noteCancel: document.getElementById("note-cancel"),
    noteConfirmBox: document.getElementById("note-confirm-delete"),
    noteConfirmYes: document.getElementById("note-confirm-yes"),
    noteConfirmNo: document.getElementById("note-confirm-no"),
    sheetDialog: document.getElementById("sheet-dialog"),
    sheetForm: document.getElementById("sheet-form"),
    sheetCancel: document.getElementById("sheet-cancel"),
    addDialog: document.getElementById("add-dialog"),
    addForm: document.getElementById("add-form"),
    addTitle: document.getElementById("add-dialog-title"),
    addCancel: document.getElementById("add-cancel"),
    addSearch: document.getElementById("add-search"),
    addResults: document.getElementById("add-results"),
    addEmpty: document.getElementById("add-empty"),
    addCustom: document.getElementById("add-custom"),
    addCataloguePanel: document.getElementById("add-catalogue-panel"),
    addConditionPanel: document.getElementById("add-condition-panel"),
    addConditionInput: document.getElementById("add-condition-input"),
    createCharacterDialog: document.getElementById("create-character-dialog"),
    createCharacterForm: document.getElementById("create-character-form"),
    createCharacterName: document.getElementById("create-character-name"),
    createCharacterCancel: document.getElementById("create-character-cancel"),
    attachCampaignDialog: document.getElementById("attach-campaign-dialog"),
    attachCampaignForm: document.getElementById("attach-campaign-form"),
    attachCampaignSelect: document.getElementById("attach-campaign-select"),
    attachCampaignEmpty: document.getElementById("attach-campaign-empty"),
    attachCampaignCancel: document.getElementById("attach-campaign-cancel"),
    homeNextSession: document.getElementById("home-next-session"),
    homeCharacterHeading: document.getElementById("home-character-heading"),
    homeCharacterSpotlight: document.getElementById("home-character-spotlight"),
    playerViewHome: document.getElementById("player-view-home"),
    playerViewSchedule: document.getElementById("player-view-schedule"),
    playerScheduleList: document.getElementById("player-schedule-list"),
    playerScheduleBack: document.getElementById("player-schedule-back"),
    homeBoardList: document.getElementById("home-board-list"),
    availabilityDialog: document.getElementById("availability-dialog"),
    availabilityForm: document.getElementById("availability-form"),
    availabilityDialogTitle: document.getElementById("availability-dialog-title"),
    availabilityCancel: document.getElementById("availability-cancel"),
    eventDialog: document.getElementById("event-dialog"),
    eventForm: document.getElementById("event-form"),
    eventDialogTitle: document.getElementById("event-dialog-title"),
    eventCancel: document.getElementById("event-cancel"),
    eventDetailDialog: document.getElementById("event-detail-dialog"),
    eventDetailTitle: document.getElementById("event-detail-title"),
    eventDetailBody: document.getElementById("event-detail-body"),
    postDialog: document.getElementById("post-dialog"),
    postForm: document.getElementById("post-form"),
    postDialogTitle: document.getElementById("post-dialog-title"),
    postCancel: document.getElementById("post-cancel")
  };

  const LIBRARY_TYPES = ["spell", "skill", "feature", "race", "class", "source"];

  const ATTACH_LABELS = {
    inventory: "Add to inventory",
    spell: "Add spell",
    skill: "Add skill",
    feature: "Add feature",
    race: "Set race",
    class: "Set class"
  };

  const ADD_KINDS = {
    skill: { title: "Add skill", catalogue: "skill", action: "skill", custom: true },
    feature: { title: "Add feature", catalogue: "feature", action: "feature", custom: true },
    spell: { title: "Add spell", catalogue: "spell", action: "spell", custom: true },
    item: { title: "Add item", catalogue: "item", action: "inventory", custom: true },
    condition: { title: "Add condition", catalogue: null, action: null, custom: false }
  };

  const state = {
    bootstrap: null,
    viewMode: "login",
    campaignId: null,
    characters: [],
    myCharacters: [],
    characterId: null,
    activeCharacter: null,
    party: [],
    notes: [],
    noteId: null,
    notesQ: "",
    notesTag: "",
    notesCharacterId: "",
    tab: "map",
    editingNoteId: null,
    collapsed: loadCollapsed(),
    libraryType: "spell",
    libraryQ: "",
    libraryEntries: [],
    libraryTotal: 0,
    libraryBusy: false,
    librarySearchTimer: null,
    addKind: null,
    addSearchTimer: null,
    addResults: [],
    campaignSection: "play",
    playerHomeView: "home",
    personalCal: null,
    campaignCal: null,
    personalAvailability: {},
    campaignEvents: [],
    campaignAvailabilityAgg: {},
    campaignPosts: [],
    selectedScheduleDate: null,
    editingEventId: null,
    editingEvent: null,
    viewingEventId: null,
    editingPostId: null
  };

  function collapseKey() {
    return "player-sheet-collapsed-v1";
  }

  function loadCollapsed() {
    try {
      const raw = JSON.parse(localStorage.getItem(collapseKey()) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch {
      return {};
    }
  }

  function saveCollapsed() {
    try {
      localStorage.setItem(collapseKey(), JSON.stringify(state.collapsed));
    } catch {
      /* ignore quota */
    }
  }

  /** Default: list sections collapsed; abilities/combat open for play access */
  function isSectionCollapsed(id) {
    if (Object.prototype.hasOwnProperty.call(state.collapsed, id)) {
      return Boolean(state.collapsed[id]);
    }
    return id === "skills" || id === "features" || id === "spells" || id === "inventory" || id === "class-resources";
  }

  function section(id, title, bodyHtml) {
    const collapsed = isSectionCollapsed(id);
    return `<section class="sheet-section${collapsed ? " is-collapsed" : ""}" data-section="${esc(id)}">
      <button type="button" class="sheet-section__toggle" data-toggle-section="${esc(id)}" aria-expanded="${collapsed ? "false" : "true"}">
        <h3 class="sheet-section__title">${esc(title)}</h3>
        <span class="sheet-section__chevron" aria-hidden="true">▾</span>
      </button>
      <div class="sheet-section__body">${bodyHtml}</div>
    </section>`;
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let playerHomeScrollY = 0;
  let playerHomeViewBound = false;

  function normalizePlayerHomeView(raw) {
    return raw === "schedule" ? "schedule" : "home";
  }

  function readPlayerHomeViewFromUrl() {
    try {
      const view = new URLSearchParams(location.search).get("view");
      if (view === "schedule") return "schedule";
      if (location.hash === "#player-schedule" || location.hash === "#schedule") return "schedule";
    } catch {
      /* ignore */
    }
    return "home";
  }

  function buildPlayerHomeViewUrl(view) {
    const url = new URL(location.href);
    if (view === "schedule") url.searchParams.set("view", "schedule");
    else url.searchParams.delete("view");
    url.hash = "";
    return url.pathname + url.search;
  }

  async function renderPlayerScheduleView() {
    if (els.playerScheduleList && window.PlayerSchedulingUI) {
      await PlayerSchedulingUI.renderHomeSchedule(els.playerScheduleList);
    }
  }

  function setPlayerHomeView(view, opts = {}) {
    const next = normalizePlayerHomeView(view);
    const prev = state.playerHomeView;
    const { push = false, replace = false, restoreHomeScroll = false } = opts;

    if (next === "schedule" && prev === "home") playerHomeScrollY = window.scrollY;

    state.playerHomeView = next;

    if (els.playerViewHome) els.playerViewHome.hidden = next !== "home";
    if (els.playerViewSchedule) els.playerViewSchedule.hidden = next !== "schedule";

    document.body.classList.toggle("player-view--schedule", next === "schedule");
    document.body.classList.toggle("player-view--home", next === "home");

    const url = buildPlayerHomeViewUrl(next);
    if (push) history.pushState({ playerHomeView: next }, "", url);
    else if (replace) history.replaceState({ playerHomeView: next }, "", url);

    if (next === "schedule") {
      window.scrollTo({ top: 0, behavior: "auto" });
      void renderPlayerScheduleView();
      requestAnimationFrame(() => els.playerScheduleBack?.focus());
    } else {
      window.scrollTo({ top: restoreHomeScroll ? playerHomeScrollY : 0, behavior: "auto" });
    }
  }

  function openPlayerScheduleView(opts = {}) {
    setPlayerHomeView("schedule", { push: opts.push !== false });
  }

  function openPlayerHomeView(opts = {}) {
    setPlayerHomeView("home", { push: opts.push !== false, restoreHomeScroll: true });
  }

  function bindPlayerHomeViewNavigation() {
    if (playerHomeViewBound) return;
    playerHomeViewBound = true;

    els.playerScheduleBack?.addEventListener("click", () => openPlayerHomeView({ push: true }));

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-player-view]");
      if (!trigger || state.viewMode !== "home") return;
      const target = trigger.getAttribute("data-player-view");
      if (target === "schedule") {
        e.preventDefault();
        openPlayerScheduleView({ push: true });
      } else if (target === "home") {
        e.preventDefault();
        openPlayerHomeView({ push: true });
      }
    });

    window.addEventListener("popstate", () => {
      if (state.viewMode !== "home") return;
      setPlayerHomeView(readPlayerHomeViewFromUrl(), {
        replace: true,
        restoreHomeScroll: true
      });
    });

    window.addEventListener("hashchange", () => {
      if (state.viewMode !== "home") return;
      if (location.hash !== "#player-schedule" && location.hash !== "#schedule") return;
      history.replaceState({ playerHomeView: "schedule" }, "", buildPlayerHomeViewUrl("schedule"));
      setPlayerHomeView("schedule", { replace: true });
    });
  }

  function gameSystemLabel(id) {
    const systems = state.bootstrap?.gameSystems || [];
    const match = systems.find((s) => s.id === id);
    return match?.name || id || "D&D 5e";
  }

  function renderCharacterHomeSection() {
    const chars = state.myCharacters;
    if (els.homeCharacterHeading) {
      els.homeCharacterHeading.textContent = chars.length === 1 ? "My character" : "My characters";
    }
    if (!chars.length) {
      if (els.homeCharacterSpotlight) {
        els.homeCharacterSpotlight.innerHTML = `<p class="empty">No characters yet.</p>`;
      }
      if (els.characterList) {
        els.characterList.innerHTML = "";
        els.characterList.hidden = true;
      }
      return;
    }
    if (chars.length === 1) {
      const c = chars[0];
      const camp = (c.campaigns || [])[0];
      const campName = camp?.name || "";
      if (els.homeCharacterSpotlight) {
        els.homeCharacterSpotlight.innerHTML = `
          <article class="home-character-card card">
            <h3 class="home-character-name">${esc(c.name)}</h3>
            <p class="meta home-character-meta">Level ${esc(String(c.level || 1))} · ${esc(gameSystemLabel(c.gameSystemId))}</p>
            ${campName ? `<p class="meta home-character-campaign">${esc(campName)}</p>` : ""}
            <button type="button" class="btn btn-primary btn-sm" data-character-id="${esc(c.id)}">Open character</button>
          </article>`;
      }
      if (els.characterList) {
        els.characterList.innerHTML = "";
        els.characterList.hidden = true;
      }
      return;
    }
    if (els.homeCharacterSpotlight) els.homeCharacterSpotlight.innerHTML = "";
    if (els.characterList) {
      els.characterList.hidden = false;
      els.characterList.innerHTML = chars
        .map(
          (c) => `<li>
          <button type="button" class="card card-btn home-character-card-btn" data-character-id="${esc(c.id)}">
            <h3 class="home-character-name">${esc(c.name)}</h3>
            <p class="meta">Level ${esc(String(c.level || 1))} · ${esc(gameSystemLabel(c.gameSystemId))}${(c.campaigns || []).length ? ` · ${c.campaigns.length} campaign(s)` : ""}</p>
          </button>
        </li>`
        )
        .join("");
    }
  }

  function displayRefLabel(raw) {
    const s = String(raw || "").trim();
    if (!s) return "—";
    const m = s.match(/^@[\w-]+:[^|\s]+\|(.+)$/);
    if (m) return m[1].trim() || s;
    return s;
  }

  function renderClassResources(cr) {
    const entries = Object.entries(cr && typeof cr === "object" ? cr : {});
    const rows = entries
      .map(([key, val]) => {
        const cur =
          val && typeof val === "object" ? Number(val.current ?? val.value ?? 0) : Number(val) || 0;
        const max = val && typeof val === "object" ? Number(val.max ?? cur) : cur;
        return `<div class="class-res-row" data-cr-key="${esc(key)}">
          <span class="class-res-name">${esc(key)}</span>
          <input type="number" class="class-res-cur" data-cr-cur="${esc(key)}" value="${esc(cur)}" min="0" aria-label="${esc(key)} current">
          <span>/</span>
          <input type="number" class="class-res-max" data-cr-max="${esc(key)}" value="${esc(max)}" min="0" aria-label="${esc(key)} max">
          <button type="button" class="btn btn-ghost" data-cr-remove="${esc(key)}" aria-label="Remove ${esc(key)}">×</button>
        </div>`;
      })
      .join("");
    const empty = entries.length
      ? ""
      : `<p class="empty">No class resources yet (rage, ki, channel…).</p>`;
    return `${empty}${rows}
      <div class="class-res-add">
        <input type="text" class="class-res-new-name" data-new-cr-name maxlength="40" placeholder="Rage, Ki, Channel…" aria-label="New class resource name">
        <button type="button" class="btn btn-add" data-add-class-resource aria-label="Add class resource">+</button>
        ${entries.length ? `<button type="button" class="btn btn-primary" data-save-class-resources>Save resources</button>` : ""}
      </div>`;
  }

  function mod(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    return v >= 0 ? `+${v}` : String(v);
  }

  function parseDeathSaves(raw) {
    if (window.CombatSheetModal?.parseDeathSaves) return CombatSheetModal.parseDeathSaves(raw);
    const d = raw && typeof raw === "object" ? raw : {};
    return {
      successes: Math.min(3, Math.max(0, Number(d.successes) || 0)),
      failures: Math.min(3, Math.max(0, Number(d.failures) || 0))
    };
  }

  function parseSpellSlots(raw) {
    if (window.CombatSheetModal?.parseSpellSlots) return CombatSheetModal.parseSpellSlots(raw);
    const src = raw && typeof raw === "object" ? raw : {};
    const out = {};
    for (let i = 1; i <= 9; i++) {
      const row = src[String(i)] || {};
      out[String(i)] = { max: Math.max(0, Number(row.max) || 0), used: Math.max(0, Number(row.used) || 0) };
    }
    return out;
  }

  function deathSavesBlock(saves) {
    const s = parseDeathSaves(saves);
    const boxes = (kind, count) =>
      [0, 1, 2]
        .map(
          (i) =>
            `<button type="button" class="ds-box${i < count ? " is-on" : ""}" data-ds-kind="${kind}" data-ds-count="${i + 1}" aria-pressed="${i < count ? "true" : "false"}"></button>`
        )
        .join("");
    return `<div class="death-saves">
      <div class="ds-row"><span>Successes</span>${boxes("successes", s.successes)}</div>
      <div class="ds-row"><span>Failures</span>${boxes("failures", s.failures)}</div>
      <button type="button" class="btn btn-ghost" data-ds-reset>Reset</button>
    </div>`;
  }

  function spellSlotsBlock(slots) {
    const parsed = parseSpellSlots(slots);
    const rows = [];
    for (let i = 1; i <= 9; i++) {
      const row = parsed[String(i)];
      rows.push(`<label class="slot-row"><span>L${i}</span>
        <input type="number" min="0" data-slot-max="${i}" value="${row.max}" aria-label="Level ${i} max">
        <span>/</span>
        <input type="number" min="0" data-slot-used="${i}" value="${row.used}" aria-label="Level ${i} used">
      </label>`);
    }
    return `<div class="spell-slots"><p class="meta">max / used</p><div class="slot-grid">${rows.join("")}</div>
      <p class="section-add"><button type="button" class="btn btn-primary" data-save-slots>Save slots</button></p></div>`;
  }

  function fmtTs(v) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function activeMain() {
    return state.viewMode === "character" ? els.characterMain : els.main;
  }

  function portraitUrlFor(characterId) {
    if (state.viewMode === "character") return api.portraitUrlDirect(characterId);
    return api.portraitUrl(state.campaignId, characterId);
  }

  function patchState(characterId, patch) {
    if (state.viewMode === "character") return api.patchStateDirect(characterId, patch);
    return api.patchState(state.campaignId, characterId, patch);
  }

  function patchSheet(characterId, patch) {
    if (state.viewMode === "character") return api.patchSheetDirect(characterId, patch);
    return api.patchSheet(state.campaignId, characterId, patch);
  }

  function addInventory(characterId, payload) {
    if (state.viewMode === "character") return api.addInventoryDirect(characterId, payload);
    return api.addInventory(state.campaignId, characterId, payload);
  }

  function putPortrait(characterId, dataUrl) {
    if (state.viewMode === "character") return api.putPortraitDirect(characterId, dataUrl);
    return api.putPortrait(state.campaignId, characterId, dataUrl);
  }

  function show(name) {
    state.viewMode =
      name === "home"
        ? "home"
        : name === "shell"
          ? "campaign"
          : name === "character"
            ? "character"
            : "login";
    els.login.hidden = name !== "login";
    els.home.hidden = name !== "home";
    els.shell.hidden = name !== "shell";
    els.characterShell.hidden = name !== "character";
  }

  function expired(err) {
    if (err && err.status === 401) {
      state.bootstrap = null;
      state.campaignId = null;
      show("login");
      els.loginError.hidden = false;
      els.loginError.textContent = "Session expired. Please sign in again.";
      return true;
    }
    return false;
  }

  async function safe(fn) {
    try {
      return await fn();
    } catch (err) {
      if (expired(err)) return null;
      if (err && err.status === 403) {
        window.alert("You do not have access to that campaign or character.");
        return null;
      }
      window.alert(err.message || "Request failed");
      return null;
    }
  }

  function currentCharacter() {
    return state.characters.find((c) => c.id === state.characterId) || null;
  }

  function setTabs() {
    document.querySelectorAll("#view-shell .tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === state.tab);
    });
    if (els.shell) els.shell.setAttribute("data-active-tab", state.tab);
    els.shellTitle.textContent =
      {
        map: "Map",
        party: "Party",
        library: "Library",
        notes: "Notes"
      }[state.tab] || "Campaign";
  }

  function renderMapTab() {
    if (!state.characterId || !window.PlayerMapView) {
      els.main.innerHTML = `<p class="empty">No character selected.</p>`;
      window.PlayerMapView?.unmount?.();
      return;
    }
    let host = els.main.querySelector("#player-map-host");
    if (!host) {
      els.main.innerHTML = `<div id="player-map-host" class="player-map-host"></div>`;
      host = els.main.querySelector("#player-map-host");
    }
    PlayerMapView.mount(host, {
      campaignId: state.campaignId,
      characterId: state.characterId,
      api
    });
  }

  function stopMapTab() {
    if (window.PlayerMapView?.unmount) PlayerMapView.unmount();
  }

  function renderSwitcher() {
    if (state.characters.length <= 1) {
      els.switcher.hidden = true;
      els.switcher.innerHTML = "";
      return;
    }
    els.switcher.hidden = false;
    els.switcher.innerHTML = state.characters
      .map((c) => {
        const on = c.id === state.characterId ? " is-active" : "";
        return `<button type="button" class="chip${on}" data-character-id="${esc(c.id)}">${esc(c.name)}</button>`;
      })
      .join("");
  }

  function dropBrokenPortrait(img) {
    const parent = img.closest(".vitals, .identity");
    img.remove();
    if (parent) parent.classList.add("no-portrait");
  }

  function identityCard(name, meta, portraitSrc, headingTag) {
    const tag = headingTag === "h3" ? "h3" : "h2";
    return `<div class="identity card">
        <img class="portrait" src="${esc(portraitSrc)}" alt="" onerror="window.PlayerAppDropPortrait(this)">
        <div>
          <${tag}>${esc(name)}</${tag}>
          <p class="meta">${esc(meta)}</p>
        </div>
      </div>`;
  }

  window.PlayerAppDropPortrait = dropBrokenPortrait;

  function noteTimestampLine(n) {
    const created = fmtTs(n.createdAt);
    const updated = fmtTs(n.updatedAt);
    const scope = n.characterId ? "character" : "campaign";
    if (created && updated && created !== updated) {
      return `Created ${created} · Updated ${updated} · ${scope}`;
    }
    return `${updated || created} · ${scope}`;
  }

  function pills(refs, removeAttr) {
    if (!refs || !refs.length) return `<p class="empty">Nothing here yet.</p>`;
    return `<div class="pills">${refs
      .map((r, index) => {
        const label = esc(r.label || r.id || r.raw);
        const removeBtn = removeAttr
          ? `<button type="button" class="pill" data-remove-ref="${esc(removeAttr)}" data-index="${index}" aria-label="Remove">× ${label}</button>`
          : null;
        if (removeBtn) return removeBtn;
        if (r.type && r.id) {
          return `<button type="button" class="pill" data-type="${esc(r.type)}" data-id="${esc(r.id)}">${label}</button>`;
        }
        return `<span class="pill static">${label}</span>`;
      })
      .join("")}</div>`;
  }

  function refsToLines(refs) {
    return (refs || [])
      .map((r) => r.raw || (r.type && r.id ? `@${r.type}:${r.id}|${r.label || r.id}` : r.label || ""))
      .filter(Boolean)
      .join("\n");
  }

  function linesToRefs(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  function currencyLine(c) {
    const cur = c.currency || {};
    const parts = ["pp", "gp", "ep", "sp", "cp"]
      .map((k) => {
        const n = Number(cur[k]);
        return Number.isFinite(n) && n > 0 ? `${n} ${k.toUpperCase()}` : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : "No coins tracked.";
  }

  function applyCharacter(dataCharacter) {
    if (!dataCharacter) return;
    const idx = state.characters.findIndex((x) => x.id === dataCharacter.id);
    if (idx >= 0) state.characters[idx] = dataCharacter;
    else state.characters.push(dataCharacter);
    state.characterId = dataCharacter.id;
  }

  function openSheetEditor() {
    const c = currentCharacter();
    if (!c || !els.sheetForm) return;
    const f = els.sheetForm;
    f.name.value = c.name || "";
    f.race.value = c.race || "";
    f.class.value = c.class || "";
    f.subclass.value = c.subclass || "";
    f.level.value = c.level ?? "";
    f.background.value = c.background || "";
    f.alignment.value = c.alignment || "";
    const abs = c.abilities || {};
    ["str", "dex", "con", "int", "wis", "cha"].forEach((k) => {
      f[k].value = abs[k]?.score ?? "";
    });
    f.ac.value = c.ac ?? "";
    f.speed.value = c.speed || "";
    f.proficiencyBonus.value = c.proficiencyBonus || "";
    f.hitDice.value = c.hitDice || "";
    f.hpCurrent.value = c.state?.hpCurrent ?? "";
    f.hpMax.value = c.state?.hpMax ?? "";
    f.hpTemp.value = c.state?.hpTemp ?? 0;
    const cur = c.currency || {};
    ["cp", "sp", "ep", "gp", "pp"].forEach((k) => {
      f[k].value = cur[k] ?? 0;
    });
    f.skillRefs.value = refsToLines(c.skillRefs);
    f.featureRefs.value = refsToLines(c.featureRefs);
    f.spellRefs.value = refsToLines(c.spellRefs);
    f.portrait.value = "";
    if (!els.sheetDialog.open) els.sheetDialog.showModal();
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read image"));
      reader.readAsDataURL(file);
    });
  }

  function renderCharacter() {
    const main = activeMain();
    const c = currentCharacter();
    if (!c) {
      main.innerHTML = `<p class="empty">No character loaded.</p>`;
      return;
    }
    const abs = c.abilities || {};
    const abilityHtml = ["str", "dex", "con", "int", "wis", "cha"]
      .map((k) => {
        const a = abs[k] || {};
        return `<div class="stat"><span class="abbr">${k.toUpperCase()}</span><span class="score">${esc(a.score ?? "—")}</span><span class="mod">${esc(mod(a.modifier))}</span></div>`;
      })
      .join("");
    const inv = (c.inventory || []).length
      ? `<div class="inv-list">${c.inventory
          .map((item) => {
            const label = esc(item.itemName || item.customName || item.itemId || "Item");
            const qty = item.quantity != null ? Number(item.quantity) : 1;
            const open = item.itemId
              ? `<button type="button" class="pill" data-type="item" data-id="${esc(item.itemId)}">${label}</button>`
              : `<span class="pill static">${label}</span>`;
            return `<div class="inv-row">
              ${open}
              <label class="inv-equip"><input type="checkbox" data-equip-inv="${esc(item.id)}" ${
                item.equipped ? "checked" : ""
              }> Eq</label>
              <input type="number" class="inv-qty" min="0" step="1" value="${esc(qty)}" data-qty-inv="${esc(
                item.id
              )}" aria-label="Quantity">
              <button type="button" class="btn btn-ghost" data-remove-inv="${esc(item.id)}">Remove</button>
            </div>`;
          })
          .join("")}</div>`
      : `<p class="empty">Pack is empty.</p>`;
    const invBlock = `${inv}
        <p class="section-add"><button type="button" class="btn btn-add" data-open-add="item" aria-label="Add item">+</button></p>`;
    const condList = Array.isArray(c.state?.conditions) ? c.state.conditions : [];
    const conditionPills = condList.length
      ? `<div class="pills">${condList
          .map(
            (cond) =>
              `<button type="button" class="pill" data-remove-condition="${esc(cond)}">${esc(cond)} ×</button>`
          )
          .join("")}</div>`
      : `<p class="empty">No conditions.</p>`;
    const inspired = Boolean(c.state?.inspiration);
    const temp = c.state?.hpTemp ? ` · temp ${esc(c.state.hpTemp)}` : "";
    const subclassBit = c.subclass ? ` (${displayRefLabel(c.subclass)})` : "";
    const metaLine = `${displayRefLabel(c.race)} · ${displayRefLabel(c.class)}${subclassBit} · L${c.level}`;

    main.innerHTML = `
      <div class="sheet-toolbar">
        <button type="button" class="btn btn-primary" data-edit-sheet>Edit sheet</button>
      </div>
      <div class="vitals">
        <img class="portrait" src="${esc(portraitUrlFor(c.id))}?t=${Date.now()}" alt="" onerror="window.PlayerAppDropPortrait(this)">
        <div class="vitals-text">
          <h2 class="sheet-name">${esc(c.name)}</h2>
          <p class="vitals-meta">${esc(metaLine)}</p>
        </div>
        <div class="vitals-hp">
          <p class="hp-value">${esc(c.state?.hpCurrent ?? "—")} <span>/ ${esc(c.state?.hpMax ?? "—")}</span></p>
          <div class="hp-btns">
            <button type="button" class="btn btn-icon" data-hp="-1" aria-label="Decrease HP">−</button>
            <button type="button" class="btn btn-icon" data-hp="1" aria-label="Increase HP">+</button>
          </div>
        </div>
      </div>
      <p class="meta hp-sub">Hit points${temp}</p>
      <div class="combat-chips" aria-label="Key combat stats">
        <span class="combat-chip">AC <strong>${esc(c.ac ?? "—")}</strong></span>
        <span class="combat-chip">Speed <strong>${esc(c.speed || "—")}</strong></span>
        <span class="combat-chip">Prof <strong>${esc(c.proficiencyBonus || "—")}</strong></span>
        <span class="combat-chip">HD <strong>${esc(c.hitDice || "—")}</strong></span>
      </div>
      <div class="currency-row" aria-label="Currency">
        <span class="combat-chip">${esc(currencyLine(c))}</span>
      </div>
      ${section(
        "conditions",
        "Conditions",
        `${conditionPills}
        <p class="section-add"><button type="button" class="btn btn-add" data-open-add="condition" aria-label="Add condition">+</button></p>`
      )}
      ${section("abilities", "Abilities", `<div class="stats">${abilityHtml}</div>`)}
      ${section(
        "combat",
        "Combat details",
        `<p class="meta combat-detail">AC ${esc(c.ac ?? "—")} · Speed ${esc(c.speed || "—")} · Proficiency ${esc(c.proficiencyBonus || "—")} · Hit dice ${esc(c.hitDice || "—")}</p>
        <div class="inspire-row">
          <p class="meta">Inspiration</p>
          <button type="button" class="btn ${inspired ? "btn-primary" : ""}" data-inspiration="${inspired ? "0" : "1"}" aria-pressed="${inspired ? "true" : "false"}">${inspired ? "Inspired" : "Mark inspiration"}</button>
        </div>`
      )}
      ${section("death-saves", "Death saves", deathSavesBlock(c.state?.deathSaves))}
      ${section("spell-slots", "Spell slots", spellSlotsBlock(c.state?.spellSlots))}
      ${section("class-resources", "Class resources", renderClassResources(c.state?.classResources))}
      ${section(
        "skills",
        "Skills",
        `${pills(c.skillRefs)}
        <p class="section-add"><button type="button" class="btn btn-add" data-open-add="skill" aria-label="Add skill">+</button></p>`
      )}
      ${section(
        "features",
        "Features",
        `${pills(c.featureRefs)}
        <p class="section-add"><button type="button" class="btn btn-add" data-open-add="feature" aria-label="Add feature">+</button></p>`
      )}
      ${section(
        "spells",
        "Spells",
        `${pills(c.spellRefs)}
        <p class="section-add"><button type="button" class="btn btn-add" data-open-add="spell" aria-label="Add spell">+</button></p>`
      )}
      ${section("inventory", "Inventory", invBlock)}`;
  }

  function renderParty() {
    if (!state.party.length) {
      els.main.innerHTML = `<p class="empty">No player characters in this party yet.</p>
        <p class="section-add"><button type="button" class="btn btn-primary" data-create-character>Add character to campaign</button></p>`;
      return;
    }
    els.main.innerHTML = `<div class="party-list">${state.party
      .map((p) => {
        const race = displayRefLabel(p.race);
        const klass = displayRefLabel(p.class);
        const hp =
          p.hpCurrent != null || p.hpMax != null
            ? ` · HP ${p.hpCurrent ?? "—"}/${p.hpMax ?? "—"}`
            : "";
        const cond =
          Array.isArray(p.conditions) && p.conditions.length
            ? ` · ${p.conditions.slice(0, 3).join(", ")}`
            : "";
        return identityCard(
          p.name,
          `${race} · ${klass} · Level ${p.level}${hp}${cond}`,
          api.portraitUrl(state.campaignId, p.id),
          "h3"
        );
      })
      .join("")}</div>`;
  }

  function fillNoteCharacterSelect(selectedId) {
    const select = els.noteForm.querySelector('select[name="characterId"]');
    if (!select) return;
    select.innerHTML =
      `<option value="">Campaign note</option>` +
      state.characters
        .map((c) => {
          const on = c.id === selectedId ? " selected" : "";
          return `<option value="${esc(c.id)}"${on}>${esc(c.name)}</option>`;
        })
        .join("");
  }

  function setNoteConfirm(open) {
    els.noteConfirmBox.hidden = !open;
    els.noteForm.querySelector("#note-actions").hidden = open;
  }

  function closeNoteEditor() {
    state.editingNoteId = null;
    setNoteConfirm(false);
    if (els.noteDialog.open) els.noteDialog.close();
  }

  function openCreateCharacterDialog() {
    if (!els.createCharacterDialog || !els.createCharacterForm) return;
    els.createCharacterForm.reset();
    els.createCharacterDialog.showModal();
    els.createCharacterName?.focus();
  }

  async function submitCreateCharacter(e) {
    e.preventDefault();
    const name = String(els.createCharacterName?.value || "").trim();
    if (!name) return;
    const mode = state.createCharacterMode;
    const data =
      mode === "standalone"
        ? await safe(() => api.createStandaloneCharacter({ name, gameSystemId: "dnd5e" }))
        : state.campaignId
          ? await safe(() => api.createCharacter(state.campaignId, { name }))
          : null;
    if (!data?.character) return;
    applyCharacter(data.character);
    state.characterId = data.character.id;
    els.createCharacterDialog?.close();
    state.createCharacterMode = null;
    if (mode === "standalone") {
      state.bootstrap = await api.bootstrap();
      renderHome();
      await openCharacter(data.character.id);
      return;
    }
    renderSwitcher();
    renderPlayingAs();
    state.bootstrap = await api.bootstrap();
    await openCharacter(data.character.id);
  }

  function openNoteEditor(note) {
    state.editingNoteId = note ? note.id : null;
    setNoteConfirm(false);
    els.noteTitle.textContent = note ? "Edit note" : "New note";
    els.noteForm.querySelector('input[name="title"]').value = note ? note.title || "" : "";
    els.noteForm.querySelector('textarea[name="body"]').value = note ? note.body || "" : "";
    fillNoteCharacterSelect(note ? note.characterId : "");
    els.noteDelete.hidden = !note;
    if (note && (note.createdAt || note.updatedAt)) {
      els.noteTimestamps.hidden = false;
      els.noteTimestamps.textContent = noteTimestampLine(note);
    } else {
      els.noteTimestamps.hidden = true;
      els.noteTimestamps.textContent = "";
    }
    if (!els.noteDialog.open) els.noteDialog.showModal();
  }

  function extractNoteTags(notes) {
    const tags = new Set();
    for (const n of notes || []) {
      const body = String(n.body || "");
      const re = /#([a-zA-Z0-9_-]{2,40})/g;
      let m;
      while ((m = re.exec(body))) tags.add(m[1].toLowerCase());
    }
    return [...tags].sort();
  }

  function filteredNotes() {
    const q = String(state.notesQ || "").trim().toLowerCase();
    const tag = String(state.notesTag || "").trim().toLowerCase();
    const charId = String(state.notesCharacterId || "");
    return (state.notes || []).filter((n) => {
      if (charId === "__campaign" && n.characterId) return false;
      if (charId && charId !== "__campaign" && n.characterId !== charId) return false;
      if (tag && !String(n.body || "").toLowerCase().includes(`#${tag}`)) return false;
      if (!q) return true;
      const blob = `${n.title || ""} ${n.body || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }

  function noteBodyHtml(body) {
    const text = String(body || "");
    if (!text.trim()) return `<p class="empty">Empty note.</p>`;
    return `<div class="note-body">${esc(text).replace(/\n/g, "<br>")}</div>`;
  }

  function renderNotes() {
    const tags = extractNoteTags(state.notes);
    const filtered = filteredNotes();
    if (state.noteId && !filtered.some((n) => n.id === state.noteId)) {
      state.noteId = filtered[0]?.id || null;
    }
    if (!state.noteId && filtered.length) state.noteId = filtered[0].id;
    const selected = filtered.find((n) => n.id === state.noteId) || null;

    const charOpts =
      `<option value="">All notes</option>` +
      `<option value="__campaign"${state.notesCharacterId === "__campaign" ? " selected" : ""}>Campaign only</option>` +
      state.characters
        .map((c) => {
          const on = c.id === state.notesCharacterId ? " selected" : "";
          return `<option value="${esc(c.id)}"${on}>${esc(c.name)}</option>`;
        })
        .join("");

    const tagChips = tags.length
      ? `<div class="notes-tags">${tags
          .map((t) => {
            const on = state.notesTag === t ? " is-active" : "";
            return `<button type="button" class="chip${on}" data-notes-tag="${esc(t)}">#${esc(t)}</button>`;
          })
          .join("")}${
          state.notesTag
            ? `<button type="button" class="chip" data-notes-tag="">Clear tag</button>`
            : ""
        }</div>`
      : "";

    const nav = filtered.length
      ? `<ul class="notes-nav-list">${filtered
          .map((n) => {
            const on = n.id === state.noteId ? " is-active" : "";
            return `<li>
              <button type="button" class="notes-nav-item${on}" data-note-select="${esc(n.id)}">
                <span class="notes-nav-title">${esc(n.title || "Untitled")}</span>
                <span class="meta">${esc(noteTimestampLine(n))}</span>
              </button>
            </li>`;
          })
          .join("")}</ul>`
      : `<p class="empty">No matching notes.</p>`;

    const main = selected
      ? `<article class="note-reader card">
          <header class="note-reader__head">
            <h2>${esc(selected.title || "Untitled")}</h2>
            <p class="meta">${esc(noteTimestampLine(selected))}</p>
            <div class="row">
              <button type="button" class="btn btn-ghost" data-edit="${esc(selected.id)}">Edit</button>
            </div>
          </header>
          ${noteBodyHtml(selected.body)}
        </article>`
      : `<p class="empty">${state.notes.length ? "Select a note." : "No notes yet."}</p>`;

    els.main.innerHTML = `
      <div class="notes-layout notes-panel">
        <aside class="notes-sidebar" aria-label="Notes navigation">
          <p><button type="button" class="btn btn-primary" data-note-new>New note</button></p>
          <label class="notes-search">Search
            <input type="search" id="notes-q" value="${esc(state.notesQ)}" placeholder="Title or body…" autocomplete="off">
          </label>
          <label class="notes-filter">Character
            <select id="notes-character">${charOpts}</select>
          </label>
          ${tagChips}
          ${nav}
        </aside>
        <div class="notes-main">${main}</div>
      </div>`;
  }

  function libraryMetaLine(entry) {
    const bits = [
      entry.category,
      entry.level != null ? `Lv ${entry.level}` : null,
      entry.rarity,
      entry.cr != null ? `CR ${entry.cr}` : null
    ].filter(Boolean);
    return bits.join(" · ");
  }

  function renderLibrary() {
    const types = LIBRARY_TYPES.map((t) => {
      const on = t === state.libraryType ? " is-active" : "";
      return `<button type="button" class="chip${on}" data-library-type="${esc(t)}">${esc(t)}</button>`;
    }).join("");
    const list = state.libraryBusy
      ? `<p class="empty">Searching…</p>`
      : state.libraryEntries.length
        ? `<ul class="library-list">${state.libraryEntries
            .map((e) => {
              const meta = libraryMetaLine(e);
              const summary = String(e.summary || "").slice(0, 120);
              return `<li>
              <button type="button" class="card library-item" data-type="${esc(e.type)}" data-id="${esc(e.id)}">
                <h3>${esc(e.name || e.id)}</h3>
                ${meta ? `<p class="meta">${esc(meta)}</p>` : ""}
                ${summary ? `<p class="meta">${esc(summary)}${String(e.summary || "").length > 120 ? "…" : ""}</p>` : ""}
              </button>
            </li>`;
            })
            .join("")}</ul>`
        : `<p class="empty">No entries match.</p>`;
    const more =
      !state.libraryBusy && state.libraryEntries.length < state.libraryTotal
        ? `<p class="section-add"><button type="button" class="btn btn-primary" data-library-more>Load more</button></p>`
        : "";
    const charHint = currentCharacter()
      ? `Attach actions use <strong>${esc(currentCharacter().name)}</strong>.`
      : "Select a character on the Sheet tab to attach entries.";
    els.main.innerHTML = `
      <label class="library-search">Search
        <input type="search" id="library-q" value="${esc(state.libraryQ)}" placeholder="Name, tag, school…" autocomplete="off">
      </label>
      <div class="library-types" role="tablist" aria-label="Catalogue type">${types}</div>
      <p class="meta">${charHint} Showing ${state.libraryEntries.length} of ${state.libraryTotal}.
        ${(state.libraryType === "source")
          ? " Lookup only — adventures stay DM-only."
          : ""}</p>
      ${list}
      ${more}`;
    const input = document.getElementById("library-q");
    if (input) {
      input.focus();
      const len = input.value.length;
      try {
        input.setSelectionRange(len, len);
      } catch {
        /* ignore */
      }
    }
  }

  async function loadLibrary(opts = {}) {
    if (!state.campaignId) return;
    const append = Boolean(opts.append);
    const silent = Boolean(opts.silent);
    if (!silent && !append) {
      state.libraryBusy = true;
      if (state.tab === "library") renderLibrary();
    }
    const offset = append ? state.libraryEntries.length : 0;
    const data = await safe(() =>
      api.library(state.campaignId, state.libraryType, {
        q: state.libraryQ,
        limit: 40,
        offset
      })
    );
    state.libraryBusy = false;
    if (!data) {
      if (!append) {
        state.libraryEntries = [];
        state.libraryTotal = 0;
      }
      if (state.tab === "library") renderLibrary();
      return;
    }
    const next = data.entries || [];
    state.libraryEntries = append ? state.libraryEntries.concat(next) : next;
    state.libraryTotal = data.total || 0;
    if (state.tab === "library") renderLibrary();
  }

  function scheduleLibrarySearch(q) {
    state.libraryQ = q;
    if (state.librarySearchTimer) clearTimeout(state.librarySearchTimer);
    state.librarySearchTimer = setTimeout(() => {
      state.librarySearchTimer = null;
      loadLibrary({ silent: true });
    }, 180);
  }

  function detailFieldHtml(entry) {
    if (entry.type === "source" || Array.isArray(entry.chapters)) {
      const bits = [];
      if (entry.summary) bits.push(`<p class="detail-block">${esc(entry.summary)}</p>`);
      if (entry.category || entry.publisher || entry.abbreviation) {
        bits.push(
          `<p class="meta">${esc(
            [entry.category, entry.abbreviation, entry.publisher].filter(Boolean).join(" · ")
          )}</p>`
        );
      }
      if (window.SourceUi) {
        bits.push(SourceUi.renderChaptersWiki(entry.chapters || [], { player: true }));
      } else if (entry.description) {
        bits.push(`<p class="detail-block">${esc(entry.description)}</p>`);
      }
      if (Array.isArray(entry.tags) && entry.tags.length) {
        bits.push(`<p class="meta">Tags: ${esc(entry.tags.join(", "))}</p>`);
      }
      return bits.join("") || `<p class="empty">No description available.</p>`;
    }
    const lines = [
      entry.summary,
      entry.description,
      entry.properties,
      entry.notes,
      entry.school ? `School: ${entry.school}` : "",
      entry.level != null ? `Level: ${entry.level}` : "",
      entry.category ? `Category: ${entry.category}` : "",
      entry.rarity ? `Rarity: ${entry.rarity}` : "",
      entry.itemType ? `Item type: ${entry.itemType}` : "",
      entry.cr != null ? `CR: ${entry.cr}` : "",
      entry.size ? `Size: ${entry.size}` : "",
      entry.typeLabel ? `Type: ${entry.typeLabel}` : "",
      entry.castingTime || entry.rawSafe?.castingTime
        ? `Casting time: ${entry.castingTime || entry.rawSafe.castingTime}`
        : "",
      entry.range || entry.rawSafe?.range ? `Range: ${entry.range || entry.rawSafe.range}` : "",
      entry.components || entry.rawSafe?.components
        ? `Components: ${entry.components || entry.rawSafe.components}`
        : "",
      entry.duration || entry.rawSafe?.duration
        ? `Duration: ${entry.duration || entry.rawSafe.duration}`
        : "",
      entry.value != null && entry.value !== "" ? `Value: ${entry.value}` : "",
      entry.weight != null && entry.weight !== "" ? `Weight: ${entry.weight}` : "",
      entry.attunement ? "Requires attunement" : "",
      Array.isArray(entry.tags) && entry.tags.length ? `Tags: ${entry.tags.join(", ")}` : ""
    ].filter(Boolean);
    if (!lines.length) return `<p class="empty">No description available.</p>`;
    return lines.map((l) => `<p class="detail-block">${esc(l)}</p>`).join("");
  }

  function attachButtonsHtml(entry) {
    const actions = Array.isArray(entry.actions) ? entry.actions : [];
    if (!actions.length || !currentCharacter()) return "";
    return `<div class="library-actions">${actions
      .map(
        (a) =>
          `<button type="button" class="btn btn-primary" data-library-attach="${esc(a)}" data-attach-type="${esc(entry.type)}" data-attach-id="${esc(entry.id)}">${esc(ATTACH_LABELS[a] || a)}</button>`
      )
      .join("")}</div>`;
  }

  async function render() {
    if (state.viewMode === "character") {
      stopMapTab();
      renderCharacter();
      return;
    }
    if (state.campaignSection === "schedule" || state.campaignSection === "board") {
      stopMapTab();
      if (window.PlayerSchedulingUI) {
        PlayerSchedulingUI.setCampaignSectionNav();
        await PlayerSchedulingUI.renderCampaignSection(els.main);
      }
      return;
    }
    if (state.tab === "map") {
      renderMapTab();
      return;
    }
    stopMapTab();
    if (state.tab === "party") {
      const data = await safe(() => api.party(state.campaignId));
      if (!data) return;
      state.party = data.party || [];
      renderParty();
      return;
    }
    if (state.tab === "library") {
      await loadLibrary();
      return;
    }
    const data = await safe(() => api.notes(state.campaignId));
    if (!data) return;
    state.notes = data.notes || [];
    renderNotes();
  }

  async function openCampaign(campaign) {
    state.campaignId = campaign.id;
    state.campaignSection = "play";
    els.shellCampaign.textContent = campaign.name;
    const data = await safe(() => api.myCharacters(campaign.id));
    if (!data) return;
    state.characters = data.characters || [];
    state.characterId = state.characters[0] ? state.characters[0].id : null;
    state.tab = state.characterId ? "map" : "party";
    setUserChrome();
    renderPlayingAs();
    show("shell");
    if (window.PlayerSchedulingUI) PlayerSchedulingUI.setCampaignSectionNav();
    setTabs();
    renderSwitcher();
    await render();
  }

  async function openCharacter(characterId) {
    const data = await safe(() => api.getCharacter(characterId));
    if (!data?.character) return;
    state.characterId = characterId;
    state.activeCharacter = data.character;
    state.characters = [data.character];
    els.characterShellTitle.textContent = data.character.name || "Character";
    els.characterShellEyebrow.textContent = data.character.gameSystemId || "Character";
    setUserChrome();
    renderCharacterCampaigns(data.character.campaigns || []);
    show("character");
    renderCharacter();
  }

  function renderCharacterCampaigns(campaigns) {
    if (!els.characterCampaigns) return;
    els.characterCampaigns.hidden = false;
    const list =
      campaigns.length > 0
        ? campaigns
            .map(
              (camp) => `<div class="row campaign-part-row">
            <span>✓ ${esc(camp.name)}</span>
            <button type="button" class="btn btn-ghost btn-sm" data-detach-campaign-id="${esc(camp.id)}">Remove</button>
          </div>`
            )
            .join("")
        : `<p class="empty">Not in a campaign yet.</p>`;
    els.characterCampaigns.innerHTML = `<div class="character-campaigns-panel stack-form">
      <p class="eyebrow">Campaigns</p>
      ${list}
      <button type="button" class="btn btn-primary btn-sm" id="open-attach-campaign">+ Add to campaign</button>
    </div>`;
  }

  async function openAttachCampaignDialog() {
    if (!state.characterId || !els.attachCampaignDialog) return;
    const data = await safe(() => api.attachableCampaigns(state.characterId));
    if (!data) return;
    const options = data.campaigns || [];
    if (els.attachCampaignSelect) {
      els.attachCampaignSelect.innerHTML = options
        .map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
        .join("");
    }
    if (els.attachCampaignEmpty) {
      els.attachCampaignEmpty.hidden = options.length > 0;
    }
    if (options.length) els.attachCampaignDialog.showModal();
    else if (els.attachCampaignEmpty) els.attachCampaignEmpty.hidden = false;
  }

  async function detachFromCampaign(campaignId) {
    if (!state.characterId) return;
    const data = await safe(() => api.detachFromCampaign(state.characterId, campaignId));
    if (!data) return;
    if (state.campaignId === campaignId && !els.shell.hidden) {
      state.campaignId = null;
      state.characters = [];
      state.characterId = null;
      show("home");
      renderHome();
      if (state.bootstrap) {
        try {
          state.bootstrap = await api.bootstrap();
        } catch {
          /* keep prior bootstrap */
        }
      }
      return;
    }
    const refreshed = await safe(() => api.getCharacter(state.characterId));
    if (refreshed?.character) {
      state.activeCharacter = refreshed.character;
      renderCharacterCampaigns(refreshed.character.campaigns || []);
    }
  }

  async function attachToCampaign(campaignId) {
    if (!state.characterId || !campaignId) return;
    const data = await safe(() => api.attachToCampaign(state.characterId, campaignId));
    if (!data?.character) return;
    state.activeCharacter = data.character;
    renderCharacterCampaigns(data.character.campaigns || []);
    els.attachCampaignDialog?.close();
    try {
      state.bootstrap = await api.bootstrap();
      renderHome();
    } catch {
      /* non-fatal */
    }
  }

  function setUserChrome() {
    const name = state.bootstrap?.user?.name || "";
    if (els.homeUserEyebrow) {
      els.homeUserEyebrow.textContent = name;
      els.homeUserEyebrow.hidden = !name;
      els.homeUserEyebrow.title = name;
    }
    [els.shellUserName, els.characterUserName].forEach((el) => {
      if (!el) return;
      el.textContent = name;
      el.hidden = !name;
      el.title = name;
    });
    const isDm = (state.bootstrap?.campaigns || []).some(
      (c) => String(c.role || "").toLowerCase() === "dm"
    );
    if (els.playerToDm) els.playerToDm.hidden = !isDm;
  }

  function renderPlayingAs() {
    /* Banner removed — account name lives in the campaign header. */
  }

  function goHome() {
    setPlayerHomeView("home", { replace: true });
    renderHome();
    show("home");
  }

  async function renderHome() {
    setUserChrome();
    const campaigns = state.bootstrap?.campaigns || [];
    if (!campaigns.length) {
      els.campaignList.innerHTML = `<li class="empty">Campaigns you join will appear here.</li>`;
    } else {
      els.campaignList.innerHTML = campaigns
        .map((c) => {
          const chars = c.participatingCharacters || c.controlledCharacters || [];
          const charLine =
            chars.length === 1
              ? esc(chars[0].name)
              : chars.length
                ? `${chars.length} character(s)`
                : "No linked character";
          const roleLabel = String(c.role || "player").toLowerCase() === "dm" ? "DM" : "Player";
          return `<li>
          <button type="button" class="card card-btn home-campaign-card" data-campaign-id="${esc(c.id)}">
            <h3 class="home-campaign-name">${esc(c.name)}</h3>
            <p class="meta">${esc(roleLabel)} · ${charLine}</p>
          </button>
        </li>`;
        })
        .join("");
    }
    state.myCharacters = state.bootstrap?.characters || [];
    renderCharacterHomeSection();
    if (window.PlayerSchedulingUI) {
      if (els.homeNextSession) await PlayerSchedulingUI.renderNextSessionSummary(els.homeNextSession);
      if (els.homeBoardList) await PlayerSchedulingUI.renderHomeBoard(els.homeBoardList);
    }
    if (state.playerHomeView === "schedule") {
      await renderPlayerScheduleView();
    }
  }

  async function afterLogin(bootstrap) {
    state.bootstrap = bootstrap;
    bindPlayerHomeViewNavigation();
    renderHome();
    show("home");
    setPlayerHomeView(readPlayerHomeViewFromUrl(), { replace: true });
  }

  async function openRef(type, id) {
    const data = await safe(() => api.catalogue(state.campaignId, type, id));
    if (!data) return;
    const entry = data.entry || {};
    const isSource = entry.type === "source" || Array.isArray(entry.chapters);
    els.dialog.classList.toggle("dialog-source", isSource);
    els.detailTitle.textContent = entry.name || id;
    const meta = libraryMetaLine(entry);
    els.detailBody.innerHTML = `
      ${meta ? `<p class="detail-meta">${esc(meta)}</p>` : ""}
      ${detailFieldHtml(entry)}
      ${attachButtonsHtml(entry)}`;
    els.dialog.showModal();
  }

  async function attachFromLibrary(action, type, id) {
    const c = currentCharacter();
    if (!c) {
      window.alert("Select a character on the Sheet tab first.");
      return;
    }
    const data = await safe(() =>
      api.libraryAttach(state.campaignId, c.id, { action, type, id })
    );
    if (!data) return;
    if (data.character) applyCharacter(data.character);
    if (els.dialog.open) els.dialog.close();
  }

  function closeAddDialog() {
    state.addKind = null;
    state.addResults = [];
    if (state.addSearchTimer) {
      clearTimeout(state.addSearchTimer);
      state.addSearchTimer = null;
    }
    if (els.addDialog && els.addDialog.open) els.addDialog.close();
  }

  function renderAddResults() {
    if (!els.addResults) return;
    const kind = ADD_KINDS[state.addKind];
    if (!kind || !kind.catalogue) {
      els.addResults.innerHTML = "";
      if (els.addEmpty) els.addEmpty.hidden = true;
      return;
    }
    const rows = state.addResults;
    if (!rows.length) {
      els.addResults.innerHTML = "";
      if (els.addEmpty) els.addEmpty.hidden = false;
      return;
    }
    if (els.addEmpty) els.addEmpty.hidden = true;
    els.addResults.innerHTML = rows
      .map((e) => {
        const meta = libraryMetaLine(e);
        return `<li>
          <button type="button" class="add-result" data-pick-id="${esc(e.id)}" data-pick-name="${esc(e.name || e.id)}" role="option">
            <span class="add-result__name">${esc(e.name || e.id)}</span>
            ${meta ? `<span class="add-result__meta">${esc(meta)}</span>` : ""}
          </button>
        </li>`;
      })
      .join("");
  }

  async function loadAddSearch(q) {
    const kind = ADD_KINDS[state.addKind];
    if (!kind || !kind.catalogue || !state.campaignId) return;
    const data = await safe(() =>
      api.library(state.campaignId, kind.catalogue, { q, limit: 30, offset: 0 })
    );
    state.addResults = data?.entries || [];
    renderAddResults();
  }

  function scheduleAddSearch(q) {
    const kind = ADD_KINDS[state.addKind];
    if (els.addCustom) {
      els.addCustom.hidden = !(kind && kind.custom && String(q || "").trim());
      els.addCustom.textContent =
        kind?.catalogue === "item" ? "Add as custom item" : "Add as custom text";
    }
    if (state.addSearchTimer) clearTimeout(state.addSearchTimer);
    state.addSearchTimer = setTimeout(() => {
      state.addSearchTimer = null;
      loadAddSearch(String(q || "").trim());
    }, 160);
  }

  function openAddDialog(kindKey) {
    const kind = ADD_KINDS[kindKey];
    if (!kind || !els.addDialog) return;
    if (!currentCharacter()) {
      window.alert("No controlled character selected.");
      return;
    }
    state.addKind = kindKey;
    state.addResults = [];
    els.addTitle.textContent = kind.title;
    const isCondition = kindKey === "condition";
    els.addCataloguePanel.hidden = isCondition;
    els.addConditionPanel.hidden = !isCondition;
    if (els.addSearch) els.addSearch.value = "";
    if (els.addConditionInput) els.addConditionInput.value = "";
    if (els.addCustom) els.addCustom.hidden = true;
    renderAddResults();
    if (!els.addDialog.open) els.addDialog.showModal();
    if (isCondition) {
      els.addConditionInput?.focus();
    } else {
      els.addSearch?.focus();
      loadAddSearch("");
    }
  }

  async function pickCatalogueEntry(id) {
    const kind = ADD_KINDS[state.addKind];
    const c = currentCharacter();
    if (!kind || !kind.catalogue || !kind.action || !c) return;
    const data = await safe(() =>
      api.libraryAttach(state.campaignId, c.id, {
        action: kind.action,
        type: kind.catalogue,
        id
      })
    );
    if (!data) return;
    if (data.character) applyCharacter(data.character);
    closeAddDialog();
    renderCharacter();
  }

  async function addCustomFromDialog() {
    const kind = ADD_KINDS[state.addKind];
    const c = currentCharacter();
    const text = String(els.addSearch?.value || "").trim();
    if (!kind || !c || !text) return;
    if (kind.catalogue === "item") {
      const data = await safe(() =>
        addInventory(c.id, { customName: text, quantity: 1 })
      );
      if (!data) return;
      applyCharacter(data.character);
    } else {
      const field =
        kind.action === "skill"
          ? "skillRefs"
          : kind.action === "feature"
            ? "featureRefs"
            : "spellRefs";
      const existing = (c[field] || []).map(
        (r) => r.raw || (r.type && r.id ? `@${r.type}:${r.id}|${r.label || r.id}` : r.label || "")
      );
      existing.push(text);
      const data = await safe(() => patchSheet(c.id, { [field]: existing }));
      if (!data) return;
      applyCharacter(data.character);
    }
    closeAddDialog();
    renderCharacter();
  }

  async function patchConditions(next) {
    const c = currentCharacter();
    if (!c) return;
    const data = await safe(() =>
      patchState(c.id, { conditions: next })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function bumpHp(delta) {
    const c = currentCharacter();
    if (!c) return;
    const current = Number(c.state?.hpCurrent);
    if (!Number.isFinite(current)) return;
    const data = await safe(() =>
      patchState(c.id, { hp_current: current + delta })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function setInspiration(on) {
    const c = currentCharacter();
    if (!c) return;
    const data = await safe(() =>
      patchState(c.id, { inspiration: Boolean(on) })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function patchDeathSaves(next) {
    const c = currentCharacter();
    if (!c) return;
    const data = await safe(() =>
      patchState(c.id, { death_saves: parseDeathSaves(next) })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function saveSpellSlotsFromDom(root) {
    const c = currentCharacter();
    if (!c || !root) return;
    const slots = {};
    for (let i = 1; i <= 9; i++) {
      const max = Number(root.querySelector(`[data-slot-max="${i}"]`)?.value);
      const used = Number(root.querySelector(`[data-slot-used="${i}"]`)?.value);
      slots[String(i)] = {
        max: Number.isFinite(max) ? Math.max(0, max) : 0,
        used: Number.isFinite(used) ? Math.max(0, used) : 0
      };
    }
    const data = await safe(() =>
      patchState(c.id, { spell_slots: parseSpellSlots(slots) })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function updateInventoryEntry(entryId, patch) {
    const c = currentCharacter();
    if (!c || !entryId) return;
    const data = await safe(() =>
      api.updateInventory(state.campaignId, c.id, entryId, patch)
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  function readClassResourcesFromDom(root) {
    const out = {};
    root?.querySelectorAll("[data-cr-key]").forEach((row) => {
      const key = row.getAttribute("data-cr-key");
      if (!key) return;
      const cur = Number(row.querySelector("[data-cr-cur]")?.value);
      const max = Number(row.querySelector("[data-cr-max]")?.value);
      out[key] = {
        current: Number.isFinite(cur) ? Math.max(0, cur) : 0,
        max: Number.isFinite(max) ? Math.max(0, max) : 0
      };
    });
    return out;
  }

  async function saveClassResourcesFromDom(root) {
    const c = currentCharacter();
    if (!c || !root) return;
    const data = await safe(() =>
      patchState(c.id, {
        class_resources: readClassResourcesFromDom(root)
      })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function softRefreshLive() {
    if (!state.campaignId || els.shell.hidden) return;
    if (document.visibilityState && document.visibilityState !== "visible") return;
    try {
      const chars = await api.myCharacters(state.campaignId);
      if (chars?.characters) {
        state.characters = chars.characters;
        if (!state.characters.some((c) => c.id === state.characterId)) {
          state.characterId = state.characters[0]?.id || null;
        }
        renderSwitcher();
        if (state.viewMode === "character") renderCharacter();
      }
      if (state.tab === "party") {
        const party = await api.party(state.campaignId);
        if (party?.party) {
          state.party = party.party;
          renderParty();
        }
      }
    } catch (err) {
      if (expired(err)) return;
      /* soft refresh stays silent on transient errors */
    }
  }

  async function logout() {
    await safe(() => api.logout());
    state.bootstrap = null;
    show("login");
  }

  els.createCharacterCancel?.addEventListener("click", () => {
    els.createCharacterDialog?.close();
  });
  els.attachCampaignCancel?.addEventListener("click", () => {
    els.attachCampaignDialog?.close();
  });
  els.attachCampaignForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const campaignId = els.attachCampaignSelect?.value;
    if (campaignId) await attachToCampaign(campaignId);
  });
  els.characterCampaigns?.addEventListener("click", async (e) => {
    const detachBtn = e.target.closest("[data-detach-campaign-id]");
    if (detachBtn) {
      await detachFromCampaign(detachBtn.getAttribute("data-detach-campaign-id"));
      return;
    }
    if (e.target.id === "open-attach-campaign" || e.target.closest("#open-attach-campaign")) {
      await openAttachCampaignDialog();
    }
  });
  els.createCharacterForm?.addEventListener("submit", (e) => {
    submitCreateCharacter(e);
  });

  els.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    els.loginError.hidden = true;
    const fd = new FormData(els.loginForm);
    try {
      await api.login(String(fd.get("email") || ""), String(fd.get("password") || ""));
      await afterLogin(await api.bootstrap());
    } catch (err) {
      els.loginError.hidden = false;
      els.loginError.textContent =
        err.status === 401 ? "Invalid email or password." : err.message || "Sign-in failed.";
    }
  });

  els.logoutHome?.addEventListener("click", logout);
  els.logoutShell?.addEventListener("click", logout);
  els.logoutCharacter?.addEventListener("click", logout);
  els.backFromCharacter?.addEventListener("click", () => {
    goHome();
  });

  els.createCharacterHome?.addEventListener("click", () => {
    state.createCharacterMode = "standalone";
    openCreateCharacterDialog();
  });

  els.characterList?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-character-id]");
    if (!btn) return;
    await openCharacter(btn.getAttribute("data-character-id"));
  });

  els.homeCharacterSpotlight?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-character-id]");
    if (!btn) return;
    await openCharacter(btn.getAttribute("data-character-id"));
  });

  els.characterCampaigns?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-open-campaign-id]");
    if (!btn) return;
    const campaign = (state.bootstrap?.campaigns || []).find(
      (c) => c.id === btn.getAttribute("data-open-campaign-id")
    );
    if (campaign) await openCampaign(campaign);
  });

  /* character open from compact switcher only */
  els.campaignList.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-campaign-id]");
    if (!btn) return;
    const campaign = (state.bootstrap?.campaigns || []).find(
      (c) => c.id === btn.getAttribute("data-campaign-id")
    );
    if (campaign) await openCampaign(campaign);
  });

  els.switcher.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-character-id]");
    if (!btn) return;
    state.characterId = btn.getAttribute("data-character-id");
    renderSwitcher();
    renderPlayingAs();
    if (state.tab === "map") renderMapTab();
  });

  document.querySelector("#view-shell .tabs")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    state.tab = btn.getAttribute("data-tab");
    setTabs();
    await render();
  });

  els.main.addEventListener("input", (e) => {
    if (e.target && e.target.id === "library-q") {
      scheduleLibrarySearch(String(e.target.value || ""));
    }
    if (e.target && e.target.id === "notes-q") {
      state.notesQ = String(e.target.value || "");
      renderNotes();
    }
  });

  els.characterMain?.addEventListener("input", () => {});

  els.main.addEventListener("change", async (e) => {
    if (!activeMain()?.contains(e.target)) return;
    if (e.target && e.target.id === "notes-character") {
      state.notesCharacterId = String(e.target.value || "");
      renderNotes();
      return;
    }
    const equip = e.target.closest("[data-equip-inv]");
    if (equip) {
      await updateInventoryEntry(equip.getAttribute("data-equip-inv"), {
        equipped: Boolean(equip.checked)
      });
      return;
    }
    const qty = e.target.closest("[data-qty-inv]");
    if (qty) {
      const n = Number(qty.value);
      await updateInventoryEntry(qty.getAttribute("data-qty-inv"), {
        quantity: Number.isFinite(n) ? Math.max(0, n) : 0
      });
    }
  });

  document.getElementById("app")?.addEventListener("click", async (e) => {
    const surface = activeMain();
    if (!surface || !surface.contains(e.target)) return;
    if (e.target.closest("[data-create-character]")) {
      openCreateCharacterDialog();
      return;
    }
    const noteSelect = e.target.closest("[data-note-select]");
    if (noteSelect) {
      state.noteId = noteSelect.getAttribute("data-note-select");
      renderNotes();
      return;
    }
    const notesTag = e.target.closest("[data-notes-tag]");
    if (notesTag) {
      state.notesTag = notesTag.getAttribute("data-notes-tag") || "";
      renderNotes();
      return;
    }
    if (e.target.closest("[data-library-more]")) {
      await loadLibrary({ append: true, silent: true });
      return;
    }
    const libType = e.target.closest("[data-library-type]");
    if (libType) {
      state.libraryType = libType.getAttribute("data-library-type");
      await loadLibrary();
      return;
    }
    const toggle = e.target.closest("[data-toggle-section]");
    if (toggle) {
      const id = toggle.getAttribute("data-toggle-section");
      const next = !isSectionCollapsed(id);
      state.collapsed[id] = next;
      saveCollapsed();
      const sectionEl = toggle.closest(".sheet-section");
      if (sectionEl) {
        sectionEl.classList.toggle("is-collapsed", next);
        toggle.setAttribute("aria-expanded", next ? "false" : "true");
      }
      return;
    }
    if (e.target.closest("[data-edit-sheet]")) {
      openSheetEditor();
      return;
    }
    const openAdd = e.target.closest("[data-open-add]");
    if (openAdd) {
      openAddDialog(openAdd.getAttribute("data-open-add"));
      return;
    }
    if (e.target.closest("[data-add-class-resource]")) {
      const name = String(els.main.querySelector("[data-new-cr-name]")?.value || "")
        .trim()
        .slice(0, 40);
      if (!name) {
        window.alert("Enter a resource name first (e.g. Rage, Ki).");
        return;
      }
      const c = currentCharacter();
      if (!c) return;
      const next = { ...(c.state?.classResources || {}) };
      if (!next[name]) next[name] = { current: 0, max: 1 };
      const data = await safe(() =>
        patchState(c.id, { class_resources: next })
      );
      if (!data) return;
      applyCharacter(data.character);
      renderCharacter();
      return;
    }
    if (e.target.closest("[data-save-class-resources]")) {
      await saveClassResourcesFromDom(els.main);
      return;
    }
    const crRemove = e.target.closest("[data-cr-remove]");
    if (crRemove) {
      const key = crRemove.getAttribute("data-cr-remove");
      const c = currentCharacter();
      if (!c || !key) return;
      const next = { ...(c.state?.classResources || {}) };
      delete next[key];
      const data = await safe(() =>
        patchState(c.id, { class_resources: next })
      );
      if (!data) return;
      applyCharacter(data.character);
      renderCharacter();
      return;
    }
    const inspire = e.target.closest("[data-inspiration]");
    if (inspire) {
      await setInspiration(inspire.getAttribute("data-inspiration") === "1");
      return;
    }
    if (e.target.closest("[data-ds-reset]")) {
      await patchDeathSaves({ successes: 0, failures: 0 });
      return;
    }
    const ds = e.target.closest("[data-ds-kind]");
    if (ds) {
      const c = currentCharacter();
      const cur = parseDeathSaves(c?.state?.deathSaves);
      const kind = ds.getAttribute("data-ds-kind");
      const count = Number(ds.getAttribute("data-ds-count")) || 0;
      const prev = kind === "successes" ? cur.successes : cur.failures;
      const nextVal = prev === count ? count - 1 : count;
      const next = {
        successes: kind === "successes" ? nextVal : cur.successes,
        failures: kind === "failures" ? nextVal : cur.failures
      };
      await patchDeathSaves(next);
      return;
    }
    if (e.target.closest("[data-save-slots]")) {
      await saveSpellSlotsFromDom(els.main);
      return;
    }
    const removeInv = e.target.closest("[data-remove-inv]");
    if (removeInv) {
      const c = currentCharacter();
      if (!c) return;
      const data = await safe(() =>
        api.removeInventory(state.campaignId, c.id, removeInv.getAttribute("data-remove-inv"))
      );
      if (!data) return;
      applyCharacter(data.character);
      renderCharacter();
      return;
    }
    const removeCond = e.target.closest("[data-remove-condition]");
    if (removeCond) {
      const c = currentCharacter();
      const name = removeCond.getAttribute("data-remove-condition");
      const next = (c?.state?.conditions || []).filter((x) => x !== name);
      await patchConditions(next);
      return;
    }
    const hp = e.target.closest("[data-hp]");
    if (hp) {
      await bumpHp(Number(hp.getAttribute("data-hp")));
      return;
    }
    const ref = e.target.closest("[data-type][data-id]");
    if (ref) {
      await openRef(ref.getAttribute("data-type"), ref.getAttribute("data-id"));
      return;
    }
    if (e.target.closest("[data-note-new]")) {
      openNoteEditor(null);
      return;
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) {
      const note = state.notes.find((n) => n.id === edit.getAttribute("data-edit"));
      if (note) openNoteEditor(note);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") softRefreshLive();
  });
  window.addEventListener("focus", () => {
    softRefreshLive();
  });

  if (els.addCancel) {
    els.addCancel.addEventListener("click", () => closeAddDialog());
  }
  if (els.addSearch) {
    els.addSearch.addEventListener("input", () => scheduleAddSearch(els.addSearch.value));
  }
  if (els.addResults) {
    els.addResults.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-pick-id]");
      if (!btn) return;
      await pickCatalogueEntry(btn.getAttribute("data-pick-id"));
    });
  }
  if (els.addCustom) {
    els.addCustom.addEventListener("click", () => addCustomFromDialog());
  }
  if (els.addForm) {
    els.addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (state.addKind !== "condition") return;
      const name = String(els.addConditionInput?.value || "").trim();
      if (!name) return;
      const c = currentCharacter();
      const current = Array.isArray(c?.state?.conditions) ? c.state.conditions.slice() : [];
      if (!current.includes(name)) current.push(name);
      await patchConditions(current);
      closeAddDialog();
      renderCharacter();
    });
  }
  if (els.addDialog) {
    els.addDialog.addEventListener("close", () => {
      state.addKind = null;
      state.addResults = [];
    });
  }

  if (els.sheetForm) {
    els.sheetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const c = currentCharacter();
      if (!c) return;
      const f = els.sheetForm;
      const sheetPatch = {
        name: f.name.value.trim(),
        race: f.race.value,
        class: f.class.value,
        subclass: f.subclass.value,
        level: Number(f.level.value),
        background: f.background.value,
        alignment: f.alignment.value,
        abilities: {
          str: Number(f.str.value),
          dex: Number(f.dex.value),
          con: Number(f.con.value),
          int: Number(f.int.value),
          wis: Number(f.wis.value),
          cha: Number(f.cha.value)
        },
        ac: Number(f.ac.value),
        speed: f.speed.value,
        proficiencyBonus: f.proficiencyBonus.value,
        hitDice: f.hitDice.value,
        skillRefs: linesToRefs(f.skillRefs.value),
        featureRefs: linesToRefs(f.featureRefs.value),
        spellRefs: linesToRefs(f.spellRefs.value),
        currency: {
          cp: Number(f.cp.value) || 0,
          sp: Number(f.sp.value) || 0,
          ep: Number(f.ep.value) || 0,
          gp: Number(f.gp.value) || 0,
          pp: Number(f.pp.value) || 0
        }
      };
      const statePatch = {
        hp_current: Number(f.hpCurrent.value),
        hp_max: Number(f.hpMax.value),
        hp_temp: Number(f.hpTemp.value) || 0
      };
      const sheetData = await safe(() => patchSheet(c.id, sheetPatch));
      if (!sheetData) return;
      applyCharacter(sheetData.character);
      const stateData = await safe(() => patchState(c.id, statePatch));
      if (stateData) applyCharacter(stateData.character);
      const file = f.portrait.files && f.portrait.files[0];
      if (file) {
        try {
          const dataUrl = await fileToDataUrl(file);
          const portraitData = await safe(() =>
            putPortrait(c.id, dataUrl)
          );
          if (portraitData) applyCharacter(portraitData.character);
        } catch (err) {
          window.alert(err.message || "Portrait upload failed");
        }
      }
      if (els.sheetDialog.open) els.sheetDialog.close();
      renderCharacter();
    });
  }

  if (els.sheetCancel) {
    els.sheetCancel.addEventListener("click", () => {
      if (els.sheetDialog.open) els.sheetDialog.close();
    });
  }

  els.noteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(els.noteForm);
    const payload = {
      title: String(fd.get("title") || ""),
      body: String(fd.get("body") || ""),
      characterId: String(fd.get("characterId") || "") || null
    };
    const saved = state.editingNoteId
      ? await safe(() => api.updateNote(state.editingNoteId, payload))
      : await safe(() => api.createNote(state.campaignId, payload));
    if (!saved) return;
    closeNoteEditor();
    await render();
  });

  els.noteCancel.addEventListener("click", () => closeNoteEditor());

  els.noteDelete.addEventListener("click", () => setNoteConfirm(true));
  els.noteConfirmNo.addEventListener("click", () => setNoteConfirm(false));
  els.noteConfirmYes.addEventListener("click", async () => {
    if (!state.editingNoteId) return;
    const deleted = await safe(() => api.deleteNote(state.editingNoteId));
    if (!deleted) return;
    closeNoteEditor();
    await render();
  });

  els.noteDialog.addEventListener("close", () => {
    state.editingNoteId = null;
    setNoteConfirm(false);
  });

  els.dialog.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-library-attach]");
    if (!btn) return;
    e.preventDefault();
    await attachFromLibrary(
      btn.getAttribute("data-library-attach"),
      btn.getAttribute("data-attach-type"),
      btn.getAttribute("data-attach-id")
    );
  });

  els.availabilityCancel?.addEventListener("click", () => els.availabilityDialog?.close());
  els.eventCancel?.addEventListener("click", () => els.eventDialog?.close());
  els.postCancel?.addEventListener("click", () => els.postDialog?.close());

  if (window.PlayerSchedulingUI) {
    PlayerSchedulingUI.init({
      state,
      els,
      api,
      safe,
      render,
      openCampaign,
      setTabs,
      stopMapTab,
      goHome,
      root: document
    });
  }

  (async function boot() {
    try {
      await afterLogin(await api.bootstrap());
    } catch (err) {
      show("login");
      if (err.status && err.status !== 401) {
        els.loginError.hidden = false;
        els.loginError.textContent = err.message || "Unable to reach server.";
      }
    }
  })();
})();
