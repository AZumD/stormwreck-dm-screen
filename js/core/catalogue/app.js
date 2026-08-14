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
    if (config.type === "pc") {
      const bits = [entry.class, entry.level ? `Lv ${entry.level}` : ""].filter(Boolean);
      return bits.join(" · ") || "Player character";
    }
    if (config.type === "npc") return entry.role || entry.summary?.slice(0, 60) || "NPC";
    if (config.type === "item") return [entry.itemType, entry.rarity].filter(Boolean).join(" · ") || "Item";
    if (config.type === "monster") return [entry.size, entry.creatureType, entry.cr ? `CR ${entry.cr}` : ""].filter(Boolean).join(" · ") || "Monster";
    if (config.type === "location") return entry.featuredIn?.[0] ? `Featured in ${entry.featuredIn[0]}` : "Location";
    if (config.type === "race") return [entry.size, entry.speed].filter(Boolean).join(" · ") || "Race";
    if (config.type === "class") return [entry.hitDie, entry.primaryAbility].filter(Boolean).join(" · ") || "Class";
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
    if (window.EntityRegistry?.resolve) {
      const entity = EntityRegistry.resolve(ref.id);
      if (entity?.name) return entity.name;
    }
    return ref.id;
  }

  function renderEntityRefHtml(raw, defaultType) {
    const ref = parseEntityRef(raw, defaultType);
    if (!ref) return escapeHtml(String(raw || ""));

    const entity = window.EntityRegistry?.resolve?.(ref.id) || window.ENTITIES?.[ref.id] || null;
    if (!entity) {
      /* Legacy plain string or unknown id — no broken link */
      return escapeHtml(ref.label || raw || ref.id);
    }

    const label = ref.label || entity.name || ref.id;
    const type = ref.type || entity.type || defaultType || "";
    return `<button type="button" class="entity-link" data-type="${escapeHtml(type)}" data-id="${escapeHtml(entity.id || ref.id)}">${escapeHtml(label)}</button>`;
  }

  function isEmptyFieldValue(value, field) {
    if (field.type === "checkbox") return !value;
    if (field.type === "list") return !Array.isArray(value) || !value.filter(Boolean).length;
    if (field.type === "image") return !value;
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
      .map((section) => {
        const visible = section.fields.filter((f) => !skipIds.has(f.id) && !isEmptyFieldValue(entry[f.id], f));
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
          entry[field.id] = [...root.querySelectorAll(`[data-list-field="${field.id}"] .cat-list-row input`)]
            .map((i) => i.value.trim())
            .filter(Boolean);
          return;
        }
        if (field.type === "image") {
          entry[field.id] = root.querySelector(`[data-image-value="${field.id}"]`)?.value || "";
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

  function renderListField(field, values) {
    const items = Array.isArray(values) ? values : [];
    const rows = items.length ? items : [""];
    return `
      <div class="cat-list-field" data-list-field="${field.id}">
        <div class="cat-list-rows">
          ${rows
            .map(
              (val) => `
            <div class="cat-list-row">
              <input type="text" value="${escapeHtml(val)}" placeholder="${escapeHtml(field.placeholder || "")}">
              <button type="button" class="cat-list-remove" aria-label="Remove row">×</button>
            </div>`
            )
            .join("")}
        </div>
        <button type="button" class="cat-list-add" data-add-list="${field.id}">+ Add row</button>
      </div>`;
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
        ? "Portraits are stored in this browser. Large files are resized automatically."
        : "Maps are stored in this browser. Large files are resized automatically.");

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

  function renderField(field, entry) {
    const value = entry[field.id];
    const gridClass = `cat-field cat-field--${field.grid || "full"}`;

    if (field.type === "list") {
      return `<div class="${gridClass}"><label>${escapeHtml(field.label)}</label>${renderListField(field, value)}</div>`;
    }

    if (field.type === "image") {
      return `<div class="${gridClass}"><label>${escapeHtml(field.label)}</label>${renderImageField(field, value)}</div>`;
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
      const options = Array.isArray(field.options) ? field.options : [];
      const current = value ?? "";
      const opts = options
        .map((opt) => {
          const selected = String(opt) === String(current) ? " selected" : "";
          return `<option value="${escapeHtml(opt)}"${selected}>${escapeHtml(opt)}</option>`;
        })
        .join("");
      return `
        <div class="${gridClass}">
          <label for="field-${field.id}">${escapeHtml(field.label)}</label>
          <select id="field-${field.id}" name="${field.id}">
            ${current && !options.includes(current) ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>` : ""}
            ${opts}
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
      .map(
        (section) => `
        <section class="cat-section">
          <h3 class="cat-section__title">${escapeHtml(section.title)}</h3>
          <div class="cat-grid">${section.fields.map((f) => renderField(f, entry)).join("")}</div>
        </section>`
      )
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
      if (window.CatalogueImages) {
        await CatalogueImages.preload(type);
        await CatalogueImages.migrateType(type);
      }
      boot();
    };

    function boot() {
    if (window.CatalogueSeeds?.[type]) {
      CatalogueStore.mergeSeeds(type, CatalogueSeeds[type]);
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

    function fieldConfig(fieldId) {
      for (const section of config.sections) {
        const found = section.fields.find((f) => f.id === fieldId);
        if (found) return found;
      }
      return null;
    }

    function entries() {
      const q = (searchEl?.value || "").trim().toLowerCase();
      const list = window.CatalogueImages
        ? CatalogueImages.hydrateAll(type, CatalogueStore.list(type))
        : CatalogueStore.list(type);
      return list.filter((e) => {
        if (!q) return true;
        const hay = [
          e.name,
          e.role,
          e.summary,
          e.itemType,
          e.creatureType,
          e.class,
          e.size,
          e.hitDie,
          e.primaryAbility,
          e.source,
          e.school,
          e.level,
          e.classes,
          e.defaultAbility,
          e.featureType,
          e.grantedBy,
          ...(Array.isArray(e.tags) ? e.tags : [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    function renderList() {
      const items = entries();
      if (!items.length) {
        listEl.innerHTML = `<p class="cat-list-empty">No entries yet. Click <strong>${escapeHtml(config.newLabel)}</strong>.</p>`;
        return;
      }

      listEl.innerHTML = items
        .map((e) => {
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
        })
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

      article.querySelector("[data-action='delete']")?.addEventListener("click", () => {
        const name = article.querySelector(".cat-wiki__title")?.textContent || "this entry";
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        clearTimeout(saveTimer);
        try {
          CatalogueStore.remove(type, article.dataset.entryId);
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
        });
      });

      try {
        const toStore = window.CatalogueImages
          ? await CatalogueImages.persistEntryImages(type, merged)
          : merged;
        CatalogueStore.upsert(type, toStore);
        setStatus("Saved locally");
        renderList();
        return true;
      } catch (err) {
        if (err?.quota) {
          setStatus("Save failed — storage full");
          alert("Could not save text fields — browser local storage is full. Images now use a separate store; try removing unused catalogue entries.");
        } else if (err?.message === "idb-save-failed") {
          setStatus("Image save failed");
          alert("Could not save the image in browser storage. Try another browser or free some disk space.");
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
        if (e.target.matches("[data-image-input]")) return;
        if (e.target.matches('[name="str"],[name="dex"],[name="con"],[name="int"],[name="wis"],[name="cha"]')) {
          const modEl = form.querySelector(`[data-mod-for="${e.target.name}"]`);
          if (modEl) modEl.textContent = mod(e.target.value) ? `(${mod(e.target.value)})` : "";
        }
        scheduleSave();
      });

      form.addEventListener("change", (e) => {
        if (e.target.matches("[data-image-input]")) return;
        scheduleSave();
      });

      form.querySelector("[data-action='done']")?.addEventListener("click", async () => {
        clearTimeout(saveTimer);
        await saveCurrent(form);
        renderEditor(activeId, { mode: "view" });
      });

      form.querySelector("[data-action='delete']")?.addEventListener("click", () => {
        const name = form.querySelector('[name="name"]')?.value || "this entry";
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        clearTimeout(saveTimer);
        try {
          CatalogueStore.remove(type, form.dataset.entryId);
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
          host.insertAdjacentHTML(
            "beforeend",
            `<div class="cat-list-row"><input type="text" placeholder="${escapeHtml(
              btn.closest(".cat-list-field")?.querySelector("input")?.placeholder || ""
            )}"><button type="button" class="cat-list-remove" aria-label="Remove row">×</button></div>`
          );
          bindListRowEvents(form);
          scheduleSave();
        });
      });

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

            const toStore = window.CatalogueImages
              ? await CatalogueImages.persistEntryImages(type, merged)
              : merged;
            CatalogueStore.upsert(type, toStore);
            setStatus("Saved locally");
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
            } else if (err?.message === "idb-save-failed") {
              setStatus("Image save failed");
              alert("Could not save the image in browser storage. Try another browser or free some disk space.");
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
          try {
            const toStore = window.CatalogueImages
              ? await CatalogueImages.persistEntryImages(type, merged)
              : merged;
            CatalogueStore.upsert(type, toStore);
            setStatus("Saved locally");
            renderEditor(activeId, { mode: "edit" });
          } catch {
            setStatus("Save failed");
            alert("Could not remove the image.");
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
          row?.remove();
          if (host && !host.querySelector(".cat-list-row")) {
            form.querySelector(`[data-add-list="${host.closest("[data-list-field]")?.dataset.listField || ""}"]`)?.click();
          }
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => saveCurrent(form), 100);
        };
      });
    }

    newBtn?.addEventListener("click", () => {
      clearTimeout(saveTimer);
      const entry = {
        id: CatalogueStore.generateId(type),
        ...JSON.parse(JSON.stringify(config.defaults))
      };
      try {
        CatalogueStore.upsert(type, entry);
      } catch {
        alert("Could not create a new entry (storage may be full).");
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

  return { init };
})();
