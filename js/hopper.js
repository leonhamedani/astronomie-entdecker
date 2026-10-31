/* Astrogator: Handy liegt auf dem Teleskop-Tubus und führt zum Ziel („digitale Teilkreise“).
   Ablauf: Start → Ausrichten (an hellem Objekt) → Ziel wählen → Navigieren. Mathematik in hopper-math.js. */
(function () {
  'use strict';
  var root = document.querySelector('.hp-main');
  if (!root || !window.AE || !AE.HM) return;
  var H = AE.HM, $ = function (id) { return document.getElementById(id); };
  var fmt = function (x, d) { return AE.fmtNum(x, d == null ? 1 : d); };

  /* ---------- Einstellungen ---------- */
  var SKEY = 'ae-hopper-v1';
  var cfg = { reversed: false, fov: 1, compass: 'auto' };
  try { var sv = JSON.parse(localStorage.getItem(SKEY) || 'null'); if (sv) { cfg.reversed = !!sv.reversed; if (sv.fov >= 0.2 && sv.fov <= 5) cfg.fov = +sv.fov; if (sv.compass === 'aus') cfg.compass = 'aus'; } } catch (e) {}
  function saveCfg() { try { localStorage.setItem(SKEY, JSON.stringify(cfg)); } catch (e) {} }

  /* ---------- Objekte ---------- */
  var objs = [];
  function starHor(m, o) { var h = AE.vecToHor(m, o.v); h.alt += H.refraction(h.alt); return h; }
  function buildObjects() {
    AE.PLANETS.forEach(function (p) { objs.push({ id: p.id, name: p.de, sub: 'Planet', kind: 'planet', body: p.id, mag: null, e: p.e, key: p.de + ' ' + p.id }); });
    objs.push({ id: 'Moon', name: 'Mond', sub: 'Erdbegleiter', kind: 'moon', body: 'Moon', mag: -12, e: '🌙', key: 'mond moon luna' });
    (window.AE_DSO || []).forEach(function (d) {
      objs.push({ id: d[0], name: d[0] + (d[5] ? ' · ' + d[5] : ''), sub: d[4] + (d[6] ? ' · ' + d[6] : ''), kind: 'dso', mag: d[3], v: AE.toVec(d[1], d[2]), e: '🌌',
        key: d[0] + ' ' + d[0].replace('M', 'M ') + ' messier ' + d[5] + ' ' + d[4] + ' ' + d[6] });
    });
    AE.stars.forEach(function (s) {
      if (!s.name || s.mag > 3.5) return;
      var con = AE.cons[s.con];
      objs.push({ id: 'S:' + s.name, name: s.name, sub: (s.desig || '') + (con ? ' · ' + con.de : ''), kind: 'star', mag: s.mag, v: s.v, e: '⭐', key: s.name + ' ' + s.desig + ' ' + (con ? con.de + ' ' + con.la : '') });
    });
    objs.forEach(function (o) { o.k = norm(o.key + ' ' + o.name); });
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss'); }
  // Positionen aller Objekte aktualisieren (Sterne schnell per Matrix, Planeten über Astronomy Engine)
  var posAt = 0;
  function updatePositions(force) {
    var now = Date.now(); if (!force && now - posAt < 2000) return; posAt = now;
    var d = new Date(now), m = AE.horMatrix(d);
    objs.forEach(function (o) {
      if (o.body) {
        try {
          var h = AE.bodyHor(o.body, d); o.alt = h.alt; o.az = h.az;
          if (o.kind === 'planet') o.mag = window.Astronomy.Illumination(o.body, d).mag;
        } catch (e) { o.alt = -90; o.az = 0; }
      } else { var hh = starHor(m, o); o.alt = hh.alt; o.az = hh.az; }
    });
  }
  function objHor(o) { if (o.body || Date.now() - posAt > 2000) updatePositions(true); return { alt: o.alt, az: o.az }; }

  /* ---------- Sensor-Pipeline ---------- */
  var S = { src: null, mode: null, raw: null, sens: null, cur: null, off: null, offMode: null, alignedAt: 0, lastEvt: 0, lastAbs: 0, iosC: null, count: 0 };
  var smooth = new H.Smoother(0.22);
  var samples = []; // für die Ausrichtungsmessung
  function onOrientation(alpha, beta, gamma, kind) {
    if (beta == null || isNaN(beta)) return;
    var now = performance.now(), mode;
    if (kind === 'sim') mode = 'sim';
    else if (kind === 'abs') { S.lastAbs = now; if (cfg.compass === 'aus') return; mode = 'kompass'; }
    else { if (cfg.compass !== 'aus' && now - S.lastAbs < 1500) return; mode = kind === 'ios' ? 'ios' : 'relativ'; }
    if (alpha == null || isNaN(alpha)) alpha = 0;
    if (mode !== S.mode) { S.mode = mode; smooth.reset(); if (S.off && S.offMode !== mode) { S.off = null; toastOnce('Sensorquelle gewechselt – bitte neu ausrichten.'); } }
    S.lastEvt = now; S.count++;
    var v = H.pointingVector(alpha, beta, gamma || 0, cfg.reversed);
    var sv = smooth.push(v);
    S.sens = H.vecToAltAz(sv);
    S.raw = H.vecToAltAz(v);
    samples.push({ t: now, alt: S.raw.alt, az: S.raw.az }); if (samples.length > 240) samples.splice(0, samples.length - 240);
    S.cur = S.off ? H.applyOffset(S.sens, S.off) : (absMode() ? { alt: S.sens.alt, az: S.sens.az } : null);
    schedule();
  }
  // Ist der Azimut ohne Ausrichtung schon auf Nord bezogen?
  function absMode() { return S.mode === 'kompass' || (S.mode === 'ios' && S.iosC != null) || S.mode === 'sim'; }

  var iosLast = null;
  function handleEvent(e) {
    var kind = e.type === 'deviceorientationabsolute' ? 'abs' : (e.absolute === true ? 'abs' : 'rel');
    var a = e.alpha;
    if (kind === 'rel' && typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) {
      kind = 'ios';
      // iOS: alpha ist relativ, webkitCompassHeading der Kompasskurs. Differenz = Drehung zwischen beiden Bezugssystemen.
      if (cfg.compass !== 'aus' && !S.off && Math.abs(e.beta) < 60 && (e.webkitCompassAccuracy == null || e.webkitCompassAccuracy >= 0)) {
        var c = H.wrap180((360 - e.webkitCompassHeading) - a);
        S.iosC = S.iosC == null ? c : S.iosC + 0.05 * H.wrap180(c - S.iosC);
      }
      if (cfg.compass !== 'aus' && S.iosC != null) a = a + S.iosC; // nach der Ausrichtung eingefroren
      iosLast = e;
    }
    onOrientation(a, e.beta, e.gamma, kind);
  }
  var listening = false;
  function listen() {
    if (listening) return; listening = true;
    window.addEventListener('deviceorientationabsolute', handleEvent);
    window.addEventListener('deviceorientation', handleEvent);
  }
  function activate() {
    var msg = $('hpSensMsg'); msg.textContent = 'Sensoren werden gestartet …'; msg.className = 'hp-msg';
    keepAwake();
    var DOE = window.DeviceOrientationEvent;
    var go = function () {
      listen(); S.src = 'sensor'; stopSim();
      var c0 = S.count;
      setTimeout(function () {
        if (S.count > c0 || S.src !== 'sensor') { msg.textContent = '✅ Sensoren laufen. Weiter mit dem Ausrichten.'; msg.className = 'hp-msg ok'; if (S.src === 'sensor') show('align'); }
        else { msg.innerHTML = '⚠️ Keine Lagesensoren gefunden (z. B. am PC). Du kannst die <b>Simulation</b> ausprobieren.'; msg.className = 'hp-msg warn'; S.src = null; }
        renderLive();
      }, 1500);
    };
    if (DOE && typeof DOE.requestPermission === 'function') {
      // iOS 13+: Erlaubnis nur direkt nach einem Tippen
      DOE.requestPermission().then(function (r) {
        if (r === 'granted') go(); else { msg.textContent = '❌ Zugriff auf die Bewegungssensoren wurde abgelehnt. In Safari: „aA“ → Website-Einstellungen → Bewegung & Ausrichtung erlauben, dann Seite neu laden.'; msg.className = 'hp-msg warn'; }
      }).catch(function () { msg.textContent = '❌ Sensor-Freigabe nicht möglich. Bitte die Seite über https öffnen und erneut tippen.'; msg.className = 'hp-msg warn'; });
    } else if (!DOE) { msg.innerHTML = '⚠️ Dieser Browser unterstützt keine Lagesensoren. Probier die <b>Simulation</b>.'; msg.className = 'hp-msg warn'; }
    else go();
  }

  /* ---------- Simulation ---------- */
  var SIM_ERR = { az: 23, alt: 1.5 }, simOn = false;
  function startSim() {
    simOn = true; S.src = 'sim'; $('hpSim').hidden = false; root.classList.add('hp-simon');
    $('hpSensMsg').textContent = '🖥️ Simulation aktiv – bewege den „Tubus“ mit den Reglern unten.'; $('hpSensMsg').className = 'hp-msg ok';
    simPush(); show('align');
  }
  function stopSim() { simOn = false; $('hpSim').hidden = true; root.classList.remove('hp-simon'); }
  function simPush() {
    var alt = +$('hpSimAlt').value, az = +$('hpSimAz').value;
    $('hpSimAltV').textContent = fmt(alt) + '°'; $('hpSimAzV').textContent = fmt(az) + '°';
    // „Sensor“ liefert die Richtung mit absichtlichem Fehler; Ausrichtung muss ihn korrigieren
    var o = H.altAzToOrientation(Math.max(-89.9, Math.min(89.9, alt - SIM_ERR.alt)), az - SIM_ERR.az, cfg.reversed);
    onOrientation(o.alpha, o.beta, o.gamma, 'sim');
  }
  AE._hopperSim = function (alt, az) { $('hpSimAlt').value = alt; $('hpSimAz').value = H.norm360(az); simPush(); for (var i = 0; i < 40; i++) simPush(); };

  /* ---------- Bildschirm anlassen ---------- */
  var wake = null;
  function keepAwake() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && S.src && !wake) keepAwake(); });

  /* ---------- Schritte ---------- */
  var step = 'start', target = null, hopFinal = null;
  function show(s) {
    if ((s === 'nav') && !target) s = 'target';
    step = s;
    document.querySelectorAll('.hp-panel').forEach(function (p) { p.hidden = p.getAttribute('data-step') !== s; });
    document.querySelectorAll('.hp-step').forEach(function (b) { var on = b.getAttribute('data-go') === s; b.classList.toggle('active', on); if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    root.setAttribute('data-step', s);
    if (s === 'align') renderAlign();
    if (s === 'target') renderTargets();
    if (s === 'nav') { lastIn = false; renderNav(); }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  document.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g && root.contains(g)) show(g.getAttribute('data-go')); });

  /* ---------- Listen ---------- */
  function dirOf(az) { return AE.dirShort(az); }
  function li(o, extra) {
    var up = o.alt > 0;
    return '<li><button type="button" class="hp-obj' + (up ? '' : ' below') + '" data-id="' + AE.esc(o.id) + '">' +
      '<span class="hp-oe" aria-hidden="true">' + o.e + '</span><span class="hp-on"><b>' + AE.esc(o.name) + '</b><small>' + AE.esc(o.sub) + (o.mag != null ? ' · ' + fmt(o.mag) + ' mag' : '') + '</small></span>' +
      '<span class="hp-op">' + (up ? fmt(o.alt, 0) + '° ' + dirOf(o.az) : 'unter Horizont') + (extra || '') + '</span></button></li>';
  }
  function byId(id) { for (var i = 0; i < objs.length; i++) if (objs[i].id === id) return objs[i]; return null; }
  function renderAlign() {
    updatePositions();
    var q = norm($('hpAlignQ').value.trim());
    var list = objs.filter(function (o) {
      if (o.kind === 'dso') return false;
      if (q) return o.k.indexOf(q) >= 0 && o.alt > -1;
      return o.alt > 10 && o.alt < 80 && (o.kind !== 'star' || o.mag <= 2.2) && (o.kind !== 'planet' || o.mag < 2.5);
    }).sort(function (a, b) { return (a.mag == null ? 9 : a.mag) - (b.mag == null ? 9 : b.mag); }).slice(0, 40);
    $('hpAlignList').innerHTML = list.length ? list.map(function (o) { return li(o, o.alt > 80 ? ' <em>(nahe Zenit)</em>' : ''); }).join('') : '<li class="muted hp-empty">Gerade kein passendes helles Objekt über 10° Höhe. Suche nach einem Namen.</li>';
  }
  var cat = 'alle';
  function renderTargets() {
    updatePositions();
    var q = norm($('hpTargetQ').value.trim()), only = $('hpOnlyUp').checked;
    var list = objs.filter(function (o) {
      if (cat !== 'alle' && o.kind !== cat) return false;
      if (q && o.k.indexOf(q) < 0) return false;
      if (only && o.alt <= 0) return false;
      if (!q && cat === 'alle' && o.kind === 'star' && o.mag > 1.6) return false;
      return true;
    });
    var rank = { moon: 0, planet: 1, dso: 2, star: 3 };
    list.sort(function (a, b) { return ((b.alt > 0) - (a.alt > 0)) || (q ? 0 : rank[a.kind] - rank[b.kind]) || ((a.mag == null ? 9 : a.mag) - (b.mag == null ? 9 : b.mag)); });
    var more = list.length > 80; list = list.slice(0, 80);
    $('hpTargetList').innerHTML = list.length ? list.map(function (o) { return li(o); }).join('') + (more ? '<li class="muted hp-empty">… weitere über die Suche</li>' : '') : '<li class="muted hp-empty">Nichts gefunden' + (only ? ' – evtl. steht es gerade unter dem Horizont (Haken oben entfernen).' : '.') + '</li>';
  }
  $('hpAlignQ').addEventListener('input', renderAlign);
  $('hpTargetQ').addEventListener('input', renderTargets);
  $('hpOnlyUp').addEventListener('change', renderTargets);
  document.querySelectorAll('.hp-cats .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      cat = b.getAttribute('data-cat');
      document.querySelectorAll('.hp-cats .chip').forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      renderTargets();
    });
  });
  $('hpAlignList').addEventListener('click', function (e) { var b = e.target.closest('.hp-obj'); if (b) startAlign(byId(b.getAttribute('data-id')), 'target'); });
  $('hpTargetList').addEventListener('click', function (e) { var b = e.target.closest('.hp-obj'); if (b) { target = byId(b.getAttribute('data-id')); hopFinal = null; show('nav'); } });
  $('hpSkipAlign').addEventListener('click', function () {
    if (!S.sens) { AE.toast('Erst Sensoren aktivieren oder die Simulation starten.'); return; }
    if (!absMode()) { AE.toast('Ohne Kompass geht es nur mit Ausrichtung.'); return; }
    S.off = null; show('target');
  });

  /* ---------- Ausrichtung mit Countdown ---------- */
  var cd = null;
  function startAlign(o, next, onDone) {
    if (!o) return;
    if (!S.sens) { AE.toast('Erst „Sensoren aktivieren“ (oder Simulation) – dann ausrichten.'); show('start'); return; }
    cancelAlign();
    var n = 3, t0 = performance.now();
    $('hpCountObj').textContent = o.name; $('hpCountN').textContent = n; $('hpCount').hidden = false;
    $('hpCount').classList.remove('bad');
    cd = setInterval(function () {
      n--;
      if (n > 0) { $('hpCountN').textContent = n; return; }
      clearInterval(cd); cd = null;
      // Mittel der Rohwerte der letzten 1,5 s (ungeglättet → keine Verzögerung)
      var now = performance.now(), use = samples.filter(function (s) { return s.t > Math.max(t0 + 1000, now - 1500); });
      if (!use.length && S.raw) use = [S.raw];
      if (!use.length) { $('hpCount').hidden = true; AE.toast('Keine Sensordaten – bitte erneut versuchen.'); return; }
      var sp = H.spread(use);
      if (sp > 1.5) { $('hpCountN').textContent = '✋'; $('hpCount').classList.add('bad'); $('hpCount').querySelector('.hp-count-w').textContent = 'Zu viel Bewegung (' + fmt(sp) + '°) – bitte nochmal.'; setTimeout(function () { $('hpCount').hidden = true; $('hpCount').querySelector('.hp-count-w').textContent = 'Nicht wackeln!'; }, 1800); return; }
      var m = H.meanAltAz(use), truth = objHor(o);
      S.off = H.computeOffset(m, truth); S.offMode = S.mode; S.alignedAt = Date.now(); S.alignObj = o.name;
      smooth.reset(); S.sens = null;
      if (S.src === 'sim') simPush();
      $('hpCount').hidden = true;
      if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {}
      AE.toast('✅ Ausgerichtet auf ' + o.name + ' (Korrektur Höhe ' + fmt(S.off.dAlt) + '°, Azimut ' + fmt(S.off.dAz) + '°)');
      renderLive();
      if (onDone) onDone();
      show(next === 'stay' ? 'nav' : (target ? 'nav' : 'target'));
    }, 1000);
  }
  function cancelAlign() { if (cd) clearInterval(cd); cd = null; $('hpCount').hidden = true; }
  $('hpCountCancel').addEventListener('click', cancelAlign);
  $('hpSync').addEventListener('click', function () {
    if (!target) return;
    var fin = hopFinal;
    startAlign(target, 'stay', fin ? function () { target = fin; hopFinal = null; setTimeout(function () { AE.toast('🦘 Neu ausgerichtet – weiter zu ' + fin.name); }, 1600); } : null);
  });

  /* ---------- Navigation ---------- */
  var lastIn = false, raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; renderLive(); if (step === 'nav') renderNav(); }); }
  function renderLive() {
    var src = S.src === 'sim' ? '🖥️ Simulation' : S.mode === 'kompass' ? '🧭 Kompass' : S.mode === 'ios' ? (S.iosC != null && cfg.compass !== 'aus' ? '🧭 Kompass (iOS)' : '🔄 Relativ') : S.mode === 'relativ' ? '🔄 Relativ (Kreisel)' : 'aus';
    $('hpSrc').textContent = 'Sensor: ' + src;
    var c = S.cur || S.sens;
    $('hpPos').textContent = c ? 'Tubus: Höhe ' + fmt(c.alt) + '° · Az ' + (S.cur ? fmt(c.az) + '° ' + dirOf(c.az) : '?') : 'Tubus: –';
    $('hpAl').textContent = S.off ? '✅ ausgerichtet' + (S.alignObj ? ' (' + S.alignObj + ')' : '') : '⚠️ nicht ausgerichtet';
    $('hpAl').className = 'hp-live-al' + (S.off ? ' ok' : '');
  }
  function renderNav() {
    if (!target) return;
    var card = $('hpNavCard'), t = objHor(target);
    $('hpT4').textContent = target.name; $('hpTSub').textContent = target.sub + (target.mag != null ? ' · ' + fmt(target.mag) + ' mag' : '');
    $('hpCur').textContent = 'Ziel: Höhe ' + fmt(t.alt) + '° · Az ' + fmt(t.az) + '° ' + dirOf(t.az) + (t.alt < 0 ? ' – unter dem Horizont!' : '');
    var c = S.cur;
    if (!c) {
      card.className = 'hp-card hp-navcard wait';
      ['hpValUp', 'hpValRt', 'hpDist'].forEach(function (id) { $(id).textContent = '–'; });
      $('hpStatus').textContent = !S.sens ? 'Warte auf Sensordaten … (Schritt 1)' : 'Bitte zuerst ausrichten (Schritt 2) – ohne Kompass kennt das Handy die Himmelsrichtung nicht.';
      drawRadar(null, t); $('hpHop').hidden = true; return;
    }
    var d = H.delta(c, t), fov = cfg.fov, inT = d.dist <= (lastIn ? fov * 1.25 : fov);
    $('hpArUp').textContent = d.up >= 0 ? '↑' : '↓'; $('hpLbUp').textContent = d.up >= 0 ? 'Hoch' : 'Runter';
    $('hpArRt').textContent = d.right >= 0 ? '→' : '←'; $('hpLbRt').textContent = d.right >= 0 ? 'Rechts' : 'Links';
    $('hpValUp').textContent = fmt(Math.abs(d.up)) + '°'; $('hpValRt').textContent = fmt(Math.abs(d.right)) + '°';
    $('hpAxUp').classList.toggle('done', Math.abs(d.up) <= fov); $('hpAxRt').classList.toggle('done', Math.abs(d.right) * Math.cos(c.alt * Math.PI / 180) <= fov);
    $('hpDist').textContent = fmt(d.dist) + '°';
    card.className = 'hp-card hp-navcard' + (inT ? ' hit' : d.dist < fov * 5 ? ' close' : '');
    var st = inT ? '🎯 Im Ziel! Schau ins Okular' : d.dist < fov * 5 ? 'Fast da – langsam weiter …' : 'Schwenke in Pfeilrichtung';
    if (t.alt < 0) st = '⚠️ Das Ziel steht unter dem Horizont';
    if ($('hpStatus').textContent !== st) $('hpStatus').textContent = st;
    if (inT && !lastIn && navigator.vibrate) { try { navigator.vibrate([90, 60, 90]); } catch (e) {} }
    lastIn = inT;
    hopHint(c, t, d);
    var age = S.alignedAt ? (Date.now() - S.alignedAt) / 60000 : 0;
    var dr = $('hpDrift');
    if (S.off && age > 10) { dr.hidden = false; dr.textContent = '⏱️ Ausrichtung ist ' + Math.round(age) + ' min alt – Handy-Kreisel driften. Bei Abweichung am Ziel oder einem hellen Stern neu ausrichten.'; }
    else if (!S.off) { dr.hidden = false; dr.textContent = '🧭 Nur Kompass, nicht ausgerichtet – Abweichungen von 5–10° sind normal. Für Genauigkeit erst ausrichten.'; }
    else dr.hidden = true;
    drawRadar(d, t, c);
  }
  var hopKey = '';
  function hopHint(c, t, d) {
    var el = $('hpHop');
    if (d.dist <= 20 || hopFinal || target.kind === 'star') { el.hidden = true; hopKey = ''; return; }
    // heller Stern nahe am Ziel als Zwischenstation
    var best = null, bs = 99;
    objs.forEach(function (o) {
      if (o.kind !== 'star' || o.mag > 2.5 || o.alt < 10) return;
      var s = H.separation(o.alt, o.az, t.alt, t.az);
      if (s < bs && s < Math.min(15, d.dist * 0.6) && s > 0.5) { bs = s; best = o; }
    });
    if (!best) { el.hidden = true; return; }
    var k = best.id + Math.round(bs);
    if (k === hopKey && !el.hidden) return; hopKey = k;
    el.hidden = false;
    el.innerHTML = '🦘 <b>Weiter Weg (' + fmt(d.dist, 0) + '°).</b> Tipp: Fahre zuerst zum hellen Stern <b>' + AE.esc(best.name) + '</b> (' + fmt(bs) + '° vom Ziel), richte dort neu aus – dann ist der letzte Sprung genauer. ' +
      '<button type="button" class="chip" id="hpHopGo">Zuerst zu ' + AE.esc(best.name) + '</button>';
    $('hpHopGo').onclick = function () { hopFinal = target; target = best; renderNav(); AE.toast('Zwischenstopp ' + best.name + ' – dort „hier neu ausrichten“ tippen.'); };
  }
  // Radar: Fadenkreuz = Tubus, Punkt = Ziel; nicht-linearer Maßstab (nah = genau, fern = gestaucht)
  var rc = $('hpRadar'), rx = rc.getContext('2d');
  function rScale(dist, R) { return R * dist / (dist + 8); }
  function drawRadar(d, t, c) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), css = rc.clientWidth || 240;
    if (rc.width !== Math.round(css * dpr)) { rc.width = rc.height = Math.round(css * dpr); }
    var W = rc.width, R = W / 2 - 6 * dpr, cx = W / 2, cy = W / 2;
    rx.setTransform(1, 0, 0, 1, 0, 0); rx.clearRect(0, 0, W, W);
    var hit = d && d.dist <= cfg.fov * 1.25;
    rx.lineWidth = dpr; rx.strokeStyle = 'rgba(255,120,120,.28)'; rx.fillStyle = 'rgba(255,140,140,.75)'; rx.font = (11 * dpr) + 'px system-ui,sans-serif'; rx.textAlign = 'left';
    [2, 10, 40].forEach(function (g) { var r = rScale(g, R); rx.beginPath(); rx.arc(cx, cy, r, 0, 7); rx.stroke(); rx.fillText(g + '°', cx + r * 0.71 + 2 * dpr, cy - r * 0.71); });
    // Sichtfeld
    rx.beginPath(); rx.arc(cx, cy, Math.max(3 * dpr, rScale(cfg.fov, R)), 0, 7); rx.strokeStyle = hit ? '#7dffb0' : '#ffd76a'; rx.lineWidth = 2 * dpr; rx.stroke();
    // Fadenkreuz
    rx.strokeStyle = 'rgba(255,255,255,.6)'; rx.lineWidth = 1.5 * dpr; rx.beginPath(); rx.moveTo(cx - R, cy); rx.lineTo(cx + R, cy); rx.moveTo(cx, cy - R); rx.lineTo(cx, cy + R); rx.stroke();
    rx.fillStyle = 'rgba(255,255,255,.7)'; rx.textAlign = 'center'; rx.fillText('hoch', cx, 14 * dpr); rx.fillText('runter', cx, W - 6 * dpr);
    if (!d) return;
    var x = d.right * Math.cos(c.alt * Math.PI / 180), y = d.up, len = Math.sqrt(x * x + y * y) || 1, r = rScale(d.dist, R);
    var px = cx + x / len * r, py = cy - y / len * r;
    rx.strokeStyle = hit ? '#7dffb0' : '#ffb347'; rx.lineWidth = 2 * dpr; rx.setLineDash([4 * dpr, 4 * dpr]); rx.beginPath(); rx.moveTo(cx, cy); rx.lineTo(px, py); rx.stroke(); rx.setLineDash([]);
    rx.fillStyle = hit ? '#7dffb0' : '#ffd76a'; rx.beginPath(); rx.arc(px, py, 7 * dpr, 0, 7); rx.fill();
    rx.fillStyle = '#fff'; rx.font = 'bold ' + (12 * dpr) + 'px system-ui,sans-serif'; rx.fillText(target.id.replace('S:', '').slice(0, 10), Math.min(W - 30 * dpr, Math.max(30 * dpr, px)), py > cy ? py + 20 * dpr : py - 12 * dpr);
  }

  /* ---------- Toast nur einmal ---------- */
  var toasted = {};
  function toastOnce(m) { if (toasted[m]) return; toasted[m] = 1; AE.toast && AE.toast(m); }

  /* ---------- Bedienelemente ---------- */
  $('hpActivate').addEventListener('click', activate);
  $('hpSimBtn').addEventListener('click', startSim);
  ['hpSimAlt', 'hpSimAz'].forEach(function (id) { $(id).addEventListener('input', simPush); });
  document.addEventListener('keydown', function (e) {
    if (!simOn || e.altKey || e.ctrlKey || e.metaKey) return;
    var tg = e.target && e.target.tagName; if (tg === 'INPUT' && e.target.type !== 'range' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    var st = e.shiftKey ? 0.1 : 1, a = $('hpSimAlt'), z = $('hpSimAz');
    if (e.key === 'ArrowUp') a.value = Math.min(90, +a.value + st); else if (e.key === 'ArrowDown') a.value = Math.max(-10, +a.value - st);
    else if (e.key === 'ArrowRight') z.value = H.norm360(+z.value + st); else if (e.key === 'ArrowLeft') z.value = H.norm360(+z.value - st); else return;
    e.preventDefault(); simPush();
  });
  $('hpRev').checked = cfg.reversed; $('hpFov').value = cfg.fov; $('hpFovVal').textContent = fmt(cfg.fov) + '°'; $('hpCompass').value = cfg.compass;
  $('hpRev').addEventListener('change', function () { cfg.reversed = this.checked; saveCfg(); smooth.reset(); if (S.off) { S.off = null; AE.toast('Spiegelung geändert – bitte neu ausrichten.'); } if (simOn) simPush(); renderLive(); });
  $('hpFov').addEventListener('input', function () { cfg.fov = +this.value; $('hpFovVal').textContent = fmt(cfg.fov) + '°'; saveCfg(); if (step === 'nav') renderNav(); });
  $('hpCompass').addEventListener('change', function () { cfg.compass = this.value; saveCfg(); S.iosC = null; S.mode = null; S.off = null; smooth.reset(); AE.toast('Kompass-Einstellung geändert – bitte neu ausrichten.'); renderLive(); });
  if (window.innerWidth > 760) $('hpSettings').open = true;

  // Standort
  function locName() { $('hpLocName').textContent = (AE.loc.name || (fmt(AE.loc.lat, 2) + '°, ' + fmt(AE.loc.lon, 2) + '°')) + (AE.loc.source === 'default' ? ' (Standard)' : ''); }
  $('hpGeo').addEventListener('click', function () {
    if (!navigator.geolocation) { AE.toast('GPS ist in diesem Browser nicht verfügbar.'); return; }
    $('hpGeo').textContent = '🛰️ Suche …';
    navigator.geolocation.getCurrentPosition(function (p) {
      AE.setLocation({ name: 'Mein Standort', lat: p.coords.latitude, lon: p.coords.longitude, source: 'gps' });
      $('hpGeo').textContent = '🛰️ GPS verwenden'; AE.toast('📍 Standort übernommen');
    }, function () { $('hpGeo').textContent = '🛰️ GPS verwenden'; AE.toast('Standort nicht verfügbar – wähle oben rechts eine Stadt.'); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  });
  AE.on('location', function () { locName(); updatePositions(true); if (S.off) { S.off = null; AE.toast('Standort geändert – bitte neu ausrichten.'); } if (step === 'align') renderAlign(); if (step === 'target') renderTargets(); renderLive(); });

  // Positionen regelmäßig (Himmel dreht sich 0,25°/min)
  setInterval(function () {
    updatePositions(); if (step === 'nav') renderNav();
    else if (step === 'align' && !$('hpAlignQ').value) renderAlign();
  }, 5000);

  buildObjects(); updatePositions(true); locName(); renderLive();
  // Test-/Debug-Zugriff
  AE._hopper = { S: S, cfg: cfg, objs: objs, show: show, setTarget: function (id) { target = byId(id); hopFinal = null; show('nav'); }, align: startAlign, byId: byId, state: function () { return { step: step, target: target && target.id, cur: S.cur, off: S.off, mode: S.mode }; } };
  show('start');
})();
