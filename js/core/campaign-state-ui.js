/**
 * UI for campaign scene state, NPC memory, interaction logging, and timeline.
 * Persistence lives in CampaignState; this module only renders and binds.
 */
window.CampaignStateUI = (function () {
  "use strict";

  const { escapeHtml } = ContentParser;

  let campaignId = null;
  let api = null;
  let dialogEl = null;
  let dialogBody = null;
  let pendingEntityId = null;
  let historyFilter = { type: "all", session: "all" };

  const ATTITUDE_SUGGESTIONS = ["Friendly", "Trusting", "Indifferent", "Suspicious", "Hostile"];
  const MOOD_SUGGESTIONS = ["Relaxed", "Guarded", "Worried", "Angry", "Amused", "Concerned"];

  function t() {
    return window.I18N || {};
  }

  function init(options) {
    campaignId = options.campaignId;
    api = options.api || {};
    if (window.CampaignState) CampaignState.init(campaignId);

    dialogEl = document.getElementById("interaction-dialog");
    dialogBody = document.getElementById("interaction-dialog-body");
    const closeBtn = document.getElementById("interaction-dialog-close");
    if (dialogEl && closeBtn) {
      closeBtn.addEventListener("click", () => dialogEl.close());
      dialogEl.addEventListener("click", (e) => {
        if (e.target === dialogEl) dialogEl.close();
      });
    }

    if (window.EntityUI?.addModalEnricher) {
      EntityUI.addModalEnricher(enrichEntityModal);
    }

    const currentBtn = document.getElementById("current-scene-btn");
    if (currentBtn) {
      currentBtn.addEventListener("click", () => {
        const id = CampaignState.getCurrentSceneId();
        if (!id) return;
        if (typeof api.jumpToSection === "function") api.jumpToSection(id);
      });
      syncCurrentSceneButton();
    }
  }

  function syncCurrentSceneButton() {
    const currentBtn = document.getElementById("current-scene-btn");
    if (!currentBtn || !window.CampaignState?.getCurrentSceneId) return;
    const id = CampaignState.getCurrentSceneId();
    const hasCurrent = !!id;
    currentBtn.disabled = !hasCurrent;
    currentBtn.title = hasCurrent
      ? t().jumpToCurrentScene || "Jump to current scene"
      : t().noCurrentScene || "No scene is marked current yet.";
    currentBtn.setAttribute("aria-disabled", hasCurrent ? "false" : "true");
  }

  function sessionNumber() {
    if (typeof api.getSessionNumber === "function") return Number(api.getSessionNumber()) || 1;
    try {
      return Number(window.CampaignPrefs?.get(campaignId)?.session) || 1;
    } catch {
      return 1;
    }
  }

  function sectionTitle(sectionId) {
    if (!sectionId) return "";
    if (typeof api.getSectionTitle === "function") return api.getSectionTitle(sectionId) || sectionId;
    return sectionId;
  }

  function entityLabel(id) {
    if (!id) return "";
    const entity = window.EntityRegistry?.resolve?.(id) || window.ENTITIES?.[id];
    return entity?.name || id;
  }

  function locationOptionsHtml(selected) {
    const locations = window.EntityRegistry?.byType?.("location") || [];
    const opts = [`<option value="">${escapeHtml(t().noneOption || "—")}</option>`];
    locations
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((loc) => {
        const sel = loc.id === selected || loc.catalogueId === selected ? " selected" : "";
        opts.push(`<option value="${escapeHtml(loc.id)}"${sel}>${escapeHtml(loc.name)}</option>`);
      });
    return opts.join("");
  }

  function sectionOptionsHtml(selected) {
    const sections = typeof api.getSections === "function" ? api.getSections() : [];
    const opts = [`<option value="">${escapeHtml(t().noneOption || "—")}</option>`];
    sections.forEach((s) => {
      const title = typeof api.getSectionTitle === "function" ? api.getSectionTitle(s.id) : s.title;
      const sel = s.id === selected ? " selected" : "";
      opts.push(`<option value="${escapeHtml(s.id)}"${sel}>${escapeHtml(title || s.id)}</option>`);
    });
    return opts.join("");
  }

  function entityOptionsHtml(selected) {
    const types = [
      { key: "npc", label: t().typeLabels?.npc || "NPC" },
      { key: "monster", label: t().typeLabels?.monster || "Monster" },
      { key: "item", label: t().typeLabels?.item || "Item" },
      { key: "location", label: t().typeLabels?.location || "Location" }
    ];
    const opts = [`<option value="">${escapeHtml(t().noneOption || "—")}</option>`];
    types.forEach(({ key, label }) => {
      const entities = (window.EntityRegistry?.byType?.(key) || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      if (!entities.length) return;
      opts.push(`<optgroup label="${escapeHtml(label)}">`);
      entities.forEach((e) => {
        const sel = e.id === selected ? " selected" : "";
        opts.push(`<option value="${escapeHtml(e.id)}"${sel}>${escapeHtml(e.name)}</option>`);
      });
      opts.push("</optgroup>");
    });
    return opts.join("");
  }

  function inferMapLocationId() {
    try {
      const mapId = window.CampaignMapState?.get(campaignId)?.activeMap;
      const registry = window.MAPS;
      let map = null;
      if (registry && typeof registry === "object" && !Array.isArray(registry)) {
        map = (mapId && registry[mapId]) || Object.values(registry)[0] || null;
      } else if (Array.isArray(registry)) {
        map = registry.find((m) => m.id === mapId) || registry[0] || null;
      }
      if (map?.locationId) {
        const loc = window.EntityRegistry?.resolve?.(map.locationId);
        return loc?.id || map.locationId;
      }
    } catch {
      /* ignore */
    }
    return "";
  }

  function resolveContextSceneId(explicitSceneId) {
    if (explicitSceneId) return String(explicitSceneId);
    if (typeof api.getFocusedSceneId === "function") {
      const focused = api.getFocusedSceneId();
      if (focused) return String(focused);
    }
    const current = window.CampaignState?.getCurrentSceneId?.();
    if (current) return String(current);
    try {
      const hash = String(location.hash || "").replace(/^#/, "");
      if (hash) return hash;
    } catch {
      /* ignore */
    }
    return "";
  }

  /**
   * Infer campaign location for forms / memory defaults.
   * Priority: explicit/context scene SceneMeta.locationId → active map → "".
   * Does not change maps or SceneMeta; callers may always override the result.
   */
  function inferLocationId(explicitSceneId) {
    const sceneId = resolveContextSceneId(explicitSceneId);
    if (sceneId && window.SceneMeta) {
      const section =
        typeof api.getSectionBase === "function" ? api.getSectionBase(sceneId) : null;
      const sceneLoc = SceneMeta.getLocationId(campaignId, sceneId, section);
      if (sceneLoc) {
        const resolved = window.EntityRegistry?.resolve?.(sceneLoc);
        return resolved?.id || sceneLoc;
      }
    }
    return inferMapLocationId();
  }

  /* ── Scene chrome ───────────────────────────────────── */

  function sceneChromeHtml(sectionId) {
    const state = CampaignState.getSceneState(sectionId);
    const statuses = CampaignState.SCENE_STATUSES;
    const labels = {
      unseen: t().sceneUnseen || "Unseen",
      current: t().sceneCurrent || "Current",
      completed: t().sceneCompleted || "Completed",
      skipped: t().sceneSkipped || "Skipped"
    };
    const buttons = statuses
      .map((status) => {
        const active = state.status === status ? " is-active" : "";
        return `<button type="button" class="scene-status-btn${active}" data-scene-status="${status}" data-section="${escapeHtml(sectionId)}" title="${escapeHtml(labels[status])}">${escapeHtml(labels[status])}</button>`;
      })
      .join("");

    return `
      <div class="scene-state" data-scene-chrome="${escapeHtml(sectionId)}">
        <div class="scene-status-row" role="group" aria-label="${escapeHtml(t().sceneState || "Scene state")}">
          ${buttons}
        </div>
        <label class="scene-notes-label">
          <span>${escapeHtml(t().sceneNotes || "Scene notes")}</span>
          <textarea class="scene-notes" data-scene-notes="${escapeHtml(sectionId)}" rows="2" placeholder="${escapeHtml(t().sceneNotesPlaceholder || "Private DM notes for this scene…")}">${escapeHtml(state.notes)}</textarea>
        </label>
      </div>`;
  }

  function sectionStatusClass(sectionId) {
    const status = CampaignState.getSceneState(sectionId).status;
    if (status === "unseen") return "";
    return ` scene-${status}`;
  }

  function navStatusClass(sectionId) {
    const status = CampaignState.getSceneState(sectionId).status;
    if (status === "unseen") return "";
    return ` nav-scene--${status}`;
  }

  function bindSceneChrome(root) {
    if (!root) return;

    root.querySelectorAll("[data-scene-status]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sectionId = btn.dataset.section;
        const status = btn.dataset.sceneStatus;
        CampaignState.setSceneStatus(sectionId, status);
        refreshAllSceneChrome();
        if (typeof api.onSceneStateChange === "function") api.onSceneStateChange(sectionId, status);
      });
    });

    root.querySelectorAll("[data-scene-notes]").forEach((textarea) => {
      let timer;
      textarea.addEventListener("input", () => {
        const sectionId = textarea.dataset.sceneNotes;
        clearTimeout(timer);
        timer = setTimeout(() => {
          CampaignState.setSceneNotes(sectionId, textarea.value);
        }, 350);
      });
    });
  }

  function applySectionSceneClasses() {
    document.querySelectorAll(".adventure-section[data-section]").forEach((section) => {
      ["scene-current", "scene-completed", "scene-skipped"].forEach((c) => section.classList.remove(c));
      const st = CampaignState.getSceneState(section.dataset.section).status;
      if (st && st !== "unseen") section.classList.add(`scene-${st}`);
    });
  }

  function refreshSceneChrome(sectionId) {
    const section = document.getElementById(`section-${sectionId}`);
    if (section) {
      const host = section.querySelector(`[data-scene-chrome="${sectionId}"]`);
      if (host) {
        host.outerHTML = sceneChromeHtml(sectionId);
        bindSceneChrome(section);
      }
    }
    applySectionSceneClasses();
    applyNavSceneClasses();
    syncCurrentSceneButton();
  }

  function refreshAllSceneChrome() {
    const root = document.getElementById("scroll-document");
    if (!root) return;
    root.querySelectorAll("[data-scene-chrome]").forEach((host) => {
      const id = host.getAttribute("data-scene-chrome");
      host.outerHTML = sceneChromeHtml(id);
    });
    bindSceneChrome(root);
    applySectionSceneClasses();
    applyNavSceneClasses();
    syncCurrentSceneButton();
  }

  function applyNavSceneClasses() {
    document.querySelectorAll(".nav-btn[data-section]").forEach((btn) => {
      btn.classList.remove("nav-scene--current", "nav-scene--completed", "nav-scene--skipped");
      const st = CampaignState.getSceneState(btn.dataset.section).status;
      if (st && st !== "unseen") btn.classList.add(`nav-scene--${st}`);
    });
  }

  /* ── NPC modal memory ───────────────────────────────── */

  function enrichEntityModal(entity, bodyEl) {
    if (!entity || entity.type !== "npc" || !bodyEl) return;

    const mem = CampaignState.getNpcMemory(entity.id);
    const has = CampaignState.hasNpcMemory(entity.id);
    const locName = mem.lastSeenLocation ? entityLabel(mem.lastSeenLocation) : "";
    const sessionBit =
      mem.lastSeenSession != null ? `${t().session || "Session"} ${mem.lastSeenSession}` : "";

    let summary = "";
    if (has) {
      const line1 = [mem.attitude, mem.mood ? `${t().moodLabel || "Mood"}: ${mem.mood}` : ""]
        .filter(Boolean)
        .join(" · ");
      const line2 = [locName, sessionBit].filter(Boolean).join(" · ");
      const notes = mem.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      const flags = mem.flags.map((f) => `<li class="npc-memory__flag">${escapeHtml(f)}</li>`).join("");
      summary = `
        ${line1 ? `<p class="npc-memory__summary">${escapeHtml(line1)}</p>` : ""}
        ${line2 ? `<p class="npc-memory__meta">${escapeHtml(line2)}</p>` : ""}
        ${notes ? `<ul class="npc-memory__notes">${notes}</ul>` : ""}
        ${flags ? `<ul class="npc-memory__flags">${flags}</ul>` : ""}
      `;
    } else {
      summary = `<p class="npc-memory__empty">${escapeHtml(t().npcMemoryEmpty || "No campaign memory yet.")}</p>`;
    }

    const wrap = document.createElement("div");
    wrap.className = "npc-memory";
    wrap.innerHTML = `
      <div class="npc-reveal">
        <label class="npc-reveal__label">
          <input type="checkbox" class="npc-reveal__toggle" data-reveal-npc="${escapeHtml(entity.id)}" disabled>
          <span>${escapeHtml(t().revealToPlayers || "Reveal to players")}</span>
        </label>
        <label class="npc-reveal__note-label meta">${escapeHtml(t().revealNoteLabel || "Player-facing note")}
          <input type="text" class="npc-reveal__note" data-reveal-note maxlength="500" placeholder="${escapeHtml(
            t().revealNotePlaceholder || "e.g. Met as the innkeeper — wary but helpful"
          )}" disabled>
        </label>
        <p class="npc-reveal__hint meta">${escapeHtml(t().revealToPlayersHint || "Players see this NPC under People once revealed.")}</p>
      </div>
      <div class="npc-memory__header">
        <h3 class="npc-memory__title">${escapeHtml(t().npcMemoryTitle || "Campaign memory")}</h3>
        <div class="npc-memory__actions">
          <button type="button" class="toolbar-btn npc-memory__btn" data-edit-memory="${escapeHtml(entity.id)}">${escapeHtml(t().editMemory || "Edit memory")}</button>
          <button type="button" class="toolbar-btn npc-memory__btn" data-log-interaction="${escapeHtml(entity.id)}">${escapeHtml(t().logInteraction || "Log interaction")}</button>
        </div>
      </div>
      <div class="npc-memory__body" data-memory-body="${escapeHtml(entity.id)}">${summary}</div>
      <div class="npc-memory__editor hidden" data-memory-editor="${escapeHtml(entity.id)}"></div>
    `;
    bodyEl.appendChild(wrap);

    wrap.querySelector("[data-edit-memory]")?.addEventListener("click", () => openMemoryEditor(entity.id, wrap));
    wrap.querySelector("[data-log-interaction]")?.addEventListener("click", () => openLogInteraction(entity.id));
    bindRevealToggle(wrap, entity.id);
  }

  async function bindRevealToggle(wrap, npcId) {
    const input = wrap.querySelector("[data-reveal-npc]");
    const noteInput = wrap.querySelector("[data-reveal-note]");
    if (!input || !campaignId || !window.LocalApiClient?.listRevealedNpcs) return;
    try {
      const list = await LocalApiClient.listRevealedNpcs(campaignId);
      const row = (list || []).find((n) => n.id === npcId);
      input.checked = Boolean(row);
      if (noteInput) {
        noteInput.value = row?.note || "";
        noteInput.disabled = false;
      }
      input.disabled = false;
    } catch (err) {
      input.disabled = true;
      if (noteInput) noteInput.disabled = true;
      const hint = wrap.querySelector(".npc-reveal__hint");
      if (hint) {
        hint.textContent =
          err?.status === 503
            ? "Postgres required to reveal NPCs to players."
            : err.message || "Reveal unavailable.";
      }
      return;
    }

    async function persistReveal(checked) {
      input.disabled = true;
      if (noteInput) noteInput.disabled = true;
      try {
        if (checked) {
          await LocalApiClient.revealNpc(campaignId, npcId, {
            note: noteInput ? String(noteInput.value || "").slice(0, 500) : ""
          });
        } else {
          await LocalApiClient.unrevealNpc(campaignId, npcId);
        }
      } catch (err) {
        input.checked = !checked;
        window.alert(err.message || "Could not update reveal.");
      } finally {
        input.disabled = false;
        if (noteInput) noteInput.disabled = false;
      }
    }

    input.addEventListener("change", async () => {
      await persistReveal(input.checked);
    });
    noteInput?.addEventListener("change", async () => {
      if (!input.checked) return;
      await persistReveal(true);
    });
  }

  function openMemoryEditor(entityId, wrap) {
    const editor = wrap.querySelector(`[data-memory-editor="${entityId}"]`);
    const body = wrap.querySelector(`[data-memory-body="${entityId}"]`);
    if (!editor || !body) return;
    const mem = CampaignState.getNpcMemory(entityId);
    editor.classList.remove("hidden");
    body.classList.add("hidden");
    editor.innerHTML = `
      <div class="npc-memory-form">
        <label>${escapeHtml(t().attitudeLabel || "Attitude")}
          <input type="text" list="attitude-suggestions" data-mem-attitude value="${escapeHtml(mem.attitude)}" placeholder="Friendly">
        </label>
        <label>${escapeHtml(t().moodLabel || "Mood")}
          <input type="text" list="mood-suggestions" data-mem-mood value="${escapeHtml(mem.mood)}" placeholder="Guarded">
        </label>
        <label>${escapeHtml(t().lastSeenLocation || "Last seen location")}
          <select data-mem-location>${locationOptionsHtml(mem.lastSeenLocation)}</select>
        </label>
        <label>${escapeHtml(t().lastSeenSession || "Last seen session")}
          <input type="number" min="1" data-mem-session value="${mem.lastSeenSession ?? ""}">
        </label>
        <label>${escapeHtml(t().memoryNotes || "Memory notes")} <span class="hint">(one per line)</span>
          <textarea data-mem-notes rows="4">${escapeHtml(mem.notes.join("\n"))}</textarea>
        </label>
        <label>${escapeHtml(t().memoryFlags || "Flags")} <span class="hint">(one per line)</span>
          <textarea data-mem-flags rows="3">${escapeHtml(mem.flags.join("\n"))}</textarea>
        </label>
        <datalist id="attitude-suggestions">${ATTITUDE_SUGGESTIONS.map((a) => `<option value="${a}">`).join("")}</datalist>
        <datalist id="mood-suggestions">${MOOD_SUGGESTIONS.map((a) => `<option value="${a}">`).join("")}</datalist>
        <div class="editor-actions">
          <button type="button" class="btn btn-primary" data-mem-save>${escapeHtml(t().saveSection || "Save")}</button>
          <button type="button" class="btn" data-mem-cancel>${escapeHtml(t().cancelEdit || "Cancel")}</button>
        </div>
      </div>`;

    editor.querySelector("[data-mem-save]")?.addEventListener("click", () => {
      const notes = (editor.querySelector("[data-mem-notes]")?.value || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const flags = (editor.querySelector("[data-mem-flags]")?.value || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const sessionRaw = editor.querySelector("[data-mem-session]")?.value;
      const session = sessionRaw === "" || sessionRaw == null ? null : Number(sessionRaw);
      CampaignState.updateNpcMemory(entityId, {
        attitude: editor.querySelector("[data-mem-attitude]")?.value || "",
        mood: editor.querySelector("[data-mem-mood]")?.value || "",
        lastSeenLocation: editor.querySelector("[data-mem-location]")?.value || "",
        lastSeenSession: Number.isFinite(session) ? session : null,
        notes,
        flags
      });
      // Re-open modal to refresh
      if (window.EntityUI?.openModal) EntityUI.openModal(entityId);
    });
    editor.querySelector("[data-mem-cancel]")?.addEventListener("click", () => {
      editor.classList.add("hidden");
      editor.innerHTML = "";
      body.classList.remove("hidden");
    });
  }

  /* ── Log interaction ────────────────────────────────── */

  function openLogInteraction(entityId) {
    if (!dialogEl || !dialogBody) return;
    pendingEntityId = entityId;
    const mem = CampaignState.getNpcMemory(entityId);
    const currentScene =
      CampaignState.getCurrentSceneId() ||
      (typeof api.getFocusedSceneId === "function" ? api.getFocusedSceneId() : "") ||
      "";
    /* Memory last-seen wins when set; otherwise infer from scene → map */
    const locationId = mem.lastSeenLocation || inferLocationId(currentScene);

    dialogBody.innerHTML = `
      <form class="interaction-form" id="interaction-form">
        <p class="interaction-form__npc"><strong>${escapeHtml(entityLabel(entityId))}</strong></p>
        <label>${escapeHtml(t().session || "Session")}
          <input type="number" min="1" name="session" value="${sessionNumber()}" required>
        </label>
        <label>${escapeHtml(t().locationLabel || "Location")}
          <select name="locationId">${locationOptionsHtml(locationId)}</select>
        </label>
        <label>${escapeHtml(t().sceneLabel || "Scene")}
          <select name="sceneId">${sectionOptionsHtml(currentScene)}</select>
        </label>
        <label>${escapeHtml(t().interactionText || "Interaction / note")}
          <textarea name="text" rows="4" required placeholder="${escapeHtml(t().interactionPlaceholder || "What happened?")}"></textarea>
        </label>
        <label>${escapeHtml(t().attitudeLabel || "Attitude")}
          <input type="text" list="attitude-suggestions" name="attitude" value="${escapeHtml(mem.attitude)}" placeholder="${escapeHtml(mem.attitude || "Friendly")}">
        </label>
        <label>${escapeHtml(t().moodLabel || "Mood")}
          <input type="text" list="mood-suggestions" name="mood" value="${escapeHtml(mem.mood)}" placeholder="${escapeHtml(mem.mood || "Guarded")}">
        </label>
        <label class="interaction-form__check">
          <input type="checkbox" name="addToNotes" value="1">
          <span>${escapeHtml(t().addToMemoryNotes || "Also add this text to NPC memory notes")}</span>
        </label>
        <datalist id="attitude-suggestions">${ATTITUDE_SUGGESTIONS.map((a) => `<option value="${a}">`).join("")}</datalist>
        <datalist id="mood-suggestions">${MOOD_SUGGESTIONS.map((a) => `<option value="${a}">`).join("")}</datalist>
        <div class="editor-actions">
          <button type="submit" class="btn btn-primary">${escapeHtml(t().saveSection || "Save")}</button>
          <button type="button" class="btn" data-cancel-interaction>${escapeHtml(t().cancelEdit || "Cancel")}</button>
        </div>
      </form>`;

    dialogBody.querySelector("[data-cancel-interaction]")?.addEventListener("click", () => dialogEl.close());
    dialogBody.querySelector("#interaction-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const data = new FormData(form);
      const text = String(data.get("text") || "").trim();
      if (!text) return;
      CampaignState.logInteraction({
        entityId: pendingEntityId,
        session: Number(data.get("session")) || sessionNumber(),
        locationId: String(data.get("locationId") || ""),
        sceneId: String(data.get("sceneId") || ""),
        text,
        attitude: String(data.get("attitude") || "").trim(),
        mood: String(data.get("mood") || "").trim(),
        addToNotes: data.get("addToNotes") === "1"
      });
      dialogEl.close();
      if (window.EntityUI?.openModal) EntityUI.openModal(pendingEntityId);
    });

    try {
      dialogEl.showModal();
    } catch {
      dialogEl.setAttribute("open", "");
    }
  }

  /* ── History / timeline panel ───────────────────────── */

  function renderHistoryPanel() {
    const entries = CampaignState.getTimeline(historyFilter);
    const sessions = [...new Set(CampaignState.getTimeline().map((e) => e.session).filter((s) => s != null))].sort(
      (a, b) => b - a
    );

    const filterBar = `
      <div class="history-filters">
        <label>${escapeHtml(t().filterLabel || "Show")}
          <select id="history-type-filter">
            <option value="all"${historyFilter.type === "all" ? " selected" : ""}>${escapeHtml(t().filterAll || "All")}</option>
            <option value="interaction"${historyFilter.type === "interaction" ? " selected" : ""}>${escapeHtml(t().filterInteractions || "NPC interactions")}</option>
            <option value="note"${historyFilter.type === "note" ? " selected" : ""}>${escapeHtml(t().filterNotes || "Notes")}</option>
            <option value="scene"${historyFilter.type === "scene" ? " selected" : ""}>${escapeHtml(t().filterScenes || "Scenes")}</option>
          </select>
        </label>
        <label>${escapeHtml(t().session || "Session")}
          <select id="history-session-filter">
            <option value="all"${historyFilter.session === "all" ? " selected" : ""}>${escapeHtml(t().filterAll || "All")}</option>
            ${sessions.map((s) => `<option value="${s}"${String(historyFilter.session) === String(s) ? " selected" : ""}>${s}</option>`).join("")}
          </select>
        </label>
        <button type="button" class="toolbar-btn" id="history-add-entry">${escapeHtml(t().addHistoryEntry || "Add history entry")}</button>
      </div>`;

    if (!entries.length) {
      return `
        <h1>${escapeHtml(t().headings?.history || "History")}</h1>
        <p>${escapeHtml(t().historyIntro || "Structured events from play. Complements freeform session notes.")}</p>
        ${filterBar}
        <p class="empty-state">${escapeHtml(t().historyEmpty || "No history yet. Log an NPC interaction or add an entry.")}</p>
        <div id="history-manual-form" class="history-manual hidden"></div>`;
    }

    const bySession = new Map();
    entries.forEach((e) => {
      const key = e.session != null ? e.session : "—";
      if (!bySession.has(key)) bySession.set(key, []);
      bySession.get(key).push(e);
    });

    const blocks = [...bySession.entries()]
      .map(([session, list]) => {
        const items = list
          .map((e) => {
            const scene = e.sceneId
              ? `<button type="button" class="history-link" data-jump-scene="${escapeHtml(e.sceneId)}">${escapeHtml(sectionTitle(e.sceneId))}</button>`
              : "";
            const loc = e.locationId
              ? `<button type="button" class="history-link" data-open-entity="${escapeHtml(e.locationId)}">${escapeHtml(entityLabel(e.locationId))}</button>`
              : "";
            const ent = e.entityId
              ? `<button type="button" class="history-link" data-open-entity="${escapeHtml(e.entityId)}">${escapeHtml(entityLabel(e.entityId))}</button>`
              : "";
            const meta = [scene, loc, ent].filter(Boolean).join('<span class="history-sep">·</span>');
            return `
              <article class="history-entry" data-entry-id="${escapeHtml(e.id)}">
                <div class="history-entry__meta">${meta || `<span class="history-type">${escapeHtml(e.type)}</span>`}</div>
                <p class="history-entry__text">${escapeHtml(e.text)}</p>
                <button type="button" class="chronicle-promote" data-promote-history="${escapeHtml(e.id)}">${escapeHtml(t().makeKeyEvent || "★ Make Key Event")}</button>
              </article>`;
          })
          .join("");
        return `
          <section class="history-session">
            <h2 class="history-session__title">${escapeHtml(t().session || "Session")} ${escapeHtml(String(session))}</h2>
            ${items}
          </section>`;
      })
      .join("");

    return `
      <h1>${escapeHtml(t().headings?.history || "History")}</h1>
      <p>${escapeHtml(t().historyIntro || "Structured events from play. Complements freeform session notes.")}</p>
      ${filterBar}
      <div class="history-list">${blocks}</div>
      <div id="history-manual-form" class="history-manual hidden"></div>`;
  }

  function bindHistoryPanel(root) {
    if (!root) return;
    root.querySelector("#history-type-filter")?.addEventListener("change", (e) => {
      historyFilter.type = e.target.value;
      if (typeof api.refreshHistoryPanel === "function") api.refreshHistoryPanel();
    });
    root.querySelector("#history-session-filter")?.addEventListener("change", (e) => {
      historyFilter.session = e.target.value;
      if (typeof api.refreshHistoryPanel === "function") api.refreshHistoryPanel();
    });
    root.querySelector("#history-add-entry")?.addEventListener("click", () => openManualHistoryForm(root));

    root.querySelectorAll("[data-open-entity]").forEach((btn) => {
      btn.addEventListener("click", () => EntityUI.openModal(btn.dataset.openEntity));
    });
    root.querySelectorAll("[data-jump-scene]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (typeof api.jumpToSection === "function") api.jumpToSection(btn.dataset.jumpScene);
      });
    });
    root.querySelectorAll("[data-promote-history]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (window.ChronicleUI?.promoteHistoryEntry) ChronicleUI.promoteHistoryEntry(btn.dataset.promoteHistory);
      });
    });
  }

  function openManualHistoryForm(root) {
    const host = root.querySelector("#history-manual-form");
    if (!host) return;
    const defaultScene =
      CampaignState.getCurrentSceneId() ||
      (typeof api.getFocusedSceneId === "function" ? api.getFocusedSceneId() : "") ||
      "";
    host.classList.remove("hidden");
    host.innerHTML = `
      <form class="interaction-form" id="manual-history-form">
        <h3>${escapeHtml(t().addHistoryEntry || "Add history entry")}</h3>
        <label>${escapeHtml(t().session || "Session")}
          <input type="number" min="1" name="session" value="${sessionNumber()}">
        </label>
        <label>${escapeHtml(t().sceneLabel || "Scene")}
          <select name="sceneId">${sectionOptionsHtml(defaultScene)}</select>
        </label>
        <label>${escapeHtml(t().locationLabel || "Location")}
          <select name="locationId">${locationOptionsHtml(inferLocationId(defaultScene))}</select>
        </label>
        <label>${escapeHtml(t().entityLabel || "Entity")}
          <select name="entityId">${entityOptionsHtml("")}</select>
        </label>
        <label>${escapeHtml(t().entryType || "Type")}
          <select name="type">
            <option value="note">note</option>
            <option value="interaction">interaction</option>
            <option value="scene">scene</option>
          </select>
        </label>
        <label>${escapeHtml(t().interactionText || "Text")}
          <textarea name="text" rows="3" required></textarea>
        </label>
        <div class="editor-actions">
          <button type="submit" class="btn btn-primary">${escapeHtml(t().saveSection || "Save")}</button>
          <button type="button" class="btn" data-cancel-manual>${escapeHtml(t().cancelEdit || "Cancel")}</button>
        </div>
      </form>`;

    host.querySelector("[data-cancel-manual]")?.addEventListener("click", () => {
      host.classList.add("hidden");
      host.innerHTML = "";
    });
    host.querySelector("#manual-history-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const text = String(fd.get("text") || "").trim();
      if (!text) return;
      CampaignState.addTimelineEntry({
        session: Number(fd.get("session")) || sessionNumber(),
        sceneId: String(fd.get("sceneId") || ""),
        locationId: String(fd.get("locationId") || ""),
        entityId: String(fd.get("entityId") || ""),
        type: String(fd.get("type") || "note"),
        text
      });
      if (typeof api.refreshHistoryPanel === "function") api.refreshHistoryPanel();
    });
  }

  return {
    init,
    sceneChromeHtml,
    sectionStatusClass,
    navStatusClass,
    bindSceneChrome,
    applyNavSceneClasses,
    applySectionSceneClasses,
    refreshSceneChrome,
    refreshAllSceneChrome,
    syncCurrentSceneButton,
    renderHistoryPanel,
    bindHistoryPanel,
    openLogInteraction,
    inferLocationId,
    enrichEntityModal
  };
})();
