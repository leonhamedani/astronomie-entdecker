/* Astronomie Entdecker – Kernfunktionen (Standort, Zeit, Koordinaten) */
(function () {
  'use strict';
  var A = window.Astronomy;
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var AE = window.AE = { D2R: D2R, R2D: R2D, listeners: {} };

  AE.on = function (ev, fn) { (AE.listeners[ev] = AE.listeners[ev] || []).push(fn); };
  AE.emit = function (ev, data) { (AE.listeners[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- Standort ---------- */
  var DEFAULT = { name: 'Berlin', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin', source: 'default' };
  AE.loc = DEFAULT;
  try {
    var saved = JSON.parse(localStorage.getItem('ae-location') || 'null');
    if (saved && isFinite(saved.lat) && isFinite(saved.lon)) AE.loc = saved;
  } catch (e) { /* localStorage evtl. gesperrt (file://) */ }
  AE.browserTz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || undefined;
  AE.setLocation = function (loc) {
    loc.lat = Math.max(-89.9, Math.min(89.9, +loc.lat));
    loc.lon = ((+loc.lon + 540) % 360) - 180;
    if (!loc.tz) loc.tz = AE.browserTz;
    AE.loc = loc;
    try { localStorage.setItem('ae-location', JSON.stringify(loc)); } catch (e) {}
    AE.emit('location', loc);
  };
  AE.observer = function () { return new A.Observer(AE.loc.lat, AE.loc.lon, 0); };

  /* ---------- Zeitformatierung (Zeitzone des Standorts) ---------- */
  function tzOpt(o) { o = o || {}; if (AE.loc.tz) o.timeZone = AE.loc.tz; return o; }
  AE.fmtTime = function (d) {
    if (!d) return '–';
    try { return d.toLocaleTimeString('de-DE', tzOpt({ hour: '2-digit', minute: '2-digit' })); }
    catch (e) { return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  };
  AE.fmtDate = function (d, long) {
    var o = long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' };
    try { return d.toLocaleDateString('de-DE', tzOpt(o)); } catch (e) { return d.toLocaleDateString('de-DE', o); }
  };
  AE.localHour = function (d) {
    try {
      var p = new Intl.DateTimeFormat('en-GB', tzOpt({ hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })).formatToParts(d);
      var h = 0, m = 0;
      p.forEach(function (x) { if (x.type === 'hour') h = +x.value; if (x.type === 'minute') m = +x.value; });
      return (h % 24) + m / 60;
    } catch (e) { return d.getHours() + d.getMinutes() / 60; }
  };
  AE.tzLabel = function () {
    try {
      var p = new Intl.DateTimeFormat('de-DE', tzOpt({ timeZoneName: 'short' })).formatToParts(new Date());
      var n = p.filter(function (x) { return x.type === 'timeZoneName'; })[0];
      return n ? n.value : '';
    } catch (e) { return ''; }
  };

  /* ---------- Himmelsrichtungen ---------- */
  var DIR_LONG = ['Nord', 'Nordnordost', 'Nordost', 'Ostnordost', 'Ost', 'Ostsüdost', 'Südost', 'Südsüdost',
    'Süd', 'Südsüdwest', 'Südwest', 'Westsüdwest', 'West', 'Westnordwest', 'Nordwest', 'Nordnordwest'];
  var DIR_SHORT = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  AE.dirIndex = function (az) { return Math.round((((az % 360) + 360) % 360) / 22.5) % 16; };
  AE.dirName = function (az) { return DIR_LONG[AE.dirIndex(az)]; };
  AE.dirShort = function (az) { return DIR_SHORT[AE.dirIndex(az)]; };
  AE.dirText = function (az) { return DIR_LONG[AE.dirIndex(az)] + ', ' + Math.round(((az % 360) + 360) % 360) + '°'; };
  AE.altText = function (alt) {
    var a = Math.round(alt);
    return a >= 0 ? a + '° über dem Horizont' : Math.abs(a) + '° unter dem Horizont';
  };
  AE.fmtNum = function (x, d) { return (+x).toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); };

  /* ---------- Koordinaten ---------- */
  // Einheitsvektoren der Sterne (J2000) vorberechnen
  AE.toVec = function (raDeg, decDeg) {
    var r = raDeg * D2R, d = decDeg * D2R, c = Math.cos(d);
    return [c * Math.cos(r), c * Math.sin(r), Math.sin(d)];
  };
  // Rotationsmatrix J2000-Äquator -> Horizont (x=Nord, y=West, z=Zenit) – inkl. Präzession & Nutation
  AE.horMatrix = function (date) {
    var r = A.Rotation_EQJ_HOR(A.MakeTime(date), AE.observer()).rot;
    return r;
  };
  // Liefert {alt, az} in Grad
  AE.vecToHor = function (m, v, out) {
    var x = m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2];
    var y = m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2];
    var z = m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2];
    out = out || {};
    out.alt = Math.asin(Math.max(-1, Math.min(1, z))) * R2D;
    var az = Math.atan2(-y, x) * R2D;
    out.az = az < 0 ? az + 360 : az;
    return out;
  };
  AE.bodyHor = function (body, date) {
    var obs = AE.observer();
    var eq = A.Equator(body, date, obs, true, true);
    var h = A.Horizon(date, obs, eq.ra, eq.dec, 'normal');
    return { alt: h.altitude, az: h.azimuth, ra: eq.ra, dec: eq.dec, dist: eq.dist };
  };

  /* ---------- Die Nacht bestimmen ---------- */
  AE.nightInfo = function (date) {
    date = date || new Date();
    var obs = AE.observer();
    var h = AE.localHour(date);
    var noon = new Date(date.getTime() + (12 - h) * 3600e3);
    if (h < 7) noon = new Date(noon.getTime() - 86400e3);
    function t(x) { return x ? x.date : null; }
    var info = { noon: noon };
    try {
      info.sunset = t(A.SearchRiseSet('Sun', obs, -1, noon, 1));
      info.sunrise = t(A.SearchRiseSet('Sun', obs, +1, info.sunset || noon, 1.2));
      info.civilEnd = t(A.SearchAltitude('Sun', obs, -1, noon, 1, -6));
      info.nautEnd = t(A.SearchAltitude('Sun', obs, -1, noon, 1, -12));
      info.astroStart = t(A.SearchAltitude('Sun', obs, -1, noon, 1, -18));
      info.astroEnd = info.astroStart ? t(A.SearchAltitude('Sun', obs, +1, info.astroStart, 1, -18)) : null;
      info.civilStart = t(A.SearchAltitude('Sun', obs, +1, info.civilEnd || info.sunset || noon, 1.2, -6));
    } catch (e) { console.warn(e); }
    // Beobachtungsfenster
    var start = info.sunset ? new Date(info.sunset.getTime() - 3600e3) : new Date(noon.getTime() + 5 * 3600e3);
    var end = info.sunrise && info.sunrise > start ? new Date(info.sunrise.getTime() + 3600e3) : new Date(noon.getTime() + 19 * 3600e3);
    if (end - start > 20 * 3600e3) end = new Date(start.getTime() + 20 * 3600e3);
    if (end - start < 6 * 3600e3) { start = new Date(noon.getTime() + 6 * 3600e3); end = new Date(noon.getTime() + 18 * 3600e3); }
    info.winStart = start; info.winEnd = end;
    // Dunkles Fenster zur Planung (Sonne < -6°)
    info.darkFrom = info.civilEnd || info.sunset || new Date(noon.getTime() + 8 * 3600e3);
    info.darkTo = info.civilStart && info.civilStart > info.darkFrom ? info.civilStart : (info.sunrise || new Date(noon.getTime() + 16 * 3600e3));
    if (info.darkTo <= info.darkFrom) info.darkTo = new Date(info.darkFrom.getTime() + 4 * 3600e3);
    return info;
  };

  /* ---------- Mondphase ---------- */
  AE.moonPhase = function (date) {
    var ang = A.MoonPhase(date);
    var ill = A.Illumination('Moon', date).phase_fraction;
    var names = [
      [0, 'Neumond', '🌑'], [1, 'Zunehmende Sichel', '🌒'], [2, 'Erstes Viertel', '🌓'], [3, 'Zunehmender Mond', '🌔'],
      [4, 'Vollmond', '🌕'], [5, 'Abnehmender Mond', '🌖'], [6, 'Letztes Viertel', '🌗'], [7, 'Abnehmende Sichel', '🌘']];
    var i = Math.round(ang / 45) % 8;
    return { angle: ang, illum: ill, name: names[i][1], emoji: names[i][2], waxing: ang < 180 };
  };

  /* ---------- Farben ---------- */
  AE.bvColor = function (bv) {
    bv = Math.max(-0.4, Math.min(2.0, bv));
    var stops = [[-0.4, [155, 176, 255]], [0, [202, 215, 255]], [0.4, [248, 247, 255]], [0.8, [255, 236, 210]], [1.2, [255, 210, 161]], [1.6, [255, 180, 120]], [2.0, [255, 150, 90]]];
    for (var i = 1; i < stops.length; i++) {
      if (bv <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i], t = (bv - a[0]) / (b[0] - a[0]);
        return 'rgb(' + [0, 1, 2].map(function (k) { return Math.round(a[1][k] + (b[1][k] - a[1][k]) * t); }).join(',') + ')';
      }
    }
    return 'rgb(255,150,90)';
  };

  /* ---------- Daten aufbereiten ---------- */
  var SKY = window.AE_SKY;
  AE.stars = SKY.stars.map(function (s) {
    return { ra: s[0], dec: s[1], mag: s[2], bv: s[3], name: s[4], desig: s[5], con: s[6], v: AE.toVec(s[0], s[1]), col: AE.bvColor(s[3]) };
  });
  AE.cons = {};
  SKY.constellations.forEach(function (c) {
    c.v = AE.toVec(c.ra, c.dec);
    c.lines = (SKY.lines[c.id] || []).map(function (seg) { return seg.map(function (p) { return AE.toVec(p[0], p[1]); }); });
    c.stars = AE.stars.filter(function (s) { return s.con === c.id; }).slice(0, 4);
    AE.cons[c.id] = c;
  });

  // Beste Jahreszeit: Monat, in dem das Sternbild gegen 22 Uhr kulminiert
  var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  AE.bestSeason = function (c) {
    var raH = c.ra / 15;
    var days = (((raH - 10) % 24) + 24) % 24 / 24 * 365.25; // nach dem 21. März
    var d = new Date(Date.UTC(2026, 2, 21) + days * 86400e3);
    var m = d.getUTCMonth();
    var season = (m === 11 || m <= 1) ? 'Winter' : m <= 4 ? 'Frühling' : m <= 7 ? 'Sommer' : 'Herbst';
    return { month: MONTHS[m], season: season };
  };
  AE.circumpolar = function (dec) { return AE.loc.lat >= 0 ? dec > 90 - AE.loc.lat : dec < -90 - AE.loc.lat; };
  AE.neverRises = function (dec) { return AE.loc.lat >= 0 ? dec < AE.loc.lat - 90 : dec > AE.loc.lat + 90; };

  AE.V = '6';
  var loaded = {};
  AE.loadScript = function (src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (res, rej) {
      var el = document.createElement('script'); el.src = src + (src.indexOf('?') < 0 ? '?v=' + AE.V : ''); el.async = true;
      el.onload = function () { res(); }; el.onerror = function () { delete loaded[src]; rej(new Error('Laden fehlgeschlagen: ' + src)); };
      document.head.appendChild(el);
    });
    return loaded[src];
  };
  AE.loadTexture = function (name) { return AE.loadScript('js/textures/' + name + '.js').then(function () { return window.AE_TEX[name]; }); };
  // Höchster Stand eines Himmelskörpers während der Dunkelheit
  AE.bestDuringNight = function (body, night) {
    night = night || AE.nightInfo(new Date());
    var best = { alt: -99 }, n = 60, a = night.darkFrom.getTime(), b = night.darkTo.getTime();
    for (var i = 0; i <= n; i++) { var t = new Date(a + (b - a) * i / n), h = AE.bodyHor(body, t); if (h.alt > best.alt) best = { alt: h.alt, az: h.az, time: t }; }
    return best;
  };
  AE.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  AE.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();
