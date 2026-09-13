# Test-Checkliste Tusiger — iPhone und Android

Stand: Routenmodell v4, Anzeige-Kadenz, Höhen-Drift, Wake Lock (nach Schritt 6).
Jeder Punkt hier hat einen Zwilling in `src/lib/validation/acceptance.test.ts`
mit denselben Erwartungswerten (A1, B1, …).

## Vor dem Lauf

| | Erledigt |
|---|---|
| App-URL: `https://supermario81.github.io/codex-tusiger/` | ☐ |
| Auf dem Startscreen steht die erwartete Version (v0.10.x · Build #… · Commit) — sonst Tab schließen, neu laden, ggf. PWA neu installieren | ☐ |
| Einstellungen → Entwickler-Werkzeuge → **Sensordaten aufzeichnen** an (iPhone fragt nach Bewegungsfreigabe → erlauben) | ☐ |
| Zweites Handy mit Strava als Referenz — Strava **auf dem iPhone** starten (Barometer), Tusiger auf dem zu testenden Gerät | ☐ |
| Beide Geräte gleichzeitig am Körper, Start innerhalb weniger Sekunden | ☐ |
| Uhrzeit beider Handys automatisch (die Screenshot-Zeit ist die Zeitachse) | ☐ |

## A — Start (Stufe 0)

| # | Prüfung | Erwartet | iPhone | Android |
|---|---|---|---|---|
| A1 | Am Fuß der Treppe stehen, Lauf starten, 15 s stehen bleiben | Anzeige bleibt **0** | ☐ | ☐ |
| A2 | Losgehen, auf die Anzeige schauen | Erste Zahl ist **1**, dann 2, 3, … — kein Sprung auf 4 oder 9 | ☐ | ☐ |
| A3 | Bildschirm bleibt während des ganzen Laufs an (Wake Lock) | Kein Ausschalten, auch ohne Berührung | ☐ | ☐ |

Hinweis zu A2: Nach einer Aufzeichnungslücke (Handy war in der Tasche, Tab
war unsichtbar) darf die Anzeige nach der 1 aufholen — dann kurz 1, dann
schnell hoch bis zum Messwert. Das ist korrekt. Falsch wäre eine erste Zahl
ungleich 1.

## B — 100er-Marken

An jeder 100er-Markierung der Treppe (100, 200, …, 1100, 1150) **einen
Screenshot** machen, sobald der Fuß auf der markierten Stufe steht.

| Marke | Erwartet | iPhone gezeigt | Android gezeigt |
|---|---|---|---|
| 100 | 97–103 | | |
| 200 | 197–203 | | |
| 300 | 297–303 | | |
| 400 | 397–403 | | |
| 500 | 497–503 | | |
| 600 | 597–603 | | |
| 700 | 697–703 | | |
| 800 | 797–803 | | |
| 900 | 897–903 | | |
| 1000 | 997–1003 | | |
| 1100 | 1097–1103 | | |
| 1150 | **1150** | | |

Toleranz ±3 entspricht dem, was der Referenzlauf vom 08.09. erreichte (B1).
Ein einzelner Ausreißer bis ±12 ist GPS-Versatz des Tages und kein Fehler
im Modell; ein systematischer Rückstand, der von Marke zu Marke wächst, ist
das Android-Muster (siehe F).

## C — Stufenlose Abschnitte

Beim Betreten und beim Verlassen jedes stufenlosen Wegs je einen Screenshot.
Sechs Wege, in dieser Reihenfolge:

| Weg | Anzeige beim Betreten (≈) | Erwartet beim Verlassen | iPhone | Android |
|---|---|---|---|---|
| 1 | 240 | 240–242 | ☐ | ☐ |
| 2 | 265 | 265–267 | ☐ | ☐ |
| 3 | 362 (der lange, 27 m) | 362–364 | ☐ | ☐ |
| 4 | 371 | 371–373 | ☐ | ☐ |
| 5 | 468 | 468–470 | ☐ | ☐ |
| 6 | 611 | 611–613 | ☐ | ☐ |

Weg 2 ist kurz und liegt dicht hinter Weg 1 — beim Lauf am 08.09. wurde er auf
dem iPhone übersehen. Weg 6 lag im alten Modell bei 663; wer dort noch 663
sieht, hat eine alte Version.

## D — Ziel und Wertung

| # | Prüfung | Erwartet | iPhone | Android |
|---|---|---|---|---|
| D1 | Oben auf der Plattform stehen bleiben, 10 s warten | Anzeige **1150**, bleibt stehen | ☐ | ☐ |
| D2 | Lauf beenden, Laufbericht öffnen | **Validiert**, Score 100, Stufen 1150 | ☐ | ☐ |
| D3 | Prüfungsdetails aufklappen | Alle Zeilen „erfüllt" | ☐ | ☐ |
| D4 | Höhenmeter im Bericht | 230–245 m | ☐ | ☐ |

## E — Keine falschen Streckenmeldungen

| # | Prüfung | Erwartet | iPhone | Android |
|---|---|---|---|---|
| E1 | Während des Laufs die GPS-Anzeige beobachten | „GPS OK" oder „GPS geschätzt", nie dauerhaft „GPS ungenau" | ☐ | ☐ |
| E2 | Prüfungsdetails: Treppenkorridor | ≥ 95 % der Punkte im Korridor | ☐ | ☐ |
| E3 | Prüfungsdetails: GPS-Sprünge | „keine unrealistischen GPS-Sprünge" | ☐ | ☐ |

## F — Nur Android: hinkt die Position hinterher?

Das Muster vom 08.09.: Position auf der Treppe, aber immer weiter hinter dem
Läufer; gemeldete Genauigkeit ±3 m trotz 11 m realem Fehler; Höhe driftet.

| # | Prüfung | Erwartet | Android |
|---|---|---|---|
| F1 | Anzeige an den Marken (B) gegen die echte Marke | Rückstand wächst **nicht** von Marke zu Marke | ☐ |
| F2 | Falls doch: Laufbericht → Prüfungsdetails → Höhenmeter | Zeile nennt „Geräte-Höhe driftet um … m", Status **Prüfung** (nicht Ungültig) | ☐ |
| F3 | Sensor-Vergleich im Bericht | „Tritte laut Beschleunigung" ≥ 1200 bei komplettem Lauf | ☐ |

F2 ist der Beleg für Schritt 6: Ein driftendes Gerät darf nicht mehr auf
„ungültig" fallen. Gültig wird es per GPS allein nicht — das wäre falsch.

## Beweise sichern — nach jedem Lauf

Reihenfolge einhalten, sonst gehen Daten verloren (ist am 08.09. passiert).

1. **Laufbericht → „JSON exportieren"** — die Datei enthält alle Punkte,
   alle Prüfungen und die Tracking-Kennzahlen. Das ist die Hauptquelle.
2. **Laufbericht → „Sensordaten als CSV"** — nur wenn die Aufzeichnung an war.
3. **Screenshots** aus B und C, plus einer vom Laufbericht und einer von den
   Prüfungsdetails.
4. **Strava**: Aktivität → Exportieren → **GPX** (und TCX). Die Höhe darin ist
   barometrisch und die einzige verlässliche Höhenreferenz.
5. Alles in einen Ordner `testrun-<gerät>-<datum>/` und **ohne Umweg über
   WhatsApp** übertragen: AirDrop, Dateien-App, USB. WhatsApp und Mail
   entfernen die Aufnahmezeit der Screenshots — und die ist die Zeitachse,
   über die Screenshot und GPS-Punkt zusammenfinden.
6. Ordner erst kopieren, dann aus Downloads löschen. Beim Kopieren am Mac
   `cp -Rp` verwenden (behält die Zeiten).

Benennung wie am 08.09.: `iphone-100.PNG`, `iphone-no-stairs-start-01.PNG`,
`android-run-02-1150.jpg` — Gerät, Marke bzw. Zone, Nummer.

## Automatisierte Tests

```bash
npm test
```

Läuft in unter zwei Sekunden, 130 Tests. Die Abnahme-Datei ist
`src/lib/validation/acceptance.test.ts`; sie spiegelt diese Checkliste.
Dahinter stehen:

| Datei | Prüft |
|---|---|
| `geo/routeModel.test.ts` | Modell v4 gegen Referenzlauf und unabhängigen Juli-Lauf |
| `geo/stepOffset.test.ts` | Start 0, Zonen stehen, Ende 1150, keine Schätzung auf Wegen |
| `features/run/displayedSteps.test.ts` | Anzeige beginnt bei 1, lässt keine Zahl aus |
| `validation/deviceLag.test.ts` | Android-Drift → Prüfung statt ungültig; Blips kippen keinen Lauf |
| `geo/jumpClassification.test.ts` | Sprungregel samt Schutz gegen ±400-m-Geräte und Teleports |
| `validation/fixtureReplay.test.ts` | Juli-Lauf bleibt gültig, Score 100 |
| `fusion/stepDetectorRealData.test.ts` | Beschleunigungszählung gegen die korrigierten Abschnitte |

Die Fixtures unter `test/fixtures/` sind aus den Ground-Truth-CSVs in
`test_runs/` abgeleitet: `reference-run-2026-09-08.json` (iPhone, Marken,
Zonen), `android-lag-2026-09-08.json` (der Fehlerfall). Ein neuer Testlauf
wird zur Fixture, indem der JSON-Export plus die Screenshot-Zeiten nach
demselben Schema abgelegt werden — siehe `test_runs/ground_truth.md` für die
Herleitung der Zeiten.

## Was ein Fehlschlag bedeutet

| Beobachtung | Wahrscheinliche Ursache | Wo nachsehen |
|---|---|---|
| Erste Zahl ist 4 oder 9 statt 1 | Alte Version ohne Anzeige-Kadenz | Versionszeile auf dem Startscreen |
| Zone 6 bei 663 | Altes Routenmodell v3 | dito |
| Zähler läuft in einer Zone weiter | GPS-Versatz des Tages > 4 m an der Zonengrenze | JSON-Export: `distanceToRouteM` der Punkte dort |
| Rückstand wächst von Marke zu Marke | Gerät liefert verzögerte Position (Android-Muster) | JSON: `altitudeDriftM` im Tracking; Strava-Vergleich |
| Bildschirm geht aus | Wake Lock nicht unterstützt oder verweigert | iOS < 16.4? Energiesparmodus? |
| Bericht „Ungültig" trotz komplettem Lauf | Prüfungsdetails zeigen, welche Regel — die ist der Fehler | JSON: `validationChecks` |
