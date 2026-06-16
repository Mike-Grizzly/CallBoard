/* ============================================================
   shell.js — shared Proscene app shell for the reference pages.
   Injects the real left rail + a theme switcher into every page so
   each screen file only has to carry its own <main> content.

   A page provides:
     <div class="app"><main class="main"> … </main></div>
   and sets, on <body>:
     data-rail="dashboard"      → highlight a workspace nav item
     data-rail-prod="pirates"   → highlight a production in the rail
   Theme is persisted in localStorage so it survives navigation.
   ============================================================ */
(function () {
  var BRAND_INK =
    '<svg class="brand-badge is-light" viewBox="0 0 64 64" aria-hidden="true"><svg x="2.56" y="7.47" width="58.88" height="49.07" viewBox="0 0 240 200" overflow="visible"><defs><mask id="rcut1"><rect width="240" height="200" fill="white"/><g fill="black" stroke="black" stroke-width="9" stroke-linejoin="round"><polygon points="68,77 172,77 176,87 64,87"/><polygon points="56,116 184,116 190,130 50,130"/><polygon points="44,155 196,155 204,173 36,173"/></g></mask></defs><path d="M 30 184 L 30 74 Q 30 24 84 24 L 156 24 Q 210 24 210 74 L 210 184 Z" fill="#15181F" stroke="#15181F" stroke-width="12" stroke-linejoin="round" mask="url(#rcut1)"/></svg></svg>' +
    '<svg class="brand-badge is-dark" viewBox="0 0 64 64" aria-hidden="true"><svg x="2.56" y="7.47" width="58.88" height="49.07" viewBox="0 0 240 200" overflow="visible"><defs><mask id="rcut2"><rect width="240" height="200" fill="white"/><g fill="black" stroke="black" stroke-width="9" stroke-linejoin="round"><polygon points="68,77 172,77 176,87 64,87"/><polygon points="56,116 184,116 190,130 50,130"/><polygon points="44,155 196,155 204,173 36,173"/></g></mask></defs><path d="M 30 184 L 30 74 Q 30 24 84 24 L 156 24 Q 210 24 210 74 L 210 184 Z" fill="#F5F2EA" stroke="#F5F2EA" stroke-width="12" stroke-linejoin="round" mask="url(#rcut2)"/></svg></svg>';

  function ico(paths) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
  }
  var I = {
    dashboard: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    documents: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    announcements: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  };

  // [label, key, file]
  var WORKSPACE = [
    ["Dashboard", "dashboard", "Dashboard.html"],
    ["Calendar", "calendar", "Calendar.html"],
    ["Reports", "reports", "Reports.html", "3"],
    ["Documents", "documents", "Documents.html"],
    ["Announcements", "announcements", "Announcements.html"],
    ["Activity", "activity", "Activity.html"],
    ["People", "people", "People.html"],
  ];
  // [title, key, color, meta, file]
  var PRODUCTIONS = [
    ["The Pirates of Penzance", "pirates", "var(--accent)", "Wk 4", "Production - Overview.html"],
    ["A Midsummer Night's Dream", "midsummer", "var(--c-dusk)", "Wk 1", "Production - Overview.html"],
    ["Our Town", "ourtown", "var(--c-sage)", "Pre", "Production - Overview.html"],
  ];

  function buildRail() {
    var b = document.body;
    var activeKey = b.getAttribute("data-rail") || "";
    var activeProd = b.getAttribute("data-rail-prod") || "";

    var wsItems = WORKSPACE.map(function (it) {
      var badge = it[3] ? '<span class="badge">' + it[3] + "</span>" : "";
      return (
        '<a class="rail-item" data-active="' + (it[1] === activeKey ? "1" : "0") + '" href="' + it[2] + '">' +
        ico(I[it[1]]) + "<span>" + it[0] + "</span>" + badge + "</a>"
      );
    }).join("");

    var prodItems = PRODUCTIONS.map(function (p) {
      return (
        '<a class="prod-item" data-active="' + (p[1] === activeProd ? "1" : "0") + '" href="' + p[4] + '">' +
        '<span class="prod-dot" style="background:' + p[2] + '"></span>' +
        '<span class="truncate">' + p[0] + "</span>" +
        '<span class="prod-meta">' + p[3] + "</span></a>"
      );
    }).join("");

    var rail = document.createElement("aside");
    rail.className = "rail";
    rail.innerHTML =
      '<a class="rail-brand" href="index.html"><span class="rail-mark">' + BRAND_INK + '</span>' +
      '<span class="rail-name">Pro<em>scene</em></span></a>' +
      '<div class="workspace-badge"><button class="workspace-badge-button" type="button">' +
      '<span class="workspace-badge-logo" style="background:linear-gradient(135deg,var(--c-clay),var(--accent))"></span>' +
      '<span class="truncate">Harborlight Theatre Co.</span>' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink-4)"><path d="m6 9 6 6 6-6"/></svg>' +
      "</button></div>" +
      '<nav class="rail-section"><div class="rail-section-h"><span>Workspace</span></div>' + wsItems + "</nav>" +
      '<div class="rail-section"><div class="rail-section-h"><span>Productions</span>' +
      '<a href="New Production.html" title="New production" aria-label="New production">' +
      '<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></a></div>' +
      prodItems + "</div>" +
      '<div class="rail-foot"><div class="avatar">MR</div>' +
      '<div class="rail-foot-meta"><b>Mike Rivera</b><span>Stage Manager</span></div>' +
      '<button title="Theme" aria-label="Theme" data-theme-cycle>' +
      '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + I.theme + "</svg></button>" +
      '<a href="Settings.html" title="Settings" aria-label="Settings">' + ico(I.settings) + "</a></div>";
    return rail;
  }

  // ── Production header (topbar + tab strip) ──────────────────────────
  var PTABS = [
    ["Overview", "overview", "Production - Overview.html", '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>'],
    ["Rehearsal Reports", "reports", "Production - Reports.html", '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>', "3"],
    ["My Notes", "notes", "Production - Notes.html", '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'],
    ["Rehearsal Schedule", "schedule", "Production - Schedule.html", '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>'],
    ["Documents", "documents", "Production - Documents.html", '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>', "12"],
    ["Announcements", "announcements", "Production - Announcements.html", '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>', "4"],
    ["Rehearsal Video", "video", "Production - Video.html", '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9M12.4 3.4l3.1 4M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>', "6"],
    ["Blocking", "blocking", "Production - Blocking.html", '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>'],
    ["Your Script", "script", "Production - Script.html", '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'],
  ];

  function buildProductionHeader(activeTab) {
    var tabs = PTABS.map(function (t) {
      var count = t[4] ? '<span class="count">' + t[4] + "</span>" : "";
      return (
        '<a class="tab" data-active="' + (t[1] === activeTab ? "1" : "0") + '" href="' + t[2] + '">' +
        '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + t[3] + "</svg>" +
        "<span>" + t[0] + "</span>" + count + "</a>"
      );
    }).join("");

    var header = document.createElement("header");
    header.className = "topbar";
    header.innerHTML =
      '<div class="crumbs"><a href="Reports.html">Productions</a>' +
      '<svg class="sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
      '<span class="now">The Pirates of Penzance</span></div>' +
      '<div class="topbar-row"><div>' +
      '<h1 class="show-title">The Pirates of <em>Penzance</em></h1>' +
      '<div class="show-sub">' +
      '<span class="show-status" style="color:var(--c-sage)"><span class="dot" style="background:var(--c-sage)"></span>In rehearsal</span>' +
      '<span class="pip"></span><span>Opens Fri, Jun 27</span>' +
      '<span class="pip"></span><span>Closes Jul 13</span>' +
      '<span class="pip"></span><span>Dir. <b style="color:var(--ink-2); font-weight:500">Eleanor Voss</b></span>' +
      "</div></div>" +
      '<div class="topbar-actions">' +
      '<button type="button" class="btn ghost btn-icon" title="Search" aria-label="Search"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>' +
      '<button type="button" class="btn ghost btn-icon" title="Trash" aria-label="Trash"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
      '<a href="Production - Cast and Crew.html" class="btn"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Cast &amp; Crew</a>' +
      '<a href="Production - Reports.html" class="btn primary"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>New report</a>' +
      "</div></div>" +
      '<nav class="tabs" aria-label="Production sections">' + tabs + "</nav>";
    return header;
  }

  var THEMES = [
    ["light", "Warm"],
    ["dusk", "Dusk"],
    ["dark", "Dark"],
    ["cool", "Cool"],
  ];
  var STORE = "proscene-ref-theme";

  function applyTheme(t) {
    document.body.setAttribute("data-theme", t);
    try { localStorage.setItem(STORE, t); } catch (e) {}
    var sw = document.querySelector(".theme-switch");
    if (sw) {
      sw.querySelectorAll("button").forEach(function (btn) {
        btn.setAttribute("data-on", btn.getAttribute("data-theme-set") === t ? "1" : "0");
      });
    }
  }

  function buildThemeSwitch() {
    var current = document.body.getAttribute("data-theme") || "light";
    var sw = document.createElement("div");
    sw.className = "theme-switch";
    sw.setAttribute("role", "group");
    sw.setAttribute("aria-label", "Theme preview");
    sw.innerHTML = THEMES.map(function (t) {
      return '<button data-theme-set="' + t[0] + '" data-on="' + (t[0] === current ? "1" : "0") + '">' + t[1] + "</button>";
    }).join("");
    sw.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-theme-set]");
      if (btn) applyTheme(btn.getAttribute("data-theme-set"));
    });
    return sw;
  }

  function init() {
    // Restore persisted theme before painting the switch.
    var saved;
    try { saved = localStorage.getItem(STORE); } catch (e) {}
    if (saved) document.body.setAttribute("data-theme", saved);
    else if (!document.body.getAttribute("data-theme")) document.body.setAttribute("data-theme", "light");

    var app = document.querySelector(".app");
    if (app) app.insertBefore(buildRail(), app.firstChild);

    // Production pages: inject the shared topbar + tab strip.
    var prodTab = document.body.getAttribute("data-prod-tab");
    if (prodTab) {
      var main = document.querySelector(".main");
      if (main) main.insertBefore(buildProductionHeader(prodTab), main.firstChild);
    }

    document.body.appendChild(buildThemeSwitch());

    var tag = document.createElement("div");
    tag.className = "ref-tag";
    tag.textContent = document.body.getAttribute("data-ref-tag") || "Live shell · from running source";
    document.body.appendChild(tag);

    // Rail footer theme button cycles through the four themes.
    var cycle = document.querySelector("[data-theme-cycle]");
    if (cycle) {
      cycle.addEventListener("click", function () {
        var cur = document.body.getAttribute("data-theme") || "light";
        var idx = THEMES.findIndex(function (t) { return t[0] === cur; });
        applyTheme(THEMES[(idx + 1) % THEMES.length][0]);
      });
    }

    // Reusable modal / drawer open-close. Any element with
    // [data-modal-open="id"] opens the .ref-scrim with that id; clicking the
    // backdrop or any [data-modal-close] closes it. Esc closes the top one.
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-modal-open]");
      if (opener) {
        var s = document.getElementById(opener.getAttribute("data-modal-open"));
        if (s) { s.setAttribute("data-open", "1"); e.preventDefault(); }
        return;
      }
      var closer = e.target.closest("[data-modal-close]");
      if (closer) {
        var sc = closer.closest(".ref-scrim");
        if (sc) sc.setAttribute("data-open", "0");
        return;
      }
      if (e.target.classList && e.target.classList.contains("ref-scrim")) {
        e.target.setAttribute("data-open", "0");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll('.ref-scrim[data-open="1"]').forEach(function (s) {
          s.setAttribute("data-open", "0");
        });
      }
    });

    // If a page wants a modal open on load (to showcase it), honor
    // <body data-open-modal="id">.
    var pre = document.body.getAttribute("data-open-modal");
    if (pre) { var ps = document.getElementById(pre); if (ps) ps.setAttribute("data-open", "1"); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
