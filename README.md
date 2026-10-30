# ✦ Astronomie Entdecker

Eine interaktive, komplett deutschsprachige Astronomie-Website: Live-Sternkarte, Wetter- & Sichtbarkeits-Check, ISS-Überflüge, Planeten in 3D, Sternbilder mit Mythologie, „Heute Nacht sichtbar“-Planer und ein spielerischer Teleskop-Einsteigerbereich. Alles läuft im Browser – ohne eigenes Backend, ohne API-Schlüssel, ohne CDN (nur Wetter- und ISS-Bahndaten werden – falls online – von freien, schlüssellosen Diensten geladen).

**Live-Version:** https://leonhamedani.github.io/astronomie-entdecker/

## Starten

**Variante 1 – einfach öffnen:** Doppelklick auf `index.html` (die Startseite verlinkt alle Unterseiten). Die Seite funktioniert direkt über `file://` (alle Skripte und Daten sind klassische, lokal eingebundene Dateien).

**Variante 2 – kleiner lokaler Server** (empfohlen, damit die Standortabfrage per GPS funktioniert – Browser erlauben Geolocation nur über `https://` oder `http://localhost`):

```bash
cd astronomie-entdecker
python3 -m http.server 8000
# danach im Browser: http://localhost:8000
```

Alternativ: `npx serve .`

## Seitenstruktur

Seit v7 ist die Website kein One-Pager mehr, sondern besteht aus fünf Unterseiten mit gemeinsamer Kopfzeile (aktive Seite hervorgehoben, Hamburger-Menü auf Handy und Tablet), gemeinsamem Fuß mit Lizenzen/Quellen und demselben Glas-Design samt animiertem Sternenhintergrund. Alle Links sind relativ – die Seite läuft daher auch unter einem Unterpfad (GitHub Pages) und über `file://`.

| Seite | Inhalt | lädt zusätzlich |
|---|---|---|
| `index.html` – **Start** | Hero, Überblick mit Kacheln zu allen Bereichen, kompaktes „Heute Nacht auf einen Blick“ (Sonnenuntergang, astronomische Dunkelheit, Mondphase, Zahl und Liste der hellsten sichtbaren Planeten) | nur Astronomy Engine (keine Sterndaten, kein three.js) |
| `sternkarte.html` – **Sternkarte** | Live-Himmelskarte mit Zeitregler, ISS am Himmel, „Sternbilder heute Nacht“ mit Infokarten (Mythologie, hellste Sterne) und Tipps zum Erkennen von Sternbildern | Sterndaten, Sternbild-Texte, satellite.js |
| `heute.html` – **Heute sichtbar** | Standortabfrage (GPS, Stadt, Koordinaten), Beobachtungsplaner (Sonne & Dämmerung, Mond, Planeten, helle Sterne mit Richtung/Höhe/Zeit), Wetter- & Sichtbarkeits-Check, ISS-Überflüge mit Live-Karte | Sterndaten, satellite.js, Wetter (Open-Meteo), TLE (CelesTrak) |
| `planeten.html` – **Planeten 3D** | drehbare 3D-Planeten, Steckbriefe, Größenvergleich, „Heute sichtbar?“ | three.js + Texturen (einzige Seite mit three.js) |
| `lernen.html` – **Lernen & Teleskop** | 01 Lernpfad „Sterne lesen“ (8 Stationen, Hand-Trick, Mini-Spiel, Profi-Tipps, Apps) · 02 Teleskop-Spielplatz (animiertes Teleskop, Linse vs. Spiegel, Bau-Puzzle, Quiz) · 03 Teleskop-Ratgeber mit Quiz · 04 Okular-Rechner · 05 Himmelsobjekte erklärt · 06 Astrofotografie mit dem Handy · 07 Lichtverschmutzung & dunkle Orte | Sterndaten, Sternbild-Texte |

