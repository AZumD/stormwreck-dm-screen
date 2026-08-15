/**
 * Campaign registry + per-campaign JSON documents.
 */
"use strict";

const path = require("path");
const { assertSafeId, assertDocKind } = require("./ids");
const {
  dataRoot,
  writeJsonAtomic,
  readJson,
  removeFile,
  ensureDir,
  pathExists
} = require("./atomic-fs");

function indexPath() {
  return path.join(dataRoot(), "campaigns", "index.json");
}

function campaignDir(id) {
  return path.join(dataRoot(), "campaigns", assertSafeId(id, "campaign id"));
}

function docPath(id, kind) {
  return path.join(campaignDir(id), `${assertDocKind(kind)}.json`);
}

async function loadIndex() {
  const raw = await readJson(indexPath(), { version: 1, campaigns: [] });
  const campaigns = Array.isArray(raw?.campaigns)
    ? raw.campaigns
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          try {
            const id = assertSafeId(c.id, "campaign id");
            const title = String(c.title || "").trim();
            if (!title) return null;
            return {
              id,
              title,
              description: String(c.description || "").trim(),
              level: String(c.level || "").trim(),
              createdAt: c.createdAt || Date.now(),
              updatedAt: c.updatedAt || Date.now()
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    : [];
  return { version: 1, campaigns };
}

async function saveIndex(state) {
  await writeJsonAtomic(indexPath(), {
    version: 1,
    campaigns: Array.isArray(state.campaigns) ? state.campaigns : []
  });
}

function slugify(title) {
  const base = String(title || "campaign")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "campaign";
}

async function listCampaigns() {
  const state = await loadIndex();
  return state.campaigns.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

async function getCampaign(id) {
  const safe = assertSafeId(id, "campaign id");
  const state = await loadIndex();
  return state.campaigns.find((c) => c.id === safe) || null;
}

async function existsCampaignId(id) {
  if (id === "stormwreck-isle") return true;
  return !!(await getCampaign(id));
}

async function uniqueId(title) {
  let base = slugify(title);
  if (base === "stormwreck-isle") base = "campaign";
  let id = base;
  let n = 2;
  while (await existsCampaignId(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

async function createCampaign({ title, description, level } = {}) {
  const trimmed = String(title || "").trim();
  if (!trimmed) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  const state = await loadIndex();
  const entry = {
    id: await uniqueId(trimmed),
    title: trimmed,
    description: String(description || "").trim(),
    level: String(level || "").trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.campaigns.push(entry);
  await saveIndex(state);
  await ensureDir(campaignDir(entry.id));
  return entry;
}

async function updateCampaign(id, patch) {
  const safe = assertSafeId(id, "campaign id");
  const state = await loadIndex();
  const idx = state.campaigns.findIndex((c) => c.id === safe);
  if (idx < 0) return null;
  const prev = state.campaigns[idx];
  const next = {
    ...prev,
    ...(patch || {}),
    id: safe,
    title: String(patch?.title != null ? patch.title : prev.title).trim() || prev.title,
    description: String(patch?.description != null ? patch.description : prev.description || "").trim(),
    level: String(patch?.level != null ? patch.level : prev.level || "").trim(),
    updatedAt: Date.now()
  };
  state.campaigns[idx] = next;
  await saveIndex(state);
  return next;
}

async function upsertCampaign(entry) {
  const id = assertSafeId(entry?.id, "campaign id");
  if (id === "stormwreck-isle") {
    const err = new Error("Cannot overwrite built-in campaign registry entry");
    err.status = 400;
    throw err;
  }
  const title = String(entry?.title || "").trim();
  if (!title) {
    const err = new Error("title is required");
    err.status = 400;
    throw err;
  }
  const state = await loadIndex();
  const idx = state.campaigns.findIndex((c) => c.id === id);
  const next = {
    id,
    title,
    description: String(entry?.description || "").trim(),
    level: String(entry?.level || "").trim(),
    createdAt: entry?.createdAt || (idx >= 0 ? state.campaigns[idx].createdAt : Date.now()),
    updatedAt: Date.now()
  };
  if (idx >= 0) state.campaigns[idx] = next;
  else state.campaigns.push(next);
  await saveIndex(state);
  await ensureDir(campaignDir(id));
  return next;
}

async function removeCampaign(id) {
  const safe = assertSafeId(id, "campaign id");
  if (safe === "stormwreck-isle") {
    const err = new Error("Cannot remove built-in campaign");
    err.status = 400;
    throw err;
  }
  const state = await loadIndex();
  const before = state.campaigns.length;
  state.campaigns = state.campaigns.filter((c) => c.id !== safe);
  if (state.campaigns.length === before) return false;
  await saveIndex(state);
  return true;
}

async function getDocument(campaignId, kind) {
  assertSafeId(campaignId, "campaign id");
  assertDocKind(kind);
  return readJson(docPath(campaignId, kind), null);
}

async function putDocument(campaignId, kind, body) {
  assertSafeId(campaignId, "campaign id");
  assertDocKind(kind);
  if (body === undefined) {
    const err = new Error("Body required");
    err.status = 400;
    throw err;
  }
  await ensureDir(campaignDir(campaignId));
  await writeJsonAtomic(docPath(campaignId, kind), body);
  return body;
}

async function deleteDocument(campaignId, kind) {
  return removeFile(docPath(campaignId, kind));
}

module.exports = {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  upsertCampaign,
  removeCampaign,
  getDocument,
  putDocument,
  deleteDocument,
  docPath,
  campaignDir,
  loadIndex,
  saveIndex
};
