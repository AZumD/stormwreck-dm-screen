(function () {
  "use strict";

  const STORAGE_KEY = "stormwreck-character-creator-v3";
  const LEGACY_STORAGE_KEYS = ["stormwreck-character-creator-v2", "stormwreck-character-creator-v1"];
  const api = window.PlayerApiClient || null;
  const data = window.StormwreckCharacterCreatorData;
  const compendium = window.StormwreckCharacterCreatorCompendium;
  if (!data) throw new Error("Character creator data failed to load");
  if (!compendium) throw new Error("Character creator compendium bindings failed to load");

  const { CLASSES, SPECIES, BACKGROUNDS, FEATS, SPELLS, EQUIPMENT } = data;
  const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
  const ABILITY_NAMES = {
    str: "Strength", dex: "Dexterity", con: "Constitution",
    int: "Intelligence", wis: "Wisdom", cha: "Charisma"
  };
  const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
  const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

  const STEPS = [
    ["start", "Getting Started", "◈"],
    ["class", "Class", "⚔"],
    ["species", "Species", "◎"],
    ["background", "Background", "◇"],
    ["abilities", "Abilities", "✦"],
    ["feats", "Feats", "✧"],
    ["spells", "Spells", "✺"],
    ["equipment", "Equipment", "▣"],
    ["identity", "Identity", "♙"],
    ["about", "About", "◌"],
    ["review", "Review", "✓"]
  ];

  const els = {
    steps: document.getElementById("creator-steps"),
    content: document.getElementById("creator-content"),
    prev: document.getElementById("creator-prev"),
    next: document.getElementById("creator-next"),
    progress: document.getElementById("creator-progress"),
    saveState: document.getElementById("creator-save-state"),
    reset: document.getElementById("creator-reset"),
    resetDialog: document.getElementById("creator-confirm-reset")
  };

  function defaultState() {
    return {
      step: 0,
      ruleset: "2024",
      className: "",
      classComplexity: "all",
      skills: [],
      species: "",
      background: "",
      bonusSource: "2024",
      abilityMethod: "standard",
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      standardAssignments: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      rolls: [],
      speciesBonuses: { primary: "", secondary: "" },
      backgroundBonuses: { primary: "", secondary: "" },
      feat: "",
      spells: [],
      equipment: "Class equipment",
      name: "",
      level: 1,
      alignment: "",
      pronouns: "",
      appearance: "",
      personality: "",
      ideals: "",
      bonds: "",
      flaws: "",
      notes: "",
      createdCharacterId: "",
      saveMessage: "",
      saveError: ""
    };
  }

  function readStoredDraft() {
    const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
    for (const key of keys) {
      try {
        const raw = JSON.parse(localStorage.getItem(key) || "null");
        if (raw && typeof raw === "object") return raw;
      } catch {
        /* try the next draft generation */
      }
    }
    return null;
  }

  function loadState() {
    const raw = readStoredDraft();
    const defaults = defaultState();
    if (!raw) return defaults;
    return Object.assign(defaults, raw, {
      abilities: Object.assign({}, defaults.abilities, raw.abilities || {}),
      standardAssignments: Object.assign({}, defaults.standardAssignments, raw.standardAssignments || {}),
      speciesBonuses: Object.assign({}, defaults.speciesBonuses, raw.speciesBonuses || {}),
      backgroundBonuses: Object.assign({}, defaults.backgroundBonuses, raw.backgroundBonuses || {}),
      skills: Array.isArray(raw.skills) ? raw.skills.filter((x) => compendium.SKILLS.includes(x)) : [],
      spells: Array.isArray(raw.spells) ? raw.spells.filter((x) => SPELLS.includes(x)) : []
    });
  }

  let state = loadState();
  let saveTimer = null;

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function cap(v) { return String(v || "").charAt(0).toUpperCase() + String(v || "").slice(1); }
  function mod(score) { return Math.floor((Number(score || 10) - 10) / 2); }
  function modText(score) { const n = mod(score); return n >= 0 ? `+${n}` : String(n); }
  function selected(a, b) { return a === b ? " is-selected" : ""; }
  function active(a, b) { return a === b ? " is-active" : ""; }
  function compendiumTag() { return `<span class="mini-tag">Compendium</span>`; }

  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
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
  function currentClass() { return CLASSES.find((x) => x.name === state.className) || null; }
  function isCaster() { return Boolean(currentClass()?.caster); }
  function uses2014BonusModel() {
    return state.ruleset === "2014" || (state.ruleset === "both" && state.bonusSource === "2014");
  }
  function uses2024BonusModel() {
    return state.ruleset === "2024" || (state.ruleset === "both" && state.bonusSource === "2024");
  }

  function visibleByRules(item) {
    if (state.ruleset === "both") return true;
    return item.rules.includes(state.ruleset);
  }

  function applyFlexibleBoost(out, pool, selection) {
    if (!pool.length) return;
    const primary = selection.primary && pool.includes(selection.primary) ? selection.primary : pool[0];
    const secondaryDefault = pool.find((x) => x !== primary) || pool[1];
    const secondary =
      selection.secondary && pool.includes(selection.secondary) && selection.secondary !== primary
        ? selection.secondary
        : secondaryDefault;
    if (primary) out[primary] += 2;
    if (secondary) out[secondary] += 1;
  }

  function backgroundAbilityPool(bg) {
    if (!bg) return [];
    if (Array.isArray(bg.abilities) && bg.abilities.length) return bg.abilities;
    if (uses2024BonusModel()) return ABILITIES;
    return [];
  }

  function abilityBonuses() {
    const out = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (uses2014BonusModel()) {
      const species = currentSpecies();
      if (species?.flexible2014) applyFlexibleBoost(out, ABILITIES, state.speciesBonuses);
      else Object.entries(species?.bonus2014 || {}).forEach(([k, v]) => { out[k] += v; });
      return out;
    }
    applyFlexibleBoost(out, backgroundAbilityPool(currentBackground()), state.backgroundBonuses);
    return out;
  }

  function finalAbilities() {
    const bonuses = abilityBonuses();
    return Object.fromEntries(
      ABILITIES.map((k) => [k, Math.max(1, Number(state.abilities[k] || 10) + Number(bonuses[k] || 0))])
    );
  }

  function pointBuySpent() {
    return ABILITIES.reduce((sum, k) => sum + (POINT_COST[Number(state.abilities[k])] ?? 99), 0);
  }

  function classSkillConfig() {
    return compendium.skillsForClass(state.className);
  }

  function classSkillsComplete() {
    if (!state.className) return false;
    const cfg = classSkillConfig();
    return cfg.count === 0 || state.skills.length === cfg.count;
  }

  function stepComplete(id) {
    if (id === "start") return Boolean(state.ruleset);
    if (id === "class") return Boolean(state.className) && classSkillsComplete();
    if (id === "species") return Boolean(state.species);
    if (id === "background") return Boolean(state.background);
    if (id === "abilities") return ABILITIES.every((k) => Number.isFinite(Number(state.abilities[k])));
    if (id === "identity") return Boolean(state.name.trim());
    if (id === "review") return Boolean(state.createdCharacterId);
    return true;
  }

  function renderSteps() {
    els.steps.innerHTML = STEPS.map(([id, label, icon], i) =>
      `<button type="button" class="creator-step${i === state.step ? " is-active" : ""}${stepComplete(id) ? " is-complete" : ""}" data-go-step="${i}">` +
      `<span class="creator-step__icon">${icon}</span><span class="creator-step__label">${esc(label)}</span>` +
      `<span class="creator-step__check">${stepComplete(id) ? "✓" : ""}</span></button>`
    ).join("");
  }

  function head(kicker, title, lede) {
    return `<p class="creator-kicker">${esc(kicker)}</p><h1 class="creator-title">${esc(title)}</h1><p class="creator-lede">${esc(lede)}</p>`;
  }

  function tagRules(item) {
    return item.rules.map((r) => {
      const label = r === "2014" ? "5e · 2014" : item.legacy2024 ? "2024 compatible" : "5.5e · 2024";
      return `<span class="rule-tag rule-tag--${r}">${label}</span>`;
    }).join("");
  }

  function sourceTag(item) {
    return item.source ? `<span class="mini-tag">${esc(item.source)}</span>` : "";
  }

  function renderStart() {
    const card = (key, title, meta) =>
      `<button type="button" class="option-card${selected(state.ruleset, key)}" data-ruleset="${key}">` +
      `<span class="option-card__title">${title}</span><span class="option-card__meta">${meta}</span></button>`;
    return head("Step 1", "Choose a ruleset", "Build with the 2014 fifth-edition rules, the 2024 revision, or browse both pools together.") +
      `<div class="option-grid">${card("2014", "2014 Rules · D&D 5e", "Classic fifth-edition character building. Species carries ability score bonuses.")}` +
      `${card("2024", "2024 Rules · D&D 5.5e", "Revised character building. Background carries ability score bonuses and an origin feat.")}` +
      `${card("both", "Both Rulesets", "Show core, expanded, setting, and backwards-compatible choices together.")}</div>` +
      `<h2 class="creator-section-title">What actually changes here?</h2><div class="review-grid">` +
      `<div class="review-card"><h3>2014</h3><p>Ability bonuses come from species. A starting feat is optional unless another feature grants one.</p></div>` +
      `<div class="review-card"><h3>2024</h3><p>Ability bonuses come from background. Older species and backgrounds can still be converted into the revised flow.</p></div></div>`;
  }

  function renderClassSkills() {
    if (!state.className) return "";
    const cfg = classSkillConfig();
    if (!cfg.count || !cfg.skills.length) return "";
    const count = state.skills.length;
    return `<h2 class="creator-section-title">Class skills</h2>` +
      `<p class="creator-note">Choose ${cfg.count}. These are saved as linked Skill entries from the Compendium. <strong>${count}/${cfg.count}</strong> chosen.</p>` +
      `<div class="option-grid">${cfg.skills.map((skill) =>
        `<button type="button" class="option-card${state.skills.includes(skill) ? " is-selected" : ""}" data-skill="${esc(skill)}">` +
        `<span class="option-card__title">${esc(skill)}</span>` +
        `<span class="option-card__tags">${compendiumTag()}<span class="mini-tag">${esc(compendium.catalogueId("skill", skill))}</span></span></button>`
      ).join("")}</div>`;
  }

  function renderClass() {
    const list = CLASSES.filter((x) =>
      visibleByRules(x) &&
      (state.classComplexity === "all" || x.complexity.toLowerCase() === state.classComplexity)
    );
    return head("Step 2", "Choose a class", "Core classes live beside expanded official options. Class and skill choices save as Compendium links.") +
      `<div class="filter-row"><span class="mini-tag">Complexity</span>${["all", "low", "average", "high"].map((x) =>
        `<button class="filter-chip${active(state.classComplexity, x)}" type="button" data-complexity="${x}">${cap(x)}</button>`
      ).join("")}</div>` +
      `<div class="option-grid">${list.map((c) =>
        `<button type="button" class="option-card${selected(state.className, c.name)}" data-class="${esc(c.name)}">` +
        `<span class="option-card__title">${esc(c.name)}</span>` +
        `<span class="option-card__meta">${esc(c.description)}</span>` +
        `<span class="option-card__meta">Primary: ${esc(c.primary)}</span>` +
        `<span class="option-card__tags"><span class="mini-tag">${esc(c.complexity)}</span>` +
        `${c.caster ? `<span class="mini-tag">Spellcasting</span>` : ""}${sourceTag(c)}${compendiumTag()}${tagRules(c)}</span></button>`
      ).join("")}</div>${renderClassSkills()}`;
  }

  function speciesBonusText(s) {
    if (!uses2014BonusModel()) return "";
    if (s.flexible2014) return "2014 ability boosts: flexible +2 / +1";
    if (!s.bonus2014) return "";
    return `2014 bonus: ${Object.entries(s.bonus2014).map(([k, v]) => `${ABILITY_NAMES[k]} +${v}`).join(", ")}`;
  }

  function renderSpecies() {
    const items = SPECIES.filter(visibleByRules);
    const modeText = uses2014BonusModel()
      ? "The 2014 bonus model uses species ability increases. Expanded later-era species use a flexible +2 / +1 picker."
      : "The 2024 bonus model separates species from ability scores, so older species can slot in cleanly.";
    return head("Step 3", "Choose a species", `${modeText} Every choice here resolves to a Race entry in the Compendium.`) +
      `<div class="option-grid">${items.map((s) => {
        const bonusText = speciesBonusText(s);
        return `<button type="button" class="option-card${selected(state.species, s.name)}" data-species="${esc(s.name)}">` +
          `<span class="option-card__title">${esc(s.name)}</span>` +
          `<span class="option-card__meta">${esc(s.description)}</span>` +
          `${bonusText ? `<span class="option-card__meta">${esc(bonusText)}</span>` : ""}` +
          `<span class="option-card__tags">${sourceTag(s)}${compendiumTag()}${tagRules(s)}</span></button>`;
      }).join("")}</div>${renderSpeciesBoostPicker()}`;
  }

  function renderSpeciesBoostPicker() {
    const species = currentSpecies();
    if (!uses2014BonusModel() || !species?.flexible2014) return "";
    const options = ABILITIES.map((a) => `<option value="${a}">${ABILITY_NAMES[a]}</option>`).join("");
    return `<h2 class="creator-section-title">Assign species boosts</h2>` +
      `<div class="field-grid"><label class="field">+2 ability<select data-species-bonus="primary"><option value="">Automatic</option>${options}</select></label>` +
      `<label class="field">+1 ability<select data-species-bonus="secondary"><option value="">Automatic</option>${options}</select></label></div>` +
      `<p class="creator-note">Expanded 2014-era species commonly use flexible ability increases. The two boosts must land on different abilities.</p>`;
  }

  function backgroundMechanicText(b) {
    if (!uses2024BonusModel()) return "";
    if (b.abilities?.length) return `2024 abilities: ${b.abilities.map((a) => ABILITY_NAMES[a]).join(", ")} · Origin feat: ${b.feat}`;
    return "2024 conversion: choose any +2 / +1 ability boosts and select an Origin feat.";
  }

  function renderBackground() {
    const items = BACKGROUNDS.filter(visibleByRules);
    const bothToggle = state.ruleset === "both"
      ? `<h2 class="creator-section-title">Ability bonus model</h2><div class="segmented">` +
        `<button type="button" class="${active(state.bonusSource, "2014")}" data-bonus-source="2014">2014 · species</button>` +
        `<button type="button" class="${active(state.bonusSource, "2024")}" data-bonus-source="2024">2024 · background</button></div>`
      : "";
    return head("Step 4", "Choose a background", "Background describes the life the character had before adventuring. Backgrounds remain creator metadata for now; the Compendium taxonomy does not yet have a background type.") +
      bothToggle +
      `<div class="option-grid">${items.map((b) => {
        const mechanics = backgroundMechanicText(b);
        return `<button type="button" class="option-card${selected(state.background, b.name)}" data-background="${esc(b.name)}">` +
          `<span class="option-card__title">${esc(b.name)}</span>` +
          `<span class="option-card__meta">${esc(b.description)}</span>` +
          `${mechanics ? `<span class="option-card__meta">${esc(mechanics)}</span>` : ""}` +
          `<span class="option-card__tags">${sourceTag(b)}${tagRules(b)}</span></button>`;
      }).join("")}</div>${renderBackgroundBoostPicker()}`;
  }

  function renderBackgroundBoostPicker() {
    if (!uses2024BonusModel()) return "";
    const bg = currentBackground();
    if (!bg) return "";
    const pool = backgroundAbilityPool(bg);
    if (!pool.length) return "";
    const options = pool.map((a) => `<option value="${a}">${ABILITY_NAMES[a]}</option>`).join("");
    const note = bg.abilities?.length
      ? "The +2 and +1 must land on different abilities offered by the selected background."
      : "Older backgrounds use the 2024 conversion rule here: choose any two different abilities for +2 and +1.";
    return `<h2 class="creator-section-title">Assign background boosts</h2>` +
      `<div class="field-grid"><label class="field">+2 ability<select data-bg-bonus="primary"><option value="">Automatic</option>${options}</select></label>` +
      `<label class="field">+1 ability<select data-bg-bonus="secondary"><option value="">Automatic</option>${options}</select></label></div>` +
      `<p class="creator-note">${esc(note)}</p>`;
  }

  function renderAbilities() {
    const bonuses = abilityBonuses();
    const finals = finalAbilities();
    const methodButtons = ["standard", "pointbuy", "roll", "manual"].map((m) =>
      `<button type="button" class="${active(state.abilityMethod, m)}" data-ability-method="${m}">${m === "pointbuy" ? "Point Buy" : cap(m)}</button>`
    ).join("");
    let status = "";
    if (state.abilityMethod === "pointbuy") {
      status = `<div class="point-buy-status"><span>27-point budget · scores 8–15</span><strong>${pointBuySpent()} / 27 spent</strong></div>`;
    } else if (state.abilityMethod === "roll") {
      status = `<div class="roll-bank">${(state.rolls.length ? state.rolls : ["Roll to generate six scores"]).map((x) =>
        `<span class="roll-chip">${esc(x)}</span>`
      ).join("")}<button type="button" class="creator-btn creator-btn--ghost" data-roll-abilities>Roll 4d6 × 6</button></div>`;
    }
    return head("Step 5", "Abilities", "Choose how to generate the six base ability scores. Rule-derived bonuses are shown separately and never overwrite the base values.") +
      `<div class="segmented">${methodButtons}</div>${status}<div class="ability-grid">${ABILITIES.map((k) =>
        abilityCard(k, bonuses[k], finals[k])
      ).join("")}</div>`;
  }

  function abilityCard(k, bonus, finalScore) {
    let control = "";
    if (state.abilityMethod === "standard") {
      control = `<select data-ability="${k}">${STANDARD_ARRAY.map((n) =>
        `<option value="${n}"${Number(state.abilities[k]) === n ? " selected" : ""}>${n}</option>`
      ).join("")}</select>`;
    } else if (state.abilityMethod === "pointbuy") {
      control = `<select data-ability="${k}">${[8, 9, 10, 11, 12, 13, 14, 15].map((n) =>
        `<option value="${n}"${Number(state.abilities[k]) === n ? " selected" : ""}>${n} · ${POINT_COST[n]} pts</option>`
      ).join("")}</select>`;
    } else {
      control = `<input data-ability="${k}" type="number" min="3" max="20" value="${esc(state.abilities[k])}">`;
    }
    return `<article class="ability-card" data-ability="${k}"><div class="ability-card__head">` +
      `<span class="ability-card__abbr">${k.toUpperCase()}</span><span class="ability-card__mod">${modText(finalScore)}</span></div>` +
      `<div class="ability-card__score">${finalScore}</div>${control}` +
      `<div class="ability-card__bonus">Base ${state.abilities[k]}${bonus ? ` · rules bonus +${bonus}` : " · no rules bonus"}</div></article>`;
  }

  function effectiveFeat() {
    return state.feat || (uses2024BonusModel() ? currentBackground()?.feat || "" : "");
  }

  function renderFeats() {
    const suggested = uses2024BonusModel() ? currentBackground()?.feat : "";
    return head(
      "Step 6",
      "Feats",
      uses2024BonusModel()
        ? "2024 backgrounds grant an Origin feat. Feats are stored as linked Feature entries in the Compendium."
        : "A starting feat is optional in the classic 2014 flow unless your table or another feature grants one."
    ) +
      `${suggested ? `<p class="creator-note">Background suggestion: <strong>${esc(suggested)}</strong></p>` : ""}` +
      `<div class="option-grid" style="margin-top:.8rem"><button type="button" class="option-card${selected(state.feat, "")}" data-feat="">` +
      `<span class="option-card__title">No feat / decide later</span></button>${FEATS.map((f) =>
        `<button type="button" class="option-card${selected(state.feat || suggested, f)}" data-feat="${esc(f)}">` +
        `<span class="option-card__title">${esc(f)}</span>` +
        `<span class="option-card__meta">Origin feat · linked Feature entry</span>` +
        `<span class="option-card__tags">${compendiumTag()}</span></button>`
      ).join("")}</div>`;
  }

  function renderSpells() {
    if (!isCaster()) {
      return head("Step 7", "Spells", "Your selected class does not use the creator's starting spell picker. Nothing to choose here.") +
        `<p class="creator-note">You can still gain spells later from feats, species features, multiclassing, or other game effects.</p>`;
    }
    return head("Step 7", "Spells", "Pick a starter shortlist. Every selected spell saves as a Compendium-linked spell rather than loose text.") +
      `<div class="option-grid">${SPELLS.map((spell) =>
        `<button type="button" class="option-card${state.spells.includes(spell) ? " is-selected" : ""}" data-spell="${esc(spell)}">` +
        `<span class="option-card__title">${esc(spell)}</span>` +
        `<span class="option-card__meta">${state.spells.includes(spell) ? "Selected" : "Add to shortlist"}</span>` +
        `<span class="option-card__tags">${compendiumTag()}</span></button>`
      ).join("")}</div>`;
  }

  function renderEquipment() {
    return head("Step 8", "Equipment", "Choose a starting-equipment approach. Detailed inventory can still be adjusted from the Player Companion after creation.") +
      `<div class="option-grid">${EQUIPMENT.map((e) =>
        `<button type="button" class="option-card${selected(state.equipment, e)}" data-equipment="${esc(e)}">` +
        `<span class="option-card__title">${esc(e)}</span>` +
        `<span class="option-card__meta">${e === "Custom / decide later" ? "Leave the detailed loadout open." : "Use this as the character's starting equipment note."}</span></button>`
      ).join("")}</div>`;
  }

  function renderIdentity() {
    return head("Step 9", "Identity", "Give the mechanics a person to belong to. Only the name is required.") +
      `<div class="field-grid"><label class="field field--wide">Character name<input name="name" data-field="name" maxlength="80" value="${esc(state.name)}" placeholder="Althariel"></label>` +
      `<label class="field">Level<input data-field="level" type="number" min="1" max="20" value="${esc(state.level)}"></label>` +
      `<label class="field">Alignment<input data-field="alignment" maxlength="80" value="${esc(state.alignment)}" placeholder="Optional"></label>` +
      `<label class="field field--wide">Pronouns<input data-field="pronouns" maxlength="80" value="${esc(state.pronouns)}" placeholder="Optional"></label></div>`;
  }

  function renderAbout() {
    return head("Step 10", "About", "The squishy character bits. These notes stay in the creator draft and in exported JSON; core sheet fields are saved directly to the Player Companion.") +
      `<div class="field-grid"><label class="field field--wide">Appearance<textarea data-field="appearance">${esc(state.appearance)}</textarea></label>` +
      `<label class="field">Personality<textarea data-field="personality">${esc(state.personality)}</textarea></label>` +
      `<label class="field">Ideals<textarea data-field="ideals">${esc(state.ideals)}</textarea></label>` +
      `<label class="field">Bonds<textarea data-field="bonds">${esc(state.bonds)}</textarea></label>` +
      `<label class="field">Flaws<textarea data-field="flaws">${esc(state.flaws)}</textarea></label>` +
      `<label class="field field--wide">Other notes<textarea data-field="notes">${esc(state.notes)}</textarea></label></div>`;
  }

  function renderReview() {
    const finals = finalAbilities();
    const feat = effectiveFeat();
    const valid = state.name.trim() && state.className && state.species && state.background && classSkillsComplete();
    const status = state.saveError
      ? `<p class="creator-error">${esc(state.saveError)}</p>`
      : state.saveMessage
        ? `<p class="creator-success">${esc(state.saveMessage)}</p>`
        : "";
    return head("Step 11", "Review", "One last pass before this pile of choices becomes an actual character.") +
      `<div class="review-grid"><div class="review-card"><h3>Identity</h3><p><strong>${esc(state.name || "Unnamed character")}</strong> · Level ${esc(state.level)}</p>` +
      `<p class="muted">${esc(state.ruleset === "both" ? `Both rulesets · ${state.bonusSource} bonus model` : `${state.ruleset} rules`)}</p></div>` +
      `<div class="review-card"><h3>Build</h3><p>${esc(state.species || "No species")} ${esc(state.className || "No class")}</p>` +
      `<p class="muted">${esc(state.background || "No background")} ${feat ? `· ${esc(feat)}` : ""}</p></div>` +
      `<div class="review-card"><h3>Skills</h3><p>${state.skills.length ? state.skills.map(esc).join(", ") : "None selected"}</p></div>` +
      `<div class="review-card"><h3>Linked Compendium entries</h3><p>Race, class, skills, feat, and spells save as @refs and stay clickable in the Player Companion.</p></div>` +
      `<div class="review-card" style="grid-column:1/-1"><h3>Abilities</h3><div class="review-abilities">${ABILITIES.map((k) =>
        `<div class="review-ability"><strong>${finals[k]}</strong><span>${k.toUpperCase()} ${modText(finals[k])}</span></div>`
      ).join("")}</div></div>` +
      `<div class="review-card"><h3>Spells</h3><p>${state.spells.length ? state.spells.map(esc).join(", ") : "None selected"}</p></div>` +
      `<div class="review-card"><h3>Equipment</h3><p>${esc(state.equipment || "Decide later")}</p></div></div>` +
      `<div class="creator-save-box"><strong>${valid ? "Ready to create." : "A few required choices are still missing."}</strong>` +
      `<p class="creator-lede" style="margin:.35rem 0 0">Saving creates the character, then writes its Compendium refs to the sheet.</p>` +
      `<div class="creator-save-box__actions"><button type="button" class="creator-btn creator-btn--primary" data-save-character${valid ? "" : " disabled"}>Save to Player Companion</button>` +
      `<button type="button" class="creator-btn creator-btn--ghost" data-export-character>Export JSON</button>` +
      `${state.createdCharacterId ? `<a class="creator-btn creator-btn--ghost" href="/player/">Open Player Home</a>` : ""}</div>${status}</div>`;
  }

  function hydrateControls() {
    const sp = els.content.querySelector('[data-species-bonus="primary"]');
    const ss = els.content.querySelector('[data-species-bonus="secondary"]');
    const bp = els.content.querySelector('[data-bg-bonus="primary"]');
    const bs = els.content.querySelector('[data-bg-bonus="secondary"]');
    if (sp) sp.value = state.speciesBonuses.primary || "";
    if (ss) ss.value = state.speciesBonuses.secondary || "";
    if (bp) bp.value = state.backgroundBonuses.primary || "";
    if (bs) bs.value = state.backgroundBonuses.secondary || "";
  }

  function render() {
    renderSteps();
    const id = STEPS[state.step][0];
    const renderers = {
      start: renderStart,
      class: renderClass,
      species: renderSpecies,
      background: renderBackground,
      abilities: renderAbilities,
      feats: renderFeats,
      spells: renderSpells,
      equipment: renderEquipment,
      identity: renderIdentity,
      about: renderAbout,
      review: renderReview
    };
    els.content.innerHTML = renderers[id]();
    els.progress.textContent = `Step ${state.step + 1} of ${STEPS.length}`;
    els.prev.disabled = state.step === 0;
    els.next.hidden = state.step === STEPS.length - 1;
    els.next.disabled = !canAdvance(id);
    hydrateControls();
  }

  function canAdvance(id) {
    if (id === "class") return Boolean(state.className) && classSkillsComplete();
    if (["species", "background", "identity"].includes(id)) return stepComplete(id);
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
      const dice = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => a - b);
      return dice.slice(1).reduce((a, b) => a + b, 0);
    });
    setState({ rolls, abilities: Object.fromEntries(ABILITIES.map((k, i) => [k, rolls[i]])) });
  }

  function linkedSheetPatch() {
    const feat = effectiveFeat();
    return {
      race: compendium.ref("race", state.species),
      class: compendium.ref("class", state.className),
      skillRefs: state.skills.map((skill) => compendium.ref("skill", skill)),
      featureRefs: feat ? [compendium.featRef(feat)] : [],
      spellRefs: state.spells.map((spell) => compendium.ref("spell", spell))
    };
  }

  function exportPayload() {
    const linked = linkedSheetPatch();
    return {
      format: "stormwreck-character-creator-v3",
      exportedAt: new Date().toISOString(),
      ruleset: state.ruleset,
      bonusModel: state.ruleset === "both" ? state.bonusSource : state.ruleset,
      name: state.name.trim(),
      level: Number(state.level) || 1,
      class: state.className,
      classRef: linked.class,
      species: state.species,
      race: state.species,
      raceRef: linked.race,
      background: state.background,
      alignment: state.alignment,
      pronouns: state.pronouns,
      abilities: finalAbilities(),
      baseAbilities: state.abilities,
      abilityBonuses: abilityBonuses(),
      skills: state.skills.slice(),
      skillRefs: linked.skillRefs,
      feat: effectiveFeat(),
      featureRefs: linked.featureRefs,
      spells: state.spells.slice(),
      spellRefs: linked.spellRefs,
      equipment: state.equipment,
      about: {
        appearance: state.appearance,
        personality: state.personality,
        ideals: state.ideals,
        bonds: state.bonds,
        flaws: state.flaws,
        notes: state.notes
      }
    };
  }

  async function saveCharacter() {
    state.saveError = "";
    state.saveMessage = "";
    render();
    if (!api) {
      setState({ saveError: "Player API is unavailable on this page." });
      return;
    }

    const payload = exportPayload();
    const createPayload = {
      name: payload.name,
      level: payload.level,
      gameSystemId: "dnd5e",
      race: payload.raceRef,
      class: payload.classRef,
      background: payload.background,
      alignment: payload.alignment,
      abilities: payload.abilities,
      hpMax: 10,
      hpCurrent: 10,
      ac: 10,
      speed: "30 ft.",
      hitDice: "1d8"
    };

    let character = null;
    try {
      const campaignId = new URLSearchParams(location.search).get("campaignId");
      const result = campaignId
        ? await api.createCharacter(campaignId, createPayload)
        : await api.createStandaloneCharacter(createPayload);
      character = result?.character;
      if (!character?.id) throw new Error("Character created, but the server returned no character id.");

      const patch = linkedSheetPatch();
      const patched = campaignId
        ? await api.patchSheet(campaignId, character.id, patch)
        : await api.patchSheetDirect(character.id, patch);
      const saved = patched?.character || character;

      setState({
        createdCharacterId: saved.id || character.id,
        saveMessage: `${saved.name || character.name} was created with Compendium-linked class, race, skills, feat, and spells.`,
        saveError: ""
      });
    } catch (err) {
      const authHint = Number(err?.status) === 401 ? " Sign in through Player Home first, then come back here." : "";
      const partial = character?.id
        ? " The character itself was created, but linking its Compendium entries failed."
        : "";
      setState({
        createdCharacterId: character?.id || state.createdCharacterId,
        saveError: `${err?.message || "Could not create character."}${partial}${authHint}`,
        saveMessage: ""
      });
    }
  }

  function exportJson() {
    const payload = exportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (payload.name || "character")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "character";
    a.href = url;
    a.download = `${slug}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toggleClassSkill(skill) {
    const cfg = classSkillConfig();
    if (!cfg.skills.includes(skill)) return;
    if (state.skills.includes(skill)) {
      setState({ skills: state.skills.filter((x) => x !== skill) });
      return;
    }
    if (state.skills.length >= cfg.count) return;
    setState({ skills: [...state.skills, skill] });
  }

  els.steps.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-go-step]");
    if (!btn) return;
    const next = Number(btn.dataset.goStep);
    if (!Number.isInteger(next)) return;
    setState({ step: Math.max(0, Math.min(STEPS.length - 1, next)) });
  });

  els.content.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-save-character], [data-export-character]");
    if (!t) return;

    if (t.dataset.ruleset) {
      const ruleset = t.dataset.ruleset;
      const patch = { ruleset };
      if (ruleset !== "both") patch.bonusSource = ruleset;
      if (state.className && !CLASSES.find((x) => x.name === state.className)?.rules.includes(ruleset) && ruleset !== "both") {
        patch.className = "";
        patch.skills = [];
      }
      if (state.species && !SPECIES.find((x) => x.name === state.species)?.rules.includes(ruleset) && ruleset !== "both") patch.species = "";
      if (state.background && !BACKGROUNDS.find((x) => x.name === state.background)?.rules.includes(ruleset) && ruleset !== "both") patch.background = "";
      setState(patch);
      return;
    }
    if (t.dataset.complexity) { setState({ classComplexity: t.dataset.complexity }); return; }
    if (t.dataset.class) {
      const chosen = CLASSES.find((x) => x.name === t.dataset.class);
      setState({ className: t.dataset.class, skills: [], spells: chosen?.caster ? state.spells : [] });
      return;
    }
    if (t.dataset.skill) { toggleClassSkill(t.dataset.skill); return; }
    if (t.dataset.species) {
      setState({ species: t.dataset.species, speciesBonuses: { primary: "", secondary: "" } });
      return;
    }
    if (t.dataset.background) {
      const bg = BACKGROUNDS.find((x) => x.name === t.dataset.background);
      setState({
        background: t.dataset.background,
        feat: state.feat || (state.ruleset === "2024" ? bg?.feat || "" : ""),
        backgroundBonuses: { primary: "", secondary: "" }
      });
      return;
    }
    if (t.dataset.bonusSource) { setState({ bonusSource: t.dataset.bonusSource }); return; }
    if (t.dataset.abilityMethod) { chooseAbilityMethod(t.dataset.abilityMethod); return; }
    if (Object.prototype.hasOwnProperty.call(t.dataset, "feat")) { setState({ feat: t.dataset.feat }); return; }
    if (t.dataset.spell) {
      const spell = t.dataset.spell;
      setState({
        spells: state.spells.includes(spell)
          ? state.spells.filter((x) => x !== spell)
          : [...state.spells, spell]
      });
      return;
    }
    if (t.dataset.equipment) { setState({ equipment: t.dataset.equipment }); return; }
    if (t.hasAttribute("data-roll-abilities")) { rollAbilities(); return; }
    if (t.hasAttribute("data-save-character")) { void saveCharacter(); return; }
    if (t.hasAttribute("data-export-character")) exportJson();
  });

  els.content.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-ability]")) {
      const k = t.dataset.ability;
      const val = Number(t.value);
      const abilities = { ...state.abilities, [k]: val };
      if (state.abilityMethod === "standard") {
        const duplicates = ABILITIES.filter((a) => a !== k && Number(abilities[a]) === val);
        if (duplicates.length) {
          const old = Number(state.abilities[k]);
          abilities[duplicates[0]] = old;
        }
      }
      state.abilities = abilities;
      saveDraft();
      render();
      return;
    }
    if (t.matches("[data-species-bonus]")) {
      const kind = t.dataset.speciesBonus;
      const next = { ...state.speciesBonuses, [kind]: t.value };
      if (kind === "primary" && next.secondary === t.value) next.secondary = "";
      if (kind === "secondary" && next.primary === t.value) next.primary = "";
      state.speciesBonuses = next;
      saveDraft();
      render();
      return;
    }
    if (t.matches("[data-bg-bonus]")) {
      const kind = t.dataset.bgBonus;
      const next = { ...state.backgroundBonuses, [kind]: t.value };
      if (kind === "primary" && next.secondary === t.value) next.secondary = "";
      if (kind === "secondary" && next.primary === t.value) next.primary = "";
      state.backgroundBonuses = next;
      saveDraft();
      render();
      return;
    }
    if (t.matches("[data-field]")) {
      const key = t.dataset.field;
      state[key] = key === "level" ? Number(t.value) || 1 : t.value;
      saveDraft();
      if (key === "name") renderSteps();
    }
  });

  els.content.addEventListener("input", (e) => {
    const t = e.target;
    if (t.matches("[data-field]") && t.tagName !== "SELECT") {
      const key = t.dataset.field;
      state[key] = key === "level" ? Number(t.value) || 1 : t.value;
      saveDraft();
    }
    if (t.matches('[data-ability][type="number"]')) {
      state.abilities[t.dataset.ability] = Number(t.value);
      saveDraft();
    }
  });

  els.prev.addEventListener("click", () => setState({ step: Math.max(0, state.step - 1) }));
  els.next.addEventListener("click", () => {
    const id = STEPS[state.step][0];
    if (!canAdvance(id)) return;
    setState({ step: Math.min(STEPS.length - 1, state.step + 1) });
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  els.reset?.addEventListener("click", () => els.resetDialog?.showModal());
  els.resetDialog?.addEventListener("close", () => {
    if (els.resetDialog.returnValue !== "reset") return;
    state = defaultState();
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    render();
  });

  render();
})();