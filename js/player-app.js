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
    noteConfirmNo: document.getElementById("note-confirm-no")
  };

  const state = {
    bootstrap: null,
    campaignId: null,
    characters: [],
    characterId: null,
    party: [],
    notes: [],
    tab: "characters",
    editingNoteId: null
  };

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
      { characters: "My Characters", party: "Party", notes: "Notes" }[state.tab] || "Companion";
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
    const parent = img.parentElement;
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

  function pills(refs) {
    if (!refs || !refs.length) return `<p class="empty">None listed.</p>`;
    return `<div class="pills">${refs
      .map((r) => {
        const label = esc(r.label || r.id || r.raw);
        if (r.type && r.id) {
          return `<button type="button" class="pill" data-type="${esc(r.type)}" data-id="${esc(r.id)}">${label}</button>`;
        }
        return `<span class="pill static">${label}</span>`;
      })
      .join("")}</div>`;
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
      ? `<div class="pills">${c.inventory
          .map((item) => {
            const label = esc(item.itemName || item.customName || item.itemId || "Item");
            if (item.itemId) {
              return `<button type="button" class="pill" data-type="item" data-id="${esc(item.itemId)}">${label}${item.equipped ? " · eq" : ""}</button>`;
            }
            return `<span class="pill static">${label}</span>`;
          })
          .join("")}</div>`
      : `<p class="empty">No inventory entries.</p>`;
    const condList = Array.isArray(c.state?.conditions) ? c.state.conditions : [];
    const conditionPills = condList.length
      ? `<div class="pills">${condList
          .map(
            (cond) =>
              `<button type="button" class="pill" data-remove-condition="${esc(cond)}">${esc(cond)} ×</button>`
          )
          .join("")}</div>`
      : `<p class="empty">None</p>`;

    els.main.innerHTML = `
      ${identityCard(
        c.name,
        `${c.race || "—"} · ${c.class || "—"} · Level ${c.level}`,
        api.portraitUrl(state.campaignId, c.id),
        "h2"
      )}
      <div class="hp card">
        <div>
          <p class="hp-value">${esc(c.state?.hpCurrent ?? "—")} <span>/ ${esc(c.state?.hpMax ?? "—")}</span></p>
          <p class="meta">Hit points${c.state?.hpTemp ? ` · temp ${esc(c.state.hpTemp)}` : ""}</p>
        </div>
        <div class="hp-btns">
          <button type="button" class="btn" data-hp="-1" aria-label="Decrease HP">−</button>
          <button type="button" class="btn" data-hp="1" aria-label="Increase HP">+</button>
        </div>
      </div>
      <div class="stats">${abilityHtml}</div>
      <section class="block">
        <h3>Combat</h3>
        <p class="meta">AC ${esc(c.ac ?? "—")} · Speed ${esc(c.speed || "—")} · Prof ${esc(c.proficiencyBonus || "—")} · HD ${esc(c.hitDice || "—")}</p>
      </section>
      <section class="block">
        <h3>Conditions</h3>
        ${conditionPills}
        <form id="condition-form" class="row-form">
          <input name="condition" maxlength="80" placeholder="Add condition" aria-label="Add condition">
          <button class="btn" type="submit">Add</button>
        </form>
      </section>
      <section class="block"><h3>Skills</h3>${pills(c.skillRefs)}</section>
      <section class="block"><h3>Features</h3>${pills(c.featureRefs)}</section>
      <section class="block"><h3>Spells</h3>${pills(c.spellRefs)}</section>
      <section class="block"><h3>Inventory</h3>${inv}</section>`;
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
    const idx = state.characters.findIndex((x) => x.id === c.id);
    if (idx >= 0) state.characters[idx] = data.character;
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
    const idx = state.characters.findIndex((x) => x.id === c.id);
    if (idx >= 0) state.characters[idx] = data.character;
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
    }
  });

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
