# Taugt Strava als Referenz? — Auswertung 2026-09-08

Datenlage: Strava lief bei **beiden** Runden auf dem iPhone, 1 Hz, als GPX und TCX.
In Runde 1 parallel zu Tusiger **auf demselben iPhone**, in Runde 2 parallel zu
Tusiger **auf dem Android**. Damit lassen sich Position und Höhe getrennt prüfen.

| Datei | Runde | Punkte | Dauer | Höhe Start→Ende | Gewinn |
|---|---|---|---|---|---|
| `iphone-strava-02-…gpx` | 1 | 1089 | 1095 s | 429,8 → 664,9 m | 235,1 m |
| `iphone-strava-01-…gpx` | 2 | 1283 | 1286 s | 429,7 → 666,2 m | 236,5 m |

Zwei unabhängige Läufe, 1,4 m Unterschied im Gewinn — 0,6 %. Die Wiederholbarkeit
ist ausgezeichnet.

## Position: Strava bringt nichts

Runde 1, beide Aufzeichnungen auf demselben iPhone, sekundengenau verglichen:

| | Wert |
|---|---|
| Median-Abstand | **0,1 m** |
| Mittel | 0,3 m |
| p90 | 1,0 m |
| Maximum | 2,5 m |

Die Spuren sind **identisch**. Strava liest dieselbe CoreLocation-Position wie die
PWA und glättet sie nicht. Es gibt keine bessere Position zu holen — was das
Gerät liefert, hat die App bereits.

Einzige Abweichung: Strava meldet als Streckenlänge 534,79 m, die simple Summe
aller Punktabstände ergibt 721,8 m. Strava filtert die Distanz also kräftig.
Für Tusiger irrelevant, weil die App auf die Route projiziert statt zu summieren —
aber ein Beleg, dass rohes Aufsummieren die Länge um gut ein Drittel überschätzt.

## Höhe: Strava ist deutlich besser — und zwar barometrisch

| Schwelle für den Aufstieg | 0 m | 0,5 m | 1 m | 2 m |
|---|---|---|---|---|
| **Strava R1** | 235,1 | 235,0 | 234,3 | 234,1 |
| **Tusiger iPhone R1** | **309,6** | 271,5 | 254,2 | 242,3 |

Das ist der ganze Unterschied in einer Zeile: Bei Strava ist der Gewinn über alle
Schwellen hinweg **derselbe** — das Signal ist praktisch rauschfrei, wie es nur
ein Barometer sein kann. Die GPS-Höhe der PWA sammelt ohne Schwelle 74 m
Phantom-Anstieg an und braucht 2 m Schwelle, um brauchbar zu werden.

Gegen die barometrische Referenz driftet die GPS-Höhe langsam: −6,7 m am Start,
+2,5 m im Ziel, also gut 9 m über den Lauf. Die absoluten Werte stimmen dagegen
gut — Strava endet bei 664,9 m, die GPS-Höhe bei 663,8 m, das Modell nennt 665,6 m.

## Der Gegentest in Runde 2

Android-Tusiger gegen Strava-iPhone, gleicher Körper, gleiche Sekunde, 1880 Punkte:

| | Wert |
|---|---|
| Median-Abstand | **11,5 m** |
| p90 | 28,6 m |
| Maximum | 42,3 m |
| Höhenfehler Start → Ende | **+54,9 m → −36,2 m** |

**In 90 % aller Punkte war der echte Positionsfehler größer als die vom Gerät
gemeldete Genauigkeit.** Android meldete durchgehend Median ±3 m, maximal ±5 m,
während es real um 11,5 m danebenlag. Die Höhe driftet über den Lauf um 91 m
durch — das erklärt den auf 138 m eingebrochenen Gewinn vollständig.

Damit ist unabhängig bestätigt, was Schritt 2 aus den Screenshots ableitete: Die
App rechnet richtig, das Gerät liefert falsche Daten und behauptet dabei, genau
zu sein.

## Was das für die App heißt

**Strava lässt sich nicht einbauen.** Der Vorteil kommt allein vom Barometer, und
darauf hat keine mobile Web-App Zugriff — weder Safari noch Chrome geben
`CMAltimeter` oder ein Äquivalent her. Eine Strava-Anbindung über die API würde
Daten erst nach dem Lauf liefern, das hilft der Live-Wertung nicht.

**Strava ist als Referenz Gold wert.** Wir haben jetzt ein rauschfreies
Höhenprofil über die exakte Strecke, sekundengenau ausgerichtet auf den gültigen
iPhone-Referenzlauf. Das ist die Grundlage für das Routenmodell in Schritt 4.

## Nebenbefund: die Höhe kann keine Treppen erkennen

Die fünf treppenlosen Abschnitte aus Schritt 2, mit barometrischer Höhe gemessen:

| Zone | Dauer | Höhengewinn | Horizontal | Steigung |
|---|---|---|---|---|
| 1 | 13 s | +1,9 m | 6,1 m | **31 %** |
| 2 | 35 s | +5,6 m | 27,3 m | 21 % |
| 3 | 14 s | +2,6 m | 11,7 m | 22 % |
| 4 | 8 s | +2,5 m | 6,6 m | **38 %** |
| 5 | 12 s | +1,9 m | 8,1 m | 24 % |

Die stufenlosen Wege steigen mit 21 bis 38 %. Über die gesamte Strecke gibt es
kein einziges wirklich flaches Fenster außer der Zielplattform ganz oben.

Das bestätigt mit harten Messwerten, was der Nutzer gesagt hatte, und schließt
den barometrischen Ansatz endgültig: **Steilheit und Treppe sind unabhängig
voneinander.** Nur das vermessene Routenmodell weiß, wo Stufen liegen.

## Höhenreferenz je Stufenmarke

Barometrisch, aus Strava R1, ausgerichtet auf die Screenshot-Zeiten des
iPhone-Referenzlaufs. Abgelegt als `test_runs/altitude_reference.csv`.

| Stufe | Baro-Höhe | Zuwachs | m je 100 Stufen |
|---|---|---|---|
| 100 | 449,0 m | — | — |
| 200 | 470,5 m | +21,5 | 21,5 |
| 300 | 490,1 m | +19,6 | 19,6 |
| 400 | 516,6 m | +26,5 | **26,5** |
| 500 | 540,6 m | +24,0 | 24,0 |
| 600 | 557,1 m | +16,5 | 16,5 |
| 700 | 574,3 m | +17,2 | 17,2 |
| 800 | 588,1 m | +13,8 | **13,8** |
| 900 | 606,7 m | +18,6 | 18,6 |
| 1000 | 629,1 m | +22,4 | 22,4 |
| 1100 | 651,2 m | +22,1 | 22,1 |
| 1150 | 661,3 m | +10,1 | 20,2 |

Die Spanne von 13,8 bis 26,5 m je 100 Stufen ist kein Messfehler. Sie hat zwei
Ursachen, die sich überlagern: unterschiedlich hohe Stufen (14 bis 27 cm Auftritt
sind für eine gewachsene Waldtreppe normal) und die steilen stufenlosen Wege, die
Höhe beisteuern, ohne Stufen zu liefern. Der Abschnitt 300→400 enthält gleich
zwei solche Zonen — deshalb ist er mit 26,5 m der höchste, obwohl dort weniger
Stufen liegen.

Für Schritt 4 ist das die eigentliche Nachricht: **Höhe und Stufenzahl sind über
die Strecke nicht proportional.** Ein Modell, das Stufen linear über Höhe oder
Distanz verteilt, muss abschnittsweise falsch liegen.
