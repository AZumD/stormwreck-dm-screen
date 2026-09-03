(function () {
  "use strict";

  if (window.StormwreckLocale?.installed) return;
  if (!window.AppI18n) return;

  const originals = {
    date: Date.prototype.toLocaleDateString,
    time: Date.prototype.toLocaleTimeString,
    dateTime: Date.prototype.toLocaleString
  };

  function selectedLocale() {
    return window.AppI18n.language === "sv" ? "sv-SE" : "en-GB";
  }

  function withSiteLocale(original) {
    return function stormwreckLocalizedDate(locales, options) {
      const requested = locales == null || locales === "" ? selectedLocale() : locales;
      return original.call(this, requested, options);
    };
  }

  Date.prototype.toLocaleDateString = withSiteLocale(originals.date);
  Date.prototype.toLocaleTimeString = withSiteLocale(originals.time);
  Date.prototype.toLocaleString = withSiteLocale(originals.dateTime);

  window.StormwreckLocale = {
    installed: true,
    selectedLocale,
    originals
  };
})();
