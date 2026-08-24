/**
 * Campaign locations panel — add/remove catalogue locations for this campaign.
 */
window.CampaignLocationsUI = (function () {
  "use strict";

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadLocationEntry(catalogueId) {
    const id = CampaignLocations.normalizeCatalogueId(catalogueId);
    let entry =
      window.CatalogueStore?.get?.("location", id) ||
      (window.CatalogueSeeds?.location || []).find((e) => e.id === id);
    if (entry && window.CatalogueImages?.hydrate) entry = CatalogueImages.hydrate("location", entry);
    return entry;
  }

  function mapStatus(entry) {
    if (!entry) return "Missing from catalogue";
    if (entry.mapCalibration?.kind === "uvtt") return "UVTT calibrated";
    if (entry.mapImage) return "Map image";
    const linkId = entry.id?.startsWith("sw-") ? entry.id.slice(3) : entry.id;
    if (window.MAPS?.[linkId]?.image) return "Placeholder map";
    return "No map yet";
  }

  function renderPanel(campaignId) {
    const ids = CampaignLocations.listIds(campaignId);
    const rows = ids
      .map((id) => {
        const entry = loadLocationEntry(id);
        const name = entry?.name || id;
        const meta = [entry?.locationType, mapStatus(entry)].filter(Boolean).join(" · ");
        return `
          <li class="campaign-loc-row" data-location-id="${escapeHtml(id)}">
            <div class="campaign-loc-row__main">
              <strong class="campaign-loc-row__name">${escapeHtml(name)}</strong>
              ${meta ? `<span class="campaign-loc-row__meta">${escapeHtml(meta)}</span>` : ""}
            </div>
            <div class="campaign-loc-row__actions">
              <button type="button" class="toolbar-btn" data-open-location="${escapeHtml(id)}">Details</button>
              <button type="button" class="toolbar-btn campaign-loc-row__remove" data-remove-location="${escapeHtml(id)}">Remove</button>
            </div>
          </li>`;
      })
      .join("");

    const empty = ids.length
      ? ""
      : `<p class="empty-state">No locations in this campaign yet. Add places from the location catalogue — they will appear in the map picker.</p>`;

    return `
      <div class="campaign-locations">
        <p class="campaign-locations__lede">Locations in this campaign appear in the map panel. Upload maps and UVTT files in the <a href="/location-katalog/index.html">Location catalogue</a>.</p>
        <div class="campaign-locations__toolbar">
          <button type="button" class="toolbar-btn" id="campaign-add-location">Add location</button>
        </div>
        <ul class="campaign-loc-list">${rows}</ul>
        ${empty}
      </div>`;
  }

  function bindPanel(root, campaignId) {
    if (!root || !campaignId) return;

    root.querySelector("#campaign-add-location")?.addEventListener("click", () => {
      openPicker(campaignId, root);
    });

    root.querySelectorAll("[data-remove-location]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.removeLocation;
        if (!id) return;
        const entry = loadLocationEntry(id);
        const label = entry?.name || id;
        if (!window.confirm(`Remove “${label}” from this campaign? (The catalogue entry is kept.)`)) return;
        CampaignLocations.remove(campaignId, id);
        root.innerHTML = renderPanel(campaignId);
        bindPanel(root, campaignId);
        window.MapPanel?.refresh?.();
      });
    });

    root.querySelectorAll("[data-open-location]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.openLocation;
        const entry = loadLocationEntry(id);
        const linkId = entry?.id?.startsWith("sw-") ? entry.id.slice(3) : id;
        if (window.EntityUI?.openModal) EntityUI.openModal(linkId);
      });
    });
  }

  function openPicker(campaignId, panelRoot, options = {}) {
    const { onAdded } = options;
    const inCampaign = new Set(CampaignLocations.listIds(campaignId));
    const all = window.CatalogueStore?.loadAll?.("location") || window.CatalogueSeeds?.location || [];
    const candidates = all
      .filter((e) => e?.id && !inCampaign.has(e.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    const dlg = document.getElementById("campaign-location-picker");
    const body = dlg?.querySelector(".modal-body") || dlg;
    if (!dlg || !body) {
      window.alert("Location picker unavailable.");
      return;
    }

    body.innerHTML = candidates.length
      ? `
        <input type="search" class="party-pick-search" id="campaign-loc-search" placeholder="Search locations…" autocomplete="off">
        <div class="party-pick-list" id="campaign-loc-pick-list">
          ${candidates
            .map(
              (e) => `
            <button type="button" class="party-pick-choice" data-id="${escapeHtml(e.id)}" data-name="${escapeHtml(e.name || "")}">
              <span class="party-pick-choice__name">${escapeHtml(e.name || "Untitled")}</span>
              <span class="party-pick-choice__meta">${escapeHtml(e.locationType || "")}</span>
            </button>`
            )
            .join("")}
        </div>`
      : `<p class="empty-state">All catalogue locations are already in this campaign.</p>`;

    body.querySelectorAll(".party-pick-choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        CampaignLocations.add(campaignId, id);
        try {
          dlg.close();
        } catch {
          dlg.removeAttribute("open");
        }
        if (panelRoot) {
          panelRoot.innerHTML = renderPanel(campaignId);
          bindPanel(panelRoot, campaignId);
        }
        window.MapPanel?.refresh?.();
        onAdded?.(id);
      });
    });

    const search = body.querySelector("#campaign-loc-search");
    const list = body.querySelector("#campaign-loc-pick-list");
    search?.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      list?.querySelectorAll(".party-pick-choice").forEach((btn) => {
        const hay = `${btn.dataset.name || ""} ${btn.dataset.id || ""}`.toLowerCase();
        btn.hidden = q ? !hay.includes(q) : false;
      });
    });

    try {
      dlg.showModal();
    } catch {
      dlg.setAttribute("open", "");
    }
    dlg.querySelector("#campaign-location-picker-close")?.addEventListener(
      "click",
      () => {
        try {
          dlg.close();
        } catch {
          dlg.removeAttribute("open");
        }
      },
      { once: true }
    );
  }

  function mount(panelRoot, campaignId) {
    if (!panelRoot) return;
    panelRoot.innerHTML = renderPanel(campaignId);
    bindPanel(panelRoot, campaignId);
  }

  return { renderPanel, bindPanel, mount, openPicker };
})();
