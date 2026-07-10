# Audit: Warum jeder echte Lauf als UNGÜLTIG endete (2026-07-10)

## Feldtest-Evidenz

Realer Lauf am 1000er-Stägli, alle 1150 Stufen physisch absolviert, Screenshots alle 100 Stufen:

- GPS-Punkte zählen exakt 1/Sekunde hoch und frieren bei **exakt 300** ein.
- Höhenmeter-Anzeige plateaut nach dem Einfrieren bei ~61–74 m (echter Anstieg: ~234 m).
- Lauf nach 16:46 als UNGÜLTIG bewertet; alle Läufe in der Historie ungültig.
- Pre-Run-Check zeigte „Startzone: 64 m entfernt" / „GPS: ±54 m", obwohl eine externe
  GPS-App den Nutzer ~4 m vom Referenzpunkt zeigte (±20 m) → „Trotzdem starten" nötig.
- Stufen/Pace/Timer/Coach funktionierten korrekt (1150/1150 oben erreicht).

## Root Cause (bestätigt)

**`main` → `src/features/run/RunPage.tsx` Zeile 48:**

```ts
(position) => setPoints((current) => [...current, positionToRunPoint(position)].slice(-300)),
```

Ein rollierendes 300-Punkte-Fenster (~die letzten 5 Minuten bei 1 Punkt/Sekunde). Folgen:

1. Am Laufende ist der „erste Punkt" im Puffer ein Punkt aus der Treppenmitte
   → Startzonen-Prüfung schlägt fehl („Startzone nicht erfüllt").
2. Höhengewinn = letzter − erster Punkt des Puffers ≈ Anstieg der letzten 5 Minuten
   ≈ 61–74 m < 180 m (elevation_review_min) → „Höhenprofil nicht plausibel".
3. Beide Fehler zusammen machten **jeden** legitimen Lauf ungültig.
4. Indoor-Kurztest: Start- und Zielkoordinaten identisch, weil Roh-Erst-/Letztpunkt
   eines stehenden Geräts gespeichert wurden.

Die GitHub-Pages-Auslieferung zum Zeitpunkt des Feldtests stammte von `main`.
Der Deploy-Workflow wurde erst mit `bf662b3` auf `feature/next-major-work` umgestellt.

## Stand des Feature-Branches (vorheriger Fix-Versuch)

`feature/next-major-work` (Commits `c6a5e2e`, `b2da26e`) hat bereits:

- Cap entfernt (`fullPoints` wächst unbegrenzt, Restore aus localStorage).
- `stableEdgePoint()` (Mittelwert der ersten/letzten 5 guten Punkte) in der Validierung.
- Routen-Matcher (`routeMatcher.ts`) mit Telemetrie, Korridor-, Kontinuitäts- und
  Höhenkonsistenz-Prüfungen; Validierung läuft über den vollen Datensatz.

## Verbleibende Lücken (werden in diesem Branch behoben)

| # | Bereich | Lücke |
|---|---------|-------|
| 1 | Recording | Persistenz alle 2,5 s (voller Record inkl. Punkte), kein QuotaExceeded-Schutz; Supabase-Punkte-Upload als ein einziger Insert (kein Batching, Duplikate bei Retry) |
| 2 | Stabile Referenzen | Kein einmalig eingefrorener Start-Referenzpunkt; RunRecord speichert rohe `points[0]`/`points.at(-1)` als Koordinaten; Mittelwert statt Median |
| 3 | Höhenmeter | Kein kumulativer gefilterter Anstieg; Live-Anzeige relativ zum rohen ersten Höhenwert statt zur stabilen Startreferenz |
| 4 | Validierung | Gründe ohne Messwerte; keine strukturierte Regel-Liste (Regel → Messwert → bestanden/Prüfung/fehlgeschlagen) für den Bericht |
| 5 | Pre-Run | Einmaliges `getCurrentPosition` mit `maximumAge: 3000` → Wi-Fi-Fix (±54 m) entscheidet; Gate verlangt ±25 m ohne Unsicherheits-Überlappung; „Standort: Olten, Schweiz" ist ein hartkodierter String (falscher Ort); Zeilen ohne ehrliche Kriterien |
| 6 | Finish | `needs_review` bekommt SORRY-Screen + Fail-Sound statt Erfolg mit Amber-Badge; Konfetti nur 2 Pseudo-Elemente à 1,8 s |
| 7 | Persistenz | Punkte-Inserts ohne Batching/Idempotenz (RLS-Policies selbst sind korrekt) |
| 8 | Diagnose | „Prüfungsdetails" nur ein zusammengesetzter String; JSON-Export ohne Konfiguration/strukturierte Checks |

## Referenzdaten (verifiziert gegen Code und Migration 0001)

- Start „Start unten": 47.315206553, 7.886963657, Radius 25 m
- Ziel „Ziel oben": 47.318954559, 7.882850574, Radius 35 m
- Erwarteter Anstieg 235 m (gültig 205–265, Prüfung 180–290)
- GPS gültig ≤ 25 m, Prüfung ≤ 45 m; Dauer 240–7200 s; 1150 Stufen
- Horizontale Distanz Start→Ziel ≈ 519 m (Haversine-Test bestätigt 500–540 m)
- Kalibrierte Wegpunkte in `src/data/challenge.ts` (421 m → 667 m)

## Warum die Tests das nicht fingen

`createSyntheticRunPoints()` erzeugt nur 46 Punkte über 69 Minuten. Kein Test speiste
je eine realistische Aufnahme mit 1 Punkt/Sekunde (≈1000 Punkte) durch den
Aufnahme-Pfad. Der 300er-Cap war damit für die Test-Suite unsichtbar.
