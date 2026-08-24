/** Shared catalogue UI — list + wiki view + form editor */
window.CatalogueApp = (function () {
  "use strict";

  const MAX_INPUT_BYTES = 25 * 1024 * 1024;
  /* data-URL string length caps — IndexedDB can hold much more than localStorage */
  const MAX_PORTRAIT_CHARS = 12 * 1024 * 1024;
  const MAX_MAP_CHARS = 20 * 1024 * 1024;
  const ABILITY_IDS = new Set(["str", "dex", "con", "int", "wis", "cha"]);

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mod(score) {
    const n = parseInt(score, 10);
    if (Number.isNaN(n)) return "";
    const m = Math.floor((n - 10) / 2);
    return m >= 0 ? `+${m}` : String(m);
  }

  function listSummary(entry, config) {
    if (Array.isArray(config.listMeta) && config.listMeta.length) {
      const bits = config.listMeta
        .map((key) => {
          if (key === "level" && (entry.level === "0" || String(entry.level).toLowerCase() === "cantrip")) {
            return "Cantrip";
          }
          if (key === "level" && entry.level != null && entry.level !== "") return `Lv ${entry.level}`;
          if (key === "cr" && entry.cr) return `CR ${entry.cr}`;
          if (key === "entryKind") {
            const labels = config.entryKindLabels || config.groupLabels || {};
            const raw = entry.entryKind || "";
            return labels[raw] || raw;
          }
          const v = entry[key];
          if (Array.isArray(v)) return v.filter(Boolean).slice(0, 2).join(", ");
          return v;
        })
        .filter(Boolean)
        .map(String);
      if (bits.length) return bits.join(" · ");
    }
    if (config.type === "pc") {
      const bits = [entry.class, entry.level ? `Lv ${entry.level}` : ""].filter(Boolean);
      return bits.join(" · ") || "Player character";
    }
    if (config.type === "npc") return entry.role || entry.summary?.slice(0, 60) || "NPC";
    if (config.type === "item") {
      return [entry.category, entry.itemType, entry.rarity].filter(Boolean).join(" · ") || "Item";
    }
    if (config.type === "monster") return [entry.size, entry.creatureType, entry.cr ? `CR ${entry.cr}` : ""].filter(Boolean).join(" · ") || "Monster";
    if (config.type === "location") {
      return [entry.locationType, entry.featuredIn?.[0] ? `Featured in ${entry.featuredIn[0]}` : ""].filter(Boolean).join(" · ") || "Location";
    }
    if (config.type === "race") {
      const kind = entry.entryKind === "subspecies" ? "Subspecies" : entry.entryKind === "species" ? "Species" : "";
      return [kind, entry.size, entry.speed].filter(Boolean).join(" · ") || "Race";
    }
    if (config.type === "class") {
      if (entry.entryKind === "subclass") return "Subclass";
      return [entry.hitDie, entry.primaryAbility].filter(Boolean).join(" · ") || "Class";
    }
    if (config.type === "skill") return entry.defaultAbility || entry.summary?.slice(0, 60) || "Skill";
    if (config.type === "feature") {
      return [entry.featureType, entry.levelPrerequisite ? `Lv ${entry.levelPrerequisite}` : ""].filter(Boolean).join(" · ") || "Feature";
    }
    if (config.type === "spell") {
      const lvl = entry.level === "0" || String(entry.level).toLowerCase() === "cantrip" ? "Cantrip" : `Lv ${entry.level}`;
      return [lvl, entry.school].filter(Boolean).join(" · ") || "Spell";
    }
    return "";
  }

  function matchesShowWhen(condition, entry) {
    if (!condition || typeof condition !== "object") return true;
    const field = condition.field;
    if (!field) return true;
    const value = entry?.[field];
    if (Object.prototype.hasOwnProperty.call(condition, "equals")) {
      return String(value ?? "") === String(condition.equals);
    }
    if (Object.prototype.hasOwnProperty.call(condition, "notEquals")) {
      return String(value ?? "") !== String(condition.notEquals);
    }
    if (Array.isArray(condition.in)) {
      return condition.in.map(String).includes(String(value ?? ""));
    }
    return true;
  }

  function isSectionVisible(section, entry) {
    return matchesShowWhen(section.showWhen, entry);
  }

  function isFieldVisible(field, entry) {
    return matchesShowWhen(field.showWhen, entry);
  }

  function facetValue(entry, fieldId) {
    const raw = entry?.[fieldId];
    if (raw == null) return "";
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String).join(", ");
    return String(raw).trim();
  }

  function groupKeyForEntry(entry, groupBy) {
    const raw = facetValue(entry, groupBy);
    return raw || "";
  }

  function groupLabel(config, key) {
    const labels = config.groupLabels || {};
    if (Object.prototype.hasOwnProperty.call(labels, key)) return labels[key];
    if (!key) return labels[""] || "Uncategorized";
    return key;
  }

  function buildSearchHaystack(entry, config) {
    const fields = Array.isArray(config.searchFields) && config.searchFields.length
      ? config.searchFields
      : null;
    const values = [];
    if (fields) {
      fields.forEach((key) => {
        const v = entry[key];
        if (Array.isArray(v)) values.push(...v.filter(Boolean));
        else if (v != null && String(v).trim()) values.push(String(v));
      });
    } else {
      [
        entry.name,
        entry.role,
        entry.summary,
        entry.itemType,
        entry.category,
        entry.creatureType,
        entry.class,
        entry.size,
        entry.hitDie,
        entry.primaryAbility,
        entry.source,
        entry.school,
        entry.level,
        entry.classes,
        entry.defaultAbility,
        entry.featureType,
        entry.grantedBy,
        entry.entryKind,
        entry.parentClassRef,
        entry.parentSpeciesRef,
        entry.parentLocationRef,
        entry.locationType,
        entry.rarity,
        ...(Array.isArray(entry.tags) ? entry.tags : []),
        ...(Array.isArray(entry.classRefs) ? entry.classRefs : [])
      ]
        .filter(Boolean)
        .forEach((v) => values.push(String(v)));
    }
    return values.join(" ").toLowerCase();
  }

  function selectOptionsHtml(field, current) {
    const options = Array.isArray(field.options) ? field.options : [];
    const normalized = options.map((opt) => {
      if (opt && typeof opt === "object") {
        return { value: String(opt.value ?? ""), label: String(opt.label ?? opt.value ?? "") };
      }
      return { value: String(opt), label: String(opt) };
    });
    const known = new Set(normalized.map((o) => o.value));
    const extra =
      current !== undefined && current !== null && String(current) !== "" && !known.has(String(current))
        ? `<option value="${escapeHtml(String(current))}" selected>${escapeHtml(String(current))}</option>`
        : "";
    const opts = normalized
      .map((opt) => {
        const selected = String(opt.value) === String(current ?? "") ? " selected" : "";
        return `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(opt.label)}</option>`;
      })
      .join("");
    return `${extra}${opts}`;
  }

  function formatWikiText(text) {
    if (window.ContentParser?.markdownLite) {
      return ContentParser.markdownLite(String(text ?? ""));
    }
    let html = escapeHtml(String(text ?? ""));
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    return html
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  /** Parse stored refs: @type:id|Label | type:id | bare id (with field.refType) */
  function parseEntityRef(raw, defaultType) {
    const text = String(raw || "").trim();
    if (!text) return null;
    const at = text.match(/^@([\w-]+):([\w-]+)(?:\|(.+))?$/);
    if (at) return { type: at[1], id: at[2], label: (at[3] || "").trim() };
    const typed = text.match(/^([\w-]+):([\w-]+)(?:\|(.+))?$/);
    if (typed) return { type: typed[1], id: typed[2], label: (typed[3] || "").trim() };
    if (defaultType) return { type: defaultType, id: text, label: "" };
    return { type: "", id: text, label: "" };
  }

  function resolveRefLabel(ref) {
    if (ref.label) return ref.label;
    const entity = resolveEntityForRef(ref, ref.type);
    if (entity?.name) return entity.name;
    return ref.id;
  }

  function listRowIsLinked(raw) {
    return /^@[\w-]+:[\w-]+/.test(String(raw || "").trim()) || /^[\w-]+:[\w-]+/.test(String(raw || "").trim());
  }

  function formatStoredRef(type, entry) {
    const id = entry?.id || "";
    const name = entry?.name || id;
    if (!id) return "";
    return `@${type}:${id}|${name}`;
  }

  function resolveEntityForRef(ref, defaultType) {
    if (!ref) return null;
    const tryIds = [ref.id];
    if (ref.id && /^(skill|feature|spell|item|class|race|pc|npc|monster|location)-/.test(ref.id)) {
      tryIds.push(ref.id.replace(/^(?:skill|feature|spell|item|class|race|pc|npc|monster|location)-/, ""));
    }
    for (const id of tryIds) {
      const hit =
        window.EntityRegistry?.resolve?.(id) ||
        window.ENTITIES?.[id] ||
        null;
      if (hit) return hit;
    }
    const type = ref.type || defaultType;
    if (type && window.CatalogueStore?.get) {
      const entry = CatalogueStore.get(type, ref.id);
      if (entry?.id && window.EntityRegistry?.resolve) {
        return (
          EntityRegistry.resolve(entry.linkId || entry.id) ||
          EntityRegistry.resolve(entry.id) ||
          null
        );
      }
    }
    return null;
  }

  function renderEntityRefHtml(raw, defaultType) {
    const ref = parseEntityRef(raw, defaultType);
    if (!ref) return escapeHtml(String(raw || ""));

    const entity = resolveEntityForRef(ref, defaultType);
    const label = (entity && (entity.name || ref.label)) || ref.label || raw || ref.id;
    const looksLinked = listRowIsLinked(raw) || !!entity;
    if (!looksLinked) {
      return escapeHtml(String(label));
    }

    const type = (entity && entity.type) || ref.type || defaultType || "";
    const id = (entity && (entity.id || entity.catalogueId)) || ref.id;
    return `<button type="button" class="entity-link" data-type="${escapeHtml(type)}" data-id="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
  }

  function isEmptyFieldValue(value, field) {
    if (field.type === "checkbox") return !value;
    if (field.type === "list") return !Array.isArray(value) || !value.filter(Boolean).length;
    if (field.type === "image") return !value;
    if (field.type === "uvtt") return !value || typeof value !== "object";
    return value === undefined || value === null || String(value).trim() === "";
  }

  function renderWikiFieldValue(field, value) {
    if (field.type === "image") {
      const isPortrait = field.kind === "portrait" || field.id === "portrait";
      const cls = isPortrait ? "cat-wiki__media cat-wiki__media--portrait" : "cat-wiki__media cat-wiki__media--map";
      return `<img class="${cls}" src="${value}" alt="${escapeHtml(field.label || "")}">`;
    }
    if (field.type === "list") {
      const items = (Array.isArray(value) ? value : []).filter(Boolean);
      return `<ul class="cat-wiki__list">${items
        .map((i) => `<li>${field.refType ? renderEntityRefHtml(i, field.refType) : escapeHtml(i)}</li>`)
        .join("")}</ul>`;
    }
    if (field.type === "checkbox") {
      return `<span class="cat-wiki__flag">Yes</span>`;
    }
    if (ABILITY_IDS.has(field.id)) {
      const m = mod(value);
      return `<span class="cat-wiki__score">${escapeHtml(String(value))}${
        m ? ` <span class="cat-wiki__mod">(${escapeHtml(m)})</span>` : ""
      }</span>`;
    }
    if (field.type === "textarea") {
      return `<div class="cat-wiki__prose">${formatWikiText(value)}</div>`;
    }
    if (field.refType || (typeof value === "string" && value.includes("@"))) {
      return `<div class="cat-wiki__value">${renderEntityRefHtml(value, field.refType)}</div>`;
    }
    return `<div class="cat-wiki__value">${escapeHtml(String(value))}</div>`;
  }

  function renderWikiAbilityStrip(fields, entry) {
    const cells = fields
      .filter((f) => !isEmptyFieldValue(entry[f.id], f))
      .map(
        (f) => `
        <div class="cat-wiki__ability">
          <span class="cat-wiki__ability-label">${escapeHtml(f.label)}</span>
          ${renderWikiFieldValue(f, entry[f.id])}
        </div>`
      )
      .join("");
    return cells ? `<div class="cat-wiki__abilities">${cells}</div>` : "";
  }

  function renderWikiView(entry, config) {
    const skipIds = new Set(["name"]);
    const heroSrc = entry.portrait || entry.mapImage || "";
    if (entry.portrait) skipIds.add("portrait");
    else if (entry.mapImage) skipIds.add("mapImage");

    const summaryText = entry.summary && String(entry.summary).trim() ? String(entry.summary).trim() : "";
    if (summaryText) skipIds.add("summary");

    const hero = heroSrc
      ? `<div class="cat-wiki__hero">
          <img class="cat-wiki__hero-img${entry.portrait ? " cat-wiki__hero-img--portrait" : " cat-wiki__hero-img--map"}"
            src="${heroSrc}" alt="">
        </div>`
      : "";

    const sections = config.sections
      .filter((section) => isSectionVisible(section, entry))
      .map((section) => {
        const visible = section.fields.filter(
          (f) =>
            isFieldVisible(f, entry) && !skipIds.has(f.id) && !isEmptyFieldValue(entry[f.id], f)
        );
        if (!visible.length) return "";

        const allAbilities = visible.every((f) => ABILITY_IDS.has(f.id));
        const body = allAbilities
          ? renderWikiAbilityStrip(visible, entry)
          : `<dl class="cat-wiki__fields">
              ${visible
                .map(
                  (f) => `
                <div class="cat-wiki__field cat-wiki__field--${f.grid || "full"}">
                  <dt>${escapeHtml(f.label)}</dt>
                  <dd>${renderWikiFieldValue(f, entry[f.id])}</dd>
                </div>`
                )
                .join("")}
            </dl>`;

        return `
          <section class="cat-wiki__section">
            <h3 class="cat-wiki__section-title">${escapeHtml(section.title)}</h3>
            ${body}
          </section>`;
      })
      .filter(Boolean)
      .join("");

    const meta = listSummary(entry, config);
    const lede = summaryText ? `<p class="cat-wiki__lede">${escapeHtml(summaryText)}</p>` : "";

    return `
      <article class="cat-wiki" data-entry-id="${escapeHtml(entry.id)}">
        <header class="cat-wiki__header">
          <div class="cat-wiki__header-main">
            ${hero}
            <div class="cat-wiki__intro">
              ${meta ? `<p class="cat-wiki__kicker">${escapeHtml(meta)}</p>` : ""}
              <h2 class="cat-wiki__title">${escapeHtml(entry.name || "Untitled")}</h2>
              ${lede}
            </div>
          </div>
          <div class="cat-wiki__actions">
            <button type="button" class="cat-btn" data-action="edit">Edit</button>
            <button type="button" class="cat-btn cat-btn--danger" data-action="delete">Delete</button>
          </div>
        </header>
        <div class="cat-wiki__body">
          ${sections || `<p class="cat-wiki__empty">No details yet. Click Edit to fill this entry in.</p>`}
        </div>
      </article>`;
  }

  function readForm(root, config) {
    const entry = { id: root.dataset.entryId };
    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === "list") {
          entry[field.id] = readListFieldValues(root, field.id);
          return;
        }
        if (field.type === "image") {
          entry[field.id] = root.querySelector(`[data-image-value="${field.id}"]`)?.value || "";
          return;
        }
        if (field.type === "uvtt") {
          const raw = root.querySelector(`[data-uvtt-value="${field.id}"]`)?.value || "";
          if (!raw) entry[field.id] = null;
          else {
            try {
              entry[field.id] = JSON.parse(raw);
            } catch {
              entry[field.id] = null;
            }
          }
          return;
        }
        const el = root.querySelector(`[name="${field.id}"]`);
        if (!el) return;
        if (field.type === "checkbox") entry[field.id] = el.checked;
        else if (field.type === "number") entry[field.id] = el.value === "" ? "" : Number(el.value);
        else entry[field.id] = el.value;
      });
    });
    return entry;
  }

  function renderRefListRow(field, raw) {
    const value = String(raw || "").trim();
    const ref = parseEntityRef(value, field.refType);
    const linked = !!(ref && (listRowIsLinked(value) || resolveEntityForRef(ref, field.refType)));
    if (linked && ref) {
      const stored = value.includes("@")
        ? value
        : formatStoredRef(field.refType, { id: ref.id, name: resolveRefLabel(ref) });
      return `
            <div class="cat-list-row cat-list-row--ref">
              <input type="hidden" value="${escapeHtml(stored)}">
              <span class="cat-ref-chip">${renderEntityRefHtml(stored, field.refType)}</span>
              <button type="button" class="cat-list-remove" aria-label="Remove row">×</button>
            </div>`;
    }
    return `
            <div class="cat-list-row">
              <input type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || "Custom entry…")}">
              <button type="button" class="cat-list-remove" aria-label="Remove row">×</button>
            </div>`;
  }

  function renderListField(field, values) {
    const items = Array.isArray(values) ? values.filter((v) => String(v || "").trim()) : [];
    const isRef = !!field.refType;
    const rows = items.length
      ? items.map((val) => (isRef ? renderRefListRow(field, val) : `
            <div class="cat-list-row">
              <input type="text" value="${escapeHtml(val)}" placeholder="${escapeHtml(field.placeholder || "")}">
              <button type="button" class="cat-list-remove" aria-label="Remove row">×</button>
            </div>`))
      : isRef
        ? []
        : [
            `
            <div class="cat-list-row">
              <input type="text" value="" placeholder="${escapeHtml(field.placeholder || "")}">
              <button type="button" class="cat-list-remove" aria-label="Remove row">×</button>
            </div>`
          ];

    const picker = isRef
      ? `
        <div class="cat-ref-picker" data-ref-picker="${escapeHtml(field.id)}">
          <input type="search" class="cat-ref-search" placeholder="${escapeHtml(
            field.searchPlaceholder || `Search ${field.refType} catalogue…`
          )}" autocomplete="off">
          <div class="cat-ref-results" hidden></div>
        </div>`
      : "";

    const addLabel = isRef ? "+ Add custom" : "+ Add row";
    const hint = field.hint
      ? `<p class="cat-field-hint">${escapeHtml(field.hint)}</p>`
      : isRef
        ? `<p class="cat-field-hint">Search the ${field.refType} catalogue to link entries, or add a custom line.</p>`
        : "";

    const rowsHtml = rows.length
      ? `<div class="cat-list-rows">${rows.join("")}</div>`
      : `<div class="cat-list-rows cat-list-rows--empty" hidden></div>`;

    return `
      <div class="cat-list-field${isRef ? " cat-list-field--refs" : ""}" data-list-field="${field.id}"${
        isRef ? ` data-ref-type="${escapeHtml(field.refType)}"` : ""
      }>
        ${picker}
        ${rowsHtml}
        <button type="button" class="cat-list-add" data-add-list="${field.id}">${addLabel}</button>
        ${hint}
      </div>`;
  }

  function collectRelatedTypes(config) {
    const types = new Set();
    (config.sections || []).forEach((section) => {
      (section.fields || []).forEach((field) => {
        if (field.refType) types.add(field.refType);
      });
    });
    return [...types];
  }

  function readListFieldValues(root, fieldId) {
    return [...root.querySelectorAll(`[data-list-field="${fieldId}"] .cat-list-row`)]
      .map((row) => {
        const hidden = row.querySelector('input[type="hidden"]');
        if (hidden) return hidden.value.trim();
        const text = row.querySelector('input[type="text"]');
        return text ? text.value.trim() : "";
      })
      .filter(Boolean);
  }

  function renderImageField(field, value) {
    const isPortrait = field.kind === "portrait" || field.id === "portrait";
    const previewClass = isPortrait ? "cat-portrait-preview" : "cat-map-preview";
    const emptyText = field.emptyLabel || (isPortrait ? "No portrait uploaded" : "No map uploaded");
    const uploadLabel = field.uploadLabel || (isPortrait ? "Upload portrait" : "Upload map");
    const clearLabel = field.clearLabel || (isPortrait ? "Remove portrait" : "Remove map");
    const hint =
      field.hint ||
      (isPortrait
        ? "Portraits are saved under /data with your catalogue entries. Large files are resized automatically."
        : "Maps are saved under /data with your catalogue entries. Large files are resized automatically.");

    const preview = value
      ? `<img class="${previewClass}" src="${value}" alt="${escapeHtml(field.label || "Preview")}">`
      : `<div class="${previewClass} ${previewClass}--empty">${escapeHtml(emptyText)}</div>`;

    /* Keep data URL off the attribute when huge — stash via data-has-image + JS on bind */
    const hasImage = !!value;
    return `
      <div class="cat-image-field${isPortrait ? " cat-image-field--portrait" : ""}" data-image-field="${field.id}">
        <input type="hidden" name="${field.id}" data-image-value="${field.id}" value="" data-has-image="${hasImage ? "1" : "0"}">
        ${preview}
        <div class="cat-image-actions">
          <label class="cat-upload-btn">
            ${escapeHtml(uploadLabel)}
            <input type="file" accept="image/*" data-image-input="${field.id}" hidden>
          </label>
          ${hasImage ? `<button type="button" class="cat-btn cat-btn--ghost" data-clear-image="${field.id}">${escapeHtml(clearLabel)}</button>` : ""}
        </div>
        <p class="cat-field-hint">${escapeHtml(hint)}</p>
      </div>`;
  }

  function renderUvttField(field, value) {
    const cal = value && typeof value === "object" ? value : null;
    const status = cal?.grid
      ? `${cal.grid.sizeX}×${cal.grid.sizeY} grid · ${cal.grid.pixelsPerGrid}px/grid · ${cal.sourceFormat || "uvtt"}`
      : field.emptyLabel || "No UVTT imported";
    const uploadLabel = field.uploadLabel || "Import UVTT / dd2vtt";
    const clearLabel = field.clearLabel || "Remove UVTT calibration";
    const hint =
      field.hint ||
      "Imports grid geometry and map image. Large .dd2vtt files require the local server (npm start).";
    return `
      <div class="cat-uvtt-field" data-uvtt-field="${field.id}">
        <input type="hidden" name="${field.id}" data-uvtt-value="${field.id}" value="${escapeHtml(cal ? JSON.stringify(cal) : "")}">
        <p class="cat-uvtt-status">${escapeHtml(status)}</p>
        <div class="cat-image-actions">
          <label class="cat-upload-btn">
            ${escapeHtml(uploadLabel)}
            <input type="file" accept=".dd2vtt,.uvtt,application/json" data-uvtt-input="${field.id}" hidden>
          </label>
          ${cal ? `<button type="button" class="cat-btn cat-btn--ghost" data-clear-uvtt="${field.id}">${escapeHtml(clearLabel)}</button>` : ""}
        </div>
        <p class="cat-field-hint">${escapeHtml(hint)}</p>
      </div>`;
  }

  function renderField(field, entry) {
    const value = entry[field.id];
    const gridClass = `cat-field cat-field--${field.grid || "full"}`;

    if (field.type === "list") {
      return `<div class="${gridClass}"><label>${escapeHtml(field.label)}</label>${renderListField(field, value)}</div>`;
    }

    if (field.type === "image") {
      return `<div class="${gridClass}"><label>${escapeHtml(field.label)}</label>${renderImageField(field, value)}</div>`;
    }

    if (field.type === "uvtt") {
      return `<div class="${gridClass}"><label>${escapeHtml(field.label)}</label>${renderUvttField(field, value)}</div>`;
    }

    if (field.type === "checkbox") {
      return `
        <div class="${gridClass} cat-field--checkbox">
          <label class="cat-checkbox-label">
            <input type="checkbox" name="${field.id}" ${value ? "checked" : ""}>
            ${escapeHtml(field.label)}
          </label>
        </div>`;
    }

    if (field.type === "select") {
      return `
        <div class="${gridClass}">
          <label for="field-${field.id}">${escapeHtml(field.label)}</label>
          <select id="field-${field.id}" name="${field.id}">
            ${selectOptionsHtml(field, value ?? "")}
          </select>
        </div>`;
    }

    if (field.type === "textarea") {
      return `
        <div class="${gridClass}">
          <label for="field-${field.id}">${escapeHtml(field.label)}</label>
          <textarea id="field-${field.id}" name="${field.id}" rows="${field.rows || 4}">${escapeHtml(value ?? "")}</textarea>
        </div>`;
    }

    const modHint =
      ["str", "dex", "con", "int", "wis", "cha"].includes(field.id) && field.type === "number"
        ? `<span class="cat-mod" data-mod-for="${field.id}">${mod(value) ? `(${mod(value)})` : ""}</span>`
        : "";

    return `
      <div class="${gridClass}">
        <label for="field-${field.id}">${escapeHtml(field.label)}</label>
        <div class="cat-input-wrap">
          <input id="field-${field.id}" name="${field.id}" type="${field.type || "text"}"
            value="${escapeHtml(value ?? "")}"
            placeholder="${escapeHtml(field.placeholder || "")}">
          ${modHint}
        </div>
      </div>`;
  }

  function renderForm(entry, config) {
    const sections = config.sections
      .filter((section) => isSectionVisible(section, entry))
      .map((section) => {
        const fields = section.fields.filter((f) => isFieldVisible(f, entry));
        if (!fields.length) return "";
        return `
        <section class="cat-section">
          <h3 class="cat-section__title">${escapeHtml(section.title)}</h3>
          <div class="cat-grid">${fields.map((f) => renderField(f, entry)).join("")}</div>
        </section>`;
      })
      .filter(Boolean)
      .join("");

    return `
      <form class="cat-form" data-entry-id="${escapeHtml(entry.id)}" autocomplete="off">
        <div class="cat-form__toolbar">
          <div class="cat-form__status" id="save-status">Saved locally</div>
          <div class="cat-form__actions">
            <button type="button" class="cat-btn" data-action="done">Done</button>
            <button type="button" class="cat-btn cat-btn--danger" data-action="delete">Delete</button>
          </div>
        </div>
        ${sections}
      </form>`;
  }

  function facetOptionValues(facet, entries) {
    if (Array.isArray(facet.options) && facet.options.length) {
      return facet.options.map((opt) => {
        if (opt && typeof opt === "object") {
          return { value: String(opt.value ?? ""), label: String(opt.label ?? opt.value ?? "") };
        }
        return { value: String(opt), label: String(opt) };
      });
    }
    const seen = new Map();
    entries.forEach((entry) => {
      const raw = entry?.[facet.id];
      const values = Array.isArray(raw) ? raw : [raw];
      values.forEach((v) => {
        const key = v == null ? "" : String(v).trim();
        if (!key) return;
        if (!seen.has(key)) seen.set(key, key);
      });
    });
    return [...seen.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }))
      .map(([value, label]) => ({ value, label }));
  }

  function matchesFacet(entry, facet, selected) {
    if (!selected) return true;
    const raw = entry?.[facet.id];
    if (Array.isArray(raw)) return raw.map(String).includes(selected);
    return String(raw ?? "").trim() === selected;
  }

  function sortGroupKeys(keys, config) {
    const order = Array.isArray(config.groupOrder) ? config.groupOrder : null;
    return keys.slice().sort((a, b) => {
      if (a === "" && b !== "") return 1;
      if (b === "" && a !== "") return -1;
      if (order) {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia !== -1 || ib !== -1) {
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          if (ia !== ib) return ia - ib;
        }
      }
      return groupLabel(config, a).localeCompare(groupLabel(config, b), undefined, {
        sensitivity: "base"
      });
    });
  }

  function renderEntryButton(e, config, activeId) {
    const thumb = e.portrait
      ? `<img class="cat-list-item__thumb" src="${e.portrait}" alt="">`
      : e.mapImage
        ? `<img class="cat-list-item__thumb cat-list-item__thumb--map" src="${e.mapImage}" alt="">`
        : `<span class="cat-list-item__icon" aria-hidden="true">${config.listIcon}</span>`;
    return `
        <button type="button" class="cat-list-item${e.id === activeId ? " is-active" : ""}" data-id="${escapeHtml(e.id)}">
          ${thumb}
          <span class="cat-list-item__body">
            <span class="cat-list-item__name">${escapeHtml(e.name || "Untitled")}</span>
            <span class="cat-list-item__meta">${escapeHtml(listSummary(e, config))}</span>
          </span>
        </button>`;
  }

  /** Resize/compress large photos; IndexedDB allows much bigger final sizes */
  function compressImageFile(file, field) {
    const isPortrait = field?.kind === "portrait" || field?.id === "portrait";
    const maxChars = isPortrait ? MAX_PORTRAIT_CHARS : MAX_MAP_CHARS;
    const maxWidth = isPortrait ? 1800 : 3200;
    const maxHeight = isPortrait ? 1800 : 3200;

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (!img.width || !img.height) {
          reject(new Error("invalid-image"));
          return;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: false });

        function encode(width, height, quality) {
          canvas.width = width;
          canvas.height = height;
          ctx.fillStyle = "#1a1f2a";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL("image/jpeg", quality);
        }

        let width = img.width;
        let height = img.height;
        const fit = Math.min(1, maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * fit));
        height = Math.max(1, Math.round(height * fit));

        let quality = 0.92;
        let dataUrl = encode(width, height, quality);

        while (dataUrl.length > maxChars && quality > 0.4) {
          quality = Math.max(0.4, quality - 0.08);
          dataUrl = encode(width, height, quality);
        }

        let guard = 0;
        while (dataUrl.length > maxChars && guard < 10 && (width > 480 || height > 480)) {
          guard += 1;
          width = Math.max(480, Math.round(width * 0.75));
          height = Math.max(480, Math.round(height * 0.75));
          quality = Math.min(quality, 0.8);
          dataUrl = encode(width, height, quality);
          while (dataUrl.length > maxChars && quality > 0.35) {
            quality = Math.max(0.35, quality - 0.08);
            dataUrl = encode(width, height, quality);
          }
        }

        if (dataUrl.length > maxChars) {
          reject(new Error("too-large"));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("invalid-image"));
      };
      img.src = url;
    });
  }

  function init(type) {
    const config = CatalogueConfigs[type];
    if (!config) throw new Error(`Unknown catalogue type: ${type}`);

    const start = async () => {
      document.body.classList.add("is-booting");
      if (window.LocalApiClient) await LocalApiClient.ready();
      const relatedTypes = collectRelatedTypes(config);
      if (window.CatalogueStore) await CatalogueStore.bootstrap([type, ...relatedTypes]);
      if (window.CatalogueImages) {
        await CatalogueImages.preload(type);
        await CatalogueImages.migrateType(type);
      }
      await boot();
      document.body.classList.remove("is-booting");
    };

    async function boot() {
    const relatedTypes = collectRelatedTypes(config);
    if (window.CatalogueStore && relatedTypes.length) {
      await CatalogueStore.bootstrap([type, ...relatedTypes]);
      for (const related of relatedTypes) {
        if (window.CatalogueSeeds?.[related]) {
          await CatalogueStore.mergeSeeds(related, CatalogueSeeds[related]);
        }
      }
    }
    if (window.CatalogueSeeds?.[type]) {
      await CatalogueStore.mergeSeeds(type, CatalogueSeeds[type]);
    }
    if (window.EntityRegistry?.build) {
      try {
        await EntityRegistry.build();
      } catch (err) {
        console.warn("EntityRegistry.build failed on catalogue page", err);
      }
    }

    const listEl = document.getElementById("cat-list");
    const searchEl = document.getElementById("cat-search");
    const editorEl = document.getElementById("cat-editor");
    const newBtn = document.getElementById("cat-new");
    const titleEl = document.getElementById("cat-title");
    const subtitleEl = document.getElementById("cat-subtitle");

    if (titleEl) titleEl.textContent = config.title;
    if (subtitleEl) subtitleEl.textContent = config.subtitle;
    if (newBtn) newBtn.textContent = config.newLabel;
    if (searchEl) searchEl.placeholder = config.searchPlaceholder;

    let activeId = null;
    let saveTimer = null;
    /** fieldId → data URL for the open form (avoids huge HTML attributes) */
    let imageCache = {};
    /** facetId → selected value ("" = All) */
    const facetState = {};
    (config.facets || []).forEach((f) => {
      facetState[f.id] = "";
    });

    function fieldConfig(fieldId) {
      for (const section of config.sections) {
        const found = section.fields.find((f) => f.id === fieldId);
        if (found) return found;
      }
      return null;
    }

    function allEntries() {
      return window.CatalogueImages
        ? CatalogueImages.hydrateAll(type, CatalogueStore.list(type))
        : CatalogueStore.list(type);
    }

    function entries() {
      const q = (searchEl?.value || "").trim().toLowerCase();
      const facets = Array.isArray(config.facets) ? config.facets : [];
      return allEntries().filter((e) => {
        for (const facet of facets) {
          if (!matchesFacet(e, facet, facetState[facet.id] || "")) return false;
        }
        if (!q) return true;
        return buildSearchHaystack(e, config).includes(q);
      });
    }

    function ensureFacetControls() {
      const tools = searchEl?.closest(".catalogue-sidebar__tools");
      if (!tools || !Array.isArray(config.facets) || !config.facets.length) return;
      let host = tools.querySelector("[data-cat-facets]");
      if (!host) {
        host = document.createElement("div");
        host.className = "cat-facets";
        host.setAttribute("data-cat-facets", "");
        searchEl.insertAdjacentElement("afterend", host);
      }
      const pool = allEntries();
      host.innerHTML = config.facets
        .map((facet) => {
          const opts = facetOptionValues(facet, pool);
          const selected = facetState[facet.id] || "";
          const optionHtml = [
            `<option value="">All</option>`,
            ...opts.map((opt) => {
              const sel = opt.value === selected ? " selected" : "";
              return `<option value="${escapeHtml(opt.value)}"${sel}>${escapeHtml(opt.label)}</option>`;
            })
          ].join("");
          return `
            <label class="cat-facet">
              <span class="cat-facet__label">${escapeHtml(facet.label || facet.id)}</span>
              <select class="cat-facet__select" data-facet-id="${escapeHtml(facet.id)}">${optionHtml}</select>
            </label>`;
        })
        .join("");

      host.querySelectorAll("[data-facet-id]").forEach((select) => {
        select.addEventListener("change", () => {
          facetState[select.dataset.facetId] = select.value || "";
          renderList();
        });
      });
    }

    function renderList() {
      ensureFacetControls();
      const items = entries();
      if (!items.length) {
        const total = allEntries().length;
        listEl.innerHTML = total
          ? `<p class="cat-list-empty">No matching entries.</p>`
          : `<p class="cat-list-empty">No entries yet. Click <strong>${escapeHtml(config.newLabel)}</strong>.</p>`;
        return;
      }

      const groupBy = config.groupBy;
      if (!groupBy) {
        listEl.innerHTML = items.map((e) => renderEntryButton(e, config, activeId)).join("");
        return;
      }

      const groups = new Map();
      items.forEach((e) => {
        const key = groupKeyForEntry(e, groupBy);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(e);
      });

      const keys = sortGroupKeys([...groups.keys()], config);
      listEl.innerHTML = keys
        .map((key) => {
          const rows = groups.get(key) || [];
          if (!rows.length) return "";
          return `
            <div class="cat-list-group">
              <div class="cat-list-group__title">${escapeHtml(groupLabel(config, key))}</div>
              <div class="cat-list-group__items">
                ${rows.map((e) => renderEntryButton(e, config, activeId)).join("")}
              </div>
            </div>`;
        })
        .filter(Boolean)
        .join("");
    }

    function hydrateImageFields(form, entry) {
      imageCache = {};
      config.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type !== "image") return;
          const value = entry[field.id] || "";
          imageCache[field.id] = value;
          const input = form.querySelector(`[data-image-value="${field.id}"]`);
          if (input) input.value = value;
        });
      });
    }

    function bindWikiEvents(article) {
      article.querySelector("[data-action='edit']")?.addEventListener("click", () => {
        renderEditor(activeId, { mode: "edit" });
      });

      article.querySelector("[data-action='delete']")?.addEventListener("click", async () => {
        const name = article.querySelector(".cat-wiki__title")?.textContent || "this entry";
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        clearTimeout(saveTimer);
        try {
          await CatalogueStore.remove(type, article.dataset.entryId);
        } catch {
          alert("Could not delete this entry.");
          return;
        }
        activeId = null;
        renderEditor(null);
      });
    }

    function renderEditor(id, options = {}) {
      const mode = options.mode || "view";
      activeId = id;
      if (!id) {
        imageCache = {};
        editorEl.innerHTML = `<div class="cat-editor-empty"><p>Select an entry or create a new one.</p></div>`;
        renderList();
        return;
      }

      let entry = CatalogueStore.get(type, id);
      if (!entry) {
        activeId = null;
        renderEditor(null);
        return;
      }
      if (window.CatalogueImages) entry = CatalogueImages.hydrate(type, entry);

      if (mode === "edit") {
        editorEl.innerHTML = renderForm(entry, config);
        const form = editorEl.querySelector(".cat-form");
        hydrateImageFields(form, entry);
        bindFormEvents(form);
      } else {
        imageCache = {};
        editorEl.innerHTML = renderWikiView(entry, config);
        bindWikiEvents(editorEl.querySelector(".cat-wiki"));
      }
      renderList();
    }

    function setStatus(msg) {
      const status = document.getElementById("save-status");
      if (status) status.textContent = msg;
    }

    async function saveCurrent(form, options = {}) {
      if (!form) return false;
      const data = readForm(form, config);

      config.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type !== "image") return;
          if (Object.prototype.hasOwnProperty.call(imageCache, field.id)) {
            data[field.id] = imageCache[field.id] || "";
          }
        });
      });

      if (!data.name?.trim()) data.name = config.defaults.name;

      const existingRaw = CatalogueStore.get(type, data.id) || {};
      const existing = window.CatalogueImages ? CatalogueImages.hydrate(type, existingRaw) : existingRaw;
      const merged = { ...existing, ...data };
      config.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type !== "image") return;
          if (!merged[field.id] && existing[field.id] && options.preserveImages !== false) {
            if (!Object.prototype.hasOwnProperty.call(imageCache, field.id) || imageCache[field.id]) {
              merged[field.id] = imageCache[field.id] || existing[field.id];
            }
          }
          /* Never let a blank form field drop a file-backed or legacy image URL */
          if (!merged[field.id] && existingRaw[field.id] && options.preserveImages !== false) {
            if (!Object.prototype.hasOwnProperty.call(imageCache, field.id) || imageCache[field.id]) {
              merged[field.id] = imageCache[field.id] || existingRaw[field.id];
            }
          }
        });
      });

      try {
        const toStore = window.CatalogueImages
          ? await CatalogueImages.persistEntryImages(type, merged)
          : merged;
        await CatalogueStore.upsert(type, toStore);
        setStatus("Saved");
        renderList();
        return true;
      } catch (err) {
        if (err?.quota) {
          setStatus("Save failed — storage full");
          alert("Could not save text fields — browser local storage is full. Images now use a separate store; try removing unused catalogue entries.");
        } else if (err?.message === "idb-save-failed" || err?.message === "asset-save-failed") {
          setStatus("Image save failed");
          alert("Could not save the image. Check that the local server is running (npm start).");
        } else {
          setStatus("Save failed");
          alert("Could not save this entry. Try again with a smaller image.");
        }
        return false;
      }
    }

    function bindFormEvents(form) {
      const scheduleSave = () => {
        setStatus("Saving…");
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => saveCurrent(form), 400);
      };

      form.addEventListener("input", (e) => {
        if (e.target.matches("[data-image-input]") || e.target.matches("[data-uvtt-input]")) return;
        if (e.target.matches('[name="str"],[name="dex"],[name="con"],[name="int"],[name="wis"],[name="cha"]')) {
          const modEl = form.querySelector(`[data-mod-for="${e.target.name}"]`);
          if (modEl) modEl.textContent = mod(e.target.value) ? `(${mod(e.target.value)})` : "";
        }
        scheduleSave();
      });

      form.addEventListener("change", (e) => {
        if (e.target.matches("[data-image-input]") || e.target.matches("[data-uvtt-input]")) return;
        const name = e.target.getAttribute("name");
        const showWhenFields = new Set();
        config.sections.forEach((section) => {
          if (section.showWhen?.field) showWhenFields.add(section.showWhen.field);
          section.fields.forEach((field) => {
            if (field.showWhen?.field) showWhenFields.add(field.showWhen.field);
          });
        });
        if (name && showWhenFields.has(name)) {
          clearTimeout(saveTimer);
          saveCurrent(form).then((ok) => {
            if (ok) renderEditor(activeId, { mode: "edit" });
          });
          return;
        }
        scheduleSave();
      });

      form.querySelector("[data-action='done']")?.addEventListener("click", async () => {
        clearTimeout(saveTimer);
        await saveCurrent(form);
        renderEditor(activeId, { mode: "view" });
      });

      form.querySelector("[data-action='delete']")?.addEventListener("click", async () => {
        const name = form.querySelector('[name="name"]')?.value || "this entry";
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        clearTimeout(saveTimer);
        try {
          await CatalogueStore.remove(type, form.dataset.entryId);
        } catch {
          alert("Could not delete this entry.");
          return;
        }
        activeId = null;
        renderEditor(null);
      });

      form.querySelectorAll("[data-add-list]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const fieldId = btn.dataset.addList;
          const host = form.querySelector(`[data-list-field="${fieldId}"] .cat-list-rows`);
          const field = fieldConfig(fieldId);
          const placeholder = escapeHtml(field?.placeholder || "Custom entry…");
          if (host) {
            host.hidden = false;
            host.classList.remove("cat-list-rows--empty");
          }
          host.insertAdjacentHTML(
            "beforeend",
            `<div class="cat-list-row"><input type="text" placeholder="${placeholder}"><button type="button" class="cat-list-remove" aria-label="Remove row">×</button></div>`
          );
          bindListRowEvents(form);
          scheduleSave();
        });
      });

      bindRefPickers(form, scheduleSave);

      form.querySelectorAll("[data-image-input]").forEach((input) => {
        input.addEventListener("change", async () => {
          const file = input.files?.[0];
          if (!file) return;

          if (!file.type.startsWith("image/")) {
            alert("Please choose an image file.");
            input.value = "";
            return;
          }

          if (file.size > MAX_INPUT_BYTES) {
            alert("Image is too large to open. Please use a file under 25 MB.");
            input.value = "";
            return;
          }

          const fieldId = input.dataset.imageInput;
          const field = fieldConfig(fieldId);
          clearTimeout(saveTimer);
          setStatus("Processing image…");

          try {
            const dataUrl = await compressImageFile(file, field);
            imageCache[fieldId] = dataUrl;

            const existingRaw = CatalogueStore.get(type, form.dataset.entryId) || {};
            const existing = window.CatalogueImages ? CatalogueImages.hydrate(type, existingRaw) : existingRaw;
            const fromForm = readForm(form, config);
            const merged = { ...existing, ...fromForm, [fieldId]: dataUrl };
            if (!merged.name?.trim()) merged.name = config.defaults.name;
            /* Keep sibling image fields — blank hidden inputs must not wipe other assets */
            if (window.CatalogueImages) {
              CatalogueImages.IMAGE_FIELDS.forEach((f) => {
                if (f === fieldId) return;
                if (!merged[f] && existingRaw[f]) merged[f] = existingRaw[f];
                else if (!merged[f] && existing[f]) merged[f] = existing[f];
              });
            }

            const toStore = window.CatalogueImages
              ? await CatalogueImages.persistEntryImages(type, merged)
              : merged;
            await CatalogueStore.upsert(type, toStore);
            if (window.CatalogueImages?.IMAGE_FIELDS) {
              CatalogueImages.IMAGE_FIELDS.forEach((f) => {
                if (toStore[f]) imageCache[f] = toStore[f];
              });
            }
            setStatus("Saved");
            renderEditor(activeId, { mode: "edit" });
          } catch (err) {
            const hydrated = window.CatalogueImages
              ? CatalogueImages.hydrate(type, CatalogueStore.get(type, form.dataset.entryId) || {})
              : CatalogueStore.get(type, form.dataset.entryId) || {};
            imageCache[fieldId] = hydrated[fieldId] || "";
            if (err?.message === "too-large") {
              setStatus("Image too large");
              alert("That image is still too large after compression. Try a smaller or lower-resolution file.");
            } else if (err?.message === "invalid-image") {
              setStatus("Invalid image");
              alert("Could not read that image file.");
            } else if (err?.message === "idb-save-failed" || err?.message === "asset-save-failed") {
              setStatus("Image save failed");
              alert("Could not save the image. Check that the local server is running (npm start).");
            } else if (err?.quota || err?.message === "quota") {
              setStatus("Save failed — storage full");
              alert(
                window.CatalogueImages
                  ? "Could not save entry metadata — local storage is full. Clear unused catalogue entries and try again (images are stored separately)."
                  : "Browser storage is full. Hard-refresh this page so image storage can load, or remove unused entries."
              );
            } else {
              setStatus("Upload failed");
              console.error(err);
              alert("Image upload failed. Try another file.");
            }
            input.value = "";
          }
        });
      });

      form.querySelectorAll("[data-clear-image]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const fieldId = btn.dataset.clearImage;
          clearTimeout(saveTimer);
          imageCache[fieldId] = "";
          const existingRaw = CatalogueStore.get(type, form.dataset.entryId) || {};
          const existing = window.CatalogueImages ? CatalogueImages.hydrate(type, existingRaw) : existingRaw;
          const fromForm = readForm(form, config);
          const merged = { ...existing, ...fromForm, [fieldId]: "" };
          if (window.CatalogueImages) {
            CatalogueImages.IMAGE_FIELDS.forEach((f) => {
              if (f === fieldId) return;
              if (!merged[f] && existingRaw[f]) merged[f] = existingRaw[f];
              else if (!merged[f] && existing[f]) merged[f] = existing[f];
            });
          }
          try {
            const toStore = window.CatalogueImages
              ? await CatalogueImages.persistEntryImages(type, merged, { clearFields: [fieldId] })
              : merged;
            await CatalogueStore.upsert(type, toStore);
            setStatus("Saved");
            renderEditor(activeId, { mode: "edit" });
          } catch {
            setStatus("Save failed");
            alert("Could not remove the image.");
          }
        });
      });

      form.querySelectorAll("[data-uvtt-input]").forEach((input) => {
        input.addEventListener("change", async () => {
          const file = input.files?.[0];
          input.value = "";
          if (!file) return;
          if (!window.LocalApiClient?.importLocationUvtt) {
            alert("UVTT import requires the local server (npm start).");
            return;
          }
          const fieldId = input.dataset.uvttInput;
          clearTimeout(saveTimer);
          setStatus("Importing UVTT…");
          try {
            const text = await file.text();
            const result = await LocalApiClient.importLocationUvtt(type, form.dataset.entryId, {
              text,
              filename: file.name
            });
            const existingRaw = CatalogueStore.get(type, form.dataset.entryId) || {};
            const fromForm = readForm(form, config);
            const merged = {
              ...existingRaw,
              ...fromForm,
              mapImage: result.mapImage || fromForm.mapImage || existingRaw.mapImage,
              mapCalibration: result.mapCalibration || null
            };
            if (!merged.name?.trim()) merged.name = config.defaults.name;
            await CatalogueStore.upsert(type, merged);
            if (window.EntityRegistry?.build) EntityRegistry.build();
            setStatus("Saved");
            renderEditor(activeId, { mode: "edit" });
          } catch (err) {
            setStatus("UVTT import failed");
            console.error(err);
            alert(err?.message || "UVTT import failed. Confirm npm start is running.");
          }
        });
      });

      form.querySelectorAll("[data-clear-uvtt]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("Remove UVTT calibration? The map image is kept unless you remove it separately.")) return;
          clearTimeout(saveTimer);
          try {
            if (window.LocalApiClient?.deleteLocationUvtt) {
              await LocalApiClient.deleteLocationUvtt(type, form.dataset.entryId);
            }
            const existingRaw = CatalogueStore.get(type, form.dataset.entryId) || {};
            const fromForm = readForm(form, config);
            const merged = { ...existingRaw, ...fromForm, mapCalibration: null };
            await CatalogueStore.upsert(type, merged);
            if (window.EntityRegistry?.build) EntityRegistry.build();
            setStatus("Saved");
            renderEditor(activeId, { mode: "edit" });
          } catch {
            setStatus("Save failed");
            alert("Could not remove UVTT calibration.");
          }
        });
      });

      bindListRowEvents(form);
    }

    function bindListRowEvents(form) {
      form.querySelectorAll(".cat-list-remove").forEach((btn) => {
        btn.onclick = () => {
          const row = btn.closest(".cat-list-row");
          const host = row?.parentElement;
          const listField = host?.closest("[data-list-field]");
          const isRefList = listField?.classList.contains("cat-list-field--refs");
          row?.remove();
          if (host && !host.querySelector(".cat-list-row")) {
            if (isRefList) {
              host.hidden = true;
              host.classList.add("cat-list-rows--empty");
            } else {
              form.querySelector(`[data-add-list="${listField?.dataset.listField || ""}"]`)?.click();
            }
          }
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => saveCurrent(form), 100);
        };
      });
    }

    function selectedRefIds(listField) {
      const ids = new Set();
      listField.querySelectorAll(".cat-list-row").forEach((row) => {
        const raw =
          row.querySelector('input[type="hidden"]')?.value ||
          row.querySelector('input[type="text"]')?.value ||
          "";
        const ref = parseEntityRef(raw, listField.dataset.refType);
        if (ref?.id) ids.add(ref.id);
      });
      return ids;
    }

    function bindRefPickers(form, scheduleSave) {
      form.querySelectorAll("[data-ref-picker]").forEach((picker) => {
        const fieldId = picker.dataset.refPicker;
        const listField = form.querySelector(`[data-list-field="${fieldId}"]`);
        const search = picker.querySelector(".cat-ref-search");
        const results = picker.querySelector(".cat-ref-results");
        if (!listField || !search || !results) return;
        const refType = listField.dataset.refType;
        const field = fieldConfig(fieldId);

        function hideResults() {
          results.hidden = true;
          results.innerHTML = "";
        }

        function addRef(entry) {
          const stored = formatStoredRef(refType, entry);
          if (!stored) return;
          const already = [...selectedRefIds(listField)].includes(entry.id);
          if (already) {
            search.value = "";
            hideResults();
            return;
          }
          const rows = listField.querySelector(".cat-list-rows");
          rows.hidden = false;
          rows.classList.remove("cat-list-rows--empty");
          rows.insertAdjacentHTML("beforeend", renderRefListRow(field, stored));
          bindListRowEvents(form);
          search.value = "";
          hideResults();
          scheduleSave();
        }

        function renderResults(query) {
          const q = query.trim().toLowerCase();
          if (!q) {
            hideResults();
            return;
          }
          const taken = selectedRefIds(listField);
          const pool = CatalogueStore.list(refType) || [];
          const matches = pool
            .filter((e) => {
              if (!e?.id || taken.has(e.id)) return false;
              const hay = [e.name, e.itemType, e.category, e.summary, e.defaultAbility, e.featureType, e.school]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return hay.includes(q);
            })
            .slice(0, 8);
          if (!matches.length) {
            results.innerHTML = `<div class="cat-ref-empty">No matches in ${escapeHtml(refType)} catalogue</div>`;
            results.hidden = false;
            return;
          }
          results.innerHTML = matches
            .map((e) => {
              const meta = [e.category, e.itemType, e.defaultAbility, e.featureType, e.school, e.level]
                .filter(Boolean)
                .slice(0, 2)
                .join(" · ");
              return `<button type="button" class="cat-ref-option" data-id="${escapeHtml(e.id)}">
                <span class="cat-ref-option__name">${escapeHtml(e.name || e.id)}</span>
                ${meta ? `<span class="cat-ref-option__meta">${escapeHtml(meta)}</span>` : ""}
              </button>`;
            })
            .join("");
          results.hidden = false;
          results.querySelectorAll(".cat-ref-option").forEach((btn) => {
            btn.addEventListener("mousedown", (ev) => {
              ev.preventDefault();
              const entry = CatalogueStore.get(refType, btn.dataset.id);
              if (entry) addRef(entry);
            });
          });
        }

        search.addEventListener("input", () => renderResults(search.value));
        search.addEventListener("focus", () => {
          if (search.value.trim()) renderResults(search.value);
        });
        search.addEventListener("blur", () => {
          setTimeout(hideResults, 120);
        });
        search.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            hideResults();
            search.blur();
          }
          if (e.key === "Enter") {
            e.preventDefault();
            const first = results.querySelector(".cat-ref-option");
            if (first) {
              const entry = CatalogueStore.get(refType, first.dataset.id);
              if (entry) addRef(entry);
            }
          }
        });
      });
    }

    newBtn?.addEventListener("click", async () => {
      clearTimeout(saveTimer);
      const entry = {
        id: CatalogueStore.generateId(type),
        ...JSON.parse(JSON.stringify(config.defaults))
      };
      try {
        await CatalogueStore.upsert(type, entry);
      } catch {
        alert("Could not create a new entry. Is the local server running (npm start)?");
        return;
      }
      renderEditor(entry.id, { mode: "edit" });
    });

    listEl?.addEventListener("click", async (e) => {
      const btn = e.target.closest(".cat-list-item");
      if (!btn) return;
      clearTimeout(saveTimer);
      const form = editorEl.querySelector(".cat-form");
      if (form && activeId) await saveCurrent(form);
      renderEditor(btn.dataset.id, { mode: "view" });
    });

    searchEl?.addEventListener("input", renderList);

    renderList();
    renderEditor(null);
    } /* end boot */

    start();
  }

  return {
    init,
    /* Exported for tests / tooling — browsing helpers stay config-driven */
    _test: {
      matchesShowWhen,
      buildSearchHaystack,
      matchesFacet,
      groupKeyForEntry,
      groupLabel,
      sortGroupKeys,
      facetValue,
      formatStoredRef,
      collectRelatedTypes,
      parseEntityRef,
      renderEntityRefHtml,
      readListFieldValues
    }
  };
})();
