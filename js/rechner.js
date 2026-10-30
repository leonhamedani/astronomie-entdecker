/* Okular-/Vergrößerungsrechner und Belichtungs-Helfer (500er-Regel & NPF-Regel) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var N = function (x, d) { return AE.fmtNum(x, d); };
  var num = function (el) { var v = parseFloat(String(el.value).replace(',', '.')); return isFinite(v) ? v : NaN; };

  /* ================= Okular-Rechner ================= */
  if ($('ocForm')) (function () {
    var P = [
      ['Eigene Werte', 0, 0], ['Refraktor 70/700', 700, 70], ['Newton 114/900', 900, 114], ['Newton 130/900', 900, 130],
      ['Dobson 150/1200', 1200, 150], ['Dobson 200/1200', 1200, 200], ['Maksutov 127/1500', 1500, 127], ['Schmidt-Cassegrain 203/2032', 2032, 203]
    ];
    var EYES = [32, 25, 20, 15, 10, 6, 4];
    var OBJ = [
      { id: 'mond', n: '🌕 Mond', size: 0.52, txt: 'Der Mond ist etwa ein halbes Grad groß (0,52°).' },
      { id: 'plej', n: '✨ Plejaden', size: 1.8, txt: 'Der Sternhaufen M45 ist rund 2° groß – ideal bei kleiner Vergrößerung.' },
      { id: 'jup', n: '🪐 Jupiter', size: 45 / 3600, txt: 'Jupiter erscheint je nach Abstand 30–50″ groß – winzig, darum braucht man Vergrößerung.' },
      { id: 'and', n: '🌌 Andromeda', size: 3, txt: 'Der helle Kern von M31 ist mit bloßem Auge als Fleck sichtbar; die ganze Galaxie ist über 3° lang.' }
    ];
    var obj = 'mond', f = { F: $('ocF'), D: $('ocD'), E: $('ocE'), A: $('ocA'), B: $('ocB') };
    $('ocPreset').innerHTML = P.map(function (p, i) { return '<option value="' + i + '"' + (p[1] === 1200 && p[2] === 150 ? ' selected' : '') + '>' + p[0] + '</option>'; }).join('');
    $('ocEyes').innerHTML = EYES.map(function (e) { return '<button class="chip" type="button" data-eye="' + e + '">' + e + ' mm</button>'; }).join('');
    $('ocObj').innerHTML = OBJ.map(function (o) { return '<button class="chip" type="button" role="tab" data-ocobj="' + o.id + '">' + o.n + '</button>'; }).join('');

    var lastRes = null;
    function calc() {
      var F = num(f.F), D = num(f.D), E = num(f.E), A = num(f.A) || 52, B = parseFloat(f.B.value) || 1;
      if (!(F > 0 && D > 0 && E > 0)) { $('ocRes').innerHTML = '<p class="muted">Bitte Brennweite, Öffnung und Okular eingeben.</p>'; $('ocWarn').innerHTML = ''; return null; }
      var M = F * B / E, fov = A / M, ep = D / M, maxM = 2 * D, minM = D / 7, fr = F / D;
      var lim = 7.7 + 5 * Math.log10(D / 10), res = 116 / D;
      var r = { M: M, fov: fov, ep: ep, maxM: maxM, minM: minM, fr: fr, lim: lim, res: res, F: F, D: D, E: E, A: A, B: B };
      var box = function (ic, l, v, s) { return '<div class="oc-out"><span>' + ic + ' ' + l + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; };
      $('ocRes').innerHTML =
        box('🔎', 'Vergrößerung', N(M, 0) + '×', F + ' mm' + (B > 1 ? ' × ' + N(B, 1) : '') + ' ÷ ' + N(E, 1) + ' mm') +
        box('⭕', 'Wahres Gesichtsfeld', N(fov, 2) + '°', '≈ ' + N(fov / 0.52, 1) + ' Monddurchmesser') +
        box('👁️', 'Austrittspupille', N(ep, 1) + ' mm', ep > 7 ? 'größer als deine Pupille' : ep < 0.5 ? 'sehr klein – Bild wird dunkel und unscharf' : ep <= 1 ? 'ideal für Planeten & Doppelsterne' : ep <= 3 ? 'gut für Mond, Planeten, Kugelhaufen' : 'gut für Nebel & Galaxien') +
        box('📈', 'Max. sinnvolle Vergrößerung', '≈ ' + N(maxM, 0) + '×', '2 × Öffnung in mm · min. ≈ ' + N(minM, 0) + '×') +
        box('⭐', 'Grenzgröße', '≈ ' + N(lim, 1) + ' mag', 'schwächste Sterne bei dunklem Himmel') +
        box('🎯', 'Auflösung', '≈ ' + N(res, 2) + '″', 'Dawes-Grenze · Öffnungsverhältnis f/' + N(fr, 1));
      var w = [];
      if (M > maxM) w.push('<p class="oc-w bad">⚠️ <b>' + N(M, 0) + '× ist zu viel!</b> Über ≈ ' + N(maxM, 0) + '× wird das Bild nur größer, aber nicht schärfer – es wird dunkel und matschig. Nimm ein längeres Okular' + (B > 1 ? ' oder lass die Barlow weg' : '') + '.</p>');
      else if (M > 1.5 * D) w.push('<p class="oc-w warn">🌬️ Grenzbereich: ' + N(M, 0) + '× klappt nur bei sehr ruhiger Luft. In Mitteleuropa sind meist 150–250× das Maximum.</p>');
      if (M < minM) w.push('<p class="oc-w warn">🕳️ Sehr geringe Vergrößerung: Die Austrittspupille (' + N(ep, 1) + ' mm) ist größer als deine dunkeladaptierte Pupille (≈ 7 mm) – ein Teil des Lichts geht verloren' + (fr < 6 ? '' : '') + '.</p>');
      if (!w.length) w.push('<p class="oc-w ok">✅ Passt! ' + N(M, 0) + '× liegt im sinnvollen Bereich dieses Teleskops.</p>');
      $('ocWarn').innerHTML = w.join('');
      $('ocEyes').querySelectorAll('[data-eye]').forEach(function (b) { b.classList.toggle('active', +b.getAttribute('data-eye') === E); });
      lastRes = r; draw(r); return r;
    }
    function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    function draw(r) {
      var o = OBJ.filter(function (x) { return x.id === obj; })[0], R = 130, cx = 150, cy = 150;
      var pxDeg = 2 * R / r.fov, s = '';
      s += '<defs><clipPath id="ocClip"><circle cx="150" cy="150" r="' + R + '"/></clipPath>' +
        '<radialGradient id="ocMoonG" cx=".42" cy=".4"><stop offset="0" stop-color="#f4f1e6"/><stop offset=".7" stop-color="#cfc9b8"/><stop offset="1" stop-color="#9c968a"/></radialGradient>' +
        '<radialGradient id="ocGal" cx=".5" cy=".5"><stop offset="0" stop-color="#fff8e8" stop-opacity=".95"/><stop offset=".25" stop-color="#e8dcc8" stop-opacity=".5"/><stop offset="1" stop-color="#b9c4ff" stop-opacity="0"/></radialGradient></defs>';
      s += '<circle cx="150" cy="150" r="' + (R + 12) + '" class="oc-barrel"/><circle cx="150" cy="150" r="' + R + '" class="oc-field"/>';
      s += '<g clip-path="url(#ocClip)">';
      var g = rnd(7); for (var i = 0; i < 60; i++) s += '<circle cx="' + (g() * 300).toFixed(1) + '" cy="' + (g() * 300).toFixed(1) + '" r="' + (0.4 + g() * 0.9).toFixed(2) + '" fill="#fff" opacity="' + (0.25 + g() * 0.5).toFixed(2) + '"/>';
      var d = o.size * pxDeg;
      if (obj === 'mond') {
        var rr = d / 2, cr = rnd(3), cr2 = '';
        for (var k = 0; k < 14; k++) { var a = cr() * 6.283, q = Math.sqrt(cr()) * rr * 0.8; cr2 += '<circle cx="' + (cx + Math.cos(a) * q).toFixed(1) + '" cy="' + (cy + Math.sin(a) * q).toFixed(1) + '" r="' + (rr * (0.04 + cr() * 0.1)).toFixed(1) + '" class="oc-crater"/>'; }
        s += '<g class="oc-obj-g"><circle cx="' + cx + '" cy="' + cy + '" r="' + rr.toFixed(1) + '" fill="url(#ocMoonG)"/>' +
          '<ellipse cx="' + (cx - rr * .25) + '" cy="' + (cy - rr * .2) + '" rx="' + (rr * .32) + '" ry="' + (rr * .22) + '" class="oc-mare"/><ellipse cx="' + (cx + rr * .22) + '" cy="' + (cy + rr * .05) + '" rx="' + (rr * .22) + '" ry="' + (rr * .3) + '" class="oc-mare"/>' + cr2 + '</g>';
      } else if (obj === 'plej') {
        var c0 = AE.toVec(56.75, 24.12), dec0 = 24.12 * Math.PI / 180, ra0 = 56.75 * Math.PI / 180, list = (AE.stars || []).filter(function (st) { return Math.abs(st.ra - 56.75) < 3 && Math.abs(st.dec - 24.12) < 2.5 && st.mag < 7.5; });
        if (!list.length) list = [[56.87, 24.1, 2.9], [57.29, 24.05, 3.6], [56.22, 24.11, 3.7], [56.58, 23.95, 3.9], [56.3, 24.47, 4.3], [56.48, 24.37, 5.1], [56.2, 24.29, 4.1]].map(function (a) { return { ra: a[0], dec: a[1], mag: a[2] }; });
        s += '<g class="oc-obj-g">' + list.map(function (st) {
          var ra = st.ra * Math.PI / 180, de = st.dec * Math.PI / 180, cc = Math.sin(dec0) * Math.sin(de) + Math.cos(dec0) * Math.cos(de) * Math.cos(ra - ra0);
          var x = Math.cos(de) * Math.sin(ra - ra0) / cc * 180 / Math.PI, y = (Math.cos(dec0) * Math.sin(de) - Math.sin(dec0) * Math.cos(de) * Math.cos(ra - ra0)) / cc * 180 / Math.PI;
          var px = cx - x * pxDeg, py = cy - y * pxDeg, rad = Math.max(0.8, Math.min(9, (6.5 - st.mag) * 0.9 + 0.8) * Math.min(1.6, Math.max(0.6, pxDeg / 80)));
          return '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + rad.toFixed(2) + '" class="oc-star"/>';
        }).join('') + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (0.9 * pxDeg).toFixed(1) + '" class="oc-neb"/></g>';
      } else if (obj === 'jup') {
        var jr = Math.max(1.2, d / 2), sc = 1 / 3600 * pxDeg;
        s += '<g class="oc-obj-g"><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + jr.toFixed(2) + '" ry="' + (jr * 0.935).toFixed(2) + '" class="oc-jup"/>' +
          (jr > 8 ? '<rect x="' + (cx - jr) + '" y="' + (cy - jr * .28) + '" width="' + 2 * jr + '" height="' + (jr * .16) + '" class="oc-band"/><rect x="' + (cx - jr) + '" y="' + (cy + jr * .12) + '" width="' + 2 * jr + '" height="' + (jr * .18) + '" class="oc-band"/>' : '') +
          [-130, -70, 95, 200].map(function (a, i) { return '<circle cx="' + (cx + a * sc).toFixed(1) + '" cy="' + (cy + (i % 2 ? 2 : -1) * sc).toFixed(1) + '" r="' + Math.max(0.9, Math.min(3, sc * 1.2)).toFixed(2) + '" class="oc-star"/>'; }).join('') + '</g>';
      } else {
        s += '<g class="oc-obj-g" transform="rotate(-35 150 150)"><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (d / 2).toFixed(1) + '" ry="' + (d / 2 * 0.32).toFixed(1) + '" fill="url(#ocGal)"/>' +
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + Math.max(1.5, d * 0.06).toFixed(1) + '" ry="' + Math.max(1.2, d * 0.035).toFixed(1) + '" fill="#fffaf0" opacity=".9"/></g>';
      }
      s += '</g><circle cx="150" cy="150" r="' + R + '" class="oc-rim"/>';
      $('ocSvg').innerHTML = s;
      var ratio = o.size / r.fov, txt;
      if (ratio > 1.05) txt = 'passt <b>nicht</b> ganz ins Gesichtsfeld (' + N(r.fov, 2) + '°) – nimm ein längeres Okular.';
      else if (ratio > 0.5) txt = 'füllt das Gesichtsfeld schön aus (' + Math.round(ratio * 100) + ' % des Durchmessers).';
      else if (ratio > 0.08) txt = 'nimmt etwa ' + Math.round(ratio * 100) + ' % des Gesichtsfelds ein.';
      else txt = 'ist bei ' + N(r.M, 0) + '× so groß, wie der Mond mit bloßem Auge in ' + N(0.52 / (o.size * r.M), 0) + '-facher Entfernung wäre – klein, aber Details sind sichtbar.';
      if (obj === 'jup') txt = 'Jupiter wirkt bei ' + N(r.M, 0) + '× so groß wie ' + (r.M * 45 / 3600 >= 0.52 ? 'der Vollmond oder größer' : 'der Vollmond mit bloßem Auge × ' + N(r.M * 45 / 3600 / 0.52, 2)) + ' – mit seinen 4 hellen Monden.';
      $('ocViewTxt').innerHTML = o.txt + ' ' + (obj === 'jup' ? txt : 'Bei ' + N(r.M, 0) + '× ' + txt);
      $('ocObj').querySelectorAll('[data-ocobj]').forEach(function (b) { var on = b.getAttribute('data-ocobj') === obj; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    }
    $('ocPreset').addEventListener('change', function () { var p = P[+this.value]; if (p[1]) { f.F.value = p[1]; f.D.value = p[2]; } calc(); });
    ['F', 'D'].forEach(function (k) { f[k].addEventListener('input', function () { $('ocPreset').value = '0'; calc(); }); });
    ['E', 'A'].forEach(function (k) { f[k].addEventListener('input', calc); });
    f.B.addEventListener('change', calc);
    $('ocEyes').addEventListener('click', function (e) { var b = e.target.closest('[data-eye]'); if (b) { f.E.value = b.getAttribute('data-eye'); calc(); } });
    $('ocObj').addEventListener('click', function (e) { var b = e.target.closest('[data-ocobj]'); if (b) { obj = b.getAttribute('data-ocobj'); if (lastRes) draw(lastRes); } });
    AE._ocCalc = function (F, D, E, B, A) { f.F.value = F; f.D.value = D; var pi = 0; P.forEach(function (q, i) { if (q[1] === F && q[2] === D) pi = i; }); $('ocPreset').value = String(pi); f.E.value = E; f.B.value = String(B || 1); if (A) f.A.value = A; return calc(); };
    calc();
  })();

  /* ================= Belichtungs-Helfer ================= */
  if ($('exForm')) (function () {
    // [Name, echte Brennweite mm, Crop-Faktor, Blende, Pixelgröße µm] – Handy-Werte sind typische Richtwerte
    var P = [
      ['Smartphone – Hauptkamera (typisch)', 6.9, 3.5, 1.8, 1.2], ['Smartphone – Ultraweitwinkel (typisch)', 2.2, 6, 2.2, 1.0],
      ['APS-C-Kamera + 18 mm f/3,5', 18, 1.5, 3.5, 3.9], ['Vollformat + 14 mm f/2,8', 14, 1, 2.8, 5.9], ['Vollformat + 24 mm f/1,4', 24, 1, 1.4, 5.9],
      ['MFT-Kamera + 12 mm f/2', 12, 2, 2, 3.3], ['Eigene Werte', 0, 0, 0, 0]
    ];
    var f = { F: $('exF'), C: $('exC'), N: $('exN'), P: $('exP'), Dec: $('exDec'), T: $('exT') };
    $('exPreset').innerHTML = P.map(function (p, i) { return '<option value="' + i + '">' + p[0] + '</option>'; }).join('');
    var cur = null;
    function calc() {
      var F = num(f.F), C = num(f.C), Nn = num(f.N), p = num(f.P), dec = +f.Dec.value || 0;
      if (!(F > 0 && C > 0 && Nn > 0 && p > 0)) { $('exRes').innerHTML = '<p class="muted">Bitte alle Werte ausfüllen.</p>'; return null; }
      var feq = F * C, t500 = 500 / feq, cosd = Math.cos(dec * Math.PI / 180);
      var tnpf = (35 * Nn + 30 * p) / F / cosd, t500d = t500 / cosd;
      cur = { feq: feq, t500: t500d, tnpf: tnpf };
      var box = function (ic, l, v, s) { return '<div class="oc-out"><span>' + ic + ' ' + l + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; };
      $('exRes').innerHTML = box('📐', 'Kleinbild-Brennweite', '≈ ' + N(feq, 0) + ' mm', N(F, 1) + ' mm × Crop ' + N(C, 1)) +
        box('5️⃣', '500er-Regel', '≈ ' + N(t500d, 1) + ' s', '500 ÷ ' + N(feq, 0) + (dec ? ' ÷ cos ' + dec + '°' : '') + ' · grob, für alte Filmkameras') +
        box('🎯', 'NPF-Regel (genauer)', '≈ ' + N(tnpf, 1) + ' s', '(35 × ' + N(Nn, 1) + ' + 30 × ' + N(p, 1) + ') ÷ ' + N(F, 1) + (dec ? ' ÷ cos ' + dec + '°' : '') + ' · für punktförmige Sterne');
      $('exNote').innerHTML = 'Die NPF-Regel berücksichtigt Blende und Pixelgröße und ist für moderne, hochauflösende Sensoren meist strenger als die 500er-Regel. Nachtmodi im Handy umgehen das Problem, indem sie viele kurze Bilder automatisch übereinanderlegen.';
      sim(); return cur;
    }
    function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    var STARS = (function () { var g = rnd(42), a = []; for (var i = 0; i < 46; i++) a.push([g() * 300, g() * 150, 0.6 + g() * 1.6 * (g() < .2 ? 2 : 1)]); return a; })();
    function sim() {
      if (!cur) return;
      var t = +f.T.value, ratio = t / cur.tnpf, len = Math.max(0, (ratio - 0.15)) * 3.2; // Strichlänge in px (Pixel-Unschärfe ≈ Sternscheibe)
      $('exTval').textContent = t + ' s';
      var s = '<rect width="300" height="180" class="ex-sky"/>';
      s += STARS.map(function (st) {
        var r = st[2], l = len * (0.6 + st[1] / 150 * 0.8); // höher am Himmel: etwas längere Spur (angedeutet)
        return l < 0.8 ? '<circle cx="' + st[0].toFixed(1) + '" cy="' + st[1].toFixed(1) + '" r="' + r.toFixed(2) + '" class="ex-st"/>' :
          '<line x1="' + st[0].toFixed(1) + '" y1="' + st[1].toFixed(1) + '" x2="' + (st[0] + l).toFixed(1) + '" y2="' + (st[1] - l * 0.35).toFixed(1) + '" stroke-width="' + (r * 2).toFixed(2) + '" class="ex-tr"/>';
      }).join('');
      s += '<path d="M0 180 L0 160 Q60 148 120 160 T220 156 T300 150 L300 180 Z" class="ex-ground"/>';
      $('exSvg').innerHTML = s;
      var v;
      if (ratio <= 1) v = '<span class="pill ok">✅ Punktförmig</span> ' + t + ' s liegt unter der NPF-Grenze (' + N(cur.tnpf, 1) + ' s) – die Sterne bleiben rund.';
      else if (t <= cur.t500) v = '<span class="pill warn">〰️ Leicht länglich</span> ' + t + ' s ist unter der 500er-Grenze (' + N(cur.t500, 1) + ' s), aber über NPF (' + N(cur.tnpf, 1) + ' s): bei 100 % Ansicht sind kurze Striche sichtbar.';
      else v = '<span class="pill no">✖ Strichspuren</span> ' + t + ' s ist zu lang – die Erdrotation zieht die Sterne zu Strichen. Kürzer belichten oder höhere ISO nehmen.';
      $('exVerdict').innerHTML = v;
    }
    $('exPreset').addEventListener('change', function () { var p = P[+this.value]; if (p[1]) { f.F.value = p[1]; f.C.value = p[2]; f.N.value = p[3]; f.P.value = p[4]; } calc(); });
    ['F', 'C', 'N', 'P'].forEach(function (k) { f[k].addEventListener('input', function () { $('exPreset').value = String(P.length - 1); calc(); }); });
    f.Dec.addEventListener('change', calc);
    f.T.addEventListener('input', sim);
    AE._exCalc = function (F, C, Nn, p, dec) { f.F.value = F; f.C.value = C; f.N.value = Nn; f.P.value = p; f.Dec.value = String(dec || 0); return calc(); };
    calc();
  })();

  /* ================= Motiv-Illustrationen füllen ================= */
  (function () {
    function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    var g = rnd(11), s = '';
    // Funkeln in drei Gruppen statt 70 einzeln animierter Sterne (jede Einzelanimation wäre eine eigene Grafik-Ebene)
    document.querySelectorAll('.af-stars').forEach(function (el) { var gr = ['', '', '']; for (var i = 0; i < 70; i++) gr[i % 3] += '<circle cx="' + (g() * 320).toFixed(1) + '" cy="' + (g() * 140).toFixed(1) + '" r="' + (0.4 + g() * 1.1).toFixed(2) + '"/>'; el.innerHTML = gr.map(function (x, k) { return '<g class="tw tw' + (k + 1) + '">' + x + '</g>'; }).join(''); });
    // Eine gemeinsam drehende Gruppe statt 26 einzeln animierter Kreise (spart Grafik-Ebenen)
    document.querySelectorAll('.af-trails').forEach(function (el) { s = '<g class="af-rot">'; for (var i = 0; i < 26; i++) { var r = 8 + i * 6 + g() * 4, a0 = g() * 360; s += '<circle r="' + r.toFixed(1) + '" stroke-dasharray="' + (r * 0.9).toFixed(1) + ' ' + (r * 6).toFixed(1) + '" style="--a:' + a0.toFixed(0) + 'deg;--o:' + (0.35 + g() * .6).toFixed(2) + '"/>'; } s += '</g><circle r="1.6" class="af-polaris"/>'; el.innerHTML = s; });
    document.querySelectorAll('.af-edit-stars').forEach(function (el) { s = ''; for (var i = 0; i < 50; i++) s += '<circle cx="' + (44 + g() * 232).toFixed(1) + '" cy="' + (22 + g() * 112).toFixed(1) + '" r="' + (0.4 + g() * 1.2).toFixed(2) + '"/>'; el.innerHTML = s; });
  })();
})();
