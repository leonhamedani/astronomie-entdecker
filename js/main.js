/* Astronomie Entdecker – Initialisierung (alle Unterseiten), Navigation, Standortwahl, Effekte */
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
  function coordText(l) {
    return AE.fmtNum(Math.abs(l.lat), 2) + '° ' + (l.lat >= 0 ? 'N' : 'S') + ', ' + AE.fmtNum(Math.abs(l.lon), 2) + '° ' + (l.lon >= 0 ? 'O' : 'W');
  }
  function updateChip() {
    var name = AE.loc.name || (AE.fmtNum(AE.loc.lat, 1) + '°, ' + AE.fmtNum(AE.loc.lon, 1) + '°');
    $('locChipText').textContent = name;
    $('latInput').value = (+AE.loc.lat).toFixed(3); $('lonInput').value = (+AE.loc.lon).toFixed(3);
    // Standort-Leisten auf den Unterseiten
    document.querySelectorAll('[data-loc-name]').forEach(function (el) { el.textContent = name; });
    document.querySelectorAll('[data-loc-coords]').forEach(function (el) { el.textContent = coordText(AE.loc); });
    document.querySelectorAll('[data-loc-hint]').forEach(function (el) { el.hidden = AE.loc.source !== 'default'; });
  }
  $('locChip').addEventListener('click', function () { AE.openModal('locModal'); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-loc-open]')) { e.preventDefault(); AE.openModal('locModal'); return; }
    var g = e.target.closest('[data-loc-geo]');
    if (g) { e.preventDefault(); useGeo(document.querySelector('[data-loc-status]'), false); }
  });
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
  function useGeo(st, inModal) {
    st = st || { textContent: '' };
    if (!navigator.geolocation) { st.textContent = 'Dein Browser unterstützt keine Standortabfrage – bitte Stadt oder Koordinaten wählen.'; return; }
    st.textContent = '🛰️ Suche Standort …';
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lon = pos.coords.longitude;
      AE.setLocation({ name: nearestName(lat, lon), lat: lat, lon: lon, tz: AE.browserTz, source: 'geo' });
      st.textContent = '✅ Gefunden: ' + AE.fmtNum(lat, 3) + '°, ' + AE.fmtNum(lon, 3) + '°';
      if (inModal) setTimeout(AE.closeModals, 600);
      AE.toast('📍 Standort ermittelt – gilt jetzt auf allen Seiten');
    }, function (err) {
      st.textContent = err.code === 1 ? '🚫 Zugriff verweigert. Wähle einfach eine Stadt oder gib Koordinaten ein.' : '⚠️ Standort nicht verfügbar (' + err.message + '). Bitte manuell wählen.';
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  }
  $('btnGeo').addEventListener('click', function () { useGeo($('geoStatus'), true); });
  AE.on('location', updateChip);

  /* ---------- „Auf der Karte zeigen“ (auch von anderen Unterseiten) ---------- */
  function showOnSky(alt, az, t) {
    AE.closeModals();
    AE._sky.setTime(new Date(t), false);
    AE.skyLookAt(alt, az);
    AE.toast('Karte springt auf ' + AE.fmtTime(new Date(t)) + ' Uhr – Blick nach ' + AE.dirName(az));
  }
  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-show]'); if (!s) return;
    var p = s.getAttribute('data-show').split(',').map(Number);
    if (AE._sky && AE.skyLookAt) { showOnSky(p[0], p[1], p[2]); return; }
    location.href = 'sternkarte.html?zeige=' + encodeURIComponent(p[0] + ',' + p[1] + ',' + p[2]);
  });
  function showFromUrl() {
    var m = /[?&]zeige=([^&#]+)/.exec(location.search); if (!m || !AE._sky) return;
    var p = decodeURIComponent(m[1]).split(',').map(Number);
    if (p.length < 3 || !p.every(isFinite)) return;
    setTimeout(function () { showOnSky(p[0], p[1], p[2]); }, 350);
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  }

  /* ---------- Start ---------- */
  function init() {
    updateChip();
    if ($('statStars') && AE.stars.length) $('statStars').textContent = AE.stars.length.toLocaleString('de-DE');
    if (AE.initSky) AE.initSky();
    if (AE.renderTonight) AE.renderTonight();
    if (AE.renderGlance) AE.renderGlance();
    AE.revealScan();
    document.querySelectorAll('.hero .reveal, .page-hero .reveal').forEach(function (el) { el.classList.add('in'); });
    showFromUrl();
    // Hinweis auf den Standard-Standort nur einmal pro Sitzung (nicht auf jeder Unterseite)
    var hinted = false; try { hinted = sessionStorage.getItem('ae-loc-hint') === '1'; sessionStorage.setItem('ae-loc-hint', '1'); } catch (e) {}
    if (AE.loc.source === 'default' && !hinted) setTimeout(function () { AE.toast('📍 Standard-Standort Berlin – tippe oben auf 📍, um deinen Ort zu wählen.'); }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
