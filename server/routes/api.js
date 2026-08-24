/**
 * Local JSON API route table under /api
 */
"use strict";

const catalogues = require("../lib/catalogues");
const campaigns = require("../lib/campaigns");
const assets = require("../lib/assets");
const db = require("../lib/db");
const characters = require("../lib/characters");
const player = require("../lib/player");
const auth = require("../lib/auth");
const authorize = require("../lib/authorize");
const campaignMaps = require("../lib/campaign-maps");
const mapDistance = require("../lib/map-distance");
const revealedNpcs = require("../lib/revealed-npcs");
const { sendJson, sendError, readJsonBody, UVTT_BODY_LIMIT } = require("../lib/http-util");
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
      const authRequired = auth.isAuthRequired();
      /* Production / auth-required: Postgres must be reachable (Railway healthcheck). */
      const healthy = !authRequired || (database.configured && database.ok);
      const safeDatabase = {
        configured: database.configured,
        ok: database.ok,
        mode: database.mode
      };
      if (!healthy && database.error) {
        safeDatabase.error = "database unavailable";
      }
      sendJson(res, healthy ? 200 : 503, {
        ok: healthy,
        mode: database.configured && database.ok ? "file+postgres" : "file-backed",
        catalogueTypes: CATALOGUE_TYPES,
        documentKinds: CAMPAIGN_DOC_KINDS,
        database: safeDatabase,
        authRequired
      });
    }),

    route("GET", /^\/api\/db\/health$/, [], async (_req, res) => {
      const database = await db.health();
      sendJson(res, database.ok || !database.configured ? 200 : 503, {
        ok: database.ok || !database.configured,
        database
      });
    }),

    route("POST", /^\/api\/auth\/login$/, [], async (req, res) => {
      authorize.assertMutationSafety(req);
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const body = await readJsonBody(req);
      const email = body?.email;
      const password = body?.password;
      if (!email || password == null || password === "") {
        return sendJson(res, 400, { ok: false, error: "email and password required" });
      }
      const result = await auth.loginWithPassword(email, password);
      const memberships = await auth.listMemberships(result.user.id);
      auth.appendSetCookie(res, auth.buildSessionCookie(result.rawToken));
      sendJson(res, 200, {
        ok: true,
        user: result.user,
        memberships,
        expiresAt: result.expiresAt
      });
    }),

    route("POST", /^\/api\/auth\/logout$/, [], async (req, res) => {
      authorize.assertMutationSafety(req);
      const cookies = auth.parseCookies(req);
      const rawToken = cookies[auth.COOKIE_NAME];
      if (rawToken) await auth.destroySessionByToken(rawToken);
      await auth.cleanupExpiredSessions();
      auth.appendSetCookie(res, auth.buildSessionCookie("", { clear: true }));
      sendJson(res, 200, { ok: true });
    }),

    route("GET", /^\/api\/auth\/me$/, [], async (req, res) => {
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const user = await auth.resolveSessionUser(req);
      if (!user) return sendJson(res, 401, { ok: false, error: "Authentication required" });
      const memberships = await auth.listMemberships(user.id);
      sendJson(res, 200, {
        ok: true,
        user: { id: user.id, name: user.name, email: user.email },
        memberships
      });
    }),

    /* —— Phase 3B player companion API (always session-authenticated) —— */

    route("GET", /^\/api\/player\/bootstrap$/, [], async (req, res) => {
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const data = await player.getBootstrap(req);
      sendJson(res, 200, { ok: true, ...data });
    }),

    route("GET", /^\/api\/player\/campaigns\/([^/]+)\/characters\/mine$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const list = await player.listMyCharacters(req, id);
      sendJson(res, 200, { ok: true, campaignId: id, characters: list });
    }),

    route(
      "GET",
      /^\/api\/player\/campaigns\/([^/]+)\/characters\/([^/]+)$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const character = await player.getMyCharacter(req, id, characterId);
        sendJson(res, 200, { ok: true, campaignId: id, character });
      }
    ),

    route(
      "PATCH",
      /^\/api\/player\/campaigns\/([^/]+)\/characters\/([^/]+)\/state$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const body = await readJsonBody(req);
        const character = await player.patchMyCharacterState(req, id, characterId, body || {});
        sendJson(res, 200, { ok: true, campaignId: id, character });
      }
    ),

    route(
      "PATCH",
      /^\/api\/player\/campaigns\/([^/]+)\/characters\/([^/]+)$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const body = await readJsonBody(req);
        const character = await player.patchMyCharacter(req, id, characterId, body || {});
        sendJson(res, 200, { ok: true, campaignId: id, character });
      }
    ),

    route(
      "POST",
      /^\/api\/player\/campaigns\/([^/]+)\/characters\/([^/]+)\/inventory$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const body = await readJsonBody(req);
        const result = await player.addInventoryEntry(req, id, characterId, body || {});
        sendJson(res, 201, { ok: true, campaignId: id, entryId: result.entryId, character: result.character });
      }
    ),

    route(
      "PATCH",
      /^\/api\/player\/campaigns\/([^/]+)\/characters\/([^/]+)\/inventory\/([^/]+)$/,
      ["id", "characterId", "entryId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const body = await readJsonBody(req);
        const character = await player.updateInventoryEntry(
          req,
          id,
          characterId,
          p.entryId,
          body || {}
        );
        sendJson(res, 200, { ok: true, campaignId: id, character });
      }
    ),

    route(
      "DELETE",
      /^\/api\/player\/campaigns\/([^/]+)\/characters\/([^/]+)\/inventory\/([^/]+)$/,
      ["id", "characterId", "entryId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const character = await player.removeInventoryEntry(req, id, characterId, p.entryId);
        sendJson(res, 200, { ok: true, campaignId: id, character });
      }
    ),

    route(
      "PUT",
      /^\/api\/player\/campaigns\/([^/]+)\/portraits\/characters\/([^/]+)$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const body = await readJsonBody(req);
        const character = await player.putMyCharacterPortrait(req, id, characterId, body || {});
        sendJson(res, 200, { ok: true, campaignId: id, character });
      }
    ),

    route("GET", /^\/api\/player\/campaigns\/([^/]+)\/party$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const party = await player.listParty(req, id);
      sendJson(res, 200, { ok: true, campaignId: id, party });
    }),

    route(
      "GET",
      /^\/api\/player\/campaigns\/([^/]+)\/catalogues\/([^/]+)$/,
      ["id", "type"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
        const result = await player.listPlayerCatalogue(req, id, p.type, {
          q: url.searchParams.get("q") || "",
          limit: url.searchParams.get("limit"),
          offset: url.searchParams.get("offset")
        });
        sendJson(res, 200, { ok: true, campaignId: id, ...result });
      }
    ),

    route(
      "GET",
      /^\/api\/player\/campaigns\/([^/]+)\/catalogues\/([^/]+)\/([^/]+)$/,
      ["id", "type", "entryId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const entry = await player.resolveCatalogue(req, id, p.type, p.entryId);
        sendJson(res, 200, { ok: true, campaignId: id, entry });
      }
    ),

    route(
      "POST",
      /^\/api\/player\/campaigns\/([^/]+)\/characters\/([^/]+)\/library-attach$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const body = await readJsonBody(req);
        const result = await player.attachLibraryEntry(req, id, characterId, body || {});
        sendJson(res, 200, {
          ok: true,
          campaignId: id,
          character: result.character,
          attached: result.attached || null,
          action: result.action || "inventory",
          entryId: result.entryId || null
        });
      }
    ),

    route("GET", /^\/api\/player\/campaigns\/([^/]+)\/npcs$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const npcs = await revealedNpcs.listForPlayer(req, id);
      sendJson(res, 200, { ok: true, campaignId: id, npcs });
    }),

    route(
      "GET",
      /^\/api\/player\/campaigns\/([^/]+)\/npcs\/([^/]+)$/,
      ["id", "npcId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const npcId = assertSafeId(p.npcId, "npc id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const npc = await revealedNpcs.getForPlayer(req, id, npcId);
        sendJson(res, 200, { ok: true, campaignId: id, npc });
      }
    ),

    route("GET", /^\/api\/player\/campaigns\/([^/]+)\/notes$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const notes = await player.listNotes(req, id);
      sendJson(res, 200, { ok: true, campaignId: id, notes });
    }),

    route("POST", /^\/api\/player\/campaigns\/([^/]+)\/notes$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const body = await readJsonBody(req);
      const note = await player.createNote(req, id, body || {});
      sendJson(res, 201, { ok: true, note });
    }),

    route("PUT", /^\/api\/player\/notes\/([^/]+)$/, ["noteId"], async (req, res, p) => {
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const body = await readJsonBody(req);
      const note = await player.updateNote(req, p.noteId, body || {});
      sendJson(res, 200, { ok: true, note });
    }),

    route("DELETE", /^\/api\/player\/notes\/([^/]+)$/, ["noteId"], async (req, res, p) => {
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const result = await player.deleteNote(req, p.noteId);
      sendJson(res, 200, { ok: true, ...result });
    }),

    route(
      "GET",
      /^\/api\/player\/campaigns\/([^/]+)\/portraits\/characters\/([^/]+)$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const asset = await player.readCharacterPortrait(req, id, characterId);
        res.writeHead(200, {
          "Content-Type": asset.mime,
          "Cache-Control": "private, max-age=60",
          "Content-Length": asset.buffer.length
        });
        res.end(asset.buffer);
      }
    ),

    route(
      "GET",
      /^\/api\/player\/campaigns\/([^/]+)\/portraits\/catalogues\/([^/]+)\/([^/]+)$/,
      ["id", "type", "entryId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const asset = await player.readCataloguePortrait(req, id, p.type, p.entryId);
        res.writeHead(200, {
          "Content-Type": asset.mime,
          "Cache-Control": "private, max-age=60",
          "Content-Length": asset.buffer.length
        });
        res.end(asset.buffer);
      }
    ),

    route("GET", /^\/api\/campaigns\/([^/]+)\/characters$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      await authorize.requireDmIfAuthRequired(req, id);
      const list = await characters.listCharacters(id);
      sendJson(res, 200, { ok: true, campaignId: id, characters: list });
    }),

    route(
      "GET",
      /^\/api\/campaigns\/([^/]+)\/characters\/([^/]+)$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        await authorize.requireDmIfAuthRequired(req, id);
        const character = await characters.getCharacter(id, characterId);
        sendJson(res, 200, { ok: true, campaignId: id, character });
      }
    ),

    route(
      "GET",
      /^\/api\/campaigns\/([^/]+)\/characters\/([^/]+)\/state$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        await authorize.requireDmIfAuthRequired(req, id);
        const state = await characters.getCharacterState(id, characterId);
        sendJson(res, 200, { ok: true, campaignId: id, characterId, state });
      }
    ),

    route(
      "PUT",
      /^\/api\/campaigns\/([^/]+)\/characters\/([^/]+)\/state$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        await authorize.requireDmIfAuthRequired(req, id);
        const body = await readJsonBody(req);
        const state = await characters.updateCharacterState(id, characterId, body || {});
        sendJson(res, 200, { ok: true, campaignId: id, characterId, state });
      }
    ),

    route(
      "GET",
      /^\/api\/campaigns\/([^/]+)\/characters\/([^/]+)\/inventory$/,
      ["id", "characterId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const characterId = assertSafeId(p.characterId, "character id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        await authorize.requireDmIfAuthRequired(req, id);
        const inventory = await characters.listInventory(id, characterId);
        sendJson(res, 200, { ok: true, campaignId: id, characterId, inventory });
      }
    ),

    route("GET", /^\/api\/campaigns\/([^/]+)\/revealed-npcs$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      if (!db.isDbConfigured()) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
      }
      const npcs = await revealedNpcs.listForDm(req, id);
      sendJson(res, 200, { ok: true, campaignId: id, npcs });
    }),

    route(
      "PUT",
      /^\/api\/campaigns\/([^/]+)\/revealed-npcs\/([^/]+)$/,
      ["id", "npcId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const npcId = assertSafeId(p.npcId, "npc id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const body = await readJsonBody(req);
        const npc = await revealedNpcs.reveal(req, id, npcId, body || {});
        sendJson(res, 200, { ok: true, campaignId: id, npc });
      }
    ),

    route(
      "DELETE",
      /^\/api\/campaigns\/([^/]+)\/revealed-npcs\/([^/]+)$/,
      ["id", "npcId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const npcId = assertSafeId(p.npcId, "npc id");
        if (!db.isDbConfigured()) {
          return sendJson(res, 503, { ok: false, error: "DATABASE_URL is not configured" });
        }
        const result = await revealedNpcs.unreveal(req, id, npcId);
        sendJson(res, 200, { ok: true, campaignId: id, ...result });
      }
    ),

    route("GET", /^\/api\/catalogues\/([^/]+)$/, ["type"], async (req, res, p) => {
      await authorize.requireAnyDmIfAuthRequired(req);
      const type = assertCatalogueType(p.type);
      const entries = await catalogues.list(type);
      sendJson(res, 200, { ok: true, type, entries });
    }),

    route("GET", /^\/api\/catalogues\/([^/]+)\/([^/]+)$/, ["type", "id"], async (req, res, p) => {
      await authorize.requireAnyDmIfAuthRequired(req);
      const type = assertCatalogueType(p.type);
      const id = assertSafeId(p.id, "entry id");
      const entry = await catalogues.get(type, id);
      if (!entry) return sendJson(res, 404, { ok: false, error: "Not found" });
      sendJson(res, 200, { ok: true, entry });
    }),

    route("PUT", /^\/api\/catalogues\/([^/]+)\/([^/]+)$/, ["type", "id"], async (req, res, p) => {
      await authorize.requireAnyDmIfAuthRequired(req);
      const type = assertCatalogueType(p.type);
      const id = assertSafeId(p.id, "entry id");
      const body = await readJsonBody(req);
      const entry = await catalogues.upsert(type, id, body || {});
      sendJson(res, 200, { ok: true, entry });
    }),

    route("DELETE", /^\/api\/catalogues\/([^/]+)\/([^/]+)$/, ["type", "id"], async (req, res, p) => {
      await authorize.requireAnyDmIfAuthRequired(req);
      const type = assertCatalogueType(p.type);
      const id = assertSafeId(p.id, "entry id");
      const removed = await catalogues.remove(type, id);
      await assets.deleteAsset("portraits", type, id).catch(() => false);
      await assets.deleteAsset("maps", type, id).catch(() => false);
      sendJson(res, 200, { ok: true, removed });
    }),

    route("GET", /^\/api\/campaigns$/, [], async (req, res) => {
      await authorize.requireAnyDmIfAuthRequired(req);
      const list = await campaigns.listCampaigns();
      sendJson(res, 200, { ok: true, campaigns: list });
    }),

    route("POST", /^\/api\/campaigns$/, [], async (req, res) => {
      const gate = await authorize.requireAnyDmIfAuthRequired(req);
      const body = await readJsonBody(req);
      const entry = await campaigns.createCampaign(body || {});
      if (auth.isAuthRequired() && db.isDbConfigured() && gate?.user?.id) {
        try {
          await campaigns.ensurePostgresCampaignAndDm(entry, gate.user.id);
        } catch (err) {
          await campaigns.removeCampaign(entry.id).catch(() => false);
          throw err;
        }
      }
      sendJson(res, 201, { ok: true, campaign: entry });
    }),

    route("PUT", /^\/api\/campaigns\/([^/]+)$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      await authorize.requireAnyDmIfAuthRequired(req);
      const body = await readJsonBody(req);
      const entry = await campaigns.upsertCampaign({ ...(body || {}), id });
      sendJson(res, 200, { ok: true, campaign: entry });
    }),

    route("GET", /^\/api\/campaigns\/([^/]+)$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      await authorize.requireDmIfAuthRequired(req, id);
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
      await authorize.requireDmIfAuthRequired(req, id);
      const body = await readJsonBody(req);
      const entry = await campaigns.updateCampaign(id, body || {});
      if (!entry) return sendJson(res, 404, { ok: false, error: "Not found" });
      sendJson(res, 200, { ok: true, campaign: entry });
    }),

    route("DELETE", /^\/api\/campaigns\/([^/]+)$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      await authorize.requireDmIfAuthRequired(req, id);
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
        await authorize.requireDmIfAuthRequired(req, id);
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
        await authorize.requireDmIfAuthRequired(req, id);
        const body = await readJsonBody(req);
        const document = await campaigns.putDocument(id, kind, body);
        sendJson(res, 200, { ok: true, kind, document });
      }
    ),

    route("GET", /^\/api\/campaigns\/([^/]+)\/maps$/, ["id"], async (req, res, p) => {
      const id = assertSafeId(p.id, "campaign id");
      await authorize.requireDmIfAuthRequired(req, id);
      const maps = await campaignMaps.listMaps(id);
      sendJson(res, 200, { ok: true, campaignId: id, maps });
    }),

    route(
      "POST",
      /^\/api\/campaigns\/([^/]+)\/maps\/import-uvtt$/,
      ["id"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        await authorize.requireDmIfAuthRequired(req, id);
        authorize.assertMutationSafety(req);
        /* Embedded map images routinely push UVTT JSON past the default 25MB cap. */
        const body = await readJsonBody(req, { limit: UVTT_BODY_LIMIT });
        const text = body?.text != null ? String(body.text) : body?.content != null ? String(body.content) : "";
        if (!text.trim()) {
          return sendJson(res, 400, { ok: false, error: "UVTT text/content required" });
        }
        const map = await campaignMaps.importUvtt(id, {
          text,
          filename: body?.filename || body?.name || null,
          name: body?.mapName || null
        });
        sendJson(res, 201, {
          ok: true,
          campaignId: id,
          map,
          summary: campaignMaps.toSummary(map)
        });
      }
    ),

    route(
      "GET",
      /^\/api\/campaigns\/([^/]+)\/maps\/([^/]+)\/image$/,
      ["id", "mapId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const mapId = assertSafeId(p.mapId, "map id");
        await authorize.requireDmIfAuthRequired(req, id);
        const asset = await campaignMaps.readMapImage(id, mapId);
        res.writeHead(200, {
          "Content-Type": asset.mime,
          "Content-Length": asset.buffer.length,
          "Cache-Control": "private, max-age=120"
        });
        res.end(asset.buffer);
      }
    ),

    route(
      "GET",
      /^\/api\/campaigns\/([^/]+)\/maps\/([^/]+)$/,
      ["id", "mapId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const mapId = assertSafeId(p.mapId, "map id");
        await authorize.requireDmIfAuthRequired(req, id);
        const map = await campaignMaps.getMap(id, mapId);
        if (!map) return sendJson(res, 404, { ok: false, error: "Map not found" });
        sendJson(res, 200, { ok: true, campaignId: id, map });
      }
    ),

    route(
      "PATCH",
      /^\/api\/campaigns\/([^/]+)\/maps\/([^/]+)$/,
      ["id", "mapId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const mapId = assertSafeId(p.mapId, "map id");
        await authorize.requireDmIfAuthRequired(req, id);
        authorize.assertMutationSafety(req);
        const body = await readJsonBody(req);
        const map = await campaignMaps.patchMap(id, mapId, body || {});
        sendJson(res, 200, { ok: true, campaignId: id, map, summary: campaignMaps.toSummary(map) });
      }
    ),

    route(
      "DELETE",
      /^\/api\/campaigns\/([^/]+)\/maps\/([^/]+)$/,
      ["id", "mapId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const mapId = assertSafeId(p.mapId, "map id");
        await authorize.requireDmIfAuthRequired(req, id);
        authorize.assertMutationSafety(req);
        await campaignMaps.deleteMap(id, mapId);
        sendJson(res, 200, { ok: true, removed: true });
      }
    ),

    route(
      "POST",
      /^\/api\/campaigns\/([^/]+)\/maps\/([^/]+)\/distance$/,
      ["id", "mapId"],
      async (req, res, p) => {
        const id = assertSafeId(p.id, "campaign id");
        const mapId = assertSafeId(p.mapId, "map id");
        await authorize.requireDmIfAuthRequired(req, id);
        authorize.assertMutationSafety(req);
        const map = await campaignMaps.getMap(id, mapId);
        if (!map) return sendJson(res, 404, { ok: false, error: "Map not found" });
        const body = await readJsonBody(req);
        const result = mapDistance.distanceBetween(body?.from, body?.to, map.scale || {}, {
          mode: body?.mode || "euclidean",
          snap: Boolean(body?.snap)
        });
        sendJson(res, 200, { ok: true, ...result });
      }
    ),

    route(
      "GET",
      /^\/api\/assets\/([^/]+)\/([^/]+)\/([^/]+)$/,
      ["kind", "type", "id"],
      async (req, res, p) => {
        await authorize.requireAnyDmIfAuthRequired(req);
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
        await authorize.requireAnyDmIfAuthRequired(req);
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
        await authorize.requireAnyDmIfAuthRequired(req);
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
        await authorize.requireAnyDmIfAuthRequired(req);
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
        await authorize.requireAnyDmIfAuthRequired(req);
        const type = assertCatalogueType(p.type);
        const id = assertSafeId(p.id, "entry id");
        const removed = await assets.deleteField(type, id, p.field);
        sendJson(res, 200, { ok: true, removed });
      }
    ),

    route("GET", /^\/api\/export$/, [], async (req, res) => {
      await authorize.requireAnyDmIfAuthRequired(req);
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
