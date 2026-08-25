/**
 * Single-track catalogue preview player + Music upload dialog helpers.
 * Catalogue browsing keeps one preview active; future Pocket Bard mixer is separate.
 */
window.MusicCatalogueUi = (function () {
  "use strict";

  let previewEl = null;
  let previewId = null;

  function ensurePreviewEl() {
    if (previewEl) return previewEl;
    previewEl = document.createElement("audio");
    previewEl.preload = "metadata";
    previewEl.style.display = "none";
    document.body.appendChild(previewEl);
    return previewEl;
  }

  function stopPreview() {
    const el = ensurePreviewEl();
    el.pause();
    el.removeAttribute("src");
    el.load();
    previewId = null;
  }

  async function playPreview(entryId) {
    if (!entryId || !window.LocalApiClient?.getMusicPlayback) return;
    const playback = await LocalApiClient.getMusicPlayback(entryId);
    if (!playback?.url) throw new Error("No playback URL");
    const el = ensurePreviewEl();
    if (previewId && previewId !== entryId) stopPreview();
    el.src = playback.url;
    el.loop = false;
    previewId = entryId;
    await el.play();
  }

  function pausePreview() {
    ensurePreviewEl().pause();
  }

  function bindPreviewClicks(root) {
    if (!root) return;
    root.querySelectorAll("[data-audio-play]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-audio-play");
        try {
          await playPreview(id);
        } catch (err) {
          alert(err.message || "Could not play preview. Is the server running?");
        }
      });
    });
    root.querySelectorAll("[data-audio-pause]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        pausePreview();
      });
    });
    root.querySelectorAll("[data-audio-stop]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        stopPreview();
      });
    });
  }

  function titleFromFilename(name) {
    return String(name || "Untitled track")
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim() || "Untitled track";
  }

  function probeDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      const done = (sec) => {
        URL.revokeObjectURL(url);
        resolve(sec);
      };
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const d = audio.duration;
        done(Number.isFinite(d) ? d : null);
      };
      audio.onerror = () => done(null);
      audio.src = url;
    });
  }

  function openUploadDialog({ existingId, onComplete } = {}) {
    return new Promise((resolve) => {
      const dlg = document.createElement("dialog");
      dlg.className = "cat-music-upload";
      dlg.innerHTML = `
        <form method="dialog" class="cat-music-upload__form">
          <h2>${existingId ? "Replace track audio" : "Upload track"}</h2>
          <label>MP3 file
            <input type="file" name="file" accept="audio/mpeg,.mp3,audio/mp3" required>
          </label>
          <label>Title
            <input type="text" name="title" placeholder="Ocean Waves" required>
          </label>
          <label>Kind
            <select name="kind">
              <option value="ambience">Ambience</option>
              <option value="creature">Creature</option>
              <option value="music">Music</option>
            </select>
          </label>
          <label>Category
            <input type="text" name="category" placeholder="coastal, combat…">
          </label>
          <label>Tags (comma-separated)
            <input type="text" name="tags" placeholder="dark, cave, loop">
          </label>
          <label>Notes
            <textarea name="notes" rows="3"></textarea>
          </label>
          <label>Default volume (0–1)
            <input type="number" name="defaultVolume" min="0" max="1" step="0.05" value="0.7">
          </label>
          <label class="cat-checkbox-label">
            <input type="checkbox" name="loopByDefault" checked>
            Loop by default
          </label>
          <p class="cat-music-upload__error" hidden></p>
          <div class="cat-music-upload__actions">
            <button type="submit" class="cat-btn" value="upload">Upload</button>
            <button type="submit" class="cat-btn cat-btn--ghost" value="cancel">Cancel</button>
          </div>
        </form>`;
      document.body.appendChild(dlg);
      const form = dlg.querySelector("form");
      const fileInput = form.querySelector('[name="file"]');
      const titleInput = form.querySelector('[name="title"]');
      const errEl = form.querySelector(".cat-music-upload__error");

      fileInput.addEventListener("change", () => {
        const f = fileInput.files?.[0];
        if (f && !titleInput.value.trim()) titleInput.value = titleFromFilename(f.name);
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitter = e.submitter;
        if (submitter?.value === "cancel") {
          dlg.close();
          dlg.remove();
          resolve(null);
          return;
        }
        errEl.hidden = true;
        const file = fileInput.files?.[0];
        if (!file) {
          errEl.textContent = "Choose an MP3 file.";
          errEl.hidden = false;
          return;
        }
        const mimeOk =
          file.type === "audio/mpeg" ||
          file.type === "audio/mp3" ||
          /\.mp3$/i.test(file.name);
        if (!mimeOk) {
          errEl.textContent = "Only MP3 files are supported.";
          errEl.hidden = false;
          return;
        }
        try {
          submitter.disabled = true;
          const id = existingId || (window.CatalogueStore ? CatalogueStore.generateId("music") : `music-${Date.now()}`);
          const tags = String(form.tags.value || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          const meta = {
            id,
            title: form.title.value.trim() || titleFromFilename(file.name),
            name: form.title.value.trim() || titleFromFilename(file.name),
            kind: form.kind.value,
            category: form.category.value.trim(),
            tags,
            notes: form.notes.value.trim(),
            defaultVolume: Number(form.defaultVolume.value) || 0.7,
            loopByDefault: form.loopByDefault.checked
          };
          await CatalogueStore.upsert("music", meta);
          const durationSec = await probeDuration(file);
          const buffer = await file.arrayBuffer();
          const result = await LocalApiClient.putMusicAudio(id, buffer, {
            contentType: "audio/mpeg",
            originalFilename: file.name,
            durationSec
          });
          if (result?.entry) await CatalogueStore.upsert("music", result.entry);
          dlg.close();
          dlg.remove();
          if (typeof onComplete === "function") onComplete(result?.entry || CatalogueStore.get("music", id));
          resolve(result?.entry || CatalogueStore.get("music", id));
        } catch (err) {
          submitter.disabled = false;
          errEl.textContent = err.message || "Upload failed";
          errEl.hidden = false;
        }
      });

      dlg.addEventListener("close", () => {
        if (dlg.isConnected) dlg.remove();
      });
      dlg.showModal();
    });
  }

  return {
    playPreview,
    pausePreview,
    stopPreview,
    bindPreviewClicks,
    openUploadDialog,
    titleFromFilename,
    probeDuration
  };
})();
