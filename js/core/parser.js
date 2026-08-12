/** Content parser — @ links, [[ links]], YouTube media, HTML, special blocks */
window.ContentParser = (function () {
  "use strict";

  const BRACKET_LINK_RE = /\[\[(npc|monster|location|item):([\w-]+)(?:\|([^\]]+))?\]\]/g;
  const AT_LINK_RE = /@(npc|monster|location|item):([\w-]+)(?:\|([^@]+?))?(?=[\s,.;:!?)<\]]|$)/g;
  const YOUTUBE_RE = /\{\{youtube:([^}|]+)(?:\|([^}]+))?\}\}/gi;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function extractYouTubeId(raw) {
    if (window.MediaBar?.extractYouTubeId) return MediaBar.extractYouTubeId(raw);
    const input = String(raw || "").trim();
    if (/^[\w-]{11}$/.test(input)) return input;
    const watch = input.match(/[?&]v=([\w-]{11})/);
    if (watch) return watch[1];
    const short = input.match(/youtu\.be\/([\w-]{11})/);
    if (short) return short[1];
    const embed = input.match(/embed\/([\w-]{11})/);
    if (embed) return embed[1];
    return "";
  }

  function mediaChip(raw, title) {
    const id = extractYouTubeId(raw);
    if (!id) {
      return `<span class="media-chip media-chip--invalid">Invalid YouTube link</span>`;
    }
    const label = (title || window.I18N?.mediaDefaultTitle || "Play music").trim();
    return `<button type="button" class="media-chip" data-media-play data-media-id="${escapeHtml(id)}" data-media-title="${escapeHtml(label)}"><span class="media-chip__icon" aria-hidden="true"></span><span class="media-chip__label">${escapeHtml(label)}</span></button>`;
  }

  function replaceYouTube(html) {
    return html.replace(YOUTUBE_RE, (_, raw, title) => mediaChip(raw, title));
  }

  function linkButton(type, id, label, entities) {
    const entity = entities[id];
    const display = label || (entity ? entity.name : id);
    return `<button type="button" class="entity-link" data-type="${type}" data-id="${id}">${escapeHtml(display)}</button>`;
  }

  function replaceLinks(html, entities) {
    html = html.replace(BRACKET_LINK_RE, (_, type, id, label) => linkButton(type, id, label, entities));
    html = html.replace(AT_LINK_RE, (_, type, id, label) => linkButton(type, id, label, entities));
    return html;
  }

  function parseContent(raw, entities) {
    let html = raw;
    const registry = entities || window.EntityRegistry?.getAll?.() || window.ENTITIES || {};

    html = html.replace(/\{\{read-aloud\}\}([\s\S]*?)\{\{\/read-aloud\}\}/g, (_, text) =>
      `<div class="read-aloud"><span class="read-aloud-label">${window.I18N?.readAloud || "Read Aloud"}</span>${inlineFormat(text.trim(), registry)}</div>`
    );

    html = html.replace(/\{\{dm-note\}\}([\s\S]*?)\{\{\/dm-note\}\}/g, (_, text) =>
      `<div class="dm-note"><span class="dm-note-label">${window.I18N?.dmNote || "DM Note"}</span>${inlineFormat(text.trim(), registry)}</div>`
    );

    html = replaceYouTube(html);
    html = replaceLinks(html, registry);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    return html;
  }

  /** Format single-line / inline snippets inside blocks */
  function inlineFormat(text, entities) {
    let html = replaceYouTube(escapeHtml(text));
    html = replaceLinks(html, entities);
    html = html.replace(/&lt;b&gt;(.+?)&lt;\/b&gt;/g, "<strong>$1</strong>");
    html = html.replace(/&lt;i&gt;(.+?)&lt;\/i&gt;/g, "<em>$1</em>");
    html = html.replace(/&lt;strong&gt;(.+?)&lt;\/strong&gt;/g, "<strong>$1</strong>");
    html = html.replace(/&lt;em&gt;(.+?)&lt;\/em&gt;/g, "<em>$1</em>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return html;
  }

  function markdownLite(text) {
    return text
      .split("\n\n")
      .map((p) => {
        let line = p.trim();
        line = replaceYouTube(escapeHtml(line));
        line = replaceLinks(line, window.EntityRegistry?.getAll() || window.ENTITIES || {});
        line = line.replace(/&lt;b&gt;(.+?)&lt;\/b&gt;/g, "<strong>$1</strong>");
        line = line.replace(/&lt;i&gt;(.+?)&lt;\/i&gt;/g, "<em>$1</em>");
        line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        return `<p>${line.replace(/\n/g, "<br>")}</p>`;
      })
      .join("");
  }

  function stripTags(html) {
    return html
      .replace(/\{\{youtube:[^}]+\}\}/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\[\[[^\]]+\]\]/g, " ")
      .replace(/@(npc|monster|location|item):[\w-]+(?:\|[^\s@<]+)?/g, " ");
  }

  return {
    parseContent,
    markdownLite,
    stripTags,
    escapeHtml,
    replaceLinks,
    replaceYouTube,
    extractYouTubeId,
    BRACKET_LINK_RE,
    AT_LINK_RE,
    YOUTUBE_RE
  };
})();
