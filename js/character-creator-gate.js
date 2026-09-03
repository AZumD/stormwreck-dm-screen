(function () {
  "use strict";

  const api = window.PlayerApiClient;

  function reveal() {
    document.documentElement.classList.remove("creator-auth-pending");
  }

  function loadCreator() {
    reveal();
    const script = document.createElement("script");
    script.src = "/js/character-creator.js?v=20260903c2";
    script.async = false;
    document.body.appendChild(script);
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
