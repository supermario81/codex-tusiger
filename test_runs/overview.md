# Testläufe 2026-09-08 — Datenübersicht

Rohdaten gesichert unter `~/.tusiger-data/testrun-08-09/`.

## Zuordnung der Läufe (wichtig: Strava-Nummerierung ist invertiert)

Die Startzeiten verraten, was zusammengehört — die Dateinamen führen in die Irre:

| Runde | Zeit | Tusiger-App | Strava parallel |
|---|---|---|---|
| **Runde 1** | 08:48:46 | **iPhone** `iphone-tusiger-run-01.json` | `iphone-strava-**02**-…` (08:49:10) |
| **Runde 2** | 09:33:20 | **Android** `…-b7d9ee4f-….json` | `iphone-strava-**01**-…` (09:33:19) |

Strava lief also beide Male auf dem iPhone. In Runde 2 zeichnete das iPhone nur Strava
auf, das Android nur Tusiger — beide Geräte am selben Körper, dieselbe Treppe,
dieselbe Sekunde. Das macht Runde 2 zum Vergleichspaar.

## Tusiger-Exporte

| Datei | Start | Dauer | Status | Stufen | Höhe | GPS Ø | Bewertung |
|---|---|---|---|---|---|---|---|
| `iphone-tusiger-run-01.json` | 08.09. 08:48 | 1068 s | **valid**, Score 100 | **1150** | 241 m | ±4 m | **Referenz** |
| `android-…b7d9ee4f….json` | 08.09. 09:33 | 1197 s | invalid, Score 18 | 1033 | **138 m** | ±3 m | Fehlerfall |
| `android-…f1498aed….json` | 03.09. 21:26 | **387594 s** | invalid, Score 65 | 1150 | 219 m | ±3 m | unbrauchbar |

Der dritte Export ist Android Runde 1: Die Dauer von 4,5 Tagen bestätigt die kaputte
Zeitanzeige — der Lauf wurde aus dem Zwischenspeicher eines alten Laufs vom 03.09.
fortgesetzt statt neu gestartet. Nur die Zeitprüfung schlägt fehl, alles andere passt.

### Warum Android Runde 2 als ungültig gewertet wurde

Drei Prüfungen greifen, zwei davon hart:

- **Höhenmeter 138 m** statt 205–265 → `fail`
- **Routenfortschritt 1033 von 1150** → `fail`
- Zielzone 38 m statt 35 m → `review`

Die GPS-Genauigkeit war mit ±3 m ausgezeichnet. Das Problem ist **nicht** die
Positionsgenauigkeit, sondern die **Höhe**: Strava maß im selben Moment auf dem
iPhone barometrisch **236,5 m** Anstieg. Android meldete 138 m.

## Strava-Exporte (nur iPhone, GPX und TCX inhaltsgleich)

| Datei | Start | Punkte | Dauer | Höhengewinn |
|---|---|---|---|---|
| `iphone-strava-02-…` (= Runde 1) | 08:49:10 | 1089 | 1095 s | **235,1 m** |
| `iphone-strava-01-…` (= Runde 2) | 09:33:19 | 1283 | 1286 s | **236,5 m** |

Beide barometrisch und untereinander konsistent (235,1 / 236,5 m), passend zum
bekannten Sollwert von ~235 m. Für Android existiert **kein** GPX/TCX, nur drei
Screenshots.

## Sensordaten

`android-tusiger-sensors-b7d9ee4f….csv` — 13507 Zeilen, enthält bereits die neuen
Spalten `detected_steps` und `fused_steps`. Endstand: **1287 erkannte Tritte**.
Für den iPhone-Lauf liegt **keine** Sensor-CSV vor.

Die Label-CSV ist leer (nur Kopfzeile plus Rahmenzeile), also ohne Nutzen.

## Screenshots

| Ordner | 100er-Marken | treppenlose Abschnitte | Sonstiges |
|---|---|---|---|
| Android | 25 (Runde 1 und 2, je 100–1150) | 22 | Laufbericht, Sensorvergleich, 3× Strava |
| iPhone | 12 (100–1150) | 10 | 2× Strava |

Alle 100er-Marken von 100 bis 1150 sind auf beiden Geräten vorhanden, die
treppenlosen Abschnitte mit Start- und Stop-Paaren.

## Auffälligkeiten

1. **Dateinamen im Android-Ordner sind irreführend.** Die 22 Dateien
   `iphone-no-stairs-*.jpg` liegen im Android-Ordner und sind `.jpg` — Android
   speichert `.jpg`, iPhone `.PNG`. Es sind also **Android**-Screenshots mit
   falschem Präfix. Für Schritt 2 zählt die Endung, nicht der Name.
2. **Doppelte Downloads**: `… (1).json` und `… (1).csv` sind byte-gleiche Kopien.
3. **Keine Sensor-CSV vom iPhone** — der Logger war dort offenbar nicht aktiv.
   Für Runde 1 gibt es damit keine Trittdaten.
4. **Kein Strava für Android** — nur Screenshots, kein GPX.

## Empfehlung: Primary Reference

- **Streckenmodell und Ground Truth: iPhone Runde 1.** Einziger Lauf mit
  Status `valid`, Score 100, exakt 1150 Stufen, 241 m Höhe, ±4 m — plus
  vollständige 100er-Screenshots und ein paralleles Strava-GPX.
- **Höhenreferenz: die beiden Strava-GPX.** Barometrisch, untereinander auf
  1,4 m konsistent. Das ist die einzige verlässliche Höhenquelle im Datensatz.
- **Fehleranalyse: Android Runde 2.** Zeitgleich mit Strava-01 aufgezeichnet,
  dadurch direkt vergleichbar. Zeigt den Bug in Reinform.
- **Nicht verwenden: Android Runde 1** (`f1498aed`, kaputte Zeitbasis) — außer
  als Beleg für den Zwischenspeicher-Fehler.
