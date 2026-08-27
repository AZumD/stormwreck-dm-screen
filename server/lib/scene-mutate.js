/**
 * Narrow, server-side scene mutations.
 * Content lives in section-structure; live status/notes in campaign-state.
 * Never accepts a client-supplied full structure rewrite for a single-scene edit.
 */
"use strict";

const campaigns = require("./campaigns");
const sceneBlocks = require("./scene-blocks");

const SCENE_STATUSES = ["unseen", "current", "completed", "skipped"];
const CONTENT_KEYS = new Set(["title", "content", "groupId"]);
const STATE_KEYS = new Set(["status", "notes"]);
const ALLOWED_KEYS = new Set([...CONTENT_KEYS, ...STATE_KEYS]);

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message || "Scene not found");
  err.status = 404;
  return err;
}

/**
 * Validate and normalize a PATCH body. Unknown keys rejected.
 * @param {object} body
 * @returns {{ title?: string, content?: string, groupId?: string|null, status?: string, notes?: string }}
 */
function normalizeScenePatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Body must be a JSON object");
  }
  const keys = Object.keys(body);
  if (keys.length === 0) {
    throw badRequest("Empty patch");
  }
  for (const k of keys) {
    if (!ALLOWED_KEYS.has(k)) {
      throw badRequest(`Unknown field: ${k}`);
    }
  }
  const out = {};
  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    if (typeof body.title !== "string") throw badRequest("title must be a string");
    out.title = body.title;
  }
  if (Object.prototype.hasOwnProperty.call(body, "content")) {
    if (typeof body.content !== "string") throw badRequest("content must be a string");
    out.content = body.content;
  }
  if (Object.prototype.hasOwnProperty.call(body, "groupId")) {
    if (body.groupId !== null && typeof body.groupId !== "string") {
      throw badRequest("groupId must be a string or null");
    }
    out.groupId = body.groupId === "" ? null : body.groupId;
  }
  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (typeof body.status !== "string" || !SCENE_STATUSES.includes(body.status)) {
      throw badRequest(`status must be one of: ${SCENE_STATUSES.join(", ")}`);
    }
    out.status = body.status;
  }
  if (Object.prototype.hasOwnProperty.call(body, "notes")) {
    if (typeof body.notes !== "string") throw badRequest("notes must be a string");
    out.notes = body.notes;
  }
  return out;
}

function applyContentPatch(structure, sceneId, patch) {
  const scenes = Array.isArray(structure?.scenes) ? structure.scenes.slice() : [];
  const idx = scenes.findIndex((s) => s && s.id === sceneId);
  if (idx < 0) throw notFound("Scene not found");
  const prev = scenes[idx] && typeof scenes[idx] === "object" ? scenes[idx] : { id: sceneId };
  const next = { ...prev, id: sceneId };
  if (Object.prototype.hasOwnProperty.call(patch, "title")) next.title = patch.title;
  if (Object.prototype.hasOwnProperty.call(patch, "content")) next.content = patch.content;
  if (Object.prototype.hasOwnProperty.call(patch, "groupId")) next.groupId = patch.groupId;
  scenes[idx] = next;
  return {
    structure: {
      ...(structure && typeof structure === "object" ? structure : {}),
      groups: Array.isArray(structure?.groups) ? structure.groups : [],
      scenes
    },
    scene: next
  };
}

function applyStatePatch(campaignState, sceneId, patch) {
  const base =
    campaignState && typeof campaignState === "object" && !Array.isArray(campaignState)
      ? { ...campaignState }
      : {};
  const scenes =
    base.scenes && typeof base.scenes === "object" && !Array.isArray(base.scenes)
      ? { ...base.scenes }
      : {};
  const prev = scenes[sceneId] && typeof scenes[sceneId] === "object" ? { ...scenes[sceneId] } : {};
  const status = Object.prototype.hasOwnProperty.call(patch, "status")
    ? patch.status
    : SCENE_STATUSES.includes(prev.status)
      ? prev.status
      : "unseen";
  const notes = Object.prototype.hasOwnProperty.call(patch, "notes")
    ? patch.notes
    : typeof prev.notes === "string"
      ? prev.notes
      : "";

  if (status === "current") {
    for (const id of Object.keys(scenes)) {
      if (id !== sceneId && scenes[id]?.status === "current") {
        scenes[id] = { ...scenes[id], status: "completed" };
      }
    }
  }

  if (status === "unseen" && !notes) {
    delete scenes[sceneId];
  } else {
    scenes[sceneId] = { status, notes };
  }
  base.scenes = scenes;
  return base;
}

/**
 * Patch one scene's content and/or live state. Returns buildSceneDetail payload.
 * @param {string} campaignId
 * @param {string} sceneId
 * @param {object} body
 */
async function patchScene(campaignId, sceneId, body) {
  const patch = normalizeScenePatch(body);
  const wantsContent = [...CONTENT_KEYS].some((k) => Object.prototype.hasOwnProperty.call(patch, k));
  const wantsState = [...STATE_KEYS].some((k) => Object.prototype.hasOwnProperty.call(patch, k));

  let structure = await campaigns.getDocument(campaignId, "section-structure");
  let campaignState = await campaigns.getDocument(campaignId, "campaign-state");
  const sceneMeta = await campaigns.getDocument(campaignId, "scene-meta");

  let sceneRow = null;
  if (wantsContent) {
    const applied = applyContentPatch(structure || { groups: [], scenes: [] }, sceneId, patch);
    structure = applied.structure;
    sceneRow = applied.scene;
    await campaigns.putDocument(campaignId, "section-structure", structure);
  } else {
    const scenes = Array.isArray(structure?.scenes) ? structure.scenes : [];
    sceneRow = scenes.find((s) => s && s.id === sceneId) || null;
    if (!sceneRow) throw notFound("Scene not found");
  }

  if (wantsState) {
    campaignState = applyStatePatch(campaignState, sceneId, patch);
    await campaigns.putDocument(campaignId, "campaign-state", campaignState);
  }

  return sceneBlocks.buildSceneDetail({
    scene: sceneRow,
    campaignState,
    sceneMeta
  });
}

module.exports = {
  SCENE_STATUSES,
  ALLOWED_KEYS,
  normalizeScenePatch,
  applyContentPatch,
  applyStatePatch,
  patchScene
};
