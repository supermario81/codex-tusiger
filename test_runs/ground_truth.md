# Ground Truth aus den Testläufen vom 2026-09-08

Datei: `test_runs/ground_truth_points.csv` (46 Messpunkte)

## Methodik

Die Screenshots tragen ihren Aufnahmezeitpunkt als Dateizeit (Ortszeit CEST).
Zusammen mit dem Startzeitpunkt aus dem JSON ergibt das für jeden Screenshot die
verstrichene Laufzeit — und darüber den GPS-Punkt aus derselben Sekunde. Damit
brauchte kein einziges Bild ausgewertet zu werden, und die Zuordnung ist auf
etwa eine Sekunde genau.

Gegenprobe: `iphone-100.PNG` liegt 97 s nach Laufstart, `iphone-1150.PNG` bei
1058 s — der Lauf dauerte 1068 s. Die Zeitachse stimmt.

Restunsicherheit: Zwischen dem Erreichen einer Marke und dem Auslösen des
Screenshots liegt eine Reaktionszeit von schätzungsweise ein bis drei Sekunden.
Bei etwa einer Stufe pro Sekunde entspricht das ein bis drei Stufen.

## Ergebnis iPhone Runde 1 (Referenz)

Alle zwölf 100er-Marken erfasst, GPS durchgehend ±3 bis 4 m. Die Position bei
Marke 1150 liegt **2 m** vom Zielreferenzpunkt der Challenge entfernt, die Höhe
bei 663,8 m — beides deckt sich mit dem bekannten Sollwert. Dieser Lauf ist als
Referenz uneingeschränkt brauchbar.

## Ergebnis Android Runde 2 (Fehlerfall)

Ebenfalls alle zwölf Marken, gemeldete Genauigkeit durchgehend ±3 m. Trotzdem
weicht die Position von der iPhone-Referenz systematisch ab, und der Fehler
**wächst monoton**:

| Stufe | Abstand zum iPhone | Rückstand in Stufen | Höhendifferenz |
|---|---|---|---|
| 100 | 8,7 m | 0 | +28,2 m |
| 400 | 5,1 m | −6 | +29,1 m |
| 700 | 12,6 m | −28 | +10,3 m |
| 900 | 31,4 m | −79 | −9,7 m |
| 1100 | 35,2 m | −98 | −31,1 m |
| **1150** | **39,2 m** | **−117** | **−40,9 m** |

Bei Marke 1150 entspricht die Android-Position der Stufe **1033** auf der
iPhone-Referenzkurve — exakt der Wert, den die App als `estimatedSteps` gemeldet
hat. **Die App rechnet korrekt.** Sie bekommt vom Gerät eine Position geliefert,
die der Wirklichkeit um bis zu 39 m hinterherhinkt.

Dasselbe gilt für die Höhe: Sie startet 28 m zu hoch und endet 41 m zu tief. Der
Gewinn schrumpft dadurch von echten 236 m auf gemeldete 138 m — und fällt unter
die Gültigkeitsschwelle von 205 m.

**Kernpunkt für die Fixes:** Android meldete während des gesamten Laufs ±3 m
Genauigkeit. Dieser Wert ist unbrauchbar — er war um mehr als das Zehnfache zu
optimistisch. Jede Logik, die der gemeldeten Genauigkeit vertraut, läuft auf
Android ins Leere.

## Treppenlose Abschnitte

Aus den Start/Stop-Screenshot-Paaren, umgerechnet über die 100er-Marken:

| # | iPhone (5 erfasst) | Android (6 erfasst) | Modell v3 |
|---|---|---|---|
| 1 | 239 → 252 | 238 → 245 | 245 |
| 2 | — (vergessen) | 261 → 267 | 264 |
| 3 | 338 → 364 | 341 → 363 | 361 |
| 4 | 371 → 381 | 369 → 378 | 368 |
| 5 | 462 → 470 | 464 → 469 | 468 |
| 6 | 615 → 629 | 584 → 594 | **663** |

Fünf von sechs Zonen bestätigen das Modell auf wenige Stufen genau. Die iPhone-
Lücke ist die vom Nutzer erwähnte, in Runde 1 vergessene Aufnahme — Android hat
sie erfasst.

## Offener Widerspruch bei der letzten Zone

Die sechste treppenlose Zone liegt nach den heutigen Messungen bei Stufenstand
**584–629**, das Modell setzt sie bei **663**. Beide Geräte liegen unter dem
Modellwert, streuen untereinander aber um 30 Stufen (Interpolationsfehler
zwischen zwei 100er-Marken).

Damit sprechen jetzt **drei unabhängige Messungen** dafür, dass diese Grenze im
Modell zu hoch liegt:

1. Die Beschleunigungszählung des Kalibriergangs (beide Geräte) legte ~613 nahe.
2. Die Stufendichte an dieser Grenze war physikalisch unmöglich (63 Stufen auf
   8,9 m bei 4,1 m Höhengewinn).
3. Die heutigen Screenshot-Zeiten beider Geräte ergeben 584–629.

Dagegen steht eine Messung: Ein Test gegen den Lauf vom 2026-07-14 wurde
schlechter, als ich die Grenze auf 613 korrigierte (Fehler 23 → 59 Stufen).

Das ist in Schritt 4 zu klären. Vorschlag: die Grenze nicht raten, sondern aus
der iPhone-Referenz von heute neu bestimmen — sie ist die einzige Quelle mit
gleichzeitig gültigem Lauf, vollständigen Marken und sauberem GPS.

## Verwendbarkeit

| Quelle | Positionen | Höhe | Stufenzuordnung |
|---|---|---|---|
| iPhone Runde 1 | **ja** | ja (663,8 m im Ziel) | **ja** |
| Android Runde 2 | nein (bis 39 m Rückstand) | nein (Gewinn 138 statt 236 m) | nur die Zeitpunkte |
| Strava-GPX | grob | **ja, barometrisch** | nein |

Von Android sind also nur die **Zeitpunkte** der Screenshots brauchbar, nicht
die zugehörigen Positionen. Für die sechste treppenlose Zone heißt das: Der
Zeitpunkt stimmt, die Position nicht.
