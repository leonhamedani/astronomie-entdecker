/* Wetter- & Sichtbarkeits-Check (Open-Meteo, ohne API-Schlüssel) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var VARS = 'cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation_probability,relative_humidity_2m,dew_point_2m,visibility,wind_speed_10m,wind_gusts_10m,temperature_2m';

  function fetchWeather(lat, lon) {
    var key = 'ae-wx-' + lat.toFixed(2) + ',' + lon.toFixed(2);
    try { var c = JSON.parse(localStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < 30 * 60e3) return Promise.resolve(c.d); } catch (e) {}
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(3) + '&longitude=' + lon.toFixed(3) + '&hourly=' + VARS + '&timeformat=unixtime&timezone=auto&past_days=1&forecast_days=3&wind_speed_unit=kmh';
    var ctl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} return d; });
  }

  function hourList(night) {
    var start = Math.floor((night.sunset || night.darkFrom).getTime() / 3600e3) * 3600e3;
    var end = Math.ceil((night.sunrise || night.darkTo).getTime() / 3600e3) * 3600e3;
    if (end - start > 18 * 3600e3) end = start + 18 * 3600e3;
    var arr = []; for (var t = start; t <= end; t += 3600e3) arr.push(new Date(t)); return arr;
  }
  function label(s) {
    return s >= 85 ? ['🤩', 'Perfekte Nacht'] : s >= 70 ? ['😃', 'Sehr gute Bedingungen'] : s >= 50 ? ['🙂', 'Ganz okay'] : s >= 30 ? ['😐', 'Durchwachsen'] : s >= 15 ? ['😕', 'Eher schlecht'] : ['☁️', 'Heute leider nichts'];
  }
  function color(s) { return 'hsl(' + Math.round(s * 1.25) + ',85%,60%)'; }

  function analyse(wx) {
    var night = AE.nightInfo(new Date()), hours = hourList(night), H = wx && wx.hourly;
    var rows = hours.map(function (d) {
      var mid = new Date(d.getTime() + 30 * 60e3);
      var sun = AE.bodyHor('Sun', mid).alt, moon = AE.bodyHor('Moon', mid), ill = AE.moonPhase(mid).illum;
      var r = { t: d, sun: sun, moonAlt: moon.alt, moonIll: ill };
      if (H) {
        var i = H.time.indexOf(Math.round(d.getTime() / 1000));
        if (i >= 0) {
          r.cl = H.cloud_cover[i]; r.low = H.cloud_cover_low[i]; r.mid = H.cloud_cover_mid[i]; r.high = H.cloud_cover_high[i];
          r.pp = H.precipitation_probability[i] || 0; r.hum = H.relative_humidity_2m[i]; r.dew = H.dew_point_2m[i];
          r.vis = H.visibility[i]; r.wind = H.wind_speed_10m[i]; r.gust = H.wind_gusts_10m[i]; r.temp = H.temperature_2m[i];
        }
      }
      var sky = 1;
      if (r.low != null) {
        var cl = Math.min(100, r.low + r.mid * 0.7 + r.high * 0.35);
        sky = (1 - cl / 100) * (1 - 0.8 * r.pp / 100);
        if (r.hum > 95) sky *= 0.82; else if (r.hum > 85) sky *= 0.93;
        if (r.vis != null && r.vis < 5000) sky *= 0.7; else if (r.vis != null && r.vis < 15000) sky *= 0.9;
        if (r.wind > 35) sky *= 0.8; else if (r.wind > 20) sky *= 0.93;
      }
      var dark = sun > -0.8 ? 0.1 : sun > -6 ? 0.35 : sun > -12 ? 0.65 : sun > -18 ? 0.88 : 1;
      var moonF = moon.alt > 0 ? 1 - 0.45 * ill * Math.sqrt(Math.sin(moon.alt * Math.PI / 180)) : 1;
      r.score = Math.round(100 * sky * dark * moonF);
      r.skyScore = Math.round(100 * sky);
      return r;
    });
    // Bestes 3-Stunden-Fenster
    var best = { s: -1, i: 0 }, W = Math.min(3, rows.length);
    for (var i = 0; i + W <= rows.length; i++) {
      var m = 0; for (var k = 0; k < W; k++) m += rows[i + k].score; m /= W;
      if (m > best.s) best = { s: m, i: i };
    }
    // Fenster ausdehnen, solange Score nahe am Optimum
    var peak = Math.max.apply(null, rows.map(function (r) { return r.score; }));
    var a = best.i, b = best.i + W - 1;
    while (a > 0 && rows[a - 1].score >= peak - 12 && rows[a - 1].score >= 25) a--;
    while (b < rows.length - 1 && rows[b + 1].score >= peak - 12 && rows[b + 1].score >= 25) b++;
    return { night: night, rows: rows, score: Math.round(best.s), from: rows[a] && rows[a].t, to: rows[b] && new Date(rows[b].t.getTime() + 3600e3), a: a, b: b };
  }

  function tips(res, hasWx) {
    var T = [], rows = res.rows, dark = rows.filter(function (r) { return r.sun < -12; });
    if (res.score >= 25) T.push(['⭐', 'Bestes Beobachtungsfenster: <b>' + AE.fmtTime(res.from) + ' – ' + AE.fmtTime(res.to) + ' Uhr</b> (Score ' + res.score + ').']);
    // Mond
    var ill = rows.length ? rows[Math.floor(rows.length / 2)].moonIll : 0, pct = Math.round(ill * 100);
    var up = dark.map(function (r) { return r.moonAlt > 0; });
    if (dark.length && ill > 0.25) {
      var first = up.indexOf(true), last = up.lastIndexOf(true);
      if (first < 0) T.push(['🌑', 'Der Mond (' + pct + ' %) bleibt in der Dunkelheit unter dem Horizont – ideal für Milchstraße & Galaxien.']);
      else if (up.every(Boolean)) T.push(['🌕', 'Heller Mond (' + pct + ' %) die ganze Nacht: super für Mond & Planeten, schwierig für lichtschwache Nebel.']);
      else if (up[0] && !up[up.length - 1]) T.push(['🌙', 'Mond (' + pct + ' %) stört bis etwa <b>' + AE.fmtTime(new Date(dark[last].t.getTime() + 3600e3)) + ' Uhr</b> – danach wird’s richtig dunkel.']);
      else if (!up[0]) T.push(['🌙', 'Ab etwa <b>' + AE.fmtTime(dark[first].t) + ' Uhr</b> geht der Mond (' + pct + ' %) auf und hellt den Himmel auf – Deep-Sky vorher beobachten!']);
    } else if (dark.length) T.push(['🌑', 'Kaum Mondlicht (' + pct + ' %) – beste Bedingungen für die Milchstraße.']);
    if (hasWx) {
      var w = rows.filter(function (r) { return r.cl != null; });
      if (w.length) {
        var avgCl = w.reduce(function (s, r) { return s + r.cl; }, 0) / w.length;
        var clearIdx = -1; for (var i = 1; i < w.length; i++) if (w[i - 1].cl > 60 && w[i].cl < 35) { clearIdx = i; break; }
        if (avgCl > 85) T.push(['☁️', 'Fast durchgehend bedeckt (Ø ' + Math.round(avgCl) + ' % Wolken). Vielleicht klappt es morgen?']);
        else if (clearIdx > 0) T.push(['🌤️', 'Die Wolken lockern ab etwa <b>' + AE.fmtTime(w[clearIdx].t) + ' Uhr</b> auf.']);
        else if (avgCl < 20) T.push(['✨', 'Weitgehend klarer Himmel (Ø ' + Math.round(avgCl) + ' % Wolken).']);
        var hiOnly = w.filter(function (r) { return r.high > 50 && r.low < 20 && r.mid < 30; }).length;
        if (hiOnly > w.length / 2) T.push(['🌫️', 'Viele hohe Schleierwolken: Helle Sterne und Planeten gehen, schwache Objekte verblassen.']);
        var maxPP = Math.max.apply(null, w.map(function (r) { return r.pp; }));
        if (maxPP >= 40) T.push(['🌧️', 'Regenrisiko bis ' + maxPP + ' % – Ausrüstung nicht unbeaufsichtigt draußen lassen.']);
        var dew = w.filter(function (r) { return r.hum >= 90 || (r.temp - r.dew) < 2; }).length;
        if (dew > w.length / 3) T.push(['💧', 'Hohe Luftfeuchte – Taugefahr! Taukappe verwenden, Okulare in der Jackentasche warm halten.']);
        var maxW = Math.max.apply(null, w.map(function (r) { return r.gust || r.wind; }));
        if (maxW > 35) T.push(['💨', 'Böen bis ' + Math.round(maxW) + ' km/h – Teleskop windgeschützt aufstellen, geringe Vergrößerung wählen.']);
        var minT = Math.min.apply(null, w.map(function (r) { return r.temp; }));
        if (minT < 6) T.push(['🧣', 'Bis zu ' + AE.fmtNum(minT, 0) + ' °C – zieh dich wärmer an, als du denkst!']);
        var minV = Math.min.apply(null, w.map(function (r) { return r.vis == null ? 1e9 : r.vis; }));
        if (minV < 8000) T.push(['🌁', 'Dunst oder Nebel möglich (Sichtweite bis ' + AE.fmtNum(minV / 1000, 1) + ' km).']);
      }
    } else T.push(['📡', 'Keine Wetterdaten erreichbar – der Score berücksichtigt nur Mondlicht und Dunkelheit. Wirf zur Sicherheit einen Blick aus dem Fenster!']);
    if (res.night.astroStart) T.push(['🌌', 'Astronomische Dunkelheit: ' + AE.fmtTime(res.night.astroStart) + ' – ' + AE.fmtTime(res.night.astroEnd) + ' Uhr.']);
    return T;
  }

  function render(res, hasWx, note) {
    var L = label(res.score), circ = 2 * Math.PI * 52, off = circ * (1 - res.score / 100);
    var sub = hasWx ? 'Wetter + Mond + Dunkelheit' : 'Nur Mond + Dunkelheit (offline)';
    $('scoreCard').innerHTML = '<div class="gauge"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + color(Math.max(0, res.score - 20)) + '"/><stop offset="1" stop-color="' + color(res.score) + '"/></linearGradient></defs>' +
      '<circle cx="60" cy="60" r="52" class="g-bg"/><circle cx="60" cy="60" r="52" class="g-fg" stroke="url(#gg)" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + circ.toFixed(1) + '" data-off="' + off.toFixed(1) + '"/></svg>' +
      '<div class="g-val"><b>' + res.score + '</b><span>von 100</span></div></div>' +
      '<div class="score-txt"><p class="eyebrow">Beobachtungs-Score</p><h3><span class="big-emoji">' + L[0] + '</span> ' + L[1] + '</h3>' +
      '<p class="muted small">' + sub + ' · ' + AE.esc(AE.loc.name || 'Eigener Standort') + '</p>' +
      (res.score >= 25 ? '<p class="best-win">Bestes Fenster <b>' + AE.fmtTime(res.from) + ' – ' + AE.fmtTime(res.to) + ' Uhr</b></p>' : '') +
      (note ? '<p class="note small">' + note + '</p>' : '') + '</div>';
    requestAnimationFrame(function () { var g = document.querySelector('#scoreCard .g-fg'); if (g) g.style.strokeDashoffset = g.getAttribute('data-off'); });
    $('wxTips').innerHTML = '<h3>💡 Tipps für heute Nacht</h3><ul class="wx-tip-list">' + tips(res, hasWx).map(function (t) { return '<li><span>' + t[0] + '</span><p>' + t[1] + '</p></li>'; }).join('') + '</ul>';
    $('wxTimeline').innerHTML = res.rows.map(function (r, i) {
      var inBest = i >= res.a && i <= res.b && res.score >= 25;
      var clouds = r.low != null ? '<div class="wx-clouds" title="Wolken tief/mittel/hoch: ' + r.low + '/' + r.mid + '/' + r.high + ' %"><i style="opacity:' + (0.12 + r.low / 115) + '"></i><i style="opacity:' + (0.12 + r.mid / 115) + '"></i><i style="opacity:' + (0.12 + r.high / 115) + '"></i></div>' : '<div class="wx-clouds off"><i></i><i></i><i></i></div>';
      var tw = r.sun > -0.8 ? '☀️' : r.sun > -12 ? '🌆' : r.sun > -18 ? '🌌' : '';
      return '<div class="wx-col' + (inBest ? ' best' : '') + '" title="' + AE.fmtTime(r.t) + ' Uhr: Score ' + r.score + '">' +
        '<span class="wx-score" style="color:' + color(r.score) + '">' + r.score + '</span>' +
        '<div class="wx-bar"><span style="height:' + Math.max(4, r.score) + '%;background:linear-gradient(to top,' + color(r.score * 0.6) + ',' + color(r.score) + ')"></span></div>' +
        clouds +
        '<span class="wx-ic">' + (r.moonAlt > 0 ? '🌙' : '') + tw + '</span>' +
        '<span class="wx-temp">' + (r.temp != null ? AE.fmtNum(r.temp, 0) + '°' : '') + '</span>' +
        '<span class="wx-meta">' + (r.cl != null ? '☁ ' + r.cl + '%' : '') + (r.pp ? '<br>☔ ' + r.pp + '%' : '') + '</span>' +
        '<b class="wx-time">' + AE.fmtTime(r.t).slice(0, 2) + '</b></div>';
    }).join('');
    AE.emit('weather', res);
  }

  var busy = false;
  function update() {
    if (busy) return; busy = true;
    fetchWeather(AE.loc.lat, AE.loc.lon).then(function (wx) {
      render(analyse(wx), true);
    }).catch(function (e) {
      render(analyse(null), false, '📡 Wetterdienst nicht erreichbar (' + AE.esc(e.message || 'offline') + ').');
    }).then(function () { busy = false; });
  }
  AE.on('location', function () { setTimeout(update, 50); });
  var started = false;
  function start() { if (!started) { started = true; update(); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '600px' }).observe($('wetter'));
  else start();
  setTimeout(start, 2500);
  AE._wx = { update: update, analyse: analyse };
})();