- **Standort einmal wählen – gilt überall:** gespeichert in `localStorage` (`ae-location`), auf jeder Seite über den 📍-Knopf in der Kopfzeile änderbar; auf „Heute sichtbar“ und der Sternkarte zusätzlich über die Standort-Leiste. Eine Änderung in einem anderen Tab wird automatisch übernommen.
- **„Auf der Karte zeigen“** funktioniert seitenübergreifend: Von „Heute sichtbar“, den Planeten oder dem Lernpfad springt die Sternkarte (`sternkarte.html?zeige=Höhe,Azimut,Zeit`) direkt zur passenden Uhrzeit und Blickrichtung.
- **Alte Links bleiben gültig:** `index.html#himmelskarte`, `#wetter`, `#heute-nacht`, `#iss`, `#planeten`, `#sterne-lesen`, `#einsteiger` sowie die Sprungmarken der Unterbereiche (`#fold-…`) leiten auf die passende Unterseite (und den passenden Abschnitt) um.
- Kopf- und Fußzeile stehen bewusst als statisches HTML in jeder Seite (kein Build-Schritt, funktioniert ohne JavaScript-Templating). Bei Änderungen an der Navigation bitte alle fünf Dateien anpassen.

## Funktionen

- **Live-Himmelskarte** (Canvas, stereografische Projektion im Horizontsystem): ~4.100 echte Sterne bis ca. 5,8 mag, Sternfarben nach B-V-Index, Planeten, Sonne und Mond (mit Phase). Schwenken, Zoomen (Mausrad / Pinch), Himmelsrichtungen N/NO/O/…, Horizont, Koordinatennetz, Vollbild. Hover/Tippen zeigt Name, Helligkeit, Höhe und Azimut. Zeitschieberegler und Zeitraffer für die ganze Nacht.
- **Sternbilder:** alle 88 IAU-Sternbilder mit Strichfiguren und deutschen Namen (ein-/ausblendbar). Klick öffnet eine Infokarte mit Mythologie, Highlights, hellsten Sternen, Figur-Vorschau und bester Jahreszeit.
- **Wetter- & Sichtbarkeits-Check:** stündliche Vorhersage von [Open-Meteo](https://open-meteo.com/) (Wolken tief/mittel/hoch, Regenwahrscheinlichkeit, Luftfeuchte, Taupunkt, Sichtweite, Wind/Böen, Temperatur) wird mit Mondlicht (Phase × Höhe) und Dunkelheit (Sonnenstand) zu einem **Beobachtungs-Score 0–100** mit Emoji und Bewertung kombiniert. Zeitleiste Stunde für Stunde, bestes Beobachtungsfenster und Tipps wie „Mond stört bis 01:00“, Taugefahr oder aufklarender Himmel. Offline: Score nur aus Mond + Dunkelheit (mit Hinweis). Antwort 30 min im Browser zwischengespeichert.
- **ISS-Überflüge:** Bahnberechnung mit [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4) aus aktuellen TLE-Bahndaten von [CelesTrak](https://celestrak.org/) (3 h Cache, sonst mitgelieferte TLE als Rückfall mit Alters-Warnung). Alle Überflüge der nächsten 10 Tage mit Start/Höhepunkt/Ende in Ortszeit, Richtung „von … nach …“, maximaler Höhe, geschätzter Helligkeit und Sichtbarkeitsprüfung (ISS sonnenbeschienen, während bei dir Dämmerung/Nacht ist; Eintritt in den Erdschatten). Countdown zum nächsten sichtbaren Überflug, `.ics`-Kalendererinnerung (10 min vorher), Live-Weltkarte mit Tag/Nacht-Grenze, Bodenspur und Sichtkreis – und die ISS erscheint samt Bahnspur auf der Himmelskarte, sobald sie über dem Horizont steht.
- **Planeten-Steckbriefe in 3D:** alle 8 Planeten plus Mond als drehbare [three.js](https://threejs.org/)-Modelle (Maus/Finger drehen mit Schwung, Mausrad/Pinch zoomen, echte Achsneigung, Saturn mit Ringen). Steckbriefe mit Durchmesser, Abstand, Tag, Jahr, Monden, Temperatur und Fun Facts sowie „Heute sichtbar?“ mit Richtung, Höhe und bester Zeit (verknüpft mit der Himmelskarte). Größenvergleich aller Planeten im echten Maßstab. three.js und Texturen werden nur auf `planeten.html` geladen.
- **Standort:** Browser-Geolocation, Städteliste (Deutschland/Europa, mit passender Zeitzone) oder eigene Koordinaten. Wird im Browser gespeichert.
- **Heute Nacht sichtbar:** Sonnenuntergang, Dämmerungsphasen, astronomische Dunkelheit, Mondphase, Mondauf-/-untergang, Planeten, helle Sterne und Sternbilder – jeweils mit Himmelsrichtung (z. B. „Südost, 135°“), Höhe („35° über dem Horizont“) und bester Beobachtungszeit. „Auf der Karte zeigen“ springt direkt zur passenden Ansicht (von anderen Unterseiten per `sternkarte.html?zeige=Höhe,Azimut,Zeit`; optional `&ziel=RA,Dec,Name` für eine goldene Zielmarkierung).
- **Sterne lesen lernen:** Lernpfad mit 8 Stationen (Großer Wagen → Polarstern → Kassiopeia → Arktur & Spica → Sommerdreieck → Herbstviereck & Andromedagalaxie → Orion → Wintersechseck) mit animierten Star-Hopping-Demos, Sichtbarkeit für heute Abend und Fortschritt/Rang (im Browser gespeichert). Dazu der Hand-Trick zum Winkelmessen (Finger ≈ 1°, Faust ≈ 10° …), das Mini-Spiel „Finde das Sternbild“ mit Rekord, Profi-Tipps, Rotlicht-Modus sowie App- und Sternkarten-Empfehlungen.
- **Einsteiger-Bereich:** interaktives SVG-Teleskop (Objektiv/Hauptspiegel, Tubus, Okular, Sucher, Fokussierer, Montierung, Stativ) – jedes Bauteil mit eigener Animation (Lichtweg, Fokussieren unscharf → scharf, Sucher-Fadenkreuz, schwenkende Achsen, ausklappendes Stativ), Refraktor-vs.-Reflektor-Vergleich mit fließenden Lichtteilchen entlang des Strahlengangs, Drag-&-Drop-Baupuzzle, Quiz und Beobachtungstipps.

- **Teleskop-Ratgeber:** sechs Bauarten (Refraktor, Newton, Dobson, Schmidt-Cassegrain/Maksutov, Smart-Teleskop, Fernglas) mit animiertem Schnittbild und Lichtweg, Vor- und Nachteilen, Eignung (Planeten/Mond, Deep-Sky, Fotografie, Reisen), ungefährem Preisrahmen in € und Einsteiger-Bewertung, dazu eine Vergleichstabelle. Das Quiz „Welches Teleskop passt zu mir?“ (5 Fragen: Budget, Interesse, Transport, Fotografie, Aufbau/Technik) liefert eine begründete Empfehlung mit Alternative und lässt sich neu starten.
- **Okular- & Vergrößerungs-Rechner:** Brennweite, Öffnung, Okular, Barlowlinse und Eigengesichtsfeld eingeben (oder Vorlagen typischer Einsteiger-Teleskope wählen) → Vergrößerung, wahres Gesichtsfeld, Austrittspupille, maximal sinnvolle Vergrößerung (≈ 2 × Öffnung in mm), Grenzgröße und Auflösung (Dawes). Warnt bei zu hoher Vergrößerung und zeigt Mond, Plejaden, Jupiter oder Andromeda maßstäblich im simulierten Okular.
- **Himmelsobjekte erklärt:** Sterne, Doppelsterne, offene und Kugelsternhaufen, Nebel, Galaxien sowie Kometen/Meteore mit animierter Illustration, ehrlicher „So siehst du es wirklich“-Beschreibung (umschaltbare Okular-Ansicht) und je zwei bekannten Beispielen (mit Messier-Nummer und bester Jahreszeit). „Auf der Karte zeigen“ öffnet die Sternkarte zur besten Uhrzeit und markiert das Objekt mit einem goldenen Kreis.
- **Astrofotografie mit dem Handy:** sieben Schritte (Stativ, Nacht-/Pro-Modus, ISO, Belichtung, Fokus ∞, Selbstauslöser, RAW), Motive (Mond afokal mit Halterung, Milchstraße, Sternspuren, Bearbeitung) und ein Belichtungs-Helfer mit 500er- und NPF-Regel samt Vorschau, ab wann Sterne zu Strichen werden.
- **Lichtverschmutzung & dunkle Orte:** Bortle-Skala 1–9 als Schieberegler mit simuliertem Himmel (Sterne, Milchstraße, Lichtglocke), Grenzgröße und SQM-Wert je Klasse; Tipps zur Suche dunkler Orte (Link zu [lightpollutionmap.info](https://www.lightpollutionmap.info/)), zur Dunkeladaption und eine Liste der offiziell von DarkSky International anerkannten Sternenparks in Deutschland.
- **Design:** dunkle Weltraum-Optik mit Glas-Effekten (Milchglas-Panels, Glanzkanten, Lichtreflexe beim Hover), Parallax-Sternenfeld, Sternschnuppen, Scroll-Animationen; responsiv für Handy und Tablet.

## Bedienung & Aufbau

- **Klare Gliederung:** fünf Unterseiten (siehe oben); jede beginnt mit einem kompakten Seitenkopf, mehrteilige Seiten haben nummerierte Abschnitte (z. B. „Heute sichtbar“: 01 Heute Nacht · 02 Wetter · 03 ISS; „Lernen“: 01 Sterne lesen · 02 Teleskop · 03 Ratgeber · 04 Rechner · 05 Himmelsobjekte · 06 Astrofoto · 07 Dunkler Himmel) mit Einleitung, Trennlinie und Schnellzugriff-Chips.
- **Auf- und zuklappen:** längere Unterbereiche (z. B. Helle Sterne, Hand-Trick, Mini-Spiel, Profi-Tipps, Apps, Teleskop-Spiele, Beobachtungstipps) sind Akkordeons mit sanfter Animation. Wichtiges ist offen, Details sind zugeklappt; auf dem Handy ist mehr zugeklappt. Jeder Abschnitt mit mehreren Bereichen hat „Alle aufklappen/zuklappen“. Der Zustand wird im Browser gespeichert (`localStorage`, Schlüssel `ae-folds-v1`). Barrierearm: echte Buttons mit `aria-expanded`/`aria-controls`, Bedienung per Enter/Leertaste, zugeklappte Inhalte sind `inert`.
- **„Mehr anzeigen“:** lange Kartenlisten (Sternbilder, helle Sterne, ISS-Überflüge, Tipps) zeigen zunächst nur die ersten Einträge.
- **Orientierung:** Die Kopfzeile markiert die aktive Unterseite; innerhalb einer Seite markiert der Scroll-Spy den aktuellen Abschnitt in den Schnellzugriff-Chips des Seitenkopfs und in einer Punkt-Leiste am rechten Rand (große Bildschirme). Dazu ein Lesefortschritt unter der Kopfzeile und ein „Nach oben“-Knopf.
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
- Jede Seite bindet nur die Skripte ein, die sie braucht. Gemeinsam: `core.js` (Standort, Zeit, Koordinaten), `background.js` (Sternenhintergrund), `ux.js` (Aufklappen, „Mehr anzeigen“, Scroll-Spy, Menü) und `main.js` (Initialisierung, Standortwahl, Seitenübergänge). Seitenspezifisch: `glance.js` (Start), `skymap.js` + `tonight.js` + `iss.js` (Sternkarte), `tonight.js` + `weather.js` + `iss.js` (Heute sichtbar), `planets3d.js` (Planeten), `learn.js` + `telescope.js` + `ratgeber.js` + `rechner.js` + `objekte.js` + `bortle.js` (Lernen). Die Module prüfen selbst, ob ihre Elemente auf der Seite vorhanden sind.
- Cache-Busting: alle CSS/JS-Verweise tragen `?v=…` (aktuell `?v=9`) (Version in `AE.V` in `js/core.js` und in allen fünf HTML-Seiten gemeinsam erhöhen).

## Hinweise / Grenzen

- Die GPS-Standortabfrage funktioniert nur über `https://` oder `http://localhost`; über `file://` bitte Stadt oder Koordinaten wählen. Manche Browser trennen `localStorage` bei `file://` pro Datei – dann muss der Standort ggf. pro Seite gewählt werden (über einen lokalen Server oder online tritt das nicht auf).

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
