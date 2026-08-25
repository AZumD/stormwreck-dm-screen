/**
 * Audio object storage abstraction for the Music catalogue.
 *
 * Backends:
 *   - local  — {DM_DATA_ROOT}/assets/audio/... (default; no Railway required)
 *   - s3     — S3-compatible bucket when AUDIO_S3_BUCKET is set
 *
 * API:
 *   put({ key, buffer, contentType })
 *   getStream(key) → { buffer, contentType, size } | null
 *   getPlaybackUrl(key, { ttlSec }) → absolute or same-origin URL hint
 *   delete(key)
 *   exists(key)
 */
"use strict";

const path = require("path");
const crypto = require("crypto");
const fsp = require("fs/promises");
const { dataRoot, writeBinaryAtomic, removeFile, pathExists, ensureDir } = require("./atomic-fs");

const AUDIO_KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,250}$/;

function assertAudioKey(key) {
  const k = String(key || "").trim();
  if (!k || k.includes("..") || k.includes("\\") || k.includes("\0") || !AUDIO_KEY_RE.test(k)) {
    const err = new Error("Invalid audio storage key");
    err.status = 400;
    throw err;
  }
  return k;
}

function s3Configured() {
  return Boolean(String(process.env.AUDIO_S3_BUCKET || "").trim());
}

function backendName() {
  return s3Configured() ? "s3" : "local";
}

/* ---------- Local filesystem ---------- */

function localPathForKey(key) {
  const safe = assertAudioKey(key);
  return path.join(dataRoot(), "assets", "audio", ...safe.split("/"));
}

async function localPut({ key, buffer, contentType }) {
  const filePath = localPathForKey(key);
  await ensureDir(path.dirname(filePath));
  await writeBinaryAtomic(filePath, buffer);
  return {
    key: assertAudioKey(key),
    backend: "local",
    contentType: contentType || "application/octet-stream",
    size: buffer.length
  };
}

async function localGetStream(key) {
  const filePath = localPathForKey(key);
  if (!(await pathExists(filePath))) return null;
  const buffer = await fsp.readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const contentType =
    ext === "mp3" || ext === "mpeg" ? "audio/mpeg" : ext === "ogg" ? "audio/ogg" : "application/octet-stream";
  return { buffer, contentType, size: buffer.length, backend: "local" };
}

async function localDelete(key) {
  const filePath = localPathForKey(key);
  if (!(await pathExists(filePath))) return false;
  return removeFile(filePath);
}

async function localExists(key) {
  return pathExists(localPathForKey(key));
}

function localPlaybackUrl(key) {
  /* Same-origin authenticated stream — caller maps key → catalogue id route. */
  return {
    mode: "proxy",
    key: assertAudioKey(key),
    backend: "local"
  };
}

/* ---------- Minimal S3-compatible (SigV4) ---------- */

