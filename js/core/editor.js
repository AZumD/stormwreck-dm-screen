/**
 * Free-form campaign scenes — ordered list in section-structure (file-backed).
 * Booklet ADVENTURE.sections is reference-only; not merged at runtime after migrate.
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
    return { scenes: [] };
  }

  function normalizeScene(raw) {
    if (!raw || !raw.id) return null;
    return {
      id: String(raw.id),
      title: String(raw.title || "Untitled"),
      content: raw.content != null ? String(raw.content) : ""
    };
  }

  function normalizeStructure(raw) {
    if (Array.isArray(raw?.scenes)) {
      return {
        scenes: raw.scenes.map(normalizeScene).filter(Boolean)
      };
    }
    /* Legacy shape kept only long enough for migrateLegacy */
    return {
      scenes: null,
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
    const payload = {
      scenes: (structure.scenes || []).map(normalizeScene).filter(Boolean)
    };
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
      structureMem.set(campaignId, { scenes: null, deleted: [], custom: [] });
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

  function getSections(campaignId) {
    const structure = ensureScenes(campaignId, []);
    return (structure.scenes || []).map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content
    }));
  }

  function getSection(campaignId, sectionId, defaults) {
    const scene = getSections(campaignId).find((s) => s.id === sectionId);
    if (scene) {
      return {
        title: scene.title,
        content: scene.content,
        isEdited: false,
        isCustom: false
      };
    }
    return {
      title: defaults?.title || "Untitled",
      content: defaults?.content || "",
      isEdited: false,
      isCustom: false
    };
  }

  function saveSection(campaignId, sectionId, title, content) {
    const structure = ensureScenes(campaignId, []);
    const idx = structure.scenes.findIndex((s) => s.id === sectionId);
    if (idx === -1) return false;
    structure.scenes[idx] = normalizeScene({
      id: sectionId,
      title: (title || "").trim() || "Untitled",
      content: content != null ? content : ""
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
    const section = normalizeScene({
      id: options.id || generateId(title),
      title,
      content
    });

    const afterId = options.afterId || null;
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
    addSection,
    deleteSection,
    reorderScenes,
    isEditMode,
    setEditMode,
    exportEdits,
    loadEdits,
    loadStructure,
    generateId,
    bootstrap,
    migrateLegacy,
    ensureScenes
  };
})();
