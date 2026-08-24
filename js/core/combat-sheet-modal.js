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

  function setStatus(msg, isError) {
    const el = bodyEl?.querySelector("[data-combat-status]");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", Boolean(isError));
  }

  function readForm() {
    if (!bodyEl) return null;
    const hpCurrent = bodyEl.querySelector("[name=hpCurrent]")?.value;
    const hpMax = bodyEl.querySelector("[name=hpMax]")?.value;
    const hpTemp = bodyEl.querySelector("[name=hpTemp]")?.value;
    const ac = bodyEl.querySelector("[name=ac]")?.value;
    const conditions = bodyEl.querySelector("[name=conditions]")?.value ?? "";
    const inspiration = Boolean(bodyEl.querySelector("[name=inspiration]")?.checked);
    return {
      hpCurrent: hpCurrent === "" ? null : Number(hpCurrent),
      hpMax: hpMax === "" ? null : Number(hpMax),
      hpTemp: hpTemp === "" ? 0 : Number(hpTemp),
      ac: ac === "" ? null : Number(ac),
      conditions,
      inspiration
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
          ${temp}
          ${insp}
          <label class="combat-sheet__field combat-sheet__field--full">Conditions
            <textarea name="conditions" rows="2" placeholder="poisoned, prone…">${escapeHtml(model.conditions || "")}</textarea>
          </label>
        </div>
        <div class="combat-sheet__footer">
          <button type="button" class="btn" data-combat-save>Save</button>
          ${catalogueLink}
          <span class="combat-sheet__status" data-combat-status></span>
        </div>
        <div class="combat-sheet__extra" data-combat-extra></div>
      </div>`;

    bodyEl.querySelectorAll("[data-hp-delta]").forEach((btn) => {
      btn.addEventListener("click", () => adjustHp(Number(btn.dataset.hpDelta) || 0));
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
      name: bundle.character?.name || opts.name || entry?.name || "PC"
    };
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
      conditions: conditionsToText(state.conditions),
      inspiration: Boolean(state.inspiration),
      catalogueOpen: () => openCatalogueEntity(opts.entityId, catalogueId, "pc")
    });
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
      conditions: entry.combatConditions || "",
      catalogueOpen: () => openCatalogueEntity(opts.entityId, catalogueId, "npc")
    });
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
      catalogueId: token.catalogueId || null
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
      conditions: token.conditions || "",
      catalogueOpen: token.catalogueId
        ? () => openCatalogueEntity(null, token.catalogueId, "monster")
        : null
    });
    show();
  }

  async function savePc(form) {
    await LocalApiClient.putCharacterState(current.campaignId, current.characterId, {
      hp_current: form.hpCurrent,
      hp_max: form.hpMax,
      hp_temp: Number.isFinite(form.hpTemp) ? form.hpTemp : 0,
      conditions: textToConditions(form.conditions),
      inspiration: Boolean(form.inspiration)
    });
    if (form.ac != null && Number.isFinite(form.ac)) {
      await LocalApiClient.patchCharacter(current.campaignId, current.characterId, { ac: form.ac });
    }
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
    current.entry = await CatalogueStore.upsert("npc", entry);
    if (window.EntityRegistry?.build) EntityRegistry.build();
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
      conditions: form.conditions || ""
    };
    all[mapId] = list;
    CampaignMapState.patch(cid, { tokens: all });
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
      conditions: ""
    };
  }

  return {
    open,
    close,
    buildMonsterToken,
    parseHpBlob,
    parseAc,
    _readForm: readForm,
    _textToConditions: textToConditions
  };
})();
