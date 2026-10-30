/* Startseite: „Heute Nacht auf einen Blick“ – leichtgewichtig (nur Astronomy Engine, keine Sterndaten, kein three.js) */
(function () {
  'use strict';
  var A = window.Astronomy, $ = function (id) { return document.getElementById(id); };
  if (!$('glance')) return;

  function brightness(m) { return m <= -3 ? 'strahlend hell' : m <= -1.5 ? 'sehr hell' : m <= 0.5 ? 'hell' : m <= 3 ? 'gut sichtbar' : 'nur mit Fernglas'; }
  function tile(ic, label, value, sub) {
    return '<div class="gl-tile"><span class="gl-ic" aria-hidden="true">' + ic + '</span><div><span class="gl-l">' + label + '</span><b>' + value + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
  }

  AE.renderGlance = function () {
    var n = AE.nightInfo(new Date());
    var ref = new Date((n.darkFrom.getTime() + n.darkTo.getTime()) / 2);
    var ph = AE.moonPhase(ref), lit = Math.round(ph.illum * 100);
    var moonBest = AE.bestDuringNight('Moon', n);
    // Planeten: höchster Stand während der Dunkelheit, nach Helligkeit sortiert
    var pl = AE.PLANETS.map(function (p) {
      var b = AE.bestDuringNight(p.id, n);
      return { p: p, b: b, mag: b.time ? A.Illumination(p.id, b.time).mag : 99 };
    }).filter(function (x) { return x.b.alt > 5; }).sort(function (a, b) { return a.mag - b.mag; });
    var eye = pl.filter(function (x) { return x.mag < 5.5; });

    $('glanceSub').textContent = 'Für ' + (AE.loc.name || 'deinen Standort') + ' · ' + AE.fmtDate(n.sunset || n.noon, true) + ' · Ortszeit (' + AE.tzLabel() + ')';
    var dark = n.astroStart && n.astroEnd ? AE.fmtTime(n.astroStart) + ' – ' + AE.fmtTime(n.astroEnd) + ' Uhr' : 'keine echte Dunkelheit';
    $('glanceTiles').innerHTML =
      tile('🌇', 'Sonnenuntergang', n.sunset ? AE.fmtTime(n.sunset) + ' Uhr' : '–', n.sunrise ? 'Aufgang ' + AE.fmtTime(n.sunrise) + ' Uhr' : '') +
      tile('🌌', 'Astronomische Dunkelheit', dark, 'Beobachten ab ' + AE.fmtTime(n.darkFrom) + ' Uhr') +
      tile(ph.emoji, 'Mond: ' + ph.name, lit + ' % beleuchtet', moonBest.alt > 0 ? 'Am höchsten ' + AE.fmtTime(moonBest.time) + ' Uhr · ' + AE.dirName(moonBest.az) : 'nachts unter dem Horizont') +
      tile('🪐', 'Planeten sichtbar', eye.length + ' von 7', eye.length ? 'mit bloßem Auge: ' + eye.slice(0, 3).map(function (x) { return x.p.de; }).join(', ') : 'heute leider keiner');

    $('glanceList').innerHTML = pl.length ? pl.slice(0, 4).map(function (x) {
      return '<li><i class="pl-dot sm pl-' + x.p.id.toLowerCase() + '" aria-hidden="true"></i><b>' + x.p.de + '</b><span>' + AE.fmtNum(x.mag, 1) + ' mag · ' + brightness(x.mag) + '</span>' +
        '<span class="gl-pos">' + AE.dirName(x.b.az) + ', ' + Math.round(x.b.alt) + '° hoch · ' + AE.fmtTime(x.b.time) + ' Uhr</span></li>';
    }).join('') : '<li class="muted">Heute Nacht steht kein Planet hoch genug über dem Horizont.</li>';

    if ($('statMoon')) { $('statMoon').textContent = ph.emoji; $('statMoonTxt').textContent = ph.name + ' · ' + lit + ' %'; }
    if (AE.revealScan) AE.revealScan();
  };
  AE.on('location', function () { AE.renderGlance(); });
})();
