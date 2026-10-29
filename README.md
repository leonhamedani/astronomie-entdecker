# ✦ Astronomie Entdecker

Eine interaktive, komplett deutschsprachige Astronomie-Website: Live-Sternkarte, Sternbilder mit Mythologie, „Heute Nacht sichtbar“-Planer und ein spielerischer Teleskop-Einsteigerbereich. Alles läuft lokal im Browser – ohne Server-Backend, ohne API-Schlüssel, ohne CDN.

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
- **Standort:** Browser-Geolocation, Städteliste (Deutschland/Europa, mit passender Zeitzone) oder eigene Koordinaten. Wird im Browser gespeichert.
- **Heute Nacht sichtbar:** Sonnenuntergang, Dämmerungsphasen, astronomische Dunkelheit, Mondphase, Mondauf-/-untergang, Planeten, helle Sterne und Sternbilder – jeweils mit Himmelsrichtung (z. B. „Südost, 135°“), Höhe („35° über dem Horizont“) und bester Beobachtungszeit. „Auf der Karte zeigen“ springt direkt zur passenden Ansicht.
- **Einsteiger-Bereich:** interaktives SVG-Teleskop (Objektiv/Hauptspiegel, Tubus, Okular, Sucher, Fokussierer, Montierung, Stativ), Refraktor-vs.-Reflektor-Vergleich mit animiertem Lichtweg, Drag-&-Drop-Baupuzzle, Quiz und Beobachtungstipps.

## Technik & Quellen

- Reines HTML/CSS/JavaScript, keine Build-Schritte nötig.
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) 2.1.19 (MIT) – Planeten-, Sonnen- und Mondpositionen, Auf-/Untergänge, Präzession/Nutation (lokal unter `js/vendor/`).
- Sterne, Sternbildlinien und Namen aus [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-3-Clause, basierend auf Hipparcos / Yale Bright Star Catalogue), aufbereitet in `js/data/sky-data.js`.
- Lizenztexte in `licenses/`.

## Hinweise / Grenzen

- Sternpositionen ohne atmosphärische Refraktion (Planeten/Sonne/Mond mit Refraktion); Abweichung am Horizont < 0,6°.
- Eigenbewegung der Sterne wird nicht berücksichtigt (für das bloße Auge unerheblich).
- Bei eigenen Koordinaten wird die Zeitzone des Browsers verwendet.
- Mythologietexte gibt es für die bekanntesten ~50 Sternbilder; für die übrigen erscheint ein allgemeiner Text.
