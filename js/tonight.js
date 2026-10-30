/* "Heute Nacht sichtbar" – Beobachtungsplaner und Sternbild-Infokarten */
(function () {
  'use strict';
  var A = window.Astronomy;
  var $ = function (id) { return document.getElementById(id); };
  var scan = { cons: {}, stars: [] };
  var CON_DE = {}; Object.keys(AE.cons).forEach(function (k) { CON_DE[k] = AE.cons[k].de; });

  function timesGrid(from, to) {
    var arr = [], step = 10 * 60000, n = Math.min(240, Math.ceil((to - from) / step));
    for (var i = 0; i <= n; i++) arr.push(new Date(from.getTime() + (to - from) * i / n));
    return arr;
  }
  function showBtn(alt, az, time) {
    return '<button class="mini-btn" data-show="' + alt.toFixed(1) + ',' + az.toFixed(1) + ',' + time.getTime() + '">Auf der Karte zeigen →</button>';
  }
  function posLine(alt, az) {
    return '<div class="pos"><div class="compass-mini" style="--az:' + az.toFixed(0) + 'deg"><i></i></div><div><b>' + AE.dirText(az) + '</b><span>' + AE.altText(alt) + '</span></div></div>';
  }

  function compute() {
    var night = AE.nightInfo(new Date());
    var grid = timesGrid(night.darkFrom, night.darkTo);
    var mats = grid.map(function (t) { return AE.horMatrix(t); });
    var o = {};
    // Sternbilder
    scan.cons = {};
    Object.keys(AE.cons).forEach(function (id) {
      var c = AE.cons[id], best = { alt: -99 };
      for (var i = 0; i < grid.length; i++) {
        AE.vecToHor(mats[i], c.v, o);
        if (o.alt > best.alt) best = { alt: o.alt, az: o.az, time: grid[i] };
      }
      scan.cons[id] = best;
    });
    // Helle Sterne
    scan.stars = AE.stars.filter(function (s) { return s.name && (s.mag < 1.65 || s.name === 'Polarstern'); }).map(function (s) {
      var best = { alt: -99 };
      for (var i = 0; i < grid.length; i++) {
        AE.vecToHor(mats[i], s.v, o);
        if (o.alt > best.alt) best = { alt: o.alt, az: o.az, time: grid[i] };
      }
      best.s = s; return best;
    });
    return night;
  }

  function sunCard(n) {
    var obs = AE.observer();
    var setAz = n.sunset ? A.Horizon(n.sunset, obs, A.Equator('Sun', n.sunset, obs, true, true).ra, A.Equator('Sun', n.sunset, obs, true, true).dec).azimuth : null;
    var rows = [
      ['🌇', 'Sonnenuntergang', n.sunset ? AE.fmtTime(n.sunset) + ' Uhr' + (setAz != null ? ' · ' + AE.dirText(setAz) : '') : 'kein Untergang'],
      ['🌆', 'Ende bürgerl. Dämmerung (−6°)', n.civilEnd ? AE.fmtTime(n.civilEnd) + ' Uhr' : '–'],
      ['🌃', 'Ende nautische Dämmerung (−12°)', n.nautEnd ? AE.fmtTime(n.nautEnd) + ' Uhr' : '–'],
      ['🌌', 'Astronomische Dunkelheit (−18°)', n.astroStart && n.astroEnd ? AE.fmtTime(n.astroStart) + ' – ' + AE.fmtTime(n.astroEnd) + ' Uhr' : 'keine – helle Nacht'],
      ['🌅', 'Sonnenaufgang', n.sunrise ? AE.fmtTime(n.sunrise) + ' Uhr' : '–']
    ];
    var darkH = n.astroStart && n.astroEnd ? (n.astroEnd - n.astroStart) / 3600e3 : 0;
    $('sunCard').innerHTML = '<div class="card-head"><div class="big-ic sun-ic"></div><div><h3>Sonne &amp; Dunkelheit</h3><p class="muted small">' + AE.fmtDate(n.sunset || n.noon, true) + '</p></div></div>' +
      '<ul class="timeline">' + rows.map(function (r) { return '<li><span class="tl-ic">' + r[0] + '</span><span class="tl-l">' + r[1] + '</span><b>' + r[2] + '</b></li>'; }).join('') + '</ul>' +
      (darkH ? '<p class="note">✨ Heute hast du <b>' + AE.fmtNum(darkH, 1) + ' Stunden</b> echte Dunkelheit für Galaxien und Nebel.</p>' : '<p class="note">☀️ Die Sonne sinkt heute nicht tief genug für astronomische Dunkelheit.</p>');
  }

  function moonCard(n) {
    var obs = AE.observer();
    var ref = new Date((n.darkFrom.getTime() + n.darkTo.getTime()) / 2);
    var ph = AE.moonPhase(ref);
    var rise = A.SearchRiseSet('Moon', obs, +1, n.noon, 1), set = A.SearchRiseSet('Moon', obs, -1, n.noon, 1.2);
    var grid = timesGrid(n.darkFrom, n.darkTo), best = { alt: -99 };
    grid.forEach(function (t) { var h = AE.bodyHor('Moon', t); if (h.alt > best.alt) best = { alt: h.alt, az: h.az, time: t }; });
    var full = A.SearchMoonPhase(180, new Date(), 40), nw = A.SearchMoonPhase(0, new Date(), 40);
    var lit = Math.round(ph.illum * 100);
    var k = Math.cos(ph.angle * Math.PI / 180);
    $('moonCard').innerHTML = '<div class="card-head"><div class="moon-big ' + (ph.waxing ? 'wax' : 'wane') + ' ' + (k > 0 ? 'cres' : 'gib') + '" style="--w:' + (Math.abs(k) * 100).toFixed(1) + '%"><div class="moon-term"></div></div><div><h3>Mond: ' + ph.name + ' ' + ph.emoji + '</h3><p class="muted small">' + lit + ' % beleuchtet</p></div></div>' +
      '<ul class="timeline">' +
      '<li><span class="tl-ic">⬆️</span><span class="tl-l">Mondaufgang</span><b>' + (rise ? AE.fmtTime(rise.date) + ' Uhr · ' + AE.fmtDate(rise.date) : '–') + '</b></li>' +
      '<li><span class="tl-ic">⬇️</span><span class="tl-l">Monduntergang</span><b>' + (set ? AE.fmtTime(set.date) + ' Uhr · ' + AE.fmtDate(set.date) : '–') + '</b></li>' +
      '<li><span class="tl-ic">🌕</span><span class="tl-l">Nächster Vollmond</span><b>' + (full ? AE.fmtDate(full.date) + ', ' + AE.fmtTime(full.date) + ' Uhr' : '–') + '</b></li>' +
      '<li><span class="tl-ic">🌑</span><span class="tl-l">Nächster Neumond</span><b>' + (nw ? AE.fmtDate(nw.date) + ', ' + AE.fmtTime(nw.date) + ' Uhr' : '–') + '</b></li></ul>' +
      (best.alt > 0 ? '<div class="best"><span class="badge">Beste Zeit ' + AE.fmtTime(best.time) + ' Uhr</span>' + posLine(best.alt, best.az) + showBtn(best.alt, best.az, best.time) + '</div>'
        : '<p class="note">🌑 Der Mond steht heute Nacht während der Dunkelheit unter dem Horizont – perfekt für lichtschwache Objekte!</p>') +
      '<p class="note small">' + (lit > 70 ? 'Heller Mond überstrahlt schwache Sterne – ideal, um Mondkrater am Rand zu beobachten.' : lit < 25 ? 'Wenig Mondlicht – beste Bedingungen für die Milchstraße.' : 'Tipp: Entlang der Licht-Schatten-Grenze (Terminator) wirken Krater im Teleskop besonders plastisch.') + '</p>';
    if ($('statMoon')) { $('statMoon').textContent = ph.emoji; $('statMoonTxt').textContent = ph.name + ' · ' + lit + ' %'; }
  }

  var PL_INFO = {
    Mercury: 'Der flinke Götterbote – nur kurz in der Dämmerung zu erwischen.',
    Venus: 'Der „Abend-“ oder „Morgenstern“ – nach Sonne und Mond das hellste Objekt.',
    Mars: 'Der Rote Planet – im Teleskop zeigt er Polkappen und dunkle Flecken.',
    Jupiter: 'Der Riese! Schon im Fernglas siehst du seine vier großen Monde.',
    Saturn: 'Der Ringplanet – die Ringe siehst du ab ca. 30-facher Vergrößerung.',
    Uranus: 'Ein Eisriese – nur mit Fernglas als grünliches Pünktchen.',
    Neptune: 'Der fernste Planet – braucht ein Teleskop.'
  };
  function planetCards(n) {
    var obs = AE.observer();
    var grid = timesGrid(n.darkFrom, n.darkTo);
    var html = AE.PLANETS.map(function (p) {
      var best = { alt: -99 };
      grid.forEach(function (t) { var h = AE.bodyHor(p.id, t); if (h.alt > best.alt) best = { alt: h.alt, az: h.az, time: t, ra: h.ra, dec: h.dec }; });
      var mag = A.Illumination(p.id, best.time).mag;
      var con = A.Constellation(best.ra, best.dec);
      var elong = A.Elongation(p.id, best.time).elongation;
      var rise = A.SearchRiseSet(p.id, obs, +1, n.noon, 1), set = A.SearchRiseSet(p.id, obs, -1, n.noon, 1);
      var vis = best.alt > 5;
      var faint = p.id === 'Uranus' || p.id === 'Neptune';
      var reason = vis ? '' : elong < 18 ? 'Steht zu nah an der Sonne (' + Math.round(elong) + '° Abstand).' : 'Bleibt während der Dunkelheit unter oder zu dicht am Horizont.';
      return '<article class="card glass planet-card reveal ' + (vis ? '' : 'dim') + '">' +
        '<div class="card-head"><div class="pl-dot pl-' + p.id.toLowerCase() + '"></div><div><h4>' + p.de + ' <span class="sym">' + p.e + '</span></h4>' +
        '<p class="muted small">' + AE.fmtNum(mag, 1) + ' mag · im Sternbild ' + (CON_DE[con.symbol] || con.name) + '</p></div>' +
        '<span class="pill ' + (vis ? 'ok' : 'no') + '">' + (vis ? (faint ? 'Fernglas/Teleskop' : 'Sichtbar') : 'Nicht sichtbar') + '</span></div>' +
        '<p class="small">' + PL_INFO[p.id] + '</p>' +
        (vis ? '<div class="best"><span class="badge">Beste Zeit ' + AE.fmtTime(best.time) + ' Uhr</span>' + posLine(best.alt, best.az) + '</div>' +
          '<p class="muted small">Aufgang ' + (rise ? AE.fmtTime(rise.date) : '–') + ' · Untergang ' + (set ? AE.fmtTime(set.date) : '–') + ' Uhr</p>' + showBtn(best.alt, best.az, best.time)
          : '<p class="muted small">' + reason + '</p>') +
        '</article>';
    }).join('');
    $('planetGrid').innerHTML = html;
  }

  function starCards() {
    var list = scan.stars.filter(function (b) { return b.alt > 5; }).sort(function (a, b) { return a.s.mag - b.s.mag; }).slice(0, 12);
    $('starGrid').innerHTML = list.map(function (b) {
      var s = b.s, con = AE.cons[s.con];
      var circ = AE.circumpolar(s.dec);
      return '<article class="card glass star-card reveal"><div class="card-head"><div class="star-dot" style="--c:' + s.col + '"></div><div><h4>' + AE.esc(s.name) + '</h4><p class="muted small">' + AE.esc(s.desig) + (con ? ' · ' + AE.esc(con.de) : '') + '</p></div></div>' +
        '<p class="small">Helligkeit <b>' + AE.fmtNum(s.mag, 2) + ' mag</b>' + (circ ? ' · <span class="pill ok">zirkumpolar</span>' : '') + '</p>' +
        '<div class="best"><span class="badge">Am höchsten ' + AE.fmtTime(b.time) + ' Uhr</span>' + posLine(b.alt, b.az) + '</div>' + showBtn(b.alt, b.az, b.time) + '</article>';
    }).join('') || '<p class="muted">Gerade sind keine hellen Sterne über dem Horizont.</p>';
  }

  var showAllCons = false;
  function conCards() {
    var ids = Object.keys(scan.cons).filter(function (id) { return scan.cons[id].alt > 20; });
    ids.sort(function (a, b) { return (AE.cons[a].rank - AE.cons[b].rank) || (scan.cons[b].alt - scan.cons[a].alt); });
    var total = ids.length;
    if (!showAllCons) ids = ids.slice(0, 16);
    $('conGrid').innerHTML = ids.map(function (id) {
      var c = AE.cons[id], b = scan.cons[id], info = window.AE_CONINFO[id] || {};
      return '<button class="card glass con-tile reveal" data-con="' + id + '"><span class="con-emoji">' + (info.e || '✨') + '</span><h4>' + AE.esc(c.de) + '</h4><p class="muted small">' + AE.esc(c.la) + '</p>' +
        '<p class="small"><b>' + AE.dirText(b.az) + '</b><br>' + AE.altText(b.alt) + '</p><span class="badge">Beste Zeit ' + AE.fmtTime(b.time) + ' Uhr</span></button>';
    }).join('') + (total > 16 ? '<button class="chip more-btn" id="moreCons">' + (showAllCons ? 'Weniger anzeigen' : 'Alle ' + total + ' sichtbaren Sternbilder anzeigen') + '</button>' : '');
    var mb = $('moreCons'); if (mb) mb.addEventListener('click', function () { showAllCons = !showAllCons; conCards(); AE.revealScan(); });
  }

  /* ---------- Sternbild-Infokarte ---------- */
  function drawConFigure(canvas, c) {
    var ctx = canvas.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth || 320, h = canvas.clientHeight || 220;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Gnomonische Projektion um das Zentrum
    var c0 = c.v, ra0 = c.ra * Math.PI / 180, de0 = c.dec * Math.PI / 180;
    var e = [-Math.sin(ra0), Math.cos(ra0), 0], nn = [-Math.sin(de0) * Math.cos(ra0), -Math.sin(de0) * Math.sin(ra0), Math.cos(de0)];
    function pr(v) { var z = v[0] * c0[0] + v[1] * c0[1] + v[2] * c0[2]; return [-(v[0] * e[0] + v[1] * e[1] + v[2] * e[2]) / z, (v[0] * nn[0] + v[1] * nn[1] + v[2] * nn[2]) / z, z]; }
    var pts = []; c.lines.forEach(function (s) { s.forEach(function (v) { pts.push(pr(v)); }); });
    if (!pts.length) return;
    var minx = Math.min.apply(null, pts.map(function (p) { return p[0]; })), maxx = Math.max.apply(null, pts.map(function (p) { return p[0]; }));
    var miny = Math.min.apply(null, pts.map(function (p) { return p[1]; })), maxy = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
    var sc = Math.min((w - 40) / Math.max(1e-3, maxx - minx), (h - 40) / Math.max(1e-3, maxy - miny));
    var ox = w / 2 - (minx + maxx) / 2 * sc, oy = h / 2 + (miny + maxy) / 2 * sc;
    function X(p) { return [ox + p[0] * sc, oy - p[1] * sc]; }
    var range = Math.max(maxx - minx, maxy - miny);
    AE.stars.forEach(function (s) {
      if (s.mag > 5) return;
      var p = pr(s.v); if (p[2] < 0.5) return;
      var q = X(p); if (q[0] < 0 || q[0] > w || q[1] < 0 || q[1] > h) return;
      ctx.fillStyle = s.col; ctx.globalAlpha = s.con === c.id ? 1 : 0.35;
      ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(0.6, (5.5 - s.mag) * 0.8 * Math.min(1.4, 0.6 / range + 0.6)), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(130,210,255,0.85)'; ctx.lineWidth = 1.6; ctx.shadowColor = '#5cc8ff'; ctx.shadowBlur = 8;
    var len = 0;
    c.lines.forEach(function (s) { ctx.beginPath(); s.forEach(function (v, i) { var q = X(pr(v)); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); });
  }
  AE.openConstellation = function (id) {
    var c = AE.cons[id]; if (!c) return;
    var info = window.AE_CONINFO[id] || {};
    var season = AE.bestSeason(c), b = scan.cons[id];
    var myth = info.myth || (c.de + ' (lateinisch ' + c.la + ') gehört zu den 88 offiziellen Sternbildern der Internationalen Astronomischen Union. ' + (c.rank >= 3 ? 'Es ist eher lichtschwach – ein echter Geheimtipp für dunkle Nächte!' : 'Seine Sterne erzählen Geschichten, die seit Jahrhunderten weitergegeben werden.'));
    var vis = AE.neverRises(c.dec) ? '<span class="pill no">Von deinem Standort aus nie sichtbar</span>' :
      b && b.alt > 10 ? '<span class="pill ok">Heute Nacht sichtbar</span> Am höchsten gegen <b>' + AE.fmtTime(b.time) + ' Uhr</b>: ' + AE.dirText(b.az) + ', ' + AE.altText(b.alt) :
        '<span class="pill no">Heute Nacht kaum sichtbar</span> Besser im ' + season.month + '.';
    var stars = c.stars.map(function (s) { return '<li><span class="star-dot sm" style="--c:' + s.col + '"></span><b>' + AE.esc(s.name || s.desig) + '</b> <span class="muted">' + (s.name ? AE.esc(s.desig) + ' · ' : '') + AE.fmtNum(s.mag, 2) + ' mag</span></li>'; }).join('');
    $('conBody').innerHTML = '<div class="con-top"><span class="con-emoji big">' + (info.e || '✨') + '</span><div><p class="eyebrow">Sternbild</p><h3 id="conTitle">' + AE.esc(c.de) + '</h3><p class="muted">' + AE.esc(c.la) + ' · Genitiv: ' + AE.esc(c.gen) + ' · Kürzel ' + id + '</p></div></div>' +
      '<canvas class="con-fig" id="conFig"></canvas>' +
      '<p class="vis-line">' + vis + '</p>' +
      '<h4>📜 Mythologie</h4><p>' + AE.esc(myth) + '</p>' +
      (info.hl ? '<h4>🔭 Highlights</h4><p>' + AE.esc(info.hl) + '</p>' : '') +
      (stars ? '<h4>⭐ Hellste Sterne</h4><ul class="star-list">' + stars + '</ul>' : '') +
      '<h4>🗓️ Beste Jahreszeit</h4><p><b>' + season.season + '</b> – am Abend gegen 22 Uhr steht ' + AE.esc(c.de) + ' im <b>' + season.month + '</b> am höchsten.' + (AE.circumpolar(c.dec) ? ' Von deinem Standort aus ist es sogar <b>zirkumpolar</b> und das ganze Jahr sichtbar!' : '') + '</p>' +
      (b && b.alt > 10 ? showBtn(b.alt, b.az, b.time) : '');
    AE.openModal('conModal');
    requestAnimationFrame(function () { drawConFigure($('conFig'), c); });
  };

  // „Auf der Karte zeigen“ ([data-show]) wird seitenübergreifend in main.js behandelt
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.con-tile[data-con]');
    if (t) AE.openConstellation(t.getAttribute('data-con'));
  });

  AE.renderTonight = function () {
    var n = compute();
    if ($('tonightSub')) $('tonightSub').textContent = 'Für ' + (AE.loc.name || 'deinen Standort') + ' – alle Zeiten in Ortszeit (' + AE.tzLabel() + '). Beobachtungsfenster: ' + AE.fmtTime(n.darkFrom) + ' – ' + AE.fmtTime(n.darkTo) + ' Uhr.';
    // Jede Unterseite enthält nur einen Teil der Karten – fehlende Bereiche überspringen
    if ($('sunCard')) sunCard(n);
    if ($('moonCard')) moonCard(n);
    if ($('planetGrid')) planetCards(n);
    if ($('starGrid')) starCards();
    if ($('conGrid')) conCards();
    if (AE.revealScan) AE.revealScan();
  };
  AE.on('location', function () { AE.renderTonight(); });
})();
