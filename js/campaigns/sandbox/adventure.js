/**
 * Blank adventure shell for user-created campaigns.
 * Meta comes from CampaignRegistry + ?id= query param.
 */
(function () {
  "use strict";

  function readId() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return String(params.get("id") || "").trim();
    } catch {
      return "";
    }
  }

  const id = readId();
  const meta = (id && window.CampaignRegistry?.get?.(id)) || null;

  if (!id || !meta) {
    document.title = "Campaign not found — DM Library";
    window.ADVENTURE = {
      meta: { id: "missing-campaign", title: "Campaign not found", level: "" },
      chapters: [{ id: "main", title: "Scenes" }],
      sections: [
        {
          id: "missing",
          chapter: "main",
          title: "Campaign not found",
          content:
            "<p>This campaign does not exist in your local library. Return to the <a href=\"/dm/\">DM Library</a> and create one.</p>"
        }
      ]
    };
    window.MAPS = {};
    return;
  }

  document.title = `${meta.title} — DM Screen`;
  document.body?.setAttribute("data-campaign-id", meta.id);

  window.ADVENTURE = {
    meta: {
      id: meta.id,
      title: meta.title,
      level: meta.level || ""
    },
    chapters: [{ id: "main", title: "Scenes" }],
    sections: [
      {
        id: "opening",
        chapter: "main",
        title: "Opening",
        content: `
          <p>This is your sandbox campaign. Turn on <b>Edit mode</b> to rename this scene, write prose, and add more scenes.</p>
          <p>Use catalogue links like <code>@npc:id|Name</code> once entries exist in your catalogues.</p>
        `
      }
    ]
  };

  window.MAPS = {};
})();
