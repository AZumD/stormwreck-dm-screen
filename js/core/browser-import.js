/**
 * Non-destructive import of legacy browser localStorage + IndexedDB into /data.
 */
window.BrowserDataImport = (function () {
  "use strict";

  const CATALOGUE_TYPES = [
    "pc",
    "npc",
    "race",
    "class",
    "skill",
    "feature",
    "spell",
    "item",
    "monster",
    "location"
  ];

  function emptyReport() {
    return {
      catalogueEntries: 0,
      skipped: 0,
      campaigns: 0,
      campaignDocs: 0,
      chronicleSessions: 0,
      images: 0,
      errors: []
    };
  }

  function parseJson(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /** Do not overwrite newer or existing file-backed data blindly */
  function shouldWrite(existing, incoming) {
    if (existing == null) return true;
    if (incoming == null) return false;
    const eAt = Number(existing.updatedAt) || 0;
    const iAt = Number(incoming.updatedAt) || 0;
    if (iAt && eAt && iAt > eAt) return true;
    if (!eAt && iAt) return true;
    if (typeof existing === "object" && Object.keys(existing).length === 0) return true;
    return false;
  }

  function discoverCampaignIds() {
    const ids = new Set(["stormwreck-isle"]);
    const reg = parseJson(localStorage.getItem("dm-campaigns"), null);
    (reg?.campaigns || []).forEach((c) => {
      if (c?.id) ids.add(c.id);
    });
    const suffixes = [
      "-campaign-state",
      "-chronicle",
      "-scene-meta",
      "-section-edits",
      "-section-structure",
      "-notes",
      "-checklist",
      "-session",
      "-active-map",
      "-pin-positions",
      "-custom-pins"
    ];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      for (const suffix of suffixes) {
        if (key.endsWith(suffix)) {
          ids.add(key.slice(0, -suffix.length));
          break;
        }
      }
    }
    return [...ids].filter(Boolean);
  }

  function buildMapState(campaignId) {
    return {
      activeMap: localStorage.getItem(`${campaignId}-active-map`) || null,
      filters: parseJson(localStorage.getItem(`${campaignId}-map-filters`), null),
      pinPositions: parseJson(localStorage.getItem(`${campaignId}-pin-positions`), {}) || {},
      partyPositions: parseJson(localStorage.getItem(`${campaignId}-party-positions`), {}) || {},
      customPins: parseJson(localStorage.getItem(`${campaignId}-custom-pins`), {}) || {}
    };
  }

  function buildPrefs(campaignId) {
    return {
      session: localStorage.getItem(`${campaignId}-session`) || "1",
      viewMode: localStorage.getItem(`${campaignId}-view-mode`) || "play",
      notes: localStorage.getItem(`${campaignId}-notes`) || "",
      checklist: parseJson(localStorage.getItem(`${campaignId}-checklist`), {}) || {},
      sidebarCollapsed: localStorage.getItem(`${campaignId}-sidebar-collapsed`) === "1",
      mapPanelCollapsed: localStorage.getItem(`${campaignId}-map-panel-collapsed`) === "1",
      sceneTrayCollapsed: localStorage.getItem(`${campaignId}-scene-tray-collapsed`) === "1",
      chronicleSessionOrder:
        localStorage.getItem(`${campaignId}-chronicle-session-order`) === "oldest" ? "oldest" : "newest"
    };
  }

  async function putDocIfNeeded(campaignId, kind, incoming, report) {
    if (incoming == null) return;
    if (typeof incoming === "object" && !Array.isArray(incoming) && !Object.keys(incoming).length) return;
    try {
      const existing = await LocalApiClient.getCampaignDocument(campaignId, kind);
      if (!shouldWrite(existing, incoming)) {
        report.skipped += 1;
        return;
      }
      await LocalApiClient.putCampaignDocument(campaignId, kind, incoming);
      report.campaignDocs += 1;
      if (kind === "chronicle" && incoming.sessions) {
        report.chronicleSessions += Object.keys(incoming.sessions).length;
      }
    } catch (err) {
      report.errors.push(`${campaignId}/${kind}: ${err.message}`);
    }
  }

  async function importRegistry(report) {
    const reg = parseJson(localStorage.getItem("dm-campaigns"), null);
    const list = Array.isArray(reg?.campaigns) ? reg.campaigns : [];
    for (const c of list) {
      if (!c?.id || !c.title || c.id === "stormwreck-isle") continue;
      try {
        const existingList = await LocalApiClient.listCampaigns();
        const existing = existingList.find((x) => x.id === c.id);
        if (existing && !shouldWrite(existing, c)) {
          report.skipped += 1;
          continue;
        }
        await LocalApiClient.upsertCampaign(c.id, c);
        report.campaigns += 1;
      } catch (err) {
        report.errors.push(`campaign ${c.id}: ${err.message}`);
      }
    }
  }

  async function importCatalogues(report) {
    for (const type of CATALOGUE_TYPES) {
      const entries = parseJson(localStorage.getItem(`catalogue-${type}`), []);
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        if (!entry?.id) continue;
        try {
          const existing = await LocalApiClient.getCatalogue(type, entry.id);
          if (!shouldWrite(existing, entry)) {
            report.skipped += 1;
            continue;
          }
          const toSave = { ...entry };
          if (window.CatalogueImages) {
            for (const field of CatalogueImages.IMAGE_FIELDS) {
              let v = toSave[field];
              if (v === CatalogueImages.MARKER) {
                v = CatalogueImages.getSync(type, entry.id, field) || "";
              }
              if (CatalogueImages.isDataUrl(v)) {
                const result = await LocalApiClient.putCatalogueAsset(type, entry.id, field, v);
                toSave[field] = result.url;
                report.images += 1;
              }
            }
          }
          await LocalApiClient.putCatalogue(type, entry.id, toSave);
          report.catalogueEntries += 1;
        } catch (err) {
          report.errors.push(`${type}/${entry.id}: ${err.message}`);
        }
      }
    }
  }

  async function importIdbImages(report) {
    if (!window.CatalogueImages?.exportAllIdb) return;
    try {
      await CatalogueImages.preload(CATALOGUE_TYPES);
      const rows = await CatalogueImages.exportAllIdb();
      for (const row of rows) {
        if (!row?.type || !row?.entryId || !row?.field || !row.dataUrl) continue;
        try {
          const existing = await LocalApiClient.getCatalogue(row.type, row.entryId);
          if (existing?.[row.field] && String(existing[row.field]).startsWith("/api/assets/")) {
            report.skipped += 1;
            continue;
          }
          const result = await LocalApiClient.putCatalogueAsset(
            row.type,
            row.entryId,
            row.field,
            row.dataUrl
          );
          report.images += 1;
          if (existing) {
            await LocalApiClient.putCatalogue(row.type, row.entryId, {
              ...existing,
              [row.field]: result.url,
              updatedAt: Date.now()
            });
          }
        } catch (err) {
          report.errors.push(`image ${row.type}/${row.entryId}/${row.field}: ${err.message}`);
        }
      }
    } catch (err) {
      report.errors.push(`IndexedDB: ${err.message}`);
    }
  }

  async function importCampaignDocs(report) {
    for (const campaignId of discoverCampaignIds()) {
      await putDocIfNeeded(
        campaignId,
        "campaign-state",
        parseJson(localStorage.getItem(`${campaignId}-campaign-state`), null),
        report
      );
      await putDocIfNeeded(
        campaignId,
        "chronicle",
        parseJson(localStorage.getItem(`${campaignId}-chronicle`), null),
        report
      );
      await putDocIfNeeded(
        campaignId,
        "scene-meta",
        parseJson(localStorage.getItem(`${campaignId}-scene-meta`), null),
        report
      );
      await putDocIfNeeded(
        campaignId,
        "section-edits",
        parseJson(localStorage.getItem(`${campaignId}-section-edits`), null),
        report
      );
      await putDocIfNeeded(
        campaignId,
        "section-structure",
        parseJson(localStorage.getItem(`${campaignId}-section-structure`), null),
        report
      );
      const notesRaw = localStorage.getItem(`${campaignId}-notes`);
      if (notesRaw != null && notesRaw !== "") {
        await putDocIfNeeded(campaignId, "notes", { text: notesRaw }, report);
      }
      await putDocIfNeeded(
        campaignId,
        "checklist",
        parseJson(localStorage.getItem(`${campaignId}-checklist`), null),
        report
      );
      await putDocIfNeeded(campaignId, "map-state", buildMapState(campaignId), report);
      await putDocIfNeeded(campaignId, "prefs", buildPrefs(campaignId), report);
    }
  }

  async function run() {
    const report = emptyReport();
    if (!window.LocalApiClient) {
      report.errors.push("LocalApiClient missing");
      return report;
    }
    const ok = await LocalApiClient.ready();
    if (!ok) {
      report.errors.push("Local API unavailable — start the server with npm start");
      return report;
    }
    await importRegistry(report);
    await importCatalogues(report);
    await importIdbImages(report);
    await importCampaignDocs(report);
    return report;
  }

  return { run, discoverCampaignIds, CATALOGUE_TYPES };
})();
