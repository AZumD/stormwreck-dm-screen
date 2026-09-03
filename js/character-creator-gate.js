(function () {
  "use strict";

  const api = window.PlayerApiClient;

  function reveal() {
    document.documentElement.classList.remove("creator-auth-pending");
  }

  function appendScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadLanguage() {
    if (!window.I18N) await appendScript("/js/i18n/en.js?v=20260904i1");
    if (!window.I18N_SV) await appendScript("/js/i18n/sv.js?v=20260904i1");
    await appendScript("/js/i18n/sv-creator.js?v=20260904i1");
    if (!window.AppI18n) await appendScript("/js/i18n/language.js?v=20260904i1");
    if (!window.StormwreckDomLocalization?.installed) {
      await appendScript("/js/i18n/dom-localization.js?v=20260904i1");
    }
  }

  async function loadCreator() {
    try {
      await loadLanguage();
      await appendScript("/js/character-creator-expanded-data.js?v=20260903c4");
      await appendScript("/js/character-creator-compendium-bindings.js?v=20260903c4");
      await appendScript("/js/character-creator-background-link.js?v=20260903c5");
      await appendScript("/js/character-creator-v3.js?v=20260903c4");
    } finally {
      reveal();
    }
  }

  if (!api || typeof api.bootstrap !== "function") {
    location.replace("/player/");
    return;
  }

  api.bootstrap()
    .then(loadCreator)
    .catch((err) => {
      if (Number(err?.status) === 401) {
        location.replace("/player/");
        return;
      }

      // Local/offline development can still open the builder; persistence will
      // surface the real API error on the review step.
      loadCreator();
    });
})();