# ✦ Astronomie Entdecker

Eine interaktive, komplett deutschsprachige Astronomie-Website: Live-Sternkarte, Wetter- & Sichtbarkeits-Check, ISS-Überflüge, Planeten in 3D, Sternbilder mit Mythologie, „Heute Nacht sichtbar“-Planer und ein spielerischer Teleskop-Einsteigerbereich. Alles läuft im Browser – ohne eigenes Backend, ohne API-Schlüssel, ohne CDN (nur Wetter- und ISS-Bahndaten werden – falls online – von freien, schlüssellosen Diensten geladen).

**Live-Version:** https://leonhamedani.github.io/astronomie-entdecker/

## Starten

**Variante 1 – einfach öffnen:** Doppelklick auf `index.html`. Die Seite funktioniert direkt über `file://` (alle Skripte und Daten sind klassische, lokal eingebundene Dateien).

**Variante 2 – kleiner lokaler Server** (empfohlen, damit die Standortabfrage per GPS funktioniert – Browser erlauben Geolocation nur über `https://` oder `http://localhost`):

```bash
cd astronomie-entdecker
python3 -m http.server 8000
# danach im Browser: http://localhost:8000
```

Alternativ: `npx serve .`

## Funktionen

- **Live-Himmelskarte** (Canvas, stereografische Projektion im Horizontsystem): ~4.100 echte Sterne bis ca. 5,8 mag, Sternfarben nach B-V-Index, Planeten, Sonne und Mond (mit Phase). Schwenken, Zoomen (Mausrad / Pinch), Himmelsrichtungen N/NO/O/…, Horizont, Koordinatennetz, Vollbild. Hover/Tippen zeigt Name, Helligkeit, Höhe und Azimut. Zeitschieberegler und Zeitraffer für die ganze Nacht.
- **Sternbilder:** alle 88 IAU-Sternbilder mit Strichfiguren und deutschen Namen (ein-/ausblendbar). Klick öffnet eine Infokarte mit Mythologie, Highlights, hellsten Sternen, Figur-Vorschau und bester Jahreszeit.
- **Wetter- & Sichtbarkeits-Check:** stündliche Vorhersage von [Open-Meteo](https://open-meteo.com/) (Wolken tief/mittel/hoch, Regenwahrscheinlichkeit, Luftfeuchte, Taupunkt, Sichtweite, Wind/Böen, Temperatur) wird mit Mondlicht (Phase × Höhe) und Dunkelheit (Sonnenstand) zu einem **Beobachtungs-Score 0–100** mit Emoji und Bewertung kombiniert. Zeitleiste Stunde für Stunde, bestes Beobachtungsfenster und Tipps wie „Mond stört bis 01:00“, Taugefahr oder aufklarender Himmel. Offline: Score nur aus Mond + Dunkelheit (mit Hinweis). Antwort 30 min im Browser zwischengespeichert.
- **ISS-Überflüge:** Bahnberechnung mit [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4) aus aktuellen TLE-Bahndaten von [CelesTrak](https://celestrak.org/) (3 h Cache, sonst mitgelieferte TLE als Rückfall mit Alters-Warnung). Alle Überflüge der nächsten 10 Tage mit Start/Höhepunkt/Ende in Ortszeit, Richtung „von … nach …“, maximaler Höhe, geschätzter Helligkeit und Sichtbarkeitsprüfung (ISS sonnenbeschienen, während bei dir Dämmerung/Nacht ist; Eintritt in den Erdschatten). Countdown zum nächsten sichtbaren Überflug, `.ics`-Kalendererinnerung (10 min vorher), Live-Weltkarte mit Tag/Nacht-Grenze, Bodenspur und Sichtkreis – und die ISS erscheint samt Bahnspur auf der Himmelskarte, sobald sie über dem Horizont steht.
- **Planeten-Steckbriefe in 3D:** alle 8 Planeten plus Mond als drehbare [three.js](https://threejs.org/)-Modelle (Maus/Finger drehen mit Schwung, Mausrad/Pinch zoomen, echte Achsneigung, Saturn mit Ringen). Steckbriefe mit Durchmesser, Abstand, Tag, Jahr, Monden, Temperatur und Fun Facts sowie „Heute sichtbar?“ mit Richtung, Höhe und bester Zeit (verknüpft mit der Himmelskarte). Größenvergleich aller Planeten im echten Maßstab. three.js und Texturen werden erst geladen, wenn der Bereich in Sichtweite kommt.
- **Standort:** Browser-Geolocation, Städteliste (Deutschland/Europa, mit passender Zeitzone) oder eigene Koordinaten. Wird im Browser gespeichert.
- **Heute Nacht sichtbar:** Sonnenuntergang, Dämmerungsphasen, astronomische Dunkelheit, Mondphase, Mondauf-/-untergang, Planeten, helle Sterne und Sternbilder – jeweils mit Himmelsrichtung (z. B. „Südost, 135°“), Höhe („35° über dem Horizont“) und bester Beobachtungszeit. „Auf der Karte zeigen“ springt direkt zur passenden Ansicht.
- **Sterne lesen lernen:** Lernpfad mit 8 Stationen (Großer Wagen → Polarstern → Kassiopeia → Arktur & Spica → Sommerdreieck → Herbstviereck & Andromedagalaxie → Orion → Wintersechseck) mit animierten Star-Hopping-Demos, Sichtbarkeit für heute Abend und Fortschritt/Rang (im Browser gespeichert). Dazu der Hand-Trick zum Winkelmessen (Finger ≈ 1°, Faust ≈ 10° …), das Mini-Spiel „Finde das Sternbild“ mit Rekord, Profi-Tipps, Rotlicht-Modus sowie App- und Sternkarten-Empfehlungen.
- **Einsteiger-Bereich:** interaktives SVG-Teleskop (Objektiv/Hauptspiegel, Tubus, Okular, Sucher, Fokussierer, Montierung, Stativ) – jedes Bauteil mit eigener Animation (Lichtweg, Fokussieren unscharf → scharf, Sucher-Fadenkreuz, schwenkende Achsen, ausklappendes Stativ), Refraktor-vs.-Reflektor-Vergleich mit fließenden Lichtteilchen entlang des Strahlengangs, Drag-&-Drop-Baupuzzle, Quiz und Beobachtungstipps.

- **Design:** dunkle Weltraum-Optik mit Glas-Effekten (Milchglas-Panels, Glanzkanten, Lichtreflexe beim Hover), Parallax-Sternenfeld, Sternschnuppen, Scroll-Animationen; responsiv für Handy und Tablet.

## Bedienung & Aufbau

- **Klare Gliederung:** sieben nummerierte Abschnitte (01 Himmelskarte · 02 Wetter · 03 Heute Nacht · 04 ISS · 05 Planeten · 06 Sterne lesen · 07 Einsteiger), jeweils mit kurzer Einleitung, Trennlinie und – wo sinnvoll – Schnellzugriff-Chips auf die Unterbereiche.
- **Auf- und zuklappen:** längere Unterbereiche (z. B. Helle Sterne, Hand-Trick, Mini-Spiel, Profi-Tipps, Apps, Teleskop-Spiele, Beobachtungstipps) sind Akkordeons mit sanfter Animation. Wichtiges ist offen, Details sind zugeklappt; auf dem Handy ist mehr zugeklappt. Jeder Abschnitt mit mehreren Bereichen hat „Alle aufklappen/zuklappen“. Der Zustand wird im Browser gespeichert (`localStorage`, Schlüssel `ae-folds-v1`). Barrierearm: echte Buttons mit `aria-expanded`/`aria-controls`, Bedienung per Enter/Leertaste, zugeklappte Inhalte sind `inert`.
- **„Mehr anzeigen“:** lange Kartenlisten (Sternbilder, helle Sterne, ISS-Überflüge, Tipps) zeigen zunächst nur die ersten Einträge.
- **Orientierung:** Scroll-Spy markiert den aktuellen Abschnitt in der Navigation und in einer Punkt-Leiste am rechten Rand (große Bildschirme), dazu ein Lesefortschritt unter der Kopfzeile und ein „Nach oben“-Knopf.
- **Handy (360–430 px):** Hamburger-Menü mit großen Zeilen (≥ 48 px), Esc/Antippen außerhalb schließt es; Touch-Ziele ≥ 44 px, Schrift ≥ 12 px, kein horizontales Scrollen, waagerecht wischbare Werkzeug- und Planetenleisten, passend große Himmelskarte und 3D-Bühne, weniger Effekte (weniger Hintergrundsterne, 30 fps, keine Nebel-Animation, schwächerer Glas-Blur).

## Technik & Quellen

- Reines HTML/CSS/JavaScript, keine Build-Schritte nötig.
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) 2.1.19 (MIT) – Planeten-, Sonnen- und Mondpositionen, Auf-/Untergänge, Präzession/Nutation (lokal unter `js/vendor/`).
- Sterne, Sternbildlinien und Namen aus [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-3-Clause, basierend auf Hipparcos / Yale Bright Star Catalogue), aufbereitet in `js/data/sky-data.js`.
- [satellite.js](https://github.com/shashwatak/satellite-js) 5.0.0 (MIT) – SGP4-Bahnmodell für die ISS.
- [three.js](https://threejs.org/) r149 (MIT) – 3D-Planeten, wird bei Bedarf nachgeladen.
- Planetentexturen: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0), auf 1024 × 512 px verkleinert und als Data-URI in `js/textures/` eingebettet (damit WebGL auch über `file://` funktioniert).
- Wetter: [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0, ohne Schlüssel). ISS-Bahndaten: [CelesTrak](https://celestrak.org/).
- Lizenztexte in `licenses/`.
- Cache-Busting: alle CSS/JS-Verweise tragen `?v=…` (aktuell `?v=6`) (Version in `AE.V` in `js/core.js` und in `index.html` gemeinsam erhöhen).

## Hinweise / Grenzen

- Sternpositionen ohne atmosphärische Refraktion (Planeten/Sonne/Mond mit Refraktion); Abweichung am Horizont < 0,6°.
- Eigenbewegung der Sterne wird nicht berücksichtigt (für das bloße Auge unerheblich).
- Bei eigenen Koordinaten wird die Zeitzone des Browsers verwendet.
- Mythologietexte gibt es für die bekanntesten ~50 Sternbilder; für die übrigen erscheint ein allgemeiner Text.
- ISS-Zeiten sind nur so gut wie die Bahndaten: mit frischen TLE ca. ±1 min, mit der mitgelieferten (älteren) TLE können es mehrere Minuten sein – die Seite warnt ab 4 Tagen Alter. Bahnmanöver der ISS sind nicht vorhersehbar.
- Die ISS-Helligkeit ist eine Schätzung (Standard-Helligkeit −1,8 mag bei 1.000 km, diffuse Phasenfunktion); Abweichungen von ±0,5 mag sind normal.
- Der Beobachtungs-Score ist eine Faustregel – Wettermodelle können lokal (Nebel, Gewitter, Lichtverschmutzung) danebenliegen. Lichtverschmutzung des Standorts wird nicht berücksichtigt.
- Ohne Internet fallen Wetter (→ astronomischer Score) und frische ISS-Bahndaten (→ mitgelieferte TLE) weg; der Rest funktioniert offline.
- Die Erdtextur zeigt keine Wolkenschicht; Pluto ist nicht enthalten. Ohne WebGL bleiben die Steckbriefe sichtbar, nur das 3D-Modell fehlt.
- Mondanzahlen ändern sich durch neue Entdeckungen laufend (daher „über 90“ bzw. „über 270“).
