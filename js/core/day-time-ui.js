/**
 * Compact campaign tenday + time-of-day control in the main toolbar.
 * Trigger shows "Day N · HH:MM"; popover holds sliders + presets.
 * Persists via CampaignState.clock { day: 1–10, minute: 0–1439 }.
 */
window.DayTimeUI = (function () {
  "use strict";

  const PRESETS = [
    { id: "morning", label: "Morning", minute: 8 * 60 },
    { id: "noon", label: "Noon", minute: 12 * 60 },
    { id: "evening", label: "Evening", minute: 18 * 60 },
    { id: "night", label: "Night", minute: 22 * 60 }
  ];

  let root = null;
  let trigger = null;
  let triggerLabel = null;
  let popover = null;
  let dayInput = null;
  let timeInput = null;
  let dayLabel = null;
  let timeLabel = null;
  let saveTimer = null;
  let open = false;
  let onDocPointer = null;
  let onDocKey = null;

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

  function formatSummary(clock) {
    return `Day ${clock.day} · ${formatTime(clock.minute)}`;
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
    if (triggerLabel) triggerLabel.textContent = formatSummary(clock);
    if (trigger) trigger.setAttribute("aria-label", `Campaign time ${formatSummary(clock)}`);
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
    syncPresetActive(clock.minute);
  }

  function syncPresetActive(minute) {
    if (!popover) return;
    const m = clampMinute(minute);
    popover.querySelectorAll("[data-time-preset]").forEach((btn) => {
      const presetMin = clampMinute(btn.dataset.minute);
      btn.classList.toggle("is-active", presetMin === m);
      btn.setAttribute("aria-pressed", presetMin === m ? "true" : "false");
    });
  }

  function refresh() {
    syncLabels(readState());
  }

  function setOpen(next) {
    open = !!next;
    if (popover) popover.hidden = !open;
    if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
    root?.classList.toggle("is-open", open);
    if (open) {
      attachDismiss();
    } else {
      detachDismiss();
    }
  }

  function toggle() {
    setOpen(!open);
  }

  function attachDismiss() {
    detachDismiss();
    onDocPointer = (e) => {
      if (!root || root.contains(e.target)) return;
      setOpen(false);
    };
    onDocKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger?.focus?.();
      }
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    document.addEventListener("keydown", onDocKey, true);
  }

  function detachDismiss() {
    if (onDocPointer) {
      document.removeEventListener("pointerdown", onDocPointer, true);
      onDocPointer = null;
    }
    if (onDocKey) {
      document.removeEventListener("keydown", onDocKey, true);
      onDocKey = null;
    }
  }

  function applyPreset(minute) {
    const day = clampDay(dayInput?.value || readState().day);
    const next = { day, minute: clampMinute(minute) };
    syncLabels(next);
    writeState({ minute: next.minute }, true);
  }

  function bind() {
    trigger?.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });

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

    popover?.querySelectorAll("[data-time-preset]").forEach((btn) => {
      btn.addEventListener("click", () => applyPreset(btn.dataset.minute));
    });
  }

  function init(options = {}) {
    root = options.root || document.getElementById("campaign-time") || document.getElementById("day-time-bar");
    if (!root) return;

    trigger = root.querySelector("#campaign-time-trigger") || document.getElementById("campaign-time-trigger");
    triggerLabel = root.querySelector("#campaign-time-label") || document.getElementById("campaign-time-label");
    popover = root.querySelector("#campaign-time-popover") || document.getElementById("campaign-time-popover");
    dayInput = root.querySelector("#day-time-day") || document.getElementById("day-time-day");
    timeInput = root.querySelector("#day-time-minute") || document.getElementById("day-time-minute");
    dayLabel = root.querySelector("#day-time-day-label") || document.getElementById("day-time-day-label");
    timeLabel = root.querySelector("#day-time-clock-label") || document.getElementById("day-time-clock-label");

    bind();
    setOpen(false);
    refresh();
  }

  return { init, refresh, formatTime, formatSummary, PRESETS, close: () => setOpen(false), openPopover: () => { refresh(); setOpen(true); } };
})();
