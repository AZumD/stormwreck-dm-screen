(function () {
  "use strict";

  if (window.StormwreckPlayerLocalization?.installed) return;
  if (!window.AppI18n?.isSwedish?.()) return;
  if (!document.body?.classList.contains("player-body")) return;

  const EXACT = new Map([
    ["My character", "Min rollperson"],
    ["My characters", "Mina rollpersoner"],
    ["No characters yet.", "Inga rollpersoner ännu."],
    ["Open character", "Öppna rollperson"],
    ["No class resources yet (rage, ki, channel…).", "Inga klassresurser ännu (rage, ki, channel…)."],
    ["Save resources", "Spara resurser"],
    ["Successes", "Lyckade"],
    ["Failures", "Misslyckade"],
    ["Reset", "Nollställ"],
    ["max / used", "max / använda"],
    ["Save slots", "Spara spell slots"],
    ["No character selected.", "Ingen rollperson vald."],
    ["Nothing here yet.", "Inget här ännu."],
    ["No coins tracked.", "Ingen valuta registrerad."],
    ["Edit note", "Redigera anteckning"],
    ["New note", "Ny anteckning"],
    ["Empty note.", "Tom anteckning."],
    ["All notes", "Alla anteckningar"],
    ["Campaign only", "Endast kampanj"],
    ["Clear tag", "Rensa tagg"],
    ["Untitled", "Namnlös"],
    ["No matching notes.", "Inga matchande anteckningar."],
    ["Select a note.", "Välj en anteckning."],
    ["No notes yet.", "Inga anteckningar ännu."],
    ["Search", "Sök"],
    ["Character", "Rollperson"],
    ["Searching…", "Söker…"],
    ["No entries match.", "Inga poster matchar."],
    ["Load more", "Ladda fler"],
    ["No description available.", "Ingen beskrivning tillgänglig."],
    ["Add to inventory", "Lägg till i inventory"],
    ["Add spell", "Lägg till besvärjelse"],
    ["Add skill", "Lägg till färdighet"],
    ["Add feature", "Lägg till förmåga"],
    ["Set race", "Ange släkte"],
    ["Set class", "Ange klass"],
    ["Add item", "Lägg till föremål"],
    ["Add condition", "Lägg till tillstånd"],
    ["Available", "Tillgänglig"],
    ["Maybe", "Kanske"],
    ["Unavailable", "Inte tillgänglig"],
    ["No response", "Inget svar"],
    ["Going", "Kommer"],
    ["Can't make it", "Kan inte"],
    ["Respond", "Svara"],
    ["View schedule", "Visa schema"],
    ["Next session", "Nästa spelmöte"],
    ["Next event", "Nästa händelse"],
    ["Loading…", "Laddar…"],
    ["Could not load schedule", "Kunde inte ladda schemat"],
    ["No upcoming session scheduled", "Inget kommande spelmöte schemalagt"],
    ["No upcoming sessions.", "Inga kommande spelmöten."],
    ["Upcoming", "Kommande"],
    ["GLOBAL", "GLOBALT"],
    ["Event", "Händelse"],
    ["No RSVP", "Inget svar"],
    ["Edit", "Redigera"],
    ["Delete", "Ta bort"],
    ["Reply", "Svara"],
    ["No posts yet.\nStart the first conversation.", "Inga inlägg ännu.\nStarta den första konversationen."],
    ["No events today.", "Inga händelser idag."],
    ["Clear RSVP", "Rensa svar"],
    ["Cancel session", "Ställ in spelmötet"],
    ["New post", "Nytt inlägg"],
    ["Session", "Spelmöte"],
    ["Board", "Anslagstavla"],
    ["Schedule", "Schema"],
    ["Campaign", "Kampanj"]
  ]);

  const PREFIX = [
    ["School:", "Magiskola:"],
    ["Level:", "Nivå:"],
    ["Category:", "Kategori:"],
    ["Rarity:", "Sällsynthet:"],
    ["Item type:", "Föremålstyp:"],
    ["Size:", "Storlek:"],
    ["Type:", "Typ:"],
    ["Casting time:", "Kasttid:"],
    ["Range:", "Räckvidd:"],
    ["Components:", "Komponenter:"],
    ["Duration:", "Varaktighet:"],
    ["Value:", "Värde:"],
    ["Weight:", "Vikt:"],
    ["Tags:", "Taggar:"]
  ];

  const LEADING_LABELS = new Map([
    ["Status", "Status"],
    ["Available from", "Tillgänglig från"],
    ["Available until", "Tillgänglig till"],
    ["Note", "Anteckning"],
    ["Title", "Titel"],
    ["Date", "Datum"],
    ["Start", "Start"],
    ["End", "Slut"],
    ["Location", "Plats"],
    ["Notes", "Anteckningar"],
    ["Message", "Meddelande"],
    ["Campaign", "Kampanj"],
    ["Name", "Namn"],
    ["Character", "Rollperson"]
  ]);

  function setText(el, value) {
    const next = String(value ?? "");
    if (el.textContent !== next) el.textContent = next;
  }

  function translateExactElement(el) {
    if (!el || el.children?.length) return;
    const current = String(el.textContent || "").trim();
    const next = EXACT.get(current);
    if (next) setText(el, next);
  }

  function translateLeadingLabel(label) {
    if (!label) return;
    const node = [...label.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    if (!node) return;
    const current = node.textContent.trim();
    const next = LEADING_LABELS.get(current);
    if (!next) return;
    const suffix = /\s$/.test(node.textContent) ? " " : "";
    const value = next + suffix;
    if (node.textContent !== value) node.textContent = value;
  }

  function translateMeta(el) {
    if (!el || el.children?.length) return;
    let value = String(el.textContent || "");
    if (!value.trim()) return;

    value = value.replace(/^Level\s+(\d+)/i, "Nivå $1");
    value = value.replace(/\b(\d+) campaign\(s\)/gi, "$1 kampanj(er)");
    value = value.replace(/^Created\s+(.+?)\s+·\s+Updated\s+(.+?)\s+·\s+character$/i, "Skapad $1 · Uppdaterad $2 · rollperson");
    value = value.replace(/^Created\s+(.+?)\s+·\s+Updated\s+(.+?)\s+·\s+campaign$/i, "Skapad $1 · Uppdaterad $2 · kampanj");
    value = value.replace(/^(.+?)\s+·\s+character$/i, "$1 · rollperson");
    value = value.replace(/^(.+?)\s+·\s+campaign$/i, "$1 · kampanj");
    value = value.replace(/^Created by\s+(.+)$/i, "Skapad av $1");
    value = value.replace(/^Going\s+(\d+)\s+·\s+Maybe\s+(\d+)\s+·\s+Can't\s+(\d+)\s+·\s+No response\s+(\d+)$/i, "Kommer $1 · Kanske $2 · Kan inte $3 · Inget svar $4");

    if (el.textContent !== value) el.textContent = value;
  }

  function translateDetail(el) {
    if (!el || el.children?.length) return;
    const current = String(el.textContent || "");
    if (current.trim() === "Requires attunement") {
      setText(el, "Kräver attunement");
      return;
    }
    for (const [from, to] of PREFIX) {
      if (current.startsWith(`${from} `)) {
        setText(el, `${to}${current.slice(from.length)}`);
        return;
      }
    }
  }

  function translateLibraryTypes(root) {
    const labels = {
      spell: "Besvärjelser",
      skill: "Färdigheter",
      feature: "Förmågor",
      race: "Släkten",
      background: "Bakgrunder",
      class: "Klasser",
      source: "Källor",
      item: "Föremål"
    };
    root.querySelectorAll?.("[data-library-type]").forEach((el) => {
      const type = el.getAttribute("data-library-type");
      if (labels[type]) setText(el, labels[type]);
    });
  }

  function translateWeekdays(root) {
    const days = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
    root.querySelectorAll?.(".sched-cal-head").forEach((head) => {
      const cells = head.querySelectorAll("span");
      if (cells.length !== 7) return;
      cells.forEach((cell, index) => setText(cell, days[index]));
    });
  }

  function translateLegend(root) {
    const map = {
      "✓ Available": "✓ Tillgänglig",
      "? Maybe": "? Kanske",
      "× Unavailable": "× Inte tillgänglig",
      "— No response": "— Inget svar"
    };
    root.querySelectorAll?.(".sched-legend span").forEach((el) => {
      const next = map[String(el.textContent || "").trim()];
      if (next) setText(el, next);
    });
  }

  function translateAria(root) {
    root.querySelectorAll?.("[aria-label]").forEach((el) => {
      const current = el.getAttribute("aria-label") || "";
      let next = current;
      next = next.replace(/^Remove\s+(.+)/, "Ta bort $1");
      next = next.replace(/^(.+) current$/, "$1 nuvarande");
      next = next.replace(/^Level\s+(\d+) used$/, "Nivå $1 använda");
      next = next.replace(/^Level\s+(\d+) max$/, "Nivå $1 max");
      next = next.replace(/^Previous month$/, "Föregående månad");
      next = next.replace(/^Next month$/, "Nästa månad");
      if (next !== current) el.setAttribute("aria-label", next);
    });
  }

  function translate(root = document) {
    const safeLeafSelectors = [
      "button",
      "option",
      ".empty",
      ".sheet-section__title",
      ".ds-row > span",
      ".home-surface-label",
      ".sched-section-title",
      ".sched-rsvp-badge",
      ".home-rsvp",
      ".notes-nav-title"
    ].join(",");

    root.querySelectorAll?.(safeLeafSelectors).forEach(translateExactElement);
    root.querySelectorAll?.(".meta, .home-character-meta").forEach(translateMeta);
    root.querySelectorAll?.(".detail-block").forEach(translateDetail);
    root.querySelectorAll?.("#availability-dialog label, #event-dialog label, #post-dialog label, #attach-campaign-dialog label, #create-character-dialog label, #note-dialog label").forEach(translateLeadingLabel);

    translateLibraryTypes(root);
    translateWeekdays(root);
    translateLegend(root);
    translateAria(root);

    root.querySelectorAll?.("strong").forEach((el) => {
      if (el.children.length) return;
      const current = String(el.textContent || "").trim();
      if (current === "Location:") setText(el, "Plats:");
    });
  }

  translate(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) translate(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.StormwreckPlayerLocalization = { installed: true, translate };
})();
