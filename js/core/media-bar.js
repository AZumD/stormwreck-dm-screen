/** Sticky YouTube media bar — layered ambience (true multi-track via IFrame API). */
window.MediaBar = (function () {
  "use strict";

  let barEl;
  let statusEl;
  let tracksEl;
  let framesEl;
  let stopAllBtn;
  let bound = false;
  let apiPromise = null;
  let resumeTimer = null;

  /**
   * @type {{
   *   key: string,
   *   id: string,
   *   title: string,
   *   host: HTMLElement,
   *   player: *,
   *   wantPlay: boolean,
   *   stopping: boolean
   * }[]}
   */
  let tracks = [];

  function t(key, fallback) {
    return window.I18N?.[key] || fallback;
  }

  function extractYouTubeId(raw) {
    const input = String(raw || "").trim();
    if (!input) return "";

    if (/^[\w-]{11}$/.test(input)) return input;

    try {
      const url = new URL(input);
      const host = url.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        return url.pathname.replace(/^\//, "").slice(0, 11);
      }
      if (
        host === "youtube.com" ||
        host === "m.youtube.com" ||
        host === "music.youtube.com" ||
        host === "youtube-nocookie.com"
      ) {
        const v = url.searchParams.get("v");
        if (v) return v.slice(0, 11);
        const embed = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
        if (embed) return embed[1];
      }
    } catch {
      const loose = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
      if (loose) return loose[1];
      if (/^[\w-]{11}$/.test(input)) return input;
    }
    return "";
  }

  function ensureYtApi() {
    if (window.YT && typeof window.YT.Player === "function") {
      return Promise.resolve(window.YT);
    }
    if (apiPromise) return apiPromise;

    apiPromise = new Promise((resolve, reject) => {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        try {
          if (typeof prevReady === "function") prevReady();
        } catch {
          /* ignore */
        }
        if (window.YT && typeof window.YT.Player === "function") resolve(window.YT);
        else reject(new Error("YouTube IFrame API missing after ready"));
      };

      if (!document.querySelector("script[data-yt-iframe-api]")) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.dataset.ytIframeApi = "1";
        script.onerror = () => reject(new Error("Failed to load YouTube IFrame API"));
        (document.head || document.documentElement).appendChild(script);
      }

      /* Script may already be present and ready */
      if (window.YT && typeof window.YT.Player === "function") resolve(window.YT);
    });

    return apiPromise;
  }

  function ensureDom() {
    barEl = document.getElementById("media-bar");
    if (!barEl) return false;
    statusEl = document.getElementById("media-bar-status") || document.getElementById("media-bar-title");
    tracksEl = document.getElementById("media-bar-tracks");
    framesEl = document.getElementById("media-bar-frames") || barEl.querySelector(".media-bar__frame-wrap");
    stopAllBtn = document.getElementById("media-bar-stop");
    return Boolean(framesEl);
  }

  function showBar() {
    barEl.classList.add("is-active");
    barEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("media-bar-open");
    if (document.body.dataset) document.body.dataset.mediaTrackCount = String(tracks.length);
  }

  function hideBar() {
    barEl.classList.remove("is-active");
    barEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("media-bar-open");
    if (document.body.dataset) delete document.body.dataset.mediaTrackCount;
  }

  function updateStatus() {
    if (!statusEl) return;
    if (!tracks.length) {
      statusEl.textContent = t("mediaIdle", "No track playing");
      return;
    }
    if (tracks.length === 1) {
      statusEl.textContent = tracks[0].title;
      return;
    }
    const template = t("mediaPlayingCount", "{n} tracks playing");
    statusEl.textContent = template.replace("{n}", String(tracks.length));
  }

  function renderTrackList() {
    if (!tracksEl) {
      updateStatus();
      return;
    }
    tracksEl.innerHTML = "";
    if (!tracks.length) {
      tracksEl.hidden = true;
      updateStatus();
      return;
    }
    tracksEl.hidden = false;
    tracks.forEach((track) => {
      const row = document.createElement("div");
      row.className = "media-bar__track";
      row.dataset.trackKey = track.key;

      const link = document.createElement("a");
      link.className = "media-bar__track-label";
      link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(track.id)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = track.title;
      link.title = track.title;

      const stopBtn = document.createElement("button");
      stopBtn.type = "button";
      stopBtn.className = "media-bar__track-stop";
      stopBtn.dataset.stopTrack = track.key;
      stopBtn.setAttribute("aria-label", `${t("mediaStopTrack", "Stop")} ${track.title}`);
      stopBtn.textContent = "×";

      row.appendChild(link);
      row.appendChild(stopBtn);
      tracksEl.appendChild(row);
    });
    updateStatus();
  }

  function clearResumeTimer() {
    if (!resumeTimer) return;
    clearInterval(resumeTimer);
    resumeTimer = null;
  }

  function armResumeTimer() {
    if (tracks.length < 2) {
      clearResumeTimer();
      return;
    }
    if (resumeTimer) return;
    /* YouTube often pauses sibling embeds when another starts — keep re-asserting play. */
    resumeTimer = setInterval(() => {
      if (tracks.length < 2) {
        clearResumeTimer();
        return;
      }
      resumeAll();
    }, 1200);
  }

  function resumeAll(skipKey) {
    tracks.forEach((tr) => {
      if (!tr.wantPlay || tr.stopping || !tr.player || typeof tr.player.playVideo !== "function") return;
      if (skipKey && tr.key === skipKey) return;
      try {
        const state = typeof tr.player.getPlayerState === "function" ? tr.player.getPlayerState() : null;
        /* 1 playing, 3 buffering — leave alone */
        if (state === 1 || state === 3) return;
        tr.player.playVideo();
      } catch {
        /* player may be mid-destroy */
      }
    });
  }

  function destroyTrackPlayer(track) {
    track.wantPlay = false;
    track.stopping = true;
    try {
      if (track.player) {
        if (typeof track.player.stopVideo === "function") track.player.stopVideo();
        if (typeof track.player.destroy === "function") track.player.destroy();
      }
    } catch {
      /* ignore */
    }
    track.player = null;
    if (track.host) {
      track.host.remove();
      track.host = null;
    }
  }

  function mountPlayer(track, YT) {
    if (!tracks.some((tr) => tr.key === track.key) || track.stopping) return;

    track.player = new YT.Player(track.host.id, {
      width: 200,
      height: 200,
      videoId: track.id,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        controls: 1,
        fs: 0,
        disablekb: 1
      },
      events: {
        onReady(event) {
          if (!track.wantPlay || track.stopping) return;
          try {
            event.target.playVideo();
          } catch {
            /* ignore */
          }
          resumeAll();
        },
        onStateChange(event) {
          if (!track.wantPlay || track.stopping) return;
          const PAUSED = YT.PlayerState?.PAUSED ?? 2;
          const CUED = YT.PlayerState?.CUED ?? 5;
          const ENDED = YT.PlayerState?.ENDED ?? 0;
          const PLAYING = YT.PlayerState?.PLAYING ?? 1;

          if (event.data === PAUSED || event.data === CUED) {
            try {
              event.target.playVideo();
            } catch {
              /* ignore */
            }
          }
          if (event.data === PLAYING) {
            /* Starting one track pauses others — immediately wake siblings */
            resumeAll(track.key);
          }
          if (event.data === ENDED && track.wantPlay) {
            try {
              event.target.seekTo(0, true);
              event.target.playVideo();
            } catch {
              /* ignore */
            }
          }
        }
      }
    });
  }

  function play(idOrUrl, title) {
    if (!ensureDom()) return null;
    const id = extractYouTubeId(idOrUrl);
    if (!id) return null;

    const existing = tracks.find((tr) => tr.id === id);
    if (existing) {
      existing.wantPlay = true;
      existing.stopping = false;
      try {
        existing.player?.playVideo?.();
      } catch {
        /* ignore */
      }
      showBar();
      renderTrackList();
      armResumeTimer();
      resumeAll();
      return existing.key;
    }

    const label =
      (title || t("mediaPlaying", "Playing ambience")).trim() || t("mediaPlaying", "Playing ambience");
    const key = `yt-${id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const host = document.createElement("div");
    host.className = "media-bar__player";
    host.id = `media-player-${key}`;
    framesEl.appendChild(host);

    const track = {
      key,
      id,
      title: label,
      host,
      player: null,
      wantPlay: true,
      stopping: false
    };
    tracks.push(track);
    renderTrackList();
    showBar();
    armResumeTimer();

    ensureYtApi()
      .then((YT) => mountPlayer(track, YT))
      .catch((err) => {
        console.warn("MediaBar: YouTube API unavailable, falling back to iframe", err);
        if (!tracks.some((tr) => tr.key === key) || track.stopping) return;
        const iframe = document.createElement("iframe");
        iframe.className = "media-bar__frame";
        iframe.title = label;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
        host.appendChild(iframe);
        track.player = {
          playVideo() {},
          stopVideo() {
            iframe.src = "";
          },
          destroy() {
            iframe.remove();
          },
          getPlayerState() {
            return 1;
          }
        };
      });

    return key;
  }

  function stopTrack(key) {
    if (!ensureDom()) return false;
    const idx = tracks.findIndex((tr) => tr.key === key);
    if (idx < 0) return false;
    const [removed] = tracks.splice(idx, 1);
    destroyTrackPlayer(removed);
    renderTrackList();
    armResumeTimer();
    if (!tracks.length) hideBar();
    else {
      showBar();
      resumeAll();
    }
    return true;
  }

  function stop() {
    if (!ensureDom()) return;
    clearResumeTimer();
    const dying = tracks.splice(0, tracks.length);
    dying.forEach(destroyTrackPlayer);
    renderTrackList();
    hideBar();
  }

  function getTracks() {
    return tracks.map((tr) => ({ key: tr.key, id: tr.id, title: tr.title }));
  }

  function init() {
    if (!ensureDom() || bound) return;
    bound = true;

    if (stopAllBtn) {
      stopAllBtn.textContent = t("mediaStopAll", "Stop all");
      stopAllBtn.addEventListener("click", stop);
    }

    barEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-stop-track]");
      if (!btn || !barEl.contains(btn)) return;
      e.preventDefault();
      stopTrack(btn.dataset.stopTrack);
    });

    document.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-media-play]");
      if (!chip) return;
      e.preventDefault();
      play(chip.dataset.mediaUrl || chip.dataset.mediaId, chip.dataset.mediaTitle);
    });

    /* Warm the API so the second chip isn’t racing the script download */
    ensureYtApi().catch(() => {});

    stop();
  }

  return { init, play, stop, stopTrack, getTracks, extractYouTubeId, resumeAll };
})();

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => MediaBar.init());
  } else {
    MediaBar.init();
  }
}
