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

  async function loadCreator() {
    try {
      await appendScript("/js/character-creator-expanded-data.js?v=20260903c3");
      await appendScript("/js/character-creator-v2.js?v=20260903c3");
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
