/* Teleskop-Ratgeber: Bauarten mit animiertem Strahlengang, Vergleichstabelle und „Welches Teleskop passt zu mir?“-Quiz */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  if (!$('stTabs')) return;

  // Bewertungen 0–5: Planeten/Mond, Deep-Sky, Fotografie, Reisen; „easy“ = Einsteigerfreundlichkeit
  var T = [
    { id: 'refr', e: '🔭', n: 'Linsenteleskop', sub: 'Refraktor', easy: 4, r: [4, 2, 3, 4],
      price: 'ca. 150–500 € (Achromat, 70–102 mm) · Apochromaten ab ca. 600 €',
      what: 'Vorne sitzt eine Linse (das Objektiv), die das Licht bricht und hinten im Brennpunkt bündelt. Der Tubus ist geschlossen – kein Justieren, kaum Wartung.',
      pro: ['Robust und praktisch wartungsfrei', 'Scharfe, kontrastreiche Bilder von Mond, Planeten und Doppelsternen', 'Sofort einsatzbereit, kurze Auskühlzeit'],
      con: ['Pro Zentimeter Öffnung am teuersten', 'Günstige Achromaten zeigen Farbsäume um helle Objekte', 'Meist kleine Öffnung – für lichtschwache Galaxien wenig Licht'],
      best: 'Mond, Planeten, Doppelsterne, Reisen – und mit Apochromat auch Astrofotografie.' },
    { id: 'newton', e: '🪞', n: 'Spiegelteleskop', sub: 'Newton', easy: 3, r: [4, 4, 3, 2],
      price: 'ca. 200–700 € (114–150 mm auf parallaktischer Montierung)',
      what: 'Ein Hohlspiegel am hinteren Ende sammelt das Licht und wirft es nach vorne auf einen kleinen, schrägen Fangspiegel. Der lenkt es seitlich zum Okular.',
      pro: ['Viel Öffnung fürs Geld', 'Keine Farbsäume (Spiegel brechen kein Licht)', 'Lichtstarke Modelle gut für Deep-Sky und Fotos'],
      con: ['Spiegel müssen ab und zu justiert werden (Kollimation)', 'Parallaktische Montierung ist anfangs knifflig', 'Offener Tubus: braucht Auskühlzeit, verstaubt eher'],
      best: 'Allrounder für Mond, Planeten und hellere Deep-Sky-Objekte – Tüftler und angehende Astrofotografen.' },
    { id: 'dob', e: '📦', n: 'Dobson', sub: 'Newton auf Rockerbox', easy: 5, r: [4, 5, 1, 2],
      price: 'ca. 300–1.200 € (150–300 mm Öffnung)',
      what: 'Optisch ein Newton – aber auf einer einfachen Holzbox („Rockerbox“), die du wie eine Kanone nach oben/unten und links/rechts schwenkst. Kein Einnorden, keine Elektronik.',
      pro: ['Maximale Öffnung pro Euro – die beste „Lichtkanone“ für Einsteiger', 'Aufbau in einer Minute, intuitiv zu bedienen', 'Zeigt Galaxien, Kugelsternhaufen und Nebel eindrucksvoll'],
      con: ['Groß und schwer (ab 200 mm über 20 kg)', 'Objekte wandern aus dem Bild – von Hand nachführen', 'Für lange Belichtungen (Fotos) ungeeignet'],
      best: 'Deep-Sky und Planeten beobachten – die klassische Empfehlung, wenn du einfach viel sehen willst.' },
    { id: 'kat', e: '🥫', n: 'Kompakt-Teleskop', sub: 'Schmidt-Cassegrain / Maksutov', easy: 3, r: [5, 3, 3, 4],
      price: 'ca. 300–800 € (Maksutov 90–127 mm) · Schmidt-Cassegrain mit GoTo ca. 1.200–3.000 €',
      what: 'Linse und Spiegel kombiniert (katadioptrisch): Das Licht läuft im kurzen Tubus zweimal hin und her. So steckt eine lange Brennweite in einem kompakten Rohr.',
      pro: ['Sehr kompakt und transportabel', 'Lange Brennweite: hohe Vergrößerung für Mond und Planeten', 'Oft mit GoTo-Steuerung, die Objekte automatisch anfährt'],
      con: ['Kleines Gesichtsfeld – große Nebel passen nicht ins Bild', 'Braucht Auskühlzeit, Korrektorplatte kann beschlagen', 'Teurer als ein Newton gleicher Öffnung'],
      best: 'Mond, Planeten und Doppelsterne – und für alle, die wenig Platz haben oder viel unterwegs sind.' },
    { id: 'smart', e: '📱', n: 'Smart-Teleskop', sub: 'Kamera-Teleskop mit App', easy: 5, r: [2, 4, 5, 4],
      price: 'ca. 500–5.000 € (je nach Öffnung und Kamera)',
      what: 'Statt eines Okulars steckt eine Kamera im Teleskop. Es richtet sich per App selbst aus, findet Objekte automatisch und addiert viele Einzelbilder – auf dem Handy entsteht live ein farbiges Bild.',
      pro: ['Kinderleicht: aufstellen, App öffnen, Objekt antippen', 'Farbige Bilder von Nebeln und Galaxien – auch aus der Stadt', 'Leicht und transportabel'],
      con: ['Du schaust auf einen Bildschirm, nicht durchs Okular', 'Meist kleine Öffnung – Planeten wirken winzig', 'Abhängig von App und Akku; teuer für die Optik'],
      best: 'Bequeme Astrofotografie von Deep-Sky-Objekten – ideal zum Teilen und für Technik-Fans.' },
    { id: 'fern', e: '🔍', n: 'Fernglas', sub: 'z. B. 10×50 oder 7×50', easy: 5, r: [1, 2, 0, 5],
      price: 'ca. 50–300 €',
      what: 'Zwei kleine Linsenfernrohre mit Prismen, die das Bild aufrichten. Die erste Zahl ist die Vergrößerung, die zweite der Objektivdurchmesser in mm.',
      pro: ['Günstig, sofort einsatzbereit, passt in jede Tasche', 'Großes Gesichtsfeld – perfekt zum Lernen des Himmels', 'Zeigt Mondkrater, Jupitermonde, Plejaden, Andromedagalaxie'],
      con: ['Geringe Vergrößerung – Saturnringe kaum erkennbar', 'Freihändig wackelig (Stativadapter hilft)', 'Für Fotos ungeeignet'],
      best: 'Der perfekte Start und später der ideale Begleiter zum Teleskop.' }
  ];
  var BY = {}; T.forEach(function (t) { BY[t.id] = t; });
  var CATS = [['🌕', 'Planeten/Mond'], ['🌌', 'Deep-Sky'], ['📷', 'Fotografie'], ['🧳', 'Reisen']];

  /* ---------- Schnittbilder (SVG) mit Lichtweg ---------- */
  function photons(path, dur, n) {
    var s = '';
    for (var i = 0; i < n; i++) s += '<circle r="5.5" class="st-ph"><animateMotion dur="' + dur + 's" begin="-' + (dur * i / n).toFixed(2) + 's" repeatCount="indefinite" path="' + path + '"/></circle>';
    return s;
  }
  function rays(paths, dur) { return paths.map(function (p) { return '<path class="st-ray" d="' + p + '"/>'; }).join('') + paths.map(function (p) { return photons(p, dur, 2); }).join(''); }
  function lbl(x, y, t, a) { return '<text class="st-lbl" x="' + x + '" y="' + y + '"' + (a ? ' text-anchor="' + a + '"' : '') + '>' + t + '</text>'; }
  var DEFS = '<defs><radialGradient id="stPhG"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe27a"/><stop offset="1" stop-color="#ffd34a" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="stWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c58b52"/><stop offset="1" stop-color="#7a4f2a"/></linearGradient></defs>';
  var SVG = {
    refr: function () {
      var p = ['M600 62 L478 62 L108 110', 'M600 110 L108 110', 'M600 158 L478 158 L108 110'];
      return '<rect class="st-tube" x="96" y="44" width="400" height="132" rx="12"/>' +
        '<ellipse class="st-lens" cx="478" cy="110" rx="12" ry="62"/>' + '<rect class="st-eye" x="52" y="96" width="50" height="28" rx="5"/>' +
        rays(p, 2.6) + '<circle class="st-focus" cx="108" cy="110" r="6"/>' +
        lbl(478, 30, 'Objektiv-Linse', 'middle') + lbl(108, 200, 'Brennpunkt → Okular', 'middle') + lbl(560, 40, '☆ Licht', 'middle');
    },
    newton: function () {
      var p = ['M600 70 L82 70 L432 104 L432 26', 'M600 110 L84 110 L432 106 L432 26', 'M600 150 L82 150 L432 108 L432 26'];
      return '<rect class="st-tube" x="60" y="48" width="460" height="124" rx="12"/>' +
        '<path class="st-mirror" d="M74 46 Q98 110 74 174"/>' + '<line class="st-mirror2" x1="418" y1="92" x2="446" y2="120"/>' +
        '<rect class="st-eye" x="419" y="8" width="26" height="40" rx="5"/>' + rays(p, 3.4) + '<circle class="st-focus" cx="432" cy="26" r="6"/>' +
        lbl(92, 200, 'Hauptspiegel (hohl)', 'start') + lbl(470, 30, 'Okular', 'start') + lbl(372, 200, 'Fangspiegel', 'middle');
    },
    dob: function () {
      var p = ['M640 44 L132 110 L420 104 L404 46', 'M640 84 L140 146 L420 108 L404 46'];
      return '<g class="st-dob-tube"><g transform="rotate(-8 300 120)"><rect class="st-tube" x="110" y="78" width="420" height="96" rx="12"/>' +
        '<path class="st-mirror" d="M122 76 Q142 126 122 176"/><line class="st-mirror2" x1="410" y1="112" x2="432" y2="134"/><rect class="st-eye" x="406" y="44" width="24" height="34" rx="5"/></g>' +
        rays(p, 3.4) + '</g>' +
        '<path class="st-rocker" d="M220 214 L250 140 L370 140 L400 214 Z"/><rect class="st-base" x="196" y="212" width="228" height="14" rx="4"/>' +
        '<circle class="st-bear" cx="270" cy="150" r="9"/><circle class="st-bear" cx="350" cy="150" r="9"/>' +
        lbl(310, 244, 'Rockerbox: einfach schwenken – rauf/runter, links/rechts', 'middle') + lbl(140, 40, 'Newton-Optik', 'start');
    },
    kat: function () {
      var p = ['M600 64 L172 64 L438 102 L120 110', 'M600 156 L172 156 L438 118 L120 110'];
      return '<rect class="st-tube" x="160" y="44" width="290" height="132" rx="14"/>' +
        '<rect class="st-corr" x="444" y="46" width="8" height="128" rx="3"/>' + '<path class="st-mirror" d="M176 44 Q198 80 182 104 M182 116 Q198 140 176 176"/>' +
        '<rect class="st-mirror2b" x="432" y="98" width="8" height="24" rx="3"/>' + '<rect class="st-eye" x="78" y="96" width="48" height="28" rx="5"/>' +
        rays(p, 3.2) + '<circle class="st-focus" cx="120" cy="110" r="6"/>' +
        lbl(452, 32, 'Korrektorplatte + Fangspiegel', 'middle') + lbl(184, 200, 'Hauptspiegel mit Loch', 'middle') + lbl(102, 150, 'Okular', 'middle');
    },
    smart: function () {
      var p = ['M600 74 L452 74 L246 110', 'M600 110 L246 110', 'M600 146 L452 146 L246 110'];
      return '<rect class="st-tube smart" x="230" y="56" width="236" height="108" rx="26"/>' +
        '<ellipse class="st-lens" cx="452" cy="110" rx="9" ry="44"/>' + '<rect class="st-chip" x="236" y="92" width="14" height="36" rx="2"/>' +
        rays(p, 2.4) + '<path class="st-wave" d="M200 110 q-12 -10 0 -20 M188 110 q-18 -16 0 -32 M200 110 q-12 10 0 20 M188 110 q-18 16 0 32"/>' +
        '<g class="st-phone"><rect x="36" y="40" width="96" height="150" rx="14" class="st-phone-b"/><rect x="44" y="52" width="80" height="124" rx="6" class="st-phone-s"/>' +
        '<g class="st-stack"><ellipse cx="84" cy="114" rx="26" ry="12" class="st-gal1"/><ellipse cx="84" cy="114" rx="12" ry="6" class="st-gal2"/><circle cx="62" cy="78" r="1.6"/><circle cx="104" cy="150" r="1.4"/><circle cx="110" cy="80" r="1.2"/><circle cx="58" cy="150" r="1.3"/></g>' +
        '<text x="84" y="170" text-anchor="middle" class="st-lbl sm">Bild wächst …</text></g>' +
        lbl(250, 196, 'Kamera-Sensor', 'middle') + lbl(452, 40, 'Objektiv', 'middle');
    },
    fern: function () {
      var p = ['M600 92 L480 92 L370 100 L370 140 L270 140 L270 104 L110 104', 'M600 120 L480 120 L380 108 L380 148 L260 148 L260 112 L110 112'];
      return '<rect class="st-tube" x="90" y="78" width="420" height="96" rx="30"/>' +
        '<ellipse class="st-lens" cx="480" cy="106" rx="9" ry="30"/>' + '<path class="st-prism" d="M356 88 L396 88 L396 160 L356 160 Z M244 96 L286 96 L286 160 L244 160 Z"/>' +
        '<rect class="st-eye" x="56" y="94" width="44" height="28" rx="6"/>' + rays(p, 3) +
        lbl(320, 206, 'Prismen richten das Bild auf', 'middle') + lbl(480, 62, 'Objektiv', 'middle') + lbl(78, 150, 'Okular', 'middle');
    }
  };
  var CAP = {
    refr: 'Die Linse bricht das Sternenlicht und bündelt es im Brennpunkt – dort vergrößert das Okular das Bild.',
    newton: 'Der Hohlspiegel wirft das Licht zurück, der kleine Fangspiegel lenkt es zur Seite ins Okular.',
    dob: 'Gleiche Optik wie beim Newton – die Holzbox (Rockerbox) macht die Bedienung kinderleicht.',
    kat: 'Das Licht läuft zweimal durch den kurzen Tubus und verlässt ihn durch ein Loch im Hauptspiegel.',
    smart: 'Statt deines Auges fängt ein Kamera-Chip das Licht ein; die App stapelt Bild für Bild zu einem farbigen Foto.',
    fern: 'Zwei kleine Fernrohre mit Prismen: Die Prismen falten den Lichtweg und drehen das Bild richtig herum.'
  };

  function stars(n) { var s = ''; for (var i = 0; i < 5; i++) s += '<span class="' + (i < n ? 'on' : '') + '">★</span>'; return s; }
  function meter(v) { return '<span class="st-meter" style="--v:' + (v / 5) + '" aria-label="' + v + ' von 5"><i></i></span>'; }
  function render(id) {
    var t = BY[id];
    $('stSvg').innerHTML = '<svg viewBox="0 0 620 250" role="img" aria-label="Schnittbild ' + t.n + ' mit Lichtweg">' + DEFS + SVG[id]() + '</svg>';
    $('stCap').textContent = CAP[id];
    $('stInfo').innerHTML = '<div class="st-head"><span class="st-emoji">' + t.e + '</span><div><p class="eyebrow">' + t.sub + '</p><h3>' + t.n + '</h3></div></div>' +
      '<p>' + t.what + '</p>' +
      '<div class="st-pc"><div><h4>👍 Vorteile</h4><ul class="st-list ok">' + t.pro.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
      '<div><h4>👎 Nachteile</h4><ul class="st-list no">' + t.con.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="st-rates">' + CATS.map(function (c, i) { return '<div class="st-rate"><span>' + c[0] + ' ' + c[1] + '</span>' + meter(t.r[i]) + '</div>'; }).join('') + '</div>' +
      '<div class="st-facts"><div><span>💶 Preisrahmen</span><b>' + t.price + '</b></div><div><span>🌱 Einsteiger</span><b class="st-stars" aria-label="' + t.easy + ' von 5 Sternen">' + stars(t.easy) + '</b></div></div>' +
      '<p class="st-best">🎯 <b>Ideal für:</b> ' + t.best + '</p>';
    $('stTabs').querySelectorAll('button').forEach(function (b) { var on = b.getAttribute('data-st') === id; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
  }
  $('stTabs').innerHTML = T.map(function (t) { return '<button class="chip st-tab" type="button" role="tab" data-st="' + t.id + '">' + t.e + ' ' + t.n + '</button>'; }).join('');
  $('stTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-st]'); if (b) render(b.getAttribute('data-st')); });
  render('refr');

  // Vergleichstabelle
  $('stTable').innerHTML = '<div class="st-tr st-th" role="row"><span role="columnheader">Bauart</span>' + CATS.map(function (c) { return '<span role="columnheader">' + c[0] + ' ' + c[1] + '</span>'; }).join('') + '<span role="columnheader">🌱 Einsteiger</span><span role="columnheader">💶 Preis</span></div>' +
    T.map(function (t) {
      return '<div class="st-tr" role="row"><span role="cell"><b>' + t.e + ' ' + t.n + '</b><small>' + t.sub + '</small></span>' + t.r.map(function (v) { return '<span role="cell">' + meter(v) + '</span>'; }).join('') +
        '<span role="cell" class="st-stars">' + stars(t.easy) + '</span><span role="cell" class="small">' + t.price.split(' · ')[0] + '</span></div>';
    }).join('');

  /* ---------- Quiz ---------- */
  // Punkte je Antwort: [fern, refr, newton, dob, kat, smart]
  var K = ['fern', 'refr', 'newton', 'dob', 'kat', 'smart'];
  var Q = [
    { q: '💶 Wie viel möchtest du ungefähr ausgeben?', a: [
      { t: 'Unter 150 €', s: [5, 0, -1, -2, -2, -5], w: 'Unter 150 € ist ein gutes Fernglas die klügste Wahl – Teleskope in dieser Preisklasse haben oft wackelige Montierungen und frustrieren.' },
      { t: '150–400 €', s: [1, 2, 2, 3, 1, -3], w: 'Mit 150–400 € bekommst du schon einen 150-mm-Dobson, einen guten Newton oder einen soliden Refraktor.' },
      { t: '400–900 €', s: [0, 1, 2, 3, 2, 2], w: '400–900 € reichen für einen großen 200-mm-Dobson, ein Maksutov mit GoTo oder ein einfaches Smart-Teleskop.' },
      { t: 'Mehr als 900 €', s: [0, 2, 1, 2, 3, 3], w: 'Mit über 900 € sind auch Schmidt-Cassegrains mit GoTo, Apochromaten oder größere Smart-Teleskope drin.' }] },
    { q: '✨ Was möchtest du am liebsten sehen?', a: [
      { t: 'Mond & Planeten', s: [0, 3, 2, 2, 3, 0], w: 'Für Mond und Planeten zählen Schärfe und Kontrast bei hoher Vergrößerung.' },
      { t: 'Galaxien, Nebel & Sternhaufen', s: [1, 0, 3, 4, 1, 2], w: 'Für Galaxien und Nebel zählt vor allem Öffnung – also viel Licht sammeln.' },
      { t: 'Schöne Fotos vom Himmel', s: [-2, 2, 1, -2, 1, 4], w: 'Für Fotos brauchst du Nachführung und am besten eine Kamera – oder ein Gerät, das beides kann.' },
      { t: 'Von allem etwas – erst mal reinschnuppern', s: [2, 2, 1, 2, 1, 1], w: 'Zum Reinschnuppern ist ein vielseitiges, unkompliziertes Gerät ideal.' }] },
    { q: '🧳 Wo und wie wirst du beobachten?', a: [
      { t: 'Garten oder Balkon – kurz raustragen', s: [1, 1, 1, 2, 1, 1], w: 'Wenn du nur kurz raustragen musst, darf es ruhig etwas größer sein.' },
      { t: 'Mit dem Auto zu dunklen Orten', s: [1, 1, 0, 1, 1, 1], w: 'Fürs Auto sollte das Gerät in den Kofferraum passen und schnell aufgebaut sein.' },
      { t: 'Auf Reisen / kleine Wohnung – muss klein sein', s: [3, 2, -2, -3, 2, 2], w: 'Wenig Platz und Reisen sprechen für kompakte, leichte Geräte.' },
      { t: 'Fester Platz, z. B. im Garten aufgebaut', s: [0, 1, 2, 1, 2, 1], w: 'Ein fester Platz macht auch schwerere Montierungen bequem.' }] },
    { q: '📷 Wie wichtig ist dir Fotografieren?', a: [
      { t: 'Gar nicht – ich will selbst durchschauen', s: [2, 1, 1, 2, 1, -3], w: 'Wenn du selbst durchschauen willst, ist ein klassisches Okular-Teleskop genau richtig.' },
      { t: 'Ab und zu den Mond mit dem Handy', s: [0, 1, 1, 1, 1, 0], w: 'Mondfotos mit dem Handy klappen an fast jedem Teleskop (Afokal-Methode, siehe unten).' },
      { t: 'Sehr – ich will richtige Astrofotos', s: [-2, 2, 1, -2, 1, 3], w: 'Ernsthafte Astrofotografie braucht eine nachgeführte Montierung oder ein Smart-Teleskop.' }] },
    { q: '⏱️ Wie viel Aufbau und Technik ist okay?', a: [
      { t: 'Sofort losschauen, kein Aufbau', s: [3, 1, -1, 2, 0, 1], w: 'Wer sofort losschauen will, braucht ein Gerät ohne Einnorden und Elektronik.' },
      { t: 'Ein paar Minuten Aufbau sind okay', s: [0, 1, 1, 1, 1, 0], w: 'Ein paar Minuten Aufbau sind bei den meisten Teleskopen normal.' },
      { t: 'Ich tüftle gern (justieren, einnorden)', s: [0, 1, 3, 1, 1, 0], w: 'Wenn du gern tüftelst, macht dir Justieren und Einnorden sogar Spaß.' },
      { t: 'Die Technik soll mir alles abnehmen', s: [0, 0, -1, -1, 2, 4], w: 'Wenn die Technik alles übernehmen soll, sind GoTo-Steuerung oder ein Smart-Teleskop ideal.' }] }
  ];
  var TIP = {
    fern: 'Tipp: Ein 10×50 oder 7×50 mit Stativadapter – und später ist das Fernglas der perfekte Begleiter zum Teleskop.',
    refr: 'Tipp: Achte auf eine stabile Montierung – eine wackelige Montierung ruiniert jedes gute Objektiv.',
    newton: 'Tipp: Ein 130–150-mm-Newton ist ein guter Start; lerne früh das Justieren (Kollimieren) – es ist leichter, als es klingt.',
    dob: 'Tipp: Ein 150- oder 200-mm-Dobson ist der Klassiker. Dazu eine drehbare Sternkarte oder App – und los geht’s.',
    kat: 'Tipp: Ein Maksutov 102–127 mm ist das handliche Planetenwunder; Schmidt-Cassegrains mit GoTo sind die größere Variante.',
    smart: 'Tipp: Vergleiche Öffnung und Sensor – und probiere, wenn möglich, vorher bei einer Sternwarte oder einem Astro-Treffen.'
  };
  var qi = 0, ans = [];
  var box = $('scopeQuiz');
  function renderQ() {
    var q = Q[qi];
    box.innerHTML = '<div class="quiz-prog"><span style="width:' + (qi / Q.length * 100) + '%"></span></div>' +
      '<p class="muted small">Frage ' + (qi + 1) + ' von ' + Q.length + '</p><p class="quiz-q">' + q.q + '</p>' +
      '<div class="quiz-a sq-opts">' + q.a.map(function (a, i) { return '<button class="quiz-opt" type="button" data-sq="' + i + '">' + a.t + '</button>'; }).join('') + '</div>' +
      (qi ? '<button class="chip sq-back" type="button" data-sq-back>← Zurück</button>' : '');
  }
  function result() {
    var sc = K.map(function () { return 0; });
    ans.forEach(function (ai, i) { Q[i].a[ai].s.forEach(function (v, k) { sc[k] += v; }); });
    var order = K.map(function (k, i) { return { k: k, s: sc[i] }; }).sort(function (a, b) { return b.s - a.s; });
    var win = BY[order[0].k], alt = BY[order[1].k], wi = K.indexOf(win.id);
    var why = ans.map(function (ai, i) { var a = Q[i].a[ai]; return a.s[wi] >= 1 ? a.w : null; }).filter(Boolean);
    var caveat = ans.map(function (ai, i) { var a = Q[i].a[ai]; return a.s[wi] < 0 ? '„' + a.t + '“ passt nicht ganz zum ' + win.n + ' – ' + alt.n + ' wäre hier die Alternative.' : null; }).filter(Boolean);
    if (ans[0] === 0 && ans[3] === 2) caveat.push('Für ernsthafte Astrofotos reicht das Budget noch nicht – starte mit Handyfotos vom Mond und sammle Erfahrung.');
    var max = order[0].s, pct = function (s) { return Math.max(8, Math.round(s / Math.max(1, max) * 100)); };
    box.innerHTML = '<div class="sq-result"><p class="eyebrow">Deine Empfehlung</p>' +
      '<div class="sq-win"><span class="sq-emoji">' + win.e + '</span><div><h3>' + win.n + '</h3><p class="muted">' + win.sub + ' · ' + win.price.split(' · ')[0] + '</p></div></div>' +
      '<h4>Warum?</h4><ul class="st-list ok">' + why.slice(0, 4).map(function (w) { return '<li>' + w + '</li>'; }).join('') + '<li>' + win.best + '</li></ul>' +
      (caveat.length ? '<ul class="st-list warn">' + caveat.slice(0, 2).map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="st-best">💡 ' + TIP[win.id] + '</p>' +
      '<div class="sq-bars">' + order.slice(0, 4).map(function (o) { return '<div class="sq-bar"><span>' + BY[o.k].e + ' ' + BY[o.k].n + '</span><i style="--w:' + pct(o.s) + '%"></i></div>'; }).join('') + '</div>' +
      '<p class="small">Alternative: <b>' + alt.e + ' ' + alt.n + '</b> (' + alt.sub + ')</p>' +
      '<div class="learn-actions"><button class="btn btn-primary" type="button" data-sq-show="' + win.id + '">🔭 ' + win.n + ' genauer ansehen</button><button class="chip" type="button" data-sq-restart>↺ Quiz neu starten</button></div></div>';
    AE.confetti && AE.confetti(box);
    AE._scopeQuiz.last = { win: win.id, alt: alt.id, scores: sc };
  }
  box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sq]');
    if (b) { ans[qi] = +b.getAttribute('data-sq'); qi++; if (qi < Q.length) renderQ(); else result(); return; }
    if (e.target.closest('[data-sq-back]')) { qi = Math.max(0, qi - 1); ans.length = qi; renderQ(); return; }
    if (e.target.closest('[data-sq-restart]')) { qi = 0; ans = []; renderQ(); return; }
    var s = e.target.closest('[data-sq-show]');
    if (s) { render(s.getAttribute('data-sq-show')); if (AE.gotoLesson) AE.gotoLesson('teleskop-typen'); else { var el = $('stTabs'); if (el) el.scrollIntoView({ block: 'start' }); } }
  });
  AE._scopeQuiz = { answer: function (list) { qi = 0; ans = []; renderQ(); list.forEach(function (i) { box.querySelector('[data-sq="' + i + '"]').click(); }); return AE._scopeQuiz.last; }, last: null };
  AE._scopeTypes = { render: render, types: T };
  renderQ();
})();
