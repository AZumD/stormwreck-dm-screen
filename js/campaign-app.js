/**
 * Campaign DM screen — continuous scroll, panels, inline editing
 */
(function () {
  "use strict";

  const { parseContent, markdownLite, stripTags, escapeHtml } = ContentParser;
  const t = window.I18N;
  const campaignId = ADVENTURE.meta?.id || "stormwreck-isle";

  const STORAGE_KEYS = {
    notes: `${campaignId}-notes`,
    checklist: `${campaignId}-checklist`,
    session: `${campaignId}-session`
  };

  const sectionNav = document.getElementById("section-nav");
  const scrollDocument = document.getElementById("scroll-document");
  const panelView = document.getElementById("panel-view");
  const searchInput = document.getElementById("search");
  const tooltip = document.getElementById("entity-tooltip");
  const entityModal = document.getElementById("entity-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const searchModal = document.getElementById("search-modal");
  const searchResults = document.getElementById("search-results");
  const sessionBadge = document.getElementById("session-badge");
  const editModeToggle = document.getElementById("edit-mode-toggle");
  const formatHelp = document.getElementById("format-help");

  let activeView = { type: "scroll" };
  let scrollSpyObserver = null;
  let editingSectionId = null;

  function getSections() {
    return SectionEditor.getSections(campaignId, ADVENTURE.sections);
  }

  function getSectionById(sectionId) {
    return getSections().find((s) => s.id === sectionId) || null;
  }

  function getSectionData(section) {
    return SectionEditor.getSection(campaignId, section.id, {
      title: section.title,
      content: section.content,
      chapter: section.chapter
    });
  }

  function getEntities() {
    return window.EntityRegistry?.getAll() || window.ENTITIES || {};
  }

  function refreshDocument(focusSectionId) {
    buildNav();
    renderScrollDocument();
    setupScrollSpy();
    if (focusSectionId) jumpToSection(focusSectionId);
  }

  function init() {
    bootstrap();
  }

  async function bootstrap() {
    if (window.CatalogueImages) {
      try {
        await CatalogueImages.preload(["pc", "npc", "item", "monster", "location"]);
        await CatalogueImages.migrateAll(["pc", "npc", "item", "monster", "location"]);
      } catch (err) {
        console.warn("CatalogueImages preload failed:", err);
      }
    }

    if (window.EntityRegistry) {
      try {
        EntityRegistry.build();
      } catch (err) {
        console.error("EntityRegistry.build failed:", err);
      }
    }

    EntityUI.init({
      tooltip: tooltip,
      modal: entityModal,
      modalTitle: modalTitle,
      modalBody: modalBody
    });

    buildNav();
    renderScrollDocument();
    bindEvents();
    loadSessionBadge();
    setupScrollSpy();
    syncEditModeUI();
    MapPanel.init(campaignId);

    window.addEventListener("focus", async () => {
      if (window.CatalogueImages) {
        try {
          await CatalogueImages.preload(["pc", "npc", "item", "monster", "location"]);
        } catch {
          /* ignore */
        }
      }
      if (window.EntityRegistry) {
        try {
          EntityRegistry.build();
        } catch {
          /* ignore */
        }
      }
      if (window.MapPanel?.refresh) MapPanel.refresh();
      if (activeView.type === "panel") {
        renderPanel(activeView.id);
      } else {
        renderScrollDocument();
        setupScrollSpy();
      }
    });
  }

  function buildNav() {
    sectionNav.innerHTML = "";
    const sections = getSections();

    ADVENTURE.chapters.forEach((chapter) => {
      const chapterSections = sections.filter((s) => s.chapter === chapter.id);
      if (!chapterSections.length && !SectionEditor.isEditMode()) return;

      const chapterLi = document.createElement("li");
      chapterLi.className = "nav-chapter";
      chapterLi.textContent = chapter.title;
      sectionNav.appendChild(chapterLi);

      chapterSections.forEach((section) => {
        const data = getSectionData(section);
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nav-btn nav-scene";
        btn.dataset.section = section.id;
        const mark = data.isCustom ? " +" : data.isEdited ? " •" : "";
        btn.textContent = data.title + mark;
        btn.addEventListener("click", () => jumpToSection(section.id));
        li.appendChild(btn);
        sectionNav.appendChild(li);
      });
    });
  }

  function sectionActionsHtml(section, data) {
    if (!SectionEditor.isEditMode()) return "";
    return `
      <div class="section-actions">
        <button type="button" class="section-edit-btn" data-edit="${section.id}" title="${t.editSection}">✎ ${t.editSection}</button>
        <button type="button" class="section-delete-btn" data-delete="${section.id}" title="${t.deleteSection}">${t.deleteSection}</button>
      </div>`;
  }

  function addPassageControlsHtml(chapterId, afterId) {
    if (!SectionEditor.isEditMode()) return "";
    const afterAttr = afterId ? ` data-after="${afterId}"` : "";
    return `
      <div class="add-passage-row">
        <button type="button" class="add-passage-btn" data-add-chapter="${chapterId}"${afterAttr}>
          + ${t.addPassage}
        </button>
      </div>`;
  }

  function renderScrollDocument() {
    let html = "";
    editingSectionId = null;
    const sections = getSections();
    const editMode = SectionEditor.isEditMode();

    ADVENTURE.chapters.forEach((chapter) => {
      const chapterSections = sections.filter((s) => s.chapter === chapter.id);
      if (!chapterSections.length && !editMode) return;

      html += `<div class="chapter-divider" id="chapter-${chapter.id}"><h2>${escapeHtml(chapter.title)}</h2></div>`;
      if (editMode && !chapterSections.length) {
        html += addPassageControlsHtml(chapter.id, null);
      }

      chapterSections.forEach((section) => {
        const data = getSectionData(section);
        const badges = [
          data.isCustom ? `<span class="edited-badge">${t.customBadge || "custom"}</span>` : "",
          data.isEdited ? `<span class="edited-badge">${t.editedBadge || "edited"}</span>` : ""
        ].join(" ");

        html += `
          <section class="adventure-section${data.isEdited || data.isCustom ? " is-edited" : ""}${data.isCustom ? " is-custom" : ""}" id="section-${section.id}" data-section="${section.id}">
            <div class="section-header">
              <h1 class="section-title">${escapeHtml(data.title)} ${badges}</h1>
              ${sectionActionsHtml(section, data)}
            </div>
            <div class="section-body" data-body="${section.id}">
              ${parseContent(data.content, getEntities())}
            </div>
            <div class="section-editor hidden" data-editor="${section.id}"></div>
          </section>
          ${addPassageControlsHtml(section.chapter, section.id)}`;
      });
    });

    const deleted = SectionEditor.getDeletedIds(campaignId);
    if (editMode && deleted.length) {
      html += `
        <div class="restore-passages">
          <p>${t.deletedPassagesHint.replace("{n}", String(deleted.length))}</p>
          <button type="button" class="btn" id="restore-deleted-passages">${t.restoreDeleted}</button>
        </div>`;
    }

    scrollDocument.innerHTML = html;
    bindDocumentEditControls();
  }

  function bindDocumentEditControls() {
    scrollDocument.querySelectorAll(".section-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openSectionEditor(btn.dataset.edit));
    });

    scrollDocument.querySelectorAll(".section-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deletePassage(btn.dataset.delete));
    });

    scrollDocument.querySelectorAll(".add-passage-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        addPassage(btn.dataset.addChapter, btn.dataset.after || null);
      });
    });

    const restoreBtn = document.getElementById("restore-deleted-passages");
    if (restoreBtn) {
      restoreBtn.addEventListener("click", () => {
        if (!confirm(t.confirmRestoreDeleted)) return;
        SectionEditor.restoreAllDeleted(campaignId);
        refreshDocument();
      });
    }
  }

  function addPassage(chapterId, afterId) {
    const title = prompt(t.newPassagePrompt, t.newPassageDefaultTitle);
    if (title == null) return;
    const trimmed = title.trim() || t.newPassageDefaultTitle;

    const created = SectionEditor.addSection(campaignId, {
      chapter: chapterId,
      afterId: afterId || null,
      title: trimmed
    });

    refreshDocument(created.id);
    openSectionEditor(created.id);
  }

  function deletePassage(sectionId) {
    const section = getSectionById(sectionId);
    if (!section) return;

    const data = getSectionData(section);
    const isCustom = SectionEditor.isCustomSection(campaignId, sectionId);
    const message = isCustom
      ? t.confirmDeleteCustom.replace("{title}", data.title)
      : t.confirmDeleteBuiltIn.replace("{title}", data.title);

    if (!confirm(message)) return;

    SectionEditor.deleteSection(campaignId, sectionId, ADVENTURE.sections);
    if (editingSectionId === sectionId) editingSectionId = null;
    refreshDocument();
  }

  function openSectionEditor(sectionId) {
    if (editingSectionId && editingSectionId !== sectionId) {
      closeSectionEditor(editingSectionId, false);
    }

    const section = getSectionById(sectionId);
    if (!section) return;

    const data = getSectionData(section);
    const host = scrollDocument.querySelector(`[data-editor="${sectionId}"]`);
    const body = scrollDocument.querySelector(`[data-body="${sectionId}"]`);
    if (!host || !body) return;

    const isCustom = SectionEditor.isCustomSection(campaignId, sectionId);
    const resetBtn = isCustom
      ? ""
      : `<button type="button" class="btn btn-danger" data-reset="${sectionId}">${t.resetSection}</button>`;

    editingSectionId = sectionId;
    body.classList.add("hidden");
    host.classList.remove("hidden");
    host.innerHTML = `
      <label class="editor-label">${t.passageTitleLabel || "Title"}</label>
      <input type="text" class="editor-title" value="${escapeHtml(data.title)}">
      <label class="editor-label">${t.passageContentLabel || "Content"}</label>
      <textarea class="editor-content" rows="14">${escapeHtml(data.content.trim())}</textarea>
      <p class="format-hint">${t.formatHelp}</p>
      <div class="editor-actions">
        <button type="button" class="btn btn-primary" data-save="${sectionId}">${t.saveSection}</button>
        <button type="button" class="btn" data-cancel="${sectionId}">${t.cancelEdit}</button>
        <button type="button" class="btn" data-insert-youtube="${sectionId}">${t.insertYoutube || "Insert YouTube"}</button>
        ${resetBtn}
        <button type="button" class="btn btn-danger" data-delete-inline="${sectionId}">${t.deleteSection}</button>
      </div>`;

    host.querySelector(`[data-save="${sectionId}"]`).addEventListener("click", () => saveSectionEditor(sectionId));
    host.querySelector(`[data-cancel="${sectionId}"]`).addEventListener("click", () => closeSectionEditor(sectionId, false));
    const resetEl = host.querySelector(`[data-reset="${sectionId}"]`);
    if (resetEl) resetEl.addEventListener("click", () => resetSectionEditor(sectionId));
    host.querySelector(`[data-delete-inline="${sectionId}"]`).addEventListener("click", () => deletePassage(sectionId));
    host.querySelector(`[data-insert-youtube="${sectionId}"]`).addEventListener("click", () => insertYoutubeSnippet(host));

    host.querySelector(".editor-title").focus();
  }

  function insertYoutubeSnippet(host) {
    const url = prompt(t.youtubeUrlPrompt || "YouTube URL or video ID:");
    if (url == null || !url.trim()) return;
    const title = prompt(t.youtubeTitlePrompt || "Button label (optional):", t.mediaDefaultTitle || "Play music");
    if (title == null) return;
    const label = title.trim();
    const snippet = label
      ? `{{youtube:${url.trim()}|${label}}}`
      : `{{youtube:${url.trim()}}}`;
    const textarea = host.querySelector(".editor-content");
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const padBefore = before && !/\n$/.test(before) ? "\n" : "";
    const padAfter = after && !/^\n/.test(after) ? "\n" : "";
    textarea.value = `${before}${padBefore}${snippet}${padAfter}${after}`;
    textarea.focus();
    const cursor = (before + padBefore + snippet).length;
    textarea.setSelectionRange(cursor, cursor);
  }

  function closeSectionEditor(sectionId, saved) {
    const host = scrollDocument.querySelector(`[data-editor="${sectionId}"]`);
    const body = scrollDocument.querySelector(`[data-body="${sectionId}"]`);
    if (host) {
      host.classList.add("hidden");
      host.innerHTML = "";
    }
    if (body) body.classList.remove("hidden");
    if (editingSectionId === sectionId) editingSectionId = null;
    if (saved) refreshDocument(sectionId);
  }

  function saveSectionEditor(sectionId) {
    const host = scrollDocument.querySelector(`[data-editor="${sectionId}"]`);
    if (!host) return;
    const title = host.querySelector(".editor-title").value.trim() || t.newPassageDefaultTitle;
    const content = host.querySelector(".editor-content").value;
    SectionEditor.saveSection(campaignId, sectionId, title, content);
    closeSectionEditor(sectionId, true);
  }

  function resetSectionEditor(sectionId) {
    if (!confirm(t.confirmResetSection)) return;
    SectionEditor.resetSection(campaignId, sectionId);
    closeSectionEditor(sectionId, true);
  }

  function syncEditModeUI() {
    const on = SectionEditor.isEditMode();
    if (editModeToggle) {
      editModeToggle.classList.toggle("active", on);
      editModeToggle.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (formatHelp) {
      formatHelp.classList.toggle("hidden", !on);
      formatHelp.textContent = on ? `${t.formatHelp} · ${t.editModeHint}` : t.formatHelp;
    }
    document.body.classList.toggle("edit-mode", on);
  }

  function toggleEditMode() {
    SectionEditor.setEditMode(!SectionEditor.isEditMode());
    syncEditModeUI();
    refreshDocument(location.hash.replace("#", "") || undefined);
  }

  function jumpToSection(id) {
    showScrollView();
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
  }

  function showScrollView() {
    activeView = { type: "scroll" };
    scrollDocument.classList.remove("hidden");
    panelView.classList.add("hidden");
    updateNavActive();
    setupScrollSpy();
  }

  function showPanelView(view) {
    activeView = { type: "panel", id: view };
    scrollDocument.classList.add("hidden");
    panelView.classList.remove("hidden");
    if (scrollSpyObserver) scrollSpyObserver.disconnect();
    renderPanel(view);
    updateNavActive();
  }

  function renderPanel(view) {
    switch (view) {
      case "npcs":
        panelView.innerHTML = `<h1>${t.headings.npcs}</h1>${renderEntityGrid("npc")}`;
        break;
      case "monsters":
        panelView.innerHTML = `<h1>${t.headings.monsters}</h1>${renderEntityGrid("monster")}`;
        break;
      case "locations":
        panelView.innerHTML = `<h1>${t.headings.locations}</h1>${renderEntityGrid("location")}`;
        break;
      case "notes":
        panelView.innerHTML = renderNotesView();
        bindNotesEvents();
        break;
      case "checklist":
        panelView.innerHTML = renderChecklistView();
        bindChecklistEvents();
        break;
    }

    panelView.querySelectorAll(".ref-card[data-id]").forEach((card) => {
      card.addEventListener("click", () => EntityUI.openModal(card.dataset.id));
    });
  }

  function renderEntityGrid(type) {
    const items = (window.EntityRegistry?.byType(type) || Object.values(getEntities()).filter((e) => e.type === type))
      .sort((a, b) => a.name.localeCompare(b.name));
    const emptyKey = "empty" + type.charAt(0).toUpperCase() + type.slice(1) + "s";
    const empty = t[emptyKey] || t.emptyNpcs;
    if (!items.length) return `<p class="empty-state">${empty}</p>`;

    return `<div class="ref-grid">${items
      .map(
        (e) => `
        <div class="ref-card" data-id="${e.id}">
          ${e.portrait ? `<img class="ref-card__portrait" src="${escapeHtml(e.portrait)}" alt="">` : ""}
          <h3>${escapeHtml(e.name)}</h3>
          <p>${escapeHtml(e.summary || "")}</p>
        </div>`
      )
      .join("")}</div>`;
  }

  function setupScrollSpy() {
    if (scrollSpyObserver) scrollSpyObserver.disconnect();

    const sections = scrollDocument.querySelectorAll(".adventure-section");
    if (!sections.length) return;

    scrollSpyObserver = new IntersectionObserver(
      (entries) => {
        if (activeView.type !== "scroll") return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) highlightNavSection(visible.target.dataset.section);
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((s) => scrollSpyObserver.observe(s));
  }

  function highlightNavSection(id) {
    document.querySelectorAll(".nav-btn[data-section]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.section === id);
    });
  }

  function updateNavActive() {
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

    if (activeView.type === "scroll") {
      const hash = location.hash.replace("#", "");
      if (hash) highlightNavSection(hash);
    } else {
      const btn = document.querySelector(`.nav-btn[data-view="${activeView.id}"]`);
      if (btn) btn.classList.add("active");
    }
  }

  function bindEvents() {
    document.querySelectorAll(".nav-btn[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => showPanelView(btn.dataset.view));
    });

    if (editModeToggle) editModeToggle.addEventListener("click", toggleEditMode);

    document.getElementById("modal-close").addEventListener("click", () => entityModal.close());
    document.getElementById("search-close").addEventListener("click", () => searchModal.close());
    entityModal.addEventListener("click", (e) => {
      if (e.target === entityModal) entityModal.close();
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runSearch(searchInput.value.trim());
    });

    const bindEntityEvents = (root) => EntityUI.bindEntityLinks(root);

    bindEntityEvents(scrollDocument);
    bindEntityEvents(panelView);

    window.addEventListener("hashchange", () => {
      const id = location.hash.replace("#", "");
      if (id && activeView.type === "scroll") jumpToSection(id);
    });

    const initialHash = location.hash.replace("#", "");
    if (initialHash) requestAnimationFrame(() => jumpToSection(initialHash));
  }

  function snippet(text, q) {
    const idx = text.indexOf(q);
    if (idx === -1) return text.slice(0, 120);
    const start = Math.max(0, idx - 40);
    return (start > 0 ? "…" : "") + text.slice(start, start + 120) + "…";
  }

  function renderNotesView() {
    const saved = localStorage.getItem(STORAGE_KEYS.notes) || "";
    return `
      <h1>${t.headings.notes}</h1>
      <p>${t.notesIntro}</p>
      <textarea id="notes-editor" class="notes-editor" placeholder="${t.notesPlaceholder}">${escapeHtml(saved)}</textarea>
      <div class="notes-meta">
        <span id="notes-status">${t.savedLocally}</span>
        <label>
          ${t.session}
          <input type="number" id="session-number" min="1" value="${getSessionNumber()}" style="width:4rem;margin-left:0.5rem">
        </label>
      </div>`;
  }

  function bindNotesEvents() {
    const editor = document.getElementById("notes-editor");
    const status = document.getElementById("notes-status");
    const sessionInput = document.getElementById("session-number");
    if (!editor || !status || !sessionInput) return;

    let saveTimer;
    editor.addEventListener("input", () => {
      clearTimeout(saveTimer);
      status.textContent = t.saving;
      saveTimer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.notes, editor.value);
        status.textContent = t.savedLocally;
      }, 400);
    });

    sessionInput.addEventListener("change", () => {
      const n = Math.max(1, parseInt(sessionInput.value, 10) || 1);
      localStorage.setItem(STORAGE_KEYS.session, String(n));
      sessionInput.value = n;
      loadSessionBadge();
    });
  }

  function getSessionNumber() {
    return localStorage.getItem(STORAGE_KEYS.session) || "1";
  }

  function loadSessionBadge() {
    sessionBadge.textContent = `${t.session} ${getSessionNumber()}`;
  }

  function getChecklistState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.checklist) || "{}");
    } catch {
      return {};
    }
  }

  function saveChecklistState(state) {
    localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(state));
  }

  function renderChecklistView() {
    const state = getChecklistState();
    const groups = ADVENTURE.checklist
      .map(
        (g) => `
        <div class="checklist-group">
          <h3>${escapeHtml(g.group)}</h3>
          ${g.items
            .map((item) => {
              const done = !!state[item.id];
              return `
              <div class="checklist-item${done ? " done" : ""}">
                <input type="checkbox" id="chk-${item.id}" data-id="${item.id}" ${done ? "checked" : ""}>
                <label for="chk-${item.id}">${escapeHtml(item.label)}</label>
              </div>`;
            })
            .join("")}
        </div>`
      )
      .join("");

    return `<h1>${t.headings.checklist}</h1><p>${t.checklistIntro}</p>${groups}`;
  }

  function bindChecklistEvents() {
    panelView.querySelectorAll(".checklist-item input").forEach((input) => {
      input.addEventListener("change", () => {
        const state = getChecklistState();
        state[input.dataset.id] = input.checked;
        saveChecklistState(state);
        input.closest(".checklist-item").classList.toggle("done", input.checked);
      });
    });
  }

  function runSearch(query) {
    if (!query) return;
    const q = query.toLowerCase();
    const results = [];

    getSections().forEach((section) => {
      const data = getSectionData(section);
      const text = stripTags(data.content + " " + data.title).toLowerCase();
      if (text.includes(q)) {
        results.push({
          type: t.typeLabels.section,
          title: data.title,
          snippet: snippet(text, q),
          action: () => {
            searchModal.close();
            jumpToSection(section.id);
          }
        });
      }
    });

    const entities = getEntities();
    Object.values(entities).forEach((entity) => {
      const hay = [entity.name, entity.summary, entity.details, ...(entity.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (hay.includes(q)) {
        results.push({
          type: t.typeLabels[entity.type] || entity.type,
          title: entity.name,
          snippet: entity.summary || "",
          action: () => {
            searchModal.close();
            EntityUI.openModal(entity.id);
          }
        });
      }
    });

    if (!results.length) {
      searchResults.innerHTML = `<p class="empty-state">${t.searchNoResults} "${escapeHtml(query)}"</p>`;
    } else {
      searchResults.innerHTML = results
        .map(
          (r, i) => `
          <div class="search-result" data-idx="${i}">
            <div class="search-result-type">${escapeHtml(r.type)}</div>
            <strong>${escapeHtml(r.title)}</strong>
            <div class="search-result-snippet">${escapeHtml(r.snippet)}</div>
          </div>`
        )
        .join("");

      searchResults.querySelectorAll(".search-result").forEach((el, i) => {
        el.addEventListener("click", results[i].action);
      });
    }

    searchModal.showModal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
