/* Rotlicht-Nachtmodus: ganze Seite nur in Rot/Schwarz – schont die Dunkeladaption.
   Technik: eine feste Ebene mit mix-blend-mode:multiply in reinem Rot (#ff0000 × Helligkeit) über allem.
   Das färbt Text, Karten, Canvas, Sternkarte, WebGL und Bilder gleichermaßen ein und kostet kaum Leistung
   (kein filter auf html/body). Der Zustand wird schon im <head> gesetzt (kein Aufblitzen). */
(function () {
  'use strict';
  var KEY = 'ae-rotlicht-v1', KEY_B = 'ae-rotlicht-hell-v1', KEY_HINT = 'ae-rotlicht-hinweis-v1';
  var root = document.documentElement, AE = window.AE = window.AE || {};
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function meta() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m && !m.hasAttribute('data-off')) m.setAttribute('data-off', m.getAttribute('content') || '#05060f');
    return m;
  }
  function clampB(b) { b = parseFloat(b); return isFinite(b) ? Math.max(0.25, Math.min(1, b)) : 0.75; }
  function applyB(b) { root.style.setProperty('--rl-c', 'rgb(' + Math.round(255 * b) + ',0,0)'); var r = document.getElementById('rlRange'); if (r) r.value = Math.round(b * 100); }

  var dim; // Helligkeitsregler (nur sichtbar, wenn der Modus an ist)
  function buildDim() {
    if (dim) return dim;
    dim = document.createElement('div'); dim.className = 'rl-dim'; dim.hidden = true;
    dim.innerHTML = '<label for="rlRange" title="Helligkeit im Rotlicht-Modus"><span aria-hidden="true">🔅</span><span class="rl-sr">Helligkeit</span></label>' +
      '<input type="range" id="rlRange" min="25" max="100" step="5" aria-label="Helligkeit im Rotlicht-Modus">';
    document.body.appendChild(dim);
    dim.querySelector('input').addEventListener('input', function () { var b = clampB(this.value / 100); applyB(b); set(KEY_B, String(b)); });
    return dim;
  }
  function render(on) {
    root.classList.toggle('rotlicht', on);
    var m = meta(); if (m) m.setAttribute('content', on ? '#120000' : m.getAttribute('data-off'));
    document.querySelectorAll('.rl-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.title = on ? 'Rotlicht-Nachtmodus ausschalten (Taste R)' : 'Rotlicht-Nachtmodus einschalten (Taste R)';
    });
    document.querySelectorAll('[data-red-toggle], #redBtn').forEach(function (b) {
      b.textContent = on ? '⚪ Rotlicht-Modus beenden' : '🔴 Rotlicht-Modus einschalten';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (document.body) { buildDim().hidden = !on; }
    applyB(clampB(get(KEY_B)));
  }
  AE.rotlicht = {
    isOn: function () { return root.classList.contains('rotlicht'); },
    set: function (on) {
      on = !!on; set(KEY, on ? '1' : '0'); render(on);
      if (on && get(KEY_HINT) !== '1') { set(KEY_HINT, '1'); if (AE.toast) AE.toast('🔴 Rotlicht an – schont deine Dunkeladaption beim Beobachten'); }
    },
    toggle: function () { AE.rotlicht.set(!AE.rotlicht.isOn()); }
  };
  render(get(KEY) === '1');

  document.addEventListener('click', function (e) {
    if (e.target.closest('.rl-btn, [data-red-toggle], #redBtn')) { e.preventDefault(); AE.rotlicht.toggle(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'r' && e.key !== 'R') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
    AE.rotlicht.toggle();
  });
  // In anderem Tab/Fenster umgeschaltet → hier übernehmen
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) render(e.newValue === '1');
    else if (e.key === KEY_B) applyB(clampB(e.newValue));
  });
})();
