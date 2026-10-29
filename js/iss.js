/* ISS-Überflüge, Live-Karte und Himmelskarten-Anbindung (satellite.js, Bahndaten von CelesTrak) */
(function () {
  'use strict';
  var S = window.satellite, A = window.Astronomy, $ = function (id) { return document.getElementById(id); };
  var D2R = Math.PI / 180, R2D = 180 / Math.PI, RE = 6371;
  var TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
  var iss = { satrec: null, source: '', epoch: null, passes: [] };
  if (!S) { console.warn('satellite.js fehlt'); return; }

  function parseTLE(txt) {
    var l = String(txt).split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    var i = l.findIndex(function (x) { return x.indexOf('1 25544') === 0; });
    if (i < 0 || !l[i + 1] || l[i + 1].indexOf('2 25544') !== 0) throw new Error('Ungültige TLE');
    return { l1: l[i], l2: l[i + 1] };
  }
  function useTLE(t, source) {
    var rec = S.twoline2satrec(t.l1, t.l2);
    iss.satrec = rec; iss.source = source;
    iss.epoch = new Date((rec.jdsatepoch - 2440587.5) * 86400e3);
  }
  function loadTLE() {
    var cache = null;
    try { cache = JSON.parse(localStorage.getItem('ae-iss-tle') || 'null'); } catch (e) {}
    if (cache && Date.now() - cache.t < 3 * 3600e3) { useTLE(cache, 'celestrak'); return Promise.resolve(); }
    var ctl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return fetch(TLE_URL, ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (txt) {
        var t = parseTLE(txt); useTLE(t, 'celestrak');
        try { localStorage.setItem('ae-iss-tle', JSON.stringify({ l1: t.l1, l2: t.l2, t: Date.now() })); } catch (e) {}
      }).catch(function (e) {
        if (cache) useTLE(cache, 'cache'); else useTLE(window.AE_ISS_TLE, 'bundled');
        iss.fetchError = e.message || 'offline';
      });
  }

  /* ---------- Bahnrechnung ---------- */
  function obsGd() { return { latitude: AE.loc.lat * D2R, longitude: AE.loc.lon * D2R, height: 0.05 }; }
  function state(date, gd) {
    var pv = S.propagate(iss.satrec, date);
    if (!pv || !pv.position) return null;
    var gmst = S.gstime(date), ecf = S.eciToEcf(pv.position, gmst);
    var look = S.ecfToLookAngles(gd || obsGd(), ecf);
    return { pos: pv.position, vel: pv.velocity, gmst: gmst, ecf: ecf, el: look.elevation * R2D, az: (look.azimuth * R2D + 360) % 360, range: look.rangeSat };
  }
  function sunDirEci(date) { var v = A.GeoVector('Sun', date, true), l = Math.hypot(v.x, v.y, v.z); return [v.x / l, v.y / l, v.z / l]; }
  function sunlit(pos, sd) {
    var s = pos.x * sd[0] + pos.y * sd[1] + pos.z * sd[2];
    if (s > 0) return true;
    var px = pos.x - s * sd[0], py = pos.y - s * sd[1], pz = pos.z - s * sd[2];
    return Math.hypot(px, py, pz) > RE;
  }
  function magnitude(st, sd, gd) {
    // Phasenwinkel: Winkel zwischen Richtung zur Sonne und Richtung zum Beobachter (vom Satelliten aus)
    var o = S.geodeticToEcf(gd), sdE = S.eciToEcf({ x: sd[0], y: sd[1], z: sd[2] }, st.gmst);
    var ox = o.x - st.ecf.x, oy = o.y - st.ecf.y, oz = o.z - st.ecf.z, ol = Math.hypot(ox, oy, oz);
    var c = (ox * sdE.x + oy * sdE.y + oz * sdE.z) / ol;
    var phi = Math.acos(Math.max(-1, Math.min(1, c)));
    var F = (Math.sin(phi) + (Math.PI - phi) * Math.cos(phi)) / Math.PI;
    return -1.8 + 5 * Math.log10(st.range / 1000) - 2.5 * Math.log10(Math.max(0.01, Math.PI * F));
  }
  var MIN = 10;
  function computePasses(days) {
    var gd = obsGd(), out = [], t0 = Date.now() - 10 * 60e3, t1 = t0 + days * 86400e3, step = 30e3;
    function el(t) { var s = state(new Date(t), gd); return s ? s.el : -90; }
    function refine(a, b, rising) { for (var i = 0; i < 10; i++) { var m = (a + b) / 2; if ((el(m) >= MIN) === rising) b = m; else a = m; } return b; }
    var prev = el(t0), tPrev = t0;
    for (var t = t0 + step; t < t1; t += step) {
      var e = el(t);
      if (prev < MIN && e >= MIN) {
        var rise = refine(tPrev, t, true), tt = t;
        while (el(tt) >= MIN && tt < t1) tt += step;
        var set = refine(tt - step, tt, false);
        out.push(analysePass(rise, set, gd));
        t = tt; e = el(t);
      }
      prev = e; tPrev = t;
    }
    return out;
  }
  function analysePass(rise, set, gd) {
    var p = { rise: new Date(rise), set: new Date(set), maxEl: -90, vis: [] };
    var sd = sunDirEci(new Date((rise + set) / 2)), sR = AE.bodyHor('Sun', p.rise).alt, sS = AE.bodyHor('Sun', p.set).alt;
    for (var t = rise; t <= set + 1; t += 5000) {
      var d = new Date(Math.min(t, set)), st = state(d, gd); if (!st) continue;
      var lit = sunlit(st.pos, sd), sunAlt = sR + (sS - sR) * (t - rise) / Math.max(1, set - rise);
      var smp = { t: d, el: st.el, az: st.az, lit: lit, dark: sunAlt < -6 };
      if (st.el > p.maxEl) { p.maxEl = st.el; p.maxT = d; p.maxAz = st.az; }
      if (lit && smp.dark) { smp.mag = magnitude(st, sd, gd); p.vis.push(smp); }
      if (t === rise) { p.riseAz = st.az; p.sunAltRise = sunAlt; }
      p.setAz = st.az;
    }
    p.visible = p.vis.length >= 3;
    if (p.visible) {
      var v = p.vis, best = v.reduce(function (a, b) { return b.el > a.el ? b : a; });
      p.vStart = v[0].t; p.vEnd = v[v.length - 1].t; p.vStartAz = v[0].az; p.vEndAz = v[v.length - 1].az; p.vStartEl = v[0].el; p.vEndEl = v[v.length - 1].el;
      p.vMaxEl = best.el; p.vMaxAz = best.az; p.vMaxT = best.t;
      p.mag = Math.min.apply(null, v.map(function (s) { return s.mag; }));
      p.entersShadow = v[v.length - 1].t.getTime() < p.set.getTime() - 10e3;
    }
    p.reason = p.visible ? '' : (p.sunAltRise > -6 ? 'Am Taghimmel – zu hell zum Sehen' : 'Die ISS fliegt im Erdschatten');
    return p;
  }
  function brightTxt(m) { return m <= -3 ? 'extrem hell – heller als jeder Stern' : m <= -2 ? 'hell wie Jupiter' : m <= -1 ? 'hell wie Sirius' : m <= 0.5 ? 'gut sichtbar' : 'eher schwach'; }

  /* ---------- Darstellung der Überflüge ---------- */
  function icsFor(p) {
    function f(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
    var s = p.visible ? p.vStart : p.rise, e = p.visible ? p.vEnd : p.set;
    var desc = 'ISS-Überflug über ' + (AE.loc.name || 'deinem Standort') + ': von ' + AE.dirName(p.visible ? p.vStartAz : p.riseAz) + ' nach ' + AE.dirName(p.visible ? p.vEndAz : p.setAz) + ', max. ' + Math.round(p.visible ? p.vMaxEl : p.maxEl) + '° hoch' + (p.mag != null ? ', Helligkeit ' + AE.fmtNum(p.mag, 1) + ' mag' : '') + '.';
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Astronomie Entdecker//DE', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:iss-' + s.getTime() + '@astronomie-entdecker', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(s), 'DTEND:' + f(new Date(Math.max(e.getTime(), s.getTime() + 60e3))),
      'SUMMARY:🛰️ ISS-Überflug', 'DESCRIPTION:' + desc.replace(/,/g, '\\,'), 'LOCATION:' + (AE.loc.name || (AE.loc.lat.toFixed(2) + ' ' + AE.loc.lon.toFixed(2))).replace(/,/g, '\\,'),
      'BEGIN:VALARM', 'TRIGGER:-PT10M', 'ACTION:DISPLAY', 'DESCRIPTION:Die ISS kommt in 10 Minuten!', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'ISS-Ueberflug-' + f(s).slice(0, 13) + '.ics';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    AE.toast('📅 Kalendereintrag heruntergeladen – inklusive Erinnerung 10 Minuten vorher.');
  }
  function passCard(p, i) {
    var v = p.visible, s = v ? p.vStart : p.rise, m = v ? p.vMaxT : p.maxT, e = v ? p.vEnd : p.set;
    var fromAz = v ? p.vStartAz : p.riseAz, toAz = v ? p.vEndAz : p.setAz, maxEl = v ? p.vMaxEl : p.maxEl, maxAz = v ? p.vMaxAz : p.maxAz;
    var dur = Math.round((e - s) / 60000 * 10) / 10;
    return '<article class="card glass iss-card reveal ' + (v ? '' : 'dim') + '">' +
      '<div class="card-head"><div class="iss-ic">🛰️</div><div><h4>' + AE.fmtDate(s, true) + '</h4><p class="muted small">' + AE.fmtTime(s) + ' – ' + AE.fmtTime(e) + ' Uhr · ' + AE.fmtNum(dur, 1) + ' min</p></div>' +
      '<span class="pill ' + (v ? 'ok' : 'no') + '">' + (v ? 'Sichtbar' : 'Nicht sichtbar') + '</span></div>' +
      (function () { var h = 6 + Math.min(90, maxEl) / 90 * 40, d = 'M14 50 Q100 ' + (50 - 2 * h).toFixed(1) + ' 186 50';
        return '<div class="iss-arc"><svg viewBox="0 0 200 64" aria-hidden="true"><line x1="4" y1="50" x2="196" y2="50" class="arc-hz"/><path d="' + d + '" class="arc-path"/><circle r="4" class="arc-dot"><animateMotion dur="3s" repeatCount="indefinite" path="' + d + '"/></circle><text x="14" y="62" text-anchor="middle">' + AE.dirShort(fromAz) + '</text><text x="100" y="' + Math.max(9, 44 - h).toFixed(1) + '" text-anchor="middle">' + Math.round(maxEl) + '°</text><text x="186" y="62" text-anchor="middle">' + AE.dirShort(toAz) + '</text></svg></div>'; })() +
      '<ul class="iss-facts"><li><span>Richtung</span><b>von ' + AE.dirName(fromAz) + ' nach ' + AE.dirName(toAz) + '</b></li>' +
      '<li><span>Start</span><b>' + AE.fmtTime(s) + ' Uhr · ' + AE.dirShort(fromAz) + ' ' + Math.round(fromAz) + '°' + (v ? ', ' + Math.round(p.vStartEl) + '° hoch' : '') + '</b></li>' +
      '<li><span>Höchster Punkt</span><b>' + AE.fmtTime(m) + ' Uhr · ' + Math.round(maxEl) + '° über dem Horizont (' + AE.dirShort(maxAz) + ')</b></li>' +
      '<li><span>Ende</span><b>' + AE.fmtTime(e) + ' Uhr · ' + AE.dirShort(toAz) + ' ' + Math.round(toAz) + '°' + (v && p.entersShadow ? ' – verschwindet im Erdschatten' : '') + '</b></li>' +
      (v ? '<li><span>Helligkeit</span><b>' + AE.fmtNum(p.mag, 1) + ' mag – ' + brightTxt(p.mag) + '</b></li>' : '<li><span>Grund</span><b>' + p.reason + '</b></li>') + '</ul>' +
      '<div class="iss-actions"><button class="chip" data-ics="' + i + '">📅 Erinnerung (.ics)</button>' +
      '<button class="mini-btn" data-show="' + maxEl.toFixed(1) + ',' + maxAz.toFixed(1) + ',' + m.getTime() + '">Auf der Karte zeigen →</button></div></article>';
  }
  function renderPasses() {
    var all = $('issAll').checked, list = iss.passes.filter(function (p) { return all || p.visible; });
    var html = list.slice(0, 18).map(function (p) { return passCard(p, iss.passes.indexOf(p)); }).join('');
    if (!list.length) html = '<p class="muted">In den nächsten 10 Tagen gibt es von hier aus keinen sichtbaren ISS-Überflug. Das ist normal – die Sichtbarkeit kommt und geht in Phasen von einigen Wochen. Schalte „Auch nicht sichtbare Überflüge“ ein, um alle Überflüge zu sehen.</p>';
    $('issPasses').innerHTML = html;
    var age = (Date.now() - iss.epoch) / 86400e3;
    var src = iss.source === 'celestrak' ? 'aktuelle Bahndaten von CelesTrak' : iss.source === 'cache' ? 'zwischengespeicherte Bahndaten (CelesTrak gerade nicht erreichbar)' : 'mitgelieferte Ersatz-Bahndaten (CelesTrak nicht erreichbar)';
    $('issTleInfo').innerHTML = '🛰️ ' + src + ', Epoche ' + AE.fmtDate(iss.epoch) + ' (vor ' + AE.fmtNum(age, 1) + ' Tagen)' +
      (age > 14 ? ' · <b class="warn">⚠️ Bahndaten veraltet – Zeiten können stark abweichen!</b>' : age > 4 ? ' · <b class="warn">⚠️ Bahndaten ' + Math.round(age) + ' Tage alt – Zeiten können um Minuten abweichen.</b>' : '');
    if (AE.revealScan) AE.revealScan();
  }
  $('issPasses').addEventListener('click', function (e) { var b = e.target.closest('[data-ics]'); if (b) icsFor(iss.passes[+b.getAttribute('data-ics')]); });
  $('issAll').addEventListener('change', renderPasses);

  function renderNext() {
    var now = Date.now(), nx = iss.passes.filter(function (p) { return p.visible && p.vEnd > now; })[0];
    var el = $('issNext');
    if (!nx) { el.removeAttribute('data-k'); el.innerHTML = '<p class="eyebrow">Nächster sichtbarer Überflug</p><h3>Gerade keiner in Sicht</h3><p class="muted">In den nächsten 10 Tagen ist die ISS von hier aus nicht zu sehen. Schau in ein paar Tagen wieder vorbei!</p>'; return; }
    var dt = nx.vStart - now, running = dt <= 0, hrs = Math.floor(Math.abs(dt) / 3600e3), mins = Math.floor(Math.abs(dt) % 3600e3 / 60e3), secs = Math.floor(Math.abs(dt) % 60e3 / 1000);
    var cd = running ? '<span class="live-dot"></span> JETZT am Himmel!' : (hrs > 47 ? Math.floor(hrs / 24) + ' Tage ' + (hrs % 24) + ' h' : (hrs ? hrs + ' h ' : '') + mins + ' min ' + (hrs ? '' : secs + ' s'));
    var key = nx.vStart.getTime() + '|' + running + '|' + AE.loc.lat + ',' + AE.loc.lon, cdEl = el.querySelector('.countdown');
    if (el.getAttribute('data-k') === key && cdEl) { cdEl.innerHTML = (running ? '' : 'in ') + cd; return; }
    el.setAttribute('data-k', key);
    el.innerHTML = '<p class="eyebrow">Nächster sichtbarer Überflug</p><div class="countdown">' + (running ? '' : 'in ') + cd + '</div>' +
      '<h3>' + AE.fmtDate(nx.vStart, true) + ', ' + AE.fmtTime(nx.vStart) + ' Uhr</h3>' +
      '<p>Schau nach <b>' + AE.dirName(nx.vStartAz) + '</b> – die ISS zieht <b>von ' + AE.dirName(nx.vStartAz) + ' nach ' + AE.dirName(nx.vEndAz) + '</b> und steigt bis auf <b>' + Math.round(nx.vMaxEl) + '°</b> (' + AE.fmtTime(nx.vMaxT) + ' Uhr).</p>' +
      '<p class="muted small">Helligkeit ' + AE.fmtNum(nx.mag, 1) + ' mag – ' + brightTxt(nx.mag) + '. Dauer ' + Math.round((nx.vEnd - nx.vStart) / 60000) + ' min.</p>' +
      '<div class="iss-actions"><button class="btn btn-primary" id="issNextIcs">📅 Erinnerung herunterladen</button><button class="mini-btn" data-show="' + nx.vMaxEl.toFixed(1) + ',' + nx.vMaxAz.toFixed(1) + ',' + nx.vMaxT.getTime() + '">Auf der Himmelskarte zeigen →</button></div>' +
      '<p class="muted small">💡 Die ISS blinkt nicht und hat keine farbigen Lichter – so unterscheidest du sie von Flugzeugen.</p>';
    $('issNextIcs').addEventListener('click', function () { icsFor(nx); });
  }

  /* ---------- Live-Karte ---------- */
  var mapCv = $('issMap'), mctx = mapCv.getContext('2d'), mapImg = null, MW = 0, MH = 0;
  function mapResize() {
    var r = mapCv.parentNode.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    MW = r.width; MH = r.width / 2; mapCv.style.height = MH + 'px';
    mapCv.width = Math.round(MW * dpr); mapCv.height = Math.round(MH * dpr); mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function xy(lat, lon) { return [(lon + 180) / 360 * MW, (90 - lat) / 180 * MH]; }
  function geo(date) {
    var pv = S.propagate(iss.satrec, date); if (!pv || !pv.position) return null;
    var g = S.eciToGeodetic(pv.position, S.gstime(date));
    return { lat: g.latitude * R2D, lon: ((g.longitude * R2D + 540) % 360) - 180, h: g.height, v: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) * 3600 };
  }
  function drawMap() {
    if (!MW || !iss.satrec) return;
    var now = new Date(), c = mctx;
    c.fillStyle = '#0a1638'; c.fillRect(0, 0, MW, MH);
    if (mapImg) { c.globalAlpha = 0.9; c.drawImage(mapImg, 0, 0, MW, MH); c.globalAlpha = 1; }
    // Tag-Nacht-Grenze
    var sun = A.Equator('Sun', now, AE.observer(), true, false), gst = A.SiderealTime(now);
    var sLon = ((sun.ra - gst) * 15 + 540) % 360 - 180, sDec = sun.dec * D2R;
    c.beginPath();
    for (var x = 0; x <= MW; x += 2) {
      var lon = x / MW * 360 - 180, H = (lon - sLon) * D2R;
      var lat = Math.atan(-Math.cos(H) / Math.tan(Math.abs(sDec) < 1e-4 ? 1e-4 : sDec)) * R2D;
      var y = (90 - lat) / 180 * MH; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    if (sDec > 0) { c.lineTo(MW, MH); c.lineTo(0, MH); } else { c.lineTo(MW, 0); c.lineTo(0, 0); }
    c.closePath(); c.fillStyle = 'rgba(2,4,20,.55)'; c.fill();
    // Gitter
    c.strokeStyle = 'rgba(160,185,255,.12)'; c.lineWidth = 1;
    for (var gl = -60; gl <= 60; gl += 30) { var yy = xy(gl, 0)[1]; c.beginPath(); c.moveTo(0, yy); c.lineTo(MW, yy); c.stroke(); }
    for (var gx = -150; gx <= 180; gx += 30) { var xx = xy(0, gx)[0]; c.beginPath(); c.moveTo(xx, 0); c.lineTo(xx, MH); c.stroke(); }
    // Bodenspur
    function track(from, to, style, dash) {
      c.save(); c.strokeStyle = style; c.lineWidth = 2; c.setLineDash(dash || []); c.beginPath();
      var last = null;
      for (var m = from; m <= to; m += 1) {
        var g = geo(new Date(now.getTime() + m * 60e3)); if (!g) continue;
        var p = xy(g.lat, g.lon);
        if (!last || Math.abs(p[0] - last[0]) > MW / 2) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]);
        last = p;
      }
      c.stroke(); c.restore();
    }
    track(-45, 0, 'rgba(138,255,214,.35)');
    track(0, 95, 'rgba(255,215,106,.85)', [6, 5]);
    // Beobachter
    var o = xy(AE.loc.lat, AE.loc.lon);
    c.fillStyle = '#ff8fd0'; c.beginPath(); c.arc(o[0], o[1], 4.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
    c.font = '600 11px "Segoe UI", sans-serif'; c.fillStyle = '#ffd3ee'; c.fillText('Du', o[0] + 7, o[1] + 4);
    // ISS + Sichtbarkeitskreis
    var g = geo(now); if (!g) return;
    var la = g.lat * D2R, lo = g.lon * D2R, ang = 12.5 * D2R;
    c.save(); c.strokeStyle = 'rgba(138,255,214,.6)'; c.fillStyle = 'rgba(138,255,214,.08)'; c.lineWidth = 1.2; c.beginPath();
    var lastX = null;
    for (var b = 0; b <= 360; b += 6) {
      var br = b * D2R, la2 = Math.asin(Math.sin(la) * Math.cos(ang) + Math.cos(la) * Math.sin(ang) * Math.cos(br));
      var lo2 = lo + Math.atan2(Math.sin(br) * Math.sin(ang) * Math.cos(la), Math.cos(ang) - Math.sin(la) * Math.sin(la2));
      var p2 = xy(la2 * R2D, ((lo2 * R2D + 540) % 360) - 180);
      if (lastX === null || Math.abs(p2[0] - lastX) > MW / 2) c.moveTo(p2[0], p2[1]); else c.lineTo(p2[0], p2[1]);
      lastX = p2[0];
    }
    c.stroke(); c.fill(); c.restore();
    var ip = xy(g.lat, g.lon), pulse = (Date.now() % 1600) / 1600;
    c.save(); c.globalAlpha = 1 - pulse; c.strokeStyle = '#8affd6'; c.lineWidth = 2; c.beginPath(); c.arc(ip[0], ip[1], 6 + pulse * 16, 0, Math.PI * 2); c.stroke(); c.restore();
    var gr = c.createRadialGradient(ip[0], ip[1], 0, ip[0], ip[1], 12); gr.addColorStop(0, '#fff'); gr.addColorStop(.4, '#8affd6'); gr.addColorStop(1, 'rgba(138,255,214,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(ip[0], ip[1], 12, 0, Math.PI * 2); c.fill();
    c.font = '16px sans-serif'; c.fillText('🛰️', ip[0] + 8, ip[1] - 8);
    // Info
    var look = AE.issLook(now);
    $('issLive').innerHTML = '<span class="live-dot"></span> <b>Live</b> · ' + AE.fmtNum(Math.abs(g.lat), 1) + '° ' + (g.lat >= 0 ? 'N' : 'S') + ', ' + AE.fmtNum(Math.abs(g.lon), 1) + '° ' + (g.lon >= 0 ? 'O' : 'W') +
      ' · Höhe ' + Math.round(g.h) + ' km · ' + Math.round(g.v).toLocaleString('de-DE') + ' km/h<br><span class="muted small">' +
      (look && look.alt > 0 ? '🔭 Gerade über deinem Horizont: ' + AE.dirText(look.az) + ', ' + AE.altText(look.alt) + (look.visible ? ' – <b>jetzt sichtbar!</b>' : '') : 'Von deinem Standort aus gerade unter dem Horizont (' + Math.round(Math.abs(look ? look.alt : 0)) + '° darunter).') + '</span>';
  }

  /* ---------- Für die Himmelskarte ---------- */
  AE.issLook = function (date) {
    if (!iss.satrec) return null;
    var st = state(date); if (!st) return null;
    var sd = sunDirEci(date), lit = sunlit(st.pos, sd);
    var res = { alt: st.el, az: st.az, lit: lit };
    if (st.el > -1) { res.mag = lit ? magnitude(st, sd, obsGd()) : null; res.visible = lit && AE.bodyHor('Sun', date).alt < -6 && st.el > 0; }
    return res;
  };

  /* ---------- Ablauf ---------- */
  var timer = null, visible = false;
  function compute() {
    if (!iss.satrec) return;
    setTimeout(function () {
      var t = performance.now();
      iss.passes = computePasses(10);
      iss.ms = Math.round(performance.now() - t);
      renderPasses(); renderNext(); AE.emit('iss', iss);
    }, 30);
  }
  function tick() { drawMap(); if (iss.passes.length) renderNext(); }
  loadTLE().then(function () {
    compute();
    AE.loadTexture('earth').then(function (src) { var im = new Image(); im.onload = function () { mapImg = im; drawMap(); }; im.src = src; }).catch(function () {});
    mapResize(); drawMap();
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !timer) timer = setInterval(tick, 1000); if (!visible && timer) { clearInterval(timer); timer = null; } }).observe($('iss'));
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { mapResize(); drawMap(); }, 150); });
  AE.on('location', function () { compute(); drawMap(); });
  AE._iss = iss;
})();
