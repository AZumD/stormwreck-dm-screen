/** Shared entity tooltip & modal — used by adventure text and map pins */
window.EntityUI = (function () {
  "use strict";

  const { markdownLite, escapeHtml, replaceLinks } = window.ContentParser;

  let tooltipEl;
  let modalEl;
  let modalTitleEl;
  let modalBodyEl;
  let modalBackEl;
  let t;
  let globalHandlersBound = false;
  let modalUiBound = false;
  const openListeners = [];
  const modalEnrichers = [];

  /* Single-modal navigation stack (previous entity ids) */
  let navStack = [];
  let currentModalId = null;
  let modalReturnFocus = null;

  function init(options) {
    tooltipEl = options.tooltip;
    modalEl = options.modal;
    modalTitleEl = options.modalTitle;
    modalBodyEl = options.modalBody;
    t = window.I18N || {};

    if (modalEl && !modalUiBound) {
      modalUiBound = true;
      ensureBackButton();
      modalEl.addEventListener("click", (e) => {
        if (e.target === modalEl) closeModal();
      });
      modalEl.addEventListener("close", () => {
        clearNavStack();
        restoreModalFocus();
      });

      const modalClose = document.getElementById("modal-close");
      if (modalClose) {
        modalClose.addEventListener("click", () => closeModal());
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
          const id = link.dataset.id;
          if (!id) return;
          const fromOpenModal = isModalOpen() && !!currentModalId;
          openModal(id, { pushHistory: fromOpenModal && id !== currentModalId });
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

  function ensureBackButton() {
    if (!modalEl) return;
    modalBackEl = document.getElementById("modal-back");
    if (modalBackEl) {
      modalBackEl.addEventListener("click", goBack);
      return;
    }
    const header = modalEl.querySelector(".modal-header");
    if (!header) return;
    modalBackEl = document.createElement("button");
    modalBackEl.type = "button";
    modalBackEl.id = "modal-back";
    modalBackEl.className = "modal-back hidden";
    modalBackEl.setAttribute("aria-label", t.modalBack || "Back");
    modalBackEl.title = t.modalBack || "Back";
    modalBackEl.innerHTML = `<span class="modal-back__icon" aria-hidden="true"></span>`;
    const closeBtn = header.querySelector("#modal-close");
    if (closeBtn) header.insertBefore(modalBackEl, closeBtn);
    else header.appendChild(modalBackEl);
    modalBackEl.addEventListener("click", goBack);
  }

  function isModalOpen() {
    if (!modalEl) return false;
    if (typeof modalEl.open === "boolean") return modalEl.open;
    return modalEl.hasAttribute("open");
  }

  function clearNavStack() {
    navStack = [];
    currentModalId = null;
    syncBackButton();
  }

  function syncBackButton() {
    if (!modalBackEl) return;
    const show = navStack.length > 0;
    modalBackEl.classList.toggle("hidden", !show);
    modalBackEl.disabled = !show;
  }

  function restoreModalFocus() {
    const el = modalReturnFocus;
    modalReturnFocus = null;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    }
  }

  function closeModal() {
    if (!modalEl) return;
    if (typeof modalEl.close === "function") modalEl.close();
    else {
      modalEl.removeAttribute("open");
      clearNavStack();
      restoreModalFocus();
    }
  }

  function goBack() {
    const prev = navStack.pop();
    syncBackButton();
    if (!prev) return;
    openModal(prev, { pushHistory: false, replace: true });
  }

  function resolveEntity(id) {
    if (!id) return null;
    if (window.EntityRegistry?.resolve) {
      const entity = window.EntityRegistry.resolve(id);
      if (entity) return entity;
    }
    return window.ENTITIES?.[id] || null;
  }

  function buildTooltipHtml(entity, options = {}) {
    const compact = !!options.compact;
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
      ${!compact && entity.summary ? `<div class="tooltip-stat">${escapeHtml(entity.summary)}</div>` : ""}
      ${ac ? `<div class="tooltip-stat">AC ${escapeHtml(ac)}${hp ? ` · HP ${escapeHtml(hp)}` : ""}</div>` : ""}
      <div class="tooltip-meta" style="margin-top:0.5rem">${t.clickForDetails || "Click for full details"}</div>`;
  }

  function buildPartyTooltipHtml(member) {
    const kind = member.memberType === "npc" ? "NPC" : "PC";
    return `
      <div class="tooltip-title">${escapeHtml(member.name)}</div>
      <div class="tooltip-meta">${kind} · ${escapeHtml(member.class || "")}</div>
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

  function showTooltipForEntity(entityId, e, options = {}) {
    const entity = resolveEntity(entityId);
    if (!entity) {
      showTooltipHtml(
        `<div class="tooltip-title">${escapeHtml(entityId)}</div><div class="tooltip-stat">No catalogue entry found</div>`,
        e
      );
      return;
    }
    showTooltipHtml(buildTooltipHtml(entity, options), e);
  }

  function showTooltipForParty(member, e) {
    showTooltipHtml(buildPartyTooltipHtml(member), e);
  }

  function showTooltipForPin(pin, e) {
    /* Map pins stay compact — name/type/AC·HP only, not the full summary */
    if (pin.entityId) return showTooltipForEntity(pin.entityId, e, { compact: true });
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

  function formatStatValue(value) {
    const raw = String(value ?? "");
    if (!raw) return "";
    if (raw.includes("@") || raw.includes("[[")) {
      const registry = window.EntityRegistry?.getAll?.() || window.ENTITIES || {};
      return replaceLinks(raw, registry);
    }
    return escapeHtml(raw);
  }

  /**
   * @param {string} entityId
   * @param {{ pushHistory?: boolean, replace?: boolean }} [options]
   * - Fresh open (campaign link, search, etc.): clears stack
   * - pushHistory true: keep stack and push previous id (in-modal wiki nav)
   * - replace true: render without touching stack (Back)
   */
  function openModal(entityId, options = {}) {
    if (!modalEl) return;
    ensureBackButton();

    const pushHistory = !!options.pushHistory;
    const replace = !!options.replace;

    if (!replace && !pushHistory) {
      navStack = [];
      modalReturnFocus = document.activeElement;
    } else if (pushHistory && currentModalId && currentModalId !== entityId) {
      navStack.push(currentModalId);
    }

    currentModalId = entityId || null;

    const entity = resolveEntity(entityId);
    if (!entity) {
      if (modalTitleEl) modalTitleEl.textContent = entityId;
      modalBodyEl.innerHTML = `<p class="empty-state">No catalogue entry for <strong>${escapeHtml(entityId)}</strong>. Add or edit it in the <strong>Compendium</strong>, then refresh.</p>`;
      syncBackButton();
      try {
        modalEl.showModal();
      } catch {
        modalEl.setAttribute("open", "");
      }
      hideTooltip();
      return;
    }

    if (modalTitleEl) modalTitleEl.textContent = entity.name;
    let body = "";
    if (entity.portrait) {
      body += `<img class="entity-portrait" src="${escapeHtml(entity.portrait)}" alt="${escapeHtml(entity.name)}">`;
    }
    if (entity.summary) body += `<p><em>${escapeHtml(entity.summary)}</em></p>`;

    if (entity.stats && Object.keys(entity.stats).length) {
      body += `<div class="stat-block">`;
      for (const [label, value] of Object.entries(entity.stats)) {
        body += `<div class="stat-row"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-value">${formatStatValue(value)}</span></div>`;
      }
      body += `</div>`;
    }

    if (entity.details) body += markdownLite(entity.details);
    modalBodyEl.innerHTML = body;
    modalEnrichers.forEach((fn) => {
      try {
        fn(entity, modalBodyEl, modalEl);
      } catch (err) {
        console.warn("EntityUI modal enricher failed:", err);
      }
    });
    syncBackButton();
    try {
      modalEl.showModal();
    } catch {
      modalEl.setAttribute("open", "");
    }
    hideTooltip();
    openListeners.forEach((fn) => {
      try {
        fn(entityId, entity);
      } catch (err) {
        console.warn("EntityUI open listener failed:", err);
      }
    });
  }

  function addOpenListener(fn) {
    if (typeof fn === "function" && !openListeners.includes(fn)) openListeners.push(fn);
  }

  function addModalEnricher(fn) {
    if (typeof fn === "function" && !modalEnrichers.includes(fn)) modalEnrichers.push(fn);
  }

  function openPartyModal(member) {
    if (!modalEl) return;
    navStack = [];
    currentModalId = null;
    modalReturnFocus = document.activeElement;
    syncBackButton();
    if (modalTitleEl) modalTitleEl.textContent = member.name;
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
    navStack = [];
    currentModalId = null;
    modalReturnFocus = document.activeElement;
    syncBackButton();
    if (modalTitleEl) modalTitleEl.textContent = pin.label;
    modalBodyEl.innerHTML = pin.summary ? `<p>${escapeHtml(pin.summary)}</p>` : `<p class="empty-state">No details.</p>`;
    modalEl.showModal();
    hideTooltip();
  }

  function bindEntityLinks(_root) {
    /* Global document handlers registered in init() */
  }

  return {
    init,
    addModalEnricher,
    showTooltipForEntity,
    showTooltipForParty,
    showTooltipForPin,
    moveTooltip,
    hideTooltip,
    addOpenListener,
    openModal,
    closeModal,
    goBack,
    openPartyModal,
    openPinModal,
    bindEntityLinks,
    /** Test helper */
    _navState: () => ({ stack: navStack.slice(), current: currentModalId })
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
