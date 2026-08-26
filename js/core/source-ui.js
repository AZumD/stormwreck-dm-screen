/**
 * Source Catalogue helpers — nested chapters / subchapters with scene-style markup.
 * Used by CatalogueApp (DM) and the player library detail view.
 */
window.SourceUi = (function () {
  "use strict";

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function newId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function normalizeSubchapter(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    return {
      id: String(s.id || newId("sub")).slice(0, 64),
      title: String(s.title || "Untitled section").slice(0, 200),
      content: String(s.content || "")
    };
  }

  function normalizeChapter(raw) {
    const c = raw && typeof raw === "object" ? raw : {};
    const subs = Array.isArray(c.subchapters) ? c.subchapters.map(normalizeSubchapter) : [];
    return {
      id: String(c.id || newId("ch")).slice(0, 64),
      title: String(c.title || "Untitled chapter").slice(0, 200),
      content: String(c.content || ""),
      subchapters: subs
    };
  }

  function normalizeChapters(raw) {
    if (typeof raw === "string" && raw.trim()) {
      return [normalizeChapter({ title: raw.trim(), content: "", subchapters: [] })];
    }
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeChapter);
  }

  /** Strip DM-only blocks before showing source text to players. */
  function playerSafeMarkup(raw) {
    return String(raw || "").replace(/\{\{dm-note\}\}[\s\S]*?\{\{\/dm-note\}\}/gi, "");
  }

  function formatProse(raw, { player = false, entities = null } = {}) {
    const text = player ? playerSafeMarkup(raw) : String(raw || "");
    if (!text.trim()) return "";
    const ents = entities || window.ENTITIES || window.EntityRegistry?.getAll?.() || {};
    if (window.ContentParser?.parseContent) {
      return ContentParser.parseContent(text, ents);
    }
    if (window.ContentParser?.markdownLite) {
      return ContentParser.markdownLite(text);
    }
    return `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
  }

  const MARKUP_HINT =
    "Markup: **bold**, @type:id|Label, {{read-aloud}}…{{/read-aloud}}, {{collapse:Title}}…{{/collapse}}, {{dm-note}}…{{/dm-note}}";

  function renderChaptersWiki(chapters, opts = {}) {
    const list = normalizeChapters(chapters);
    if (!list.length) {
      return `<p class="cat-wiki__empty">No chapters yet. Edit this entry to paste source text.</p>`;
    }
    const reader = Boolean(opts.player);
    const wrapClass = reader ? "source-chapters source-chapters--reader" : "source-chapters";
    return `<div class="${wrapClass}">${list
      .map((ch, i) => {
        const body = formatProse(ch.content, opts);
        const openAttr = !reader || i === 0 ? " open" : "";
        const subs = (ch.subchapters || [])
          .map((sub, si) => {
            const subBody = formatProse(sub.content, opts);
            const subOpen = !reader || (i === 0 && si === 0) ? " open" : "";
            return `<details class="source-subchapter"${subOpen}><summary class="source-subchapter__title">${escapeHtml(sub.title)}</summary><div class="source-prose">${subBody || `<p class="empty">Empty.</p>`}</div></details>`;
          })
          .join("");
        return `<details class="source-chapter"${openAttr}><summary class="source-chapter__title">${escapeHtml(ch.title)}</summary><div class="source-chapter__body">${body ? `<div class="source-prose">${body}</div>` : ""}${subs}</div></details>`;
      })
      .join("")}</div>`;
  }

  function renderChapterEditor(chapters) {
    const list = normalizeChapters(chapters);
    const rows = list
      .map(
        (ch, ci) => `
      <div class="source-edit-chapter" data-chapter-index="${ci}" data-chapter-id="${escapeHtml(ch.id)}">
        <div class="source-edit-chapter__head">
          <input type="text" class="source-edit-title" data-ch-title value="${escapeHtml(
            ch.title
          )}" placeholder="Chapter title" aria-label="Chapter title">
          <button type="button" class="cat-btn cat-btn--danger" data-ch-remove aria-label="Remove chapter">×</button>
        </div>
        <textarea class="source-edit-content" data-ch-content rows="12" placeholder="Paste chapter body text here (ebook / PDF copy)…">${escapeHtml(
          ch.content
        )}</textarea>
        <p class="cat-field-hint"><strong>Chapter body</strong> — ${escapeHtml(MARKUP_HINT)}</p>
        <div class="source-edit-subs" data-ch-subs>
          ${(ch.subchapters || [])
            .map(
              (sub, si) => `
            <div class="source-edit-sub" data-sub-index="${si}" data-sub-id="${escapeHtml(sub.id)}">
              <div class="source-edit-chapter__head">
                <input type="text" class="source-edit-title" data-sub-title value="${escapeHtml(
                  sub.title
                )}" placeholder="Subchapter title" aria-label="Subchapter title">
                <button type="button" class="cat-btn cat-btn--danger" data-sub-remove aria-label="Remove subchapter">×</button>
              </div>
              <textarea class="source-edit-content" data-sub-content rows="8" placeholder="Paste subchapter body text here…">${escapeHtml(
                sub.content
              )}</textarea>
              <p class="cat-field-hint"><strong>Subchapter body</strong></p>
            </div>`
            )
            .join("")}
        </div>
        <button type="button" class="cat-btn" data-sub-add>+ Subchapter</button>
      </div>`
      )
      .join("");

    return `
      <div class="source-edit" data-chapters-editor>
        <input type="hidden" data-chapters-value value="">
        <div class="source-edit-list">${rows}</div>
        <button type="button" class="cat-btn cat-btn--primary" data-ch-add>+ Chapter</button>
        <p class="cat-field-hint">${escapeHtml(MARKUP_HINT)}</p>
      </div>`;
  }

  function readChaptersFromEditor(root) {
    if (!root) return [];
    const chapters = [];
    root.querySelectorAll(".source-edit-chapter").forEach((chEl) => {
      const title = String(chEl.querySelector("[data-ch-title]")?.value || "").trim() || "Untitled chapter";
      const content = String(chEl.querySelector("[data-ch-content]")?.value || "");
      const subchapters = [];
      chEl.querySelectorAll(".source-edit-sub").forEach((subEl) => {
        subchapters.push(
          normalizeSubchapter({
            id: subEl.dataset.subId || undefined,
            title: String(subEl.querySelector("[data-sub-title]")?.value || "").trim() || "Untitled section",
            content: String(subEl.querySelector("[data-sub-content]")?.value || "")
          })
        );
      });
      chapters.push(
        normalizeChapter({
          id: chEl.dataset.chapterId || undefined,
          title,
          content,
          subchapters
        })
      );
    });
    return chapters;
  }

  function syncHidden(root) {
    const hidden = root?.querySelector("[data-chapters-value]");
    if (!hidden) return;
    hidden.value = JSON.stringify(readChaptersFromEditor(root));
  }

  function bindChapterEditor(host) {
    if (!host) return;
    const rebuild = () => {
      const next = readChaptersFromEditor(host);
      host.outerHTML = renderChapterEditor(next);
      const fresh = document.querySelector("[data-chapters-editor]");
      if (fresh) bindChapterEditor(fresh);
    };

    host.addEventListener("click", (e) => {
      if (e.target.closest("[data-ch-add]")) {
        e.preventDefault();
        const next = readChaptersFromEditor(host);
        next.push(normalizeChapter({ title: `Chapter ${next.length + 1}`, content: "", subchapters: [] }));
        host.outerHTML = renderChapterEditor(next);
        const fresh = document.querySelector("[data-chapters-editor]");
        if (fresh) bindChapterEditor(fresh);
        return;
      }
      if (e.target.closest("[data-ch-remove]")) {
        e.preventDefault();
        e.target.closest(".source-edit-chapter")?.remove();
        syncHidden(host);
        return;
      }
      if (e.target.closest("[data-sub-add]")) {
        e.preventDefault();
        const ch = e.target.closest(".source-edit-chapter");
        if (!ch) return;
        const next = readChaptersFromEditor(host);
        const idx = Number(ch.dataset.chapterIndex);
        if (!next[idx]) return;
        next[idx].subchapters.push(normalizeSubchapter({ title: "New section", content: "" }));
        host.outerHTML = renderChapterEditor(next);
        const fresh = document.querySelector("[data-chapters-editor]");
        if (fresh) bindChapterEditor(fresh);
        return;
      }
      if (e.target.closest("[data-sub-remove]")) {
        e.preventDefault();
        e.target.closest(".source-edit-sub")?.remove();
        syncHidden(host);
      }
    });

    host.addEventListener("input", () => syncHidden(host));
    syncHidden(host);
  }

  function isEmpty(chapters) {
    return !normalizeChapters(chapters).length;
  }

  return {
    normalizeChapters,
    normalizeChapter,
    normalizeSubchapter,
    renderChaptersWiki,
    renderChapterEditor,
    readChaptersFromEditor,
    bindChapterEditor,
    formatProse,
    playerSafeMarkup,
    isEmpty,
    MARKUP_HINT
  };
})();
