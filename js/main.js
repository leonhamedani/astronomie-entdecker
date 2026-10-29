/* Astronomie Entdecker – Initialisierung, Navigation, Standortwahl, Effekte */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Modals ---------- */
  var lastFocus = null;
  AE.openModal = function (id) {
    var m = $(id); lastFocus = document.activeElement;
    m.hidden = false; requestAnimationFrame(function () { m.classList.add('open'); });
    document.body.classList.add('modal-open');
    var f = m.querySelector('.modal-close'); if (f) f.focus({ preventScroll: true });
  };
  AE.closeModals = function () {
    document.querySelectorAll('.modal.open').forEach(function (m) {
      m.classList.remove('open'); setTimeout(function () { m.hidden = true; }, 250);
    });
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) AE.closeModals(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') AE.closeModals(); });

  /* ---------- Toast ---------- */
  var toastT;
  AE.toast = function (msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 3200);
  };

  /* ---------- Konfetti aus Sternen ---------- */
  AE.confetti = function (host) {
    if (AE.reduceMotion || !host) return;
    var r = host.getBoundingClientRect();
    for (var i = 0; i < 28; i++) {
      var s = document.createElement('span'); s.className = 'confetti'; s.textContent = ['✦', '★', '✧', '⋆'][i % 4];
      s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height / 2) + 'px';
      s.style.setProperty('--dx', (Math.random() * 2 - 1) * 220 + 'px'); s.style.setProperty('--dy', (Math.random() * -1 - 0.2) * 220 + 'px');
      s.style.color = ['#ffd76a', '#8affd6', '#9db4ff', '#ff9ad5'][i % 4];
      document.body.appendChild(s); setTimeout(s.remove.bind(s), 1400);
    }
  };

  /* ---------- Navigation ---------- */
  var nav = $('nav');
  window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 30); }, { passive: true });
  $('navToggle').addEventListener('click', function () {
    var open = nav.classList.toggle('menu-open'); this.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('menu-open'); }); });

  /* ---------- Scroll-Reveal ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  AE.revealScan = function () {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el, i) {
      if (!io) { el.classList.add('in'); return; }
      if (!el.dataset.rv) { el.dataset.rv = 1; el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms'; io.observe(el); }
    });
  };

  /* ---------- Glas-Karten: Licht folgt der Maus ---------- */
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.card, .glass');
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- Standort ---------- */
  var sel = $('citySelect');
  sel.innerHTML = '<option value="">– Stadt wählen –</option>' + AE_CITIES.map(function (c, i) { return '<option value="' + i + '">' + c.n + '</option>'; }).join('');
  function updateChip() {
    $('locChipText').textContent = AE.loc.name || (AE.fmtNum(AE.loc.lat, 1) + '°, ' + AE.fmtNum(AE.loc.lon, 1) + '°');
    $('latInput').value = (+AE.loc.lat).toFixed(3); $('lonInput').value = (+AE.loc.lon).toFixed(3);
  }
  $('locChip').addEventListener('click', function () { AE.openModal('locModal'); });
  sel.addEventListener('change', function () {
    var c = AE_CITIES[+sel.value]; if (!c || sel.value === '') return;
    AE.setLocation({ name: c.n, lat: c.lat, lon: c.lon, tz: c.tz, source: 'city' });
    AE.closeModals(); AE.toast('📍 Standort: ' + c.n);
  });
  $('btnManual').addEventListener('click', function () {
    var lat = parseFloat(String($('latInput').value).replace(',', '.')), lon = parseFloat(String($('lonInput').value).replace(',', '.'));
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { AE.toast('Bitte gültige Koordinaten eingeben (Breite −90…90, Länge −180…180).'); return; }
    AE.setLocation({ name: nearestName(lat, lon), lat: lat, lon: lon, tz: AE.browserTz, source: 'manual' });
    AE.closeModals(); AE.toast('📍 Koordinaten übernommen');
  });
  function nearestName(lat, lon) {
    var best = null, bd = 1e9;
    AE_CITIES.forEach(function (c) {
      var d = Math.hypot(c.lat - lat, (c.lon - lon) * Math.cos(lat * Math.PI / 180)) * 111;
      if (d < bd) { bd = d; best = c; }
    });
    return best && bd < 40 ? 'bei ' + best.n : 'Eigener Standort';
  }
  $('btnGeo').addEventListener('click', function () {
    var st = $('geoStatus');
    if (!navigator.geolocation) { st.textContent = 'Dein Browser unterstützt keine Standortabfrage – bitte Stadt oder Koordinaten wählen.'; return; }
    st.textContent = '🛰️ Suche Standort …';
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lon = pos.coords.longitude;
      AE.setLocation({ name: nearestName(lat, lon), lat: lat, lon: lon, tz: AE.browserTz, source: 'geo' });
      st.textContent = '✅ Gefunden: ' + AE.fmtNum(lat, 3) + '°, ' + AE.fmtNum(lon, 3) + '°';
      setTimeout(AE.closeModals, 600); AE.toast('📍 Standort ermittelt');
    }, function (err) {
      st.textContent = err.code === 1 ? '🚫 Zugriff verweigert. Wähle einfach eine Stadt oder gib Koordinaten ein.' : '⚠️ Standort nicht verfügbar (' + err.message + '). Bitte manuell wählen.';
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  });
  AE.on('location', updateChip);

  /* ---------- Start ---------- */
  function init() {
    updateChip();
    $('statStars').textContent = AE.stars.length.toLocaleString('de-DE');
    AE.initSky();
    AE.renderTonight();
    AE.revealScan();
    document.querySelectorAll('.hero .reveal').forEach(function (el) { el.classList.add('in'); });
    if (AE.loc.source === 'default') setTimeout(function () { AE.toast('📍 Standard-Standort Berlin – tippe oben auf 📍, um deinen Ort zu wählen.'); }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
