/**
 * Landing page: list user campaigns + create new sandbox campaigns.
 */
(function () {
  "use strict";

  const listEl = document.getElementById("user-campaign-list");
  const createBtn = document.getElementById("create-campaign-btn");
  const dialog = document.getElementById("create-campaign-dialog");
  const form = document.getElementById("create-campaign-form");
  const titleInput = document.getElementById("create-campaign-title");
  const descInput = document.getElementById("create-campaign-description");
  const cancelBtn = document.getElementById("create-campaign-cancel");

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderUserCampaigns() {
    if (!listEl || !window.CampaignRegistry) return;
    const campaigns = CampaignRegistry.list();
    if (!campaigns.length) {
      listEl.innerHTML = "";
      listEl.hidden = true;
      return;
    }
    listEl.hidden = false;
    listEl.innerHTML = campaigns
      .map((c) => {
        const href = CampaignRegistry.sandboxUrl(c.id);
        const desc = c.description || "Custom sandbox campaign";
        const level = c.level ? `<span class="card-tag">${escapeHtml(c.level)}</span>` : "";
        return `
          <a class="card card-user-campaign" href="${escapeHtml(href)}" data-campaign-id="${escapeHtml(c.id)}">
            <div class="card-user-campaign__meta">
              <span class="card-status">Your campaign</span>
              ${level}
            </div>
            <h3>${escapeHtml(c.title)}</h3>
            <p>${escapeHtml(desc)}</p>
            <span class="card-action">Open campaign</span>
          </a>`;
      })
      .join("");
  }

  function openCreateDialog() {
    if (!dialog || typeof dialog.showModal !== "function") {
      const title = window.prompt("Campaign title");
      if (!title || !title.trim()) return;
      createAndOpen(title.trim(), "");
      return;
    }
    if (form) form.reset();
    dialog.showModal();
    titleInput?.focus();
  }

  function createAndOpen(title, description) {
    if (!window.CampaignRegistry) return;
    const entry = CampaignRegistry.create({ title, description });
    if (!entry) return;
    window.location.href = CampaignRegistry.sandboxUrl(entry.id);
  }

  function bind() {
    createBtn?.addEventListener("click", () => openCreateDialog());
    cancelBtn?.addEventListener("click", () => dialog?.close());
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = String(titleInput?.value || "").trim();
      if (!title) {
        titleInput?.focus();
        return;
      }
      const description = String(descInput?.value || "").trim();
      dialog?.close();
      createAndOpen(title, description);
    });

    listEl?.addEventListener("click", (e) => {
      const link = e.target.closest?.("a[data-campaign-id]");
      if (!link || !window.CampaignRegistry) return;
      CampaignRegistry.update(link.getAttribute("data-campaign-id"), {});
    });
  }

  bind();
  renderUserCampaigns();
})();
