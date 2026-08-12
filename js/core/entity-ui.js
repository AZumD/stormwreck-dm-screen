/** Shared entity tooltip & modal — used by adventure text and map pins */
window.EntityUI = (function () {
  "use strict";

  const { markdownLite, escapeHtml } = ContentParser;

  let tooltipEl;
  let modalEl;
  let modalTitleEl;
  let modalBodyEl;
  let t;
  let globalHandlersBound = false;
  let modalUiBound = false;

  function init(options) {
    tooltipEl = options.tooltip;
    modalEl = options.modal;
    modalTitleEl = options.modalTitle;
    modalBodyEl = options.modalBody;
    t = window.I18N || {};

    if (modalEl && !modalUiBound) {
      modalUiBound = true;
      modalEl.addEventListener("click", (e) => {
        if (e.target === modalEl) modalEl.close();
      });

      const modalClose = document.getElementById("modal-close");
      if (modalClose) {
        modalClose.addEventListener("click", () => modalEl.close());
      }
    }

    if (!globalHandlersBound) {
      globalHandlersBound = true;

      document.addEventListener(
        "click",
        (e) => {
          const link = e.target.closest(".entity-link");
          if (!link) return;
          e.preventDefault();
          e.stopPropagation();
          openModal(link.dataset.id);
        },
        true
      );

      document.addEventListener("mouseover", (e) => {
        const link = e.target.closest(".entity-link");
        if (!link) return;
        showTooltipForEntity(link.dataset.id, e);
      });

      document.addEventListener("mousemove", (e) => {
        if (!tooltipEl || tooltipEl.classList.contains("hidden")) return;
        if (!e.target.closest(".entity-link")) return;
        moveTooltip(e);
      });

      document.addEventListener("mouseout", (e) => {
        const link = e.target.closest(".entity-link");
        if (!link) return;
        const related = e.relatedTarget;
        if (related && (link.contains(related) || related.closest?.(".entity-link"))) return;
        hideTooltip();
      });
    }
  }

  function resolveEntity(id) {
    if (!id) return null;
    if (window.EntityRegistry?.resolve) {
      const entity = EntityRegistry.resolve(id);
      if (entity) return entity;
    }
    return window.ENTITIES?.[id] || null;
  }

  function buildTooltipHtml(entity) {
    const ac = entity.stats?.AC || entity.stats?.ac;
    const hp = entity.stats?.HP || entity.stats?.hp;
    const portrait = entity.portrait
      ? `<img class="tooltip-portrait" src="${escapeHtml(entity.portrait)}" alt="">`
      : "";
    return `
      <div class="tooltip-head">
        ${portrait}
        <div>
          <div class="tooltip-title">${escapeHtml(entity.name)}</div>
          <div class="tooltip-meta">${(t.typeLabels?.[entity.type] || entity.type).toUpperCase()}</div>
        </div>
      </div>
      ${entity.summary ? `<div class="tooltip-stat">${escapeHtml(entity.summary)}</div>` : ""}
      ${ac ? `<div class="tooltip-stat">AC ${escapeHtml(ac)}${hp ? ` · HP ${escapeHtml(hp)}` : ""}</div>` : ""}
      <div class="tooltip-meta" style="margin-top:0.5rem">${t.clickForDetails || "Click for full details"}</div>`;
  }

  function buildPartyTooltipHtml(member) {
    return `
      <div class="tooltip-title">${escapeHtml(member.name)}</div>
      <div class="tooltip-meta">PC · ${escapeHtml(member.class || "")}</div>
      <div class="tooltip-stat">HP ${escapeHtml(member.hp || "?")} · AC ${escapeHtml(String(member.ac ?? "?"))}</div>
      <div class="tooltip-meta" style="margin-top:0.5rem">${t.clickForDetails || "Click for full details"}</div>`;
  }

  function buildPinTooltipHtml(pin) {
    return `
      <div class="tooltip-title">${escapeHtml(pin.label)}</div>
      <div class="tooltip-meta">${(pin.pinType || "poi").toUpperCase()}</div>
      ${pin.summary ? `<div class="tooltip-stat">${escapeHtml(pin.summary)}</div>` : ""}`;
  }

  function showTooltipHtml(html, e) {
    if (!tooltipEl) return;
    tooltipEl.innerHTML = html;
    tooltipEl.classList.remove("hidden");
    moveTooltip(e);
  }

  function showTooltipForEntity(entityId, e) {
    const entity = resolveEntity(entityId);
    if (!entity) {
      showTooltipHtml(
        `<div class="tooltip-title">${escapeHtml(entityId)}</div><div class="tooltip-stat">No catalogue entry found</div>`,
        e
      );
      return;
    }
    showTooltipHtml(buildTooltipHtml(entity), e);
  }

  function showTooltipForParty(member, e) {
    showTooltipHtml(buildPartyTooltipHtml(member), e);
  }

  function showTooltipForPin(pin, e) {
    if (pin.entityId) return showTooltipForEntity(pin.entityId, e);
    if (pin.partyId && window.PARTY) {
      const member = window.PARTY.find((p) => p.id === pin.partyId);
      if (member) return showTooltipForParty(member, e);
    }
    showTooltipHtml(buildPinTooltipHtml(pin), e);
  }

  function moveTooltip(e) {
    if (!tooltipEl || tooltipEl.classList.contains("hidden")) return;
    const pad = 12;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    const rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - pad;
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.add("hidden");
  }

  function openModal(entityId) {
    if (!modalEl) return;

    const entity = resolveEntity(entityId);
    if (!entity) {
      modalTitleEl.textContent = entityId;
      modalBodyEl.innerHTML = `<p class="empty-state">No catalogue entry for <strong>${escapeHtml(entityId)}</strong>. Add or edit it in the matching catalogue on the DM Library landing page, then refresh.</p>`;
      try {
        modalEl.showModal();
      } catch {
        modalEl.setAttribute("open", "");
      }
      hideTooltip();
      return;
    }

    modalTitleEl.textContent = entity.name;
    let body = "";
    if (entity.portrait) {
      body += `<img class="entity-portrait" src="${escapeHtml(entity.portrait)}" alt="${escapeHtml(entity.name)}">`;
    }
    if (entity.summary) body += `<p><em>${escapeHtml(entity.summary)}</em></p>`;

    if (entity.stats && Object.keys(entity.stats).length) {
      body += `<div class="stat-block">`;
      for (const [label, value] of Object.entries(entity.stats)) {
        body += `<div class="stat-row"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${escapeHtml(value)}</span></div>`;
      }
      body += `</div>`;
    }

    if (entity.details) body += markdownLite(entity.details);
    modalBodyEl.innerHTML = body;
    try {
      modalEl.showModal();
    } catch {
      modalEl.setAttribute("open", "");
    }
    hideTooltip();
  }

  function openPartyModal(member) {
    if (!modalEl) return;
    modalTitleEl.textContent = member.name;
    const portrait = member.portrait
      ? `<img class="entity-portrait" src="${escapeHtml(member.portrait)}" alt="${escapeHtml(member.name)}">`
      : "";
    modalBodyEl.innerHTML = `
      ${portrait}
      <p><em>${escapeHtml(member.class || "Adventurer")}</em></p>
      <div class="stat-block">
        <div class="stat-row"><span class="stat-label">HP</span><span class="stat-value">${escapeHtml(member.hp || "?")}</span></div>
        <div class="stat-row"><span class="stat-label">AC</span><span class="stat-value">${escapeHtml(String(member.ac ?? "?"))}</span></div>
        ${member.speed ? `<div class="stat-row"><span class="stat-label">Speed</span><span class="stat-value">${escapeHtml(member.speed)}</span></div>` : ""}
        ${member.notes ? `<p>${escapeHtml(member.notes)}</p>` : ""}
      </div>`;
    modalEl.showModal();
    hideTooltip();
  }

  function openPinModal(pin) {
    if (pin.entityId) return openModal(pin.entityId);
    if (pin.partyId && window.PARTY) {
      const member = window.PARTY.find((p) => p.id === pin.partyId);
      if (member) return openPartyModal(member);
    }
    if (!modalEl) return;
    modalTitleEl.textContent = pin.label;
    modalBodyEl.innerHTML = pin.summary ? `<p>${escapeHtml(pin.summary)}</p>` : `<p class="empty-state">No details.</p>`;
    modalEl.showModal();
    hideTooltip();
  }

  function bindEntityLinks(_root) {
    /* Global document handlers registered in init() */
  }

  return {
    init,
    showTooltipForEntity,
    showTooltipForParty,
    showTooltipForPin,
    moveTooltip,
    hideTooltip,
    openModal,
    openPartyModal,
    openPinModal,
    bindEntityLinks
  };
})();

(function bootstrapEntityUI() {
  const tooltip = document.getElementById("entity-tooltip");
  const modal = document.getElementById("entity-modal");
  if (!tooltip && !modal) return;

  EntityUI.init({
    tooltip,
    modal,
    modalTitle: document.getElementById("modal-title"),
    modalBody: document.getElementById("modal-body")
  });
})();
