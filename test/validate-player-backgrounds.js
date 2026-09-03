"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const player = require(path.join(root, "server", "lib", "player.js"));
const backgrounds = require(path.join(root, "server", "lib", "player-background-library.js"));

assert.ok(player.PLAYER_LIBRARY_BROWSE_TYPES.has("background"), "players may browse Backgrounds");
assert.ok(player.PLAYER_CATALOGUE_TYPES.has("background"), "players may resolve Background details");
assert.ok(player.LIBRARY_ATTACH_ACTIONS.has("background"), "Background is a valid library attach action");

assert.strictEqual(
  backgrounds.formatBackgroundRef("background-haunted-one", "Haunted One"),
  "@background:background-haunted-one|Haunted One",
  "Background attach uses canonical entity refs"
);
assert.deepStrictEqual(
  backgrounds.withBackgroundAction({ type: "background", id: "background-sage", actions: [] }).actions,
  ["background"],
  "Background DTOs expose the Set background action"
);
assert.deepStrictEqual(
  backgrounds.withBackgroundAction({ type: "spell", id: "spell-guidance", actions: ["spell"] }).actions,
  ["spell"],
  "non-Background DTOs are left alone"
);

const serverIndex = fs.readFileSync(path.join(root, "server", "index.js"), "utf8");
assert.ok(
  serverIndex.includes('require("./lib/player-background-library")'),
  "server installs Background Player Library support before serving requests"
);

const typesSource = fs.readFileSync(path.join(root, "js", "core", "catalogue", "types.js"), "utf8");
assert.ok(typesSource.includes('id: "background"'), "Background remains a registered catalogue entity type");
assert.ok(
  typesSource.includes("/js/player-backgrounds.js"),
  "Player Companion loads its Background UI extension from the shared catalogue registry"
);

const clientSource = fs.readFileSync(path.join(root, "js", "player-backgrounds.js"), "utf8");
[
  'data-library-type=\"background\"',
  'data-library-attach=\"background\"',
  "Set background",
  "Background ·",
  "backgroundRef",
  "patchSheet",
  "libraryAttach"
].forEach((needle) => {
  assert.ok(clientSource.includes(needle), `Player Background extension includes ${needle}`);
});

const playerSource = fs.readFileSync(path.join(root, "server", "lib", "player.js"), "utf8");
assert.ok(
  /PLAYER_SHEET_WHITELIST[\s\S]*?"background"/.test(playerSource),
  "Background remains writable on player character sheets"
);

console.log("player Background catalogue validation passed");