function s3Env() {
  const bucket = String(process.env.AUDIO_S3_BUCKET || "").trim();
  const region = String(process.env.AUDIO_S3_REGION || "auto").trim() || "auto";
  const endpoint = String(process.env.AUDIO_S3_ENDPOINT || "").trim().replace(/\/$/, "");
  const accessKeyId = String(process.env.AUDIO_S3_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(process.env.AUDIO_S3_SECRET_ACCESS_KEY || "").trim();
  const forcePathStyle =
    String(process.env.AUDIO_S3_FORCE_PATH_STYLE || "1").trim() !== "0" &&
    String(process.env.AUDIO_S3_FORCE_PATH_STYLE || "1").toLowerCase() !== "false";
  if (!bucket || !accessKeyId || !secretAccessKey) {
    const err = new Error(
      "AUDIO_S3_BUCKET is set but AUDIO_S3_ACCESS_KEY_ID / AUDIO_S3_SECRET_ACCESS_KEY are missing"
    );
    err.status = 500;
    throw err;
  }
  return { bucket, region, endpoint, accessKeyId, secretAccessKey, forcePathStyle };
}

function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function amzDate(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function objectUrl(env, key) {
  const encKey = key
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  if (env.endpoint) {
    const host = env.endpoint.replace(/^https?:\/\//, "");
    const proto = env.endpoint.startsWith("http://") ? "http" : "https";
    if (env.forcePathStyle) return { url: `${proto}://${host}/${env.bucket}/${encKey}`, host };
    return { url: `${proto}://${env.bucket}.${host}/${encKey}`, host: `${env.bucket}.${host}` };
  }
  if (env.forcePathStyle) {
    const host = `s3.${env.region}.amazonaws.com`;
    return { url: `https://${host}/${env.bucket}/${encKey}`, host };
  }
  const host = `${env.bucket}.s3.${env.region}.amazonaws.com`;
  return { url: `https://${host}/${encKey}`, host };
}

function signHeaders(env, method, key, headers, bodyBuf, query = "") {
  const { amzDate: amz, dateStamp } = amzDate();
  const { host } = objectUrl(env, key);
  const payloadHash = sha256Hex(bodyBuf || Buffer.alloc(0));
  const canonicalHeaders = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amz,
    ...headers
  };
  const sortedHeaderKeys = Object.keys(canonicalHeaders)
    .map((h) => h.toLowerCase())
    .sort();
  const canonicalHeaderStr = sortedHeaderKeys.map((k) => `${k}:${String(canonicalHeaders[k]).trim()}\n`).join("");
  const signedHeaders = sortedHeaderKeys.join(";");
  const encKey = key
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  const canonicalUri = env.forcePathStyle || env.endpoint ? `/${env.bucket}/${encKey}` : `/${encKey}`;
  const canonicalRequest = [
    method,
    canonicalUri,
    query,
    canonicalHeaderStr,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${dateStamp}/${env.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amz, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${env.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, env.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${env.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return {
    Authorization: authorization,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amz,
    Host: host,
    ...headers
  };
}

async function s3Put({ key, buffer, contentType }) {
  const env = s3Env();
  const safeKey = assertAudioKey(key);
  const { url } = objectUrl(env, safeKey);
  const headers = signHeaders(
    env,
    "PUT",
    safeKey,
    { "content-type": contentType || "application/octet-stream" },
    buffer
  );
  const res = await fetch(url, { method: "PUT", headers, body: buffer });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`S3 put failed (${res.status}): ${text.slice(0, 200)}`);
    err.status = 502;
    throw err;
  }
  return {
    key: safeKey,
    backend: "s3",
    contentType: contentType || "application/octet-stream",
    size: buffer.length
  };
}

async function s3GetStream(key) {
  const env = s3Env();
  const safeKey = assertAudioKey(key);
  const { url } = objectUrl(env, safeKey);
  const headers = signHeaders(env, "GET", safeKey, {}, Buffer.alloc(0));
  const res = await fetch(url, { method: "GET", headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`S3 get failed (${res.status}): ${text.slice(0, 200)}`);
    err.status = 502;
    throw err;
  }
  const ab = await res.arrayBuffer();
  const buffer = Buffer.from(ab);
  const contentType = res.headers.get("content-type") || "audio/mpeg";
  return { buffer, contentType, size: buffer.length, backend: "s3" };
}

async function s3Delete(key) {
  const env = s3Env();
  const safeKey = assertAudioKey(key);
  const { url } = objectUrl(env, safeKey);
  const headers = signHeaders(env, "DELETE", safeKey, {}, Buffer.alloc(0));
  const res = await fetch(url, { method: "DELETE", headers });
  if (res.status === 404) return false;
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    const err = new Error(`S3 delete failed (${res.status}): ${text.slice(0, 200)}`);
    err.status = 502;
    throw err;
  }
  return true;
}

async function s3Exists(key) {
  const got = await s3GetStream(key);
  return !!got;
}

function s3SignedGetUrl(key, ttlSec = 120) {
  const env = s3Env();
  const safeKey = assertAudioKey(key);
  const expires = Math.max(30, Math.min(3600, Number(ttlSec) || 120));
  const { amzDate: amz, dateStamp } = amzDate();
  const { host, url: baseUrl } = objectUrl(env, safeKey);
  const credentialScope = `${dateStamp}/${env.region}/s3/aws4_request`;
  const credential = `${env.accessKeyId}/${credentialScope}`;
  const signedHeaders = "host";
  const queryParts = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(credential)}`,
    `X-Amz-Date=${amz}`,
    `X-Amz-Expires=${expires}`,
    `X-Amz-SignedHeaders=${signedHeaders}`
  ];
  const canonicalQuery = queryParts.slice().sort().join("&");
  const encKey = safeKey
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  const canonicalUri = env.forcePathStyle || env.endpoint ? `/${env.bucket}/${encKey}` : `/${encKey}`;
  const canonicalRequest = ["GET", canonicalUri, canonicalQuery, `host:${host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join(
    "\n"
  );
  const stringToSign = ["AWS4-HMAC-SHA256", amz, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${env.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, env.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
  const signedUrl = `${baseUrl}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  return {
    mode: "signed",
    url: signedUrl,
    expiresIn: expires,
    key: safeKey,
    backend: "s3"
  };
}

/* ---------- Public facade ---------- */

async function put(args) {
  return s3Configured() ? s3Put(args) : localPut(args);
}

async function getStream(key) {
  return s3Configured() ? s3GetStream(key) : localGetStream(key);
}

async function deleteObject(key) {
  return s3Configured() ? s3Delete(key) : localDelete(key);
}

async function exists(key) {
  return s3Configured() ? s3Exists(key) : localExists(key);
}

function getPlaybackUrl(key, opts = {}) {
  return s3Configured() ? s3SignedGetUrl(key, opts.ttlSec) : localPlaybackUrl(key);
}

function generateObjectKey(entryId, ext = "mp3") {
  const id = String(entryId || "track")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 64) || "track";
  const rand = crypto.randomBytes(8).toString("hex");
  const safeExt = String(ext || "mp3").replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp3";
  return `music/${id}/${rand}.${safeExt}`;
}

module.exports = {
  put,
  getStream,
  delete: deleteObject,
  exists,
  getPlaybackUrl,
  generateObjectKey,
  assertAudioKey,
  backendName,
  s3Configured,
  /* test hooks */
  _localPathForKey: localPathForKey,
  _s3Configured: s3Configured
};
