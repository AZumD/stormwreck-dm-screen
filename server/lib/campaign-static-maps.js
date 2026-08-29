/**
 * Load static map pin definitions from js/campaigns/{id}/maps.js (same source as DM client).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const cache = new Map();

function projectRoot() {
  return path.join(__dirname, "..", "..");
}

function loadCampaignStaticMaps(campaignId) {
  const safe = String(campaignId || "").trim();
  if (!safe) return {};
  if (cache.has(safe)) return cache.get(safe);

  const file = path.join(projectRoot(), "js", "campaigns", safe, "maps.js");
  if (!fs.existsSync(file)) {
    cache.set(safe, {});
    return {};
  }

  try {
    const src = fs.readFileSync(file, "utf8");
    const m = src.match(/const\s+MAPS\s*=\s*(\{[\s\S]*?\n\});/);
    if (!m) {
      cache.set(safe, {});
      return {};
    }
    const maps = Function(`"use strict"; return (${m[1]});`)();
    cache.set(safe, maps && typeof maps === "object" ? maps : {});
    return cache.get(safe);
  } catch {
    cache.set(safe, {});
    return {};
  }
}

function pinsForMap(campaignId, mapId) {
  const maps = loadCampaignStaticMaps(campaignId);
  const def = maps[mapId];
  return Array.isArray(def?.pins) ? def.pins : [];
}

module.exports = {
  loadCampaignStaticMaps,
  pinsForMap,
  _clearCache: () => cache.clear()
};
