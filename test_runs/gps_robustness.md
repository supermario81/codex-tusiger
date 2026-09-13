# GPS-/Positionslogik — Befund und Regeln (Schritt 6)

## Was die Daten sagen

Kein einziger der vier Läufe hatte einen Punkt neben der Route.

| Lauf | off-route | Sprünge | Korridor | Konfidenz | Höhen-Drift | Status vorher |
|---|---|---|---|---|---|---|
| iPhone 08.09. | 0 / 1056 | 0 | 100 % | 100 % | +9,0 m | valid |
| Juli 14.07. | 0 / 1073 | 0 | 100 % | 100 % | +9,4 m | valid |
| Android 08.09. R2 | **0 / 1880** | 0 | 100 % | 98 % | **−65,4 m** | **invalid** |
| Android 08.09. R1 | 0 | 0 | — | — | **−26,5 m** | invalid (Dauer) |

„Von der Strecke abgekommen" ist im Datenmaterial nie aufgetreten. Es gibt
keine Problemzonen, für die eine größere Toleranz zu setzen wäre — sie wäre
ohne Beleg gesetzt und wird deshalb nicht gesetzt.

Der Android-Fehlerfall ist etwas anderes: Das Gerät lag die ganze Zeit **auf**
der Treppe, nur bis zu 39 m **hinter** dem Läufer, und behauptete dabei ±3 m.
Korridor-Toleranzen können hier nichts richten. Nichts an der Position selbst
verrät den Fehler — die Höhe tut es.

## Regel 1: Höhen-Drift als Vertrauenssignal

`altitudeDriftM` = Median der Abweichung Gerät-minus-Routenprofil über die
letzten 30 gewerteten Punkte, minus derselbe Median über die ersten 30.

Ein GPS mit konstantem Versatz (Ellipsoid, Bias) bleibt nahe 0 — beide
iPhone-Läufe: +9 m. Ein Gerät, dessen Höhe hinterherhinkt, driftet um
Dutzende Meter — beide Android-Läufe: −26 und −65 m.

Schwelle: **|Drift| > 20 m** → die Geräte-Höhe gilt als nicht verlässlich,
unabhängig davon, welche Genauigkeit das Gerät meldet. Dann greift der
bereits vorhandene Fallback auf das Routen-Höhenprofil; der bisher einzige
Auslöser dafür war die *vom Gerät gemeldete* Höhengenauigkeit — und die war
gelogen.

Wirkung: Die Höhenprüfung kann bei driftendem Instrument kein `fail` mehr
erzeugen, nur `review`. Der Routenfortschritt entscheidet — und der ist über
den Korridor unabhängig geprüft.

**Android R2 vorher:** invalid, Score 41, `elevation fail (138 m)`.
**Nachher:** needs_review, Score 64 — 1038 von 1150, 38 m vom Ziel, 100 % im
Korridor, Höhe driftet um −65 m. Ein Fall für einen Menschen, kein Fall für
„ungültig". **Gültig wird er per GPS nicht** — und darf es nicht: Aus den
Positionsdaten allein ist der Abschluss nicht belegbar.

## Regel 2: kurze Ausschläge sind keine Sprünge

Bisher galt ein Einzelversatz über 100 m unbedingt als physischer Sprung.
Drei Artefakt-Punkte, die 200 m zur Seite springen und zurückkommen, kippten
einen makellosen Lauf (1150 Stufen, 3 m vom Ziel) in die Prüfung.

Neu: Ein Ereignis mit **höchstens drei Samples**, das **binnen fünf Sekunden**
wieder am Ausgangsort ist (Netto-Versatz unter der Rauschgrenze von 30 m), ist
ein Ausschlag — egal wie groß. 200 m hin und zurück in zwei Sekunden legt kein
Mensch zurück.

Bewusst eng gehalten, damit die zwei Schutzmauern der vorigen Runde stehen
bleiben:
- Die Rauschgrenze ist der feste Wert 30 m, **nicht** das gemeldete
  Genauigkeitsbudget — ein Gerät, das ±400 m behauptet, bekommt keinen Freibrief.
- Vier Samples oder mehr als fünf Sekunden unterwegs bleiben physisch, auch
  bei Rückkehr. Der 10-s-Teleport-Test besteht weiter.

## Regel 3: Wake Lock während des Laufs (iOS)

Die einzige Aufzeichnungslücke des iPhone-Referenzlaufs: 14 s, exakt beim
Losgehen. Geschwindigkeit springt von 0,03 auf 0,3 m/s, ein Kompasskurs
erscheint — Handy in die Tasche, Bildschirm aus, Safari pausiert
`watchPosition`. Danach war der Läufer schon auf Stufe 4.

Die RunPage fordert jetzt einen Screen Wake Lock an, gibt ihn beim Verlassen
frei und fordert ihn nach Sichtbarkeitswechsel neu an. Ohne Unterstützung
passiert nichts. Android liefert 1,57 Fixes/s ohne Lücken — der Lock schadet
dort nicht und kostet nur Akku für die Dauer des Laufs.

## Plattformbefund

| | iPhone Safari | Huawei Chrome |
|---|---|---|
| Fixrate | 1,0 /s | 1,57 /s (fused provider) |
| Lücken | 14 s beim Einstecken | keine |
| Position | Strava-identisch (0,1 m) | bis 39 m hinterher |
| Gemeldete Genauigkeit | ehrlich (±2–7 m) | **gelogen** (±3 m bei 11,5 m real) |
| Höhe | GPS, +9 m Drift | driftet −26 bis −65 m |
| Beschleunigung | nur mit Freigabe | frei verfügbar |

## Was GPS allein nicht kann — und was da wäre

Das Android hat parallel den Beschleunigungssensor aufgezeichnet: **1287
Tritte** bei gleichmäßiger Kadenz von 60–70 pro Minute, bis in die letzte
Minute (1229 → 1287). Komplett wären ~1230–1290 zu erwarten, bei Abbruch auf
1038 etwa 1100. Der Sensor widerspricht dem GPS eindeutig und würde den Lauf
belegen.

Das ist die Fusion, die als Schattenbetrieb existiert — hinter dem
Entwickler-Schalter. Sie zur Wertung heranzuziehen ist eine
Produktentscheidung, kein Bugfix: Sie müsste für alle Nutzer laufen (iOS:
Freigabe-Dialog aus einer Geste), und ihr Zählwert bräuchte einen eigenen
Schutz gegen Manipulation. Nicht in diesem Schritt.

Nebenbefund: In der Sensor-CSV ist die Spalte `computed_steps` fast überall
leer — die Schattenfusion bekam die GPS-Stufen nicht durchgereicht und
rechnete mit Faktor 1,0. `fused_steps` = `detected_steps` = 1287 ist deshalb
kein Fusionsergebnis. Zu beheben, bevor die Fusion je wertet.
