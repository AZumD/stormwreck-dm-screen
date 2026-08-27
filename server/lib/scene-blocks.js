/**
 * Parse campaign section content markup into client-neutral blocks for the TUI.
 * Mirrors js/core/parser.js markers: read-aloud, dm-note, collapse, youtube, @refs.
 */
"use strict";

const REF_RE = /@(pc|npc|race|class|skill|feature|spell|item|monster|location|music|source):([a-zA-Z0-9][a-zA-Z0-9._-]{0,127})(?:\|([^@\n[{]*))?/g;
const YOUTUBE_RE = /\{\{youtube:([^}|]+)(?:\|([^}]*))?\}\}/gi;

function extractRefs(text) {
  const refs = [];
  const seen = new Set();
  String(text || "").replace(REF_RE, (_, type, id, label) => {
    const key = `${type}:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({ type, id, label: label ? String(label).trim() : "" });
    }
    return _;
  });
  return refs;
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pushText(blocks, raw) {
  const text = stripHtml(String(raw || "").trim());
  if (!text) return;
  // Drop standalone youtube chips from prose (TUI Scene doesn't embed YT)
  const cleaned = text.replace(YOUTUBE_RE, "").trim();
  if (!cleaned) return;
  blocks.push({
    type: "text",
    text: cleaned,
    refs: extractRefs(cleaned)
  });
}

/**
 * Parse one scene content string into nested blocks.
 * @param {string} content
 * @returns {Array<object>}
 */
function parseBlocks(content) {
  const src = String(content || "");
  const blocks = [];
  let i = 0;

  function findNextTag(from) {
    const slice = src.slice(from);
    const patterns = [
      { re: /^\{\{read-aloud\}\}/i, kind: "read-aloud-open" },
      { re: /^\{\{\/read-aloud\}\}/i, kind: "read-aloud-close" },
      { re: /^\{\{dm-note\}\}/i, kind: "dm-note-open" },
      { re: /^\{\{\/dm-note\}\}/i, kind: "dm-note-close" },
      { re: /^\{\{collapse(?:[:\s]+([^}]*))?\}\}/i, kind: "collapse-open" },
      { re: /^\{\{\/collapse\}\}/i, kind: "collapse-close" }
    ];
    let best = null;
    for (const p of patterns) {
      const m = slice.match(p.re);
      if (!m) continue;
      // We need earliest occurrence in full string from `from`
    }
    const openRe =
      /\{\{(read-aloud|dm-note|\/read-aloud|\/dm-note|\/collapse|collapse(?:[:\s]+[^}]*)?)\}\}/gi;
    openRe.lastIndex = 0;
    const rest = src.slice(from);
    openRe.lastIndex = 0;
    const m = openRe.exec(rest);
    if (!m) return null;
    const abs = from + m.index;
    const tag = m[1];
    if (/^read-aloud$/i.test(tag)) return { index: abs, end: abs + m[0].length, kind: "read-aloud-open" };
    if (/^\/read-aloud$/i.test(tag)) return { index: abs, end: abs + m[0].length, kind: "read-aloud-close" };
    if (/^dm-note$/i.test(tag)) return { index: abs, end: abs + m[0].length, kind: "dm-note-open" };
    if (/^\/dm-note$/i.test(tag)) return { index: abs, end: abs + m[0].length, kind: "dm-note-close" };
    if (/^\/collapse$/i.test(tag)) return { index: abs, end: abs + m[0].length, kind: "collapse-close" };
    const title = tag.replace(/^collapse(?:[:\s]+)?/i, "").trim();
    return { index: abs, end: abs + m[0].length, kind: "collapse-open", title };
  }

  function parseUntil(closeKind) {
    const out = [];
    while (i < src.length) {
      const tag = findNextTag(i);
      if (!tag) {
        pushText(out, src.slice(i));
        i = src.length;
        break;
      }
      if (tag.index > i) {
        pushText(out, src.slice(i, tag.index));
      }
      i = tag.end;
      if (tag.kind === closeKind) {
        break;
      }
      if (tag.kind === "read-aloud-open") {
        const inner = parseUntil("read-aloud-close");
        const text = inner
          .filter((b) => b.type === "text" || b.type === "read-aloud")
          .map((b) => b.text)
          .join("\n\n")
          .trim();
        const flat = inner.length === 1 && inner[0].type === "text" ? inner[0].text : text || flattenText(inner);
        out.push({ type: "read-aloud", text: flat, refs: extractRefs(flat), blocks: inner });
      } else if (tag.kind === "dm-note-open") {
        const inner = parseUntil("dm-note-close");
        const flat = flattenText(inner);
        out.push({ type: "dm-note", text: flat, refs: extractRefs(flat), blocks: inner });
      } else if (tag.kind === "collapse-open") {
        const inner = parseUntil("collapse-close");
        out.push({
          type: "collapse",
          title: tag.title || "Details",
          blocks: inner,
          refs: extractRefs(flattenText(inner))
        });
      } else {
        // Unexpected close — treat as text
        pushText(out, src.slice(tag.index, tag.end));
      }
    }
    return out;
  }

  function flattenText(list) {
    return (list || [])
      .map((b) => {
        if (b.type === "collapse") return `${b.title}\n${flattenText(b.blocks)}`;
        return b.text || flattenText(b.blocks);
      })
      .filter(Boolean)
      .join("\n\n");
  }

  const top = parseUntil(null);
  return top;
}

/**
 * Build list + detail payloads from campaign documents.
 */
function buildSceneList({ structure, campaignState, sceneMeta }) {
  const scenes = Array.isArray(structure?.scenes) ? structure.scenes : [];
  const groups = Array.isArray(structure?.groups) ? structure.groups : [];
  const stateScenes = campaignState?.scenes && typeof campaignState.scenes === "object" ? campaignState.scenes : {};
  const meta = sceneMeta && typeof sceneMeta === "object" ? sceneMeta : {};

  let currentSceneId = null;
  for (const s of scenes) {
    const st = stateScenes[s.id];
    if (st && st.status === "current") {
      currentSceneId = s.id;
      break;
    }
  }

  return {
    groups: groups.map((g) => ({ id: g.id, title: g.title || g.id })),
    currentSceneId,
    scenes: scenes.map((s) => {
      const st = stateScenes[s.id] || {};
      const m = meta[s.id] || {};
      return {
        id: s.id,
        title: s.title || s.id,
        groupId: s.groupId || null,
        status: st.status || "unseen",
        locationId: m.locationId || null
      };
    })
  };
}

function buildSceneDetail({ scene, campaignState, sceneMeta }) {
  if (!scene) return null;
  const st = (campaignState?.scenes && campaignState.scenes[scene.id]) || {};
  const m = (sceneMeta && sceneMeta[scene.id]) || {};
  const blocks = parseBlocks(scene.content || "");
  return {
    id: scene.id,
    title: scene.title || scene.id,
    groupId: scene.groupId || null,
    status: st.status || "unseen",
    notes: typeof st.notes === "string" ? st.notes : "",
    locationId: m.locationId || null,
    entities: Array.isArray(m.entities) ? m.entities : [],
    connections: Array.isArray(m.connections) ? m.connections : [],
    blocks
  };
}

module.exports = {
  parseBlocks,
  extractRefs,
  buildSceneList,
  buildSceneDetail,
  stripHtml
};
