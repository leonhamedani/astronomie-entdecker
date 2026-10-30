/* Astronomie Entdecker – Lernkurs: Schritt-für-Schritt-Lektionen mit Fortschritt (v10) */
(function () {
  'use strict';
  var root = document.getElementById('kurs');
  if (!root) return;
  var KEY = 'ae-kurs-v1';
  var LV = { 1: { n: 'Einsteiger', ic: '🌱', d: 'Ohne Vorwissen: Orientierung, die ersten Sternbilder, deine Augen und die erste Nacht unterm Sternenhimmel.' },
             2: { n: 'Fortgeschritten', ic: '🔭', d: 'Teleskope verstehen und auswählen, Himmelsobjekte im Detail, erste Astrofotos und dunkle Orte.' },
             3: { n: 'Experte', ic: '🎓', d: 'Rechnen wie die Profis: Okulare, Belichtungszeiten, Star-Hopping und Himmelshelligkeit in Zahlen.' } };
  var arts = [].slice.call(root.querySelectorAll('article.lesson'));
  var lessons = arts.map(function (el, i) {
    return { id: el.getAttribute('data-lesson'), el: el, i: i, lvl: +el.getAttribute('data-level'), min: +el.getAttribute('data-min'),
      ic: el.getAttribute('data-icon'), title: el.querySelector('h2').textContent.replace(el.getAttribute('data-icon'), '').trim(),
      aliases: (el.getAttribute('data-aliases') || '').split(/\s+/).filter(Boolean) };
  });
  var byId = {}, alias = {};
  lessons.forEach(function (l) { byId[l.id] = l; alias[l.id] = l.id; l.aliases.forEach(function (a) { alias[a] = l.id; alias[a.replace(/^fold-/, '')] = l.id; alias['fold-' + a.replace(/^fold-/, '')] = l.id; }); });
  /* alte Abschnitts-Anker → Lektion */
  var OLD = { 'sterne-lesen': 'lernpfad', 'einsteiger': 'teleskop-bauteile', 'ratgeber': 'teleskop-typen', 'scope-typen': 'teleskop-typen', 'scope-tabelle': 'teleskop-typen',
    'rechner': 'okular-rechner', 'okular-rechner': 'okular-rechner', 'himmelsobjekte': 'himmelsobjekte', 'objekte': 'himmelsobjekte', 'astrofoto': 'handy-foto', 'foto-schritte': 'handy-foto',
    'dunkler-himmel': 'bortle', 'bortle': 'bortle', 'hand': 'hand-trick', 'find': 'mini-spiel', 'pro-tipps': 'profi-tipps', 'apps': 'apps', 'compare': 'linse-spiegel',
    'games': 'bau-puzzle', 'obs-tipps': 'erste-nacht', 'scope-quiz': 'teleskop-quiz', 'okular-begriffe': 'okulare', 'foto-motive': 'foto-motive', 'belichtung': 'belichtung',
    'dunkle-orte': 'dunkle-orte', 'sternenparks': 'sternenparks', 'quiz': 'sternen-quiz' };
  Object.keys(OLD).forEach(function (k) { alias[k] = OLD[k]; alias['fold-' + k] = OLD[k]; });

  var done = {};
  try { (JSON.parse(localStorage.getItem(KEY) || '{}').done || []).forEach(function (id) { if (byId[id]) done[id] = 1; }); } catch (e) {}
  var last = null;
  try { last = JSON.parse(localStorage.getItem(KEY) || '{}').last || null; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ done: Object.keys(done), last: last })); } catch (e) {} }

  var ov = document.getElementById('courseOverview'), nav = document.getElementById('lessonNav');
  var bPrev = document.getElementById('lnPrev'), bNext = document.getElementById('lnNext'), bDone = document.getElementById('lnDone');
  var cur = null;
  root.classList.add('js');

  function lvStats(lvl) {
    var ls = lessons.filter(function (l) { return l.lvl === lvl; }), d = ls.filter(function (l) { return done[l.id]; }).length;
    return { n: ls.length, d: d, p: Math.round(d / ls.length * 100), first: ls[0], next: ls.filter(function (l) { return !done[l.id]; })[0] };
  }
  function nextOpen() { return lessons.filter(function (l) { return !done[l.id]; })[0]; }

  /* ---------- Übersicht ---------- */
  function buildOverview() {
    var nx = nextOpen(), lastL = last && byId[last], h = '';
    var total = Object.keys(done).length;
    h += '<div class="co-intro glass"><div><p class="eyebrow">So funktioniert der Kurs</p><p>Die Lektionen bauen aufeinander auf – von leicht nach schwer. Du kannst aber jederzeit zu jeder Lektion springen. Markiere Lektionen als erledigt (oder klicke einfach auf „Weiter“), dann wächst dein Fortschrittsbalken.</p></div>' +
      '<div class="co-cta">' + (nx ? '<a class="btn btn-primary" href="#lektion-' + nx.id + '">' + (total ? '▶ Weiterlernen: ' + AE.esc(nx.title) : '▶ Kurs starten') + '</a>' : '<span class="co-all">🏆 Alle Lektionen geschafft!</span>') +
      (lastL && (!nx || lastL.id !== nx.id) ? '<a class="btn btn-ghost" href="#lektion-' + lastL.id + '">Zuletzt: ' + AE.esc(lastL.title) + '</a>' : '') + '</div></div>';
    h += '<div class="co-levels">';
    [1, 2, 3].forEach(function (lvl) {
      var s = lvStats(lvl), mins = lessons.filter(function (l) { return l.lvl === lvl; }).reduce(function (a, l) { return a + l.min; }, 0);
      h += '<div class="co-level glass lv' + lvl + (s.d === s.n ? ' complete' : '') + '" id="stufe-' + lvl + '">' +
        '<div class="co-lv-head"><span class="co-lv-ic" aria-hidden="true">' + LV[lvl].ic + '</span><div><p class="eyebrow">Stufe ' + lvl + '</p><h3>' + LV[lvl].n + '</h3></div>' +
        '<span class="co-lv-pct">' + (s.d === s.n ? '✓ ' : '') + s.p + ' %</span></div>' +
        '<p class="muted small">' + LV[lvl].d + '</p><p class="small co-lv-meta">' + s.n + ' Lektionen · ca. ' + mins + ' Min. · ' + s.d + ' erledigt</p>' +
        '<div class="cb-bar small-bar"><span class="cb-fill" style="width:' + s.p + '%"></span></div><ol class="co-list">';
      lessons.forEach(function (l) {
        if (l.lvl !== lvl) return;
        h += '<li class="' + (done[l.id] ? 'done' : '') + (nx && nx.id === l.id ? ' next' : '') + '"><a href="#lektion-' + l.id + '"><span class="co-num">' + (done[l.id] ? '✓' : l.i + 1) + '</span>' +
          '<span class="co-t">' + l.ic + ' ' + AE.esc(l.title) + '</span><span class="co-min">' + l.min + ' Min.</span></a></li>';
      });
      h += '</ol></div>';
    });
    h += '</div><p class="center-note"><button class="btn btn-ghost small-btn" type="button" id="courseReset">↺ Fortschritt zurücksetzen</button></p>';
    ov.innerHTML = h;
    document.getElementById('courseReset').addEventListener('click', function () {
      if (!confirm('Kursfortschritt wirklich zurücksetzen?')) return;
      done = {}; last = null; save(); buildOverview(); updateBar(); AE.toast && AE.toast('Fortschritt zurückgesetzt');
    });
  }

  /* ---------- Fortschrittsleiste ---------- */
  var cbLevels = document.getElementById('cbLevels');
  cbLevels.innerHTML = [1, 2, 3].map(function (lvl) {
    return '<a class="cb-lv lv' + lvl + '" href="#stufe-' + lvl + '" data-lv="' + lvl + '"><span class="cb-lv-n">' + LV[lvl].ic + ' <span class="cb-lv-name">' + LV[lvl].n + '</span></span><span class="cb-lv-p"></span><span class="cb-mini"><span></span></span></a>';
  }).join('');
  function updateBar() {
    var d = Object.keys(done).length, n = lessons.length, p = Math.round(d / n * 100);
    document.getElementById('cbFill').style.width = p + '%';
    document.getElementById('cbPct').textContent = p + ' %';
    var title = document.getElementById('cbTitle'), sub = document.getElementById('cbSub');
    if (cur) {
      var s = lvStats(cur.lvl);
      title.textContent = 'Lektion ' + (cur.i + 1) + ' von ' + n;
      sub.textContent = LV[cur.lvl].n + ' ' + s.p + ' % · gesamt ' + d + '/' + n + ' erledigt';
    } else {
      title.textContent = 'Dein Lernkurs';
      sub.textContent = d + ' von ' + n + ' Lektionen abgeschlossen';
    }
    [1, 2, 3].forEach(function (lvl) {
      var s = lvStats(lvl), a = cbLevels.querySelector('[data-lv="' + lvl + '"]');
      a.querySelector('.cb-lv-p').textContent = s.p + ' %';
      a.querySelector('.cb-mini span').style.width = s.p + '%';
      a.classList.toggle('complete', s.d === s.n);
      a.classList.toggle('current', !!cur && cur.lvl === lvl);
    });
    if (cur) {
      var isDone = !!done[cur.id];
      bDone.setAttribute('aria-pressed', isDone ? 'true' : 'false');
      bDone.textContent = isDone ? '✓ Erledigt' : '○ Als erledigt markieren';
      bDone.classList.toggle('on', isDone);
    }
  }

  /* ---------- Feier bei abgeschlossener Stufe ---------- */
  function celebrate(lvl) {
    var el = document.createElement('div');
    el.className = 'lv-celebrate glass lv' + lvl;
    el.setAttribute('role', 'status');
    var nextLv = LV[lvl + 1];
    el.innerHTML = '<div class="lvc-ic">' + LV[lvl].ic + '</div><p class="eyebrow">Stufe ' + lvl + ' geschafft!</p><h3>' + LV[lvl].n + ' – 100 %</h3>' +
      '<p class="muted small">' + (nextLv ? 'Stark! Bereit für Stufe ' + (lvl + 1) + ' · ' + nextLv.n + '?' : 'Du hast den ganzen Kurs abgeschlossen – Respekt, Astro-Experte! 🏆') + '</p>' +
      '<button class="btn btn-primary small-btn" type="button">Weiter geht’s</button>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    if (AE.confetti && !AE.reduceMotion) AE.confetti(el);
    var close = function () { el.classList.remove('in'); setTimeout(function () { el.remove(); }, 400); };
    el.querySelector('button').addEventListener('click', close);
    setTimeout(close, 6000);
  }
  function setDone(l, v) {
    var before = lvStats(l.lvl).d === lvStats(l.lvl).n;
    if (v) done[l.id] = 1; else delete done[l.id];
    save(); updateBar();
    var after = lvStats(l.lvl).d === lvStats(l.lvl).n;
    if (!before && after) celebrate(l.lvl);
  }

  /* ---------- Anzeige ---------- */
  var reveal = function (el) { [].forEach.call(el.querySelectorAll('.reveal:not(.in)'), function (r) { r.classList.add('in'); }); };
  function show(id, opts) {
    opts = opts || {};
    var l = id ? byId[id] : null;
    if (cur && (!l || l.id !== cur.id)) { cur.el.classList.remove('active'); AE.emit && AE.emit('lessonhide', cur.id); }
    cur = l;
    root.classList.toggle('in-lesson', !!l);
    document.documentElement.classList.toggle('ae-in-lesson', !!l);
    nav.hidden = !l;
    if (!l) {
      buildOverview(); updateBar();
      if (opts.level) { var t = document.getElementById('stufe-' + opts.level); if (t) t.scrollIntoView({ block: 'start' }); }
      else if (opts.scroll) root.scrollIntoView({ block: 'start' });
      return;
    }
    l.el.classList.add('active');
    reveal(l.el);
    last = l.id; save();
    var prev = lessons[l.i - 1], next = lessons[l.i + 1];
    bPrev.disabled = !prev;
    bPrev.title = prev ? prev.title : '';
    bNext.querySelector('span').textContent = next ? 'Weiter' : 'Kurs abschließen';
    bNext.title = next ? next.title : 'Zur Übersicht';
    updateBar();
    if (opts.scroll !== false) {
      var y = root.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
    }
    /* Interaktive Elemente in der jetzt sichtbaren Lektion neu vermessen/starten */
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); AE.emit && AE.emit('lesson', l.id); });
    if (l.id === 'himmelshelligkeit') buildTable();
  }
  function go(id, push) {
    var h = id ? '#lektion-' + id : '#kurs';
    if (location.hash !== h) { if (push === false) history.replaceState(null, '', h); else history.pushState(null, '', h); }
    show(id, { scroll: true });
  }
  AE.gotoLesson = function (id) { go(alias[id] || id); };
  AE._course = { lessons: lessons, show: show, go: go, done: function () { return Object.keys(done); }, alias: alias };

  function route(initial) {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (/^lektion-/.test(h)) { var id = h.slice(8); if (byId[id]) return show(id); if (alias[id]) return go(alias[id], false); }
    if (/^stufe-[123]$/.test(h)) return show(null, { level: h.slice(6) });
    if (h && alias[h]) return go(alias[h], false);
    show(null, { scroll: !initial && h === 'kurs' });
  }
  window.addEventListener('hashchange', function () { route(false); });
  window.addEventListener('popstate', function () { route(false); });

  bPrev.addEventListener('click', function () { if (cur && cur.i > 0) go(lessons[cur.i - 1].id); });
  bNext.addEventListener('click', function () {
    if (!cur) return;
    var l = cur;
    if (!done[l.id]) setDone(l, true);
    var n = lessons[l.i + 1];
    go(n ? n.id : null);
  });
  bDone.addEventListener('click', function () { if (cur) setDone(cur, !done[cur.id]); });
  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-course-home]')) { e.preventDefault(); go(null); }
  });
  document.addEventListener('keydown', function (e) {
    if (!cur || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
    if (document.querySelector('.modal:not([hidden])')) return;
    if (e.key === 'ArrowRight' && cur.i < lessons.length - 1) { e.preventDefault(); go(lessons[cur.i + 1].id); }
    else if (e.key === 'ArrowLeft' && cur.i > 0) { e.preventDefault(); go(lessons[cur.i - 1].id); }
  });

  /* ---------- Kurz-Checks ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.lesson-check .quiz-opt'); if (!b) return;
    var box = b.closest('.lesson-check'), ok = b.getAttribute('data-ok') === '1', msg = box.querySelector('.lc-msg');
    [].forEach.call(box.querySelectorAll('.quiz-opt'), function (o) { o.classList.remove('right', 'wrong'); });
    b.classList.add(ok ? 'right' : 'wrong');
    msg.textContent = ok ? '✅ ' + box.getAttribute('data-why') : '❌ Nicht ganz – versuch’s noch einmal!';
    box.classList.toggle('solved', ok);
  });

  /* ---------- NELM/SQM-Tabelle aus den Bortle-Daten ---------- */
  var tableBuilt = false;
  function buildTable() {
    if (tableBuilt || !AE._bortle || !AE._bortle.data) return;
    var t = document.getElementById('bortleTable'); if (!t) return;
    var h = '<div class="bt-row bt-head" role="row"><span role="columnheader">Klasse</span><span role="columnheader">Himmel</span><span role="columnheader">NELM</span><span role="columnheader">SQM</span></div>';
    AE._bortle.data.forEach(function (d, i) {
      h += '<div class="bt-row" role="row"><span role="cell"><b class="bt-k" style="background:' + d.c + '">' + (i + 1) + '</b></span><span role="cell">' + AE.esc(d.n) + '</span><span role="cell">' + AE.esc(String(d.nelm)) + '</span><span role="cell">' + AE.esc(String(d.sqm)) + '</span></div>';
    });
    t.innerHTML = h; tableBuilt = true;
  }

  /* Lektionen-Links innerhalb von Lektionen (#lektion-…) laufen über hashchange */
  route(true);
  window.addEventListener('load', function () { if (cur && cur.id === 'himmelshelligkeit') buildTable(); if (cur) { var y = root.getBoundingClientRect().top + window.pageYOffset - 70; if (location.hash) window.scrollTo({ top: Math.max(0, y), behavior: 'instant' }); } });
})();
