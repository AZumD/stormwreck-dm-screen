"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dmHtml = fs.readFileSync(path.join(root, "dm", "index.html"), "utf8");
const redirectHtml = fs.readFileSync(path.join(root, "compendium", "index.html"), "utf8");

const hrefMatch = dmHtml.match(/<a class="library-tool-card" href="([^"]+)"[^>]*>\s*<span class="library-tool-card__title">Compendium<\/span>/);
assert.ok(hrefMatch, "DM Library exposes a Compendium card");

const href = hrefMatch[1];
const fromSlash = new URL(href, "https://example.test/dm/").pathname;
const fromNoSlash = new URL(href, "https://example.test/dm").pathname;

assert.strictEqual(fromSlash, "/dm/compendium/", "Compendium link resolves normally from /dm/");

if (fromNoSlash !== "/dm/compendium/") {
  assert.strictEqual(fromNoSlash, "/compendium/", "known no-trailing-slash fallback resolves to compatibility route");
  assert.match(redirectHtml, /\/dm\/compendium\//, "compatibility route redirects to canonical Compendium URL");
  assert.match(redirectHtml, /location\.replace/, "compatibility redirect preserves query/hash in script");
}

console.log("Compendium route validation passed");
