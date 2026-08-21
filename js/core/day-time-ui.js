/**
 * Compact tenday + time-of-day tracker in the campaign top chrome.
 * Persists via CampaignState.clock { day: 1–10, minute: 0–1439 }.
 */
window.DayTimeUI = (function () {
  "use strict";

  let root = null;
  let dayInput = null;
  let timeInput = null;
  let dayLabel = null;
  let timeLabel = null;
  let saveTimer = null;

  function clampMinute(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(1439, Math.round(v)));
  }

  function clampDay(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return 1;
    return Math.max(1, Math.min(10, Math.round(v)));
  }

  function formatTime(minute) {
    if (window.CampaignState?.formatClockTime) return CampaignState.formatClockTime(minute);
    const m = clampMinute(minute);
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  function readState() {
    if (window.CampaignState?.getClock) return CampaignState.getClock();
    return { day: 1, minute: 8 * 60 };
  }

  function writeState(patch, immediate) {
    if (!window.CampaignState?.setClock) return;
    clearTimeout(saveTimer);
    const apply = () => CampaignState.setClock(patch);
    if (immediate) apply();
    else saveTimer = setTimeout(apply, 180);
  }

  function syncLabels(clock) {
    if (dayLabel) dayLabel.textContent = String(clock.day);
    if (timeLabel) timeLabel.textContent = formatTime(clock.minute);
    if (dayInput) dayInput.value = String(clock.day);
    if (timeInput) {
      timeInput.value = String(clock.minute);
      const pct = (clock.minute / 1439) * 100;
      timeInput.style.setProperty("--day-time-progress", `${pct}%`);
    }
    if (root) {
      root.dataset.day = String(clock.day);
      root.dataset.time = formatTime(clock.minute);
    }
  }

  function refresh() {
    syncLabels(readState());
  }

  function bind() {
    dayInput?.addEventListener("input", () => {
      const day = clampDay(dayInput.value);
      syncLabels({ day, minute: clampMinute(timeInput?.value) });
      writeState({ day }, true);
    });

    timeInput?.addEventListener("input", () => {
      const minute = clampMinute(timeInput.value);
      const day = clampDay(dayInput?.value);
      syncLabels({ day, minute });
      writeState({ minute }, false);
    });

    timeInput?.addEventListener("change", () => {
      writeState({ minute: clampMinute(timeInput.value) }, true);
    });
  }

  function init(options = {}) {
    root = options.root || document.getElementById("day-time-bar");
    if (!root) return;

    dayInput = root.querySelector("#day-time-day") || document.getElementById("day-time-day");
    timeInput = root.querySelector("#day-time-minute") || document.getElementById("day-time-minute");
    dayLabel = root.querySelector("#day-time-day-label") || document.getElementById("day-time-day-label");
    timeLabel = root.querySelector("#day-time-clock-label") || document.getElementById("day-time-clock-label");

    bind();
    refresh();
  }

  return { init, refresh, formatTime };
})();
