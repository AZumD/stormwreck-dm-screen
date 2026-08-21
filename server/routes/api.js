/**
 * Local JSON API route table under /api
 */
"use strict";

const catalogues = require("../lib/catalogues");
const campaigns = require("../lib/campaigns");
const assets = require("../lib/assets");
const db = require("../lib/db");
const { sendJson, sendError, readJsonBody } = require("../lib/http-util");
const {
  assertCatalogueType,
  assertSafeId,
  assertDocKind,
  assertAssetKind,
  CATALOGUE_TYPES,
  CAMPAIGN_DOC_KINDS
} = require("../lib/ids");

function route(method, pattern, keys, handler) {
  return { method, pattern, keys, handler };
}

function createApiRoutes() {
  return [
    route("GET", /^\/api\/health$/, [], async (_req, res) => {
      const database = await db.health();
      sendJson(res, 200, {
        ok: true,
        mode: database.configured && database.ok ? "file+postgres" : "file-backed",
        catalogueTypes: CATALOGUE_TYPES,
        documentKinds: CAMPAIGN_DOC_KINDS,
        database
      });
    }),

    route("GET", /^\/api\/db\/health$/, [], async (_req, res) => {
      const database = await db.health();
      sendJson(res, database.ok || !database.configured ? 200 : 503, {
        ok: database.ok || !database.configured,
        database
      });
    }),

    route("GET", /^\/api\/catalogues\/([^/]+)$/, ["type"], async (req, res, p) => {
      const type = assertCatalogueType(p.type);
      const entries = await catalogues.list(type);
      sendJson(res, 200, { ok: true, type, entries });
    }),

    route("GET", /^\/api\/catalogues\/([^/]+)\/([^/]+)$/, ["type", "id"], async (req, res, p) => {
      const type = assertCatalogueType(p.type);
      const id = assertSafeId(p.id, "entry id");
      const entry = await catalogues.get(type, id);
      if (!entry) return sendJson(res, 404, { ok: false, error: "Not found" });
      sendJson(res, 200, { ok: true, entry });
    }),

    route("PUT", /^\/api\/catalogues\/([^/]+)\/([^/]+)$/, ["type", "id"], async (req, res, p) => {
      const type = assertCatalogueType(p.type);
      const id = assertSafeId(p.id, "entry id");
      const body = await readJsonBody(req);
      const entry = await catalogues.upsert(type, id, body || {});
      sendJson(res, 200, { ok: true, entry });
    }),

    route("DELETE", /^\/api\/catalogues\/([^/]+)\/([^/]+)$/, ["type", "id"], async (req, res, p) => {
      const type = assertCatalogueType(p.type);
      const id = assertSafeId(p.id, "entry id");
      const removed = await catalogues.remove(type, id);
      await assets.deleteAsset("portraits", type, id).catch(() => false);
      await assets.deleteAsset("maps", type, id).catch(() => false);
      sendJson(res, 200, { ok: true, removed });
    }),

    route("GET", /^\/api\/campaigns$/, [], async (_req, res) => {
      const list = await campaigns.listCampaigns();
      sendJson(res, 200, { ok: true, campaigns: list });
    }),

    route("POST", /^\/api\/campaigns$/, [], async (req, res) => {
      const body = await readJsonBody(req);
      const entry = await campaigns.createCampaign(body || {});
      sendJson(res, 201, { ok: true, campaign: entry });
    }),

    route("PUT", /^\/api\/campaigns\/([^/]+)$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      const body = await readJsonBody(req);
      const entry = await campaigns.upsertCampaign({ ...(body || {}), id });
      sendJson(res, 200, { ok: true, campaign: entry });
    }),

    route("GET", /^\/api\/campaigns\/([^/]+)$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      const entry = await campaigns.getCampaign(id);
      if (!entry && id !== "stormwreck-isle") {
        return sendJson(res, 404, { ok: false, error: "Not found" });
      }
      sendJson(res, 200, {
        ok: true,
        campaign:
          entry ||
          (id === "stormwreck-isle"
            ? {
                id: "stormwreck-isle",
                title: "Dragons of Stormwreck Isle",
                description: "Built-in starter set campaign",
                level: "1–3",
                builtIn: true
              }
            : null)
      });
    }),

    route("PATCH", /^\/api\/campaigns\/([^/]+)$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      const body = await readJsonBody(req);
      const entry = await campaigns.updateCampaign(id, body || {});
      if (!entry) return sendJson(res, 404, { ok: false, error: "Not found" });
      sendJson(res, 200, { ok: true, campaign: entry });
    }),

    route("DELETE", /^\/api\/campaigns\/([^/]+)$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      const removed = await campaigns.removeCampaign(id);
      sendJson(res, 200, { ok: true, removed });
    }),

    route(
      "GET",
      /^\/api\/campaigns\/([^/]+)\/documents\/([^/]+)$/,
      ["id", "kind"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const kind = assertDocKind(p.kind);
        const document = await campaigns.getDocument(id, kind);
        sendJson(res, 200, { ok: true, kind, document });
      }
    ),

    route(
      "PUT",
      /^\/api\/campaigns\/([^/]+)\/documents\/([^/]+)$/,
      ["id", "kind"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const kind = assertDocKind(p.kind);
        const body = await readJsonBody(req);
        const document = await campaigns.putDocument(id, kind, body);
        sendJson(res, 200, { ok: true, kind, document });
      }
    ),

    route(
      "GET",
      /^\/api\/assets\/([^/]+)\/([^/]+)\/([^/]+)$/,
      ["kind", "type", "id"],
      async (req, res, p) => {
        const kind = assertAssetKind(p.kind);
        const type = assertCatalogueType(p.type);
        const id = assertSafeId(p.id, "entry id");
        const asset = await assets.readAsset(kind, type, id);
        if (!asset) return sendJson(res, 404, { ok: false, error: "Not found" });
        res.writeHead(200, {
          "Content-Type": asset.mime,
          "Cache-Control": "public, max-age=60",
          "Content-Length": asset.buffer.length
        });
        res.end(asset.buffer);
      }
    ),

    route(
      "PUT",
      /^\/api\/assets\/([^/]+)\/([^/]+)\/([^/]+)$/,
      ["kind", "type", "id"],
      async (req, res, p) => {
        const kind = assertAssetKind(p.kind);
        const type = assertCatalogueType(p.type);
        const id = assertSafeId(p.id, "entry id");
        const body = await readJsonBody(req);
        const dataUrl = body?.dataUrl || body?.dataURL;
        if (!dataUrl) {
          const err = new Error("dataUrl required");
          err.status = 400;
          throw err;
        }
        const result = await assets.putFromDataUrl(kind, type, id, dataUrl);
        sendJson(res, 200, {
          ok: true,
          url: result.url,
          mime: result.mime,
          bytes: result.bytes
        });
      }
    ),

    route(
      "DELETE",
      /^\/api\/assets\/([^/]+)\/([^/]+)\/([^/]+)$/,
      ["kind", "type", "id"],
      async (req, res, p) => {
        const kind = assertAssetKind(p.kind);
        const type = assertCatalogueType(p.type);
        const id = assertSafeId(p.id, "entry id");
        const removed = await assets.deleteAsset(kind, type, id);
        sendJson(res, 200, { ok: true, removed });
      }
    ),

    route(
      "PUT",
      /^\/api\/catalogue-assets\/([^/]+)\/([^/]+)\/([^/]+)$/,
      ["type", "id", "field"],
      async (req, res, p) => {
        const type = assertCatalogueType(p.type);
        const id = assertSafeId(p.id, "entry id");
        const body = await readJsonBody(req);
        const dataUrl = body?.dataUrl || body?.dataURL;
        if (!dataUrl) {
          const err = new Error("dataUrl required");
          err.status = 400;
          throw err;
        }
        const result = await assets.putFieldFromDataUrl(type, id, p.field, dataUrl);
        sendJson(res, 200, {
          ok: true,
          url: result.url,
          mime: result.mime,
          bytes: result.bytes
        });
      }
    ),

    route(
      "DELETE",
      /^\/api\/catalogue-assets\/([^/]+)\/([^/]+)\/([^/]+)$/,
      ["type", "id", "field"],
      async (req, res, p) => {
        const type = assertCatalogueType(p.type);
        const id = assertSafeId(p.id, "entry id");
        const removed = await assets.deleteField(type, id, p.field);
        sendJson(res, 200, { ok: true, removed });
      }
    ),

    route("GET", /^\/api\/export$/, [], async (_req, res) => {
      const catalogue = {};
      for (const type of CATALOGUE_TYPES) {
        catalogue[type] = await catalogues.list(type);
      }
      const campaignList = await campaigns.listCampaigns();
      const campaignDocs = {};
      const ids = ["stormwreck-isle", ...campaignList.map((c) => c.id)];
      for (const id of [...new Set(ids)]) {
        campaignDocs[id] = {};
        for (const kind of CAMPAIGN_DOC_KINDS) {
          campaignDocs[id][kind] = await campaigns.getDocument(id, kind);
        }
      }
      sendJson(res, 200, {
        ok: true,
        exportedAt: new Date().toISOString(),
        campaigns: campaignList,
        catalogues: catalogue,
        campaignDocuments: campaignDocs
      });
    })
  ];
}

async function handleApi(req, res, pathname, routes) {
  const method = req.method || "GET";
  for (const route of routes) {
    if (route.method !== method) continue;
    const m = pathname.match(route.pattern);
    if (!m) continue;
    const params = {};
    (route.keys || []).forEach((key, i) => {
      params[key] = decodeURIComponent(m[i + 1]);
    });
    try {
      await route.handler(req, res, params);
    } catch (err) {
      sendError(res, err);
    }
    return true;
  }
  return false;
}

module.exports = { createApiRoutes, handleApi };
