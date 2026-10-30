/* Himmelsobjekte erklärt: Objektarten mit Illustration, ehrlicher Okular-Ansicht und „Auf der Karte zeigen“ */
(function () {
  'use strict';
  var grid = document.getElementById('objGrid');
  if (!grid) return;

  var O = [
    { id: 'stern', e: '⭐', n: 'Sterne', what: 'Riesige, heiße Gaskugeln wie unsere Sonne – nur unvorstellbar weit weg. Ihre Farbe verrät die Temperatur: bläulich ist heiß, rötlich kühler.',
      eye: 'Auch im größten Teleskop bleiben Sterne Lichtpunkte – sie sind viel zu weit weg. Aber die Farben werden deutlicher: Beteigeuze leuchtet orange, Wega bläulich-weiß.',
      ex: [{ n: 'Beteigeuze', m: 'Roter Überriese im Orion', ra: 88.79, dec: 7.41, s: 'Winter' }, { n: 'Wega', m: 'Hauptstern der Leier', ra: 279.23, dec: 38.78, s: 'Sommer' }] },
    { id: 'doppel', e: '✨', n: 'Doppelsterne', what: 'Zwei (oder mehr) Sterne, die eng beieinander stehen – oft umkreisen sie sich sogar gegenseitig. Etwa die Hälfte aller sonnenähnlichen Sterne hat einen Partner.',
      eye: 'Ein Paradeobjekt für kleine Teleskope und Stadthimmel: Wo das Auge einen Stern sieht, zeigt das Teleskop zwei scharfe Punkte – manchmal in schönen Kontrastfarben.',
      ex: [{ n: 'Albireo', m: 'Gold-blaues Paar im Schwan', ra: 292.68, dec: 27.96, s: 'Sommer' }, { n: 'Mizar & Alkor', m: 'Im Griff des Großen Wagens – Augentest!', ra: 200.98, dec: 54.93, s: 'Frühling' }] },
    { id: 'offen', e: '💎', n: 'Offene Sternhaufen', what: 'Junge Sterngruppen aus einigen Dutzend bis tausend Sternen, die gemeinsam aus einer Gaswolke entstanden sind. Mit der Zeit driften sie auseinander.',
      eye: 'Wunderschön schon im Fernglas: ein Schwarm funkelnder Punkte. Wenig Vergrößerung ist hier besser – sonst passt der Haufen nicht ins Bild.',
      ex: [{ n: 'Plejaden (M45)', m: 'Das „Siebengestirn“ im Stier', ra: 56.75, dec: 24.12, s: 'Herbst & Winter' }, { n: 'Krippe (M44)', m: 'Bienenkorb im Krebs', ra: 130.1, dec: 19.67, s: 'Frühling' }] },
    { id: 'kugel', e: '🔮', n: 'Kugelsternhaufen', what: 'Uralte Kugeln aus Hunderttausenden Sternen, die unsere Milchstraße umkreisen. Ihre Sterne sind oft über 10 Milliarden Jahre alt.',
      eye: 'Im Fernglas ein kleiner, runder Nebelfleck. Ab etwa 150–200 mm Öffnung lösen sich am Rand einzelne Sterne auf – das sieht dann aus wie Puderzucker.',
      ex: [{ n: 'Herkules-Haufen (M13)', m: 'Der hellste am Nordhimmel', ra: 250.42, dec: 36.46, s: 'Sommer' }, { n: 'M3', m: 'In den Jagdhunden', ra: 205.55, dec: 28.38, s: 'Frühling' }] },
    { id: 'nebel', e: '🌫️', n: 'Nebel', what: 'Leuchtende Gaswolken. Emissionsnebel sind Kinderstuben neuer Sterne; planetarische Nebel sind die abgestoßenen Hüllen sterbender, sonnenähnlicher Sterne.',
      eye: 'Ehrlich: meist grau, nicht bunt! Unser Auge sieht nachts kaum Farben. Der Orionnebel ist ein heller, grünlich-grauer Fächer; der Ringnebel ein kleiner, grauer „Rauchring“.',
      ex: [{ n: 'Orionnebel (M42)', m: 'Emissionsnebel im Schwert des Orion', ra: 83.82, dec: -5.39, s: 'Winter' }, { n: 'Ringnebel (M57)', m: 'Planetarischer Nebel in der Leier', ra: 283.40, dec: 33.03, s: 'Sommer' }] },
    { id: 'galaxie', e: '🌌', n: 'Galaxien', what: 'Ganze Sterneninseln mit Milliarden Sonnen – wie unsere Milchstraße. Ihr Licht ist oft Millionen Jahre zu uns unterwegs.',
      eye: 'Im Fernglas und kleinen Teleskop: ein schwacher, länglicher, grauer Schimmer mit hellerem Kern. Spiralarme zeigen erst Fotos – oder sehr große Teleskope unter dunklem Himmel.',
      ex: [{ n: 'Andromedagalaxie (M31)', m: '2,5 Mio. Lichtjahre – mit bloßem Auge sichtbar!', ra: 10.68, dec: 41.27, s: 'Herbst' }, { n: 'Bodes Galaxie (M81)', m: 'Im Großen Bären', ra: 148.89, dec: 69.07, s: 'Frühling' }] },
    { id: 'komet', e: '☄️', n: 'Kometen & Meteore', what: 'Kometen sind schmutzige Schneebälle, die beim Flug zur Sonne einen Schweif bilden. Meteore („Sternschnuppen“) sind winzige Staubkörner, die in der Atmosphäre verglühen.',
      eye: 'Helle Kometen sind selten – meist ein grauer Fleck mit kurzem Schweif. Sternschnuppen schaust du am besten ganz ohne Teleskop: hinlegen, großen Himmelsausschnitt beobachten.',
      ex: [{ n: 'Perseiden', m: 'Meteorstrom, Maximum um den 12./13. August', ra: 48, dec: 58, s: 'Sommer' }, { n: 'Geminiden', m: 'Meteorstrom, Maximum um den 13./14. Dezember', ra: 112, dec: 33, s: 'Winter' }], extra: 'Der berühmte Komet Halley (1P) kehrt erst 2061 zurück.' }
  ];

  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function art(id) {
    var g = rnd(id.length * 97 + 13), s = '', i;
    var bg = ''; for (i = 0; i < 26; i++) bg += '<circle cx="' + (g() * 200).toFixed(1) + '" cy="' + (g() * 130).toFixed(1) + '" r="' + (0.3 + g() * 0.8).toFixed(2) + '" class="ob-bg"/>';
    switch (id) {
      case 'stern': s = '<circle cx="70" cy="66" r="22" class="ob-red ob-pulse"/><circle cx="70" cy="66" r="34" class="ob-glow-r"/><circle cx="148" cy="58" r="10" class="ob-blue ob-pulse d2"/><circle cx="148" cy="58" r="20" class="ob-glow-b"/>'; break;
      case 'doppel': s = '<g class="ob-orbit"><circle cx="78" cy="65" r="9" class="ob-gold"/><circle cx="122" cy="65" r="6" class="ob-blue"/></g><ellipse cx="100" cy="65" rx="24" ry="8" class="ob-path"/>'; break;
      case 'offen': for (i = 0; i < 16; i++) s += '<circle cx="' + (60 + g() * 80).toFixed(1) + '" cy="' + (30 + g() * 70).toFixed(1) + '" r="' + (1 + g() * 3).toFixed(1) + '" class="ob-blue ob-tw" style="--d:' + (g() * 3).toFixed(2) + 's"/>'; s += '<ellipse cx="100" cy="66" rx="48" ry="36" class="ob-haze"/>'; break;
      case 'kugel': s = '<circle cx="100" cy="65" r="44" class="ob-glob"/>'; for (i = 0; i < 120; i++) { var a = g() * 6.283, r = Math.pow(g(), 1.8) * 42; s += '<circle cx="' + (100 + Math.cos(a) * r).toFixed(1) + '" cy="' + (65 + Math.sin(a) * r).toFixed(1) + '" r="' + (0.5 + g() * 0.9).toFixed(2) + '" class="ob-gold"/>'; } break;
      case 'nebel': s = '<g class="ob-drift"><ellipse cx="80" cy="70" rx="56" ry="34" class="ob-neb1"/><ellipse cx="112" cy="58" rx="38" ry="26" class="ob-neb2"/></g><circle cx="155" cy="78" r="13" class="ob-ring"/><circle cx="155" cy="78" r="2" class="ob-blue"/><circle cx="84" cy="66" r="2.5" class="ob-white"/>'; break;
      case 'galaxie': s = '<g class="ob-spin"><ellipse cx="100" cy="65" rx="70" ry="22" class="ob-gal"/><path d="M100 65 C130 40 165 52 160 66 M100 65 C70 90 35 78 40 64" class="ob-arm"/></g><ellipse cx="100" cy="65" rx="13" ry="7" class="ob-core"/>'; break;
      case 'komet': s = '<path d="M150 30 Q100 50 20 60 Q100 64 150 36 Z" class="ob-tail"/><circle cx="152" cy="32" r="6" class="ob-white"/><line x1="40" y1="20" x2="10" y2="38" class="ob-met"/><line x1="180" y1="86" x2="150" y2="104" class="ob-met d2"/>'; break;
    }
    return '<svg viewBox="0 0 200 130" class="obj-art" aria-hidden="true">' + bg + s + '</svg>';
  }

  var night = null;
  function bestTonight(ra, dec) {
    try {
      night = night || AE.nightInfo(new Date());
      var v = AE.toVec(ra, dec), a = night.darkFrom.getTime(), b = night.darkTo.getTime(), best = { alt: -99 };
      for (var i = 0; i <= 48; i++) { var t = new Date(a + (b - a) * i / 48), h = AE.vecToHor(AE.horMatrix(t), v); if (h.alt > best.alt) best = { alt: h.alt, az: h.az, time: t }; }
      return best;
    } catch (e) { return { alt: -99 }; }
  }
  function exBtn(x) {
    var b = bestTonight(x.ra, x.dec);
    if (b.alt > 15) {
      return '<button class="chip obj-show" type="button" data-show="' + b.alt.toFixed(1) + ',' + b.az.toFixed(1) + ',' + b.time.getTime() + '" data-mark="' + x.ra + ',' + x.dec + ',' + AE.esc(x.n) + '">🗺️ Auf der Karte zeigen · ' + AE.fmtTime(b.time) + ' Uhr</button>';
    }
    return '<span class="pill no">Heute Nacht zu tief – beste Zeit: ' + x.s + '</span>';
  }
  function render() {
    night = null;
    grid.innerHTML = O.map(function (o) {
      return '<article class="card glass obj-card reveal" id="obj-' + o.id + '"><div class="obj-pic">' + art(o.id) + '<span class="obj-tag">' + o.e + '</span></div>' +
        '<h4>' + o.n + '</h4><p class="small">' + o.what + '</p>' +
        '<p class="small obj-honest"><b>👁️ So siehst du es wirklich:</b> ' + o.eye + '</p>' +
        '<ul class="obj-ex">' + o.ex.map(function (x) { return '<li><div><b>' + x.n + '</b><small>' + x.m + ' · beste Zeit: ' + x.s + '</small></div>' + exBtn(x) + '</li>'; }).join('') + '</ul>' +
        (o.extra ? '<p class="muted small">' + o.extra + '</p>' : '') + '</article>';
    }).join('');
    if (AE.revealScan) AE.revealScan();
    if (AE.moreScan) AE.moreScan();
  }
  render();
  AE.on && AE.on('location', render);

  // Foto- vs. ehrliche Okular-Ansicht
  document.querySelectorAll('[data-objview]').forEach(function (b) {
    b.addEventListener('click', function () {
      var eye = b.getAttribute('data-objview') === 'okular';
      grid.classList.toggle('obj-eye', eye);
      document.querySelectorAll('[data-objview]').forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
    });
  });
})();
