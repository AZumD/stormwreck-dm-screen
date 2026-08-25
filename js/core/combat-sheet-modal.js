/**
 * DM combat sheet modal — editable HP / AC / conditions for:
 * - PCs (Postgres character state + sheet AC; remirror on save)
 * - NPCs (sitewide NPC catalogue)
 * - Monster map tokens (per-instance; never writes monster catalogue)
 */
window.CombatSheetModal = (function () {
  "use strict";

  let dialogEl = null;
  let titleEl = null;
  let bodyEl = null;
  let current = null;
  let saveTimer = null;
  let dirty = false;

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function campaignId() {
    return document.body?.dataset?.campaignId || window.ADVENTURE?.meta?.id || null;
  }

  function parseHpBlob(raw) {
    if (raw == null || raw === "") return { current: null, max: null };
    if (typeof raw === "number" && Number.isFinite(raw)) return { current: raw, max: raw };
    const s = String(raw).trim();
    const slash = s.match(/^(\d+)\s*\/\s*(\d+)/);
    if (slash) return { current: Number(slash[1]), max: Number(slash[2]) };
    const n = s.match(/(\d+)/);
    if (n) {
      const v = Number(n[1]);
      return { current: v, max: v };
    }
    return { current: null, max: null };
  }

  function parseAc(raw) {
    if (raw == null || raw === "") return null;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const m = String(raw).match(/(\d+)/);
    return m ? Number(m[1]) : null;
  }

  function conditionsToText(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    if (value == null) return "";
    return String(value);
  }

  function textToConditions(text) {
    return String(text || "")
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function normalizeInitiative(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function parseDeathSaves(raw) {
    const d = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    return {
      successes: Math.min(3, Math.max(0, Number(d.successes) || 0)),
      failures: Math.min(3, Math.max(0, Number(d.failures) || 0))
    };
  }

  function parseSpellSlots(raw) {
    const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (let i = 1; i <= 9; i++) {
      const row = src[String(i)] || src[i] || {};
      const max = Math.max(0, Number(row.max) || 0);
      const used = Math.max(0, Number(row.used) || 0);
      out[String(i)] = { max, used: Math.min(used, max || used) };
    }
    return out;
  }

  function deathSavesHtml(saves) {
    const s = parseDeathSaves(saves);
    const boxes = (name, count) =>
      [0, 1, 2]
        .map(
          (i) =>
            `<label class="combat-sheet__ds-box"><input type="checkbox" name="${name}" data-index="${i}" ${
              i < count ? "checked" : ""
            }></label>`
        )
        .join("");
    return `
      <div class="combat-sheet__death-saves" data-death-saves>
        <p class="combat-sheet__section-label">Death saves</p>
        <div class="combat-sheet__ds-row"><span>Successes</span>${boxes("dsSuccess", s.successes)}</div>
        <div class="combat-sheet__ds-row"><span>Failures</span>${boxes("dsFail", s.failures)}</div>
        <button type="button" class="btn" data-reset-death-saves>Reset</button>
      </div>`;
  }

  function spellSlotsHtml(slots) {
    const parsed = parseSpellSlots(slots);
    const rows = [];
    for (let i = 1; i <= 9; i++) {
      const row = parsed[String(i)];
      rows.push(`
        <label class="combat-sheet__slot-row">
          <span>L${i}</span>
          <input type="number" name="slotMax${i}" min="0" step="1" value="${row.max}" title="Max" aria-label="Level ${i} max">
          <span class="combat-sheet__slash">/</span>
          <input type="number" name="slotUsed${i}" min="0" step="1" value="${row.used}" title="Used" aria-label="Level ${i} used">
        </label>`);
    }
    return `
      <div class="combat-sheet__spell-slots" data-spell-slots>
        <p class="combat-sheet__section-label">Spell slots <span class="combat-sheet__hint">max / used</span></p>
        <div class="combat-sheet__slot-grid">${rows.join("")}</div>
      </div>`;
  }

  function syncInitiativeTracker(key, name, initiative, kind) {
    const cid = campaignId();
    if (!cid || !window.CampaignMapState || !key) return;
    const all = { ...(CampaignMapState.get(cid)?.initiativeTracker || {}) };
    const init = normalizeInitiative(initiative);
    if (!init) delete all[key];
    else all[key] = { name: name || key, initiative: init, kind: kind || "combatant" };
    CampaignMapState.patch(cid, { initiativeTracker: all });
    window.MapPanel?.refreshInitiative?.();
  }

  function setStatus(msg, isError) {
    const el = bodyEl?.querySelector("[data-combat-status]");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", Boolean(isError));
  }

  function formatStatValue(value) {
    const raw = String(value ?? "");
    if (!raw) return "";
    if (raw.includes("@") || raw.includes("[[")) {
      const registry = window.EntityRegistry?.getAll?.() || window.ENTITIES || {};
      if (window.ContentParser?.replaceLinks) return ContentParser.replaceLinks(raw, registry);
    }
    return escapeHtml(raw);
  }

  function resolveCombatEntity({ entityId, catalogueId }) {
    if (entityId && window.EntityRegistry?.resolve) {
      const hit = EntityRegistry.resolve(entityId);
      if (hit) return hit;
    }
    if (catalogueId && window.EntityRegistry?.resolve) {
      const hit = EntityRegistry.resolve(catalogueId);
      if (hit) return hit;
    }
    if (catalogueId && window.EntityRegistry?.getAll) {
      return (
        Object.values(EntityRegistry.getAll()).find(
          (e) => e.catalogueId === catalogueId || e.id === catalogueId
        ) || null
      );
    }
    return null;
  }

  function fillCombatReference({ entityId, catalogueId }) {
    const el = bodyEl?.querySelector("[data-combat-reference]");
    if (!el) return;
    const entity = resolveCombatEntity({ entityId, catalogueId });
    if (!entity) {
      el.innerHTML = "";
      el.hidden = true;
      return;
    }

    const skipStats = new Set(["HP", "AC"]);
    const statEntries = Object.entries(entity.stats || {}).filter(
      ([label, value]) => value != null && value !== "" && !skipStats.has(label)
    );
    const detailsHtml = entity.details
      ? window.ContentParser?.markdownLite?.(entity.details) || ""
      : "";

    if (!statEntries.length && !detailsHtml) {
      el.innerHTML = "";
      el.hidden = true;
      return;
    }

    let html = `<h3 class="combat-sheet__reference-title">Combat reference</h3>`;
    if (statEntries.length) {
      html += `<div class="stat-block">`;
      for (const [label, value] of statEntries) {
        html += `<div class="stat-row"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${formatStatValue(value)}</span></div>`;
      }
      html += `</div>`;
    }
    if (detailsHtml) html += `<div class="combat-sheet__reference-body">${detailsHtml}</div>`;
    el.innerHTML = html;
    el.hidden = false;
  }

  function readForm() {
    if (!bodyEl) return null;
    const hpCurrent = bodyEl.querySelector("[name=hpCurrent]")?.value;
    const hpMax = bodyEl.querySelector("[name=hpMax]")?.value;
    const hpTemp = bodyEl.querySelector("[name=hpTemp]")?.value;
    const ac = bodyEl.querySelector("[name=ac]")?.value;
    const initiative = bodyEl.querySelector("[name=initiative]")?.value;
    const conditions = bodyEl.querySelector("[name=conditions]")?.value ?? "";
    const inspiration = Boolean(bodyEl.querySelector("[name=inspiration]")?.checked);
    const deathSaves = {
      successes: bodyEl.querySelectorAll("[name=dsSuccess]:checked").length,
      failures: bodyEl.querySelectorAll("[name=dsFail]:checked").length
    };
    const spellSlots = {};
    for (let i = 1; i <= 9; i++) {
      const max = Number(bodyEl.querySelector(`[name=slotMax${i}]`)?.value);
      const used = Number(bodyEl.querySelector(`[name=slotUsed${i}]`)?.value);
      spellSlots[String(i)] = {
        max: Number.isFinite(max) ? Math.max(0, max) : 0,
        used: Number.isFinite(used) ? Math.max(0, used) : 0
      };
    }
    return {
      hpCurrent: hpCurrent === "" ? null : Number(hpCurrent),
      hpMax: hpMax === "" ? null : Number(hpMax),
      hpTemp: hpTemp === "" ? 0 : Number(hpTemp),
      ac: ac === "" ? null : Number(ac),
      initiative: normalizeInitiative(initiative),
      conditions,
      inspiration,
      deathSaves,
      spellSlots
    };
  }

  function ensureDialog() {
    if (dialogEl) return;
    dialogEl = document.getElementById("combat-sheet-modal");
    if (!dialogEl) {
      dialogEl = document.createElement("dialog");
      dialogEl.id = "combat-sheet-modal";
      dialogEl.className = "entity-modal combat-sheet-modal";
      dialogEl.innerHTML = `
        <div class="modal-header">
          <h2 id="combat-sheet-title">Combat sheet</h2>
          <button type="button" class="modal-close" id="combat-sheet-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body" id="combat-sheet-body"></div>`;
      document.body.appendChild(dialogEl);
    }
    titleEl = document.getElementById("combat-sheet-title");
    bodyEl = document.getElementById("combat-sheet-body");
    document.getElementById("combat-sheet-close")?.addEventListener("click", close);
    dialogEl.addEventListener("click", (e) => {
      if (e.target === dialogEl) close();
    });
    dialogEl.addEventListener("close", () => {
      clearTimeout(saveTimer);
      current = null;
      dirty = false;
    });
  }

  function adjustHp(delta) {
    const input = bodyEl?.querySelector("[name=hpCurrent]");
    if (!input) return;
    const cur = Number(input.value);
    input.value = String((Number.isFinite(cur) ? cur : 0) + delta);
    dirty = true;
    scheduleSave();
  }

  function scheduleSave() {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      save().catch(() => undefined);
    }, 450);
  }

  function refreshParty() {
    if (window.PartyRoster?.syncWindowParty) PartyRoster.syncWindowParty();
    if (window.PartyRoster?.render) PartyRoster.render();
  }

  function openCatalogueEntity(entityId, catalogueId, type) {
    close();
    let eid = entityId;
    if (!eid && catalogueId && window.EntityRegistry?.getAll) {
      eid = Object.values(EntityRegistry.getAll() || {}).find(
        (e) => e.catalogueId === catalogueId || (type && e.type === type && e.id === catalogueId)
      )?.id;
    }
    if (eid && window.EntityUI?.openModal) EntityUI.openModal(eid);
  }

  function renderShell(model) {
    ensureDialog();
    if (titleEl) titleEl.textContent = model.name || "Combat sheet";
    const portrait = model.portrait
      ? `<img class="entity-portrait combat-sheet__portrait" src="${escapeHtml(model.portrait)}" alt="">`
      : "";
    const badge = `<span class="combat-sheet__badge combat-sheet__badge--${escapeHtml(model.kind)}">${escapeHtml(model.badge || model.kind)}</span>`;
    const insp =
      model.kind === "pc"
        ? `<label class="combat-sheet__check"><input type="checkbox" name="inspiration" ${model.inspiration ? "checked" : ""}> Inspiration</label>`
        : "";
    const temp =
      model.kind === "pc"
        ? `<label class="combat-sheet__field">Temp HP
            <input type="number" name="hpTemp" value="${escapeHtml(model.hpTemp ?? 0)}" step="1">
          </label>`
        : "";
    const pcExtras =
      model.kind === "pc"
        ? `${deathSavesHtml(model.deathSaves)}${spellSlotsHtml(model.spellSlots)}`
        : "";
    const removeFromMapBtn =
      model.removeFromMap
        ? `<button type="button" class="btn btn-danger combat-sheet__remove" data-remove-from-map>Remove from map</button>`
        : "";
    const catalogueLink = model.catalogueOpen
      ? `<button type="button" class="btn combat-sheet__link" data-open-catalogue>Open full catalogue</button>`
      : "";

    bodyEl.innerHTML = `
      <div class="combat-sheet">
        <div class="combat-sheet__head">
          ${portrait}
          <div class="combat-sheet__head-text">
            ${badge}
            ${model.subtitle ? `<p class="combat-sheet__sub">${escapeHtml(model.subtitle)}</p>` : ""}
          </div>
        </div>
        <div class="combat-sheet__vitals">
          <div class="combat-sheet__hp-row">
            <label class="combat-sheet__field">HP
              <span class="combat-sheet__hp-inputs">
                <input type="number" name="hpCurrent" value="${escapeHtml(model.hpCurrent ?? "")}" step="1">
                <span class="combat-sheet__slash">/</span>
                <input type="number" name="hpMax" value="${escapeHtml(model.hpMax ?? "")}" step="1">
              </span>
            </label>
            <div class="combat-sheet__hp-btns">
              <button type="button" class="btn" data-hp-delta="-1">−1</button>
              <button type="button" class="btn" data-hp-delta="1">+1</button>
            </div>
          </div>
          <label class="combat-sheet__field">AC
            <input type="number" name="ac" value="${escapeHtml(model.ac ?? "")}" step="1">
          </label>
          <label class="combat-sheet__field">Initiative
            <input type="number" name="initiative" value="${escapeHtml(model.initiative ?? 0)}" step="1" title="0 hides from turn order">
          </label>
          ${temp}
          ${insp}
          <label class="combat-sheet__field combat-sheet__field--full">Conditions
            <textarea name="conditions" rows="2" placeholder="poisoned, prone…">${escapeHtml(model.conditions || "")}</textarea>
          </label>
        </div>
        ${pcExtras}
        <div class="combat-sheet__reference-wrap" data-combat-reference hidden></div>
        <div class="combat-sheet__footer">
          <button type="button" class="btn" data-combat-save>Save</button>
          ${removeFromMapBtn}
          ${catalogueLink}
          <span class="combat-sheet__status" data-combat-status></span>
        </div>
        <div class="combat-sheet__extra" data-combat-extra></div>
      </div>`;

    bodyEl.querySelectorAll("[data-hp-delta]").forEach((btn) => {
      btn.addEventListener("click", () => adjustHp(Number(btn.dataset.hpDelta) || 0));
    });
    bodyEl.querySelector("[data-reset-death-saves]")?.addEventListener("click", () => {
      bodyEl.querySelectorAll("[name=dsSuccess], [name=dsFail]").forEach((el) => {
        el.checked = false;
      });
      dirty = true;
      scheduleSave();
    });
    bodyEl.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("input", scheduleSave);
      el.addEventListener("change", scheduleSave);
      el.addEventListener("blur", () => {
        if (dirty) save().catch(() => undefined);
      });
    });
    bodyEl.querySelector("[data-combat-save]")?.addEventListener("click", () => {
      save().catch(() => undefined);
    });
    bodyEl.querySelector("[data-open-catalogue]")?.addEventListener("click", () => {
      model.catalogueOpen?.();
    });
    bodyEl.querySelector("[data-remove-from-map]")?.addEventListener("click", () => {
      if (!window.confirm(`Remove “${model.name || "this monster"}” from this map?`)) return;
      removeMonsterFromMap().catch(() => undefined);
    });
  }

  async function removeMonsterFromMap() {
    if (!current || current.kind !== "monster-token") return;
    const cid = current.campaignId;
    const mapId = current.mapId;
    if (!cid || !mapId || !window.CampaignMapState) throw new Error("Map state unavailable");
    const all = { ...(CampaignMapState.get(cid)?.tokens || {}) };
    const list = Array.isArray(all[mapId]) ? all[mapId].filter((t) => t.id !== current.tokenId) : [];
    all[mapId] = list;
    CampaignMapState.patch(cid, { tokens: all });
    syncInitiativeTracker(`tok:${current.tokenId}`, current.name, 0, "monster");
    current.onRemoved?.();
    close();
  }

  async function resolvePcCharacter(catalogueId) {
    const cid = campaignId();
    if (!cid || !window.LocalApiClient?.listCharacters) {
      throw new Error("Campaign character API unavailable (is the server running with DATABASE_URL?)");
    }
    const list = await LocalApiClient.listCharacters(cid);
    const hit =
      list.find((c) => c.catalogue_pc_id === catalogueId || c.id === catalogueId) ||
      list.find((c) => String(c.catalogue_pc_id || "") === String(catalogueId));
    if (!hit) {
      throw new Error("No linked campaign character for this PC (import or create the PC first)");
    }
    const [character, state] = await Promise.all([
      LocalApiClient.getCharacter(cid, hit.id),
      LocalApiClient.getCharacterState(cid, hit.id)
    ]);
    return { character, state: state || {}, characterId: hit.id, campaignId: cid };
  }

  async function openPc(opts) {
    const catalogueId = opts.catalogueId;
    if (!catalogueId) throw new Error("Missing PC catalogue id");
    const bundle = await resolvePcCharacter(catalogueId);
    const sheet =
      bundle.character?.sheet && typeof bundle.character.sheet === "object" ? bundle.character.sheet : {};
    const state = bundle.state || {};
    let entry = window.CatalogueStore?.get?.("pc", catalogueId);
    if (entry && window.CatalogueImages?.hydrate) entry = CatalogueImages.hydrate("pc", entry);
    current = {
      kind: "pc",
      catalogueId,
      characterId: bundle.characterId,
      campaignId: bundle.campaignId,
      name: bundle.character?.name || opts.name || entry?.name || "PC",
      extras: state.extras && typeof state.extras === "object" ? { ...state.extras } : {}
    };
    const extras = current.extras;
    renderShell({
      kind: "pc",
      badge: "PC",
      name: current.name,
      subtitle: [sheet.class || entry?.class, bundle.character?.level ? `Lv ${bundle.character.level}` : ""]
        .filter(Boolean)
        .join(" · "),
      portrait: entry?.portrait || opts.portrait || "",
      hpCurrent: state.hp_current ?? entry?.hpCurrent ?? null,
      hpMax: state.hp_max ?? entry?.hpMax ?? null,
      hpTemp: state.hp_temp ?? 0,
      ac: sheet.ac ?? entry?.ac ?? null,
      initiative: normalizeInitiative(extras.combat_initiative),
      conditions: conditionsToText(state.conditions),
      inspiration: Boolean(state.inspiration),
      deathSaves: parseDeathSaves(state.death_saves),
      spellSlots: parseSpellSlots(state.spell_slots),
      catalogueOpen: () => openCatalogueEntity(opts.entityId, catalogueId, "pc")
    });
    fillCombatReference({ entityId: opts.entityId, catalogueId });
    show();
  }

  async function openNpc(opts) {
    const catalogueId = opts.catalogueId;
    if (!catalogueId || !window.CatalogueStore) throw new Error("Missing NPC catalogue id");
    let entry = CatalogueStore.get("npc", catalogueId);
    if (!entry) throw new Error("NPC not found in catalogue");
    if (window.CatalogueImages?.hydrate) entry = CatalogueImages.hydrate("npc", entry);
    const hp = parseHpBlob(entry.hp);
    current = {
      kind: "npc",
      catalogueId,
      entry,
      name: entry.name || opts.name || "NPC",
      entityId: opts.entityId
    };
    renderShell({
      kind: "npc",
      badge: "NPC",
      name: current.name,
      subtitle: entry.role || "",
      portrait: entry.portrait || "",
      hpCurrent: hp.current,
      hpMax: hp.max,
      ac: parseAc(entry.ac),
      initiative: normalizeInitiative(entry.combatInitiative),
      conditions: entry.combatConditions || "",
      catalogueOpen: () => openCatalogueEntity(opts.entityId, catalogueId, "npc")
    });
    fillCombatReference({ entityId: opts.entityId, catalogueId });
    const extra = bodyEl.querySelector("[data-combat-extra]");
    if (extra && window.CampaignStateUI?.enrichEntityModal) {
      const entity =
        (opts.entityId && window.EntityRegistry?.resolve?.(opts.entityId)) ||
        Object.values(window.EntityRegistry?.getAll?.() || {}).find(
          (e) => e.type === "npc" && (e.catalogueId === catalogueId || e.id === catalogueId)
        );
      if (entity) CampaignStateUI.enrichEntityModal(entity, extra);
    }
    show();
  }

  function openMonsterToken(opts) {
    const token = opts.token;
    if (!token) throw new Error("Missing monster token");
    current = {
      kind: "monster-token",
      mapId: opts.mapId,
      tokenId: token.id,
      campaignId: opts.campaignId || campaignId(),
      name: token.label || "Monster",
      catalogueId: token.catalogueId || null,
      onRemoved: typeof opts.onRemoved === "function" ? opts.onRemoved : null
    };
    renderShell({
      kind: "monster",
      badge: "Monster instance",
      name: current.name,
      subtitle: token.catalogueId ? "Template · no catalogue write-back" : "Combat token",
      portrait: token.imageUrl || "",
      hpCurrent: token.hpCurrent ?? null,
      hpMax: token.hpMax ?? null,
      ac: token.ac ?? null,
      initiative: normalizeInitiative(token.initiative),
      conditions: token.conditions || "",
      removeFromMap: true,
      catalogueOpen: token.catalogueId
        ? () => openCatalogueEntity(null, token.catalogueId, "monster")
        : null
    });
    fillCombatReference({ catalogueId: token.catalogueId });
    show();
  }

  async function savePc(form) {
    const extras = {
      ...(current.extras || {}),
      combat_initiative: normalizeInitiative(form.initiative)
    };
    current.extras = extras;
    await LocalApiClient.putCharacterState(current.campaignId, current.characterId, {
      hp_current: form.hpCurrent,
      hp_max: form.hpMax,
      hp_temp: Number.isFinite(form.hpTemp) ? form.hpTemp : 0,
      conditions: textToConditions(form.conditions),
      inspiration: Boolean(form.inspiration),
      death_saves: parseDeathSaves(form.deathSaves),
      spell_slots: parseSpellSlots(form.spellSlots),
      extras
    });
    if (form.ac != null && Number.isFinite(form.ac)) {
      await LocalApiClient.patchCharacter(current.campaignId, current.characterId, { ac: form.ac });
    }
    syncInitiativeTracker(`pc:${current.characterId}`, current.name, form.initiative, "pc");
    refreshParty();
  }

  async function saveNpc(form) {
    const entry = { ...current.entry };
    const cur = Number.isFinite(form.hpCurrent) ? form.hpCurrent : "";
    const max = Number.isFinite(form.hpMax) ? form.hpMax : "";
    if (cur !== "" && max !== "") entry.hp = `${cur}/${max}`;
    else if (max !== "") entry.hp = String(max);
    else if (cur !== "") entry.hp = String(cur);
    entry.ac = Number.isFinite(form.ac) ? String(form.ac) : form.ac == null ? entry.ac || "" : String(form.ac);
    entry.combatConditions = form.conditions || "";
    entry.combatInitiative = normalizeInitiative(form.initiative);
    current.entry = await CatalogueStore.upsert("npc", entry);
    if (window.EntityRegistry?.build) EntityRegistry.build();
    syncInitiativeTracker(`npc:${current.catalogueId}`, current.name, form.initiative, "npc");
    refreshParty();
  }

  async function saveMonsterToken(form) {
    const cid = current.campaignId;
    const mapId = current.mapId;
    if (!cid || !mapId || !window.CampaignMapState) throw new Error("Map state unavailable");
    const all = { ...(CampaignMapState.get(cid)?.tokens || {}) };
    const list = Array.isArray(all[mapId]) ? all[mapId].slice() : [];
    const idx = list.findIndex((t) => t.id === current.tokenId);
    if (idx < 0) throw new Error("Token not found");
    list[idx] = {
      ...list[idx],
      hpCurrent: form.hpCurrent,
      hpMax: form.hpMax,
      ac: form.ac,
      conditions: form.conditions || "",
      initiative: normalizeInitiative(form.initiative)
    };
    all[mapId] = list;
    CampaignMapState.patch(cid, { tokens: all });
    syncInitiativeTracker(`tok:${current.tokenId}`, current.name, form.initiative, "monster");
  }

  async function save() {
    if (!current) return;
    const form = readForm();
    if (!form) return;
    setStatus("Saving…");
    try {
      if (current.kind === "pc") await savePc(form);
      else if (current.kind === "npc") await saveNpc(form);
      else if (current.kind === "monster-token") await saveMonsterToken(form);
      dirty = false;
      const when = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      setStatus(`Saved ${when}`);
    } catch (err) {
      setStatus(err?.message || "Save failed", true);
      throw err;
    }
  }

  function show() {
    ensureDialog();
    try {
      dialogEl.showModal();
    } catch {
      dialogEl.setAttribute("open", "");
    }
  }

  function close() {
    clearTimeout(saveTimer);
    if (!dialogEl) return;
    try {
      dialogEl.close();
    } catch {
      dialogEl.removeAttribute("open");
    }
  }

  /**
   * @param {{ kind: 'pc'|'npc'|'monster-token', catalogueId?: string, entityId?: string, name?: string, portrait?: string, token?: object, mapId?: string, campaignId?: string }} opts
   */
  async function open(opts) {
    ensureDialog();
    clearTimeout(saveTimer);
    dirty = false;
    if (!opts?.kind) return;
    try {
      if (opts.kind === "pc") await openPc(opts);
      else if (opts.kind === "npc") await openNpc(opts);
      else if (opts.kind === "monster-token") openMonsterToken(opts);
    } catch (err) {
      window.alert(err?.message || "Could not open combat sheet");
    }
  }

  /** One-time HP/AC copy from monster catalogue → map combat token. */
  function buildMonsterToken(entry, pos) {
    const hp = parseHpBlob(entry?.hp);
    return {
      id: `tok-mon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      label: entry?.name || "Monster",
      ref: null,
      kind: "monster",
      catalogueId: entry?.id || null,
      x: pos?.x ?? 0,
      y: pos?.y ?? 0,
      size: 1,
      visible: true,
      imageUrl: entry?.portrait || null,
      hpCurrent: hp.current,
      hpMax: hp.max,
      ac: parseAc(entry?.ac),
      conditions: "",
      initiative: 0
    };
  }

  return {
    open,
    close,
    buildMonsterToken,
    parseHpBlob,
    parseAc,
    parseDeathSaves,
    parseSpellSlots,
    normalizeInitiative,
    _readForm: readForm,
    _textToConditions: textToConditions
  };
})();
