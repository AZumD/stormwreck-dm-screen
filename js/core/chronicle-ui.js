/**
 * Chronicle panel — Story So Far, session prose, curated Key Event timeline.
 * Persistence: ChronicleStore. History remains CampaignState.
 */
window.ChronicleUI = (function () {
  "use strict";

  const { escapeHtml, markdownLite } = ContentParser;

  let campaignId = null;
  let api = null;
  let eventDialog = null;
  let eventDialogBody = null;
  let pendingEventId = null;
  let editingStory = false;
  let editingSessions = new Set();
  let pendingPrefill = null;

  const TYPE_LABELS = {
    discovery: "Discovery",
    combat: "Combat",
    relationship: "Relationship",
    decision: "Decision",
    arrival: "Arrival",
    loss: "Loss",
    victory: "Victory",
    revelation: "Revelation",
    other: "Other"
  };

  function t() {
    return window.I18N || {};
  }

  function init(options) {
    campaignId = options.campaignId;
    api = options.api || {};
    if (window.ChronicleStore) ChronicleStore.init(campaignId);

    eventDialog = document.getElementById("key-event-dialog");
    eventDialogBody = document.getElementById("key-event-dialog-body");
    document.getElementById("key-event-dialog-close")?.addEventListener("click", closeEventDialog);
    eventDialog?.addEventListener("click", (e) => {
      if (e.target === eventDialog) closeEventDialog();
    });
  }

  function refresh() {
    if (typeof api.refreshChroniclePanel === "function") api.refreshChroniclePanel();
  }

  function sessionNumber() {
    if (typeof api.getSessionNumber === "function") return Number(api.getSessionNumber()) || 1;
    return 1;
  }

  function entityLabel(id) {
    if (!id) return "";
    return window.EntityRegistry?.resolve?.(id)?.name || id;
  }

  function sectionTitle(id) {
    if (!id) return "";
    if (typeof api.getSectionTitle === "function") return api.getSectionTitle(id) || id;
    return id;
  }

  function proseHtml(text) {
    if (!text) return `<p class="chronicle-empty">${escapeHtml(t().chronicleEmptyProse || "Nothing written yet.")}</p>`;
    return markdownLite(text);
  }

  function typeOptions(selected) {
    return ChronicleStore.EVENT_TYPES.map((type) => {
      const label = TYPE_LABELS[type] || type;
      const sel = type === selected ? " selected" : "";
      return `<option value="${escapeHtml(type)}"${sel}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function entityOptions(selectedIds) {
    const selected = new Set(selectedIds || []);
    const types = window.CatalogueTypes?.linkableIds?.() || [
      "npc",
      "monster",
      "item",
      "location",
      "pc",
      "feature",
      "skill",
      "spell",
      "class",
      "race"
    ];
    const opts = [];
    types.forEach((type) => {
      const list = (window.EntityRegistry?.byType?.(type) || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      if (!list.length) return;
      opts.push(`<optgroup label="${escapeHtml(t().typeLabels?.[type] || type)}">`);
      list.forEach((e) => {
        const sel = selected.has(e.id) ? " selected" : "";
        opts.push(`<option value="${escapeHtml(e.id)}"${sel}>${escapeHtml(e.name)}</option>`);
      });
      opts.push("</optgroup>");
    });
    return opts.join("");
  }

  function locationOptions(selected) {
    const locs = window.EntityRegistry?.byType?.("location") || [];
    const opts = [`<option value="">${escapeHtml(t().noneOption || "—")}</option>`];
    locs
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((loc) => {
        const sel = loc.id === selected ? " selected" : "";
        opts.push(`<option value="${escapeHtml(loc.id)}"${sel}>${escapeHtml(loc.name)}</option>`);
      });
    return opts.join("");
  }

  function sceneOptions(selected) {
    const sections = typeof api.getSections === "function" ? api.getSections() : [];
    const opts = [`<option value="">${escapeHtml(t().noneOption || "—")}</option>`];
    sections.forEach((s) => {
      const title = sectionTitle(s.id);
      const sel = s.id === selected ? " selected" : "";
      opts.push(`<option value="${escapeHtml(s.id)}"${sel}>${escapeHtml(title)}</option>`);
    });
    return opts.join("");
  }

  function renderStoryBlock() {
    const story = ChronicleStore.getStorySoFar();
    if (editingStory) {
      return `
        <section class="chronicle-story is-editing">
          <header class="chronicle-block-head">
            <h2>${escapeHtml(t().storySoFar || "Story So Far")}</h2>
            <button type="button" class="toolbar-btn" data-story-done>${escapeHtml(t().doneEdit || "Done")}</button>
          </header>
          <textarea id="chronicle-story-editor" class="chronicle-editor" rows="8" placeholder="${escapeHtml(t().storySoFarPlaceholder || "A living synopsis of the campaign…")}">${escapeHtml(story)}</textarea>
        </section>`;
    }
    return `
      <section class="chronicle-story">
        <header class="chronicle-block-head">
          <h2>${escapeHtml(t().storySoFar || "Story So Far")}</h2>
          <button type="button" class="toolbar-btn" data-story-edit>${escapeHtml(t().editSection || "Edit")}</button>
        </header>
        <div class="chronicle-prose">${proseHtml(story)}</div>
      </section>`;
  }

  function renderTimeline() {
    const events = ChronicleStore.listKeyEvents();
    if (!events.length) {
      return `
        <section class="chronicle-timeline">
          <h2>${escapeHtml(t().keyEventTimeline || "Timeline")}</h2>
          <p class="chronicle-empty">${escapeHtml(t().timelineEmpty || "No key events yet. Mark turning points from a session or from History.")}</p>
        </section>`;
    }

    const bySession = new Map();
    events.forEach((e) => {
      const key = e.session || 0;
      if (!bySession.has(key)) bySession.set(key, []);
      bySession.get(key).push(e);
    });

    const blocks = [...bySession.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([session, list]) => {
        const items = list
          .map((e) => {
            const major = e.importance === "major" ? " is-major" : "";
            return `
              <li class="chronicle-tl-item chronicle-tl-item--${escapeHtml(e.type)}${major}">
                <button type="button" class="chronicle-tl-node" data-open-key-event="${escapeHtml(e.id)}">
                  <span class="chronicle-tl-mark" aria-hidden="true"></span>
                  <span class="chronicle-tl-title">${escapeHtml(e.title)}</span>
                  <span class="chronicle-tl-type">${escapeHtml(TYPE_LABELS[e.type] || e.type)}</span>
                </button>
              </li>`;
          })
          .join("");
        return `
          <div class="chronicle-tl-session">
            <h3 class="chronicle-tl-session__label">${escapeHtml(t().session || "Session")} ${escapeHtml(String(session || "—"))}</h3>
            <ol class="chronicle-tl-list">${items}</ol>
          </div>`;
      })
      .join("");

    return `
      <section class="chronicle-timeline">
        <h2>${escapeHtml(t().keyEventTimeline || "Timeline")}</h2>
        <div class="chronicle-tl">${blocks}</div>
      </section>`;
  }

  function renderKeyEventChips(event) {
    const chips = [];
    if (event.sceneId) {
      chips.push(
        `<button type="button" class="chronicle-chip" data-jump-scene="${escapeHtml(event.sceneId)}">${escapeHtml(sectionTitle(event.sceneId))}</button>`
      );
    }
    if (event.locationId) {
      chips.push(
        `<button type="button" class="chronicle-chip entity-link" data-type="location" data-id="${escapeHtml(event.locationId)}">${escapeHtml(entityLabel(event.locationId))}</button>`
      );
    }
    (event.entityIds || []).forEach((id) => {
      const ent = window.EntityRegistry?.resolve?.(id);
      chips.push(
        `<button type="button" class="chronicle-chip entity-link" data-type="${escapeHtml(ent?.type || "")}" data-id="${escapeHtml(id)}">${escapeHtml(entityLabel(id))}</button>`
      );
    });
    return chips.join("");
  }

  function renderSessionKeyEvents(sessionNum) {
    const events = ChronicleStore.listKeyEvents({ session: sessionNum });
    const rows = events
      .map((e) => {
        const major = e.importance === "major" ? " is-major" : "";
        return `
          <li class="chronicle-ke${major}">
            <button type="button" class="chronicle-ke__open" data-open-key-event="${escapeHtml(e.id)}">
              <span class="chronicle-ke__mark chronicle-ke__mark--${escapeHtml(e.type)}" aria-hidden="true"></span>
              <span class="chronicle-ke__title">${escapeHtml(e.title)}</span>
            </button>
            <span class="chronicle-ke__actions">
              <button type="button" class="chronicle-ke__move" data-move-key-event="${escapeHtml(e.id)}" data-dir="-1" aria-label="${escapeHtml(t().moveUp || "Move up")}">↑</button>
              <button type="button" class="chronicle-ke__move" data-move-key-event="${escapeHtml(e.id)}" data-dir="1" aria-label="${escapeHtml(t().moveDown || "Move down")}">↓</button>
              <button type="button" class="chronicle-ke__edit" data-edit-key-event="${escapeHtml(e.id)}">${escapeHtml(t().editSection || "Edit")}</button>
            </span>
          </li>`;
      })
      .join("");

    return `
      <div class="chronicle-session-events">
        <h4>${escapeHtml(t().keyEvents || "Key Events")}</h4>
        ${rows ? `<ul class="chronicle-ke-list">${rows}</ul>` : `<p class="chronicle-empty">${escapeHtml(t().keyEventsEmpty || "No key events for this session.")}</p>`}
        <button type="button" class="chronicle-add" data-add-key-event="${sessionNum}">${escapeHtml(t().addKeyEvent || "+ Add Key Event")}</button>
      </div>`;
  }

  function renderSessionActivity(sessionNum) {
    const entries =
      typeof window.CampaignState?.getTimeline === "function"
        ? CampaignState.getTimeline({ session: sessionNum })
        : [];
    if (!entries.length) {
      return `
        <details class="chronicle-activity">
          <summary>${escapeHtml(t().sessionActivity || "Session activity")}</summary>
          <p class="chronicle-empty">${escapeHtml(t().sessionActivityEmpty || "No History entries for this session.")}</p>
        </details>`;
    }
    const items = entries
      .map(
        (e) => `
        <li class="chronicle-activity__item">
          <span>${escapeHtml(e.text)}</span>
          <button type="button" class="chronicle-promote" data-promote-history="${escapeHtml(e.id)}">${escapeHtml(t().makeKeyEvent || "★ Make Key Event")}</button>
        </li>`
      )
      .join("");
    return `
      <details class="chronicle-activity">
        <summary>${escapeHtml(t().sessionActivity || "Session activity")}</summary>
        <ul class="chronicle-activity__list">${items}</ul>
      </details>`;
  }

  function renderSessionCard(session) {
    const editing = editingSessions.has(session.session);
    const dates = [session.playedDate, session.inWorldDate].filter(Boolean).join(" · ");
    const headMeta = dates ? `<p class="chronicle-session__dates">${escapeHtml(dates)}</p>` : "";

    if (editing) {
      return `
        <article class="chronicle-session is-editing" id="chronicle-session-${session.session}">
          <header class="chronicle-session__head">
            <p class="chronicle-session__kicker">${escapeHtml(t().session || "Session")} ${session.session}</p>
            <button type="button" class="toolbar-btn" data-session-done="${session.session}">${escapeHtml(t().doneEdit || "Done")}</button>
          </header>
          <label class="chronicle-meta-label">${escapeHtml(t().chronicleTitle || "Title")}
            <input type="text" data-session-title="${session.session}" value="${escapeHtml(session.title)}" placeholder="${escapeHtml(t().chronicleTitlePlaceholder || "Optional title…")}">
          </label>
          <div class="chronicle-meta-row">
            <label class="chronicle-meta-label">${escapeHtml(t().playedDate || "Played")}
              <input type="date" data-session-played="${session.session}" value="${escapeHtml(session.playedDate)}">
            </label>
            <label class="chronicle-meta-label">${escapeHtml(t().inWorldDate || "In-world")}
              <input type="text" data-session-inworld="${session.session}" value="${escapeHtml(session.inWorldDate)}" placeholder="${escapeHtml(t().inWorldDatePlaceholder || "Optional…")}">
            </label>
          </div>
          <textarea class="chronicle-editor" rows="10" data-session-content="${session.session}" placeholder="${escapeHtml(t().chroniclePlaceholder || "What happened in the story…")}">${escapeHtml(session.content)}</textarea>
          ${renderSessionActivity(session.session)}
          ${renderSessionKeyEvents(session.session)}
        </article>`;
    }

    return `
      <article class="chronicle-session" id="chronicle-session-${session.session}">
        <header class="chronicle-session__head">
          <div>
            <p class="chronicle-session__kicker">${escapeHtml(t().session || "Session")} ${session.session}</p>
            <h3 class="chronicle-session__title">${escapeHtml(session.title || t().untitledSession || "Untitled session")}</h3>
            ${headMeta}
          </div>
          <button type="button" class="toolbar-btn" data-session-edit="${session.session}">${escapeHtml(t().editSection || "Edit")}</button>
        </header>
        <div class="chronicle-prose">${proseHtml(session.content)}</div>
        ${renderSessionActivity(session.session)}
        ${renderSessionKeyEvents(session.session)}
      </article>`;
  }

  function renderChroniclePanel() {
    if (!window.ChronicleStore) {
      return `<h1>Chronicle</h1><p class="empty-state">Chronicle store unavailable.</p>`;
    }
    const newestFirst = ChronicleStore.getSessionOrderNewestFirst();
    let sessions = ChronicleStore.listSessions();
    if (newestFirst) sessions = sessions.slice().reverse();

    const sessionHtml = sessions.length
      ? sessions.map(renderSessionCard).join("")
      : `<p class="chronicle-empty">${escapeHtml(t().chronicleSessionsEmpty || "No session entries yet.")}</p>`;

    return `
      <div class="chronicle">
        <header class="chronicle-page-head">
          <h1>${escapeHtml(t().headings?.chronicle || "Chronicle")}</h1>
          <p class="chronicle-lede">${escapeHtml(t().chronicleIntro || "The story as you choose to remember it — not the mechanical ledger.")}</p>
        </header>
        ${renderStoryBlock()}
        ${renderTimeline()}
        <section class="chronicle-sessions">
          <header class="chronicle-block-head">
            <h2>${escapeHtml(t().sessionChronicle || "Sessions")}</h2>
            <div class="chronicle-session-tools">
              <button type="button" class="toolbar-btn" id="chronicle-order-toggle">${escapeHtml(
                newestFirst ? t().oldestFirst || "Oldest first" : t().newestFirst || "Newest first"
              )}</button>
              <button type="button" class="btn btn-primary" id="chronicle-new-session">${escapeHtml(t().newSessionEntry || "+ New Session Entry")}</button>
            </div>
          </header>
          ${sessionHtml}
        </section>
      </div>`;
  }

  function closeEventDialog() {
    pendingEventId = null;
    pendingPrefill = null;
    if (!eventDialog) return;
    if (typeof eventDialog.close === "function") eventDialog.close();
    else eventDialog.removeAttribute("open");
  }

  function openKeyEventEditor(prefill) {
    pendingPrefill = prefill || {};
    pendingEventId = prefill?.id || null;
    if (!eventDialog || !eventDialogBody) return;
    const ev = prefill?.id ? ChronicleStore.getKeyEvent(prefill.id) : null;
    const data = { ...(ev || {}), ...(prefill || {}) };
    const selectedEntities = data.entityIds || [];

    eventDialogBody.innerHTML = `
      <form class="interaction-form" id="key-event-form">
        <label>${escapeHtml(t().session || "Session")}
          <input type="number" min="1" name="session" value="${escapeHtml(String(data.session || sessionNumber()))}" required>
        </label>
        <label>${escapeHtml(t().chronicleTitle || "Title")}
          <input type="text" name="title" value="${escapeHtml(data.title || "")}" required>
        </label>
        <label>${escapeHtml(t().keyEventDescription || "Description")}
          <textarea name="description" rows="3">${escapeHtml(data.description || "")}</textarea>
        </label>
        <div class="chronicle-meta-row">
          <label>${escapeHtml(t().keyEventType || "Type")}
            <select name="type">${typeOptions(data.type || "other")}</select>
          </label>
          <label>${escapeHtml(t().importance || "Importance")}
            <select name="importance">
              <option value="normal"${data.importance !== "major" ? " selected" : ""}>${escapeHtml(t().importanceNormal || "Normal")}</option>
              <option value="major"${data.importance === "major" ? " selected" : ""}>${escapeHtml(t().importanceMajor || "Major")}</option>
            </select>
          </label>
        </div>
        <label>${escapeHtml(t().sceneLabel || "Scene")}
          <select name="sceneId">${sceneOptions(data.sceneId || "")}</select>
        </label>
        <label>${escapeHtml(t().locationLabel || "Location")}
          <select name="locationId">${locationOptions(data.locationId || "")}</select>
        </label>
        <label>${escapeHtml(t().entitiesLabel || "Entities")}
          <select name="entityIds" multiple size="6">${entityOptions(selectedEntities)}</select>
        </label>
        <div class="editor-actions">
          <button type="submit" class="btn btn-primary">${escapeHtml(t().saveSection || "Save")}</button>
          ${pendingEventId ? `<button type="button" class="btn" data-delete-key-event>${escapeHtml(t().deleteSection || "Delete")}</button>` : ""}
          <button type="button" class="btn" data-cancel-key-event>${escapeHtml(t().cancelEdit || "Cancel")}</button>
        </div>
      </form>`;

    eventDialogBody.querySelector("[data-cancel-key-event]")?.addEventListener("click", closeEventDialog);
    eventDialogBody.querySelector("[data-delete-key-event]")?.addEventListener("click", () => {
      if (!pendingEventId) return;
      ChronicleStore.deleteKeyEvent(pendingEventId);
      closeEventDialog();
      refresh();
    });
    eventDialogBody.querySelector("#key-event-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const entitySelect = e.target.querySelector("[name=entityIds]");
      const entityIds = entitySelect ? [...entitySelect.selectedOptions].map((o) => o.value) : [];
      ChronicleStore.upsertKeyEvent({
        id: pendingEventId || undefined,
        session: Number(fd.get("session")) || sessionNumber(),
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        type: String(fd.get("type") || "other"),
        importance: String(fd.get("importance") || "normal"),
        sceneId: String(fd.get("sceneId") || ""),
        locationId: String(fd.get("locationId") || ""),
        entityIds,
        sourceHistoryId: data.sourceHistoryId || null
      });
      closeEventDialog();
      refresh();
    });

    try {
      eventDialog.showModal();
    } catch {
      eventDialog.setAttribute("open", "");
    }
  }

  function openKeyEventDetail(id) {
    const ev = ChronicleStore.getKeyEvent(id);
    if (!ev || !eventDialog || !eventDialogBody) return;
    pendingEventId = id;
    const chips = renderKeyEventChips(ev);
    eventDialogBody.innerHTML = `
      <div class="chronicle-ke-detail">
        <p class="chronicle-session__kicker">${escapeHtml(t().session || "Session")} ${escapeHtml(String(ev.session || "—"))} · ${escapeHtml(TYPE_LABELS[ev.type] || ev.type)}${ev.importance === "major" ? " · " + escapeHtml(t().importanceMajor || "Major") : ""}</p>
        <h3>${escapeHtml(ev.title)}</h3>
        ${ev.description ? `<div class="chronicle-prose">${proseHtml(ev.description)}</div>` : ""}
        ${chips ? `<div class="chronicle-ke-chips">${chips}</div>` : ""}
        <div class="editor-actions">
          <button type="button" class="btn btn-primary" data-edit-from-detail="${escapeHtml(ev.id)}">${escapeHtml(t().editSection || "Edit")}</button>
          <button type="button" class="btn" data-cancel-key-event>${escapeHtml(t().cancelEdit || "Close")}</button>
        </div>
      </div>`;
    eventDialogBody.querySelector("[data-cancel-key-event]")?.addEventListener("click", closeEventDialog);
    eventDialogBody.querySelector("[data-edit-from-detail]")?.addEventListener("click", () => openKeyEventEditor({ id: ev.id }));
    eventDialogBody.querySelectorAll("[data-jump-scene]").forEach((btn) => {
      btn.addEventListener("click", () => {
        closeEventDialog();
        if (typeof api.jumpToSection === "function") api.jumpToSection(btn.dataset.jumpScene);
      });
    });
    try {
      eventDialog.showModal();
    } catch {
      eventDialog.setAttribute("open", "");
    }
  }

  function bindAutosave(root) {
    const storyEl = root.querySelector("#chronicle-story-editor");
    if (storyEl) {
      let timer;
      storyEl.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => ChronicleStore.setStorySoFar(storyEl.value), 350);
      });
    }

    function patchSession(session, patch) {
      const current = ChronicleStore.getSession(session) || { session };
      ChronicleStore.upsertSession({ ...current, ...patch });
    }

    root.querySelectorAll("[data-session-title]").forEach((el) => {
      let timer;
      el.addEventListener("input", () => {
        const session = Number(el.dataset.sessionTitle);
        clearTimeout(timer);
        timer = setTimeout(() => patchSession(session, { title: el.value }), 350);
      });
    });
    root.querySelectorAll("[data-session-played]").forEach((el) => {
      el.addEventListener("change", () => patchSession(Number(el.dataset.sessionPlayed), { playedDate: el.value }));
    });
    root.querySelectorAll("[data-session-inworld]").forEach((el) => {
      let timer;
      el.addEventListener("input", () => {
        const session = Number(el.dataset.sessionInworld);
        clearTimeout(timer);
        timer = setTimeout(() => patchSession(session, { inWorldDate: el.value }), 350);
      });
    });
    root.querySelectorAll("[data-session-content]").forEach((el) => {
      let timer;
      el.addEventListener("input", () => {
        const session = Number(el.dataset.sessionContent);
        clearTimeout(timer);
        timer = setTimeout(() => patchSession(session, { content: el.value }), 350);
      });
    });
  }

  function bindChroniclePanel(root) {
    if (!root) return;

    root.querySelector("[data-story-edit]")?.addEventListener("click", () => {
      editingStory = true;
      refresh();
    });
    root.querySelector("[data-story-done]")?.addEventListener("click", () => {
      const el = root.querySelector("#chronicle-story-editor");
      if (el) ChronicleStore.setStorySoFar(el.value);
      editingStory = false;
      refresh();
    });

    root.querySelector("#chronicle-order-toggle")?.addEventListener("click", () => {
      ChronicleStore.setSessionOrderNewestFirst(!ChronicleStore.getSessionOrderNewestFirst());
      refresh();
    });

    root.querySelector("#chronicle-new-session")?.addEventListener("click", () => {
      const next = ChronicleStore.suggestNextSessionNumber(sessionNumber());
      ChronicleStore.upsertSession({ session: next, title: "", content: "" });
      editingSessions.add(next);
      refresh();
      requestAnimationFrame(() => {
        document.getElementById(`chronicle-session-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    root.querySelectorAll("[data-session-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editingSessions.add(Number(btn.dataset.sessionEdit));
        refresh();
      });
    });
    root.querySelectorAll("[data-session-done]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const session = Number(btn.dataset.sessionDone);
        const card = btn.closest(".chronicle-session");
        if (card) {
          const title = card.querySelector("[data-session-title]")?.value;
          const playedDate = card.querySelector("[data-session-played]")?.value;
          const inWorldDate = card.querySelector("[data-session-inworld]")?.value;
          const content = card.querySelector("[data-session-content]")?.value;
          ChronicleStore.upsertSession({ session, title, playedDate, inWorldDate, content });
        }
        editingSessions.delete(session);
        refresh();
      });
    });

    root.querySelectorAll("[data-add-key-event]").forEach((btn) => {
      btn.addEventListener("click", () => openKeyEventEditor({ session: Number(btn.dataset.addKeyEvent) }));
    });
    root.querySelectorAll("[data-edit-key-event]").forEach((btn) => {
      btn.addEventListener("click", () => openKeyEventEditor({ id: btn.dataset.editKeyEvent }));
    });
    root.querySelectorAll("[data-open-key-event]").forEach((btn) => {
      btn.addEventListener("click", () => openKeyEventDetail(btn.dataset.openKeyEvent));
    });
    root.querySelectorAll("[data-move-key-event]").forEach((btn) => {
      btn.addEventListener("click", () => {
        ChronicleStore.moveKeyEvent(btn.dataset.moveKeyEvent, Number(btn.dataset.dir));
        refresh();
      });
    });
    root.querySelectorAll("[data-promote-history]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entry = window.CampaignState?.getTimeline?.().find((e) => e.id === btn.dataset.promoteHistory);
        openKeyEventEditor(ChronicleStore.fromHistoryEntry(entry) || {});
      });
    });

    bindAutosave(root);
  }

  function promoteHistoryEntry(entryId) {
    const entry = window.CampaignState?.getTimeline?.().find((e) => e.id === entryId);
    if (!entry) return;
    openKeyEventEditor(ChronicleStore.fromHistoryEntry(entry));
  }

  return {
    init,
    renderChroniclePanel,
    bindChroniclePanel,
    openKeyEventEditor,
    promoteHistoryEntry
  };
})();
