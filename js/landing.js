/**
 * DM Library landing: auth gate + list user campaigns + create + import browser data.
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

  const listEl = document.getElementById("user-campaign-list");
  const createBtn = document.getElementById("create-campaign-btn");
  const dialog = document.getElementById("create-campaign-dialog");
  const form = document.getElementById("create-campaign-form");
  const titleInput = document.getElementById("create-campaign-title");
  const descInput = document.getElementById("create-campaign-description");
  const cancelBtn = document.getElementById("create-campaign-cancel");
  const importBtn = document.getElementById("import-browser-data");
  const importReport = document.getElementById("import-browser-report");

  let authMode = "unknown"; /* session | open | login */

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function renderUserCampaigns() {
    if (!listEl || !window.CampaignRegistry) return;
    const campaigns = CampaignRegistry.list();
    if (!campaigns.length) {
      listEl.innerHTML = "";
      listEl.hidden = true;
      return;
    }
    listEl.hidden = false;
    listEl.innerHTML = campaigns
      .map((c) => {
        const href = CampaignRegistry.sandboxUrl(c.id);
        const desc = c.description || "Custom sandbox campaign";
        const level = c.level ? `<span class="card-tag">${escapeHtml(c.level)}</span>` : "";
        return `
          <a class="card card-user-campaign" href="${escapeHtml(href)}" data-campaign-id="${escapeHtml(c.id)}">
            <div class="card-user-campaign__meta">
              <span class="card-status">Your campaign</span>
              ${level}
            </div>
            <h3>${escapeHtml(c.title)}</h3>
            <p>${escapeHtml(desc)}</p>
            <span class="card-action">Open campaign</span>
          </a>`;
      })
      .join("");
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
    window.location.href = CampaignRegistry.sandboxUrl(entry.id);
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
      renderUserCampaigns();
    } catch (err) {
      if (importReport) importReport.textContent = `Import failed: ${err.message || err}`;
    } finally {
      if (importBtn) importBtn.disabled = false;
    }
  }

  function bindLibrary() {
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

    listEl?.addEventListener("click", (e) => {
      const link = e.target.closest?.("a[data-campaign-id]");
      if (!link || !window.CampaignRegistry) return;
      CampaignRegistry.update(link.getAttribute("data-campaign-id"), {});
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
    if (window.LocalApiClient) await LocalApiClient.ready();
    if (window.CampaignRegistry?.bootstrap) await CampaignRegistry.bootstrap();
    renderUserCampaigns();
    await renderDmSchedule(user || null);
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
      /* Offline / health failed — treat as local open mode */
      return false;
    }
  }

  async function resolveSession() {
    const authRequired = await readAuthRequired();

    /* Local default: file DM APIs are open — skip login wall entirely. */
    if (!authRequired) {
      try {
        const data = await authJson("GET", "/api/auth/me", undefined, { timeoutMs: 4000 });
        if (hasDmRole(data.memberships)) {
          await enterLibrary(data.user);
          return;
        }
      } catch {
        /* 401/503/timeout — open without session */
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
    /* Keep both views hidden under the boot overlay — showing login here made
       the form look clickable while the overlay swallowed every click. */
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
