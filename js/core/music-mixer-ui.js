/**
 * Campaign map-rail Music tab — multi-track mixer over Music catalogue entries.
 */
window.MusicMixerUi = (function () {
  "use strict";

  let campaignId = null;
  let listEl = null;
  let dialogEl = null;
  let dialogBodyEl = null;
  let dialogTitleEl = null;
  /** @type {Map<string, HTMLAudioElement>} */
  const players = new Map();
  let dragSlotId = null;

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

  function clampVolume(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0.7;
    return Math.max(0, Math.min(1, n));
  }

  function getPlayer(slotId) {
    let audio = players.get(slotId);
    if (!audio) {
      audio = new Audio();
      audio.preload = "none";
      players.set(slotId, audio);
    }
    return audio;
  }

  function disposePlayer(slotId) {
    const audio = players.get(slotId);
    if (!audio) return;
    try {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    } catch {
      /* ignore */
    }
    players.delete(slotId);
  }

  function disposeAll() {
    for (const id of [...players.keys()]) disposePlayer(id);
  }

  async function ensureSrc(slot, audio) {
    if (audio.dataset.catalogueId === slot.catalogueMusicId && audio.src) return true;
    if (!window.LocalApiClient?.getMusicPlayback) {
      throw new Error("Music playback API unavailable");
    }
    const playback = await LocalApiClient.getMusicPlayback(slot.catalogueMusicId);
    if (!playback?.url) throw new Error("No audio for this track");
    audio.src = playback.url;
    audio.dataset.catalogueId = slot.catalogueMusicId;
    audio.loop = !!slot.loop;
    audio.volume = clampVolume(slot.volume);
    return true;
  }

  async function togglePlay(slot) {
    const audio = getPlayer(slot.id);
    if (!audio.paused && !audio.ended) {
      audio.pause();
      render();
      return;
    }
    try {
      await ensureSrc(slot, audio);
      audio.loop = !!slot.loop;
      audio.volume = clampVolume(slot.volume);
      await audio.play();
    } catch (err) {
      console.warn("music mixer play failed:", err);
      alert(err?.message || t().musicPlayFailed || "Could not play this track.");
    }
    render();
  }

  function listCatalogueOptions() {
    if (!window.CatalogueStore) return [];
    return CatalogueStore.list("music")
      .filter((e) => e?.id && e.audio?.key)
      .sort((a, b) =>
        String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""))
      );
  }

  function openPicker() {
    if (!dialogEl || !dialogBodyEl) return;
    if (dialogTitleEl) dialogTitleEl.textContent = t().musicAddTrack || "Add music";

    const options = listCatalogueOptions();
    if (!options.length) {
      dialogBodyEl.innerHTML = `<p class="empty-state">${escapeHtml(
        t().musicNoCandidates ||
          "No playable tracks yet. Upload an MP3 in the Music catalogue first."
      )}</p>`;
    } else {
      dialogBodyEl.innerHTML = `
        <input type="search" class="party-pick-search" placeholder="${escapeHtml(
          t().musicSearchPlaceholder || "Search music…"
        )}" autocomplete="off">
        <div class="party-pick-list">
          ${options
            .map((e) => {
              const title = e.title || e.name || "Untitled";
              const meta = [e.kind, e.category].filter(Boolean).join(" · ");
              return `
              <button type="button" class="party-pick-choice" data-id="${escapeHtml(e.id)}"
                data-name="${escapeHtml(title)}" data-meta="${escapeHtml(meta)}">
                <span class="party-pick-choice__name">${escapeHtml(title)}</span>
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
          const hay = `${btn.dataset.name || ""} ${btn.dataset.meta || ""}`.toLowerCase();
          btn.hidden = q && !hay.includes(q);
        });
      });
      choices.forEach((btn) => {
        btn.addEventListener("click", () => {
          const entry = CatalogueStore.get("music", btn.dataset.id);
          if (!entry) return;
          CampaignMusicMixer.addTrack(campaignId, {
            catalogueMusicId: entry.id,
            title: entry.title || entry.name || "Untitled track",
            volume: entry.defaultVolume != null ? entry.defaultVolume : 0.7,
            loop: entry.loopByDefault !== false
          });
          closePicker();
          render();
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

  function isPlaying(slotId) {
    const audio = players.get(slotId);
    return !!(audio && !audio.paused && !audio.ended);
  }

  function bindDrag(row) {
    const handle = row.querySelector(".music-mixer-track__handle");
    if (!handle) return;

    handle.addEventListener("dragstart", (e) => {
      dragSlotId = row.dataset.slotId;
      row.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", dragSlotId);
    });
    handle.addEventListener("dragend", () => {
      row.classList.remove("is-dragging");
      dragSlotId = null;
      listEl?.querySelectorAll(".music-mixer-track.is-drop-target").forEach((el) => {
        el.classList.remove("is-drop-target");
      });
    });
    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      row.classList.add("is-drop-target");
    });
    row.addEventListener("dragleave", () => {
      row.classList.remove("is-drop-target");
    });
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.classList.remove("is-drop-target");
      const fromId = dragSlotId || e.dataTransfer.getData("text/plain");
      const toId = row.dataset.slotId;
      if (!fromId || !toId || fromId === toId) return;
      const ids = CampaignMusicMixer.sortedTracks(campaignId).map((tr) => tr.id);
      const from = ids.indexOf(fromId);
      const to = ids.indexOf(toId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, fromId);
      CampaignMusicMixer.reorderTracks(campaignId, ids);
      render();
    });
  }

  function render(container) {
    const host = container || listEl;
    if (!host || !campaignId || !window.CampaignMusicMixer) return;

    const tracks = CampaignMusicMixer.sortedTracks(campaignId);
    const liveIds = new Set(tracks.map((tr) => tr.id));
    for (const id of [...players.keys()]) {
      if (!liveIds.has(id)) disposePlayer(id);
    }

    const addBtn = `
      <div class="music-mixer-tools">
        <button type="button" class="party-add-btn music-mixer-add" data-music-add>+</button>
      </div>`;

    if (!tracks.length) {
      host.innerHTML = `
        <p class="party-empty">${escapeHtml(
          t().musicEmpty || "No tracks yet. Add one from the Music catalogue."
        )}</p>
        ${addBtn}`;
    } else {
      host.innerHTML =
        tracks
          .map((slot) => {
            const playing = isPlaying(slot.id);
            const volPct = Math.round(clampVolume(slot.volume) * 100);
            return `
            <div class="music-mixer-track" data-slot-id="${escapeHtml(slot.id)}">
              <button type="button" class="music-mixer-track__handle" draggable="true"
                aria-label="${escapeHtml(t().musicDragHandle || "Drag to reorder")}" title="${escapeHtml(
                  t().musicDragHandle || "Drag to reorder"
                )}">⋮⋮</button>
              <button type="button" class="music-mixer-track__play" data-play="${escapeHtml(slot.id)}"
                aria-label="${escapeHtml(playing ? t().musicPause || "Pause" : t().musicPlay || "Play")}">
                ${playing ? "❚❚" : "▶"}
              </button>
              <div class="music-mixer-track__body">
                <span class="music-mixer-track__title" title="${escapeHtml(slot.title)}">${escapeHtml(
                  slot.title
                )}</span>
                <label class="music-mixer-track__volume">
                  <span class="visually-hidden">${escapeHtml(t().musicVolume || "Volume")}</span>
                  <input type="range" min="0" max="100" step="1" value="${volPct}" data-volume="${escapeHtml(
                    slot.id
                  )}">
                </label>
              </div>
              <button type="button" class="music-mixer-track__remove" data-remove="${escapeHtml(slot.id)}"
                aria-label="${escapeHtml(t().musicRemove || "Remove track")}">×</button>
            </div>`;
          })
          .join("") + addBtn;
    }

    host.querySelector("[data-music-add]")?.addEventListener("click", openPicker);

    host.querySelectorAll("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = CampaignMusicMixer.sortedTracks(campaignId).find((tr) => tr.id === btn.dataset.play);
        if (slot) togglePlay(slot);
      });
    });

    host.querySelectorAll("[data-volume]").forEach((input) => {
      const apply = () => {
        const slotId = input.dataset.volume;
        const volume = clampVolume(Number(input.value) / 100);
        CampaignMusicMixer.updateTrack(campaignId, slotId, { volume });
        const audio = players.get(slotId);
        if (audio) audio.volume = volume;
      };
      input.addEventListener("input", apply);
      input.addEventListener("change", apply);
    });

    host.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = CampaignMusicMixer.sortedTracks(campaignId).find((tr) => tr.id === btn.dataset.remove);
        if (!slot) return;
        if (!confirm(`Remove “${slot.title}” from this campaign mixer?`)) return;
        disposePlayer(slot.id);
        CampaignMusicMixer.removeTrack(campaignId, slot.id);
        render();
      });
    });

    host.querySelectorAll(".music-mixer-track").forEach(bindDrag);
  }

  function refresh() {
    render(listEl);
  }

  function init(options = {}) {
    campaignId = options.campaignId || document.body?.dataset?.campaignId || null;
    listEl = options.listEl || document.getElementById("music-mixer-list");
    dialogEl = options.dialogEl || document.getElementById("music-mixer-dialog");
    dialogBodyEl = options.dialogBodyEl || document.getElementById("music-mixer-dialog-body");
    dialogTitleEl = options.dialogTitleEl || document.getElementById("music-mixer-dialog-title");

    document.getElementById("music-mixer-dialog-close")?.addEventListener("click", closePicker);
    dialogEl?.addEventListener("click", (e) => {
      if (e.target === dialogEl) closePicker();
    });

    if (listEl) render(listEl);
  }

  return { init, render, refresh, disposeAll };
})();
