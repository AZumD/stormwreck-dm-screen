/**
 * Thin legacy catalogue pages → unified Compendium.
 * Usage: <script src="…/legacy-redirect.js" data-type="npc"></script>
 */
(function () {
  "use strict";
  const script = document.currentScript;
  const type = script?.getAttribute("data-type")?.trim();
  if (!type) return;
  const q = new URLSearchParams(window.location.search);
  let target = `/dm/compendium/?type=${encodeURIComponent(type)}`;
  const id = q.get("id");
  if (id) target += `&id=${encodeURIComponent(id)}`;
  window.location.replace(target);
})();
