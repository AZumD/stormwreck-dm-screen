(function () {
  "use strict";

  const STORAGE_KEY = "stormwreck-character-creator-v1";
  const api = window.PlayerApiClient || null;
  const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
  const ABILITY_NAMES = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
  const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
  const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

  const STEPS = [
    ["start", "Getting Started", "◈"], ["class", "Class", "⚔"], ["species", "Species", "◎"],
    ["background", "Background", "◇"], ["abilities", "Abilities", "✦"], ["feats", "Feats", "✧"],
    ["spells", "Spells", "✺"], ["equipment", "Equipment", "▣"], ["identity", "Identity", "♙"],
    ["about", "About", "◌"], ["review", "Review", "✓"]
  ];

  const CLASSES = [
    ["Barbarian", "Strength", "Low", false], ["Bard", "Charisma", "High", true], ["Cleric", "Wisdom", "Average", true],
    ["Druid", "Wisdom", "High", true], ["Fighter", "Strength / Dexterity", "Average", false], ["Monk", "Dexterity / Wisdom", "High", false],
    ["Paladin", "Strength / Charisma", "Average", true], ["Ranger", "Dexterity / Wisdom", "Average", true], ["Rogue", "Dexterity", "Average", false],
    ["Sorcerer", "Charisma", "High", true], ["Warlock", "Charisma", "High", true], ["Wizard", "Intelligence", "High", true]
  ];

  const SPECIES = [
    { name: "Aasimar", rules: ["2024"] },
    { name: "Dragonborn", rules: ["2014", "2024"], bonus2014: { str: 2, cha: 1 } },
    { name: "Dwarf", rules: ["2014", "2024"], bonus2014: { con: 2 } },
    { name: "Elf", rules: ["2014", "2024"], bonus2014: { dex: 2 } },
    { name: "Gnome", rules: ["2014", "2024"], bonus2014: { int: 2 } },
    { name: "Goliath", rules: ["2024"] },
    { name: "Half-Elf", rules: ["2014"], bonus2014: { cha: 2 } },
    { name: "Half-Orc", rules: ["2014"], bonus2014: { str: 2, con: 1 } },
    { name: "Halfling", rules: ["2014", "2024"], bonus2014: { dex: 2 } },
    { name: "Human", rules: ["2014", "2024"], bonus2014: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 } },
    { name: "Orc", rules: ["2024"] },
    { name: "Tiefling", rules: ["2014", "2024"], bonus2014: { int: 1, cha: 2 } }
  ];

  const BACKGROUNDS = [
    { name: "Acolyte", rules: ["2014", "2024"], abilities: ["int", "wis", "cha"], feat: "Magic Initiate (Cleric)" },
    { name: "Artisan", rules: ["2024"], abilities: ["str", "dex", "int"], feat: "Crafter" },
    { name: "Charlatan", rules: ["2014", "2024"], abilities: ["dex", "con", "cha"], feat: "Skilled" },
    { name: "Criminal", rules: ["2014", "2024"], abilities: ["dex", "con", "int"], feat: "Alert" },
    { name: "Entertainer", rules: ["2014", "2024"], abilities: ["str", "dex", "cha"], feat: "Musician" },
    { name: "Farmer", rules: ["2024"], abilities: ["str", "con", "wis"], feat: "Tough" },
    { name: "Folk Hero", rules: ["2014"] },
    { name: "Guard", rules: ["2024"], abilities: ["str", "int", "wis"], feat: "Alert" },
    { name: "Guide", rules: ["2024"], abilities: ["dex", "con", "wis"], feat: "Magic Initiate (Druid)" },
    { name: "Guild Artisan", rules: ["2014"] },
    { name: "Hermit", rules: ["2014", "2024"], abilities: ["con", "wis", "cha"], feat: "Healer" },
    { name: "Merchant", rules: ["2024"], abilities: ["con", "int", "cha"], feat: "Lucky" },
    { name: "Noble", rules: ["2014", "2024"], abilities: ["str", "int", "cha"], feat: "Skilled" },
    { name: "Outlander", rules: ["2014"] },
    { name: "Sage", rules: ["2014", "2024"], abilities: ["con", "int", "wis"], feat: "Magic Initiate (Wizard)" },
    { name: "Sailor", rules: ["2014", "2024"], abilities: ["str", "dex", "wis"], feat: "Tavern Brawler" },
    { name: "Scribe", rules: ["2024"], abilities: ["dex", "int", "wis"], feat: "Skilled" },
    { name: "Soldier", rules: ["2014", "2024"], abilities: ["str", "dex", "con"], feat: "Savage Attacker" },
    { name: "Urchin", rules: ["2014"] },
    { name: "Wayfarer", rules: ["2024"], abilities: ["dex", "wis", "cha"], feat: "Lucky" }
  ];

  const FEATS = ["Alert", "Crafter", "Healer", "Lucky", "Magic Initiate (Cleric)", "Magic Initiate (Druid)", "Magic Initiate (Wizard)", "Musician", "Savage Attacker", "Skilled", "Tavern Brawler", "Tough"];
  const SPELLS = ["Guidance", "Light", "Mage Hand", "Minor Illusion", "Prestidigitation", "Sacred Flame", "Thaumaturgy", "Druidcraft", "Fire Bolt", "Ray of Frost", "Healing Word", "Cure Wounds", "Shield", "Magic Missile", "Sleep", "Entangle", "Bless", "Detect Magic"];
  const EQUIPMENT = ["Class equipment", "Adventurer's pack", "Explorer's pack", "Scholar's pack", "Priest's pack", "Burglar's pack", "Custom / decide later"];

  const els = {
    steps: document.getElementById("creator-steps"), content: document.getElementById("creator-content"),
    prev: document.getElementById("creator-prev"), next: document.getElementById("creator-next"), progress: document.getElementById("creator-progress"),
    saveState: document.getElementById("creator-save-state"), reset: document.getElementById("creator-reset"), resetDialog: document.getElementById("creator-confirm-reset")
  };

  function defaultState() {
    return {
      step: 0, ruleset: "2024", className: "", classComplexity: "all", species: "", background: "",
      bonusSource: "2024", abilityMethod: "standard", abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      standardAssignments: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }, rolls: [],
      backgroundBonuses: { primary: "", secondary: "" }, feat: "", spells: [], equipment: "Class equipment",
      name: "", level: 1, alignment: "", pronouns: "", appearance: "", personality: "", ideals: "", bonds: "", flaws: "", notes: "",
      createdCharacterId: "", saveMessage: "", saveError: ""
    };
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw || typeof raw !== "object") return defaultState();
      return Object.assign(defaultState(), raw, { abilities: Object.assign(defaultState().abilities, raw.abilities || {}), standardAssignments: Object.assign(defaultState().standardAssignments, raw.standardAssignments || {}), backgroundBonuses: Object.assign(defaultState().backgroundBonuses, raw.backgroundBonuses || {}) });
    } catch { return defaultState(); }
  }

  let state = loadState();
  let saveTimer = null;

  function esc(v) { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function cap(v) { return String(v || "").charAt(0).toUpperCase() + String(v || "").slice(1); }
  function mod(score) { return Math.floor((Number(score || 10) - 10) / 2); }
  function modText(score) { const n = mod(score); return n >= 0 ? `+${n}` : String(n); }
  function selected(a, b) { return a === b ? " is-selected" : ""; }
  function active(a, b) { return a === b ? " is-active" : ""; }
  function checked(a, b) { return a === b ? " checked" : ""; }

  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        if (els.saveState) els.saveState.textContent = "Draft saved locally";
      } catch {
        if (els.saveState) els.saveState.textContent = "Could not save draft";
      }
    }, 80);
  }

  function setState(patch, rerender = true) {
    Object.assign(state, patch);
    saveDraft();
    if (rerender) render();
  }

  function currentSpecies() { return SPECIES.find((x) => x.name === state.species) || null; }
  function currentBackground() { return BACKGROUNDS.find((x) => x.name === state.background) || null; }
  function currentClass() { return CLASSES.find((x) => x[0] === state.className) || null; }
  function isCaster() { return Boolean(currentClass()?.[3]); }

  function visibleByRules(item) {
    if (state.ruleset === "both") return true;
    return item.rules.includes(state.ruleset);
  }

  function abilityBonuses() {
    const out = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    const use2014 = state.ruleset === "2014" || (state.ruleset === "both" && state.bonusSource === "2014");
    if (use2014) {
      const species = currentSpecies();
      Object.entries(species?.bonus2014 || {}).forEach(([k, v]) => { out[k] += v; });
      return out;
    }
    const bg = currentBackground();
    if (!bg?.abilities?.length) return out;
    const primary = state.backgroundBonuses.primary && bg.abilities.includes(state.backgroundBonuses.primary) ? state.backgroundBonuses.primary : bg.abilities[0];
    const secondaryDefault = bg.abilities.find((x) => x !== primary) || bg.abilities[1];
    const secondary = state.backgroundBonuses.secondary && bg.abilities.includes(state.backgroundBonuses.secondary) && state.backgroundBonuses.secondary !== primary ? state.backgroundBonuses.secondary : secondaryDefault;
    if (primary) out[primary] += 2;
    if (secondary) out[secondary] += 1;
    return out;
  }

  function finalAbilities() {
    const bonuses = abilityBonuses();
    return Object.fromEntries(ABILITIES.map((k) => [k, Math.max(1, Number(state.abilities[k] || 10) + Number(bonuses[k] || 0))]));
  }

  function pointBuySpent() { return ABILITIES.reduce((sum, k) => sum + (POINT_COST[Number(state.abilities[k])] ?? 99), 0); }

  function stepComplete(id) {
    if (id === "start") return Boolean(state.ruleset);
    if (id === "class") return Boolean(state.className);
    if (id === "species") return Boolean(state.species);
    if (id === "background") return Boolean(state.background);
    if (id === "abilities") return ABILITIES.every((k) => Number.isFinite(Number(state.abilities[k])));
    if (id === "identity") return Boolean(state.name.trim());
    if (id === "review") return Boolean(state.createdCharacterId);
    return true;
  }

  function renderSteps() {
    els.steps.innerHTML = STEPS.map(([id, label, icon], i) => `<button type="button" class="creator-step${i === state.step ? " is-active" : ""}${stepComplete(id) ? " is-complete" : ""}" data-go-step="${i}"><span class="creator-step__icon">${icon}</span><span class="creator-step__label">${esc(label)}</span><span class="creator-step__check">${stepComplete(id) ? "✓" : ""}</span></button>`).join("");
  }

  function head(kicker, title, lede) { return `<p class="creator-kicker">${esc(kicker)}</p><h1 class="creator-title">${esc(title)}</h1><p class="creator-lede">${esc(lede)}</p>`; }
  function tagRules(rules) { return rules.map((r) => `<span class="rule-tag rule-tag--${r}">${r === "2014" ? "5e · 2014" : "5.5e · 2024"}</span>`).join(""); }

  function renderStart() {
    const card = (key, title, meta) => `<button type="button" class="option-card${selected(state.ruleset, key)}" data-ruleset="${key}"><span class="option-card__title">${title}</span><span class="option-card__meta">${meta}</span></button>`;
    return head("Step 1", "Choose a ruleset", "Build with the 2014 fifth-edition rules, the 2024 revision, or browse both pools together.") +
      `<div class="option-grid">${card("2014", "2014 Rules · D&D 5e", "Classic fifth-edition character building. Species carries ability score bonuses.")}${card("2024", "2024 Rules · D&D 5.5e", "Revised character building. Background carries ability score bonuses and an origin feat.")}${card("both", "Both Rulesets", "Show compatible choices from both. You decide which ability-bonus model the character uses.")}</div>` +
      `<h2 class="creator-section-title">What actually changes here?</h2><div class="review-grid"><div class="review-card"><h3>2014</h3><p>Ability bonuses come from species. A starting feat is optional unless another feature grants one.</p></div><div class="review-card"><h3>2024</h3><p>Ability bonuses come from background. Backgrounds also provide an origin feat. Species is separated from ability boosts.</p></div></div>`;
  }

  function renderClass() {
    const list = CLASSES.filter((x) => state.classComplexity === "all" || x[2].toLowerCase() === state.classComplexity);
    return head("Step 2", "Choose a class", "Pick the character's main mechanical chassis. The complexity filter is a convenience, not a rule.") +
      `<div class="filter-row"><span class="mini-tag">Complexity</span>${["all", "low", "average", "high"].map((x) => `<button class="filter-chip${active(state.classComplexity, x)}" type="button" data-complexity="${x}">${cap(x)}</button>`).join("")}</div>` +
      `<div class="option-grid">${list.map(([name, primary, complexity, caster]) => `<button type="button" class="option-card${selected(state.className, name)}" data-class="${esc(name)}"><span class="option-card__title">${esc(name)}</span><span class="option-card__meta">Primary: ${esc(primary)}</span><span class="option-card__tags"><span class="mini-tag">${esc(complexity)}</span>${caster ? `<span class="mini-tag">Spellcasting</span>` : ""}<span class="rule-tag rule-tag--2014">2014</span><span class="rule-tag rule-tag--2024">2024</span></span></button>`).join("")}</div>`;
  }

  function renderSpecies() {
    const items = SPECIES.filter(visibleByRules);
    return head("Step 3", "Choose a species", state.ruleset === "2014" ? "In the 2014 rules, species also contributes ability score increases." : "In the 2024 rules, species and ability score increases are separated.") +
      `<div class="option-grid">${items.map((s) => `<button type="button" class="option-card${selected(state.species, s.name)}" data-species="${esc(s.name)}"><span class="option-card__title">${esc(s.name)}</span><span class="option-card__meta">${s.bonus2014 && (state.ruleset === "2014" || state.ruleset === "both") ? `2014 bonus: ${Object.entries(s.bonus2014).map(([k,v]) => `${ABILITY_NAMES[k]} +${v}`).join(", ")}` : "Choose the ancestry that fits the character."}</span><span class="option-card__tags">${tagRules(s.rules)}</span></button>`).join("")}</div>`;
  }

  function renderBackground() {
    const items = BACKGROUNDS.filter(visibleByRules);
    const bothToggle = state.ruleset === "both" ? `<h2 class="creator-section-title">Ability bonus model</h2><div class="segmented"><button type="button" class="${active(state.bonusSource, "2014")}" data-bonus-source="2014">2014 · species</button><button type="button" class="${active(state.bonusSource, "2024")}" data-bonus-source="2024">2024 · background</button></div>` : "";
    return head("Step 4", "Choose a background", "Background describes the life the character had before adventuring and, under the 2024 rules, drives starting ability boosts and an origin feat.") + bothToggle +
      `<div class="option-grid">${items.map((b) => `<button type="button" class="option-card${selected(state.background, b.name)}" data-background="${esc(b.name)}"><span class="option-card__title">${esc(b.name)}</span><span class="option-card__meta">${b.abilities && (state.ruleset === "2024" || state.ruleset === "both") ? `2024 abilities: ${b.abilities.map((a) => ABILITY_NAMES[a]).join(", ")} · Origin feat: ${b.feat}` : "Classic background choice."}</span><span class="option-card__tags">${tagRules(b.rules)}</span></button>`).join("")}</div>` + renderBackgroundBoostPicker();
  }

  function renderBackgroundBoostPicker() {
    const uses = state.ruleset === "2024" || (state.ruleset === "both" && state.bonusSource === "2024");
    const bg = currentBackground();
    if (!uses || !bg?.abilities) return "";
    const options = bg.abilities.map((a) => `<option value="${a}">${ABILITY_NAMES[a]}</option>`).join("");
    return `<h2 class="creator-section-title">Assign background boosts</h2><div class="field-grid"><label class="field">+2 ability<select data-bg-bonus="primary"><option value="">Automatic</option>${options}</select></label><label class="field">+1 ability<select data-bg-bonus="secondary"><option value="">Automatic</option>${options}</select></label></div><p class="creator-note">The +2 and +1 must land on different abilities offered by the selected background.</p>`;
  }

  function renderAbilities() {
    const bonuses = abilityBonuses();
    const finals = finalAbilities();
    const methodButtons = ["standard", "pointbuy", "roll", "manual"].map((m) => `<button type="button" class="${active(state.abilityMethod, m)}" data-ability-method="${m}">${m === "pointbuy" ? "Point Buy" : cap(m)}</button>`).join("");
    let status = "";
    if (state.abilityMethod === "pointbuy") status = `<div class="point-buy-status"><span>27-point budget · scores 8–15</span><strong>${pointBuySpent()} / 27 spent</strong></div>`;
    if (state.abilityMethod === "roll") status = `<div class="roll-bank">${(state.rolls.length ? state.rolls : ["Roll to generate six scores"]).map((x) => `<span class="roll-chip">${esc(x)}</span>`).join("")}<button type="button" class="creator-btn creator-btn--ghost" data-roll-abilities>Roll 4d6 × 6</button></div>`;
    return head("Step 5", "Abilities", "Choose how to generate the six base ability scores. Rule-derived bonuses are shown separately and never overwrite the base values.") +
      `<div class="segmented">${methodButtons}</div>${status}<div class="ability-grid">${ABILITIES.map((k) => abilityCard(k, bonuses[k], finals[k])).join("")}</div>`;
  }

  function abilityCard(k, bonus, finalScore) {
    let control = "";
    if (state.abilityMethod === "standard") control = `<select data-ability="${k}">${STANDARD_ARRAY.map((n) => `<option value="${n}"${Number(state.abilities[k]) === n ? " selected" : ""}>${n}</option>`).join("")}</select>`;
    else if (state.abilityMethod === "pointbuy") control = `<select data-ability="${k}">${[8,9,10,11,12,13,14,15].map((n) => `<option value="${n}"${Number(state.abilities[k]) === n ? " selected" : ""}>${n} · ${POINT_COST[n]} pts</option>`).join("")}</select>`;
    else control = `<input data-ability="${k}" type="number" min="3" max="20" value="${esc(state.abilities[k])}">`;
    return `<article class="ability-card" data-ability="${k}"><div class="ability-card__head"><span class="ability-card__abbr">${k.toUpperCase()}</span><span class="ability-card__mod">${modText(finalScore)}</span></div><div class="ability-card__score">${finalScore}</div>${control}<div class="ability-card__bonus">Base ${state.abilities[k]}${bonus ? ` · rules bonus +${bonus}` : " · no rules bonus"}</div></article>`;
  }

  function renderFeats() {
    const bg = currentBackground();
    const requiresOrigin = state.ruleset === "2024" || (state.ruleset === "both" && state.bonusSource === "2024");
    const suggested = requiresOrigin ? bg?.feat : "";
    return head("Step 6", "Feats", requiresOrigin ? "2024 backgrounds grant an origin feat. The background's default is highlighted, but this builder keeps the choice visible." : "A starting feat is optional in the classic 2014 flow unless your table or another feature grants one.") +
      `${suggested ? `<p class="creator-note">Background suggestion: <strong>${esc(suggested)}</strong></p>` : ""}<div class="option-grid" style="margin-top:.8rem"><button type="button" class="option-card${selected(state.feat, "")}" data-feat=""><span class="option-card__title">No feat / decide later</span></button>${FEATS.map((f) => `<button type="button" class="option-card${selected(state.feat || suggested, f)}" data-feat="${esc(f)}"><span class="option-card__title">${esc(f)}</span><span class="option-card__meta">Origin feat option</span></button>`).join("")}</div>`;
  }

  function renderSpells() {
    if (!isCaster()) return head("Step 7", "Spells", "Your selected class does not use the creator's starting spell picker. Nothing to choose here.") + `<p class="creator-note">You can still gain spells later from feats, species features, multiclassing, or other game effects.</p>`;
    return head("Step 7", "Spells", "Pick a small starter shortlist. This is intentionally a lightweight builder list, not a replacement for the full spell compendium.") + `<div class="option-grid">${SPELLS.map((s) => `<button type="button" class="option-card${state.spells.includes(s) ? " is-selected" : ""}" data-spell="${esc(s)}"><span class="option-card__title">${esc(s)}</span><span class="option-card__meta">${state.spells.includes(s) ? "Selected" : "Add to shortlist"}</span></button>`).join("")}</div>`;
  }

  function renderEquipment() {
    return head("Step 8", "Equipment", "Choose a starting-equipment approach. Detailed inventory can still be adjusted from the Player Companion after creation.") + `<div class="option-grid">${EQUIPMENT.map((e) => `<button type="button" class="option-card${selected(state.equipment, e)}" data-equipment="${esc(e)}"><span class="option-card__title">${esc(e)}</span><span class="option-card__meta">${e === "Custom / decide later" ? "Leave the detailed loadout open." : "Use this as the character's starting equipment note."}</span></button>`).join("")}</div>`;
  }

  function renderIdentity() {
    return head("Step 9", "Identity", "Give the mechanics a person to belong to. Only the name is required.") + `<div class="field-grid"><label class="field field--wide">Character name<input name="name" data-field="name" maxlength="80" value="${esc(state.name)}" placeholder="Althariel"></label><label class="field">Level<input data-field="level" type="number" min="1" max="20" value="${esc(state.level)}"></label><label class="field">Alignment<input data-field="alignment" maxlength="80" value="${esc(state.alignment)}" placeholder="Optional"></label><label class="field field--wide">Pronouns<input data-field="pronouns" maxlength="80" value="${esc(state.pronouns)}" placeholder="Optional"></label></div>`;
  }

  function renderAbout() {
    return head("Step 10", "About", "The squishy character bits. These notes stay in the creator draft and in exported JSON; core sheet fields are saved directly to the Player Companion.") + `<div class="field-grid"><label class="field field--wide">Appearance<textarea data-field="appearance">${esc(state.appearance)}</textarea></label><label class="field">Personality<textarea data-field="personality">${esc(state.personality)}</textarea></label><label class="field">Ideals<textarea data-field="ideals">${esc(state.ideals)}</textarea></label><label class="field">Bonds<textarea data-field="bonds">${esc(state.bonds)}</textarea></label><label class="field">Flaws<textarea data-field="flaws">${esc(state.flaws)}</textarea></label><label class="field field--wide">Other notes<textarea data-field="notes">${esc(state.notes)}</textarea></label></div>`;
  }

  function renderReview() {
    const finals = finalAbilities();
    const bg = currentBackground();
    const feat = state.feat || ((state.ruleset === "2024" || (state.ruleset === "both" && state.bonusSource === "2024")) ? bg?.feat || "" : "");
    const valid = state.name.trim() && state.className && state.species && state.background;
    const status = state.saveError ? `<p class="creator-error">${esc(state.saveError)}</p>` : state.saveMessage ? `<p class="creator-success">${esc(state.saveMessage)}</p>` : "";
    return head("Step 11", "Review", "One last pass before this pile of choices becomes an actual character.") +
      `<div class="review-grid"><div class="review-card"><h3>Identity</h3><p><strong>${esc(state.name || "Unnamed character")}</strong> · Level ${esc(state.level)}</p><p class="muted">${esc(state.ruleset === "both" ? `Both rulesets · ${state.bonusSource} bonus model` : `${state.ruleset} rules`)}</p></div><div class="review-card"><h3>Build</h3><p>${esc(state.species || "No species")} ${esc(state.className || "No class")}</p><p class="muted">${esc(state.background || "No background")} ${feat ? `· ${esc(feat)}` : ""}</p></div><div class="review-card" style="grid-column:1/-1"><h3>Abilities</h3><div class="review-abilities">${ABILITIES.map((k) => `<div class="review-ability"><strong>${finals[k]}</strong><span>${k.toUpperCase()} ${modText(finals[k])}</span></div>`).join("")}</div></div><div class="review-card"><h3>Spells</h3><p>${state.spells.length ? state.spells.map(esc).join(", ") : "None selected"}</p></div><div class="review-card"><h3>Equipment</h3><p>${esc(state.equipment || "Decide later")}</p></div></div>` +
      `<div class="creator-save-box"><strong>${valid ? "Ready to create." : "A few required choices are still missing."}</strong><p class="creator-lede" style="margin:.35rem 0 0">Saving to Player Companion requires a signed-in player account. Export works regardless.</p><div class="creator-save-box__actions"><button type="button" class="creator-btn creator-btn--primary" data-save-character${valid ? "" : " disabled"}>Save to Player Companion</button><button type="button" class="creator-btn creator-btn--ghost" data-export-character>Export JSON</button>${state.createdCharacterId ? `<a class="creator-btn creator-btn--ghost" href="/player/">Open Player Home</a>` : ""}</div>${status}</div>`;
  }

  function render() {
    renderSteps();
    const id = STEPS[state.step][0];
    const renderers = { start: renderStart, class: renderClass, species: renderSpecies, background: renderBackground, abilities: renderAbilities, feats: renderFeats, spells: renderSpells, equipment: renderEquipment, identity: renderIdentity, about: renderAbout, review: renderReview };
    els.content.innerHTML = renderers[id]();
    els.progress.textContent = `Step ${state.step + 1} of ${STEPS.length}`;
    els.prev.disabled = state.step === 0;
    els.next.hidden = state.step === STEPS.length - 1;
    els.next.disabled = !canAdvance(id);
    hydrateControls();
  }

  function hydrateControls() {
    const p = els.content.querySelector('[data-bg-bonus="primary"]');
    const s = els.content.querySelector('[data-bg-bonus="secondary"]');
    if (p) p.value = state.backgroundBonuses.primary || "";
    if (s) s.value = state.backgroundBonuses.secondary || "";
  }

  function canAdvance(id) {
    if (["class", "species", "background", "identity"].includes(id)) return stepComplete(id);
    if (id === "abilities" && state.abilityMethod === "pointbuy") return pointBuySpent() <= 27;
    return true;
  }

  function chooseAbilityMethod(method) {
    const next = { abilityMethod: method };
    if (method === "standard") next.abilities = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
    if (method === "pointbuy") next.abilities = { str: 13, dex: 13, con: 13, int: 12, wis: 12, cha: 12 };
    setState(next);
  }

  function rollAbilities() {
    const rolls = Array.from({ length: 6 }, () => {
      const dice = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a,b) => a-b);
      return dice.slice(1).reduce((a,b) => a+b, 0);
    });
    const abilities = Object.fromEntries(ABILITIES.map((k, i) => [k, rolls[i]]));
    setState({ rolls, abilities });
  }

  function exportPayload() {
    const bg = currentBackground();
    const originFeat = state.feat || ((state.ruleset === "2024" || (state.ruleset === "both" && state.bonusSource === "2024")) ? bg?.feat || "" : "");
    return {
      format: "stormwreck-character-creator-v1", exportedAt: new Date().toISOString(), ruleset: state.ruleset,
      bonusModel: state.ruleset === "both" ? state.bonusSource : state.ruleset,
      name: state.name.trim(), level: Number(state.level) || 1, class: state.className, species: state.species, race: state.species,
      background: state.background, alignment: state.alignment, pronouns: state.pronouns,
      abilities: finalAbilities(), baseAbilities: state.abilities, abilityBonuses: abilityBonuses(), feat: originFeat,
      spells: state.spells, equipment: state.equipment,
      about: { appearance: state.appearance, personality: state.personality, ideals: state.ideals, bonds: state.bonds, flaws: state.flaws, notes: state.notes }
    };
  }

  async function saveCharacter() {
    state.saveError = ""; state.saveMessage = ""; render();
    if (!api) { setState({ saveError: "Player API is unavailable on this page." }); return; }
    const payload = exportPayload();
    const createPayload = {
      name: payload.name, level: payload.level, gameSystemId: "dnd5e", race: payload.species, class: payload.class,
      background: payload.background, alignment: payload.alignment, abilities: payload.abilities,
      hpMax: 10, hpCurrent: 10, ac: 10, speed: "30 ft.", hitDice: "1d8"
    };
    try {
      const campaignId = new URLSearchParams(location.search).get("campaignId");
      const result = campaignId ? await api.createCharacter(campaignId, createPayload) : await api.createStandaloneCharacter(createPayload);
      const character = result?.character;
      if (!character?.id) throw new Error("Character created, but the server returned no character id.");
      setState({ createdCharacterId: character.id, saveMessage: `${character.name} was created in the Player Companion.`, saveError: "" });
    } catch (err) {
      const authHint = Number(err?.status) === 401 ? " Sign in through Player Home first, then come back here." : "";
      setState({ saveError: `${err?.message || "Could not create character."}${authHint}`, saveMessage: "" });
    }
  }

  function exportJson() {
    const payload = exportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (payload.name || "character").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "character";
    a.href = url; a.download = `${slug}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  els.steps.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-go-step]"); if (!btn) return;
    const next = Number(btn.dataset.goStep); if (!Number.isInteger(next)) return;
    setState({ step: Math.max(0, Math.min(STEPS.length - 1, next)) });
  });

  els.content.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-save-character], [data-export-character]"); if (!t) return;
    if (t.dataset.ruleset) {
      const ruleset = t.dataset.ruleset; const patch = { ruleset };
      if (ruleset !== "both") patch.bonusSource = ruleset;
      if (state.species && !SPECIES.find((x) => x.name === state.species)?.rules.includes(ruleset) && ruleset !== "both") patch.species = "";
      if (state.background && !BACKGROUNDS.find((x) => x.name === state.background)?.rules.includes(ruleset) && ruleset !== "both") patch.background = "";
      setState(patch); return;
    }
    if (t.dataset.complexity) { setState({ classComplexity: t.dataset.complexity }); return; }
    if (t.dataset.class) { setState({ className: t.dataset.class, spells: currentClass()?.[3] ? state.spells : [] }); return; }
    if (t.dataset.species) { setState({ species: t.dataset.species }); return; }
    if (t.dataset.background) { const bg = BACKGROUNDS.find((x) => x.name === t.dataset.background); setState({ background: t.dataset.background, feat: state.feat || (state.ruleset === "2024" ? bg?.feat || "" : ""), backgroundBonuses: { primary: "", secondary: "" } }); return; }
    if (t.dataset.bonusSource) { setState({ bonusSource: t.dataset.bonusSource }); return; }
    if (t.dataset.abilityMethod) { chooseAbilityMethod(t.dataset.abilityMethod); return; }
    if (Object.prototype.hasOwnProperty.call(t.dataset, "feat")) { setState({ feat: t.dataset.feat }); return; }
    if (t.dataset.spell) { const spell = t.dataset.spell; const spells = state.spells.includes(spell) ? state.spells.filter((x) => x !== spell) : [...state.spells, spell]; setState({ spells }); return; }
    if (t.dataset.equipment) { setState({ equipment: t.dataset.equipment }); return; }
    if (t.hasAttribute("data-roll-abilities")) { rollAbilities(); return; }
    if (t.hasAttribute("data-save-character")) { void saveCharacter(); return; }
    if (t.hasAttribute("data-export-character")) { exportJson(); }
  });

  els.content.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-ability]")) {
      const k = t.dataset.ability; const val = Number(t.value); const abilities = { ...state.abilities, [k]: val };
      if (state.abilityMethod === "standard") {
        const duplicates = ABILITIES.filter((a) => a !== k && Number(abilities[a]) === val);
        if (duplicates.length) {
          const old = Number(state.abilities[k]); abilities[duplicates[0]] = old;
        }
      }
      state.abilities = abilities; saveDraft(); render(); return;
    }
    if (t.matches("[data-bg-bonus]")) {
      const kind = t.dataset.bgBonus; const next = { ...state.backgroundBonuses, [kind]: t.value };
      if (kind === "primary" && next.secondary === t.value) next.secondary = "";
      if (kind === "secondary" && next.primary === t.value) next.primary = "";
      state.backgroundBonuses = next; saveDraft(); render(); return;
    }
    if (t.matches("[data-field]")) {
      const key = t.dataset.field; state[key] = key === "level" ? Number(t.value) || 1 : t.value; saveDraft();
      if (key === "name") renderSteps();
    }
  });

  els.content.addEventListener("input", (e) => {
    const t = e.target;
    if (t.matches("[data-field]") && t.tagName !== "SELECT") { const key = t.dataset.field; state[key] = key === "level" ? Number(t.value) || 1 : t.value; saveDraft(); }
    if (t.matches('[data-ability][type="number"]')) { const k = t.dataset.ability; state.abilities[k] = Number(t.value); saveDraft(); }
  });

  els.prev.addEventListener("click", () => setState({ step: Math.max(0, state.step - 1) }));
  els.next.addEventListener("click", () => {
    const id = STEPS[state.step][0]; if (!canAdvance(id)) return;
    setState({ step: Math.min(STEPS.length - 1, state.step + 1) }); window.scrollTo({ top: 0, behavior: "auto" });
  });

  els.reset?.addEventListener("click", () => els.resetDialog?.showModal());
  els.resetDialog?.addEventListener("close", () => {
    if (els.resetDialog.returnValue !== "reset") return;
    state = defaultState(); localStorage.removeItem(STORAGE_KEY); render();
  });

  render();
})();
