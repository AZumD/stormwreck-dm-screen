(function () {
  "use strict";

  if (window.CatalogueContentI18n?.installed) return;

  const records = new Map();
  const wrappedTypes = new Set();
  let storeWrapped = false;
  let observer = null;

  function isSwedish() {
    return window.AppI18n?.language === "sv" || window.AppI18n?.isSwedish?.();
  }

  function key(type, id) {
    return `${String(type || "").trim()}:${String(id || "").trim()}`;
  }

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (!value || typeof value !== "object") return value;
    const out = {};
    Object.entries(value).forEach(([k, v]) => { out[k] = clone(v); });
    return out;
  }

  function register(type, entries) {
    const safeType = String(type || "").trim();
    if (!safeType || !entries) return;
    Object.entries(entries).forEach(([id, record]) => {
      if (!id || !record?.sv) return;
      records.set(key(safeType, id), {
        type: safeType,
        id,
        en: clone(record.en || {}),
        sv: clone(record.sv || {}),
        aliases: Array.isArray(record.aliases) ? record.aliases.map(String) : []
      });
    });
    installSearchField(safeType);
    decorateCachedType(safeType);
    queueApply();
  }

  function getRecord(type, id) {
    return records.get(key(type, id)) || null;
  }

  function seedEntry(type, id) {
    const seeds = window.CatalogueSeeds?.[type];
    return Array.isArray(seeds) ? seeds.find((entry) => entry?.id === id) || null : null;
  }

  function comparable(value) {
    if (value === undefined) return "__undefined__";
    try { return JSON.stringify(value); } catch { return String(value); }
  }

  function originalValue(record, type, id, field) {
    if (Object.prototype.hasOwnProperty.call(record.en || {}, field)) return record.en[field];
    const seed = seedEntry(type, id);
    if (seed && Object.prototype.hasOwnProperty.call(seed, field)) return seed[field];
    return undefined;
  }

  function fieldMayLocalize(record, entry, field) {
    if (!entry || !Object.prototype.hasOwnProperty.call(entry, field)) return false;
    const original = originalValue(record, record.type, record.id, field);
    if (original === undefined) return true;
    return comparable(entry[field]) === comparable(original);
  }

  function localizedFields(type, entry) {
    const record = getRecord(type, entry?.id);
    if (!record || !entry) return null;
    const sv = {};
    Object.entries(record.sv).forEach(([field, value]) => {
      if (fieldMayLocalize(record, entry, field)) sv[field] = clone(value);
    });
    return sv;
  }

  function flattenSearch(value, out) {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => flattenSearch(v, out));
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach((v) => flattenSearch(v, out));
      return;
    }
    out.push(String(value));
  }

  function decorate(type, entry) {
    if (!entry || typeof entry !== "object") return entry;
    const record = getRecord(type, entry.id);
    if (!record) return entry;
    const sv = localizedFields(type, entry) || {};
    const search = [];
    flattenSearch(record.sv, search);
    flattenSearch(record.aliases, search);
    try {
      Object.defineProperty(entry, "i18n", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: { ...(entry.i18n || {}), sv }
      });
      Object.defineProperty(entry, "searchSv", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: search.join(" ")
      });
    } catch {
      /* A frozen test fixture can still be displayed through getRecord(). */
    }
    return entry;
  }

  function decorateCachedType(type) {
    if (!isSwedish() || !window.CatalogueStore?.list) return;
    try {
      const rows = window.CatalogueStore.list(type) || [];
      rows.forEach((entry) => decorate(type, entry));
    } catch {
      /* Store may not have bootstrapped this type yet. */
    }
  }

  function localizedName(type, entry) {
    const sv = entry?.i18n?.sv || localizedFields(type, entry) || {};
    return String(sv.name || entry?.name || entry?.title || "");
  }

  function installSearchField(type) {
    if (!isSwedish()) return;
    const config = window.CatalogueConfigs?.[type];
    if (!config) return;
    config.searchFields = Array.isArray(config.searchFields) ? config.searchFields : [];
    if (!config.searchFields.includes("searchSv")) config.searchFields.push("searchSv");
    wrappedTypes.add(type);
  }

  function wrapStore() {
    if (storeWrapped || !window.CatalogueStore) return;
    const store = window.CatalogueStore;
    const originalList = store.list?.bind(store);
    const originalGet = store.get?.bind(store);
    const originalLoadAll = store.loadAll?.bind(store);
    if (!originalList || !originalGet || !originalLoadAll) return;

    store.list = function localizedList(type) {
      const rows = originalList(type) || [];
      if (!isSwedish()) return rows;
      rows.forEach((entry) => decorate(type, entry));
      return rows.slice().sort((a, b) =>
        localizedName(type, a).localeCompare(localizedName(type, b), "sv", { sensitivity: "base" })
      );
    };
    store.get = function localizedGet(type, id) {
      const entry = originalGet(type, id);
      return isSwedish() ? decorate(type, entry) : entry;
    };
    store.loadAll = function localizedLoadAll(type) {
      const rows = originalLoadAll(type) || [];
      if (isSwedish()) rows.forEach((entry) => decorate(type, entry));
      return rows;
    };
    storeWrapped = true;
  }

  const VALUE_MAP = new Map([
    ["Abilities", "Grundegenskaper"],
    ["Core Mechanics", "Grundmekanik"],
    ["Combat", "Strid"],
    ["Movement", "Förflyttning"],
    ["Conditions", "Tillstånd"],
    ["Magic", "Magi"],
    ["Rest & Recovery", "Vila & återhämtning"],
    ["Exploration", "Utforskning"],
    ["Other", "Övrigt"],
    ["Strength", "Styrka"],
    ["Dexterity", "Smidighet"],
    ["Constitution", "Fysik"],
    ["Intelligence", "Intelligens"],
    ["Wisdom", "Visdom"],
    ["Charisma", "Karisma"],
    ["Cantrip", "Cantrip"],
    ["Abjuration", "Abjuration"],
    ["Conjuration", "Frammaning"],
    ["Divination", "Spådom"],
    ["Enchantment", "Förtrollning"],
    ["Evocation", "Evokation"],
    ["Illusion", "Illusion"],
    ["Necromancy", "Nekromanti"],
    ["Transmutation", "Transmutation"],
    ["Instantaneous", "Omedelbar"],
    ["Touch", "Beröring"],
    ["Self", "Egen"],
    ["Small", "Liten"],
    ["Medium", "Medelstor"],
    ["Large", "Stor"],
    ["Core rules", "Grundregler"]
  ]);

  function translateScalar(value) {
    let text = String(value ?? "");
    if (VALUE_MAP.has(text)) return VALUE_MAP.get(text);
    const replacements = [
      [/\bStrength\b/g, "Styrka"],
      [/\bDexterity\b/g, "Smidighet"],
      [/\bConstitution\b/g, "Fysik"],
      [/\bIntelligence\b/g, "Intelligens"],
      [/\bWisdom\b/g, "Visdom"],
      [/\bCharisma\b/g, "Karisma"],
      [/\bLight armor\b/gi, "lätt rustning"],
      [/\bMedium armor\b/gi, "medeltung rustning"],
      [/\bHeavy armor\b/gi, "tung rustning"],
      [/\bshields\b/gi, "sköldar"],
      [/\bNone\b/g, "Ingen"],
      [/\b1 action\b/gi, "1 handling"],
      [/\b1 bonus action\b/gi, "1 bonushandling"],
      [/\b1 reaction\b/gi, "1 reaktion"],
      [/\b1 minute\b/gi, "1 minut"],
      [/\b1 hour\b/gi, "1 timme"],
      [/\b8 hours\b/gi, "8 timmar"],
      [/\bConcentration, up to\b/gi, "Koncentration, upp till"],
      [/\bup to\b/gi, "upp till"],
      [/\bInstantaneous\b/g, "Omedelbar"],
      [/\bTouch\b/g, "Beröring"],
      [/\bSelf\b/g, "Egen"],
      [/\bfeet\b/gi, "fot"],
      [/\brounds?\b/gi, (m) => m.toLowerCase().endsWith("s") ? "rundor" : "runda"]
    ];
    replacements.forEach(([re, replacement]) => { text = text.replace(re, replacement); });
    return text;
  }

  function currentType() {
    return window.CatalogueApp?.getCurrentType?.() || new URLSearchParams(location.search).get("type") || "";
  }

  function currentEntry(type, id) {
    const entry = window.CatalogueStore?.get?.(type, id);
    return entry ? decorate(type, entry) : null;
  }

  function setText(el, value) {
    const next = String(value ?? "");
    if (el && el.textContent !== next) el.textContent = next;
  }

  function renderRich(value) {
    const text = Array.isArray(value) ? value.join("\n") : String(value ?? "");
    if (window.ContentParser?.markdownLite) return window.ContentParser.markdownLite(text);
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    return `<p>${escaped}</p>`;
  }

  function fieldByDisplayedLabel(type) {
    const map = new Map();
    const config = window.CatalogueConfigs?.[type];
    (config?.sections || []).forEach((section) => {
      (section.fields || []).forEach((field) => {
        if (field?.label) map.set(String(field.label).trim(), field);
      });
    });
    return map;
  }

  function applyList(root, type) {
    const selector = ".cat-list-item[data-id]";
    const rows = [];
    if (root?.matches?.(selector)) rows.push(root);
    root?.querySelectorAll?.(selector).forEach((el) => rows.push(el));
    rows.forEach((row) => {
      const entry = currentEntry(type, row.dataset.id);
      const record = getRecord(type, row.dataset.id);
      if (!entry || !record) return;
      const sv = entry.i18n?.sv || localizedFields(type, entry) || {};
      if (sv.name) setText(row.querySelector(".cat-list-item__name"), sv.name);
      const meta = row.querySelector(".cat-list-item__meta");
      if (meta && meta.children.length === 0) setText(meta, translateScalar(meta.textContent));
    });
  }

  function applyWiki(root, type) {
    const selector = ".cat-wiki[data-entry-id]";
    const articles = [];
    if (root?.matches?.(selector)) articles.push(root);
    root?.querySelectorAll?.(selector).forEach((el) => articles.push(el));
    const byLabel = fieldByDisplayedLabel(type);

    articles.forEach((article) => {
      const entry = currentEntry(type, article.dataset.entryId);
      const record = getRecord(type, article.dataset.entryId);
      if (!entry || !record) return;
      const sv = entry.i18n?.sv || localizedFields(type, entry) || {};

      if (sv.name) setText(article.querySelector(".cat-wiki__header h2, .cat-wiki__title, h2"), sv.name);
      if (sv.summary) setText(article.querySelector(".cat-wiki__lede"), sv.summary);

      article.querySelectorAll(".cat-wiki__meta").forEach((meta) => {
        if (!meta.children.length) setText(meta, translateScalar(meta.textContent));
      });

      article.querySelectorAll(".cat-wiki__field").forEach((block) => {
        const dt = block.querySelector("dt");
        const dd = block.querySelector("dd");
        if (!dt || !dd) return;
        const field = byLabel.get(String(dt.textContent || "").trim());
        if (!field) return;
        let value;
        if (Object.prototype.hasOwnProperty.call(sv, field.id)) value = sv[field.id];
        else if (record && fieldMayLocalize(record, entry, field.id)) value = translateScalar(entry[field.id]);
        else return;

        if (value == null || value === "") return;
        if (typeof value === "string" && !/[\n*@]/.test(value) && !Array.isArray(value)) {
          setText(dd, value);
          return;
        }
        const html = renderRich(value);
        if (dd.innerHTML !== html) dd.innerHTML = html;
      });
    });
  }

  function apply(root = document) {
    if (!isSwedish() || !root) return;
    wrapStore();
    const type = currentType();
    if (!type) return;
    installSearchField(type);
    applyList(root, type);
    applyWiki(root, type);
  }

  let applyQueued = false;
  function queueApply() {
    if (!isSwedish() || applyQueued || typeof requestAnimationFrame !== "function") return;
    applyQueued = true;
    requestAnimationFrame(() => {
      applyQueued = false;
      apply(document);
    });
  }

  function installObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            apply(node);
            break;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function install() {
    if (!isSwedish()) return;
    wrapStore();
    records.forEach((record) => installSearchField(record.type));
    installObserver();
    queueApply();
  }

  window.CatalogueContentI18n = {
    installed: true,
    register,
    install,
    getRecord,
    localizedFields,
    translateScalar,
    apply,
    _test: { records, fieldMayLocalize, seedEntry, comparable }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
