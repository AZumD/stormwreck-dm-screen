/** Compact ambience strip + mixer + visible multi-track YouTube dock (IFrame API). */
window.MediaBar = (function () {
  "use strict";

  let barEl;
  let dockEl;
  let statusEl;
  let tracksEl;
  let framesEl;
  let mixerPanel;
  let mixerBtn;
  let pauseAllBtn;
  let stopAllBtn;
  let bound = false;
  let apiPromise = null;
  let resumeTimer = null;
  let mixerOpen = false;

  /**
   * @type {{
   *   key: string,
   *   id: string,
   *   title: string,
   *   host: HTMLElement,
   *   player: *,
   *   wantPlay: boolean,
   *   stopping: boolean,
   *   volume: number
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

      if (window.YT && typeof window.YT.Player === "function") resolve(window.YT);
    });

    return apiPromise;
  }

  function ensureDom() {
    barEl = document.getElementById("media-bar");
    if (!barEl) return false;
    statusEl = document.getElementById("media-bar-status") || document.getElementById("media-bar-title");
    tracksEl = document.getElementById("media-bar-tracks");
    framesEl = document.getElementById("media-bar-frames");
    dockEl = document.getElementById("media-dock");
    mixerPanel = document.getElementById("media-bar-mixer-panel");
    mixerBtn = document.getElementById("media-bar-mixer");
    pauseAllBtn = document.getElementById("media-bar-pause-all");
    stopAllBtn = document.getElementById("media-bar-stop");
    if (!framesEl && barEl) {
      framesEl = barEl.querySelector(".media-bar__frame-wrap, .media-dock__frames");
    }
    return Boolean(framesEl);
  }

  function setMixerOpen(open) {
    mixerOpen = Boolean(open);
    if (mixerPanel) mixerPanel.hidden = !mixerOpen;
    if (mixerBtn) mixerBtn.setAttribute("aria-expanded", mixerOpen ? "true" : "false");
    barEl?.classList.toggle("is-mixer-open", mixerOpen);
  }

  function playerSizeForCount(n) {
    if (n <= 1) return 200;
    if (n === 2) return 160;
    if (n === 3) return 140;
    return 120;
  }

  function syncDockLayout() {
    const n = tracks.length;
    const size = playerSizeForCount(n);
    if (dockEl) {
      dockEl.dataset.trackCount = String(n);
      try {
        dockEl.style?.setProperty?.("--media-player-size", `${size}px`);
      } catch {
        /* ignore */
      }
    }
    if (document.body?.dataset) {
      if (n) document.body.dataset.mediaTrackCount = String(n);
      else delete document.body.dataset.mediaTrackCount;
    }
    /* Resize existing YT iframes without remounting (mode changes must not reload). */
    tracks.forEach((tr) => {
      if (!tr.host) return;
      tr.host.style.width = `${size}px`;
      tr.host.style.height = `${size}px`;
      const iframe = tr.host.querySelector?.("iframe");
      if (iframe) {
        iframe.style.width = `${size}px`;
        iframe.style.height = `${size}px`;
      }
      try {
        tr.player?.setSize?.(size, size);
      } catch {
        /* ignore */
      }
    });
  }

  function showBar() {
    barEl.classList.add("is-active");
    barEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("media-bar-open");
    if (dockEl) {
      dockEl.classList.add("is-active");
      dockEl.setAttribute("aria-hidden", "false");
    }
    syncDockLayout();
  }

  function hideBar() {
    setMixerOpen(false);
    barEl.classList.remove("is-active");
    barEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("media-bar-open");
    if (dockEl) {
      dockEl.classList.remove("is-active");
      dockEl.setAttribute("aria-hidden", "true");
      delete dockEl.dataset.trackCount;
    }
    if (document.body.dataset) delete document.body.dataset.mediaTrackCount;
  }

  function updateStatus() {
    if (!statusEl) return;
    const n = tracks.length;
    if (!n) {
      statusEl.textContent = t("mediaIdleStrip", "Ambience · 0 active");
      return;
    }
    const template = t("mediaActiveCount", "Ambience · {n} active");
    statusEl.textContent = template.replace("{n}", String(n));
  }

  function trackStatusLabel(track) {
    if (track.stopping) return t("mediaStatusStopping", "Stopping");
    if (!track.wantPlay) return t("mediaStatusPaused", "Paused");
    if (!track.player) return t("mediaStatusLoading", "Loading");
    try {
      const state = track.player.getPlayerState?.();
      if (state === 3) return t("mediaStatusBuffering", "Buffering");
      if (state === 1) return t("mediaStatusPlaying", "Playing");
    } catch {
      /* ignore */
    }
    return track.wantPlay ? t("mediaStatusPlaying", "Playing") : t("mediaStatusPaused", "Paused");
  }

  function applyVolume(track) {
    try {
      track.player?.setVolume?.(track.volume);
      if (track.volume <= 0) track.player?.mute?.();
      else track.player?.unMute?.();
    } catch {
      /* ignore */
    }
  }

  function renderTrackList() {
    if (!tracksEl) {
      updateStatus();
      return;
    }
    tracksEl.innerHTML = "";
    if (!tracks.length) {
      tracksEl.innerHTML = `<p class="media-bar__mixer-empty">${t("mediaMixerEmpty", "No active tracks")}</p>`;
      updateStatus();
      return;
    }

    tracks.forEach((track) => {
      const row = document.createElement("div");
      row.className = "media-bar__track";
      row.dataset.trackKey = track.key;

      const head = document.createElement("div");
      head.className = "media-bar__track-head";

      const link = document.createElement("a");
      link.className = "media-bar__track-label";
      link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(track.id)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = track.title;
      link.title = track.title;

      const status = document.createElement("span");
      status.className = "media-bar__track-status";
      status.textContent = trackStatusLabel(track);

      head.appendChild(link);
      head.appendChild(status);

      const controls = document.createElement("div");
      controls.className = "media-bar__track-controls";

      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "media-bar__track-toggle";
      playBtn.dataset.toggleTrack = track.key;
      playBtn.textContent = track.wantPlay ? t("mediaPause", "Pause") : t("mediaPlay", "Play");

      const vol = document.createElement("input");
      vol.type = "range";
      vol.className = "media-bar__track-volume";
      vol.min = "0";
      vol.max = "100";
      vol.value = String(track.volume);
      vol.setAttribute("aria-label", `${t("mediaVolume", "Volume")} ${track.title}`);
      vol.dataset.volumeTrack = track.key;

      const stopBtn = document.createElement("button");
      stopBtn.type = "button";
      stopBtn.className = "media-bar__track-stop";
      stopBtn.dataset.stopTrack = track.key;
      stopBtn.setAttribute("aria-label", `${t("mediaStopTrack", "Stop")} ${track.title}`);
      stopBtn.textContent = "×";

      controls.appendChild(playBtn);
      controls.appendChild(vol);
      controls.appendChild(stopBtn);

      row.appendChild(head);
      row.appendChild(controls);
      tracksEl.appendChild(row);
    });
    updateStatus();
    syncDockLayout();
  }

  function clearResumeTimer() {
    if (!resumeTimer) return;
    clearInterval(resumeTimer);
    resumeTimer = null;
  }

  function armResumeTimer() {
    const playing = tracks.filter((tr) => tr.wantPlay);
    if (playing.length < 2) {
      clearResumeTimer();
      return;
    }
    if (resumeTimer) return;
    /* YouTube often pauses sibling embeds when another starts — keep re-asserting play. */
    resumeTimer = setInterval(() => {
      if (tracks.filter((tr) => tr.wantPlay).length < 2) {
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
    const size = playerSizeForCount(tracks.length);

    track.player = new YT.Player(track.host.id, {
      width: size,
      height: size,
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
          if (track.stopping) return;
          applyVolume(track);
          if (!track.wantPlay) {
            try {
              event.target.pauseVideo();
            } catch {
              /* ignore */
            }
            renderTrackList();
            return;
          }
          try {
            event.target.playVideo();
          } catch {
            /* ignore */
          }
          resumeAll();
          renderTrackList();
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
          renderTrackList();
        }
      }
    });
  }

  function play(idOrUrl, title) {
    if (!ensureDom()) return null;
    const id = extractYouTubeId(idOrUrl);
    if (!id) return null;

    window.MusicMixerUi?.pauseAll?.();

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
    const size = playerSizeForCount(tracks.length + 1);

    const host = document.createElement("div");
    host.className = "media-bar__player";
    host.id = `media-player-${key}`;
    host.style.width = `${size}px`;
    host.style.height = `${size}px`;
    framesEl.appendChild(host);

    const track = {
      key,
      id,
      title: label,
      host,
      player: null,
      wantPlay: true,
      stopping: false,
      volume: 100
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
        iframe.style.width = `${size}px`;
        iframe.style.height = `${size}px`;
        host.appendChild(iframe);
        track.player = {
          playVideo() {},
          pauseVideo() {},
          stopVideo() {
            iframe.src = "";
          },
          destroy() {
            iframe.remove();
          },
          getPlayerState() {
            return track.wantPlay ? 1 : 2;
          },
          setVolume() {},
          mute() {},
          unMute() {},
          setSize(w, h) {
            iframe.style.width = `${w}px`;
            iframe.style.height = `${h}px`;
          }
        };
        renderTrackList();
      });

    return key;
  }

  function pauseTrack(key) {
    const track = tracks.find((tr) => tr.key === key);
    if (!track) return false;
    track.wantPlay = false;
    try {
      track.player?.pauseVideo?.();
    } catch {
      /* ignore */
    }
    renderTrackList();
    armResumeTimer();
    return true;
  }

  function resumeTrack(key) {
    const track = tracks.find((tr) => tr.key === key);
    if (!track) return false;
    track.wantPlay = true;
    track.stopping = false;
    try {
      track.player?.playVideo?.();
    } catch {
      /* ignore */
    }
    renderTrackList();
    armResumeTimer();
    resumeAll();
    return true;
  }

  function toggleTrack(key) {
    const track = tracks.find((tr) => tr.key === key);
    if (!track) return false;
    return track.wantPlay ? pauseTrack(key) : resumeTrack(key);
  }

  function setTrackVolume(key, volume) {
    const track = tracks.find((tr) => tr.key === key);
    if (!track) return false;
    track.volume = Math.max(0, Math.min(100, Number(volume) || 0));
    applyVolume(track);
    return true;
  }

  function pauseAll() {
    tracks.forEach((tr) => {
      tr.wantPlay = false;
      try {
        tr.player?.pauseVideo?.();
      } catch {
        /* ignore */
      }
    });
    clearResumeTimer();
    renderTrackList();
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
    return tracks.map((tr) => ({
      key: tr.key,
      id: tr.id,
      title: tr.title,
      wantPlay: tr.wantPlay,
      volume: tr.volume
    }));
  }

  /** Layout/mode changes must not remount players — only reposition CSS. */
  function onLayoutChange() {
    syncDockLayout();
  }

  function init() {
    if (!ensureDom() || bound) return;
    bound = true;

    if (stopAllBtn) {
      stopAllBtn.textContent = t("mediaStopAll", "Stop all");
      stopAllBtn.addEventListener("click", stop);
    }
    if (pauseAllBtn) {
      pauseAllBtn.textContent = t("mediaPauseAll", "Pause all");
      pauseAllBtn.addEventListener("click", pauseAll);
    }
    if (mixerBtn) {
      mixerBtn.textContent = t("mediaMixer", "Mixer");
      mixerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setMixerOpen(!mixerOpen);
      });
    }

    barEl.addEventListener("click", (e) => {
      const stopBtn = e.target.closest("[data-stop-track]");
      if (stopBtn && barEl.contains(stopBtn)) {
        e.preventDefault();
        stopTrack(stopBtn.dataset.stopTrack);
        return;
      }
      const toggleBtn = e.target.closest("[data-toggle-track]");
      if (toggleBtn && barEl.contains(toggleBtn)) {
        e.preventDefault();
        toggleTrack(toggleBtn.dataset.toggleTrack);
      }
    });

    barEl.addEventListener("input", (e) => {
      const slider = e.target.closest("[data-volume-track]");
      if (!slider || !barEl.contains(slider)) return;
      setTrackVolume(slider.dataset.volumeTrack, slider.value);
    });

    document.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-media-play]");
      if (chip) {
        e.preventDefault();
        play(chip.dataset.mediaUrl || chip.dataset.mediaId, chip.dataset.mediaTitle);
        return;
      }
      if (mixerOpen && !e.target.closest?.("#media-bar")) {
        setMixerOpen(false);
      }
    });

    ensureYtApi().catch(() => {});
    stop();
  }

  return {
    init,
    play,
    stop,
    stopTrack,
    pauseTrack,
    resumeTrack,
    toggleTrack,
    pauseAll,
    setTrackVolume,
    getTracks,
    extractYouTubeId,
    resumeAll,
    onLayoutChange
  };
})();

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => MediaBar.init());
  } else {
    MediaBar.init();
  }
}
