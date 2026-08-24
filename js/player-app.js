/**
 * Player companion UI — ids/classes match player/index.html and PlayerApiClient.
 */
(function () {
  "use strict";

  const api = window.PlayerApiClient;
  if (!api) return;

  const els = {
    login: document.getElementById("view-login"),
    campaigns: document.getElementById("view-campaigns"),
    shell: document.getElementById("view-shell"),
    loginForm: document.getElementById("login-form"),
    loginError: document.getElementById("login-error"),
    campaignList: document.getElementById("campaign-list"),
    shellCampaign: document.getElementById("shell-campaign"),
    shellTitle: document.getElementById("shell-title"),
    switcher: document.getElementById("char-switcher"),
    main: document.getElementById("main"),
    dialog: document.getElementById("detail-dialog"),
    detailTitle: document.getElementById("detail-title"),
    detailBody: document.getElementById("detail-body"),
    logoutCampaigns: document.getElementById("logout-campaigns"),
    logoutShell: document.getElementById("logout-shell"),
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
    sheetCancel: document.getElementById("sheet-cancel")
  };

  const state = {
    bootstrap: null,
    campaignId: null,
    characters: [],
    characterId: null,
    party: [],
    notes: [],
    tab: "characters",
    editingNoteId: null,
    collapsed: loadCollapsed()
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
    return id === "skills" || id === "features" || id === "spells" || id === "inventory";
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

  function mod(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    return v >= 0 ? `+${v}` : String(v);
  }

  function fmtTs(v) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function show(name) {
    els.login.hidden = name !== "login";
    els.campaigns.hidden = name !== "campaigns";
    els.shell.hidden = name !== "shell";
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
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === state.tab);
    });
    els.shellTitle.textContent =
      { characters: "Character sheet", party: "Party", notes: "Notes" }[state.tab] || "Companion";
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
    const c = currentCharacter();
    if (!c) {
      els.main.innerHTML = `<p class="empty">No controlled characters in this campaign.</p>`;
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
            const eq = item.equipped ? " · eq" : "";
            const open = item.itemId
              ? `<button type="button" class="pill" data-type="item" data-id="${esc(item.itemId)}">${label}${eq}</button>`
              : `<span class="pill static">${label}${eq}</span>`;
            return `<div class="inv-row">${open}<button type="button" class="btn btn-ghost" data-remove-inv="${esc(item.id)}">Remove</button></div>`;
          })
          .join("")}</div>`
      : `<p class="empty">Pack is empty.</p>`;
    const invBlock = `${inv}
        <form id="inv-add-form" class="row-form">
          <input name="customName" maxlength="120" placeholder="Add custom item" aria-label="Add custom item">
          <button class="btn" type="submit">Add</button>
        </form>`;
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
    const subclassBit = c.subclass ? ` (${c.subclass})` : "";
    const metaLine = `${c.race || "—"} · ${c.class || "—"}${subclassBit} · L${c.level}`;

    els.main.innerHTML = `
      <div class="sheet-toolbar">
        <button type="button" class="btn btn-primary" data-edit-sheet>Edit sheet</button>
      </div>
      <div class="vitals">
        <img class="portrait" src="${esc(api.portraitUrl(state.campaignId, c.id))}?t=${Date.now()}" alt="" onerror="window.PlayerAppDropPortrait(this)">
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
        <form id="condition-form" class="row-form">
          <input name="condition" maxlength="80" placeholder="Add condition" aria-label="Add condition">
          <button class="btn" type="submit">Add</button>
        </form>`
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
      ${section(
        "skills",
        "Skills",
        `${pills(c.skillRefs)}
        <form id="skill-add-form" class="row-form" data-ref-field="skillRefs">
          <input name="line" maxlength="200" placeholder="Add skill (@skill:id|Label or text)" aria-label="Add skill">
          <button class="btn" type="submit">Add</button>
        </form>`
      )}
      ${section(
        "features",
        "Features",
        `${pills(c.featureRefs)}
        <form id="feature-add-form" class="row-form" data-ref-field="featureRefs">
          <input name="line" maxlength="200" placeholder="Add feature" aria-label="Add feature">
          <button class="btn" type="submit">Add</button>
        </form>`
      )}
      ${section(
        "spells",
        "Spells",
        `${pills(c.spellRefs)}
        <form id="spell-add-form" class="row-form" data-ref-field="spellRefs">
          <input name="line" maxlength="200" placeholder="Add spell" aria-label="Add spell">
          <button class="btn" type="submit">Add</button>
        </form>`
      )}
      ${section("inventory", "Inventory", invBlock)}`;
  }

  function renderParty() {
    if (!state.party.length) {
      els.main.innerHTML = `<p class="empty">No player characters in this party yet.</p>`;
      return;
    }
    els.main.innerHTML = `<div class="party-list">${state.party
      .map((p) =>
        identityCard(
          p.name,
          `${p.race || "—"} · ${p.class || "—"} · Level ${p.level}`,
          api.portraitUrl(state.campaignId, p.id),
          "h3"
        )
      )
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

  function renderNotes() {
    const list = state.notes.length
      ? `<ul class="list">${state.notes
          .map(
            (n) => `<li class="card">
            <h3>${esc(n.title || "Untitled")}</h3>
            <p class="meta">${esc((n.body || "").slice(0, 140))}${(n.body || "").length > 140 ? "…" : ""}</p>
            <p class="meta">${esc(noteTimestampLine(n))}</p>
            <div class="row">
              <button type="button" class="btn btn-ghost" data-edit="${esc(n.id)}">Edit</button>
            </div>
          </li>`
          )
          .join("")}</ul>`
      : `<p class="empty">No notes yet.</p>`;
    els.main.innerHTML = `
      <p><button type="button" class="btn btn-primary" data-note-new>New note</button></p>
      ${list}`;
  }

  async function render() {
    if (state.tab === "characters") {
      renderCharacter();
      return;
    }
    if (state.tab === "party") {
      const data = await safe(() => api.party(state.campaignId));
      if (!data) return;
      state.party = data.party || [];
      renderParty();
      return;
    }
    const data = await safe(() => api.notes(state.campaignId));
    if (!data) return;
    state.notes = data.notes || [];
    renderNotes();
  }

  async function openCampaign(campaign) {
    state.campaignId = campaign.id;
    els.shellCampaign.textContent = campaign.name;
    const data = await safe(() => api.myCharacters(campaign.id));
    if (!data) return;
    state.characters = data.characters || [];
    state.characterId = state.characters[0] ? state.characters[0].id : null;
    state.tab = "characters";
    show("shell");
    setTabs();
    renderSwitcher();
    await render();
  }

  async function afterLogin(bootstrap) {
    state.bootstrap = bootstrap;
    const campaigns = bootstrap.campaigns || [];
    if (campaigns.length === 1) {
      await openCampaign(campaigns[0]);
      return;
    }
    if (!campaigns.length) {
      els.campaignList.innerHTML = `<li class="empty">No campaign memberships yet.</li>`;
    } else {
      els.campaignList.innerHTML = campaigns
        .map(
          (c) => `<li>
          <button type="button" class="card card-btn" data-campaign-id="${esc(c.id)}">
            <h2>${esc(c.name)}</h2>
            <p class="meta">${esc(c.role)} · ${(c.controlledCharacters || []).length} character(s)</p>
          </button>
        </li>`
        )
        .join("");
    }
    show("campaigns");
  }

  async function openRef(type, id) {
    const data = await safe(() => api.catalogue(state.campaignId, type, id));
    if (!data) return;
    const entry = data.entry || {};
    els.detailTitle.textContent = entry.name || id;
    els.detailBody.textContent =
      [
        entry.description || entry.summary || "",
        entry.school ? `School: ${entry.school}` : "",
        entry.level != null ? `Level: ${entry.level}` : "",
        entry.rawSafe?.castingTime ? `Casting time: ${entry.rawSafe.castingTime}` : "",
        entry.rawSafe?.range ? `Range: ${entry.rawSafe.range}` : "",
        entry.rawSafe?.duration ? `Duration: ${entry.rawSafe.duration}` : "",
        entry.properties || ""
      ]
        .filter(Boolean)
        .join("\n\n") || "No description available.";
    els.dialog.showModal();
  }

  async function patchConditions(next) {
    const c = currentCharacter();
    if (!c) return;
    const data = await safe(() =>
      api.patchState(state.campaignId, c.id, { conditions: next })
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
      api.patchState(state.campaignId, c.id, { hp_current: current + delta })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function setInspiration(on) {
    const c = currentCharacter();
    if (!c) return;
    const data = await safe(() =>
      api.patchState(state.campaignId, c.id, { inspiration: Boolean(on) })
    );
    if (!data) return;
    applyCharacter(data.character);
    renderCharacter();
  }

  async function logout() {
    await safe(() => api.logout());
    state.bootstrap = null;
    show("login");
  }

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

  els.logoutCampaigns.addEventListener("click", logout);
  els.logoutShell.addEventListener("click", logout);

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
    renderCharacter();
  });

  document.querySelector(".tabs").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    state.tab = btn.getAttribute("data-tab");
    setTabs();
    await render();
  });

  els.main.addEventListener("click", async (e) => {
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
    const inspire = e.target.closest("[data-inspiration]");
    if (inspire) {
      await setInspiration(inspire.getAttribute("data-inspiration") === "1");
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

  els.main.addEventListener("submit", async (e) => {
    if (!(e.target instanceof HTMLFormElement)) return;
    if (e.target.id === "condition-form") {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get("condition") || "").trim();
      if (!name) return;
      const c = currentCharacter();
      const current = Array.isArray(c?.state?.conditions) ? c.state.conditions.slice() : [];
      if (!current.includes(name)) current.push(name);
      await patchConditions(current);
      return;
    }
    if (e.target.id === "inv-add-form") {
      e.preventDefault();
      const c = currentCharacter();
      if (!c) return;
      const fd = new FormData(e.target);
      const customName = String(fd.get("customName") || "").trim();
      if (!customName) return;
      const data = await safe(() =>
        api.addInventory(state.campaignId, c.id, { customName, quantity: 1 })
      );
      if (!data) return;
      applyCharacter(data.character);
      renderCharacter();
      return;
    }
    const refField = e.target.getAttribute("data-ref-field");
    if (refField) {
      e.preventDefault();
      const c = currentCharacter();
      if (!c) return;
      const fd = new FormData(e.target);
      const line = String(fd.get("line") || "").trim();
      if (!line) return;
      const existing = (c[refField] || []).map(
        (r) => r.raw || (r.type && r.id ? `@${r.type}:${r.id}|${r.label || r.id}` : r.label || "")
      );
      existing.push(line);
      const data = await safe(() =>
        api.patchSheet(state.campaignId, c.id, { [refField]: existing })
      );
      if (!data) return;
      applyCharacter(data.character);
      renderCharacter();
    }
  });

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
      const sheetData = await safe(() => api.patchSheet(state.campaignId, c.id, sheetPatch));
      if (!sheetData) return;
      applyCharacter(sheetData.character);
      const stateData = await safe(() => api.patchState(state.campaignId, c.id, statePatch));
      if (stateData) applyCharacter(stateData.character);
      const file = f.portrait.files && f.portrait.files[0];
      if (file) {
        try {
          const dataUrl = await fileToDataUrl(file);
          const portraitData = await safe(() =>
            api.putPortrait(state.campaignId, c.id, dataUrl)
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
