/* Lichtverschmutzung: interaktive Bortle-Skala mit simuliertem Himmel + Rotlicht-Knopf */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  // Rotlicht-Knöpfe ([data-red-toggle]) werden global in rotlicht.js behandelt

  var cv = $('bortleCanvas'), range = $('bortleRange');
  if (!cv || !range) return;

  // Nach John E. Bortle (Sky & Telescope, 2001); Grenzgröße (NELM) und SQM-Werte gerundet
  var B = [
    { n: 'Ausgezeichneter dunkler Himmel', c: '#0b1030', nelm: '7,6–8,0', sqm: '21,7–22,0', see: 'Die Milchstraße wirft sichtbare Schatten, Zodiakallicht und Gegenschein sind deutlich. M33 ist mit bloßem Auge leicht zu sehen. Fast nur in abgelegenen Wüsten, Hochgebirgen oder auf dem Meer.' },
    { n: 'Typisch dunkler Himmel', c: '#0d1436', nelm: '7,1–7,5', sqm: '21,5–21,7', see: 'Die Milchstraße zeigt viel Struktur, der Himmel am Horizont ist kaum aufgehellt. Wolken erscheinen als schwarze Löcher im Sternenhimmel. In Deutschland nur an wenigen Orten, z. B. in Sternenparks.' },
    { n: 'Ländlicher Himmel', c: '#121a40', nelm: '6,6–7,0', sqm: '21,3–21,5', see: 'Etwas Lichtglocke am Horizont, die Milchstraße ist trotzdem komplex und eindrucksvoll. Kugelsternhaufen wie M13 sind mit bloßem Auge erkennbar.' },
    { n: 'Übergang Land/Vorort', c: '#1b2148', nelm: '6,1–6,5', sqm: '20,4–21,3', see: 'Lichtglocken über Ortschaften in mehreren Richtungen. Die Milchstraße ist noch gut sichtbar, aber ohne feine Details. Wolken sind von unten leicht angestrahlt.' },
    { n: 'Vorstadthimmel', c: '#2a2a50', nelm: '5,6–6,0', sqm: '19,1–20,4', see: 'Die Milchstraße ist nur hoch am Himmel schwach zu erahnen, am Horizont gar nicht. Wolken sind deutlich heller als der Himmel.' },
    { n: 'Heller Vorstadthimmel', c: '#3a3456', nelm: '5,1–5,5', sqm: '18,5–19,1', see: 'Von der Milchstraße ist höchstens im Zenit eine Spur zu sehen. Der Himmel wirkt grau statt schwarz, bis etwa 35° Höhe aufgehellt.' },
    { n: 'Übergang Vorstadt/Stadt', c: '#4a3c58', nelm: '4,6–5,0', sqm: '18,0–18,5', see: 'Der ganze Himmel ist gräulich-weiß aufgehellt, die Milchstraße ist unsichtbar. Helle Messier-Objekte wie M44 oder M31 sind mit bloßem Auge kaum zu erkennen.' },
    { n: 'Stadthimmel', c: '#5a4656', nelm: '4,1–4,5', sqm: '< 18,0', see: 'Der Himmel leuchtet orange-grau, man könnte fast Zeitung lesen. Nur die bekannten Sternbilder sind noch erkennbar, viele ihrer Sterne fehlen.' },
    { n: 'Innenstadthimmel', c: '#6a5050', nelm: '≤ 4,0', sqm: '< 18,0', see: 'Nur Mond, Planeten und die hellsten Sterne sind sichtbar. Kein Grund aufzugeben: Mond, Planeten und Doppelsterne gehen auch hier wunderbar!' }
  ];
  var MW = [1, .85, .65, .45, .22, .08, 0, 0, 0], GLOW = [0, .03, .08, .15, .25, .38, .5, .62, .75];

  // Himmelsausschnitt: Sommerdreieck/Schwan (gnomonische Projektion)
  var RA0 = 300 * Math.PI / 180, DE0 = 32 * Math.PI / 180, SCALE = 1 / 0.9; // ≈ ±50° horizontal
  function proj(raDeg, deDeg) {
    var ra = raDeg * Math.PI / 180, de = deDeg * Math.PI / 180;
    var c = Math.sin(DE0) * Math.sin(de) + Math.cos(DE0) * Math.cos(de) * Math.cos(ra - RA0);
    if (c <= 0.2) return null;
    return [-(Math.cos(de) * Math.sin(ra - RA0)) / c, (Math.cos(DE0) * Math.sin(de) - Math.sin(DE0) * Math.cos(de) * Math.cos(ra - RA0)) / c];
  }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  // galaktisch -> äquatorial (J2000), Transponierte der Standardmatrix
  var G = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
  function gal2eq(l, b) {
    l *= Math.PI / 180; b *= Math.PI / 180;
    var x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l), z = Math.sin(b);
    var ex = G[0][0] * x + G[1][0] * y + G[2][0] * z, ey = G[0][1] * x + G[1][1] * y + G[2][1] * z, ez = G[0][2] * x + G[1][2] * y + G[2][2] * z;
    var ra = Math.atan2(ey, ex) * 180 / Math.PI; return [(ra + 360) % 360, Math.asin(ez) * 180 / Math.PI];
  }
  var stars = [], mw = [];
  (function build() {
    (AE.stars || []).forEach(function (s) { var p = proj(s.ra, s.dec); if (p && s.mag < 6.6) stars.push({ p: p, m: s.mag, col: s.col || '#fff' }); });
    var g = rnd(2026);
    // schwache „Füll“-Sterne bis ca. 8 mag, zur Milchstraße hin dichter
    for (var i = 0; i < 2600; i++) {
      var l = 20 + g() * 110, b = (g() - 0.5) * 2 * (g() < 0.55 ? 12 : 60), q = gal2eq(l, b), p = proj(q[0], q[1]);
      if (p) stars.push({ p: p, m: 5.2 + g() * 2.9, col: g() < 0.15 ? '#ffd9b0' : g() < 0.3 ? '#cfe0ff' : '#ffffff' });
    }
    for (var L = 0; L <= 140; L += 1.5) {
      var c = gal2eq(L, 0), pp = proj(c[0], c[1]); if (!pp) continue;
      var w = 9 + 4 * Math.sin(L / 9) + (L > 60 && L < 90 ? -3 : 0), bright = 0.55 + 0.45 * Math.cos((L - 15) / 70);
      mw.push({ p: pp, w: w, k: bright, dark: (L > 60 && L < 85) }); // „Großer Riss“ im Schwan
    }
  })();

  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, cur = +range.value, target = cur, raf = 0, t0 = 0;
  var houses = (function () { var g = rnd(9), a = []; for (var i = 0; i < 16; i++) a.push({ x: i / 16 + g() * 0.03, w: 0.035 + g() * 0.03, h: 0.04 + g() * 0.07, win: g() }); return a; })();
  function size() {
    var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(280, r.width); H = Math.round(W * (W < 560 ? 0.78 : 0.52));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(cur);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function at(arr, k) { var i = Math.floor(k), f = k - i; return lerp(arr[Math.max(0, Math.min(8, i))], arr[Math.max(0, Math.min(8, i + 1))], f); }
  function draw(k) {
    var idx = k - 1, glow = at(GLOW, idx), mwA = at(MW, idx);
    var lim = 7.8 - idx * 0.5, s = Math.min(W, H * 1.5) * 0.62 * SCALE, cx = W / 2, cy = H * 0.46;
    // Himmel
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgb(' + Math.round(lerp(6, 70, glow)) + ',' + Math.round(lerp(9, 62, glow)) + ',' + Math.round(lerp(24, 78, glow)) + ')');
    g.addColorStop(1, 'rgb(' + Math.round(lerp(14, 200, glow)) + ',' + Math.round(lerp(18, 130, glow)) + ',' + Math.round(lerp(40, 80, glow)) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Milchstraße
    if (mwA > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      mw.forEach(function (m) {
        var x = cx + m.p[0] * s, y = cy - m.p[1] * s, r = m.w / 57.3 * s;
        var rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        var a = 0.10 * mwA * m.k * (m.dark ? 0.55 : 1);
        rg.addColorStop(0, 'rgba(215,215,255,' + a + ')'); rg.addColorStop(1, 'rgba(215,215,255,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      });
      ctx.restore();
    }
    // Sterne
    var tw = 0;
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i]; if (st.m > lim) continue;
      var x = cx + st.p[0] * s, y = cy - st.p[1] * s; if (x < -4 || x > W + 4 || y < -4 || y > H) continue;
      var br = Math.min(1, (lim - st.m) / 2.2 + 0.08), r = Math.max(0.45, (6.8 - st.m) * 0.42);
      if (tw) br *= 0.85 + 0.15 * Math.sin(tw + i);
      ctx.globalAlpha = br; ctx.fillStyle = st.col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Lichtglocke am Horizont
    var hg = ctx.createLinearGradient(0, H * 0.45, 0, H);
    hg.addColorStop(0, 'rgba(255,170,90,0)'); hg.addColorStop(1, 'rgba(255,170,90,' + Math.min(0.75, glow * 1.05) + ')');
    ctx.fillStyle = hg; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    // Silhouette: Hügel & Bäume (dunkel) bzw. Häuser mit Licht (hell)
    var base = H * 0.9;
    ctx.fillStyle = '#05060c'; ctx.beginPath(); ctx.moveTo(0, H);
    for (var X = 0; X <= W; X += 8) ctx.lineTo(X, base - Math.sin(X / W * 7) * H * 0.025 - Math.sin(X / W * 17) * H * 0.012);
    ctx.lineTo(W, H); ctx.fill();
    var city = Math.max(0, Math.min(1, (k - 3.5) / 4));
    houses.forEach(function (h, i) {
      var vis = (i / houses.length) < city * 1.05; if (!vis) return;
      var x = h.x * W, w = h.w * W, hh = h.h * H * (0.6 + city), y = base - hh;
      ctx.fillStyle = '#06070d'; ctx.fillRect(x, y, w, hh + H * 0.05);
      ctx.fillStyle = 'rgba(255,205,120,' + (0.5 + 0.4 * h.win) + ')';
      for (var wy = y + 5; wy < base - 4; wy += 9) for (var wx = x + 4; wx < x + w - 4; wx += 8) if (((wx * 7 + wy * 3) | 0) % 3) ctx.fillRect(wx, wy, 3, 4);
    });
    if (k <= 3.5) { // Bäume
      ctx.fillStyle = '#04050a';
      [0.08, 0.13, 0.7, 0.76, 0.92].forEach(function (f, i) { var x = f * W, y = base - 4; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x, y - 34 - i * 4); ctx.lineTo(x + 12, y); ctx.fill(); });
    }
  }
  function loop(now) {
    raf = 0;
    var d = target - cur;
    if (Math.abs(d) > 0.01) cur += d * 0.16; else cur = target;
    draw(cur);
    // Nur während des Übergangs zwischen zwei Klassen animieren – danach steht das Bild (kein Dauer-Neuzeichnen)
    if (cur !== target && !document.hidden) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function text(k) {
    var b = B[k - 1];
    $('bortleVal').textContent = k;
    $('bortleBadge').innerHTML = '<b>Bortle ' + k + '</b> · ' + b.n;
    $('bortleBadge').style.setProperty('--bc', b.c);
    $('bortleText').innerHTML = '<h4>' + b.n + '</h4><p class="small">' + b.see + '</p>' +
      '<div class="bortle-facts"><span>⭐ Grenzgröße bloßes Auge: <b>' + b.nelm + ' mag</b></span><span>📏 Himmelshelligkeit (SQM): <b>' + b.sqm + ' mag/″²</b></span>' +
      '<span>🌌 Milchstraße: <b>' + (MW[k - 1] > 0.6 ? 'prächtig' : MW[k - 1] > 0.3 ? 'gut sichtbar' : MW[k - 1] > 0.05 ? 'nur schwach' : 'unsichtbar') + '</b></span></div>';
    range.setAttribute('aria-valuetext', 'Bortle ' + k + ': ' + b.n);
    range.style.setProperty('--p', ((k - 1) / 8 * 100) + '%');
  }
  range.addEventListener('input', function () { target = +range.value; text(target); kick(); });
  window.addEventListener('resize', function () { size(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting && cv.width !== Math.round(Math.max(280, cv.getBoundingClientRect().width) * Math.min(2, window.devicePixelRatio || 1))) size(); }).observe(cv);
  AE.on && AE.on('fold', function () { setTimeout(size, 50); });
  document.addEventListener('click', function (e) { if (e.target.closest('#fh-bortle')) setTimeout(function () { size(); kick(); }, 380); });
  AE._bortle = { set: function (k) { range.value = k; target = cur = k; text(k); draw(k); }, data: B };
  text(cur); size();
})();
