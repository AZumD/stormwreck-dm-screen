/**
 * Campaign DM screen — scene play view + document reference + panels
 */
(function () {
  "use strict";

  const { parseContent, markdownLite, escapeHtml } = ContentParser;
  const t = window.I18N;
  const campaignId = ADVENTURE.meta?.id || "stormwreck-isle";

  const STORAGE_KEYS = {
    notes: `${campaignId}-notes`,
    checklist: `${campaignId}-checklist`,
    session: `${campaignId}-session`,
    viewMode: `${campaignId}-view-mode`
  };

  const sectionNav = document.getElementById("section-nav");
  const playView = document.getElementById("play-view");
  const scrollDocument = document.getElementById("scroll-document");
  const panelView = document.getElementById("panel-view");
  const searchInput = document.getElementById("search");
  const catalogueSearch = document.getElementById("catalogue-search");
  const catalogueSearchResults = document.getElementById("catalogue-search-results");
  const tooltip = document.getElementById("entity-tooltip");
  const entityModal = document.getElementById("entity-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const searchModal = document.getElementById("search-modal");
  const searchResults = document.getElementById("search-results");
  const sessionBadge = document.getElementById("session-badge");
  const editModeToggle = document.getElementById("edit-mode-toggle");
  const formatHelp = document.getElementById("format-help");
  const viewModePlayBtn = document.getElementById("view-mode-play");
  const viewModeDocumentBtn = document.getElementById("view-mode-document");

  /** @type {{ type: "play"|"document"|"panel", id?: string }} */
  let activeView = { type: "play" };
  let focusedSceneId = null;
  let scrollSpyObserver = null;
  let editingSectionId = null;
  let catalogueSearchTimer = null;
  let catalogueSearchHits = [];
  let catalogueSearchActive = -1;

  function loadViewMode() {
    const saved = window.CampaignPrefs?.get(campaignId)?.viewMode;
    if (saved === "document" || saved === "play") return saved;
    return "play";
  }

  function saveViewMode(mode) {
    if (window.CampaignPrefs) CampaignPrefs.patch(campaignId, { viewMode: mode });
  }

  function getSections() {
    return SectionEditor.getSections(campaignId);
  }

  function getSectionById(sectionId) {
    return getSections().find((s) => s.id === sectionId) || null;
  }

  function getSectionBase(sectionId) {
    return getSectionById(sectionId);
  }

  function getSectionData(section) {
    if (!section) return { title: "Untitled", content: "" };
    return SectionEditor.getSection(campaignId, section.id, {
      title: section.title,
      content: section.content
    });
  }

  function getEntities() {
    return window.EntityRegistry?.getAll() || window.ENTITIES || {};
  }

  function refreshDocument(focusSectionId) {
    const draft = captureEditorDraft();
    buildNav();
    const id = focusSectionId || focusedSceneId || location.hash.replace("#", "") || getSections()[0]?.id;
    if (activeView.type === "panel") {
      renderPanel(activeView.id);
      return;
    }
    if (loadViewMode() === "document" || activeView.type === "document") {
      renderScrollDocument({ preserveDraft: draft });
      setupScrollSpy();
      if (id) {
        const el = document.getElementById(`section-${id}`);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      }
    } else {
      renderPlayScene(id, { preserveDraft: draft });
    }
    if (id) history.replaceState(null, "", `#${id}`);
    updateNavActive();
  }

  /** Snapshot open passage editor so prompts / scene-meta refreshes do not wipe drafts */
  function captureEditorDraft() {
    if (!editingSectionId) return null;
    const host = document.querySelector(`[data-editor="${editingSectionId}"]`);
    if (!host || host.classList.contains("hidden")) return null;
    const titleEl = host.querySelector(".editor-title");
    const contentEl = host.querySelector(".editor-content");
    if (!titleEl || !contentEl) return null;
    return {
      sectionId: editingSectionId,
      title: titleEl.value,
      content: contentEl.value
    };
  }

  function restoreEditorDraft(draft) {
    if (!draft?.sectionId) return;
    if (!document.querySelector(`[data-editor="${draft.sectionId}"]`)) return;
    openSectionEditor(draft.sectionId, draft);
  }

  function init() {
    bootstrap();
  }

  function syncCampaignChrome() {
    const title = ADVENTURE.meta?.title || "Campaign";
    const level = ADVENTURE.meta?.level || "";
    const h1 = document.querySelector(".sidebar-title-block h1");
    const sub = document.querySelector(".sidebar-title-block .subtitle");
    if (h1) h1.textContent = title;
    if (sub) sub.textContent = level ? `DM Screen · ${level}` : "DM Screen";
    if (document.body?.dataset) {
      document.body.dataset.campaignId = campaignId;
    }
    document.title = `${title} — DM Screen`;
  }

  async function bootstrap() {
    document.body.classList.add("is-booting");
    syncCampaignChrome();

    if (window.LocalApiClient) await LocalApiClient.ready();
    if (window.CatalogueStore) await CatalogueStore.bootstrap();
    if (window.CampaignPrefs) await CampaignPrefs.bootstrap(campaignId);
    if (window.LayoutPanels?.applyChromeFromPrefs && window.CampaignPrefs) {
      LayoutPanels.applyChromeFromPrefs(CampaignPrefs.get(campaignId));
    }
    if (window.CampaignMapState) await CampaignMapState.bootstrap(campaignId);
    if (window.CampaignMusicMixer) await CampaignMusicMixer.bootstrap(campaignId);
    if (window.CampaignLocations) await CampaignLocations.bootstrap(campaignId);
    if (window.SectionEditor?.bootstrap) {
      await SectionEditor.bootstrap(campaignId, ADVENTURE.sections || []);
    }
    if (window.SceneMeta?.bootstrap) await SceneMeta.bootstrap(campaignId);

    if (window.CatalogueImages) {
      try {
        const imageTypes = window.CatalogueTypes?.ids?.() || [
          "pc",
          "npc",
          "item",
          "monster",
          "location",
          "race",
          "class",
          "spell"
        ];
        await CatalogueImages.preload(imageTypes);
        await CatalogueImages.migrateAll(imageTypes);
      } catch (err) {
        console.warn("CatalogueImages preload failed:", err);
      }
    }

    if (window.EntityRegistry) {
      try {
        await EntityRegistry.build();
      } catch (err) {
        console.error("EntityRegistry.build failed:", err);
      }
    }

    window.addEventListener("focus", () => {
      if (window.MapPanel?.refreshPins) MapPanel.refreshPins();
    });

    EntityUI.init({
      tooltip: tooltip,
      modal: entityModal,
      modalTitle: modalTitle,
      modalBody: modalBody
    });

    if (window.CampaignState) await CampaignState.init(campaignId);
    if (window.DayTimeUI) DayTimeUI.init();
    if (window.ChronicleStore) await ChronicleStore.init(campaignId);
    if (window.PartyRoster) PartyRoster.init();
    if (window.MusicMixerUi) MusicMixerUi.init({ campaignId });
    if (window.SceneUI) {
      SceneUI.init({
        campaignId,
        api: {
          jumpToSection,
          getSections,
          getSectionTitle: (id) => {
            const section = getSectionById(id);
            return section ? getSectionData(section).title : id;
          },
          getSectionBase,
          onSceneMetaChange: (sceneId) => {
            const draft = captureEditorDraft();
            if (activeView.type === "play") renderPlayScene(sceneId || focusedSceneId, { preserveDraft: draft });
            else if (activeView.type === "document") renderScrollDocument({ preserveDraft: draft });
            buildNav();
            updateNavActive();
          }
        }
      });
    }
    if (window.CampaignStateUI) {
      CampaignStateUI.init({
        campaignId,
        api: {
          jumpToSection,
          getSessionNumber,
          getSections,
          getSectionBase,
          getFocusedSceneId: () => focusedSceneId || location.hash.replace("#", "") || "",
          getSectionTitle: (id) => {
            const section = getSectionById(id);
            return section ? getSectionData(section).title : id;
          },
          onSceneStateChange: () => {
            CampaignStateUI.applyNavSceneClasses();
            if (activeView.type === "play" && focusedSceneId) {
              renderPlayScene(focusedSceneId, { preserveDraft: captureEditorDraft() });
            }
          },
          refreshHistoryPanel: () => {
            if (activeView.type === "panel" && activeView.id === "history") renderPanel("history");
          }
        }
      });
    }
    if (window.ChronicleUI) {
      ChronicleUI.init({
        campaignId,
        api: {
          jumpToSection,
          getSessionNumber,
          getSections,
          getSectionTitle: (id) => {
            const section = getSectionById(id);
            return section ? getSectionData(section).title : id;
          },
          refreshChroniclePanel: () => {
            if (activeView.type === "panel" && activeView.id === "chronicle") renderPanel("chronicle");
          }
        }
      });
    }

    buildNav();
    bindEvents();
    bindViewModeControls();
    loadSessionBadge();
    syncEditModeUI();
    MapPanel.init(campaignId);
    restoreInitialScene();
    document.body.classList.remove("is-booting");

    window.addEventListener("sw:auth-required", () => {
      window.alert("Session expired. Sign in again from the home page to keep saving.");
      window.location.href = "/";
    });

    window.addEventListener("focus", async () => {
      if (window.CatalogueImages) {
        try {
          await CatalogueImages.preload([
            "pc",
            "npc",
            "item",
            "monster",
            "location",
            "race",
            "class",
            "spell",
            "skill",
            "feature"
          ]);
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
      if (window.PartyRoster) PartyRoster.refresh();
      if (window.MapPanel?.refresh) MapPanel.refresh();
      /* Native prompt() for @link tags blurs the window; do not wipe an open editor */
      if (editingSectionId) return;
      if (activeView.type === "panel") {
        renderPanel(activeView.id);
      } else if (activeView.type === "play") {
        renderPlayScene(focusedSceneId);
      } else {
        renderScrollDocument();
        setupScrollSpy();
      }
    });
  }

  function navGroupCollapsedKey() {
    return `${campaignId}-nav-group-collapsed`;
  }

  function loadNavGroupCollapsed() {
    try {
      const raw = JSON.parse(localStorage.getItem(navGroupCollapsedKey()) || "{}");
      return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    } catch {
      return {};
    }
  }

  function setNavGroupCollapsed(groupId, collapsed) {
    const map = loadNavGroupCollapsed();
    if (collapsed) map[groupId] = true;
    else delete map[groupId];
    try {
      localStorage.setItem(navGroupCollapsedKey(), JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }

  /** Interleave root scenes with group blocks (first occurrence emits full group). */
  function buildNavItems(sections, groups, editMode) {
    const groupById = new Map((groups || []).map((g) => [g.id, g]));
    const members = new Map((groups || []).map((g) => [g.id, []]));
    (sections || []).forEach((s) => {
      if (s.groupId && members.has(s.groupId)) members.get(s.groupId).push(s);
    });

    const items = [];
    const emitted = new Set();
    (sections || []).forEach((s) => {
      if (!s.groupId || !groupById.has(s.groupId)) {
        items.push({ type: "scene", scene: s });
        return;
      }
      if (emitted.has(s.groupId)) return;
      emitted.add(s.groupId);
      items.push({
        type: "group",
        group: groupById.get(s.groupId),
        scenes: members.get(s.groupId) || []
      });
    });

    (groups || []).forEach((g) => {
      if (emitted.has(g.id)) return;
      if (!editMode && !(members.get(g.id) || []).length) return;
      emitted.add(g.id);
      items.push({ type: "group", group: g, scenes: members.get(g.id) || [] });
    });

    return items;
  }

  function createNavSceneItem(section, editMode) {
    const data = getSectionData(section);
    const li = document.createElement("li");
    li.className = "nav-scene-item";
    li.dataset.section = section.id;
    li.dataset.groupId = section.groupId || "";
    if (editMode) {
      li.draggable = true;
      li.classList.add("nav-scene-item--draggable");
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-btn nav-scene";
    btn.dataset.section = section.id;
    if (window.CampaignStateUI) {
      const navCls = CampaignStateUI.navStatusClass(section.id).trim();
      if (navCls) btn.className += ` ${navCls}`;
    }
    btn.textContent = data.title;
    btn.addEventListener("click", () => jumpToSection(section.id));
    li.appendChild(btn);
    return li;
  }

  function createNavGroupItem(group, childScenes, editMode, forceOpen) {
    const li = document.createElement("li");
    li.className = "nav-scene-group";
    li.dataset.groupId = group.id;
    if (editMode) li.classList.add("nav-scene-group--draggable");

    const details = document.createElement("details");
    details.className = "nav-scene-group__details";
    const collapsedMap = loadNavGroupCollapsed();
    const userCollapsed = collapsedMap[group.id] === true;
    if (forceOpen) {
      details.open = true;
      setNavGroupCollapsed(group.id, false);
    } else {
      details.open = !userCollapsed;
    }

    const summary = document.createElement("summary");
    summary.className = "nav-scene-group__summary";

    if (editMode) {
      const handle = document.createElement("span");
      handle.className = "nav-scene-group__drag";
      handle.draggable = true;
      handle.title = t.dragGroupHint || "Drag to reorder group";
      handle.setAttribute("aria-label", t.dragGroupHint || "Drag to reorder group");
      handle.setAttribute("role", "button");
      handle.tabIndex = 0;
      summary.appendChild(handle);
    }

    const titleSpan = document.createElement("span");
    titleSpan.className = "nav-scene-group__title";
    titleSpan.textContent = group.title;
    summary.appendChild(titleSpan);

    if (editMode) {
      const actions = document.createElement("span");
      actions.className = "nav-scene-group__actions";

      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "nav-scene-group__action";
      renameBtn.textContent = t.renameGroup || "Rename";
      renameBtn.title = t.renameGroup || "Rename group";
      renameBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        renameNavGroup(group.id, group.title);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "nav-scene-group__action nav-scene-group__action--danger";
      deleteBtn.textContent = t.deleteGroup || "Delete";
      deleteBtn.title = t.deleteGroupHint || "Remove group (scenes stay)";
      deleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteNavGroup(group.id, group.title);
      });

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);
      summary.appendChild(actions);
    }

    details.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "nav-scene-group__list nav-list";
    list.dataset.groupId = group.id;
    childScenes.forEach((scene) => {
      list.appendChild(createNavSceneItem(scene, editMode));
    });
    if (editMode && !childScenes.length) {
      const empty = document.createElement("li");
      empty.className = "nav-scene-group__empty";
      empty.textContent = t.emptyGroupHint || "Drag scenes here";
      list.appendChild(empty);
    }
    details.appendChild(list);

    details.addEventListener("toggle", () => {
      setNavGroupCollapsed(group.id, !details.open);
    });

    li.appendChild(details);
    return li;
  }

  function renameNavGroup(groupId, currentTitle) {
    const next = prompt(t.renameGroupPrompt || "Group name", currentTitle || "");
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    SectionEditor.renameGroup(campaignId, groupId, trimmed);
    refreshDocument(focusedSceneId);
  }

  function deleteNavGroup(groupId, title) {
    const message = (t.confirmDeleteGroup || 'Remove group "{title}"? Scenes stay in the list.').replace(
      "{title}",
      title || "group"
    );
    if (!confirm(message)) return;
    SectionEditor.deleteGroup(campaignId, groupId);
    refreshDocument(focusedSceneId);
  }

  function addNavGroup() {
    const title = prompt(t.newGroupPrompt || "Group name", t.newGroupDefaultTitle || "New group");
    if (title == null) return;
    const trimmed = title.trim() || t.newGroupDefaultTitle || "New group";
    const created = SectionEditor.addGroup(campaignId, { title: trimmed });
    if (!created) return;
    setNavGroupCollapsed(created.id, false);
    refreshDocument(focusedSceneId);
  }

  function buildNav() {
    sectionNav.innerHTML = "";
    const sections = getSections();
    const groups = SectionEditor.getGroups ? SectionEditor.getGroups(campaignId) : [];
    const editMode = SectionEditor.isEditMode();
    const activeId = focusedSceneId || null;
    const activeGroupId = activeId
      ? sections.find((s) => s.id === activeId)?.groupId || null
      : null;

    if (!sections.length && !groups.length) {
      const li = document.createElement("li");
      li.className = "nav-empty-hint";
      li.textContent = t.noScenesHint || "No scenes yet — add one below.";
      sectionNav.appendChild(li);
    }

    const items = buildNavItems(sections, groups, editMode);
    items.forEach((item) => {
      if (item.type === "scene") {
        sectionNav.appendChild(createNavSceneItem(item.scene, editMode));
      } else {
        const forceOpen = activeGroupId && item.group.id === activeGroupId;
        sectionNav.appendChild(createNavGroupItem(item.group, item.scenes, editMode, forceOpen));
      }
    });

    if (editMode) {
      bindNavDragReorder();

      const addGroupLi = document.createElement("li");
      addGroupLi.className = "nav-add-group";
      const addGroupBtn = document.createElement("button");
      addGroupBtn.type = "button";
      addGroupBtn.className = "nav-btn nav-add-group-btn";
      addGroupBtn.textContent = `+ ${t.addGroup || "New group"}`;
      addGroupBtn.addEventListener("click", () => addNavGroup());
      addGroupLi.appendChild(addGroupBtn);
      sectionNav.appendChild(addGroupLi);
    }

    const addLi = document.createElement("li");
    addLi.className = "nav-add-scene";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "nav-btn nav-add-scene-btn";
    addBtn.textContent = `+ ${t.addScene || t.addPassage || "Add scene"}`;
    addBtn.title = t.addSceneHint || t.addScene || "Add a new scene";
    addBtn.addEventListener("click", () => addPassage(null));
    addLi.appendChild(addBtn);
    sectionNav.appendChild(addLi);
  }

  function clearNavDropTargets() {
    sectionNav
      .querySelectorAll(".is-drop-target, .is-drop-target-group")
      .forEach((el) => el.classList.remove("is-drop-target", "is-drop-target-group"));
  }

  function bindNavDragReorder() {
    if (!sectionNav || !SectionEditor.isEditMode()) return;
    let dragPayload = null;

    function parseDrag(e) {
      try {
        const raw = e.dataTransfer.getData("application/x-nav-drag") || e.dataTransfer.getData("text/plain");
        if (!raw) return dragPayload;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.kind) return parsed;
        return { kind: "scene", id: raw };
      } catch {
        if (dragPayload) return dragPayload;
        const plain = e.dataTransfer.getData("text/plain");
        return plain ? { kind: "scene", id: plain } : null;
      }
    }

    sectionNav.querySelectorAll(".nav-scene-item--draggable").forEach((li) => {
      li.addEventListener("dragstart", (e) => {
        dragPayload = { kind: "scene", id: li.dataset.section };
        li.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/x-nav-drag", JSON.stringify(dragPayload));
        e.dataTransfer.setData("text/plain", dragPayload.id);
        e.stopPropagation();
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("is-dragging");
        clearNavDropTargets();
        dragPayload = null;
      });
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        clearNavDropTargets();
        const drag = dragPayload || parseDrag(e);
        if (drag?.kind === "scene" && li.dataset.section !== drag.id) {
          li.classList.add("is-drop-target");
        }
      });
      li.addEventListener("dragleave", () => {
        li.classList.remove("is-drop-target");
      });
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearNavDropTargets();
        const drag = parseDrag(e);
        if (!drag || drag.kind !== "scene") return;
        const fromId = drag.id;
        const toId = li.dataset.section;
        if (!fromId || !toId || fromId === toId) return;
        const targetGroup = li.dataset.groupId || null;
        SectionEditor.moveScene(campaignId, fromId, {
          beforeId: toId,
          groupId: targetGroup || null
        });
        refreshDocument(focusedSceneId || fromId);
      });
    });

    sectionNav.querySelectorAll(".nav-scene-group").forEach((groupLi) => {
      const groupId = groupLi.dataset.groupId;
      const list = groupLi.querySelector(".nav-scene-group__list");
      const summary = groupLi.querySelector(".nav-scene-group__summary");
      const handle = groupLi.querySelector(".nav-scene-group__drag");

      if (handle) {
        handle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
        });
        handle.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        handle.addEventListener("dragstart", (e) => {
          e.stopPropagation();
          dragPayload = { kind: "group", id: groupId };
          groupLi.classList.add("is-dragging");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("application/x-nav-drag", JSON.stringify(dragPayload));
          e.dataTransfer.setData("text/plain", JSON.stringify(dragPayload));
        });
        handle.addEventListener("dragend", () => {
          groupLi.classList.remove("is-dragging");
          clearNavDropTargets();
          dragPayload = null;
        });
      }

      const acceptOntoGroup = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        clearNavDropTargets();
        const drag = dragPayload || parseDrag(e);
        if (drag?.kind === "scene") groupLi.classList.add("is-drop-target-group");
        else if (drag?.kind === "group" && drag.id !== groupId) groupLi.classList.add("is-drop-target-group");
      };

      [summary, list, groupLi].forEach((el) => {
        if (!el) return;
        el.addEventListener("dragover", acceptOntoGroup);
        el.addEventListener("dragleave", (e) => {
          if (!groupLi.contains(e.relatedTarget)) groupLi.classList.remove("is-drop-target-group");
        });
        el.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          clearNavDropTargets();
          const drag = parseDrag(e);
          if (!drag) return;

          if (drag.kind === "scene") {
            SectionEditor.moveScene(campaignId, drag.id, {
              beforeId: null,
              groupId
            });
            setNavGroupCollapsed(groupId, false);
            refreshDocument(focusedSceneId || drag.id);
            return;
          }

          if (drag.kind === "group" && drag.id !== groupId) {
            const ids = SectionEditor.getGroups(campaignId).map((g) => g.id);
            const fromIdx = ids.indexOf(drag.id);
            const toIdx = ids.indexOf(groupId);
            if (fromIdx < 0 || toIdx < 0) return;
            ids.splice(fromIdx, 1);
            ids.splice(toIdx, 0, drag.id);
            SectionEditor.reorderGroups(campaignId, ids);
            refreshDocument(focusedSceneId);
          }
        });
      });
    });

    /* Drop on root add-row / empty hint → ungroup scene, or append group to end */
    sectionNav.querySelectorAll(".nav-add-scene, .nav-add-group, .nav-empty-hint").forEach((li) => {
      li.addEventListener("dragover", (e) => {
        const drag = dragPayload;
        if (drag?.kind !== "scene" && drag?.kind !== "group") return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        clearNavDropTargets();
        li.classList.add("is-drop-target");
      });
      li.addEventListener("dragleave", () => li.classList.remove("is-drop-target"));
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        clearNavDropTargets();
        const drag = parseDrag(e);
        if (!drag) return;
        if (drag.kind === "scene") {
          SectionEditor.moveScene(campaignId, drag.id, { beforeId: null, groupId: null });
          refreshDocument(focusedSceneId || drag.id);
          return;
        }
        if (drag.kind === "group") {
          const ids = SectionEditor.getGroups(campaignId).map((g) => g.id).filter((id) => id !== drag.id);
          ids.push(drag.id);
          SectionEditor.reorderGroups(campaignId, ids);
          refreshDocument(focusedSceneId);
        }
      });
    });
  }

  function sectionActionsHtml(section) {
    if (!SectionEditor.isEditMode()) return "";
    return `
      <div class="section-actions">
        <button type="button" class="section-edit-btn" data-edit="${section.id}" title="${t.editSection}">✎ ${t.editSection}</button>
        <button type="button" class="section-link-btn" data-link-scene="${section.id}" title="${t.linkScene || "Link scene"}">→ ${t.linkScene || "Link scene"}</button>
        <button type="button" class="section-delete-btn" data-delete="${section.id}" title="${t.deleteSection}">${t.deleteSection}</button>
      </div>`;
  }

  function addPassageControlsHtml(afterId) {
    if (!SectionEditor.isEditMode()) return "";
    const afterAttr = afterId ? ` data-after="${afterId}"` : "";
    return `
      <div class="add-passage-row">
        <button type="button" class="add-passage-btn"${afterAttr}>
          + ${t.addPassage}
        </button>
      </div>`;
  }

  function renderScrollDocument(options = {}) {
    const draft = options.preserveDraft || null;
    let html = "";
    editingSectionId = null;
    const sections = getSections();
    const editMode = SectionEditor.isEditMode();

    if (!sections.length) {
      html = editMode
        ? `${addPassageControlsHtml(null)}<p class="empty-state">${escapeHtml(t.noScenesHint || "No scenes yet. Add a passage to begin.")}</p>`
        : `<p class="empty-state">${escapeHtml(t.noScenesHint || "No scenes yet.")}</p>`;
    } else {
      if (editMode) html += addPassageControlsHtml(null);
      sections.forEach((section) => {
        const data = getSectionData(section);
        html += `
          <section class="adventure-section${window.CampaignStateUI ? CampaignStateUI.sectionStatusClass(section.id) : ""}" id="section-${section.id}" data-section="${section.id}">
            <div class="section-header">
              <h1 class="section-title">${escapeHtml(data.title)}</h1>
              ${sectionActionsHtml(section)}
            </div>
            ${window.CampaignStateUI ? CampaignStateUI.sceneChromeHtml(section.id) : ""}
            <div class="section-body" data-body="${section.id}">
              ${parseContent(data.content, getEntities())}
            </div>
            ${window.SceneUI ? SceneUI.sceneExtrasHtml(section.id) : ""}
            <div class="section-editor hidden" data-editor="${section.id}"></div>
          </section>
          ${addPassageControlsHtml(section.id)}`;
      });
    }

    scrollDocument.innerHTML = html;
    bindDocumentEditControls();
    if (window.CampaignStateUI) CampaignStateUI.bindSceneChrome(scrollDocument);
    if (window.SceneUI) SceneUI.bind(scrollDocument);
    if (draft) restoreEditorDraft(draft);
  }

  function renderPlayScene(sceneId, options = {}) {
    if (!playView) return;
    const draft = options.preserveDraft || null;
    const sections = getSections();
    const id = sceneId || focusedSceneId || sections[0]?.id;
    const section = getSectionById(id);
    if (!section) {
      playView.innerHTML = SectionEditor.isEditMode()
        ? `${addPassageControlsHtml(null)}<p class="empty-state">${escapeHtml(t.noScenesHint || "No scenes yet. Add a passage to begin.")}</p>`
        : `<p class="empty-state">${escapeHtml(t.noScenesHint || "No scenes yet.")}</p>`;
      playView.classList.remove("hidden");
      scrollDocument.classList.add("hidden");
      panelView.classList.add("hidden");
      bindDocumentEditControls();
      return;
    }

    focusedSceneId = section.id;
    activeView = { type: "play", id: section.id };
    editingSectionId = null;

    const data = getSectionData(section);
    const idx = sections.findIndex((s) => s.id === section.id);
    const prevId = idx > 0 ? sections[idx - 1].id : null;
    const nextId = idx >= 0 && idx < sections.length - 1 ? sections[idx + 1].id : null;
    const navHtml = `
      <div class="play-scene-nav" role="navigation" aria-label="${escapeHtml(t.playSceneNav || "Scene")}">
        <button type="button" class="play-scene-nav__btn" data-play-prev ${prevId ? "" : "disabled"} data-jump-scene="${escapeHtml(
          prevId || ""
        )}">${escapeHtml(t.playPrevScene || "← Prev")}</button>
        <button type="button" class="play-scene-nav__btn" data-play-next ${nextId ? "" : "disabled"} data-jump-scene="${escapeHtml(
          nextId || ""
        )}">${escapeHtml(t.playNextScene || "Next →")}</button>
      </div>`;

    playView.innerHTML = `
      <section class="adventure-section play-scene${window.CampaignStateUI ? CampaignStateUI.sectionStatusClass(section.id) : ""}" id="section-${section.id}" data-section="${section.id}">
        <div class="section-header">
          <h1 class="section-title">${escapeHtml(data.title)}</h1>
          ${sectionActionsHtml(section)}
        </div>
        ${navHtml}
        ${window.CampaignStateUI ? CampaignStateUI.sceneChromeHtml(section.id) : ""}
        <div class="section-body" data-body="${section.id}">
          ${parseContent(data.content, getEntities())}
        </div>
        ${window.SceneUI ? SceneUI.sceneExtrasHtml(section.id) : ""}
        <div class="section-editor hidden" data-editor="${section.id}"></div>
      </section>`;

    playView.classList.remove("hidden");
    scrollDocument.classList.add("hidden");
    panelView.classList.add("hidden");
    if (scrollSpyObserver) scrollSpyObserver.disconnect();

    bindDocumentEditControls();
    if (window.CampaignStateUI) CampaignStateUI.bindSceneChrome(playView);
    if (window.SceneUI) SceneUI.bind(playView);
    playView.querySelectorAll("[data-jump-scene]").forEach((btn) => {
      if (btn.disabled) return;
      btn.addEventListener("click", () => {
        const target = btn.dataset.jumpScene;
        if (target) jumpToSection(target);
      });
    });
    updateNavActive();
    if (draft && draft.sectionId === section.id) restoreEditorDraft(draft);
  }

  function bindDocumentEditControls() {
    const roots = [playView, scrollDocument].filter(Boolean);
    roots.forEach((root) => {
      root.querySelectorAll(".section-edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => openSectionEditor(btn.dataset.edit));
      });

      root.querySelectorAll(".section-link-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (window.SceneUI?.openConnectionPicker) {
            SceneUI.openConnectionPicker(btn.dataset.linkScene);
          }
        });
      });

      root.querySelectorAll(".section-delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => deletePassage(btn.dataset.delete));
      });

      root.querySelectorAll(".add-passage-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          addPassage(btn.dataset.after || null);
        });
      });
    });
  }

  function ensureEditMode() {
    if (SectionEditor.isEditMode()) return;
    SectionEditor.setEditMode(true);
    syncEditModeUI();
  }

  function addPassage(afterId) {
    const title = prompt(t.newPassagePrompt, t.newPassageDefaultTitle);
    if (title == null) return;
    const trimmed = title.trim() || t.newPassageDefaultTitle;

    ensureEditMode();

    const created = SectionEditor.addSection(campaignId, {
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
    const message = (t.confirmDeleteScene || t.confirmDeleteCustom || 'Delete "{title}"?').replace(
      "{title}",
      data.title
    );

    if (!confirm(message)) return;

    SectionEditor.deleteSection(campaignId, sectionId);
    if (editingSectionId === sectionId) editingSectionId = null;
    if (focusedSceneId === sectionId) focusedSceneId = getSections()[0]?.id || null;
    refreshDocument(focusedSceneId);
  }

  function openSectionEditor(sectionId, draft) {
    if (editingSectionId && editingSectionId !== sectionId) {
      closeSectionEditor(editingSectionId, false);
    }

    const section = getSectionById(sectionId);
    if (!section) return;

    const data = getSectionData(section);
    const host = document.querySelector(`[data-editor="${sectionId}"]`);
    const body = document.querySelector(`[data-body="${sectionId}"]`);
    if (!host || !body) return;

    const titleValue = draft && draft.title != null ? draft.title : data.title;
    const contentValue =
      draft && draft.content != null ? draft.content : String(data.content || "").trim();

    editingSectionId = sectionId;
    body.classList.add("hidden");
    host.classList.remove("hidden");
    host.innerHTML = `
      <label class="editor-label">${t.passageTitleLabel || "Title"}</label>
      <input type="text" class="editor-title" value="${escapeHtml(titleValue)}">
      <label class="editor-label">${t.passageContentLabel || "Content"}</label>
      <div class="editor-toolbar" role="toolbar" aria-label="${escapeHtml(t.editorToolbar || "Formatting")}">
        <button type="button" class="editor-tool" data-wrap="read-aloud" title="${escapeHtml(t.wrapReadAloudHint || "Wrap selection as read-aloud")}">${escapeHtml(t.wrapReadAloud || "Read aloud")}</button>
        <button type="button" class="editor-tool" data-wrap="dm-note" title="${escapeHtml(t.wrapDmNoteHint || "Wrap selection as DM note")}">${escapeHtml(t.wrapDmNote || "DM note")}</button>
        <button type="button" class="editor-tool" data-wrap="collapse" title="${escapeHtml(t.wrapCollapseHint || "Wrap selection in a collapsible block")}">${escapeHtml(t.wrapCollapse || "Collapse")}</button>
        <button type="button" class="editor-tool" data-wrap="bold" title="${escapeHtml(t.wrapBoldHint || "Bold selection")}">${escapeHtml(t.wrapBold || "Bold")}</button>
        <span class="editor-toolbar__sep" aria-hidden="true"></span>
        <button type="button" class="editor-tool" data-link="npc" title="@npc:id|Name">NPC</button>
        <button type="button" class="editor-tool" data-link="monster" title="@monster:id|Name">Monster</button>
        <button type="button" class="editor-tool" data-link="location" title="@location:id|Name">Location</button>
        <button type="button" class="editor-tool" data-link="item" title="@item:id|Name">Item</button>
        <button type="button" class="editor-tool" data-link="skill" title="@skill:id|Name">Skill</button>
        <button type="button" class="editor-tool" data-link="feature" title="@feature:id|Name">Feature</button>
        <button type="button" class="editor-tool" data-link="class" title="@class:id|Name">Class</button>
        <button type="button" class="editor-tool" data-link="race" title="@race:id|Name">Race</button>
        <span class="editor-toolbar__sep" aria-hidden="true"></span>
        <button type="button" class="editor-tool" data-insert-youtube="${sectionId}">${escapeHtml(t.insertYoutube || "YouTube")}</button>
      </div>
      <textarea class="editor-content" rows="14">${escapeHtml(contentValue)}</textarea>
      <p class="format-hint">${t.formatHelp}</p>
      <div class="editor-actions">
        <button type="button" class="btn btn-primary" data-save="${sectionId}">${t.saveSection}</button>
        <button type="button" class="btn" data-cancel="${sectionId}">${t.cancelEdit}</button>
        <button type="button" class="btn btn-danger" data-delete-inline="${sectionId}">${t.deleteSection}</button>
      </div>`;

    host.querySelector(`[data-save="${sectionId}"]`).addEventListener("click", () => saveSectionEditor(sectionId));
    host.querySelector(`[data-cancel="${sectionId}"]`).addEventListener("click", () => closeSectionEditor(sectionId, false));
    host.querySelector(`[data-delete-inline="${sectionId}"]`).addEventListener("click", () => deletePassage(sectionId));
    bindEditorToolbar(host);

    host.querySelector(".editor-content")?.focus();
  }

  function getEditorTextarea(host) {
    return host.querySelector(".editor-content");
  }

  /** Keep textarea selection when clicking toolbar buttons */
  function bindEditorToolbar(host) {
    const toolbar = host.querySelector(".editor-toolbar");
    if (!toolbar) return;

    toolbar.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) e.preventDefault();
    });

    toolbar.querySelectorAll("[data-wrap]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.dataset.wrap;
        if (kind === "read-aloud") {
          wrapEditorSelection(host, "{{read-aloud}}\n", "\n{{/read-aloud}}", {
            placeholder: t.readAloudPlaceholder || "Read-aloud text…"
          });
        } else if (kind === "dm-note") {
          wrapEditorSelection(host, "{{dm-note}}\n", "\n{{/dm-note}}", {
            placeholder: t.dmNotePlaceholder || "DM note…"
          });
        } else if (kind === "collapse") {
          const titlePrompt = prompt(
            t.collapseTitlePrompt || "Title shown when collapsed:",
            t.collapseDefaultTitle || "Details"
          );
          if (titlePrompt == null) return;
          const title = titlePrompt.trim().replace(/\}/g, "") || t.collapseDefaultTitle || "Details";
          wrapEditorSelection(host, `{{collapse:${title}}}\n`, "\n{{/collapse}}", {
            placeholder: t.collapsePlaceholder || "Hidden details…"
          });
        } else if (kind === "bold") {
          wrapEditorSelection(host, "<b>", "</b>", { placeholder: t.boldPlaceholder || "bold" });
        }
      });
    });

    toolbar.querySelectorAll("[data-link]").forEach((btn) => {
      btn.addEventListener("click", () => insertEntityLinkSnippet(host, btn.dataset.link));
    });

    toolbar.querySelector("[data-insert-youtube]")?.addEventListener("click", () => insertYoutubeSnippet(host));
  }

  function replaceEditorRange(textarea, start, end, text, selectInner) {
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    textarea.value = before + text + after;
    textarea.focus();
    if (selectInner && selectInner.length) {
      const innerStart = start + selectInner.prefixLength;
      textarea.setSelectionRange(innerStart, innerStart + selectInner.length);
    } else {
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    }
  }

  function wrapEditorSelection(host, openTag, closeTag, opts = {}) {
    const textarea = getEditorTextarea(host);
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const selected = textarea.value.slice(start, end);
    const inner = selected || opts.placeholder || "";
    const text = `${openTag}${inner}${closeTag}`;
    replaceEditorRange(textarea, start, end, text, {
      prefixLength: openTag.length,
      length: inner.length
    });
  }

  function insertEntityLinkSnippet(host, type) {
    const textarea = getEditorTextarea(host);
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const selected = textarea.value.slice(start, end).trim();

    const typeLabel = t.typeLabels?.[type] || type;
    const id = prompt(
      (t.entityLinkIdPrompt || "Catalogue link id for {type}:").replace("{type}", typeLabel),
      ""
    );
    if (id == null || !String(id).trim()) return;

    let label = selected;
    if (!label) {
      const typed = prompt(t.entityLinkLabelPrompt || "Display name (optional):", "");
      if (typed == null) return;
      label = typed.trim();
    }

    const cleanId = String(id).trim();
    const snippet = label ? `@${type}:${cleanId}|${label}` : `@${type}:${cleanId}`;
    replaceEditorRange(textarea, start, end, snippet, null);
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
    const textarea = getEditorTextarea(host);
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const padBefore = before && !/\n$/.test(before) ? "\n" : "";
    const padAfter = after && !/^\n/.test(after) ? "\n" : "";
    const text = `${padBefore}${snippet}${padAfter}`;
    replaceEditorRange(textarea, start, end, text, null);
  }

  function closeSectionEditor(sectionId, saved) {
    const host = document.querySelector(`[data-editor="${sectionId}"]`);
    const body = document.querySelector(`[data-body="${sectionId}"]`);
    if (host) {
      host.classList.add("hidden");
      host.innerHTML = "";
    }
    if (body) body.classList.remove("hidden");
    if (editingSectionId === sectionId) editingSectionId = null;
    if (saved) refreshDocument(sectionId);
  }

  function saveSectionEditor(sectionId) {
    const host = document.querySelector(`[data-editor="${sectionId}"]`);
    if (!host) return;
    const title = host.querySelector(".editor-title").value.trim() || t.newPassageDefaultTitle;
    const content = host.querySelector(".editor-content").value;
    SectionEditor.saveSection(campaignId, sectionId, title, content);
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
    focusedSceneId = id;
    history.replaceState(null, "", `#${id}`);
    const mode = loadViewMode();
    if (mode === "document") {
      showDocumentView();
      const el = document.getElementById(`section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      renderPlayScene(id);
    }
    updateNavActive();
  }

  function syncViewModeButtons() {
    const mode = loadViewMode();
    viewModePlayBtn?.classList.toggle("is-active", mode === "play");
    viewModeDocumentBtn?.classList.toggle("is-active", mode === "document");
    viewModePlayBtn?.setAttribute("aria-pressed", mode === "play" ? "true" : "false");
    viewModeDocumentBtn?.setAttribute("aria-pressed", mode === "document" ? "true" : "false");
  }

  function bindViewModeControls() {
    viewModePlayBtn?.addEventListener("click", () => {
      saveViewMode("play");
      syncViewModeButtons();
      jumpToSection(focusedSceneId || location.hash.replace("#", "") || getSections()[0]?.id);
    });
    viewModeDocumentBtn?.addEventListener("click", () => {
      saveViewMode("document");
      syncViewModeButtons();
      jumpToSection(focusedSceneId || location.hash.replace("#", "") || getSections()[0]?.id);
    });
    syncViewModeButtons();
  }

  function showDocumentView() {
    activeView = { type: "document" };
    if (playView) playView.classList.add("hidden");
    scrollDocument.classList.remove("hidden");
    panelView.classList.add("hidden");
    renderScrollDocument();
    updateNavActive();
    setupScrollSpy();
  }

  function showScrollView() {
    /* Back-compat alias: return to the saved view mode */
    if (loadViewMode() === "document") showDocumentView();
    else renderPlayScene(focusedSceneId || location.hash.replace("#", "") || getSections()[0]?.id);
  }

  function showPanelView(view) {
    activeView = { type: "panel", id: view };
    if (playView) playView.classList.add("hidden");
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
        panelView.innerHTML = `<h1>${t.headings.locations}</h1><div id="campaign-locations-panel"></div>`;
        if (window.CampaignLocationsUI) {
          CampaignLocationsUI.mount(document.getElementById("campaign-locations-panel"), campaignId);
        } else {
          panelView.innerHTML += renderEntityGrid("location");
        }
        break;
      case "notes":
        panelView.innerHTML = renderNotesView();
        bindNotesEvents();
        break;
      case "history":
        panelView.innerHTML = window.CampaignStateUI
          ? CampaignStateUI.renderHistoryPanel()
          : `<h1>History</h1><p class="empty-state">Campaign state unavailable.</p>`;
        if (window.CampaignStateUI) CampaignStateUI.bindHistoryPanel(panelView);
        break;
      case "chronicle":
        panelView.innerHTML = window.ChronicleUI
          ? ChronicleUI.renderChroniclePanel()
          : `<h1>Chronicle</h1><p class="empty-state">Chronicle unavailable.</p>`;
        if (window.ChronicleUI) ChronicleUI.bindChroniclePanel(panelView);
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
    if (!id) return;
    const activeBtn = document.querySelector(`.nav-btn[data-section="${CSS.escape(id)}"]`);
    const details = activeBtn?.closest("details.nav-scene-group__details");
    if (details && !details.open) {
      details.open = true;
      const groupLi = details.closest(".nav-scene-group");
      if (groupLi?.dataset.groupId) setNavGroupCollapsed(groupLi.dataset.groupId, false);
    }
  }

  function updateNavActive() {
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

    if (activeView.type === "play" || activeView.type === "document") {
      const hash = focusedSceneId || location.hash.replace("#", "");
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

    document.getElementById("modal-close")?.addEventListener("click", () => entityModal.close());
    document.getElementById("search-close")?.addEventListener("click", () => searchModal?.close());
    entityModal.addEventListener("click", (e) => {
      if (e.target === entityModal) entityModal.close();
    });

    bindCatalogueSearch();

    const bindEntityEvents = (root) => EntityUI.bindEntityLinks(root);

    if (playView) bindEntityEvents(playView);
    bindEntityEvents(scrollDocument);
    bindEntityEvents(panelView);

    window.addEventListener("hashchange", () => {
      const id = location.hash.replace("#", "");
      if (id && (activeView.type === "play" || activeView.type === "document")) jumpToSection(id);
    });
  }

  function hideCatalogueSearch() {
    if (!catalogueSearchResults) return;
    catalogueSearchResults.classList.add("hidden");
    catalogueSearchResults.hidden = true;
    catalogueSearchResults.innerHTML = "";
    catalogueSearchHits = [];
    catalogueSearchActive = -1;
    searchInput?.setAttribute("aria-expanded", "false");
  }

  function rankCatalogueMatch(entity, q) {
    const name = (entity.name || "").toLowerCase();
    if (name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.includes(q)) return 2;
    return 3;
  }

  function findCatalogueMatches(query) {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    const entities = Object.values(getEntities());
    return entities
      .map((entity) => {
        const hay = [entity.name, entity.summary, entity.details, ...(entity.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return null;
        return { entity, rank: rankCatalogueMatch(entity, q) };
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.entity.name.localeCompare(b.entity.name))
      .slice(0, 12)
      .map((hit) => hit.entity);
  }

  function renderCatalogueSearch(query) {
    if (!catalogueSearchResults) return;
    const q = query.trim();
    if (!q) {
      hideCatalogueSearch();
      return;
    }

    catalogueSearchHits = findCatalogueMatches(q);
    catalogueSearchActive = catalogueSearchHits.length ? 0 : -1;

    if (!catalogueSearchHits.length) {
      catalogueSearchResults.innerHTML = `<li class="catalogue-search__empty" role="option">${escapeHtml(t.searchNoResults)} “${escapeHtml(q)}”</li>`;
    } else {
      catalogueSearchResults.innerHTML = catalogueSearchHits
        .map((entity, i) => {
          const type = t.typeLabels?.[entity.type] || entity.type;
          const active = i === catalogueSearchActive ? " is-active" : "";
          return `
            <li class="catalogue-search__item${active}" role="option" data-idx="${i}" data-id="${escapeHtml(entity.id)}" aria-selected="${i === catalogueSearchActive ? "true" : "false"}">
              <span class="catalogue-search__type">${escapeHtml(type)}</span>
              <span class="catalogue-search__name">${escapeHtml(entity.name)}</span>
              <span class="catalogue-search__meta">${escapeHtml(entity.summary || "")}</span>
            </li>`;
        })
        .join("");
    }

    catalogueSearchResults.classList.remove("hidden");
    catalogueSearchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");

    catalogueSearchResults.querySelectorAll(".catalogue-search__item[data-id]").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        openCatalogueSearchResult(Number(el.dataset.idx));
      });
    });
  }

  function highlightCatalogueSearchActive() {
    if (!catalogueSearchResults) return;
    catalogueSearchResults.querySelectorAll(".catalogue-search__item").forEach((el, i) => {
      const on = i === catalogueSearchActive;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      if (on) el.scrollIntoView({ block: "nearest" });
    });
  }

  function openCatalogueSearchResult(idx) {
    const entity = catalogueSearchHits[idx];
    if (!entity) return;
    hideCatalogueSearch();
    searchInput.value = "";
    EntityUI.openModal(entity.id);
  }

  function bindCatalogueSearch() {
    if (!searchInput || !catalogueSearchResults) return;
    if (t.searchCataloguesPlaceholder) searchInput.placeholder = t.searchCataloguesPlaceholder;

    searchInput.addEventListener("input", () => {
      clearTimeout(catalogueSearchTimer);
      catalogueSearchTimer = setTimeout(() => renderCatalogueSearch(searchInput.value), 120);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideCatalogueSearch();
        searchInput.blur();
        return;
      }
      if (e.key === "ArrowDown") {
        if (!catalogueSearchHits.length) renderCatalogueSearch(searchInput.value);
        if (!catalogueSearchHits.length) return;
        e.preventDefault();
        catalogueSearchActive = (catalogueSearchActive + 1) % catalogueSearchHits.length;
        highlightCatalogueSearchActive();
        return;
      }
      if (e.key === "ArrowUp") {
        if (!catalogueSearchHits.length) return;
        e.preventDefault();
        catalogueSearchActive =
          (catalogueSearchActive - 1 + catalogueSearchHits.length) % catalogueSearchHits.length;
        highlightCatalogueSearchActive();
        return;
      }
      if (e.key === "Enter") {
        if (catalogueSearchActive >= 0 && catalogueSearchHits[catalogueSearchActive]) {
          e.preventDefault();
          openCatalogueSearchResult(catalogueSearchActive);
        }
      }
    });

    searchInput.addEventListener("blur", () => {
      setTimeout(() => hideCatalogueSearch(), 120);
    });

    document.addEventListener("click", (e) => {
      if (!catalogueSearch?.contains(e.target)) hideCatalogueSearch();
    });
  }

  /** Hash wins; otherwise restore saved current scene after first paint */
  function restoreInitialScene() {
    const initialHash = location.hash.replace("#", "");
    requestAnimationFrame(() => {
      if (initialHash) {
        jumpToSection(initialHash);
        return;
      }
      const current = window.CampaignState?.getCurrentSceneId?.();
      if (current && getSectionById(current)) {
        jumpToSection(current);
        return;
      }
      const first = getSections()[0]?.id;
      if (first) jumpToSection(first);
    });
  }

  function renderNotesView() {
    const saved = window.CampaignPrefs?.get(campaignId)?.notes || "";
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
        if (window.CampaignPrefs) CampaignPrefs.patch(campaignId, { notes: editor.value });
        status.textContent = t.savedLocally;
      }, 400);
    });

    sessionInput.addEventListener("change", () => {
      const n = Math.max(1, parseInt(sessionInput.value, 10) || 1);
      if (window.CampaignPrefs) CampaignPrefs.patch(campaignId, { session: String(n) });
      sessionInput.value = n;
      loadSessionBadge();
    });
  }

  function getSessionNumber() {
    return window.CampaignPrefs?.get(campaignId)?.session || "1";
  }

  function loadSessionBadge() {
    sessionBadge.textContent = `${t.session} ${getSessionNumber()}`;
  }

  function getChecklistState() {
    const state = window.CampaignPrefs?.get(campaignId)?.checklist;
    return state && typeof state === "object" ? state : {};
  }

  function saveChecklistState(state) {
    if (window.CampaignPrefs) CampaignPrefs.patch(campaignId, { checklist: state });
  }

  function renderChecklistView() {
    const state = getChecklistState();
    const list = ADVENTURE.checklist || [];
    const groups = list
      .map(
        (g) => `
        <div class="checklist-group">
          <h3>${escapeHtml(g.group)}</h3>
          ${(g.items || [])
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

    if (!list.length) {
      return `<h1>${t.headings.checklist}</h1><p>${t.checklistIntro || ""}</p><p class="empty-state">No progress checklist for this campaign yet.</p>`;
    }
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
