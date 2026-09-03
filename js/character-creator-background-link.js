(function () {
  "use strict";

  const api = window.PlayerApiClient;
  const compendium = window.StormwreckCharacterCreatorCompendium;
  if (!api || !compendium || typeof compendium.ref !== "function") return;

  function linkBackgroundPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const raw = String(payload.background || "").trim();
    if (!raw || /^@background:[^|\s]+\|/.test(raw)) return payload;
    return {
      ...payload,
      background: compendium.ref("background", raw)
    };
  }

  function wrapCreate(name, payloadIndex) {
    const original = api[name];
    if (typeof original !== "function") return;
    api[name] = function (...args) {
      args[payloadIndex] = linkBackgroundPayload(args[payloadIndex]);
      return original.apply(api, args);
    };
  }

  // The v3 creator already sends canonical refs for class/race/skills/feats/spells.
  // Normalize its background at the API seam so both standalone and campaign
  // character creation persist @background:... refs without changing generic
  // Player Companion character creation behavior.
  wrapCreate("createStandaloneCharacter", 0);
  wrapCreate("createCharacter", 1);

  window.StormwreckCharacterCreatorBackgroundLink = {
    linkBackgroundPayload
  };
})();
