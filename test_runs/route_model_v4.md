# Routenmodell v4 — was sich geändert hat und warum

Erzeugt mit `scripts/build-route-model-v4.py` aus dem Referenzlauf vom
2026-09-08 (iPhone, gültig, 1150 Stufen, zwölf fotografierte Marken), Höhe aus
der parallel mitlaufenden Strava-Aufzeichnung.

Neue Fixture: `test/fixtures/reference-run-2026-09-08.json` — Lauf, Marken und
gemessene stufenlose Zonen, damit die Tests die Grundlage des Modells selbst
prüfen können.

## Die eine echte Korrektur

Die vorletzte Abschnittsgrenze wandert von Zählerstand **663 auf 611**. Alle
fünf übrigen Grenzen bestätigen v3 auf drei Stufen genau.

Abschnittsgrößen vorher → nachher:

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| v3 | 245 | 19 | 97 | 7 | 100 | **195** | **487** |
| v4 | 240 | 25 | 97 | 9 | 97 | **143** | **539** |

Im Kalibriergang war an dieser Grenze 663 eingetippt statt 611. Das verschob
52 Stufen vom letzten in den vorletzten Abschnitt.

## Damit löst sich die seit Wochen offene Anomalie

Der Beschleunigungssensor zählte in diesen beiden Abschnitten auf **beiden**
Geräten hartnäckig andere Zahlen als das Modell — 1,37 und 0,91 Stufen pro
Tritt. Zwei Erklärungsversuche waren geprüft und verworfen worden (zwei Stufen
auf einmal, zu unempfindlicher Detektor). Mit den korrigierten Größen:

| Abschnitt | Tritte iPhone | Tritte Android | Faktor v3 | Faktor v4 |
|---|---|---|---|---|
| 143 Stufen | 142 | 143 | 1,37 / 1,36 | **1,007 / 1,000** |
| 539 Stufen | 535 | 536 | 0,91 / 0,91 | **1,007 / 1,006** |

Der Detektor hatte die ganze Zeit recht. Falsch war die Abschnittsgrenze.
Deshalb steht `stairsPerFootfall` jetzt auf allen langen Treppenabschnitten
auf 1,0 als **gemessener** Wert statt als Annahme.

## Warum die frühere Korrektur scheiterte

Ein früherer Versuch, 663 auf 613 zu setzen, verschlechterte den Juli-Test von
23 auf 59 Stufen und wurde zu Recht verworfen. Er hatte die Zahl im
*Kalibriergang-Eingang* geändert, wodurch sich die Verschiebung über die
gesamte Kette der Folgeabschnitte fortpflanzte. v4 nimmt die Stufenwerte
stattdessen direkt aus fotografierten Marken und die Zonenlage aus
fotografierten Grenzen — nichts pflanzt sich fort.

## Verifikation

| | Modell v3 | **Modell v4** |
|---|---|---|
| Referenzlauf 08.09., 12 Marken (Grundlage) | MAE 7,4 / max 27,7 | **0,6 / 1,3** |
| **Lauf 14.07., 12 Marken (unabhängig)** | MAE 7,9 / max 22,6 | **4,2 / 12,5** |
| Stufen auf gemessenen stufenlosen Wegen | 41,2 | **4,0** |

Die mittlere Zeile ist die entscheidende: Dieser Lauf war am Modell nicht
beteiligt. Der Fehler halbiert sich, und der grobe Ausreißer von +23 Stufen an
der Marke 600 — genau dort, wo die falsche Grenze saß — verschwindet.

Der Referenzlauf selbst wird unverändert als **gültig, Score 100** gewertet,
alle zwölf Prüfungen bestanden, 100 % der Punkte im Treppenkorridor.

## Was am Aufbau anders ist

- **Höhe barometrisch** statt aus GPS. Das Modellprofil steigt über 232,7 m
  streng monoton — kein einziger Meter Rauschen. Die GPS-Höhe desselben Laufs
  sammelt ohne Schwelle 74 m Phantom-Anstieg an.
- **Zonengrenzen und Marken bekommen eigene Stützpunkte.** Ohne das fiel eine
  sechs Meter kurze stufenlose Zone zwischen zwei Stützpunkte und wurde linear
  weginterpoliert — der Zähler lief dort weiter. Das allein brachte die
  vergebenen Stufen auf den Wegen von 40 auf 4.
- **Douglas-Peucker mit 1,0 m** statt 3,0 m. Bei 3 m blieben nur 11 Stützpunkte
  übrig und der Fehler stieg auf das Niveau von v3 zurück.
- **Ganze Stufen** an den Stützpunkten. Das Modell trifft auf rund vier Stufen
  genau; Zehntel wären vorgetäuschte Präzision.

## Offen

Die Restfehler im Juli-Lauf liegen bei −12 (Marke 800) und +12 (Marke 1100).
Das ist GPS-Versatz zwischen zwei Begehungen an verschiedenen Tagen: die
Zonengrenzen beider Läufe liegen 3 bis 5 m auseinander, was bei 2,5 Stufen pro
Meter gut 12 Stufen entspricht. Ohne einen dritten vermessenen Lauf ist das
nicht weiter zu trennen.
