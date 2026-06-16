/* ============================================================
   focus-view.js — Focus View interactions for Script & Blocking.
   Plain JS, no deps. State (mode, tool, page, zoom, margin, theme,
   panel tab, layer visibility) persists in localStorage so refreshes
   during an editing session don't lose your place.
   ============================================================ */
(function () {
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem("fx-" + k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("fx-" + k, v); } catch (e) {} }
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;

  /* ── Theme (shares Proscene's reference theme key) ── */
  (function () {
    var saved;
    try { saved = localStorage.getItem("proscene-ref-theme"); } catch (e) {}
    body.setAttribute("data-theme", saved || "light");
    var cycle = $("[data-theme-cycle]");
    var THEMES = ["light", "dusk", "dark", "cool"];
    if (cycle) cycle.addEventListener("click", function () {
      var cur = body.getAttribute("data-theme") || "light";
      var next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      body.setAttribute("data-theme", next);
      try { localStorage.setItem("proscene-ref-theme", next); } catch (e) {}
    });
  })();

  /* ── Toast ── */
  var toastEl = $("#fx-toast"), toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.setAttribute("data-show", "1"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.setAttribute("data-show", "0"); }, 1700); }

  /* ── Mode: Script ⇄ Blocking ── */
  function setMode(m) {
    body.setAttribute("data-mode", m);
    LS.set("mode", m);
    $$(".fx-modeswitch:not(.fx-viewswitch) button").forEach(function (b) { b.setAttribute("data-on", b.dataset.mode === m ? "1" : "0"); });
    // first tool of the active rail becomes selected if none visible is on
    var visTools = $$('.fx-tool[data-modes~="' + m + '"]');
    if (visTools.length && !visTools.some(function (t) { return t.getAttribute("data-on") === "1"; })) {
      $$(".fx-tool").forEach(function (t) { t.setAttribute("data-on", "0"); });
      visTools[0].setAttribute("data-on", "1");
    }
    if (m === "script") requestAnimationFrame(drawLeaders);
  }
  $$(".fx-modeswitch:not(.fx-viewswitch) button").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.dataset.mode); toast(b.dataset.mode === "script" ? "Script editor" : "Blocking editor"); });
  });

  /* ── Tool rail selection ── */
  document.addEventListener("click", function (e) {
    var tool = e.target.closest(".fx-tool");
    if (tool) {
      var m = body.getAttribute("data-mode");
      $$('.fx-tool[data-modes~="' + m + '"]').forEach(function (t) { t.setAttribute("data-on", t === tool ? "1" : "0"); });
      var lab = tool.querySelector(".lab");
      if (lab) toast(lab.childNodes[0].textContent.trim());
    }
    var sw = e.target.closest(".fx-swatch");
    if (sw) { $$(".fx-swatch").forEach(function (s) { s.setAttribute("data-on", s === sw ? "1" : "0"); }); }
  });

  /* ── Margin view toggle ── */
  var marginToggle = $("#fx-margin-toggle");
  function setMargin(on) {
    body.classList.toggle("fx-margin-off", !on);
    if (marginToggle) marginToggle.setAttribute("data-on", on ? "1" : "0");
    LS.set("margin", on ? "1" : "0");
    applyZoom(); // sheet width changes (620 ⇄ 924) → refit, then redraw leaders
  }
  if (marginToggle) marginToggle.addEventListener("click", function () {
    setMargin(body.classList.contains("fx-margin-off")); // currently off → turn on
  });

  /* ── Thumbnails / page navigation / zoom ── */
  var TOTAL = 64;
  var page = parseInt(LS.get("page", "8"), 10) || 8;
  var zoom = parseFloat(LS.get("zoom", "1")) || 1;
  var appliedScale = 1; // zoom × fit-to-width factor (what's actually on the transform)
  var sheet = $("#fx-sheet");
  var sheetWrap = $("#fx-sheet-wrap");
  var scriptEl = $(".fx-script");
  var pageCount = $("#fx-pagecount");
  var zoomLbl = $("#fx-zoomlabel");
  var pnoEl = $("#fx-pno");

  function applyZoom() {
    if (sheet) {
      // fit so the page (+ margin column, when shown) is never clipped horizontally
      var avail = scriptEl ? scriptEl.clientWidth - 64 : sheet.offsetWidth;
      var fit = Math.min(1, avail / sheet.offsetWidth);
      appliedScale = zoom * fit;
      sheet.style.transform = "scale(" + appliedScale + ")";
      // transforms don't shrink layout — size the wrapper to the scaled box so it
      // centers correctly and doesn't force horizontal scroll.
      if (sheetWrap) {
        sheetWrap.style.width = (sheet.offsetWidth * appliedScale) + "px";
        sheetWrap.style.height = (sheet.offsetHeight * appliedScale) + "px";
      }
    }
    if (zoomLbl) zoomLbl.textContent = Math.round(zoom * 100) + "%";
    LS.set("zoom", String(zoom));
    requestAnimationFrame(drawLeaders);
  }
  function applyPage() {
    if (pageCount) pageCount.textContent = page + " / " + TOTAL;
    if (pnoEl) pnoEl.textContent = "p. " + page;
    $$(".fx-thumb").forEach(function (t) { t.setAttribute("data-on", parseInt(t.dataset.page, 10) === page ? "1" : "0"); });
    LS.set("page", String(page));
  }
  function goPage(p) { page = Math.max(1, Math.min(TOTAL, p)); applyPage(); }

  $("#fx-prev") && $("#fx-prev").addEventListener("click", function () { goPage(page - 1); });
  $("#fx-next") && $("#fx-next").addEventListener("click", function () { goPage(page + 1); });
  $("#fx-zoomout") && $("#fx-zoomout").addEventListener("click", function () { zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10); applyZoom(); });
  $("#fx-zoomin") && $("#fx-zoomin").addEventListener("click", function () { zoom = Math.min(1.8, Math.round((zoom + 0.1) * 10) / 10); applyZoom(); });
  $$(".fx-thumb").forEach(function (t) {
    t.addEventListener("click", function () { goPage(parseInt(t.dataset.page, 10)); toast("Page " + t.dataset.page); });
  });

  /* ── Right panel tabs (per mode) ── */
  document.addEventListener("click", function (e) {
    var tab = e.target.closest(".fx-ptab");
    if (!tab) return;
    var group = tab.closest(".fx-ptabs");
    $$(".fx-ptab", group).forEach(function (b) { b.setAttribute("data-on", b === tab ? "1" : "0"); });
    var pane = tab.dataset.pane;
    $$(".fx-ppane[data-group='" + group.dataset.group + "']").forEach(function (p) { p.setAttribute("data-on", p.dataset.pane === pane ? "1" : "0"); });
  });

  /* ── Layers: eye visibility + active layer ── */
  var HL_CLASS = { hl: "fx-hide-hl", note: "fx-hide-note", cue: "fx-hide-cue", ai: "fx-hide-ai" };
  // apply any layers that start hidden
  $$(".fx-layer[data-vis='0']").forEach(function (l) { if (HL_CLASS[l.dataset.layer]) body.classList.add(HL_CLASS[l.dataset.layer]); });
  document.addEventListener("click", function (e) {
    var eye = e.target.closest(".fx-layer .eye");
    if (eye) {
      e.stopPropagation();
      var layer = eye.closest(".fx-layer");
      var vis = layer.getAttribute("data-vis") !== "0";
      layer.setAttribute("data-vis", vis ? "0" : "1");
      var key = layer.dataset.layer;
      if (HL_CLASS[key]) body.classList.toggle(HL_CLASS[key], vis); // now hidden
      eye.innerHTML = vis ? EYE_OFF : EYE_ON;
      return;
    }
    var layer = e.target.closest(".fx-layer");
    if (layer && !e.target.closest(".more")) {
      $$(".fx-layer").forEach(function (l) { l.setAttribute("data-active", l === layer ? "1" : "0"); });
      // reflect in rail foot chip
      var chip = $("#fx-active-chip");
      if (chip && layer.dataset.short) {
        var sw = layer.querySelector(".swatch");
        chip.querySelector(".dot").style.background = sw ? getComputedStyle(sw).background : "";
        chip.querySelector(".txt").innerHTML = layer.dataset.short;
      }
    }
  });
  var EYE_ON = '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M2 2l20 20M6.7 6.7C4 8.4 2 12 2 12s4 7 10 7c1.7 0 3.2-.4 4.6-1.1M9.9 5.2A9.7 9.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-2.2 2.9"/></svg>';

  /* ── Bookmarks / scenes / beats selection ── */
  document.addEventListener("click", function (e) {
    var bm = e.target.closest(".fx-bm");
    if (bm) { $$(".fx-bm").forEach(function (b) { b.setAttribute("data-on", b === bm ? "1" : "0"); }); if (bm.dataset.page) goPage(parseInt(bm.dataset.page, 10)); toast("Jumped to " + bm.querySelector("span").textContent); return; }
    var scene = e.target.closest(".fx-scene");
    if (scene) { $$(".fx-scene").forEach(function (s) { s.setAttribute("data-on", s === scene ? "1" : "0"); }); return; }
    var beat = e.target.closest(".fx-beat");
    if (beat) { $$(".fx-beat").forEach(function (b) { b.setAttribute("data-on", b === beat ? "1" : "0"); }); var bt = $("#fx-bk-beat"); if (bt) bt.textContent = beat.dataset.label || beat.textContent.trim(); return; }
  });

  /* ── View switch: Script ⇄ Cue sheet ── */
  function setView(v) {
    body.classList.toggle("fx-view-cues", v === "cues");
    LS.set("view", v);
    $$("#fx-viewswitch button").forEach(function (b) { b.setAttribute("data-on", b.dataset.view === v ? "1" : "0"); });
    if (v === "page") requestAnimationFrame(drawLeaders);
  }
  $$("#fx-viewswitch button").forEach(function (b) {
    b.addEventListener("click", function () { setView(b.dataset.view); toast(b.dataset.view === "cues" ? "Cue sheet" : "Script"); });
  });

  /* ── Bookmarks: Scenes / Songs toggle (matches live window) ── */
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".sv-bm-tab");
    if (!t) return;
    var view = t.dataset.bmview;
    $$(".sv-bm-tab").forEach(function (b) { var on = b === t; b.setAttribute("data-active", on ? "1" : "0"); b.classList.toggle("active", on); });
    $$(".fx-bmlist").forEach(function (l) { l.hidden = l.dataset.bmview !== view; });
  });

  /* ── Leader lines (script margin) ── */
  var leaders = $("#fx-leaders");
  function drawLeaders() {
    if (!leaders) return;
    // Only blank the SVG when we're genuinely not showing margin leaders.
    if (!sheet || body.getAttribute("data-mode") !== "script" ||
        body.classList.contains("fx-margin-off") || body.classList.contains("fx-view-cues")) {
      leaders.innerHTML = "";
      return;
    }
    var marginEl = document.querySelector(".fx-margin");
    var pageEl = $("#fx-page");
    if (!marginEl || !pageEl) return;
    var w = sheet.offsetWidth, h = sheet.offsetHeight;
    if (!w || !h) return; // not laid out yet — keep any prior good draw, don't clear

    leaders.setAttribute("width", w); leaders.setAttribute("height", h);
    leaders.style.width = w + "px"; leaders.style.height = h + "px";

    var z = appliedScale || 1;
    var sheetRect = sheet.getBoundingClientRect();
    // left edge of the margin column, in the sheet's own (unscaled) coordinate space
    var marginLeft = (marginEl.getBoundingClientRect().left - sheetRect.left) / z;
    var marginTop = marginEl.offsetTop;

    var items = $$(".fx-mcard")
      .filter(function (c) { return c.offsetParent !== null; })
      .map(function (card) {
        var anchor = document.getElementById(card.dataset.anchor);
        var ax = 0, ay = 0;
        if (anchor) {
          var ar = anchor.getBoundingClientRect();
          ax = (ar.right - sheetRect.left) / z;
          ay = (ar.top + ar.height / 2 - sheetRect.top) / z;
        }
        return { card: card, anchor: anchor, ax: ax, ay: ay };
      })
      .sort(function (a, b) { return a.ay - b.ay; });

    var prevBottom = 0, svg = "";
    items.forEach(function (it) {
      var desired = Math.max(it.ay - 16, prevBottom + 10);
      it.card.style.top = (desired - marginTop) + "px";
      prevBottom = desired + it.card.offsetHeight;
      if (!it.anchor) return;
      var sx = it.ax, sy = it.ay, ey = desired + 18;
      var elbow = Math.max(sx + 16, marginLeft - 26);
      svg += '<path d="M ' + sx + ' ' + sy + ' H ' + elbow + ' V ' + ey + ' H ' + marginLeft + '"/>';
      svg += '<circle ' + (it.card.classList.contains("note") ? 'class="note" ' : '') + 'cx="' + sx + '" cy="' + sy + '" r="3"/>';
    });
    leaders.innerHTML = svg;
  }

  /* ── Drag margin cards (vertical nudge) ── */
  (function () {
    var drag = null;
    document.addEventListener("pointerdown", function (e) {
      var card = e.target.closest(".fx-mcard");
      if (!card) return;
      drag = { card: card, startY: e.clientY, startTop: parseFloat(card.style.top) || 0 };
      card.classList.add("dragging");
      card.setPointerCapture(e.pointerId);
    });
    document.addEventListener("pointermove", function (e) {
      if (!drag) return;
      drag.card.style.top = (drag.startTop + (e.clientY - drag.startY) / (appliedScale || 1)) + "px";
      drawLeadersLight(drag.card);
    });
    document.addEventListener("pointerup", function () {
      if (!drag) return;
      drag.card.classList.remove("dragging");
      drag = null;
      drawLeaders();
    });
    // lighter recompute while dragging one card (don't re-layout others)
    function drawLeadersLight(card) {
      var marginEl = document.querySelector(".fx-margin");
      if (!marginEl || !leaders) return;
      var z = appliedScale || 1;
      var sheetRect = sheet.getBoundingClientRect();
      var marginLeft = (marginEl.getBoundingClientRect().left - sheetRect.left) / z;
      var marginTop = marginEl.offsetTop;
      var svg = "";
      $$(".fx-mcard").forEach(function (c) {
        if (c.offsetParent === null) return;
        var a = document.getElementById(c.dataset.anchor);
        if (!a) return;
        var ar = a.getBoundingClientRect();
        var sx = (ar.right - sheetRect.left) / z;
        var sy = (ar.top + ar.height / 2 - sheetRect.top) / z;
        var ey = (parseFloat(c.style.top) || 0) + marginTop + 18;
        var elbow = Math.max(sx + 16, marginLeft - 26);
        svg += '<path d="M ' + sx + ' ' + sy + ' H ' + elbow + ' V ' + ey + ' H ' + marginLeft + '"/>';
        svg += '<circle ' + (c.classList.contains("note") ? 'class="note" ' : '') + 'cx="' + sx + '" cy="' + sy + '" r="3"/>';
      });
      leaders.innerHTML = svg;
    }
  })();

  /* ── Blocking: drag tokens & set pieces ── */
  (function () {
    var stage = $("#fx-bk-stage");
    if (!stage) return;
    var drag = null;
    stage.addEventListener("pointerdown", function (e) {
      var el = e.target.closest(".fx-token, .fx-setpiece");
      if (!el) return;
      drag = { el: el, moved: false };
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag) return;
      if (!drag.moved) { drag.moved = true; if (window.__fxCommit) window.__fxCommit(); } // snapshot before first move
      var r = stage.getBoundingClientRect();
      var x = Math.max(3, Math.min(97, ((e.clientX - r.left) / r.width) * 100));
      var y = Math.max(4, Math.min(96, ((e.clientY - r.top) / r.height) * 100));
      drag.el.style.left = x + "%";
      drag.el.style.top = y + "%";
    });
    function end() { if (drag) { drag.el.classList.remove("dragging"); drag = null; } }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    // double-click removes a placed element
    stage.addEventListener("dblclick", function (e) {
      var el = e.target.closest(".fx-token, .fx-setpiece");
      if (!el) return;
      if (window.__fxCommit) window.__fxCommit();
      var nm = (el.querySelector(".fx-token-lab") || {}).textContent || el.textContent || "Element";
      el.remove();
      toast("Removed " + nm.trim());
    });
  })();

  /* ── Blocking: scenery & cast library + undo / redo ── */
  (function () {
    var stage = $("#fx-bk-stage");
    if (!stage) return;
    var undoBtn = $("#fx-undo"), redoBtn = $("#fx-redo");
    var undoStack = [], redoStack = [];

    function snapshot() { return $$(".fx-token, .fx-setpiece", stage).map(function (el) { return el.outerHTML; }); }
    function restore(snap) {
      $$(".fx-token, .fx-setpiece", stage).forEach(function (el) { el.remove(); });
      snap.forEach(function (html) { stage.insertAdjacentHTML("beforeend", html); });
    }
    function sync() { if (undoBtn) undoBtn.disabled = !undoStack.length; if (redoBtn) redoBtn.disabled = !redoStack.length; }
    function commit() { undoStack.push(snapshot()); if (undoStack.length > 60) undoStack.shift(); redoStack = []; sync(); }
    window.__fxCommit = commit;

    if (undoBtn) undoBtn.addEventListener("click", function () {
      if (!undoStack.length) return;
      redoStack.push(snapshot()); restore(undoStack.pop()); sync(); toast("Undo");
    });
    if (redoBtn) redoBtn.addEventListener("click", function () {
      if (!redoStack.length) return;
      undoStack.push(snapshot()); restore(redoStack.pop()); sync(); toast("Redo");
    });
    document.addEventListener("keydown", function (e) {
      if (body.getAttribute("data-mode") !== "blocking") return;
      if (/input|textarea/i.test(e.target.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) { redoBtn && redoBtn.click(); } else { undoBtn && undoBtn.click(); }
      }
    });
    sync();

    /* drag a library item onto the stage to place it */
    var ghost = null, data = null;
    $$(".fx-lib-item").forEach(function (item) {
      item.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        data = { kind: item.dataset.kind, init: item.dataset.init, name: item.dataset.name, color: item.dataset.color };
        ghost = document.createElement("div");
        ghost.className = "fx-lib-ghost";
        ghost.innerHTML = data.kind === "actor"
          ? '<div class="fx-token-dot" style="background:' + data.color + '">' + data.init + '</div>'
          : '<div class="fx-setpiece" style="position:static;transform:none;">' + data.name + '</div>';
        document.body.appendChild(ghost);
        ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px";
        stage.classList.add("drop-armed");
        item.setPointerCapture(e.pointerId);
      });
      item.addEventListener("pointermove", function (e) {
        if (!ghost) return;
        ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px";
      });
      item.addEventListener("pointerup", function (e) {
        if (!ghost) return;
        var r = stage.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          commit();
          var x = Math.max(3, Math.min(97, ((e.clientX - r.left) / r.width) * 100));
          var y = Math.max(4, Math.min(96, ((e.clientY - r.top) / r.height) * 100));
          var el = document.createElement("div");
          el.style.left = x + "%"; el.style.top = y + "%";
          if (data.kind === "actor") {
            el.className = "fx-token";
            el.innerHTML = '<div class="fx-token-dot" style="background:' + data.color + '">' + data.init + '</div><div class="fx-token-lab">' + data.name + '</div>';
          } else {
            el.className = "fx-setpiece";
            el.textContent = data.name;
          }
          stage.appendChild(el);
          toast(data.name + " placed");
        }
        ghost.remove(); ghost = null; data = null;
        stage.classList.remove("drop-armed");
      });
      item.addEventListener("pointercancel", function () { if (ghost) { ghost.remove(); ghost = null; data = null; stage.classList.remove("drop-armed"); } });
    });
  })();

  /* ── Shortcuts popover ── */
  var sc = $("#fx-shortcuts");
  $("#fx-help") && $("#fx-help").addEventListener("click", function () { if (sc) sc.setAttribute("data-open", sc.getAttribute("data-open") === "1" ? "0" : "1"); });

  /* ── Exit focus ── */
  function exitFocus() {
    var m = body.getAttribute("data-mode");
    window.location.href = m === "blocking" ? "Production - Blocking.html" : "Production - Script.html";
  }
  $("#fx-exit") && $("#fx-exit").addEventListener("click", exitFocus);
  $("#fx-note-exit") && $("#fx-note-exit").addEventListener("click", exitFocus);

  /* ── Keyboard ── */
  document.addEventListener("keydown", function (e) {
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === "Escape") {
      if (sc && sc.getAttribute("data-open") === "1") { sc.setAttribute("data-open", "0"); return; }
      exitFocus(); return;
    }
    if (e.key === "?") { if (sc) sc.setAttribute("data-open", sc.getAttribute("data-open") === "1" ? "0" : "1"); return; }
    if (body.getAttribute("data-mode") === "script") {
      if (e.key === "[") { goPage(page - 1); }
      else if (e.key === "]") { goPage(page + 1); }
      else if (e.key === "=" || e.key === "+") { zoom = Math.min(1.8, Math.round((zoom + 0.1) * 10) / 10); applyZoom(); }
      else if (e.key === "-") { zoom = Math.max(0.6, Math.round((zoom - 0.1) * 10) / 10); applyZoom(); }
      else if (e.key.toLowerCase() === "m") { setMargin(body.classList.contains("fx-margin-off")); }
      else if (e.key.toLowerCase() === "u") { setView(body.classList.contains("fx-view-cues") ? "page" : "cues"); }
    }
    if (e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey)) return;
    if (e.key.toLowerCase() === "b" && !e.metaKey && !e.ctrlKey) { setMode("blocking"); }
    else if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) { setMode("script"); }
  });

  /* ── Init from persisted state ── */
  var urlMode = new URLSearchParams(location.search).get("mode");
  setMode(urlMode === "blocking" || urlMode === "script" ? urlMode : LS.get("mode", "script"));
  setMargin(LS.get("margin", "1") === "1");
  setView(LS.get("view", "page"));
  applyZoom();
  applyPage();
  window.addEventListener("resize", function () { applyZoom(); });
  // initial draw after fonts/layout settle
  requestAnimationFrame(function () { requestAnimationFrame(drawLeaders); });
  setTimeout(drawLeaders, 250);
})();
