/* Bedienkomfort: Aufklapp-Bereiche, „Mehr anzeigen“, Scroll-Spy, Nach-oben-Knopf, Menü */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var mqMobile = window.matchMedia('(max-width: 760px)');
  var KEY = 'ae-folds-v1', store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  /* ---------- Aufklapp-Bereiche ---------- */
  var folds = {};
  function nudgeLayout() {
    // Canvas-Inhalte (Hand-Trick, Spiel, Karten) passen sich nach dem Aufklappen an
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }
  function setFold(f, open, opts) {
    opts = opts || {};
    var btn = f.querySelector('.fold-btn'), body = f.querySelector('.fold-body');
    f.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { body.removeAttribute('inert'); } else { body.setAttribute('inert', ''); f.classList.remove('settled'); }
    if (opts.instant || AE.reduceMotion) { if (open) f.classList.add('settled'); if (open) setTimeout(nudgeLayout, 30); }
    if (opts.remember) { store[f.dataset.fold] = open ? 1 : 0; save(); }
    if (AE.emit) AE.emit('fold', { key: f.dataset.fold, open: open });
    updateAllBtns();
  }
  document.querySelectorAll('.fold[data-fold]').forEach(function (f) {
    var k = f.dataset.fold; folds[k] = f;
    var def = mqMobile.matches && f.dataset.openMobile != null ? f.dataset.openMobile : f.dataset.open;
    var open = k in store ? !!store[k] : def === '1';
    f.classList.add('no-anim'); setFold(f, open, { instant: true });
    requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.remove('no-anim'); }); });
    f.querySelector('.fold-btn').addEventListener('click', function () { setFold(f, !f.classList.contains('open'), { remember: true }); });
    f.querySelector('.fold-body').addEventListener('transitionend', function (e) {
      if (e.target !== this || e.propertyName !== 'grid-template-rows') return;
      if (f.classList.contains('open')) { f.classList.add('settled'); nudgeLayout(); }
    });
  });
  AE.openFold = function (k, remember) { var f = folds[k]; if (f && !f.classList.contains('open')) setFold(f, true, { remember: !!remember }); return f; };

  // Schnell-Links öffnen das Ziel
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-fold-link]');
    if (a) { e.preventDefault(); var f = AE.openFold(a.getAttribute('data-fold-link'), true); if (f) setTimeout(function () { f.scrollIntoView({ behavior: AE.reduceMotion ? 'auto' : 'smooth', block: 'start' }); }, 60); return; }
    var all = e.target.closest('[data-fold-all]');
    if (all) {
      var list = sectionFolds(all.getAttribute('data-fold-all')), anyClosed = list.some(function (f) { return !f.classList.contains('open'); });
      list.forEach(function (f) { setFold(f, anyClosed, { remember: true }); });
    }
  });
  function sectionFolds(id) { var sec = $(id); return sec ? Array.prototype.slice.call(sec.querySelectorAll('.fold[data-fold]')) : []; }
  function updateAllBtns() {
    document.querySelectorAll('[data-fold-all]').forEach(function (b) {
      var list = sectionFolds(b.getAttribute('data-fold-all')), anyClosed = list.some(function (f) { return !f.classList.contains('open'); });
      b.textContent = anyClosed ? '⊕ Alle aufklappen' : '⊖ Alle zuklappen';
      b.setAttribute('aria-pressed', anyClosed ? 'false' : 'true');
    });
  }
  updateAllBtns();
  // Sprungziele (#…) in geschlossenen Bereichen öffnen
  function openForHash() {
    var id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
    var el = $(id); if (!el) return;
    var f = el.closest('.fold'); if (f && f.dataset.fold) AE.openFold(f.dataset.fold);
  }
  window.addEventListener('hashchange', openForHash); openForHash();

  /* ---------- „Mehr anzeigen“ ---------- */
  function moreLimit(host) {
    var m = host.getAttribute('data-more-mobile'), d = host.getAttribute('data-more');
    if (mqMobile.matches && m != null) return +m;
    return d != null ? +d : Infinity;
  }
  function applyMore(host) {
    var list = host.getAttribute('data-more-of') ? host.querySelector(host.getAttribute('data-more-of')) : host;
    var btn = host._moreBtn;
    if (!btn) {
      btn = document.createElement('button'); btn.type = 'button'; btn.className = 'more-btn';
      btn.addEventListener('click', function () { host._moreOpen = !host._moreOpen; applyMore(host); if (!host._moreOpen) host.scrollIntoView({ block: 'nearest', behavior: AE.reduceMotion ? 'auto' : 'smooth' }); });
      host._moreBtn = btn;
    }
    if (btn.parentNode !== host.parentNode || btn.previousElementSibling !== host) host.insertAdjacentElement('afterend', btn);
    if (!list) { btn.hidden = true; return; }
    var kids = Array.prototype.filter.call(list.children, function (c) { return c.tagName !== 'P' || !c.classList.contains('muted'); });
    var lim = moreLimit(host), extra = kids.length - lim, label = host.getAttribute('data-more-label') || 'Einträge';
    kids.forEach(function (c, i) { c.classList.toggle('more-hidden', !host._moreOpen && i >= lim); });
    btn.hidden = !(extra > 0);
    btn.setAttribute('aria-expanded', host._moreOpen ? 'true' : 'false');
    btn.innerHTML = host._moreOpen ? 'Weniger anzeigen <span aria-hidden="true">▴</span>' : 'Alle ' + kids.length + ' ' + label + ' anzeigen <span aria-hidden="true">▾</span>';
  }
  var moreHosts = Array.prototype.slice.call(document.querySelectorAll('[data-more],[data-more-mobile]'));
  moreHosts.forEach(function (h) {
    applyMore(h);
    var busy = false;
    new MutationObserver(function () { if (busy) return; busy = true; requestAnimationFrame(function () { applyMore(h); busy = false; }); }).observe(h, { childList: true, subtree: !!h.getAttribute('data-more-of') });
  });
  var lastMob = mqMobile.matches;
  window.addEventListener('resize', function () { if (mqMobile.matches !== lastMob) { lastMob = mqMobile.matches; moreHosts.forEach(applyMore); } });

  /* ---------- Menü (Hamburger) ---------- */
  var nav = $('nav'), toggle = $('navToggle'), links = $('navLinks');
  function closeMenu(focusBtn) { if (!nav.classList.contains('menu-open')) return; nav.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Menü öffnen'); document.body.classList.remove('menu-lock'); if (focusBtn) toggle.focus(); }
  toggle.addEventListener('click', function () {
    var open = !nav.classList.contains('menu-open'); // main.js schaltet direkt danach um
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.body.classList.toggle('menu-lock', open);
    if (open) { var a = links.querySelector('a.active') || links.querySelector('a'); if (a) setTimeout(function () { a.focus({ preventScroll: true }); }, 50); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });
  document.addEventListener('click', function (e) { if (nav.classList.contains('menu-open') && !e.target.closest('#nav')) closeMenu(false); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });

  /* ---------- Scroll-Spy, Fortschritt, Nach oben ---------- */
  // Jede Unterseite hat eigene Abschnitte; die Hauptnavigation markiert die aktive Seite fest im HTML
  var secs = Array.prototype.slice.call(document.querySelectorAll('main > section.section[id]'));
  var spyLinks = document.querySelectorAll('[data-spy]'), toTop = $('toTop'), rail = $('secRail'), prog = $('navProgress'), current = null, ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, line = y + vh * 0.35, cur = null;
    secs.forEach(function (s) { if (s.offsetTop <= line) cur = s.id; });
    if (y < vh * 0.25) cur = null;
    if (cur !== current) {
      current = cur;
      spyLinks.forEach(function (a) { var on = a.getAttribute('data-spy') === cur; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      document.querySelectorAll('[data-spy-sub]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-spy-sub') === cur); });
    }
    var show = y > vh * 1.2;
    if (toTop.hidden === show) { toTop.hidden = !show; }
    if (rail) rail.classList.toggle('show', y > vh * 0.4);
    var max = document.documentElement.scrollHeight - vh; prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(onScroll); });
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: AE.reduceMotion ? 'auto' : 'smooth' }); var b = document.querySelector('.brand'); if (b) b.focus({ preventScroll: true }); });
  onScroll();

  /* ---------- Animationen außerhalb des Bildschirms anhalten (spart Rechenzeit, v. a. am PC) ---------- */
  if ('IntersectionObserver' in window) {
    var offIO = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('ae-off', !e.isIntersecting); }); }, { rootMargin: '150px 0px' });
    document.querySelectorAll('main > section, .page-hero, .hero, .footer').forEach(function (el) { offIO.observe(el); });
  }
  document.addEventListener('visibilitychange', function () { document.documentElement.classList.toggle('ae-hidden', document.hidden); });
  // Während des Scrollens schmückende Endlos-Animationen kurz anhalten (CSS + SMIL in SVGs) – das Scrollen bleibt flüssig,
  // ~0,2 s nach dem Scrollen laufen sie weiter
  var root = document.documentElement, scrollT = 0, smil = null;
  function smilSvgs() { if (!smil) smil = Array.prototype.filter.call(document.querySelectorAll('svg'), function (s) { return !s.closest('svg svg') && s.querySelector('animate,animateMotion,animateTransform'); }); return smil; }
  function scrollEnd() { scrollT = 0; root.classList.remove('ae-scrolling'); smilSvgs().forEach(function (s) { if (s.__aePaused) { s.__aePaused = false; try { s.unpauseAnimations(); } catch (e) {} } }); }
  window.addEventListener('scroll', function () {
    if (!scrollT) {
      root.classList.add('ae-scrolling'); smil = null;
      smilSvgs().forEach(function (s) { try { s.pauseAnimations(); s.__aePaused = true; } catch (e) {} });
    } else clearTimeout(scrollT);
    scrollT = setTimeout(scrollEnd, 200);
  }, { passive: true });

  /* ---------- Leichtere Effekte auf schwachen Geräten ---------- */
  var lite = mqMobile.matches || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || window.matchMedia('(pointer: coarse)').matches;
  if (lite) document.documentElement.classList.add('fx-lite');
  AE.fxLite = lite;
})();
