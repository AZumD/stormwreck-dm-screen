/** Sticky YouTube media bar — play ambience/music from passage chips */
window.MediaBar = (function () {
  "use strict";

  let barEl;
  let titleEl;
  let frameEl;
  let openEl;
  let currentId = null;
  let bound = false;

  function extractYouTubeId(raw) {
    const input = String(raw || "").trim();
    if (!input) return "";

    if (/^[\w-]{11}$/.test(input)) return input;

    try {
      const url = new URL(input);
      if (url.hostname.includes("youtu.be")) {
        return url.pathname.replace(/^\//, "").slice(0, 11);
      }
      const v = url.searchParams.get("v");
      if (v) return v.slice(0, 11);
      const embed = url.pathname.match(/\/embed\/([\w-]{11})/);
      if (embed) return embed[1];
      const shorts = url.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shorts) return shorts[1];
    } catch {
      const loose = input.match(/([\w-]{11})/);
      if (loose) return loose[1];
    }
    return "";
  }

  function ensureDom() {
    barEl = document.getElementById("media-bar");
    if (!barEl) return false;
    titleEl = document.getElementById("media-bar-title");
    frameEl = document.getElementById("media-bar-frame");
    openEl = document.getElementById("media-bar-open");
    return true;
  }

  function play(idOrUrl, title) {
    if (!ensureDom()) return;
    const id = extractYouTubeId(idOrUrl);
    if (!id) return;

    currentId = id;
    const label = title || window.I18N?.mediaPlaying || "Playing ambience";
    if (titleEl) titleEl.textContent = label;
    if (openEl) {
      openEl.href = `https://www.youtube.com/watch?v=${id}`;
      openEl.classList.remove("hidden");
    }

    // nocookie + modest branding; user gesture already happened on chip click
    frameEl.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    barEl.classList.add("is-active");
    barEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("media-bar-open");
  }

  function stop() {
    if (!ensureDom()) return;
    currentId = null;
    if (frameEl) frameEl.src = "";
    if (titleEl) titleEl.textContent = window.I18N?.mediaIdle || "No track playing";
    if (openEl) {
      openEl.href = "#";
      openEl.classList.add("hidden");
    }
    barEl.classList.remove("is-active");
    barEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("media-bar-open");
  }

  function init() {
    if (!ensureDom() || bound) return;
    bound = true;

    document.getElementById("media-bar-stop")?.addEventListener("click", stop);

    document.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-media-play]");
      if (!chip) return;
      e.preventDefault();
      play(chip.dataset.mediaId || chip.dataset.mediaUrl, chip.dataset.mediaTitle);
    });

    stop();
  }

  return { init, play, stop, extractYouTubeId };
})();

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => MediaBar.init());
  } else {
    MediaBar.init();
  }
}
