/**
 * Player scheduling + campaign board UI (platform-neutral).
 */
window.PlayerSchedulingUI = (function () {
  "use strict";

  let ctx = null;

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toDateStr(y, m, d) {
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  function parseDateStr(s) {
    const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
    return { y, m, d };
  }

  function monthStart(year, month) {
    return toDateStr(year, month, 1);
  }

  function monthEnd(year, month) {
    const last = new Date(year, month, 0).getDate();
    return toDateStr(year, month, last);
  }

  function addMonths(year, month, delta) {
    const dt = new Date(year, month - 1 + delta, 1);
    return { year: dt.getFullYear(), month: dt.getMonth() + 1 };
  }

  function fmtEventWhen(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function fmtDayLong(dateStr) {
    const { y, m, d } = parseDateStr(dateStr);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function availabilityGlyph(status) {
    if (status === "available") return "✓";
    if (status === "maybe") return "?";
    if (status === "unavailable") return "×";
    return "";
  }

  function campaignRole() {
    const camps = ctx.state.bootstrap?.campaigns || [];
    const c = camps.find((x) => x.id === ctx.state.campaignId);
    return c?.role || "player";
  }

  function isDm() {
    return campaignRole() === "dm";
  }

  function calendarGrid(year, month, entriesByDate, aggregateByDate, eventDates) {
    const first = new Date(year, month - 1, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let html = `<div class="sched-cal"><div class="sched-cal-head">${labels
      .map((l) => `<span>${l}</span>`)
      .join("")}</div><div class="sched-cal-grid">`;
    for (let i = 0; i < startDow; i++) html += `<span class="sched-cal-cell sched-cal-pad"></span>`;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateStr(year, month, day);
      const entry = entriesByDate?.[dateStr];
      const agg = aggregateByDate?.[dateStr];
      const hasEvents = Boolean(eventDates?.[dateStr]);
      let badge = "";
      if (agg && agg.totalMembers) {
        const parts = [];
        if (agg.available) parts.push(`${agg.available}✓`);
        if (agg.maybe) parts.push(`${agg.maybe}?`);
        badge = `<span class="sched-cal-agg">${esc(parts.join(" ") || `${agg.responded}/${agg.totalMembers}`)}</span>`;
      } else if (entry) {
        badge = `<span class="sched-cal-glyph sched-cal-glyph--${esc(entry.status)}">${availabilityGlyph(entry.status)}</span>`;
      }
      if (hasEvents && !agg) {
        badge += `<span class="sched-cal-dot" aria-hidden="true"></span>`;
      }
      html += `<button type="button" class="sched-cal-cell${hasEvents ? " has-events" : ""}" data-sched-date="${esc(dateStr)}">
        <span class="sched-cal-day">${day}</span>${badge}
      </button>`;
    }
    html += `</div></div>`;
    return html;
  }

  async function loadPersonalMonth(year, month) {
    const from = monthStart(year, month);
    const to = monthEnd(year, month);
    const data = await ctx.safe(() => ctx.api.availability(from, to));
    const map = {};
    (data?.availability || []).forEach((e) => {
      map[e.date] = e;
    });
    ctx.state.personalAvailability = map;
  }

  async function renderHomeSchedule(container) {
    if (!container) return;
    const now = new Date();
    if (!ctx.state.personalCal?.year) {
      ctx.state.personalCal = { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const { year, month } = ctx.state.personalCal;
    await loadPersonalMonth(year, month);
    const from = monthStart(year, month);
    const to = monthEnd(year, month);
    const [upcomingData, monthEventsData] = await Promise.all([
      ctx.safe(() => ctx.api.upcomingEvents({ limit: 12 })),
      ctx.safe(() => ctx.api.platformEvents({ from, to, limit: 100 }))
    ]);
    const monthEvents = monthEventsData?.events || [];
    ctx.state.platformEventsMonth = monthEvents;
    const eventDates = {};
    monthEvents.forEach((e) => {
      if (e.status && e.status !== "scheduled") return;
      const d = new Date(e.startsAt);
      const key = toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
      eventDates[key] = true;
    });
    ctx.state.platformEventDates = eventDates;
    const events = upcomingData?.events || [];
    const list =
      events.length > 0
        ? events
            .map((e) => {
              const isGlobal = e.kind === "platform";
              const scope = isGlobal ? "GLOBAL" : e.scopeLabel || e.campaignName || "Campaign";
              const scopeClass = isGlobal ? "sched-event-scope--global" : "";
              const attrs = isGlobal
                ? `data-home-platform-event="${esc(e.id)}"`
                : `data-home-event="${esc(e.id)}" data-home-campaign="${esc(e.campaignId)}"`;
              return `<li>
              <button type="button" class="card card-btn sched-event-card" ${attrs}>
                <p class="sched-event-scope ${scopeClass}">${esc(scope)}</p>
                <p class="meta">${esc(fmtEventWhen(e.startsAt))}</p>
                <h2>${esc(e.title || (isGlobal ? "Event" : "Session"))}</h2>
                ${!isGlobal ? `<p class="meta sched-rsvp-badge">${esc(e.myRsvpLabel || "No RSVP")}</p>` : ""}
              </button>
            </li>`;
            })
            .join("")
        : `<li class="empty">No upcoming sessions.</li>`;
    const title = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });
    container.innerHTML = `
      <div class="sched-panel home-sched-panel">
        <div class="sched-cal-toolbar">
          <button type="button" class="btn btn-ghost btn-sm" data-personal-cal-prev aria-label="Previous month">‹</button>
          <h3 class="sched-cal-title">${esc(title)}</h3>
          <button type="button" class="btn btn-ghost btn-sm" data-personal-cal-next aria-label="Next month">›</button>
        </div>
        <p class="meta">Tap a day for availability and global events. Gold dot = event.</p>
        ${calendarGrid(year, month, ctx.state.personalAvailability || {}, null, eventDates)}
        <p class="sched-legend"><span>✓ Available</span><span>? Maybe</span><span>× Unavailable</span><span>— No response</span></p>
        <h3 class="sched-section-title">Upcoming</h3>
        <ul class="list">${list}</ul>
      </div>`;
  }

  async function renderHomeBoard(container) {
    if (!container) return;
    const data = await ctx.safe(() => ctx.api.platformPosts());
    if (!data) return;
    ctx.state.platformPosts = data.posts || [];
    const me = ctx.state.bootstrap?.user?.id;
    const renderPost = (p) => {
      const authorActions =
        p.authorUserId === me
          ? `<button type="button" class="btn btn-ghost btn-sm" data-edit-platform-post="${esc(p.id)}">Edit</button>
             <button type="button" class="btn btn-ghost btn-sm" data-delete-platform-post="${esc(p.id)}">Delete</button>`
          : "";
      return `<article class="card board-post" data-platform-post-id="${esc(p.id)}">
        <header class="board-post-head">
          <strong>${esc(p.authorName)}</strong>
          <span class="meta">${esc(new Date(p.createdAt).toLocaleString())}</span>
        </header>
        <div class="board-post-body">${esc(p.body).replace(/\n/g, "<br>")}</div>
        <div class="row board-post-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-reply-platform-post="${esc(p.id)}">Reply${p.replyCount ? ` (${p.replyCount})` : ""}</button>
          ${authorActions}
        </div>
        <div class="board-replies" id="platform-replies-${esc(p.id)}" hidden></div>
      </article>`;
    };
    container.innerHTML = ctx.state.platformPosts.length
      ? ctx.state.platformPosts.map(renderPost).join("")
      : `<p class="empty">No posts yet. Start a conversation.</p>`;
  }

  async function openHomeDayDetail(dateStr) {
    const dlg = ctx.els.availabilityDialog;
    const form = ctx.els.availabilityForm;
    if (!dlg || !form) return;
    ctx.state.selectedHomeDate = dateStr;
    const existing = ctx.state.personalAvailability?.[dateStr];
    form.date.value = dateStr;
    ctx.els.availabilityDialogTitle.textContent = fmtDayLong(dateStr);
    form.status.value = existing?.status || "";
    form.availableFrom.value = existing?.availableFrom || "";
    form.availableUntil.value = existing?.availableUntil || "";
    form.note.value = existing?.note || "";
    const dayEvents = (ctx.state.platformEventsMonth || []).filter((e) => {
      if (e.status && e.status !== "scheduled") return false;
      const d = new Date(e.startsAt);
      return toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate()) === dateStr;
    });
    const box = document.getElementById("home-day-events");
    const me = ctx.state.bootstrap?.user?.id;
    if (box) {
      box.innerHTML = dayEvents.length
        ? `<ul class="list">${dayEvents
            .map((e) => {
              const mine = e.createdByUserId === me;
              return `<li class="card">
                <p class="meta">${esc(fmtEventWhen(e.startsAt))}</p>
                <strong>${esc(e.title || "Event")}</strong>
                ${e.location ? `<p class="meta">${esc(e.location)}</p>` : ""}
                ${
                  mine
                    ? `<div class="row">
                        <button type="button" class="btn btn-ghost btn-sm" data-edit-platform-event="${esc(e.id)}">Edit</button>
                        <button type="button" class="btn btn-danger btn-sm" data-delete-platform-event="${esc(e.id)}">Delete</button>
                      </div>`
                    : ""
                }
              </li>`;
            })
            .join("")}</ul>`
        : `<p class="empty">No events today.</p>`;
    }
    dlg.showModal();
  }

  function openAvailabilityEditor(dateStr) {
    openHomeDayDetail(dateStr);
  }

  async function renderCampaignSchedule(main) {
    const { year, month } = ctx.state.campaignCal;
    const from = monthStart(year, month);
    const to = monthEnd(year, month);
    const [eventsData, rangeData] = await Promise.all([
      ctx.safe(() => ctx.api.campaignEvents(ctx.state.campaignId, { from, to })),
      ctx.safe(() => ctx.api.campaignAvailabilityRange(ctx.state.campaignId, from, to))
    ]);
    if (!eventsData || !rangeData) return;
    ctx.state.campaignEvents = eventsData.events || [];
    const aggMap = {};
    (rangeData.days || []).forEach((d) => {
      aggMap[d.date] = d;
    });
    ctx.state.campaignAvailabilityAgg = aggMap;
    const title = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });
    const upcoming = (ctx.state.campaignEvents || [])
      .filter((e) => e.status === "scheduled")
      .slice(0, 6)
      .map(
        (e) => `<li><button type="button" class="card card-btn" data-campaign-event="${esc(e.id)}">
          <p class="meta">${esc(fmtEventWhen(e.startsAt))}</p>
          <h2>${esc(e.title || "Session")}</h2>
          ${e.location ? `<p class="meta">${esc(e.location)}</p>` : ""}
        </button></li>`
      )
      .join("");
    const dmBtn = isDm()
      ? `<p><button type="button" class="btn btn-primary btn-sm" data-schedule-new-event>New session</button></p>`
      : "";
    main.innerHTML = `
      <div class="sched-panel">
        <section class="sched-section">
          <h2 class="sched-section-title">Upcoming sessions</h2>
          ${dmBtn}
          <ul class="list">${upcoming || `<li class="empty">No sessions this month yet.</li>`}</ul>
        </section>
        <section class="sched-section">
          <div class="sched-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-sm" data-campaign-cal-prev>‹</button>
            <h2 class="sched-cal-title">${esc(title)}</h2>
            <button type="button" class="btn btn-ghost btn-sm" data-campaign-cal-next>›</button>
          </div>
          <p class="meta">Member availability (responded / total). Tap a day for details.</p>
          ${calendarGrid(year, month, {}, aggMap)}
        </section>
        <div id="sched-day-detail" class="sched-day-detail" hidden></div>
      </div>`;
  }

  async function showCampaignDayDetail(dateStr) {
    const panel = document.getElementById("sched-day-detail");
    if (!panel) return;
    const data = await ctx.safe(() =>
      ctx.api.campaignAvailabilityDay(ctx.state.campaignId, dateStr)
    );
    if (!data) return;
    ctx.state.selectedScheduleDate = dateStr;
    const members = (data.members || [])
      .map((m) => {
        let extra = "";
        if (m.availableFrom) extra += ` · from ${esc(m.availableFrom)}`;
        if (m.availableUntil) extra += ` · until ${esc(m.availableUntil)}`;
        const icon =
          m.status === "available" ? "✓" : m.status === "maybe" ? "?" : m.status === "unavailable" ? "×" : "—";
        return `<li class="sched-member-row">
          <strong>${esc(m.userName)}</strong>
          <span>${icon} ${esc(m.label || "No response")}${extra}</span>
        </li>`;
      })
      .join("");
    const summary = `${data.counts.responded}/${data.total} responded · ${data.counts.available} available · ${data.counts.maybe} maybe`;
    const scheduleBtn = isDm()
      ? `<button type="button" class="btn btn-primary btn-sm" data-schedule-from-day="${esc(dateStr)}">Schedule session</button>`
      : "";
    panel.hidden = false;
    panel.innerHTML = `
      <div class="card sched-day-card">
        <h3>${esc(fmtDayLong(dateStr))}</h3>
        <p class="meta">${esc(summary)}</p>
        <ul class="sched-member-list">${members}</ul>
        ${scheduleBtn}
      </div>`;
  }

  async function renderCampaignBoard(main) {
    const data = await ctx.safe(() => ctx.api.campaignPosts(ctx.state.campaignId));
    if (!data) return;
    ctx.state.campaignPosts = data.posts || [];
    const pinned = ctx.state.campaignPosts.filter((p) => p.pinned);
    const recent = ctx.state.campaignPosts.filter((p) => !p.pinned);
    const renderPost = (p) => {
      const dmActions = isDm()
        ? `<button type="button" class="btn btn-ghost btn-sm" data-pin-post="${esc(p.id)}">${p.pinned ? "Unpin" : "Pin"}</button>`
        : "";
      const authorActions =
        p.authorUserId === ctx.state.bootstrap?.user?.id
          ? `<button type="button" class="btn btn-ghost btn-sm" data-edit-post="${esc(p.id)}">Edit</button>`
          : "";
      return `<article class="card board-post" data-post-id="${esc(p.id)}">
        <header class="board-post-head">
          <strong>${esc(p.authorName)}</strong>
          <span class="meta">${esc(new Date(p.createdAt).toLocaleString())}</span>
        </header>
        <div class="board-post-body">${esc(p.body).replace(/\n/g, "<br>")}</div>
        <div class="row board-post-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-reply-post="${esc(p.id)}">Reply${p.replyCount ? ` (${p.replyCount})` : ""}</button>
          ${authorActions}${dmActions}
        </div>
        <div class="board-replies" id="board-replies-${esc(p.id)}" hidden></div>
      </article>`;
    };
    main.innerHTML = `
      <div class="sched-panel board-panel">
        <p><button type="button" class="btn btn-primary" data-board-new-post>New post</button></p>
        ${pinned.length ? `<section><h2 class="sched-section-title">Pinned</h2>${pinned.map(renderPost).join("")}</section>` : ""}
        <section><h2 class="sched-section-title">Recent</h2>${recent.length ? recent.map(renderPost).join("") : `<p class="empty">No posts yet.</p>`}</section>
      </div>`;
  }

  function openEventDialog(prefillDate, mode = "campaign") {
    const dlg = ctx.els.eventDialog;
    const form = ctx.els.eventForm;
    if (!dlg || !form) return;
    ctx.state.eventDialogMode = mode;
    form.reset();
    const isPlatform = mode === "platform";
    const editing = isPlatform ? ctx.state.editingPlatformEventId : ctx.state.editingEventId;
    const editingEvent = isPlatform ? ctx.state.editingPlatformEvent : ctx.state.editingEvent;
    ctx.els.eventDialogTitle.textContent = isPlatform
      ? editing
        ? "Edit event"
        : "Create event"
      : editing
        ? "Edit session"
        : "Schedule session";
    const submitBtn = document.getElementById("event-submit-btn");
    if (submitBtn) submitBtn.textContent = isPlatform ? "Save event" : "Save session";
    if (prefillDate) {
      form.date.value = prefillDate;
      form.startTime.value = "18:00";
    }
    if (editing && editingEvent) {
      const e = editingEvent;
      form.title.value = e.title || "";
      form.location.value = e.location || "";
      form.notes.value = e.notes || "";
      const st = new Date(e.startsAt);
      form.date.value = toDateStr(st.getFullYear(), st.getMonth() + 1, st.getDate());
      form.startTime.value = `${pad2(st.getHours())}:${pad2(st.getMinutes())}`;
      if (e.endsAt) {
        const en = new Date(e.endsAt);
        form.endTime.value = `${pad2(en.getHours())}:${pad2(en.getMinutes())}`;
      }
    }
    dlg.showModal();
  }

  function isoFromLocalDateTime(dateStr, timeStr) {
    const { y, m, d } = parseDateStr(dateStr);
    const [hh, mm] = (timeStr || "18:00").split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0).toISOString();
  }

  async function openEventDetail(eventId) {
    const data = await ctx.safe(() => ctx.api.campaignEvent(ctx.state.campaignId, eventId));
    if (!data) return;
    ctx.state.viewingEventId = eventId;
    ctx.state.viewingPlatformEventId = null;
    const e = data.event;
    const dlg = ctx.els.eventDetailDialog;
    if (!dlg) return;
    ctx.els.eventDetailTitle.textContent = e.title || "Session";
    const rsvpRows = (data.rsvps || [])
      .map((r) => `<li><strong>${esc(r.userName)}</strong> — ${esc(r.label)}</li>`)
      .join("");
    const counts = data.counts || {};
    const myBtns = `<div class="row sched-rsvp-btns">
      <button type="button" class="btn btn-primary btn-sm" data-rsvp="going">Going</button>
      <button type="button" class="btn btn-ghost btn-sm" data-rsvp="maybe">Maybe</button>
      <button type="button" class="btn btn-ghost btn-sm" data-rsvp="cant">Can't make it</button>
      <button type="button" class="btn btn-ghost btn-sm" data-rsvp="clear">Clear RSVP</button>
    </div>`;
    const dmBtns = isDm()
      ? `<div class="row">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-event="${esc(e.id)}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-cancel-event="${esc(e.id)}">Cancel session</button>
        </div>`
      : "";
    ctx.els.eventDetailBody.innerHTML = `
      <p class="meta">${esc(fmtEventWhen(e.startsAt))}${e.endsAt ? ` – ${esc(fmtEventWhen(e.endsAt))}` : ""}</p>
      ${e.location ? `<p><strong>Location:</strong> ${esc(e.location)}</p>` : ""}
      ${e.notes ? `<div class="note-body">${esc(e.notes).replace(/\n/g, "<br>")}</div>` : ""}
      <p class="meta">Going ${counts.going || 0} · Maybe ${counts.maybe || 0} · Can't ${counts.cant || 0} · No response ${counts.noResponse || 0}</p>
      <ul class="sched-member-list">${rsvpRows}</ul>
      ${myBtns}${dmBtns}`;
    dlg.showModal();
  }

  async function openPlatformEventDetail(eventId) {
    const data = await ctx.safe(() => ctx.api.platformEvent(eventId));
    if (!data?.event) return;
    const e = data.event;
    const dlg = ctx.els.eventDetailDialog;
    if (!dlg) return;
    ctx.state.viewingPlatformEventId = eventId;
    ctx.state.viewingEventId = null;
    ctx.els.eventDetailTitle.textContent = e.title || "Event";
    const me = ctx.state.bootstrap?.user?.id;
    const mine = e.createdByUserId === me;
    ctx.els.eventDetailBody.innerHTML = `
      <p class="sched-event-scope sched-event-scope--global">GLOBAL</p>
      <p class="meta">${esc(fmtEventWhen(e.startsAt))}${e.endsAt ? ` – ${esc(fmtEventWhen(e.endsAt))}` : ""}</p>
      ${e.createdByName ? `<p class="meta">Created by ${esc(e.createdByName)}</p>` : ""}
      ${e.location ? `<p><strong>Location:</strong> ${esc(e.location)}</p>` : ""}
      ${e.notes ? `<div class="note-body">${esc(e.notes).replace(/\n/g, "<br>")}</div>` : ""}
      ${
        mine
          ? `<div class="row">
              <button type="button" class="btn btn-ghost btn-sm" data-edit-platform-event="${esc(e.id)}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm" data-delete-platform-event="${esc(e.id)}">Delete</button>
            </div>`
          : ""
      }`;
    dlg.showModal();
  }

  function openPostDialog(opts = {}) {
    const dlg = ctx.els.postDialog;
    const form = ctx.els.postForm;
    if (!dlg || !form) return;
    ctx.state.postDialogMode = opts.mode || "campaign";
    form.reset();
    form.parentPostId.value = opts.parentPostId || "";
    ctx.els.postDialogTitle.textContent = opts.parentPostId ? "Reply" : "New post";
    ctx.state.editingPostId = opts.postId || null;
    if (opts.body) form.body.value = opts.body;
    dlg.showModal();
  }

  function closeCampaignMenu() {
    const menu = ctx.els.campaignMenu;
    const btn = ctx.els.campaignMenuBtn;
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function setCampaignSectionNav() {
    document.querySelectorAll("#campaign-menu [data-campaign-section]").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        btn.getAttribute("data-campaign-section") === ctx.state.campaignSection
      );
    });
    const playTabs = document.querySelector("#view-shell .tabs");
    if (playTabs) playTabs.hidden = ctx.state.campaignSection !== "play";
    if (ctx.els.shell) {
      ctx.els.shell.classList.toggle("view-shell--schedule", ctx.state.campaignSection !== "play");
    }
    const titles = { play: null, schedule: "Schedule", board: "Board" };
    if (ctx.state.campaignSection !== "play" && ctx.els.shellTitle) {
      ctx.els.shellTitle.textContent = titles[ctx.state.campaignSection] || "Campaign";
    } else if (ctx.state.campaignSection === "play") {
      ctx.setTabs?.();
    }
    closeCampaignMenu();
  }

  async function renderCampaignSection(main) {
    setCampaignSectionNav();
    if (ctx.state.campaignSection === "schedule") {
      ctx.stopMapTab?.();
      await renderCampaignSchedule(main);
      return;
    }
    if (ctx.state.campaignSection === "board") {
      ctx.stopMapTab?.();
      await renderCampaignBoard(main);
      return;
    }
  }

  function bind(root) {
    root.addEventListener("click", async (e) => {
      if (e.target.closest("#campaign-menu-btn")) {
        const menu = ctx.els.campaignMenu;
        const btn = ctx.els.campaignMenuBtn;
        if (!menu || !btn) return;
        const open = menu.hidden;
        menu.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      if (e.target.closest("[data-campaign-nav-home]")) {
        closeCampaignMenu();
        ctx.goHome?.();
        return;
      }
      const sectionBtn = e.target.closest("#campaign-menu [data-campaign-section]");
      if (sectionBtn) {
        ctx.state.campaignSection = sectionBtn.getAttribute("data-campaign-section");
        setCampaignSectionNav();
        await ctx.render?.();
        return;
      }
      if (
        ctx.els.campaignMenu &&
        !ctx.els.campaignMenu.hidden &&
        !e.target.closest("#campaign-menu") &&
        !e.target.closest("#campaign-menu-btn")
      ) {
        closeCampaignMenu();
      }

      const personalDate = e.target.closest("[data-sched-date]");
      if (personalDate && personalDate.closest("#home-schedule-list")) {
        await openHomeDayDetail(personalDate.getAttribute("data-sched-date"));
        return;
      }
      if (personalDate && ctx.state.campaignSection === "schedule") {
        await showCampaignDayDetail(personalDate.getAttribute("data-sched-date"));
        return;
      }
      const homeEvent = e.target.closest("[data-home-event]");
      if (homeEvent) {
        const campId = homeEvent.getAttribute("data-home-campaign");
        const camps = ctx.state.bootstrap?.campaigns || [];
        const camp = camps.find((c) => c.id === campId);
        if (camp) {
          ctx.state.campaignSection = "schedule";
          await ctx.openCampaign?.(camp);
          await openEventDetail(homeEvent.getAttribute("data-home-event"));
        }
        return;
      }
      const homePlatform = e.target.closest("[data-home-platform-event]");
      if (homePlatform) {
        await openPlatformEventDetail(homePlatform.getAttribute("data-home-platform-event"));
        return;
      }
      const campEvent = e.target.closest("[data-campaign-event]");
      if (campEvent) {
        await openEventDetail(campEvent.getAttribute("data-campaign-event"));
        return;
      }
      if (e.target.closest("[data-personal-cal-prev]")) {
        ctx.state.personalCal = addMonths(ctx.state.personalCal.year, ctx.state.personalCal.month, -1);
        await renderHomeSchedule(ctx.els.homeScheduleList);
        return;
      }
      if (e.target.closest("[data-personal-cal-next]")) {
        ctx.state.personalCal = addMonths(ctx.state.personalCal.year, ctx.state.personalCal.month, 1);
        await renderHomeSchedule(ctx.els.homeScheduleList);
        return;
      }
      if (e.target.closest("[data-campaign-cal-prev]")) {
        ctx.state.campaignCal = addMonths(ctx.state.campaignCal.year, ctx.state.campaignCal.month, -1);
        await renderCampaignSchedule(ctx.els.main);
        return;
      }
      if (e.target.closest("[data-campaign-cal-next]")) {
        ctx.state.campaignCal = addMonths(ctx.state.campaignCal.year, ctx.state.campaignCal.month, 1);
        await renderCampaignSchedule(ctx.els.main);
        return;
      }
      if (e.target.closest("[data-create-platform-event]")) {
        ctx.state.editingPlatformEventId = null;
        ctx.state.editingPlatformEvent = null;
        const dateStr = ctx.state.selectedHomeDate || ctx.els.availabilityForm?.date?.value;
        ctx.els.availabilityDialog?.close();
        openEventDialog(dateStr || null, "platform");
        return;
      }
      const editPlat = e.target.closest("[data-edit-platform-event]");
      if (editPlat) {
        const id = editPlat.getAttribute("data-edit-platform-event");
        const detail = await ctx.safe(() => ctx.api.platformEvent(id));
        if (!detail?.event) return;
        ctx.state.editingPlatformEventId = id;
        ctx.state.editingPlatformEvent = detail.event;
        ctx.els.eventDetailDialog?.close();
        ctx.els.availabilityDialog?.close();
        openEventDialog(null, "platform");
        return;
      }
      const delPlat = e.target.closest("[data-delete-platform-event]");
      if (delPlat) {
        const id = delPlat.getAttribute("data-delete-platform-event");
        await ctx.safe(() => ctx.api.deletePlatformEvent(id));
        ctx.els.eventDetailDialog?.close();
        ctx.els.availabilityDialog?.close();
        await renderHomeSchedule(ctx.els.homeScheduleList);
        return;
      }
      const fromDay = e.target.closest("[data-schedule-from-day]");
      if (fromDay) {
        ctx.state.editingEventId = null;
        ctx.state.eventDialogMode = "campaign";
        openEventDialog(fromDay.getAttribute("data-schedule-from-day"), "campaign");
        return;
      }
      if (e.target.closest("[data-schedule-new-event]")) {
        ctx.state.editingEventId = null;
        openEventDialog(ctx.state.selectedScheduleDate || null, "campaign");
        return;
      }
      const rsvpBtn = e.target.closest("[data-rsvp]");
      if (rsvpBtn && ctx.state.viewingEventId) {
        const status = rsvpBtn.getAttribute("data-rsvp");
        if (status === "clear") {
          await ctx.safe(() =>
            ctx.api.deleteEventRsvp(ctx.state.campaignId, ctx.state.viewingEventId)
          );
        } else {
          await ctx.safe(() =>
            ctx.api.putEventRsvp(ctx.state.campaignId, ctx.state.viewingEventId, { status })
          );
        }
        await openEventDetail(ctx.state.viewingEventId);
        return;
      }
      const editEvent = e.target.closest("[data-edit-event]");
      if (editEvent) {
        const id = editEvent.getAttribute("data-edit-event");
        const detail = await ctx.safe(() => ctx.api.campaignEvent(ctx.state.campaignId, id));
        if (!detail) return;
        ctx.state.editingEventId = id;
        ctx.state.editingEvent = detail.event;
        ctx.els.eventDetailDialog?.close();
        openEventDialog(null, "campaign");
        return;
      }
      const cancelEvent = e.target.closest("[data-cancel-event]");
      if (cancelEvent) {
        const id = cancelEvent.getAttribute("data-cancel-event");
        await ctx.safe(() =>
          ctx.api.updateCampaignEvent(ctx.state.campaignId, id, { status: "cancelled" })
        );
        ctx.els.eventDetailDialog?.close();
        await renderCampaignSchedule(ctx.els.main);
        return;
      }
      if (e.target.closest("[data-board-new-post]")) {
        openPostDialog({ mode: "campaign" });
        return;
      }
      if (e.target.closest("[data-platform-board-new]")) {
        openPostDialog({ mode: "platform" });
        return;
      }
      const replyPost = e.target.closest("[data-reply-post]");
      if (replyPost) {
        const postId = replyPost.getAttribute("data-reply-post");
        const box = document.getElementById(`board-replies-${postId}`);
        if (box && box.hidden) {
          const data = await ctx.safe(() => ctx.api.postReplies(ctx.state.campaignId, postId));
          const replies = (data?.replies || [])
            .map(
              (r) => `<div class="board-reply"><strong>${esc(r.authorName)}</strong>
                <span class="meta">${esc(new Date(r.createdAt).toLocaleString())}</span>
                <div>${esc(r.body).replace(/\n/g, "<br>")}</div></div>`
            )
            .join("");
          box.innerHTML = replies || `<p class="empty">No replies yet.</p>`;
          box.hidden = false;
        }
        openPostDialog({ mode: "campaign", parentPostId: postId });
        return;
      }
      const replyPlat = e.target.closest("[data-reply-platform-post]");
      if (replyPlat) {
        const postId = replyPlat.getAttribute("data-reply-platform-post");
        const box = document.getElementById(`platform-replies-${postId}`);
        if (box && box.hidden) {
          const data = await ctx.safe(() => ctx.api.platformPostReplies(postId));
          const replies = (data?.replies || [])
            .map(
              (r) => `<div class="board-reply"><strong>${esc(r.authorName)}</strong>
                <span class="meta">${esc(new Date(r.createdAt).toLocaleString())}</span>
                <div>${esc(r.body).replace(/\n/g, "<br>")}</div></div>`
            )
            .join("");
          box.innerHTML = replies || `<p class="empty">No replies yet.</p>`;
          box.hidden = false;
        }
        openPostDialog({ mode: "platform", parentPostId: postId });
        return;
      }
      const editPost = e.target.closest("[data-edit-post]");
      if (editPost) {
        const postId = editPost.getAttribute("data-edit-post");
        const post = (ctx.state.campaignPosts || []).find((p) => p.id === postId);
        openPostDialog({ mode: "campaign", postId, body: post?.body || "" });
        return;
      }
      const editPlatPost = e.target.closest("[data-edit-platform-post]");
      if (editPlatPost) {
        const postId = editPlatPost.getAttribute("data-edit-platform-post");
        const post = (ctx.state.platformPosts || []).find((p) => p.id === postId);
        openPostDialog({ mode: "platform", postId, body: post?.body || "" });
        return;
      }
      const delPlatPost = e.target.closest("[data-delete-platform-post]");
      if (delPlatPost) {
        const postId = delPlatPost.getAttribute("data-delete-platform-post");
        await ctx.safe(() => ctx.api.deletePlatformPost(postId));
        await renderHomeBoard(ctx.els.homeBoardList);
        return;
      }
      const pinPost = e.target.closest("[data-pin-post]");
      if (pinPost) {
        const postId = pinPost.getAttribute("data-pin-post");
        const post = (ctx.state.campaignPosts || []).find((p) => p.id === postId);
        await ctx.safe(() =>
          ctx.api.pinCampaignPost(ctx.state.campaignId, postId, !post?.pinned)
        );
        await renderCampaignBoard(ctx.els.main);
        return;
      }
    });

    ctx.els.availabilityForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ctx.els.availabilityForm;
      const dateStr = f.date.value;
      const status = f.status.value;
      if (!status) {
        await ctx.safe(() => ctx.api.deleteAvailability(dateStr));
      } else {
        await ctx.safe(() =>
          ctx.api.putAvailability(dateStr, {
            status,
            availableFrom: f.availableFrom.value || null,
            availableUntil: f.availableUntil.value || null,
            note: f.note.value || ""
          })
        );
      }
      await loadPersonalMonth(ctx.state.personalCal.year, ctx.state.personalCal.month);
      await renderHomeSchedule(ctx.els.homeScheduleList);
      if (ctx.state.selectedHomeDate) await openHomeDayDetail(ctx.state.selectedHomeDate);
    });

    ctx.els.eventForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ctx.els.eventForm;
      const payload = {
        title: f.title.value.trim() || "Event",
        startsAt: isoFromLocalDateTime(f.date.value, f.startTime.value),
        endsAt: f.endTime.value ? isoFromLocalDateTime(f.date.value, f.endTime.value) : null,
        location: f.location.value.trim(),
        notes: f.notes.value.trim()
      };
      if (ctx.state.eventDialogMode === "platform") {
        if (ctx.state.editingPlatformEventId) {
          await ctx.safe(() =>
            ctx.api.updatePlatformEvent(ctx.state.editingPlatformEventId, payload)
          );
        } else {
          await ctx.safe(() => ctx.api.createPlatformEvent(payload));
        }
        ctx.state.editingPlatformEventId = null;
        ctx.state.editingPlatformEvent = null;
        f.closest("dialog")?.close();
        await renderHomeSchedule(ctx.els.homeScheduleList);
        return;
      }
      if (ctx.state.editingEventId) {
        await ctx.safe(() =>
          ctx.api.updateCampaignEvent(ctx.state.campaignId, ctx.state.editingEventId, payload)
        );
      } else {
        await ctx.safe(() => ctx.api.createCampaignEvent(ctx.state.campaignId, payload));
      }
      ctx.state.editingEventId = null;
      ctx.state.editingEvent = null;
      f.closest("dialog")?.close();
      if (ctx.state.campaignSection === "schedule") await renderCampaignSchedule(ctx.els.main);
    });

    ctx.els.postForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ctx.els.postForm;
      const body = f.body.value.trim();
      if (!body) return;
      if (ctx.state.postDialogMode === "platform") {
        if (ctx.state.editingPostId) {
          await ctx.safe(() => ctx.api.updatePlatformPost(ctx.state.editingPostId, { body }));
        } else {
          await ctx.safe(() =>
            ctx.api.createPlatformPost({
              body,
              parentPostId: f.parentPostId.value || null
            })
          );
        }
        ctx.state.editingPostId = null;
        f.closest("dialog")?.close();
        await renderHomeBoard(ctx.els.homeBoardList);
        return;
      }
      if (ctx.state.editingPostId) {
        await ctx.safe(() =>
          ctx.api.updateCampaignPost(ctx.state.campaignId, ctx.state.editingPostId, { body })
        );
      } else {
        await ctx.safe(() =>
          ctx.api.createCampaignPost(ctx.state.campaignId, {
            body,
            parentPostId: f.parentPostId.value || null
          })
        );
      }
      ctx.state.editingPostId = null;
      f.closest("dialog")?.close();
      if (ctx.state.campaignSection === "board") await renderCampaignBoard(ctx.els.main);
    });
  }

  function init(options) {
    ctx = options;
    const now = new Date();
    ctx.state.personalCal = ctx.state.personalCal || { year: now.getFullYear(), month: now.getMonth() + 1 };
    ctx.state.campaignCal = ctx.state.campaignCal || { year: now.getFullYear(), month: now.getMonth() + 1 };
    ctx.state.campaignSection = ctx.state.campaignSection || "play";
    ctx.state.eventDialogMode = "campaign";
    ctx.state.postDialogMode = "campaign";
    bind(options.root || document);
  }

  return {
    init,
    renderHomeSchedule,
    renderHomeBoard,
    renderCampaignSection,
    setCampaignSectionNav,
    openAvailabilityEditor,
    fmtEventWhen
  };
})();
