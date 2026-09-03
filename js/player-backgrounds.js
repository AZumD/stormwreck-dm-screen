(function () {
  "use strict";

  const remembered = new Map();
  let apiHooked = false;
  let backgroundLibrarySelected = false;
  let decorateQueued = false;

  function displayRefLabel(raw) {
    const text = String(raw || "").trim();
    if (!text) return "";
    const match = text.match(/^@[\w-]+:[^|\s]+\|(.+)$/);
    return match ? match[1].trim() || text : text;
  }

  function rememberCharacter(character) {
    if (!character || !character.id) return;
    remembered.set(String(character.id), character);
  }

  function rememberResult(result) {
    if (!result || typeof result !== "object") return result;
    if (result.character) rememberCharacter(result.character);
    const lists = [result.characters, result.party];
    lists.forEach((list) => {
      if (Array.isArray(list)) list.forEach(rememberCharacter);
    });
    queueDecorate();
    return result;
  }

  function hookApiMethod(api, name) {
    const original = api[name];
    if (typeof original !== "function" || original.__backgroundHook) return;
    const wrapped = function (...args) {
      const result = original.apply(api, args);
      if (!result || typeof result.then !== "function") return rememberResult(result);
      return result.then(rememberResult);
    };
    Object.defineProperty(wrapped, "__backgroundHook", { value: true });
    api[name] = wrapped;
  }

  function installApiHooks() {
    if (apiHooked) return true;
    const api = window.PlayerApiClient;
    if (!api) return false;
    [
      "getCharacter",
      "myCharacters",
      "patchSheet",
      "patchSheetDirect",
      "libraryAttach",
      "createCharacter",
      "createStandaloneCharacter"
    ].forEach((name) => hookApiMethod(api, name));
    apiHooked = true;
    return true;
  }

  function characterForSheet(sheetRoot) {
    const name = sheetRoot.querySelector(".sheet-name")?.textContent?.trim();
    if (!name) return null;
    const matches = Array.from(remembered.values()).filter((character) => String(character.name || "").trim() === name);
    if (matches.length === 1) return matches[0];

    const characterView = document.getElementById("view-character-shell");
    if (characterView && !characterView.hidden) {
      const title = document.getElementById("character-shell-title")?.textContent?.trim();
      const exact = matches.find((character) => String(character.name || "").trim() === title);
      if (exact) return exact;
    }
    return matches[0] || null;
  }

  function annotateSheetBackgrounds() {
    document.querySelectorAll(".vitals").forEach((vitals) => {
      const character = characterForSheet(vitals);
      const background = displayRefLabel(character?.background);
      const prior = vitals.querySelector(".player-background-meta");
      if (!background) {
        prior?.remove();
        return;
      }
      if (prior) {
        prior.textContent = `Background · ${background}`;
        return;
      }
      const meta = vitals.querySelector(".vitals-meta");
      if (!meta) return;
      const line = document.createElement("p");
      line.className = "vitals-meta player-background-meta";
      line.textContent = `Background · ${background}`;
      meta.insertAdjacentElement("afterend", line);
    });
  }

  function ensureBackgroundLibraryChip() {
    const existing = document.querySelector('[data-library-type="background"]');
    if (existing) {
      existing.classList.toggle("is-active", backgroundLibrarySelected);
      return;
    }

    const raceChip = document.querySelector('[data-library-type="race"]');
    const anchor = raceChip || document.querySelector('[data-library-type="class"]');
    if (!anchor?.parentElement) return;

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `chip${backgroundLibrarySelected ? " is-active" : ""}`;
    chip.dataset.libraryType = "background";
    chip.textContent = "background";
    anchor.insertAdjacentElement("afterend", chip);
  }

  function renameBackgroundActions() {
    document.querySelectorAll('[data-library-attach="background"]').forEach((button) => {
      button.textContent = "Set background";
    });
  }

  function humanizeBackgroundEditField() {
    const dialog = document.getElementById("sheet-dialog");
    if (!dialog?.open) return;
    const input = dialog.querySelector('[name="background"]');
    if (!input) return;

    const raw = String(input.value || "").trim();
    if (!raw.startsWith("@background:")) return;
    if (input.dataset.backgroundRef === raw) return;

    input.dataset.backgroundRef = raw;
    input.dataset.backgroundLabel = displayRefLabel(raw);
    input.value = input.dataset.backgroundLabel;
  }

  function decorate() {
    decorateQueued = false;
    installApiHooks();
    ensureBackgroundLibraryChip();
    renameBackgroundActions();
    annotateSheetBackgrounds();
    humanizeBackgroundEditField();
  }

  function queueDecorate() {
    if (decorateQueued) return;
    decorateQueued = true;
    requestAnimationFrame(decorate);
  }

  document.addEventListener(
    "click",
    (event) => {
      const libraryType = event.target.closest?.("[data-library-type]");
      if (libraryType) {
        backgroundLibrarySelected = libraryType.getAttribute("data-library-type") === "background";
        queueDecorate();
      }
    },
    true
  );

  document.addEventListener(
    "submit",
    (event) => {
      if (event.target?.id !== "sheet-form") return;
      const input = event.target.querySelector('[name="background"]');
      if (!input?.dataset.backgroundRef) return;
      if (String(input.value || "").trim() === String(input.dataset.backgroundLabel || "").trim()) {
        input.value = input.dataset.backgroundRef;
      }
      delete input.dataset.backgroundRef;
      delete input.dataset.backgroundLabel;
    },
    true
  );

  const observer = new MutationObserver(queueDecorate);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "hidden"] });

  installApiHooks();
  queueDecorate();

  window.PlayerBackgrounds = {
    displayRefLabel,
    rememberCharacter,
    decorate,
    installApiHooks
  };
})();
