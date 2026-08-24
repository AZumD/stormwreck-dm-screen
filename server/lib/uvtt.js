/**
 * Universal VTT (.dd2vtt / .uvtt) parse → normalized Stormwreck map model.
 * Runtime never depends on Dungeondraft JSON shape.
 */
"use strict";

function err(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function asNum(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asPoint(p) {
  if (!p || typeof p !== "object") return null;
  const x = asNum(p.x);
  const y = asNum(p.y);
  if (x == null || y == null) return null;
  return { x, y };
}

function asPolyline(raw) {
  if (!Array.isArray(raw)) return null;
  const pts = raw.map(asPoint).filter(Boolean);
  return pts.length >= 2 ? pts : null;
}

function asPolylineList(raw, source) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  raw.forEach((poly, index) => {
    const points = asPolyline(poly);
    if (!points) return;
    out.push({
      id: `${source}-${index}`,
      source,
      points
    });
  });
  return out;
}

function decodeImageBuffer(imageField) {
  if (imageField == null || imageField === "") {
    throw err("UVTT file is missing embedded image data");
  }
  let raw = String(imageField).trim();
  let mime = "image/png";
  const dataUrl = raw.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (dataUrl) {
    mime = (dataUrl[1] || "image/png").trim().toLowerCase();
    raw = dataUrl[3] || "";
    if (!dataUrl[2]) {
      throw err("UVTT image data URL must be base64-encoded");
    }
  }
  let buffer;
  try {
    buffer = Buffer.from(raw.replace(/\s+/g, ""), "base64");
  } catch {
    throw err("UVTT image is not valid base64");
  }
  if (!buffer.length) throw err("UVTT embedded image is empty");
  /* PNG / WEBP / JPEG magic */
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isWebp =
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  if (!isPng && !isJpeg && !isWebp) {
    throw err("UVTT embedded image must be PNG, JPEG, or WEBP");
  }
  if (isJpeg) mime = "image/jpeg";
  else if (isWebp) mime = "image/webp";
  else mime = "image/png";
  const ext = isJpeg ? "jpg" : isWebp ? "webp" : "png";
  return { buffer, mime, ext };
}

function normalizePortals(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p, index) => {
      if (!p || typeof p !== "object") return null;
      const position = asPoint(p.position) || { x: 0, y: 0 };
      const bounds = Array.isArray(p.bounds)
        ? p.bounds.map(asPoint).filter(Boolean)
        : [];
      return {
        id: `portal-${index}`,
        position,
        bounds,
        rotation: asNum(p.rotation, 0),
        closed: Boolean(p.closed),
        freestanding: Boolean(p.freestanding)
      };
    })
    .filter(Boolean);
}

function normalizeLights(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l, index) => {
      if (!l || typeof l !== "object") return null;
      const position = asPoint(l.position);
      if (!position) return null;
      return {
        id: `light-${index}`,
        position,
        range: asNum(l.range, 0),
        intensity: asNum(l.intensity, 1),
        color: l.color != null ? String(l.color) : "#ffffff",
        shadows: l.shadows != null ? Boolean(l.shadows) : true
      };
    })
    .filter(Boolean);
}

/**
 * @param {unknown} raw Parsed UVTT JSON
 * @param {{ sourceFormat?: string, name?: string, mapId?: string }} [opts]
 */
function normalizeUvtt(raw, opts = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw err("UVTT payload must be a JSON object");
  }

  const resolution = raw.resolution;
  if (!resolution || typeof resolution !== "object") {
    throw err("UVTT missing resolution block");
  }

  const pixelsPerGrid = asNum(resolution.pixels_per_grid);
  if (pixelsPerGrid == null || pixelsPerGrid <= 0) {
    throw err("UVTT resolution.pixels_per_grid must be a positive number");
  }

  const mapSize = resolution.map_size || {};
  const sizeX = asNum(mapSize.x);
  const sizeY = asNum(mapSize.y);
  if (sizeX == null || sizeY == null || sizeX <= 0 || sizeY <= 0) {
    throw err("UVTT resolution.map_size.x/y must be positive numbers");
  }

  const origin = asPoint(resolution.map_origin) || { x: 0, y: 0 };
  const image = decodeImageBuffer(raw.image);

  const wallsFromLos = asPolylineList(raw.line_of_sight, "line_of_sight");
  const wallsFromObjects = asPolylineList(raw.objects_line_of_sight, "objects_line_of_sight");
  const walls = [...wallsFromLos, ...wallsFromObjects];
  const portals = normalizePortals(raw.portals);
  const lights = normalizeLights(raw.lights);

  const widthPx = Math.round(sizeX * pixelsPerGrid);
  const heightPx = Math.round(sizeY * pixelsPerGrid);

  const name =
    String(opts.name || raw.name || raw.title || "Imported map").trim() || "Imported map";

  return {
    map: {
      name,
      kind: "uvtt",
      sourceFormat: opts.sourceFormat || "uvtt",
      widthPx,
      heightPx,
      grid: {
        type: "square",
        sizeX,
        sizeY,
        pixelsPerGrid,
        origin
      },
      scale: {
        distancePerGrid: 5,
        unit: "ft"
      },
      display: {
        showGrid: true,
        snapToGrid: false
      },
      geometry: {
        walls,
        portals,
        lights
      },
      import: {
        formatVersion: raw.format != null ? Number(raw.format) : null,
        environment:
          raw.environment && typeof raw.environment === "object"
            ? {
                bakedLighting: Boolean(raw.environment.baked_lighting),
                ambientLight: raw.environment.ambient_light || null
              }
            : null,
        stats: {
          walls: walls.length,
          wallsLineOfSight: wallsFromLos.length,
          wallsObjectsLos: wallsFromObjects.length,
          portals: portals.length,
          lights: lights.length
        }
      }
    },
    image
  };
}

/**
 * Parse UVTT text (file contents). Accepts .dd2vtt / .uvtt JSON.
 */
function parseUvttText(text, opts = {}) {
  let raw;
  try {
    raw = JSON.parse(String(text || ""));
  } catch {
    throw err("Malformed UVTT JSON");
  }
  return normalizeUvtt(raw, opts);
}

module.exports = {
  parseUvttText,
  normalizeUvtt,
  decodeImageBuffer
};
