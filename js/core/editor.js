/** Section editing — localStorage overrides, custom passages, soft-deletes */
window.SectionEditor = (function () {
  "use strict";

  const MODE_KEY = "dm-edit-mode";

  function editsKey(campaignId) {
    return `${campaignId}-section-edits`;
  }

  function structureKey(campaignId) {
    return `${campaignId}-section-structure`;
  }

  function loadEdits(campaignId) {
    try {
      return JSON.parse(localStorage.getItem(editsKey(campaignId)) || "{}");
    } catch {
      return {};
    }
  }

  function saveEdits(campaignId, edits) {
    try {
      localStorage.setItem(editsKey(campaignId), JSON.stringify(edits));
    } catch {
      /* file:// / quota */
    }
  }

  function loadStructure(campaignId) {
    try {
      const raw = JSON.parse(localStorage.getItem(structureKey(campaignId)) || "{}");
      return {
        deleted: Array.isArray(raw.deleted) ? raw.deleted.filter(Boolean) : [],
        custom: Array.isArray(raw.custom) ? raw.custom.filter((s) => s && s.id) : []
      };
    } catch {
      return { deleted: [], custom: [] };
    }
  }

  function saveStructure(campaignId, structure) {
    try {
      localStorage.setItem(
        structureKey(campaignId),
        JSON.stringify({
          deleted: structure.deleted || [],
          custom: structure.custom || []
        })
      );
    } catch {
      /* file:// / quota */
    }
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
    return `custom-${slugify(title)}-${Date.now().toString(36)}`;
  }

  function findCustom(campaignId, sectionId) {
    return loadStructure(campaignId).custom.find((s) => s.id === sectionId) || null;
  }

  function isCustomSection(campaignId, sectionId) {
    return !!findCustom(campaignId, sectionId);
  }

  function isBuiltInSection(baseSections, sectionId) {
    return (baseSections || []).some((s) => s.id === sectionId);
  }

  function getSection(campaignId, sectionId, defaults) {
    const custom = findCustom(campaignId, sectionId);
    const edits = loadEdits(campaignId);
    const override = edits[sectionId];

    if (custom) {
      return {
        title: override?.title ?? custom.title,
        content: override?.content ?? custom.content,
        isEdited: !!override,
        isCustom: true,
        chapter: custom.chapter
      };
    }

    return {
      title: override?.title ?? defaults.title,
      content: override?.content ?? defaults.content,
      isEdited: !!override,
      isCustom: false,
      chapter: defaults.chapter
    };
  }

  function saveSection(campaignId, sectionId, title, content) {
    const structure = loadStructure(campaignId);
    const customIdx = structure.custom.findIndex((s) => s.id === sectionId);

    if (customIdx !== -1) {
      structure.custom[customIdx] = {
        ...structure.custom[customIdx],
        title,
        content,
        updatedAt: Date.now()
      };
      saveStructure(campaignId, structure);

      const edits = loadEdits(campaignId);
      if (edits[sectionId]) {
        delete edits[sectionId];
        saveEdits(campaignId, edits);
      }
      return;
    }

    const edits = loadEdits(campaignId);
    edits[sectionId] = { title, content, updatedAt: Date.now() };
    saveEdits(campaignId, edits);
  }

  function resetSection(campaignId, sectionId) {
    const edits = loadEdits(campaignId);
    delete edits[sectionId];
    saveEdits(campaignId, edits);
  }

  /**
   * Merge booklet sections with soft-deletes + custom passages.
   * Custom sections insert after `afterId` when possible.
   */
  function getSections(campaignId, baseSections) {
    const structure = loadStructure(campaignId);
    const deleted = new Set(structure.deleted);
    const result = (baseSections || [])
      .filter((s) => !deleted.has(s.id))
      .map((s) => ({ ...s, isCustom: false }));

    const customs = [...structure.custom]
      .filter((s) => s?.id && !deleted.has(s.id))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    for (const custom of customs) {
      const entry = {
        id: custom.id,
        chapter: custom.chapter,
        title: custom.title,
        content: custom.content,
        isCustom: true
      };

      let inserted = false;
      if (custom.afterId) {
        const idx = result.findIndex((s) => s.id === custom.afterId);
        if (idx !== -1) {
          result.splice(idx + 1, 0, entry);
          inserted = true;
        }
      }

      if (!inserted) {
        let lastInChapter = -1;
        for (let i = 0; i < result.length; i++) {
          if (result[i].chapter === custom.chapter) lastInChapter = i;
        }
        if (lastInChapter !== -1) result.splice(lastInChapter + 1, 0, entry);
        else result.push(entry);
      }
    }

    return result;
  }

  function addSection(campaignId, options) {
    const title = (options.title || "New passage").trim() || "New passage";
    const content =
      options.content != null
        ? options.content
        : `<p>Write your notes here.</p>\n{{dm-note}}\nDM notes go here.\n{{/dm-note}}`;
    const chapter = options.chapter;
    if (!chapter) throw new Error("addSection requires chapter");

    const structure = loadStructure(campaignId);
    const section = {
      id: options.id || generateId(title),
      chapter,
      title,
      content,
      afterId: options.afterId || null,
      createdAt: Date.now()
    };

    structure.custom.push(section);
    saveStructure(campaignId, structure);
    return section;
  }

  function deleteSection(campaignId, sectionId, baseSections) {
    const structure = loadStructure(campaignId);
    const customIdx = structure.custom.findIndex((s) => s.id === sectionId);

    if (customIdx !== -1) {
      structure.custom.splice(customIdx, 1);
    } else if (isBuiltInSection(baseSections, sectionId)) {
      if (!structure.deleted.includes(sectionId)) structure.deleted.push(sectionId);
    } else {
      return false;
    }

    saveStructure(campaignId, structure);

    const edits = loadEdits(campaignId);
    if (edits[sectionId]) {
      delete edits[sectionId];
      saveEdits(campaignId, edits);
    }
    return true;
  }

  function restoreDeleted(campaignId, sectionId) {
    const structure = loadStructure(campaignId);
    structure.deleted = structure.deleted.filter((id) => id !== sectionId);
    saveStructure(campaignId, structure);
  }

  function restoreAllDeleted(campaignId) {
    const structure = loadStructure(campaignId);
    const count = structure.deleted.length;
    structure.deleted = [];
    saveStructure(campaignId, structure);
    return count;
  }

  function getDeletedIds(campaignId) {
    return loadStructure(campaignId).deleted.slice();
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
    resetSection,
    getSections,
    addSection,
    deleteSection,
    restoreDeleted,
    restoreAllDeleted,
    getDeletedIds,
    isCustomSection,
    isEditMode,
    setEditMode,
    exportEdits,
    loadEdits,
    loadStructure,
    generateId
  };
})();
