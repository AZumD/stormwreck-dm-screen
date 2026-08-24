/**
 * Campaign party roster — PCs and companion NPCs from catalogues.
 * Persisted in CampaignState.party; builds window.PARTY for map pins / tooltips.
 */
window.PartyRoster = (function () {
  "use strict";

  const COLORS = ["#c4a035", "#7eb8da", "#8bc49a", "#d4847a", "#b08d57", "#9a7bb5", "#6aa8a1", "#c97b5a"];

  let listEl = null;
  let dialogEl = null;
  let dialogBodyEl = null;
  let dialogTitleEl = null;
  let pickType = "pc";

  function t() {
    return window.I18N || {};
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function colorFromId(id) {
    let hash = 0;
    const s = String(id || "");
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return COLORS[hash % COLORS.length];
  }

  function hydrateEntry(type, id) {
    if (!window.CatalogueStore) return null;
    let entry = CatalogueStore.get(type, id);
    if (!entry) return null;
    if (window.CatalogueImages) entry = CatalogueImages.hydrate(type, entry);
    return entry;
  }

  function partyId(type, catalogueId) {
    return `${type}:${catalogueId}`;
  }

  function toPartyMember(ref) {
    const entry = hydrateEntry(ref.type, ref.id);
    if (!entry) return null;

    let entityId = entry.linkId || entry.id;
    if (window.EntityRegistry?.getAll) {
      const hit = Object.values(EntityRegistry.getAll() || {}).find(
        (e) => e.catalogueId === entry.id || e.id === entry.id || e.id === entry.linkId
      );
      if (hit?.id) entityId = hit.id;
    }

    const hp =
      ref.type === "pc"
        ? entry.hpMax != null && entry.hpMax !== ""
          ? `${entry.hpCurrent ?? "—"}/${entry.hpMax}`
          : entry.hpCurrent != null && entry.hpCurrent !== ""
            ? String(entry.hpCurrent)
            : "—"
        : entry.hp || "—";

    const subtitle =
      ref.type === "pc"
        ? [entry.class, entry.level ? `Lv ${entry.level}` : ""].filter(Boolean).join(" · ") || "PC"
        : entry.role || entry.summary?.slice(0, 48) || "NPC";

    return {
      id: partyId(ref.type, entry.id),
      catalogueId: entry.id,
      memberType: ref.type,
      entityId,
      name: entry.name || "Unnamed",
      class: subtitle,
      hp: String(hp),
      ac: entry.ac ?? "—",
      speed: entry.speed || "",
      portrait: entry.portrait || "",
      color: colorFromId(entry.id),
      notes: entry.notes || entry.backstory || entry.summary || ""
    };
  }

  function syncWindowParty() {
    if (!window.CampaignState) {
      window.PARTY = window.PARTY || [];
      return window.PARTY;
    }
    window.PARTY = CampaignState.getParty()
      .map(toPartyMember)
      .filter(Boolean);
    return window.PARTY;
  }

  function listCatalogueOptions(type) {
    if (!window.CatalogueStore) return [];
    let list = CatalogueStore.list(type);
    if (window.CatalogueImages) list = CatalogueImages.hydrateAll(type, list);
    const inParty = new Set(
      (CampaignState.getParty() || [])
        .filter((m) => m.type === type)
        .map((m) => m.id)
    );
    return list
      .filter((e) => e?.id && !inParty.has(e.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }

  function openPicker(type) {
    pickType = type === "npc" ? "npc" : "pc";
    if (!dialogEl || !dialogBodyEl) return;

    const label = pickType === "npc" ? t().addNpcToParty || "Add NPC to party" : t().addPcToParty || "Add PC to party";
    if (dialogTitleEl) dialogTitleEl.textContent = label;

    const options = listCatalogueOptions(pickType);
    if (!options.length) {
      dialogBodyEl.innerHTML = `<p class="empty-state">${escapeHtml(
        t().partyNoCandidates || "No more catalogue entries to add. Create one in the catalogues first."
      )}</p>`;
    } else {
      dialogBodyEl.innerHTML = `
        <input type="search" class="party-pick-search" placeholder="${escapeHtml(t().partySearchPlaceholder || "Search…")}" autocomplete="off">
        <div class="party-pick-list">
          ${options
            .map((e) => {
              const meta =
                pickType === "pc"
                  ? [e.class, e.level ? `Lv ${e.level}` : ""].filter(Boolean).join(" · ")
                  : e.role || "";
              return `
              <button type="button" class="party-pick-choice" data-id="${escapeHtml(e.id)}" data-name="${escapeHtml(e.name || "")}">
                <span class="party-pick-choice__name">${escapeHtml(e.name || "Untitled")}</span>
                ${meta ? `<span class="party-pick-choice__meta">${escapeHtml(meta)}</span>` : ""}
              </button>`;
            })
            .join("")}
        </div>`;

      const search = dialogBodyEl.querySelector(".party-pick-search");
      const choices = [...dialogBodyEl.querySelectorAll(".party-pick-choice")];
      search?.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        choices.forEach((btn) => {
          const hay = `${btn.dataset.name || ""} ${btn.querySelector(".party-pick-choice__meta")?.textContent || ""}`.toLowerCase();
          btn.hidden = q && !hay.includes(q);
        });
      });
      choices.forEach((btn) => {
        btn.addEventListener("click", () => {
          CampaignState.addPartyMember(pickType, btn.dataset.id);
          closePicker();
          refresh();
          window.MapPanel?.refresh?.();
        });
      });
    }

    try {
      dialogEl.showModal();
    } catch {
      dialogEl.setAttribute("open", "");
    }
  }

  function closePicker() {
    if (!dialogEl) return;
    if (typeof dialogEl.close === "function") dialogEl.close();
    else dialogEl.removeAttribute("open");
  }

  function openMember(member) {
    if (!member) return;
    if (
      window.CombatSheetModal &&
      (member.memberType === "pc" || member.memberType === "npc") &&
      member.catalogueId
    ) {
      CombatSheetModal.open({
        kind: member.memberType,
        catalogueId: member.catalogueId,
        entityId: member.entityId,
        name: member.name,
        portrait: member.portrait
      });
      return;
    }
    if (member.entityId && window.EntityUI?.openModal) {
      const resolved = EntityRegistry?.resolve?.(member.entityId);
      if (resolved) {
        EntityUI.openModal(member.entityId);
        return;
      }
    }
    if (member.catalogueId && window.EntityUI?.openModal && window.EntityRegistry) {
      const all = EntityRegistry.getAll?.() || {};
      const hit = Object.values(all).find((e) => e.catalogueId === member.catalogueId);
      if (hit?.id) {
        EntityUI.openModal(hit.id);
        return;
      }
    }
    EntityUI?.openPartyModal?.(member);
  }

  function render(container) {
    const host = container || listEl;
    if (!host) return;

    syncWindowParty();
    const party = window.PARTY || [];

    const tools = `
      <div class="party-tools">
        <button type="button" class="party-add-btn" data-add-party="pc">${escapeHtml(t().addPc || "+ PC")}</button>
        <button type="button" class="party-add-btn" data-add-party="npc">${escapeHtml(t().addNpc || "+ NPC")}</button>
      </div>`;

    if (!party.length) {
      host.innerHTML = `
        ${tools}
        <p class="party-empty">${escapeHtml(t().partyEmpty || "No party members yet. Add PCs or companion NPCs from your catalogues.")}</p>`;
    } else {
      host.innerHTML =
        tools +
        party
          .map((m) => {
            const initials = m.name
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const portrait = m.portrait
              ? `<img class="party-card__img" src="${escapeHtml(m.portrait)}" alt="">`
              : `<span class="party-card__initials" style="--pc-color:${escapeHtml(m.color || "#c4a035")}">${escapeHtml(initials)}</span>`;
            const typeLabel = m.memberType === "npc" ? "NPC" : "PC";

            return `
              <div class="party-card-wrap">
                <button type="button" class="party-card" data-party-id="${escapeHtml(m.id)}">
                  <div class="party-card__portrait">${portrait}</div>
                  <div class="party-card__info">
                    <span class="party-card__name">${escapeHtml(m.name)}</span>
                    <span class="party-card__class">${escapeHtml(typeLabel)} · ${escapeHtml(m.class || "")}</span>
                    <span class="party-card__stats">HP ${escapeHtml(m.hp)} · AC ${escapeHtml(String(m.ac))}</span>
                  </div>
                </button>
                <button type="button" class="party-card__remove" data-remove-party="${escapeHtml(m.id)}" aria-label="${escapeHtml(t().removeFromParty || "Remove from party")}">×</button>
              </div>`;
          })
          .join("");
    }

    host.querySelectorAll("[data-add-party]").forEach((btn) => {
      btn.addEventListener("click", () => openPicker(btn.dataset.addParty));
    });

    host.querySelectorAll(".party-card").forEach((btn) => {
      const member = (window.PARTY || []).find((p) => p.id === btn.dataset.partyId);
      if (!member) return;
      btn.addEventListener("mouseenter", (e) => EntityUI.showTooltipForParty(member, e));
      btn.addEventListener("mousemove", (e) => EntityUI.moveTooltip(e));
      btn.addEventListener("mouseleave", () => EntityUI.hideTooltip());
      btn.addEventListener("click", () => openMember(member));
    });

    host.querySelectorAll("[data-remove-party]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const member = (window.PARTY || []).find((p) => p.id === btn.dataset.removeParty);
        if (!member) return;
        if (!confirm(`Remove ${member.name} from the party?`)) return;
        CampaignState.removePartyMember(member.memberType, member.catalogueId);
        refresh();
        window.MapPanel?.refresh?.();
      });
    });
  }

  function refresh() {
    syncWindowParty();
    if (listEl) render(listEl);
  }

  function init(options = {}) {
    listEl = options.listEl || document.getElementById("party-list");
    dialogEl = options.dialogEl || document.getElementById("party-dialog");
    dialogBodyEl = options.dialogBodyEl || document.getElementById("party-dialog-body");
    dialogTitleEl = options.dialogTitleEl || document.getElementById("party-dialog-title");

    document.getElementById("party-dialog-close")?.addEventListener("click", closePicker);
    dialogEl?.addEventListener("click", (e) => {
      if (e.target === dialogEl) closePicker();
    });

    syncWindowParty();
    render(listEl);
  }

  return {
    init,
    refresh,
    syncWindowParty,
    render,
    toPartyMember
  };
})();
