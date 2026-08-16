/**
 * Scene cast tray + connections UI (At this scene).
 * Uses SceneMeta for persistence; EntityRegistry for resolve/modals.
 * Entity type is always inferred from the registry — never stored on SceneMeta.
 */
window.SceneUI = (function () {
  "use strict";

  const { escapeHtml } = ContentParser;

  let campaignId = null;
  let api = null;
  let entityDialog = null;
  let entityDialogBody = null;
  let entityDialogTitle = null;
  let connectionDialog = null;
  let connectionDialogBody = null;
  let pendingSceneId = null;
  let pendingPickerMode = "entity"; /* entity | location */

  const TYPE_GROUPS = [
    { types: ["npc"], label: "NPCs" },
    { types: ["monster"], label: "Monsters" },
    { types: ["item"], label: "Items" },
    { types: ["pc"], label: "PCs" },
    { types: ["feature"], label: "Features / Rules" },
    { types: ["skill"], label: "Skills" },
    { types: ["class"], label: "Classes" },
    { types: ["race"], label: "Races" },
    { types: ["spell"], label: "Spells" },
    { types: ["location"], label: "Locations" }
  ];

  function t() {
    return window.I18N || {};
  }

  function init(options) {
    campaignId = options.campaignId;
    api = options.api || {};

    entityDialog = document.getElementById("scene-entity-dialog");
    entityDialogBody = document.getElementById("scene-entity-dialog-body");
    entityDialogTitle = document.getElementById("scene-entity-dialog-title");
    connectionDialog = document.getElementById("scene-connection-dialog");
    connectionDialogBody = document.getElementById("scene-connection-dialog-body");

    document.getElementById("scene-entity-dialog-close")?.addEventListener("click", closeEntityDialog);
    document.getElementById("scene-connection-dialog-close")?.addEventListener("click", closeConnectionDialog);
    entityDialog?.addEventListener("click", (e) => {
      if (e.target === entityDialog) closeEntityDialog();
    });
    connectionDialog?.addEventListener("click", (e) => {
      if (e.target === connectionDialog) closeConnectionDialog();
    });
  }

  function sectionBase(sectionId) {
    if (typeof api.getSectionBase === "function") return api.getSectionBase(sectionId);
    return (window.ADVENTURE?.sections || []).find((s) => s.id === sectionId) || null;
  }

  function sectionTitle(sectionId) {
    if (typeof api.getSectionTitle === "function") return api.getSectionTitle(sectionId) || sectionId;
    return sectionBase(sectionId)?.title || sectionId;
  }

  function resolveEntity(ref) {
    const entity = window.EntityRegistry?.resolve?.(ref.id) || window.ENTITIES?.[ref.id];
    if (entity) return entity;
    return {
      id: ref.id,
      type: "other",
      name: ref.id,
      summary: ""
    };
  }

  function groupLabelForType(type) {
    const hit = TYPE_GROUPS.find((g) => g.types.includes(type));
    return hit?.label || (window.I18N?.typeLabels?.[type] || type);
  }

  function chipLabel(ref, entity) {
    const name = entity.name || ref.id;
    if (ref.quantity && ref.quantity > 1) return `${name} ×${ref.quantity}`;
    return name;
  }

  function renderLocationBlock(sectionId, meta) {
    const locId = meta.locationId;
    if (!locId) {
      return `
        <div class="scene-tray__group scene-tray__group--location">
          <h4 class="scene-tray__group-label">${escapeHtml(t().sceneLocation || "Location")}</h4>
          <p class="scene-tray__empty">${escapeHtml(t().sceneLocationEmpty || "No location set.")}</p>
          <button type="button" class="scene-tray__set-location" data-set-scene-location="${escapeHtml(sectionId)}">${escapeHtml(t().setSceneLocation || "Set location")}</button>
        </div>`;
    }

    const loc = resolveEntity({ id: locId });
    return `
      <div class="scene-tray__group scene-tray__group--location">
        <h4 class="scene-tray__group-label">${escapeHtml(t().sceneLocation || "Location")}</h4>
        <div class="scene-tray__chips">
          <span class="scene-chip-wrap">
            <button type="button" class="scene-chip entity-link" data-type="${escapeHtml(loc.type || "location")}" data-id="${escapeHtml(loc.id || locId)}" title="${escapeHtml(loc.summary || loc.name || "")}">
              ${escapeHtml(loc.name || locId)}
            </button>
            <button type="button" class="scene-chip__remove" data-clear-scene-location="${escapeHtml(sectionId)}" aria-label="${escapeHtml(t().clearSceneLocation || "Clear location")}">×</button>
          </span>
        </div>
        <button type="button" class="scene-tray__set-location" data-set-scene-location="${escapeHtml(sectionId)}">${escapeHtml(t().changeSceneLocation || "Change location")}</button>
      </div>`;
  }

  function renderTrayHtml(sectionId) {
    if (!window.SceneMeta) return "";
    const meta = SceneMeta.get(campaignId, sectionId, sectionBase(sectionId));
    const collapsed = SceneMeta.isTrayCollapsed(campaignId);
    const openAttr = collapsed ? "" : " open";

    const byGroup = new Map();
    meta.entities.forEach((ref) => {
      /* Skip location entities already covered by first-class locationId */
      if (meta.locationId && ref.id === meta.locationId) return;
      const entity = resolveEntity(ref);
      const type = entity.type || "other";
      const label = groupLabelForType(type);
      if (!byGroup.has(label)) byGroup.set(label, []);
      byGroup.get(label).push({ ref, entity, type });
    });

    let groupsHtml = renderLocationBlock(sectionId, meta);

    TYPE_GROUPS.forEach((g) => {
      const label = g.label;
      const items = byGroup.get(label);
      if (!items?.length) return;
      groupsHtml += `
        <div class="scene-tray__group">
          <h4 class="scene-tray__group-label">${escapeHtml(label)}</h4>
          <div class="scene-tray__chips">
            ${items
              .map(({ ref, entity }) => {
                const note = ref.note
                  ? `<span class="scene-chip__note" title="${escapeHtml(ref.note)}">${escapeHtml(ref.note)}</span>`
                  : "";
                return `
                <span class="scene-chip-wrap">
                  <button type="button" class="scene-chip entity-link" data-type="${escapeHtml(entity.type || "")}" data-id="${escapeHtml(entity.id || ref.id)}" title="${escapeHtml(ref.note || entity.summary || entity.name || "")}">
                    ${escapeHtml(chipLabel(ref, entity))}
                  </button>
                  <button type="button" class="scene-chip__remove" data-remove-scene-entity="${escapeHtml(ref.id)}" data-scene="${escapeHtml(sectionId)}" aria-label="${escapeHtml(t().removeFromScene || "Remove from scene")}">×</button>
                  ${note}
                </span>`;
              })
              .join("")}
          </div>
        </div>`;
      byGroup.delete(label);
    });

    byGroup.forEach((items, label) => {
      groupsHtml += `
        <div class="scene-tray__group">
          <h4 class="scene-tray__group-label">${escapeHtml(label)}</h4>
          <div class="scene-tray__chips">
            ${items
              .map(
                ({ ref, entity }) => `
              <span class="scene-chip-wrap">
                <button type="button" class="scene-chip entity-link" data-type="${escapeHtml(entity.type || "")}" data-id="${escapeHtml(entity.id || ref.id)}">${escapeHtml(chipLabel(ref, entity))}</button>
                <button type="button" class="scene-chip__remove" data-remove-scene-entity="${escapeHtml(ref.id)}" data-scene="${escapeHtml(sectionId)}" aria-label="Remove">×</button>
              </span>`
              )
              .join("")}
          </div>
        </div>`;
    });

    return `
      <details class="scene-tray" data-scene-tray="${escapeHtml(sectionId)}"${openAttr}>
        <summary class="scene-tray__summary">${escapeHtml(t().atThisScene || "At this scene")}</summary>
        <div class="scene-tray__body">
          ${groupsHtml}
          <button type="button" class="scene-tray__add" data-add-scene-entity="${escapeHtml(sectionId)}">${escapeHtml(t().addToScene || "+ Add to scene")}</button>
        </div>
      </details>`;
  }

  function renderConnectionsHtml(sectionId) {
    if (!window.SceneMeta) return "";
    const meta = SceneMeta.get(campaignId, sectionId, sectionBase(sectionId));
    const editMode = !!window.SectionEditor?.isEditMode?.();
    const rows = meta.connections
      .map((c) => {
        const title = sectionTitle(c.sceneId);
        return `
          <div class="scene-connection">
            <button type="button" class="scene-connection__jump" data-jump-scene="${escapeHtml(c.sceneId)}">
              <span class="scene-connection__arrow" aria-hidden="true">→</span>
              <span class="scene-connection__main">
                <span class="scene-connection__title">${escapeHtml(title)}</span>
                ${c.label ? `<span class="scene-connection__label">${escapeHtml(c.label)}</span>` : ""}
              </span>
            </button>
            ${
              editMode
                ? `<button type="button" class="scene-connection__remove" data-remove-connection="${escapeHtml(c.sceneId)}" data-scene="${escapeHtml(sectionId)}" aria-label="${escapeHtml(t().removeConnection || "Remove connection")}">×</button>`
                : ""
            }
          </div>`;
      })
      .join("");

    return `
      <nav class="scene-connections" aria-label="${escapeHtml(t().connections || "Connections")}">
        <h3 class="scene-connections__heading">${escapeHtml(t().connections || "Connections")}</h3>
        <div class="scene-connections__list">
          ${rows || `<p class="scene-connections__empty">${escapeHtml(t().connectionsEmpty || "No linked scenes yet.")}</p>`}
        </div>
        ${
          editMode
            ? `<button type="button" class="scene-connections__add" data-add-connection="${escapeHtml(sectionId)}">${escapeHtml(t().addConnection || "+ Add connection")}</button>`
            : ""
        }
      </nav>`;
  }

  function sceneExtrasHtml(sectionId) {
    return `${renderTrayHtml(sectionId)}${renderConnectionsHtml(sectionId)}`;
  }

  function closeEntityDialog() {
    if (!entityDialog) return;
    pendingPickerMode = "entity";
    if (typeof entityDialog.close === "function") entityDialog.close();
    else entityDialog.removeAttribute("open");
  }

  function closeConnectionDialog() {
    if (!connectionDialog) return;
    if (typeof connectionDialog.close === "function") connectionDialog.close();
    else connectionDialog.removeAttribute("open");
  }

  function openLocationPicker(sectionId) {
    pendingSceneId = sectionId;
    pendingPickerMode = "location";
    if (!entityDialog || !entityDialogBody) return;
    if (entityDialogTitle) entityDialogTitle.textContent = t().setSceneLocation || "Set location";

    entityDialogBody.innerHTML = `
      <input type="search" id="scene-entity-search" class="scene-dialog-search" placeholder="${escapeHtml(t().partySearchPlaceholder || "Search…")}" autocomplete="off">
      <div id="scene-entity-choices" class="scene-dialog-choices"></div>`;

    const searchEl = entityDialogBody.querySelector("#scene-entity-search");
    const choicesEl = entityDialogBody.querySelector("#scene-entity-choices");

    function renderChoices() {
      const q = (searchEl.value || "").trim().toLowerCase();
      const list = (window.EntityRegistry?.byType?.("location") || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((e) => !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));

      if (!list.length) {
        choicesEl.innerHTML = `<p class="empty-state">${escapeHtml(t().partyNoCandidates || "No entries found.")}</p>`;
        return;
      }
      choicesEl.innerHTML = list
        .map(
          (e) => `
          <button type="button" class="scene-dialog-choice" data-id="${escapeHtml(e.id)}">
            <span class="scene-dialog-choice__name">${escapeHtml(e.name)}</span>
            <span class="scene-dialog-choice__meta">${escapeHtml(e.summary || e.type)}</span>
          </button>`
        )
        .join("");

      choicesEl.querySelectorAll(".scene-dialog-choice").forEach((btn) => {
        btn.addEventListener("click", () => {
          SceneMeta.setLocationId(campaignId, pendingSceneId, btn.dataset.id, sectionBase(pendingSceneId));
          closeEntityDialog();
          if (typeof api.onSceneMetaChange === "function") api.onSceneMetaChange(pendingSceneId);
        });
      });
    }

    searchEl.addEventListener("input", renderChoices);
    renderChoices();
    try {
      entityDialog.showModal();
    } catch {
      entityDialog.setAttribute("open", "");
    }
  }

  function openEntityPicker(sectionId) {
    pendingSceneId = sectionId;
    pendingPickerMode = "entity";
    if (!entityDialog || !entityDialogBody) return;
    if (entityDialogTitle) entityDialogTitle.textContent = t().addToScene || "Add to scene";

    const typeOpts = (window.CatalogueTypes?.linkableIds?.() || ["npc", "monster", "item", "location", "feature", "skill"])
      .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(t().typeLabels?.[type] || type)}</option>`)
      .join("");

    entityDialogBody.innerHTML = `
      <label class="scene-dialog-label">${escapeHtml(t().entityType || "Type")}
        <select id="scene-entity-type">${typeOpts}</select>
      </label>
      <input type="search" id="scene-entity-search" class="scene-dialog-search" placeholder="${escapeHtml(t().partySearchPlaceholder || "Search…")}" autocomplete="off">
      <div id="scene-entity-choices" class="scene-dialog-choices"></div>
      <div class="scene-dialog-extra hidden" id="scene-entity-extra">
        <label class="scene-dialog-label">${escapeHtml(t().quantity || "Quantity")}
          <input type="number" id="scene-entity-qty" min="1" step="1" placeholder="1">
        </label>
        <label class="scene-dialog-label">${escapeHtml(t().sceneEntityNote || "Scene note")}
          <input type="text" id="scene-entity-note" placeholder="${escapeHtml(t().sceneEntityNotePlaceholder || "Optional…")}">
        </label>
        <button type="button" class="btn btn-primary" id="scene-entity-confirm">${escapeHtml(t().addToSceneConfirm || "Add")}</button>
      </div>`;

    let selected = null;
    const typeEl = entityDialogBody.querySelector("#scene-entity-type");
    const searchEl = entityDialogBody.querySelector("#scene-entity-search");
    const choicesEl = entityDialogBody.querySelector("#scene-entity-choices");
    const extraEl = entityDialogBody.querySelector("#scene-entity-extra");

    function renderChoices() {
      const type = typeEl.value;
      const q = (searchEl.value || "").trim().toLowerCase();
      const list = (window.EntityRegistry?.byType?.(type) || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((e) => !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));

      if (!list.length) {
        choicesEl.innerHTML = `<p class="empty-state">${escapeHtml(t().partyNoCandidates || "No entries found.")}</p>`;
        return;
      }
      choicesEl.innerHTML = list
        .map(
          (e) => `
          <button type="button" class="scene-dialog-choice" data-id="${escapeHtml(e.id)}">
            <span class="scene-dialog-choice__name">${escapeHtml(e.name)}</span>
            <span class="scene-dialog-choice__meta">${escapeHtml(e.summary || e.type)}</span>
          </button>`
        )
        .join("");

      choicesEl.querySelectorAll(".scene-dialog-choice").forEach((btn) => {
        btn.addEventListener("click", () => {
          selected = { id: btn.dataset.id };
          choicesEl.querySelectorAll(".scene-dialog-choice").forEach((b) => b.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          extraEl.classList.remove("hidden");
        });
      });
    }

    typeEl.addEventListener("change", renderChoices);
    searchEl.addEventListener("input", renderChoices);
    entityDialogBody.querySelector("#scene-entity-confirm")?.addEventListener("click", () => {
      if (!selected || !pendingSceneId) return;
      const qtyRaw = entityDialogBody.querySelector("#scene-entity-qty")?.value;
      const qty = qtyRaw === "" || qtyRaw == null ? null : Number(qtyRaw);
      const note = entityDialogBody.querySelector("#scene-entity-note")?.value || "";
      /* Persist id + optional quantity/note only — type comes from EntityRegistry */
      SceneMeta.addEntity(
        campaignId,
        pendingSceneId,
        {
          id: selected.id,
          quantity: Number.isFinite(qty) && qty > 0 ? qty : null,
          note
        },
        sectionBase(pendingSceneId)
      );
      closeEntityDialog();
      if (typeof api.onSceneMetaChange === "function") api.onSceneMetaChange(pendingSceneId);
    });

    renderChoices();
    try {
      entityDialog.showModal();
    } catch {
      entityDialog.setAttribute("open", "");
    }
  }

  function openConnectionPicker(sectionId) {
    pendingSceneId = sectionId;
    if (!connectionDialog || !connectionDialogBody) return;

    const sections = typeof api.getSections === "function" ? api.getSections() : [];
    const others = sections.filter((s) => s.id !== sectionId);
    if (!others.length) {
      connectionDialogBody.innerHTML = `
        <p class="empty-state">${escapeHtml(t().noOtherScenes || "No other scenes to link yet. Add another passage first.")}</p>`;
      try {
        connectionDialog.showModal();
      } catch {
        connectionDialog.setAttribute("open", "");
      }
      return;
    }

    const opts = others
      .map((s) => {
        const title = sectionTitle(s.id);
        return `<option value="${escapeHtml(s.id)}">${escapeHtml(title)}</option>`;
      })
      .join("");

    connectionDialogBody.innerHTML = `
      <label class="scene-dialog-label">${escapeHtml(t().destinationScene || "Destination scene")}
        <select id="scene-connection-target">${opts}</select>
      </label>
      <label class="scene-dialog-label">${escapeHtml(t().connectionLabel || "Label / description")}
        <input type="text" id="scene-connection-label" placeholder="${escapeHtml(t().connectionLabelPlaceholder || "Optional…")}">
      </label>
      <button type="button" class="btn btn-primary" id="scene-connection-confirm">${escapeHtml(t().addConnectionConfirm || "Add connection")}</button>`;

    connectionDialogBody.querySelector("#scene-connection-confirm")?.addEventListener("click", () => {
      const target = connectionDialogBody.querySelector("#scene-connection-target")?.value;
      const label = connectionDialogBody.querySelector("#scene-connection-label")?.value || "";
      if (!target || !pendingSceneId) return;
      SceneMeta.addConnection(
        campaignId,
        pendingSceneId,
        { sceneId: target, label },
        sectionBase(pendingSceneId)
      );
      closeConnectionDialog();
      if (typeof api.onSceneMetaChange === "function") api.onSceneMetaChange(pendingSceneId);
    });

    try {
      connectionDialog.showModal();
    } catch {
      connectionDialog.setAttribute("open", "");
    }
  }

  function bind(root) {
    if (!root) return;

    root.querySelectorAll(".scene-tray").forEach((details) => {
      details.addEventListener("toggle", () => {
        SceneMeta.setTrayCollapsed(campaignId, !details.open);
        document.querySelectorAll(".scene-tray").forEach((d) => {
          d.open = details.open;
        });
      });
    });

    root.querySelectorAll("[data-add-scene-entity]").forEach((btn) => {
      btn.addEventListener("click", () => openEntityPicker(btn.dataset.addSceneEntity));
    });

    root.querySelectorAll("[data-set-scene-location]").forEach((btn) => {
      btn.addEventListener("click", () => openLocationPicker(btn.dataset.setSceneLocation));
    });

    root.querySelectorAll("[data-clear-scene-location]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sceneId = btn.dataset.clearSceneLocation;
        SceneMeta.setLocationId(campaignId, sceneId, "", sectionBase(sceneId));
        if (typeof api.onSceneMetaChange === "function") api.onSceneMetaChange(sceneId);
      });
    });

    root.querySelectorAll("[data-remove-scene-entity]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sceneId = btn.dataset.scene;
        SceneMeta.removeEntity(campaignId, sceneId, btn.dataset.removeSceneEntity, null, sectionBase(sceneId));
        if (typeof api.onSceneMetaChange === "function") api.onSceneMetaChange(sceneId);
      });
    });

    root.querySelectorAll("[data-jump-scene]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (typeof api.jumpToSection === "function") api.jumpToSection(btn.dataset.jumpScene);
      });
    });

    root.querySelectorAll("[data-add-connection]").forEach((btn) => {
      btn.addEventListener("click", () => openConnectionPicker(btn.dataset.addConnection));
    });

    root.querySelectorAll("[data-remove-connection]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sceneId = btn.dataset.scene;
        SceneMeta.removeConnection(campaignId, sceneId, btn.dataset.removeConnection, sectionBase(sceneId));
        if (typeof api.onSceneMetaChange === "function") api.onSceneMetaChange(sceneId);
      });
    });
  }

  return {
    init,
    sceneExtrasHtml,
    renderTrayHtml,
    renderConnectionsHtml,
    bind,
    openEntityPicker,
    openLocationPicker,
    openConnectionPicker
  };
})();
