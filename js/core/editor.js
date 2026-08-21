/**
 * Free-form campaign scenes — ordered list in section-structure (file-backed).
 * Booklet ADVENTURE.sections is reference-only; not merged at runtime after migrate.
 * Optional one-level nav groups: groups[] + scene.groupId (sidebar chrome only).
 */
window.SectionEditor = (function () {
  "use strict";

  const MODE_KEY = "dm-edit-mode";

  const editsMem = new Map();
  const structureMem = new Map();

  function useApi() {
    return window.LocalApiClient && LocalApiClient.isAvailable();
  }

  function editsKey(campaignId) {
    return `${campaignId}-section-edits`;
  }

  function structureKey(campaignId) {
    return `${campaignId}-section-structure`;
  }

  function emptyStructure() {
    return { groups: [], scenes: [] };
  }

  function normalizeGroup(raw) {
    if (!raw || !raw.id) return null;
    const title = String(raw.title || "Untitled group").trim() || "Untitled group";
    return { id: String(raw.id), title };
  }

  function normalizeScene(raw, knownGroupIds) {
    if (!raw || !raw.id) return null;
    let groupId =
      raw.groupId != null && String(raw.groupId).trim() !== "" ? String(raw.groupId).trim() : null;
    if (knownGroupIds && groupId && !knownGroupIds.has(groupId)) groupId = null;
    const scene = {
      id: String(raw.id),
      title: String(raw.title || "Untitled"),
      content: raw.content != null ? String(raw.content) : ""
    };
    if (groupId) scene.groupId = groupId;
    return scene;
  }

  function normalizeStructure(raw) {
    if (Array.isArray(raw?.scenes)) {
      const groups = Array.isArray(raw.groups)
        ? raw.groups.map(normalizeGroup).filter(Boolean)
        : [];
      const known = new Set(groups.map((g) => g.id));
      return {
        groups,
        scenes: raw.scenes.map((s) => normalizeScene(s, known)).filter(Boolean)
      };
    }
    /* Legacy shape kept only long enough for migrateLegacy */
    return {
      scenes: null,
      groups: [],
      deleted: Array.isArray(raw?.deleted) ? raw.deleted.filter(Boolean) : [],
      custom: Array.isArray(raw?.custom) ? raw.custom.filter((s) => s && s.id) : []
    };
  }

  function loadEdits(campaignId) {
    if (editsMem.has(campaignId)) return editsMem.get(campaignId);
    try {
      const data = JSON.parse(localStorage.getItem(editsKey(campaignId)) || "{}");
      editsMem.set(campaignId, data && typeof data === "object" ? data : {});
      return editsMem.get(campaignId);
    } catch {
      editsMem.set(campaignId, {});
      return {};
    }
  }

  function saveEdits(campaignId, edits) {
    editsMem.set(campaignId, edits);
    if (useApi()) {
      LocalApiClient.putCampaignDocument(campaignId, "section-edits", edits).catch((err) => {
        console.warn("SectionEditor edits save failed:", err);
      });
      return;
    }
    try {
      localStorage.setItem(editsKey(campaignId), JSON.stringify(edits));
    } catch {
      /* file:// / quota */
    }
  }

  function loadStructure(campaignId) {
    if (structureMem.has(campaignId)) return structureMem.get(campaignId);
    try {
      const raw = JSON.parse(localStorage.getItem(structureKey(campaignId)) || "{}");
      const structure = normalizeStructure(raw);
      structureMem.set(campaignId, structure);
      return structure;
    } catch {
      const structure = emptyStructure();
      structureMem.set(campaignId, structure);
      return structure;
    }
  }

  function saveStructure(campaignId, structure) {
    const groups = (structure.groups || []).map(normalizeGroup).filter(Boolean);
    const known = new Set(groups.map((g) => g.id));
    const scenes = (structure.scenes || []).map((s) => normalizeScene(s, known)).filter(Boolean);
    const payload = { groups, scenes };
    structureMem.set(campaignId, payload);
    if (useApi()) {
      LocalApiClient.putCampaignDocument(campaignId, "section-structure", payload).catch((err) => {
        console.warn("SectionEditor structure save failed:", err);
      });
      return;
    }
    try {
      localStorage.setItem(structureKey(campaignId), JSON.stringify(payload));
    } catch {
      /* file:// / quota */
    }
  }

  /** One-shot: booklet − deleted + custom + edits → owned scenes[] */
  function migrateLegacy(campaignId, baseSections) {
    const structure = loadStructure(campaignId);
    if (Array.isArray(structure.scenes)) return false;

    const edits = loadEdits(campaignId);
    const deleted = new Set(structure.deleted || []);
    const result = (baseSections || [])
      .filter((s) => s?.id && !deleted.has(s.id))
      .map((s) => ({
        ...normalizeScene({
          id: s.id,
          title: edits[s.id]?.title ?? s.title,
          content: edits[s.id]?.content ?? s.content
        }),
        chapter: s.chapter || null
      }));

    const customs = [...(structure.custom || [])]
      .filter((s) => s?.id && !deleted.has(s.id))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    for (const custom of customs) {
      const override = edits[custom.id];
      const entry = {
        ...normalizeScene({
          id: custom.id,
          title: override?.title ?? custom.title,
          content: override?.content ?? custom.content
        }),
        chapter: custom.chapter || null
      };
      if (!entry?.id) continue;

      let inserted = false;
      if (custom.afterId) {
        const idx = result.findIndex((s) => s.id === custom.afterId);
        if (idx !== -1) {
          result.splice(idx + 1, 0, entry);
          inserted = true;
        }
      }
      if (!inserted && custom.chapter) {
        let lastInChapter = -1;
        for (let i = 0; i < result.length; i++) {
          if (result[i].chapter === custom.chapter) lastInChapter = i;
        }
        if (lastInChapter !== -1) {
          result.splice(lastInChapter + 1, 0, entry);
          inserted = true;
        }
      }
      if (!inserted) result.push(entry);
    }

    saveStructure(campaignId, {
      groups: [],
      scenes: result.map((s) => normalizeScene(s)).filter(Boolean)
    });
    saveEdits(campaignId, {});
    return true;
  }

  function ensureScenes(campaignId, baseSections) {
    const structure = loadStructure(campaignId);
    if (!Array.isArray(structure.scenes)) {
      migrateLegacy(campaignId, baseSections || []);
    }
    return loadStructure(campaignId);
  }

  async function bootstrap(campaignId, baseSections) {
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (!useApi()) {
      loadEdits(campaignId);
      loadStructure(campaignId);
      ensureScenes(campaignId, baseSections || []);
      return;
    }
    try {
      const edits = await LocalApiClient.getCampaignDocument(campaignId, "section-edits");
      editsMem.set(campaignId, edits && typeof edits === "object" && !Array.isArray(edits) ? edits : {});
    } catch {
      editsMem.set(campaignId, {});
    }
    try {
      const raw = await LocalApiClient.getCampaignDocument(campaignId, "section-structure");
      structureMem.set(
        campaignId,
        normalizeStructure(raw && typeof raw === "object" ? raw : {})
      );
    } catch {
      /* Treat as missing doc so migrate can seed from booklet once */
      structureMem.set(campaignId, { scenes: null, groups: [], deleted: [], custom: [] });
    }
    ensureScenes(campaignId, baseSections || []);
  }

  function slugify(title) {
    const base = String(title || "passage")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    return base || "passage";
  }

  function generateId(title) {
    return `scene-${slugify(title)}-${Date.now().toString(36)}`;
  }

  function generateGroupId(title) {
    return `grp-${slugify(title)}-${Date.now().toString(36)}`;
  }

  function getSections(campaignId) {
    const structure = ensureScenes(campaignId, []);
    return (structure.scenes || []).map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      groupId: s.groupId || null
    }));
  }

  function getGroups(campaignId) {
    const structure = ensureScenes(campaignId, []);
    return (structure.groups || []).map((g) => ({ id: g.id, title: g.title }));
  }

  function getSection(campaignId, sectionId, defaults) {
    const scene = getSections(campaignId).find((s) => s.id === sectionId);
    if (scene) {
      return {
        title: scene.title,
        content: scene.content,
        groupId: scene.groupId || null,
        isEdited: false,
        isCustom: false
      };
    }
    return {
      title: defaults?.title || "Untitled",
      content: defaults?.content || "",
      groupId: null,
      isEdited: false,
      isCustom: false
    };
  }

  function saveSection(campaignId, sectionId, title, content) {
    const structure = ensureScenes(campaignId, []);
    const idx = structure.scenes.findIndex((s) => s.id === sectionId);
    if (idx === -1) return false;
    const prev = structure.scenes[idx];
    structure.scenes[idx] = normalizeScene({
      id: sectionId,
      title: (title || "").trim() || "Untitled",
      content: content != null ? content : "",
      groupId: prev.groupId || null
    });
    saveStructure(campaignId, structure);
    return true;
  }

  function addSection(campaignId, options) {
    const title = (options.title || "New passage").trim() || "New passage";
    const content =
      options.content != null
        ? options.content
        : `<p>Write your notes here.</p>\n{{dm-note}}\nDM notes go here.\n{{/dm-note}}`;
    const structure = ensureScenes(campaignId, []);
    const known = new Set((structure.groups || []).map((g) => g.id));
    let groupId =
      options.groupId != null && String(options.groupId).trim() !== ""
        ? String(options.groupId).trim()
        : null;

    const afterId = options.afterId || null;
    if (!groupId && afterId) {
      const neighbor = structure.scenes.find((s) => s.id === afterId);
      if (neighbor?.groupId) groupId = neighbor.groupId;
    }
    if (groupId && !known.has(groupId)) groupId = null;

    const section = normalizeScene(
      {
        id: options.id || generateId(title),
        title,
        content,
        groupId
      },
      known
    );

    if (afterId) {
      const idx = structure.scenes.findIndex((s) => s.id === afterId);
      if (idx !== -1) {
        structure.scenes.splice(idx + 1, 0, section);
        saveStructure(campaignId, structure);
        return section;
      }
    }

    structure.scenes.push(section);
    saveStructure(campaignId, structure);
    return section;
  }

  function deleteSection(campaignId, sectionId) {
    const structure = ensureScenes(campaignId, []);
    const next = structure.scenes.filter((s) => s.id !== sectionId);
    if (next.length === structure.scenes.length) return false;
    structure.scenes = next;
    saveStructure(campaignId, structure);
    return true;
  }

  function reorderScenes(campaignId, orderedIds) {
    const structure = ensureScenes(campaignId, []);
    const byId = new Map(structure.scenes.map((s) => [s.id, s]));
    const next = [];
    const seen = new Set();
    (orderedIds || []).forEach((id) => {
      if (!byId.has(id) || seen.has(id)) return;
      next.push(byId.get(id));
      seen.add(id);
    });
    structure.scenes.forEach((s) => {
      if (!seen.has(s.id)) next.push(s);
    });
    structure.scenes = next;
    saveStructure(campaignId, structure);
    return getSections(campaignId);
  }

  function setSceneGroup(campaignId, sceneId, groupId) {
    const structure = ensureScenes(campaignId, []);
    const idx = structure.scenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) return false;
    const known = new Set((structure.groups || []).map((g) => g.id));
    let nextGroup =
      groupId != null && String(groupId).trim() !== "" ? String(groupId).trim() : null;
    if (nextGroup && !known.has(nextGroup)) return false;
    const prev = structure.scenes[idx];
    structure.scenes[idx] = normalizeScene(
      {
        id: prev.id,
        title: prev.title,
        content: prev.content,
        groupId: nextGroup
      },
      known
    );
    saveStructure(campaignId, structure);
    return true;
  }

  /**
   * Move a scene in the ordered list and optionally assign groupId.
   * beforeId: place immediately before that scene (null = append to end / group end).
   */
  function moveScene(campaignId, sceneId, options = {}) {
    const structure = ensureScenes(campaignId, []);
    const fromIdx = structure.scenes.findIndex((s) => s.id === sceneId);
    if (fromIdx < 0) return false;

    const known = new Set((structure.groups || []).map((g) => g.id));
    let groupId =
      options.groupId === undefined
        ? structure.scenes[fromIdx].groupId || null
        : options.groupId != null && String(options.groupId).trim() !== ""
          ? String(options.groupId).trim()
          : null;
    if (groupId && !known.has(groupId)) groupId = null;

    const [scene] = structure.scenes.splice(fromIdx, 1);
    const updated = normalizeScene(
      { id: scene.id, title: scene.title, content: scene.content, groupId },
      known
    );

    const beforeId = options.beforeId || null;
    let insertAt = structure.scenes.length;
    if (beforeId) {
      const bi = structure.scenes.findIndex((s) => s.id === beforeId);
      if (bi !== -1) insertAt = bi;
    } else if (groupId) {
      let last = -1;
      for (let i = 0; i < structure.scenes.length; i++) {
        if (structure.scenes[i].groupId === groupId) last = i;
      }
      if (last !== -1) insertAt = last + 1;
    }

    structure.scenes.splice(insertAt, 0, updated);
    saveStructure(campaignId, structure);
    return true;
  }

  function addGroup(campaignId, options = {}) {
    const structure = ensureScenes(campaignId, []);
    if (!structure.groups) structure.groups = [];
    const title = String(options.title || "New group").trim() || "New group";
    const group = normalizeGroup({
      id: options.id || generateGroupId(title),
      title
    });
    if (!group) return null;
    if (structure.groups.some((g) => g.id === group.id)) return null;
    structure.groups.push(group);
    saveStructure(campaignId, structure);
    return group;
  }

  function renameGroup(campaignId, groupId, title) {
    const structure = ensureScenes(campaignId, []);
    const idx = (structure.groups || []).findIndex((g) => g.id === groupId);
    if (idx === -1) return false;
    structure.groups[idx] = normalizeGroup({
      id: groupId,
      title: String(title || "").trim() || structure.groups[idx].title
    });
    saveStructure(campaignId, structure);
    return true;
  }

  function deleteGroup(campaignId, groupId) {
    const structure = ensureScenes(campaignId, []);
    const before = (structure.groups || []).length;
    structure.groups = (structure.groups || []).filter((g) => g.id !== groupId);
    if (structure.groups.length === before) return false;
    structure.scenes = (structure.scenes || []).map((s) => {
      if (s.groupId !== groupId) return s;
      return normalizeScene({ id: s.id, title: s.title, content: s.content, groupId: null });
    });
    saveStructure(campaignId, structure);
    return true;
  }

  function reorderGroups(campaignId, orderedGroupIds) {
    const structure = ensureScenes(campaignId, []);
    const byId = new Map((structure.groups || []).map((g) => [g.id, g]));
    const nextGroups = [];
    const seen = new Set();
    (orderedGroupIds || []).forEach((id) => {
      if (!byId.has(id) || seen.has(id)) return;
      nextGroups.push(byId.get(id));
      seen.add(id);
    });
    (structure.groups || []).forEach((g) => {
      if (!seen.has(g.id)) nextGroups.push(g);
    });

    const known = new Set(nextGroups.map((g) => g.id));
    const members = new Map(nextGroups.map((g) => [g.id, []]));
    const root = [];
    const blocks = [];
    const emitted = new Set();

    (structure.scenes || []).forEach((s) => {
      const gid = s.groupId && known.has(s.groupId) ? s.groupId : null;
      if (!gid) {
        root.push(s);
        blocks.push({ type: "scene", scene: s });
        return;
      }
      members.get(gid).push(s);
      if (!emitted.has(gid)) {
        emitted.add(gid);
        blocks.push({ type: "group", id: gid });
      }
    });

    const groupQueue = nextGroups.map((g) => g.id).filter((id) => emitted.has(id));
    let qi = 0;
    const remapped = blocks.map((b) => {
      if (b.type === "scene") return b;
      return { type: "group", id: groupQueue[qi++] };
    });

    const nextScenes = [];
    remapped.forEach((b) => {
      if (b.type === "scene") nextScenes.push(b.scene);
      else (members.get(b.id) || []).forEach((s) => nextScenes.push(s));
    });

    structure.groups = nextGroups;
    structure.scenes = nextScenes;
    saveStructure(campaignId, structure);
    return getGroups(campaignId);
  }

  function isEditMode() {
    return localStorage.getItem(MODE_KEY) === "1";
  }

  function setEditMode(on) {
    localStorage.setItem(MODE_KEY, on ? "1" : "0");
  }

  function exportEdits(campaignId) {
    return JSON.stringify(
      {
        edits: loadEdits(campaignId),
        structure: loadStructure(campaignId)
      },
      null,
      2
    );
  }

  return {
    getSection,
    saveSection,
    getSections,
    getGroups,
    addSection,
    deleteSection,
    reorderScenes,
    moveScene,
    setSceneGroup,
    addGroup,
    renameGroup,
    deleteGroup,
    reorderGroups,
    isEditMode,
    setEditMode,
    exportEdits,
    loadEdits,
    loadStructure,
    generateId,
    generateGroupId,
    bootstrap,
    migrateLegacy,
    ensureScenes
  };
})();
