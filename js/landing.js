/**
 * DM Library landing: auth gate, Continue home, campaigns, tools, schedule, import.
 */
(function () {
  "use strict";

  const viewLogin = document.getElementById("view-login");
  const viewLibrary = document.getElementById("view-library");
  const loginForm = document.getElementById("dm-login-form");
  const loginError = document.getElementById("dm-login-error");
  const logoutBtn = document.getElementById("dm-logout");
  const sessionBox = document.getElementById("landing-session");
  const sessionLabel = document.getElementById("dm-session-label");

  const continueSection = document.getElementById("library-continue");
  const continueBody = document.getElementById("library-continue-body");
  const campaignsEl = document.getElementById("library-campaigns");
  const nextSessionEl = document.getElementById("library-next-session");
  const createBtn = document.getElementById("create-campaign-btn");
  const dialog = document.getElementById("create-campaign-dialog");
  const form = document.getElementById("create-campaign-form");
  const titleInput = document.getElementById("create-campaign-title");
  const descInput = document.getElementById("create-campaign-description");
  const cancelBtn = document.getElementById("create-campaign-cancel");
  const importBtn = document.getElementById("import-browser-data");
  const importReport = document.getElementById("import-browser-report");
  const scheduleSection = document.getElementById("library-schedule");
  const scheduleCollapseBtn = document.getElementById("library-schedule-collapse");

  let authMode = "unknown"; /* session | open | login */
  let libraryBound = false;
  let scheduleExpanded = false;
  let scheduleToggleBound = false;

  function escapeHtml(str) {
    return window.LibrarySummary?.escapeHtml
      ? LibrarySummary.escapeHtml(str)
      : String(str ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
  }

  function launchUrl(baseUrl, workspace) {
    return window.LibrarySummary?.campaignLaunchUrl(baseUrl, workspace) || baseUrl;
  }

  function markCampaignOpened(campaignId) {
    if (window.LibrarySummary) LibrarySummary.setLastOpened(campaignId);
    if (window.CampaignRegistry && campaignId) CampaignRegistry.update(campaignId, {});
  }

  function bindCampaignNavigation(root) {
    if (!root) return;
    root.querySelectorAll("[data-campaign-id]").forEach((el) => {
      el.addEventListener("click", () => {
        markCampaignOpened(el.getAttribute("data-campaign-id"));
      });
    });
  }

  function renderContinueCard(summary) {
    const continueHref = launchUrl(summary.url, null);
    const runHref = launchUrl(summary.url, "run");
    const prepHref = launchUrl(summary.url, "prep");
    const sessionLine = summary.sessionLine
      ? `<p class="library-continue-card__state">${escapeHtml(summary.sessionLine)}</p>`
      : "";
    let sceneBlock = "";
    if (summary.currentSceneTitle) {
      sceneBlock = `
        <dl class="library-continue-card__scene">
          <dt>Current Scene</dt>
          <dd>${escapeHtml(summary.currentSceneTitle)}</dd>
        </dl>`;
    } else if (summary.currentSceneId) {
      sceneBlock = `
        <dl class="library-continue-card__scene">
          <dt>Current Scene</dt>
          <dd>${escapeHtml(summary.currentSceneId)}</dd>
        </dl>`;
    } else {
      sceneBlock = `<p class="library-continue-card__scene-empty meta">No current scene set</p>`;
    }
    return `
      <article class="library-continue-card">
        <div class="library-continue-card__main">
          <div class="library-continue-card__info">
            <h3 class="library-continue-card__title">${escapeHtml(summary.title)}</h3>
            ${sessionLine}
            ${sceneBlock}
          </div>
          <div class="library-continue-card__actions">
            <a class="landing-tool-btn landing-tool-btn--primary" href="${escapeHtml(continueHref)}" data-campaign-id="${escapeHtml(summary.id)}">Continue</a>
            <div class="library-continue-card__alt">
              <a class="landing-tool-btn landing-tool-btn--secondary" href="${escapeHtml(runHref)}" data-campaign-id="${escapeHtml(summary.id)}">Run</a>
              <a class="landing-tool-btn landing-tool-btn--secondary" href="${escapeHtml(prepHref)}" data-campaign-id="${escapeHtml(summary.id)}">Prep</a>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderCampaignCard(def, isActive) {
    const href = launchUrl(def.url, null);
    const level = def.level ? `<span class="card-tag">${escapeHtml(def.level)}</span>` : "";
    const activeBadge = isActive ? `<span class="card-status card-status--active">Active</span>` : "";
    const sandboxBadge = def.sandbox ? `<span class="card-status card-status--sandbox">Sandbox</span>` : "";
    const featuredClass = def.featured && !def.sandbox ? " card-campaign--featured" : "";
    return `
      <a class="card-campaign${featuredClass}" href="${escapeHtml(href)}" data-campaign-id="${escapeHtml(def.id)}">
        <div class="card-campaign__surface">
          <div class="card-campaign__meta">
            ${activeBadge}
            ${sandboxBadge}
            ${!activeBadge && !sandboxBadge && def.featured ? `<span class="card-status">Campaign</span>` : ""}
            ${level}
          </div>
          <h3 class="card-campaign__title">${escapeHtml(def.title)}</h3>
          <p class="card-campaign__desc">${escapeHtml(def.description)}</p>
          <span class="card-campaign__action" aria-hidden="true">Open</span>
        </div>
      </a>`;
  }

  async function renderLibraryHome() {
    if (!window.LibrarySummary || !campaignsEl) return;

    const continueDef = LibrarySummary.pickContinueDef();
    const allDefs = LibrarySummary.listCampaignDefs();

    if (continueDef && continueSection && continueBody) {
      continueSection.hidden = false;
      continueBody.innerHTML = `<p class="library-loading meta">Loading campaign…</p>`;
      try {
        const summary = await LibrarySummary.summarize(continueDef);
        continueBody.innerHTML = renderContinueCard(summary);
        bindCampaignNavigation(continueBody);
      } catch {
        continueBody.innerHTML = renderContinueCard({
          ...continueDef,
          workspace: "run",
          sessionLine: null,
          currentSceneId: null,
          currentSceneTitle: null
        });
        bindCampaignNavigation(continueBody);
      }
    } else if (continueSection) {
      continueSection.hidden = true;
    }

    if (!allDefs.length) {
      campaignsEl.innerHTML = `
        <p class="library-empty meta">No campaigns yet.</p>
        <button type="button" class="card card-create library-empty-create" data-create-campaign>
          <span class="card-tag">New</span>
          <h3>Create your first campaign</h3>
          <p>Start a sandbox with Run, Prep, maps, and session tools — or open the Compendium to build your world.</p>
        </button>`;
      campaignsEl.querySelector("[data-create-campaign]")?.addEventListener("click", () => openCreateDialog());
      return;
    }

    campaignsEl.innerHTML = allDefs
      .map((def) => renderCampaignCard(def, continueDef && def.id === continueDef.id))
      .join("");
    bindCampaignNavigation(campaignsEl);
  }

  function fmtEventWhen(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Upcoming";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (+day === +today) return `Today · ${time}`;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (+day === +tomorrow) return `Tomorrow · ${time}`;
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    return `${weekday} · ${time}`;
  }

  function scheduleExpandLink(label) {
    return `<button type="button" class="library-next-session__link" data-expand-schedule>${escapeHtml(label)}</button>`;
  }

  async function expandSchedule(opts = {}) {
    const { scroll = true } = opts;
    if (!scheduleSection) return;
    scheduleSection.hidden = false;
    scheduleSection.classList.remove("library-schedule-section--collapsed");
    scheduleExpanded = true;
    if (scroll) {
      scheduleSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (location.hash !== "#library-schedule") {
      history.replaceState(null, "", "#library-schedule");
    }
  }

  function collapseSchedule() {
    if (!scheduleSection) return;
    scheduleSection.hidden = true;
    scheduleSection.classList.add("library-schedule-section--collapsed");
    scheduleExpanded = false;
    if (location.hash === "#library-schedule") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function bindScheduleToggle() {
    if (scheduleToggleBound) return;
    scheduleToggleBound = true;
    scheduleCollapseBtn?.addEventListener("click", () => collapseSchedule());
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-expand-schedule]");
      if (!trigger) return;
      e.preventDefault();
      expandSchedule({ scroll: true });
    });
    window.addEventListener("hashchange", () => {
      if (location.hash === "#library-schedule" && !scheduleExpanded) {
        expandSchedule({ scroll: true });
      }
    });
  }

  async function renderNextSessionSummary(user) {
    if (!nextSessionEl) return;
    if (!user || !window.PlayerApiClient) {
      nextSessionEl.innerHTML = `
        <h3 class="library-next-session__title">Next session</h3>
        <p class="meta library-next-session__body">Sign in to see upcoming sessions.</p>
        ${scheduleExpandLink("Full schedule")}`;
      return;
    }
    nextSessionEl.innerHTML = `
      <h3 class="library-next-session__title">Next session</h3>
      <p class="meta library-next-session__body">Loading…</p>`;
    try {
      const data = await PlayerApiClient.upcomingEvents({ limit: 8 });
      const now = Date.now();
      const events = (data?.events || []).filter((e) => {
        const t = new Date(e.startsAt).getTime();
        return Number.isFinite(t) && t >= now - 60000;
      });
      const next = events[0];
      if (!next) {
        nextSessionEl.innerHTML = `
          <h3 class="library-next-session__title">Next session</h3>
          <p class="meta library-next-session__body">No session scheduled</p>
          ${scheduleExpandLink("Full schedule")}`;
        return;
      }
      const title = next.title || next.campaignName || "Session";
      const scope = next.kind === "platform" ? "Global event" : next.campaignName || "Campaign session";
      nextSessionEl.innerHTML = `
        <h3 class="library-next-session__title">Next session</h3>
        <p class="library-next-session__when">${escapeHtml(fmtEventWhen(next.startsAt))}</p>
        <p class="library-next-session__name">${escapeHtml(title)}</p>
        <p class="meta library-next-session__scope">${escapeHtml(scope)}</p>
        ${scheduleExpandLink("Full schedule")}`;
    } catch {
      nextSessionEl.innerHTML = `
        <h3 class="library-next-session__title">Next session</h3>
        <p class="meta library-next-session__body">Could not load schedule</p>
        ${scheduleExpandLink("Full schedule")}`;
    }
  }

  async function authJson(method, path, body, { timeoutMs = 12000 } = {}) {
    const opts = {
      method,
      credentials: "include",
      headers: { Accept: "application/json" }
    };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer =
      ctrl && timeoutMs > 0
        ? setTimeout(() => ctrl.abort(), timeoutMs)
        : null;
    if (ctrl) opts.signal = ctrl.signal;
    try {
      const res = await fetch(path, opts);
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { ok: false, error: text || "Invalid response" };
      }
      if (!res.ok || data?.ok === false) {
        const err = new Error(data?.error || `HTTP ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (err) {
      if (err?.name === "AbortError") {
        const timeoutErr = new Error("Request timed out");
        timeoutErr.status = 408;
        throw timeoutErr;
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function hasDmRole(memberships) {
    return (memberships || []).some((m) => String(m.role || "").toLowerCase() === "dm");
  }

  function showLogin(message) {
    authMode = "login";
    if (viewLogin) viewLogin.hidden = false;
    if (viewLibrary) viewLibrary.hidden = true;
    if (loginError) {
      if (message) {
        loginError.hidden = false;
        loginError.textContent = message;
      } else {
        loginError.hidden = true;
        loginError.textContent = "";
      }
    }
  }

  function showLibrary(user) {
    authMode = user ? "session" : "open";
    if (viewLogin) viewLogin.hidden = true;
    if (viewLibrary) viewLibrary.hidden = false;
    if (sessionBox && sessionLabel && logoutBtn) {
      if (user) {
        sessionBox.hidden = false;
        sessionLabel.textContent = user.name || user.email || "Signed in";
        logoutBtn.hidden = false;
      } else {
        sessionBox.hidden = true;
      }
    }
  }

  function openCreateDialog() {
    if (!dialog || typeof dialog.showModal !== "function") {
      const title = window.prompt("Campaign title");
      if (!title || !title.trim()) return;
      createAndOpen(title.trim(), "");
      return;
    }
    if (form) form.reset();
    dialog.showModal();
    titleInput?.focus();
  }

  async function createAndOpen(title, description) {
    if (!window.CampaignRegistry) return;
    const entry = await CampaignRegistry.create({ title, description });
    if (!entry) return;
    markCampaignOpened(entry.id);
    window.location.href = launchUrl(CampaignRegistry.sandboxUrl(entry.id), "run");
  }

  async function runImport() {
    if (!window.BrowserDataImport) return;
    if (importBtn) importBtn.disabled = true;
    if (importReport) {
      importReport.hidden = false;
      importReport.textContent = "Importing browser data into /data…";
    }
    try {
      const report = await BrowserDataImport.run();
      const scan = report.scan || {};
      const lines = [
        `Origin scanned: ${scan.origin || "(unknown)"}`,
        `localStorage keys on this origin: ${scan.localStorageKeys ?? 0}`,
        `Catalogue entries found in browser: ${scan.catalogueEntries ?? 0}`,
        `Campaign-related keys found: ${scan.campaignKeys ?? 0}`,
        "",
        `Catalogue entries imported: ${report.catalogueEntries}`,
        `Campaigns imported: ${report.campaigns}`,
        `Campaign documents written: ${report.campaignDocs}`,
        `Chronicle sessions imported: ${report.chronicleSessions}`,
        `Images imported: ${report.images}`,
        `Skipped (already on disk / newer): ${report.skipped}`,
        `Errors: ${report.errors.length}`
      ];
      if (report.errors.length) {
        lines.push("", ...report.errors.slice(0, 12).map((e) => `• ${e}`));
      }
      lines.push("", "Browser localStorage and IndexedDB were not cleared.");
      if ((scan.catalogueEntries || 0) === 0 && (scan.campaignKeys || 0) === 0) {
        lines.push(
          "",
          "No legacy library data on this origin.",
          "If you previously opened the app as a file:// page (or another host/port), that data lives in a different browser store.",
          "Open the old URL once, or copy localStorage from DevTools → Application, then import again from http://127.0.0.1:3000."
        );
      }
      if (importReport) importReport.textContent = lines.join("\n");
      await CampaignRegistry.bootstrap();
      await renderLibraryHome();
    } catch (err) {
      if (importReport) importReport.textContent = `Import failed: ${err.message || err}`;
    } finally {
      if (importBtn) importBtn.disabled = false;
    }
  }

  function bindLibrary() {
    if (libraryBound) return;
    libraryBound = true;
    createBtn?.addEventListener("click", () => openCreateDialog());
    cancelBtn?.addEventListener("click", () => dialog?.close());
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = String(titleInput?.value || "").trim();
      if (!title) {
        titleInput?.focus();
        return;
      }
      const description = String(descInput?.value || "").trim();
      dialog?.close();
      createAndOpen(title, description);
    });
    importBtn?.addEventListener("click", () => runImport());
  }

  const scheduleList = document.getElementById("dm-schedule-list");
  let scheduleState = {
    bootstrap: null,
    personalCal: null,
    personalAvailability: {},
    platformEventsMonth: [],
    eventDialogMode: "platform",
    postDialogMode: "platform"
  };
  let scheduleBound = false;

  async function safeSchedule(fn) {
    try {
      return await fn();
    } catch (err) {
      console.warn(err);
      return null;
    }
  }

  function ensureScheduleUi(user) {
    if (!window.PlayerSchedulingUI || !window.PlayerApiClient || !scheduleList) return;
    const els = {
      homeScheduleList: scheduleList,
      availabilityDialog: document.getElementById("availability-dialog"),
      availabilityForm: document.getElementById("availability-form"),
      availabilityDialogTitle: document.getElementById("availability-dialog-title"),
      availabilityCancel: document.getElementById("availability-cancel"),
      eventDialog: document.getElementById("event-dialog"),
      eventForm: document.getElementById("event-form"),
      eventDialogTitle: document.getElementById("event-dialog-title"),
      eventCancel: document.getElementById("event-cancel"),
      eventDetailDialog: document.getElementById("event-detail-dialog"),
      eventDetailTitle: document.getElementById("event-detail-title"),
      eventDetailBody: document.getElementById("event-detail-body")
    };
    if (!scheduleBound) {
      PlayerSchedulingUI.init({
        state: scheduleState,
        els,
        api: PlayerApiClient,
        safe: safeSchedule,
        root: document
      });
      scheduleBound = true;
      els.availabilityCancel?.addEventListener("click", () => els.availabilityDialog?.close());
      els.eventCancel?.addEventListener("click", () => els.eventDialog?.close());
    }
    scheduleState.bootstrap = user ? { user } : null;
  }

  async function renderDmSchedule(user) {
    ensureScheduleUi(user);
    if (!scheduleList) return;
    if (!user || !window.PlayerSchedulingUI) {
      scheduleList.innerHTML =
        `<p class="landing-schedule-fallback meta">Sign in to manage availability and events.</p>`;
      return;
    }
    await PlayerSchedulingUI.renderHomeSchedule(scheduleList);
  }

  async function enterLibrary(user) {
    showLibrary(user || null);
    bindScheduleToggle();
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (window.CampaignRegistry?.bootstrap) await CampaignRegistry.bootstrap();
    await renderLibraryHome();
    await renderNextSessionSummary(user || null);
    await renderDmSchedule(user || null);
    if (location.hash === "#library-schedule") {
      await expandSchedule({ scroll: false });
    }
    if (!window.LocalApiClient?.isAvailable()) {
      if (importReport) {
        importReport.hidden = false;
        importReport.textContent =
          "Local API offline. Run npm start and open http://127.0.0.1:3000 for file-backed storage.";
      }
    }
  }

  async function readAuthRequired() {
    try {
      const data = await authJson("GET", "/api/health", undefined, { timeoutMs: 8000 });
      return Boolean(data?.authRequired);
    } catch {
      return false;
    }
  }

  async function resolveSession() {
    const authRequired = await readAuthRequired();

    if (!authRequired) {
      try {
        const data = await authJson("GET", "/api/auth/me", undefined, { timeoutMs: 4000 });
        if (hasDmRole(data.memberships)) {
          await enterLibrary(data.user);
          return;
        }
      } catch {
        /* open without session */
      }
      await enterLibrary(null);
      return;
    }

    try {
      const data = await authJson("GET", "/api/auth/me");
      if (hasDmRole(data.memberships)) {
        await enterLibrary(data.user);
        return;
      }
      await authJson("POST", "/api/auth/logout", {}).catch(() => {});
      showLogin("That account is a player, not a DM. Sign in with a DM account.");
    } catch (err) {
      if (err.status === 503) {
        await enterLibrary(null);
        return;
      }
      showLogin(err.status === 408 ? "Server timed out. Try signing in again." : undefined);
    }
  }

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (loginError) {
      loginError.hidden = true;
      loginError.textContent = "";
    }
    const fd = new FormData(loginForm);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in…";
    }
    try {
      const data = await authJson("POST", "/api/auth/login", {
        email: String(fd.get("email") || ""),
        password: String(fd.get("password") || "")
      });
      if (!hasDmRole(data.memberships)) {
        await authJson("POST", "/api/auth/logout", {}).catch(() => {});
        showLogin("Signed in, but this account has no DM role. Use Player login instead.");
        return;
      }
      await enterLibrary(data.user);
    } catch (err) {
      showLogin(
        err.status === 401
          ? "Invalid email or password."
          : err.status === 408
            ? "Sign-in timed out. Is the server reachable?"
            : err.message || "Sign-in failed."
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign in";
      }
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    try {
      await authJson("POST", "/api/auth/logout", {});
    } catch {
      /* ignore */
    }
    const authRequired = await readAuthRequired();
    if (authRequired) showLogin();
    else await enterLibrary(null);
  });

  async function start() {
    document.body.classList.add("is-booting");
    bindLibrary();
    /* Keep both views hidden during boot overlay until auth resolves */
    if (viewLogin) viewLogin.hidden = true;
    if (viewLibrary) viewLibrary.hidden = true;
    try {
      await resolveSession();
    } catch (err) {
      showLogin(err.message || "Unable to open the library.");
    } finally {
      document.body.classList.remove("is-booting");
    }
  }

  start();
})();
