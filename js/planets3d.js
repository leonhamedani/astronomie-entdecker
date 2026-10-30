/* Planeten-Steckbriefe mit drehbaren 3D-Modellen (three.js, Texturen: Solar System Scope, CC BY 4.0) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var P = [
    { id: 'Mercury', tex: 'mercury', de: 'Merkur', e: '☿', type: 'Gesteinsplanet', r: 2439.7, dist: '57,9 Mio. km (0,39 AE)', day: '58,6 Tage (ein Sonnentag dauert sogar 176 Tage)', dayH: 1407.6, year: '88 Tage', moons: '0', temp: '−173 °C bis +427 °C', tilt: 0.03, glow: '#c9b9a6',
      facts: ['Ein Tag auf Merkur (von Mittag zu Mittag) dauert länger als sein ganzes Jahr!', 'Der kleinste Planet – nur etwas größer als unser Mond.', 'Obwohl er der Sonne am nächsten ist, gibt es Wassereis in ewig dunklen Polkratern.'] },
    { id: 'Venus', tex: 'venus', de: 'Venus', e: '♀', type: 'Gesteinsplanet', r: 6051.8, dist: '108,2 Mio. km (0,72 AE)', day: '243 Tage – rückwärts!', dayH: -5832.5, year: '225 Tage', moons: '0', temp: 'ca. +464 °C (überall)', tilt: 177.4, glow: '#ffe3a1',
      facts: ['Der heißeste Planet – heißer als Merkur, wegen des extremen Treibhauseffekts.', 'Sie dreht sich rückwärts: Dort geht die Sonne im Westen auf.', 'Am Boden herrscht ein Druck wie in 900 m Meerestiefe (92 bar).'] },
    { id: 'Earth', tex: 'earth', de: 'Erde', e: '🌍', type: 'Gesteinsplanet', r: 6371, dist: '149,6 Mio. km (1 AE)', day: '23 h 56 min', dayH: 23.93, year: '365,25 Tage', moons: '1 (der Mond)', temp: '−89 °C bis +57 °C (Ø +15 °C)', tilt: 23.44, glow: '#6cb6ff',
      facts: ['Der einzige bekannte Ort im Universum mit Leben.', 'Rund 71 % der Oberfläche sind von Wasser bedeckt.', 'Die Erde rast mit etwa 107.000 km/h um die Sonne – und du merkst nichts davon!'] },
    { id: 'Mars', tex: 'mars', de: 'Mars', e: '♂', type: 'Gesteinsplanet', r: 3389.5, dist: '227,9 Mio. km (1,52 AE)', day: '24 h 37 min', dayH: 24.62, year: '687 Tage', moons: '2 (Phobos & Deimos)', temp: '−140 °C bis +20 °C (Ø −63 °C)', tilt: 25.19, glow: '#ff8a5c',
      facts: ['Olympus Mons ist mit über 21 km der höchste Vulkan im Sonnensystem.', 'Seine rote Farbe kommt von Eisenoxid – Mars ist sozusagen verrostet.', 'Sonnenuntergänge auf dem Mars sind bläulich.'] },
    { id: 'Jupiter', tex: 'jupiter', de: 'Jupiter', e: '♃', type: 'Gasriese', r: 69911, dist: '778,5 Mio. km (5,2 AE)', day: '9 h 56 min', dayH: 9.93, year: '11,9 Jahre', moons: 'über 90', temp: 'ca. −110 °C (Wolkenobergrenze)', tilt: 3.13, glow: '#ffd9a8',
      facts: ['Mehr als 1.300 Erden würden in Jupiter hineinpassen.', 'Der Große Rote Fleck ist ein Wirbelsturm, größer als die ganze Erde.', 'Ganymed, sein größter Mond, ist größer als der Planet Merkur.'] },
    { id: 'Saturn', tex: 'saturn', de: 'Saturn', e: '♄', type: 'Gasriese', r: 58232, dist: '1,43 Mrd. km (9,5 AE)', day: '10 h 33 min', dayH: 10.55, year: '29,4 Jahre', moons: 'über 270', temp: 'ca. −140 °C', tilt: 26.73, glow: '#f3d58b', ring: true,
      facts: ['Saturn hat eine geringere Dichte als Wasser – in einer riesigen Badewanne würde er schwimmen!', 'Die Ringe bestehen aus Eis- und Gesteinsbrocken, haben einen Durchmesser von rund 270.000 km, sind aber meist nur 10 bis 100 m dick.', 'Sein Mond Titan hat eine dichte Atmosphäre und Seen aus flüssigem Methan.'] },
    { id: 'Uranus', tex: 'uranus', de: 'Uranus', e: '⛢', type: 'Eisriese', r: 25362, dist: '2,87 Mrd. km (19,2 AE)', day: '17 h 14 min – rückwärts', dayH: -17.24, year: '84 Jahre', moons: 'über 25', temp: 'ca. −195 °C', tilt: 97.77, glow: '#a8f0ff',
      facts: ['Uranus „rollt“ auf der Seite um die Sonne – seine Achse ist um 98° gekippt.', 'Dadurch dauern Sommer und Winter an den Polen jeweils 42 Jahre.', 'Er war der erste Planet, der mit einem Teleskop entdeckt wurde (1781).'] },
    { id: 'Neptune', tex: 'neptune', de: 'Neptun', e: '♆', type: 'Eisriese', r: 24622, dist: '4,50 Mrd. km (30,1 AE)', day: '16 h 6 min', dayH: 16.11, year: '165 Jahre', moons: '16', temp: 'ca. −200 °C', tilt: 28.32, glow: '#7fa6ff',
      facts: ['Auf Neptun toben die schnellsten Winde des Sonnensystems: über 2.000 km/h.', 'Er wurde 1846 zuerst berechnet und erst dann am Himmel gefunden.', 'Seit seiner Entdeckung hat er die Sonne erst etwa einmal umrundet.'] },
    { id: 'Moon', tex: 'moon', de: 'Mond', e: '🌙', type: 'Erdtrabant', r: 1737.4, dist: '384.400 km von der Erde', day: '27,3 Tage (gebundene Rotation)', dayH: 655.7, year: '27,3 Tage (um die Erde)', moons: '–', temp: '−173 °C bis +127 °C', tilt: 6.68, glow: '#e8e8f0',
      facts: ['Wir sehen immer dieselbe Seite des Mondes – er dreht sich genau so schnell, wie er die Erde umkreist.', 'Er entfernt sich jedes Jahr um etwa 3,8 cm von der Erde.', 'Zwölf Menschen sind bisher auf dem Mond spaziert (1969–1972).'] }
  ];
  var BY = {}; P.forEach(function (p) { BY[p.id] = p; });
  var cur = 'Saturn', compare = false, THREE, renderer, scene, camera, ready = false, visible = false, raf = null;
  var single = {}, compareGroup = null, texCache = {};
  var cv = $('planetCanvas'), loading = $('planetLoading');

  /* ---------- Fakten ---------- */
  function visBlock(p) {
    if (p.id === 'Earth') return '<div class="pv"><span class="pill ok">Du stehst drauf 🌍</span> Schau lieber nach oben – zum Beispiel auf die Himmelskarte!</div>';
    var night = AE.nightInfo(new Date()), b = AE.bestDuringNight(p.id, night);
    if (b.alt > 5) return '<div class="pv"><span class="pill ok">Heute Nacht sichtbar</span><div class="pos"><div class="compass-mini" style="--az:' + b.az.toFixed(0) + 'deg"><i></i></div><div><b>' + AE.dirText(b.az) + '</b><span>' + AE.altText(b.alt) + ' · beste Zeit ' + AE.fmtTime(b.time) + ' Uhr</span></div></div>' +
      '<button class="mini-btn" data-show="' + b.alt.toFixed(1) + ',' + b.az.toFixed(1) + ',' + b.time.getTime() + '">Auf der Himmelskarte zeigen →</button></div>';
    var el = p.id === 'Moon' ? 99 : window.Astronomy.Elongation(p.id, new Date()).elongation;
    return '<div class="pv"><span class="pill no">Heute Nacht nicht sichtbar</span> <span class="muted small">' + (el < 18 ? 'Steht zu nah an der Sonne (' + Math.round(el) + '°).' : 'Bleibt in der Dunkelheit unter dem Horizont.') + '</span></div>';
  }
  function renderFacts() {
    var p = BY[cur], rel = p.r / 6371;
    $('planetFacts').innerHTML = '<div class="pf-head"><span class="pf-sym">' + p.e + '</span><div><p class="eyebrow">' + p.type + '</p><h3>' + p.de + '</h3></div></div>' +
      '<div class="pf-grid">' +
      '<div><span>Durchmesser</span><b>' + Math.round(p.r * 2).toLocaleString('de-DE') + ' km</b><small>' + (p.id === 'Earth' ? 'Referenz' : AE.fmtNum(rel, rel < 1 ? 2 : 1) + '× Erde') + '</small></div>' +
      '<div><span>' + (p.id === 'Moon' ? 'Entfernung' : 'Abstand zur Sonne') + '</span><b>' + p.dist + '</b></div>' +
      '<div><span>Tag (Rotation)</span><b>' + p.day + '</b></div>' +
      '<div><span>' + (p.id === 'Moon' ? 'Umlauf' : 'Jahr') + '</span><b>' + p.year + '</b></div>' +
      '<div><span>Monde</span><b>' + p.moons + '</b></div>' +
      '<div><span>Temperatur</span><b>' + p.temp + '</b></div></div>' +
      '<h4>🤯 Wusstest du?</h4><ul class="pf-facts">' + p.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
      '<h4>🔭 Heute sichtbar?</h4>' + visBlock(p);
    $('planetTabs').querySelectorAll('button').forEach(function (b) { var on = b.getAttribute('data-p') === cur; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
  }
  $('planetTabs').innerHTML = P.map(function (p) { return '<button class="chip planet-tab" role="tab" data-p="' + p.id + '"><i class="tab-dot pl-' + p.id.toLowerCase() + '"></i>' + p.de + '</button>'; }).join('');
  $('planetTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (!b) return; cur = b.getAttribute('data-p'); renderFacts(); if (compare) setCompare(false); else showSingle(); });

  /* ---------- 3D ---------- */
  function tex(name) {
    if (texCache[name]) return texCache[name];
    texCache[name] = AE.loadTexture(name).then(function (src) {
      return new Promise(function (res) { var t = new THREE.TextureLoader().load(src, function () { res(t); }); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; });
    });
    return texCache[name];
  }
  function glowSprite(color, size) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    var gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(0.45, color + '55'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(c);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    s.scale.set(size, size, 1); return s;
  }
  function buildPlanet(p, radius) {
    var root = new THREE.Group(), tilt = new THREE.Group();
    root.add(tilt);
    var mat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 1, metalness: 0 });
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), mat);
    tilt.add(mesh); tilt.rotation.z = -p.tilt * Math.PI / 180;
    var glow = glowSprite(p.glow, radius * (p.ring ? 3.2 : 2.7)); glow.renderOrder = -1; root.add(glow);
    tex(p.tex).then(function (t) { mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; });
    if (p.ring) {
      var inner = radius * 1.24, outer = radius * 2.27, rg = new THREE.RingGeometry(inner, outer, 160, 1);
      var pos = rg.attributes.position, uv = rg.attributes.uv, v = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5); }
      var rmat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.95, roughness: 1, depthWrite: false });
      var ring = new THREE.Mesh(rg, rmat); ring.rotation.x = -Math.PI / 2; tilt.add(ring);
      tex('saturn_ring').then(function (t) { rmat.map = t; rmat.needsUpdate = true; });
    }
    var spin = (p.dayH < 0 ? -1 : 1) * Math.max(0.05, Math.min(0.6, 6 / Math.abs(p.dayH)));
    return { root: root, mesh: mesh, spin: spin, p: p, radius: radius };
  }
  var drag = { yaw: 0.4, pitch: 0.18, vy: 0, vx: 0, down: false, lx: 0, ly: 0 }, dist = 3.4, pinch = null, pts = {};
  function init() {
    if (ready) return Promise.resolve();
    return AE.loadScript('js/vendor/three.min.js').then(function () {
      THREE = window.THREE;
      try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power' }); }
      catch (e) { loading.textContent = '😢 Dein Browser unterstützt kein WebGL – die Steckbriefe funktionieren trotzdem.'; throw e; }
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
      var sun = new THREE.DirectionalLight(0xfff4e6, 2.4); sun.position.set(-4, 1.6, 3); scene.add(sun);
      scene.add(new THREE.AmbientLight(0x6070a0, 0.32));
      // Hintergrundsterne
      var g = new THREE.BufferGeometry(), arr = [];
      for (var i = 0; i < 700; i++) { var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 60, s = Math.sqrt(1 - u * u); arr.push(r * s * Math.cos(th), r * s * Math.sin(th), r * u); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.8 })));
      ready = true; resize();
      bindPointer();
    });
  }
  function resize() {
    if (!renderer) return;
    var r = cv.parentNode.getBoundingClientRect(), w = Math.max(200, r.width), h = Math.max(200, r.height);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (compare) fitCompare();
  }
  function clearScene() {
    Object.keys(single).forEach(function (k) { scene.remove(single[k].root); });
    if (compareGroup) scene.remove(compareGroup);
    $('sizeLabels').innerHTML = '';
  }
  function showSingle() {
    if (!ready) return;
    clearScene();
    var p = BY[cur];
    if (!single[cur]) single[cur] = buildPlanet(p, 1);
    scene.add(single[cur].root);
    dist = 3.4 * (p.ring ? 2.1 : 1); drag.yaw = 0.4; drag.pitch = p.ring ? 0.42 : 0.15;
    loading.hidden = true;
    kick();
  }
  var cmpItems = [];
  function buildCompare() {
    compareGroup = new THREE.Group(); cmpItems = [];
    var planets = P.filter(function (p) { return p.id !== 'Moon'; }), x = 0, scale = 1 / 69911 * 1.0;
    planets.forEach(function (p, i) {
      var R = p.r * scale, half = p.ring ? R * 2.27 : R, item = buildPlanet(p, R);
      x += (i ? 0.12 : 0) + half; item.root.position.x = x; x += half;
      compareGroup.add(item.root); cmpItems.push(item);
    });
    compareGroup.position.x = -x / 2; compareGroup.userData.width = x;
  }
  function fitCompare() {
    var w = compareGroup.userData.width, hf = Math.atan(Math.tan(camera.fov / 2 * Math.PI / 180) * camera.aspect);
    dist = (w / 2) / Math.tan(hf) * 1.08;
  }
  function setCompare(on) {
    compare = on;
    var b = $('sizeToggle'); b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
    b.textContent = on ? '🪐 Einzelansicht' : '⚖️ Größenvergleich';
    if (!ready) return;
    if (!on) { showSingle(); return; }
    clearScene();
    if (!compareGroup) buildCompare();
    scene.add(compareGroup); drag.yaw = 0; drag.pitch = 0.12; fitCompare();
    $('sizeLabels').innerHTML = cmpItems.map(function (it) { return '<span data-l="' + it.p.id + '"><b>' + it.p.de + '</b><small>' + Math.round(it.p.r * 2).toLocaleString('de-DE') + ' km</small></span>'; }).join('');
    kick();
  }
  $('sizeToggle').addEventListener('click', function () { if (!ready) return; setCompare(!compare); });

  function bindPointer() {
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; drag.down = true; drag.lx = e.clientX; drag.ly = e.clientY; drag.vx = drag.vy = 0;
      var k = Object.keys(pts); if (k.length === 2) pinch = { d: Math.hypot(pts[k[0]][0] - pts[k[1]][0], pts[k[0]][1] - pts[k[1]][1]), dist: dist }; });
    cv.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY];
      var k = Object.keys(pts);
      if (k.length === 2 && pinch) { var d = Math.hypot(pts[k[0]][0] - pts[k[1]][0], pts[k[0]][1] - pts[k[1]][1]); setDist(pinch.dist * pinch.d / d); return; }
      var dx = e.clientX - drag.lx, dy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY;
      drag.vy = dx * 0.008; drag.vx = dy * 0.008; drag.yaw += drag.vy; drag.pitch = Math.max(-1.2, Math.min(1.2, drag.pitch + drag.vx)); kick();
    });
    function up(e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; if (!Object.keys(pts).length) drag.down = false; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); setDist(dist * Math.exp(e.deltaY * 0.0012)); }, { passive: false });
  }
  function setDist(d) { var base = compare ? 1 : (BY[cur].ring ? 2.1 : 1); dist = Math.max((compare ? 0.15 : 1.6 * base), Math.min(compare ? 40 : 9 * base, d)); kick(); }

  var last = 0;
  function frame(t) {
    raf = null;
    if (!ready || !visible || document.hidden) return;
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    if (!drag.down) { drag.yaw += drag.vy; drag.pitch = Math.max(-1.2, Math.min(1.2, drag.pitch + drag.vx)); drag.vy *= 0.93; drag.vx *= 0.93; }
    var items = compare ? cmpItems : (single[cur] ? [single[cur]] : []);
    items.forEach(function (it) { it.mesh.rotation.y += it.spin * dt * (AE.reduceMotion ? 0 : 1); });
    var grp = compare ? compareGroup : single[cur] && single[cur].root;
    if (grp) { grp.rotation.y = compare ? 0 : drag.yaw; grp.rotation.x = drag.pitch; }
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    if (compare) {
      var rect = cv.getBoundingClientRect(), v = new THREE.Vector3();
      cmpItems.forEach(function (it) {
        it.root.getWorldPosition(v); v.y -= it.radius * (it.p.ring ? 1.1 : 1) + 0.04; v.project(camera);
        var el = document.querySelector('#sizeLabels [data-l="' + it.p.id + '"]');
        var idx = cmpItems.indexOf(it), stag = idx < 4 ? idx * 30 : 0;
        if (el) { el.style.transform = 'translate(' + ((v.x + 1) / 2 * rect.width) + 'px,' + ((1 - v.y) / 2 * rect.height + stag) + 'px) translate(-50%,0)'; el.classList.toggle('lead', idx < 4); el.style.setProperty('--st', stag + 'px'); }
      });
    }
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (ready && !raf && visible) raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', kick);
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });

  renderFacts();
  var sec = $('planeten'), started = false;
  function start() {
    if (started) return; started = true;
    init().then(function () { if (compare) setCompare(true); else showSingle(); }).catch(function (e) { console.warn('3D nicht verfügbar:', e && e.message); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { start(); kick(); } }, { rootMargin: '300px' }).observe(sec);
  } else { visible = true; start(); }
  AE.on('location', renderFacts);
  AE._planets = { select: function (id) { cur = id; renderFacts(); if (compare) setCompare(false); else showSingle(); }, compare: function (on) { setCompare(on); }, ready: function () { return ready; } };
})();
