"use strict";

const assert = require("assert");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { syncMissingCatalogueSeeds } = require("../server/lib/catalogue-seed-sync");

(async () => {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "stormwreck-catalogue-seed-"));
  const source = path.join(tmp, "source");
  const dest = path.join(tmp, "dest");

  try {
    await fsp.mkdir(path.join(source, "race"), { recursive: true });
    await fsp.mkdir(path.join(source, "spell"), { recursive: true });
    await fsp.mkdir(path.join(dest, "race"), { recursive: true });

    await fsp.writeFile(
      path.join(source, "race", "race-existing.json"),
      JSON.stringify({ id: "race-existing", name: "Bundled version" }),
      "utf8"
    );
    await fsp.writeFile(
      path.join(dest, "race", "race-existing.json"),
      JSON.stringify({ id: "race-existing", name: "Live edited version" }),
      "utf8"
    );
    await fsp.writeFile(
      path.join(source, "spell", "spell-new.json"),
      JSON.stringify({ id: "spell-new", name: "New bundled spell" }),
      "utf8"
    );

    /* Also prove manifest seeds never clobber an existing live entry. */
    await fsp.writeFile(
      path.join(dest, "race", "race-aarakocra.json"),
      JSON.stringify({ id: "race-aarakocra", name: "My edited Aarakocra", custom: true }),
      "utf8"
    );

    const result = await syncMissingCatalogueSeeds({ sourceRoot: source, destRoot: dest });
    assert.ok(result.seeded > 0, "sync adds missing seed entries");
    assert.ok(result.skipped > 0, "sync reports existing entries as skipped");

    const existing = JSON.parse(await fsp.readFile(path.join(dest, "race", "race-existing.json"), "utf8"));
    assert.strictEqual(existing.name, "Live edited version", "repo seed never overwrites a live edit");

    const aarakocra = JSON.parse(await fsp.readFile(path.join(dest, "race", "race-aarakocra.json"), "utf8"));
    assert.strictEqual(aarakocra.custom, true, "manifest seed never overwrites a live edit");

    const copied = JSON.parse(await fsp.readFile(path.join(dest, "spell", "spell-new.json"), "utf8"));
    assert.strictEqual(copied.name, "New bundled spell", "new repo catalogue files are copied to persistent data");

    const feat = JSON.parse(await fsp.readFile(path.join(dest, "feature", "feature-feat-alert.json"), "utf8"));
    assert.strictEqual(feat.name, "Alert", "creator seed manifest materializes missing Compendium entries");

    const background = JSON.parse(
      await fsp.readFile(path.join(dest, "background", "background-acolyte.json"), "utf8")
    );
    assert.strictEqual(background.name, "Acolyte", "background seed manifest materializes the Background catalogue");

    const gardenFeature = JSON.parse(
      await fsp.readFile(path.join(dest, "feature", "feature-rage.json"), "utf8")
    );
    assert.strictEqual(gardenFeature.name, "Rage", "Compendium garden materializes reusable Feature entries");
    assert.ok(
      gardenFeature.summary && gardenFeature.description,
      "garden Feature entries include useful reference content"
    );

    const expandedSpecies = JSON.parse(
      await fsp.readFile(path.join(dest, "race", "race-grung.json"), "utf8")
    );
    assert.strictEqual(expandedSpecies.name, "Grung", "species expansion materializes missing playable species");

    const elementalLineage = JSON.parse(
      await fsp.readFile(path.join(dest, "race", "subspecies-genasi-air.json"), "utf8")
    );
    assert.strictEqual(
      elementalLineage.parentSpeciesRef,
      "@race:race-genasi|Genasi",
      "expanded lineages keep canonical parent species references"
    );

    const goblin = JSON.parse(
      await fsp.readFile(path.join(dest, "monster", "monster-goblin.json"), "utf8")
    );
    assert.strictEqual(goblin.cr, "1/4", "generic SRD bestiary materializes usable monster stats");
    assert.strictEqual(
      goblin.source,
      "SRD 5.1 (CC BY 4.0)",
      "generic bestiary keeps open-content provenance in the catalogue entry"
    );

    const redDragon = JSON.parse(
      await fsp.readFile(path.join(dest, "monster", "monster-young-red-dragon.json"), "utf8")
    );
    assert.ok(
      redDragon.actions.includes("2d10+6 piercing plus 1d6 fire"),
      "dragon quick references preserve separate physical and elemental damage dice"
    );

    console.log("catalogue seed sync validation passed");
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true });
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
