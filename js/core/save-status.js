/**
 * Subtle global save feedback: Saving… / Saved / Save failed
 */
window.SaveStatus = (function () {
  "use strict";

  let el = null;
  let hideTimer = null;
  let pending = 0;

  function ensureEl() {
    if (el) return el;
    el = document.getElementById("save-status");
    if (!el) {
      el = document.createElement("div");
      el.id = "save-status";
      el.className = "save-status";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  }

  function show(text, state) {
    const node = ensureEl();
    node.textContent = text;
    node.dataset.state = state || "";
    node.classList.add("is-visible");
  }

  function saving() {
    pending += 1;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    show("Saving…", "saving");
  }

  function saved() {
    pending = Math.max(0, pending - 1);
    if (pending > 0) {
      show("Saving…", "saving");
      return;
    }
    show("Saved", "saved");
    hideTimer = setTimeout(() => {
      ensureEl().classList.remove("is-visible");
    }, 1400);
  }

  function failed(err) {
    pending = Math.max(0, pending - 1);
    const msg = err && err.message ? err.message : "Save failed";
    show(`Save failed: ${msg}`, "error");
  }

  return { saving, saved, failed, show };
})();
