/* Einsteiger-Bereich: Teleskop-Erklärer, Lichtweg-Vergleich, Bau-Spiel und Quiz */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var PARTS = {
    objektiv: { n: 'Objektiv / Hauptspiegel', e: '🔵', t: 'Das „Auge“ des Teleskops: Eine große Linse (beim Refraktor) oder ein Hohlspiegel (beim Spiegelteleskop) sammelt das Licht. Je größer der Durchmesser (die Öffnung), desto mehr Licht – und desto schwächere Objekte und feinere Details siehst du.', f: 'Ein 100-mm-Objektiv sammelt rund 200-mal mehr Licht als deine Pupille!' },
    tubus: { n: 'Tubus', e: '🧪', t: 'Das Rohr hält Objektiv und Okular im richtigen Abstand zueinander und schirmt Streulicht ab. Innen ist er mattschwarz, damit keine Reflexe das Bild aufhellen.', f: 'Die Länge des Tubus hängt von der Brennweite ab – lange Brennweite heißt höhere Vergrößerung.' },
    okular: { n: 'Okular', e: '👁️', t: 'Hier schaust du hinein. Das Okular ist eine kleine Lupe, die das Bild im Brennpunkt vergrößert. Okulare sind austauschbar: Kurze Brennweite = starke Vergrößerung.', f: 'Vergrößerung = Brennweite Teleskop ÷ Brennweite Okular. Beispiel: 900 mm ÷ 25 mm = 36-fach.' },
    sucher: { n: 'Sucher', e: '🎯', t: 'Ein kleines Zielfernrohr (oder Leuchtpunktsucher) mit großem Gesichtsfeld. Damit peilst du ein Objekt an, bevor du ins Okular schaust – wie Kimme und Korn.', f: 'Richte den Sucher tagsüber an einem fernen Kirchturm aus – nachts geht das viel schwerer!' },
    fokussierer: { n: 'Fokussierer', e: '⚙️', t: 'Mit den Drehrädern schiebst du das Okular vor und zurück, bis das Bild gestochen scharf ist. Sterne sollten winzige Punkte sein, keine Scheibchen.', f: 'Jeder Mensch fokussiert ein wenig anders – Brillenträger können oft ohne Brille beobachten.' },
    montierung: { n: 'Montierung', e: '🧭', t: 'Die Mechanik, die das Teleskop trägt und bewegt. Eine azimutale Montierung bewegt sich hoch/runter und links/rechts, eine parallaktische (äquatoriale) folgt mit einer Achse der Erddrehung.', f: 'Bei 100-facher Vergrößerung wandert ein Stern in unter einer Minute aus dem Bild – wegen der Erdrotation!' },
    stativ: { n: 'Stativ', e: '🦵', t: 'Die stabile Basis. Ein wackeliges Stativ macht jedes Teleskop unbrauchbar – schon ein Windstoß lässt das Bild tanzen. Die Ablage zwischen den Beinen stabilisiert zusätzlich.', f: 'Hänge bei Wind eine Tasche unter das Stativ – das dämpft Schwingungen.' }
  };
  var ORDER = ['objektiv', 'tubus', 'okular', 'sucher', 'fokussierer', 'montierung', 'stativ'];
  var svg = $('scopeSvg'), info = $('partInfo'), pills = $('partPills');
  var current = null;
  function select(k) {
    var p = PARTS[k]; if (!p) return;
    current = k;
    svg.querySelectorAll('.part').forEach(function (g) { g.classList.toggle('active', g.getAttribute('data-part') === k); });
    pills.querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-p') === k); });
    info.innerHTML = '<div class="part-emoji">' + p.e + '</div><h3>' + p.n + '</h3><p>' + p.t + '</p><p class="fun">💡 ' + p.f + '</p>';
    info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop');
  }
  pills.innerHTML = ORDER.map(function (k) { return '<button class="chip" data-p="' + k + '">' + PARTS[k].n.split(' /')[0] + '</button>'; }).join('');
  pills.addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) select(b.getAttribute('data-p')); });
  svg.querySelectorAll('.part').forEach(function (g) {
    var k = g.getAttribute('data-part');
    g.addEventListener('mouseenter', function () { select(k); });
    g.addEventListener('click', function () { select(k); });
    g.addEventListener('focus', function () { select(k); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(k); } });
    g.setAttribute('role', 'button'); g.setAttribute('aria-label', PARTS[k].n);
  });

  /* ---------- Refraktor vs. Reflektor ---------- */
  var CMP = {
    refraktor: '<h4>🔭 Refraktor – das Linsenteleskop</h4><p>Licht fällt durch eine <b>Objektivlinse</b>, wird gebrochen und im Brennpunkt am anderen Ende gebündelt. Dort sitzt das Okular.</p><ul class="pros"><li>✅ Gestochen scharfe, kontrastreiche Bilder – super für Mond und Planeten</li><li>✅ Geschlossener Tubus, kaum Wartung, sofort einsatzbereit</li><li>⚠️ Pro Zentimeter Öffnung teurer</li><li>⚠️ Einfache Linsen zeigen Farbsäume (chromatische Aberration)</li></ul>',
    reflektor: '<h4>🪞 Reflektor – das Newton-Spiegelteleskop</h4><p>Licht wandert durch den offenen Tubus nach hinten zum <b>Hohlspiegel</b>, wird zurückgeworfen und vom kleinen <b>Fangspiegel</b> seitlich ins Okular gelenkt. Erfunden 1668 von Isaac Newton.</p><ul class="pros"><li>✅ Viel Öffnung fürs Geld – ideal für Galaxien und Nebel</li><li>✅ Keine Farbfehler</li><li>⚠️ Spiegel müssen gelegentlich justiert werden (Kollimation)</li><li>⚠️ Braucht Zeit zum Auskühlen</li></ul>'
  };
  function setCmp(t) {
    document.querySelectorAll('.seg-btn').forEach(function (b) { var on = b.getAttribute('data-type') === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    $('lpRefr').classList.toggle('active', t === 'refraktor'); $('lpRefl').classList.toggle('active', t === 'reflektor');
    $('compareText').innerHTML = CMP[t];
  }
  document.querySelectorAll('.seg-btn').forEach(function (b) { b.addEventListener('click', function () { setCmp(b.getAttribute('data-type')); }); });
  setCmp('refraktor');

  /* ---------- Bau-Spiel (Drag & Drop) ---------- */
  var TARGETS = { objektiv: [468, 132], tubus: [380, 179], okular: [93, 330], sucher: [287, 164], fokussierer: [146, 302], montierung: [300, 282], stativ: [236, 410] };
  var dndSvg = document.querySelector('.dnd-svg');
  var clone = svg.cloneNode(true);
  dndSvg.innerHTML = '';
  Array.prototype.forEach.call(clone.querySelectorAll('.part, .scope-light'), function (g) { g.removeAttribute('tabindex'); g.removeAttribute('role'); g.setAttribute('class', 'ghost-part'); dndSvg.appendChild(g); });
  var tEl = $('dndTargets'), bank = $('dndBank'), scoreEl = $('dndScore');
  var nums = ORDER.slice().sort(function () { return Math.random() - 0.5; });
  var placed = {}, selected = null;
  function buildGame() {
    placed = {}; selected = null;
    nums = ORDER.slice().sort(function () { return Math.random() - 0.5; });
    tEl.innerHTML = ORDER.map(function (k) {
      var p = TARGETS[k];
      return '<div class="dnd-target" data-t="' + k + '" style="left:' + (p[0] / 6) + '%;top:' + (p[1] / 4.6) + '%">' + (ORDER.indexOf(k) + 1) + '</div>';
    }).join('');
    bank.innerHTML = nums.map(function (k) { return '<button class="dnd-chip" data-k="' + k + '">' + PARTS[k].n.split(' /')[0] + '</button>'; }).join('');
    updateScore();
  }
  function updateScore() {
    var n = Object.keys(placed).length;
    scoreEl.textContent = n + ' / 7 richtig';
    if (n === 7) { scoreEl.innerHTML = '🎉 Perfekt! Du hast das Teleskop komplett zusammengebaut!'; AE.confetti(document.getElementById('dndGame')); }
  }
  function tryPlace(k, targetEl) {
    if (!targetEl) return false;
    var t = targetEl.getAttribute('data-t');
    if (t === k && !placed[k]) {
      placed[k] = true;
      targetEl.classList.add('ok'); targetEl.textContent = '✓ ' + PARTS[k].n.split(' /')[0];
      var chip = bank.querySelector('[data-k="' + k + '"]'); if (chip) chip.remove();
      updateScore(); return true;
    }
    targetEl.classList.remove('bad'); void targetEl.offsetWidth; targetEl.classList.add('bad');
    return false;
  }
  var drag = null;
  bank.addEventListener('pointerdown', function (e) {
    var c = e.target.closest('.dnd-chip'); if (!c) return;
    e.preventDefault();
    var r = c.getBoundingClientRect();
    drag = { k: c.getAttribute('data-k'), el: c, ghost: c.cloneNode(true), ox: e.clientX - r.left, oy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
    drag.ghost.classList.add('dragging'); drag.ghost.style.width = r.width + 'px';
    drag.ghost.style.left = r.left + 'px'; drag.ghost.style.top = r.top + 'px';
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) { drag.moved = true; document.body.appendChild(drag.ghost); drag.el.classList.add('placeholder'); }
    if (drag.moved) {
      drag.ghost.style.left = (e.clientX - drag.ox) + 'px'; drag.ghost.style.top = (e.clientY - drag.oy) + 'px';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      tEl.querySelectorAll('.dnd-target').forEach(function (t) { t.classList.toggle('hover', !!under && t === under.closest('.dnd-target')); });
    }
  });
  window.addEventListener('pointerup', function (e) {
    if (!drag) return;
    var d = drag; drag = null;
    if (d.moved) {
      d.ghost.remove(); d.el.classList.remove('placeholder');
      var under = document.elementFromPoint(e.clientX, e.clientY);
      tryPlace(d.k, under && under.closest('.dnd-target'));
      tEl.querySelectorAll('.dnd-target').forEach(function (t) { t.classList.remove('hover'); });
    } else {
      selected = selected === d.k ? null : d.k;
      bank.querySelectorAll('.dnd-chip').forEach(function (c) { c.classList.toggle('sel', c.getAttribute('data-k') === selected); });
    }
  });
  tEl.addEventListener('click', function (e) {
    var t = e.target.closest('.dnd-target'); if (!t || !selected) return;
    if (tryPlace(selected, t)) selected = null;
  });
  $('dndReset').addEventListener('click', buildGame);
  buildGame();

  /* ---------- Quiz ---------- */
  var Q = [
    { q: 'Welches Bauteil sammelt beim Linsenteleskop das Licht?', a: ['Das Okular', 'Das Objektiv', 'Der Sucher'], c: 1, x: 'Das Objektiv ist die große Linse vorne – je größer, desto mehr Licht.' },
    { q: 'Ein Teleskop hat 1000 mm Brennweite, das Okular 20 mm. Wie stark ist die Vergrößerung?', a: ['20-fach', '50-fach', '200-fach'], c: 1, x: '1000 ÷ 20 = 50-fache Vergrößerung.' },
    { q: 'Wie hoch steht der Polarstern in Berlin (52,5° Nord) ungefähr?', a: ['Im Zenit (90°)', 'Etwa 52° hoch', 'Direkt am Horizont'], c: 1, x: 'Die Höhe des Polarsterns entspricht ungefähr deiner geografischen Breite.' },
    { q: 'Wer erfand das Spiegelteleskop mit Fangspiegel?', a: ['Galileo Galilei', 'Johannes Kepler', 'Isaac Newton'], c: 2, x: 'Isaac Newton baute 1668 das erste funktionierende Spiegelteleskop.' },
    { q: 'Wie lange brauchen deine Augen, um sich voll an die Dunkelheit zu gewöhnen?', a: ['Etwa 1 Minute', '20–30 Minuten', '3 Stunden'], c: 1, x: 'Nach 20–30 Minuten siehst du deutlich mehr Sterne. Rotes Licht stört dabei kaum.' },
    { q: 'Welcher Planet zeigt schon im Fernglas vier helle Monde?', a: ['Jupiter', 'Mars', 'Venus'], c: 0, x: 'Io, Europa, Ganymed und Kallisto – die Galileischen Monde.' },
    { q: 'Was bedeutet „zirkumpolar“?', a: ['Ein Stern geht nie unter', 'Ein Stern ist besonders hell', 'Ein Stern steht am Südpol'], c: 0, x: 'Zirkumpolare Sterne kreisen um den Himmelspol und bleiben die ganze Nacht über dem Horizont.' },
    { q: 'Wann sollte man ohne Spezialfilter durch ein Teleskop in die Sonne schauen?', a: ['Bei Sonnenuntergang', 'Bei leichter Bewölkung', 'Niemals!'], c: 2, x: 'Niemals! Gebündeltes Sonnenlicht zerstört die Netzhaut sofort.' }
  ];
  var qi = 0, score = 0, body = $('quizBody');
  function renderQ() {
    if (qi >= Q.length) {
      var msg = score === Q.length ? '🏆 Sternenmeister! Alles richtig!' : score >= Q.length - 2 ? '🌟 Super, du bist bereit für die erste Nacht!' : '🔭 Guter Start – probier es gleich nochmal!';
      body.innerHTML = '<div class="quiz-end"><div class="quiz-score">' + score + ' / ' + Q.length + '</div><p>' + msg + '</p><button class="btn btn-primary" id="quizAgain">Nochmal spielen</button></div>';
      $('quizAgain').addEventListener('click', function () { qi = 0; score = 0; renderQ(); });
      if (score >= Q.length - 1) AE.confetti(document.getElementById('quiz'));
      return;
    }
    var q = Q[qi];
    body.innerHTML = '<div class="quiz-prog"><span style="width:' + (qi / Q.length * 100) + '%"></span></div><p class="muted small">Frage ' + (qi + 1) + ' von ' + Q.length + ' · Punkte: ' + score + '</p><p class="quiz-q">' + q.q + '</p><div class="quiz-a">' +
      q.a.map(function (a, i) { return '<button class="quiz-opt" data-i="' + i + '">' + a + '</button>'; }).join('') + '</div><p class="quiz-x" hidden></p>';
    body.querySelectorAll('.quiz-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-i');
        body.querySelectorAll('.quiz-opt').forEach(function (o, j) { o.disabled = true; if (j === q.c) o.classList.add('right'); });
        if (i === q.c) score++; else b.classList.add('wrong');
        var x = body.querySelector('.quiz-x'); x.hidden = false; x.innerHTML = (i === q.c ? '✅ Richtig! ' : '❌ Leider falsch. ') + q.x + ' <button class="chip" id="quizNext">' + (qi + 1 < Q.length ? 'Weiter →' : 'Ergebnis') + '</button>';
        $('quizNext').addEventListener('click', function () { qi++; renderQ(); });
      });
    });
  }
  renderQ();
})();
