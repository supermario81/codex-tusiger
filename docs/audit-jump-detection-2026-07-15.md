# Audit: Sprung-Erkennung & Routenmodell (2026-07-15)

Grundlage: kompletter realer Lauf vom 2026-07-14 als Fixture
(`test/fixtures/run-2026-07-14.json`, 1073 Punkte, volle Telemetrie).
Der Lauf bestand 11 von 12 Prüfungen — nur `jumps` schlug fehl und machte
den Lauf hart ungültig.

## Fakt 1 — «14 unrealistische GPS-Sprünge» sind EIN Ereignis (verifiziert)

- Alle 14 mit `impossible_route_jump` geflaggten Punkte liegen in einem
  einzigen 13-Sekunden-Fenster (elapsed 122–135 s), lückenlos aufeinander.
- Roh-GPS-Geschwindigkeit in diesem Fenster: 0,14–0,90 m/s (normales Gehen).
  Im gesamten Lauf gibt es **null** `impossible_raw_jump`-Flags.
- Ursache: Der Route-Matcher sprang von segmentIndex 0 direkt auf 2
  (progressSteps 100 → 227 in einem Tick). **Segment 1 matchte im gesamten
  Lauf keinen einzigen Punkt** (Segment-Histogramm: 0→123 Punkte, 1→0, 2→62 …).
  Die 14 Flags entstanden während der filteredSteps-Aufholrampe
  (106→181, ~6 Steps/Tick = maxForward-Limit).
- Die Validierung zählte geflaggte PUNKTE statt EREIGNISSE und behandelte
  eine Matcher-Neuzuordnung als physischen GPS-Sprung → hart invalid.

Fundstellen (vor dem Fix): `src/lib/geo/routeMatcher.ts` (Flag
`impossible_route_jump` bei `match.progressSteps > previousSteps +
maxForward + 45`, Zähler `impossibleJumpCount` pro Punkt) und
`src/lib/validation/validateRun.ts` (Regel `jumps`:
`totalImpossibleJumps >= 3` → invalid, plus `detectImpossibleJumps`
zählt Roh-Punkte statt Ereignisse).

## Fakt 2 — Routenmodell-Polyline an den Flach-Passagen falsch (verifiziert)

- Direkt vor dem Ereignis wuchs `distanceToRouteM` stetig bis 25,5 m,
  während der Läufer den ersten flachen Verbindungsweg ging: die modellierte
  Polyline von Segment 1 folgt nicht dem realen Weg.
- Altmodell-Vertices mit 4 Dezimalen (~8-m-Raster): z. B. steps 200 =
  (47.3154, 7.8862) — real liegt Schritt 200 bei (47.315779, 7.886292),
  **~42 m** daneben. Darum matchte Segment 1 nie.
- 6,4 % aller Punkte (69/1073) lagen > 10 m vom Altmodell entfernt.

## Fakt 3 — Step-Mapping pro Segment falsch (verifiziert)

App-Fehler an den 12 fotografierten 100er-Marken (filteredSteps − real):
+0, +37, −3, −8, +66, +21, −11, −9, +16, +0, +26, +0. Altmodell glaubt
Segmentstart 2 = Schritt 227; real ~130–150.

## Fakt 4 — Fanfare/Konfetti (verifiziert)

Feier-Gating ist korrekt implementiert (valid UND needs_review feiern, nur
hart-invalid bekommt den Sorry-Screen). Sie blieb aus, weil der Lauf durch
Fakt 1 invalid wurde. Nach dem Fix wird dieser Lauftyp valid.

## Neues Routenmodell v2 (aus der echten Aufzeichnung abgeleitet)

- Polyline: Douglas-Peucker (ε = 3 m) über den Roh-Track (±3–6 m Genauigkeit)
  → 17 Vertices, plus die 13 Kalibrier-Anker (alle 100 Stufen, Ground Truth
  vom 2026-07-14) auf die Polyline projiziert → **28 Vertices**, ≥ 6 Dezimalen.
- Step-Mapping: stückweise linear über die kumulative Routendistanz durch
  die 13 Anker (Anker-Projektion max. 2,3 m neben der Polyline, streng
  monoton). Flache Verbindungswege sind damit automatisch kodiert.
- Höhen: geglättete GPS-Höhe des Tracks pro Vertex, Anker exakt auf
  Tabellenwert (425,5 m → 665,6 m, interpretierter Anstieg 240 m).
- Verifikation im Replay (reine Projektion): max. |Step-Fehler| an den 13
  Ankern = **2,9** (vorher bis 66); Punkte > 10 m von der Route: **0,00 %**
  (vorher 6,4 %). Routenlänge 535 m.
- Kennzeichnung: `routeModelVersion = 2` in `src/data/challenge.ts`.

## Fix-Plan (Reihenfolge der Commits)

1. Dieses Audit + Fixture ins Repo.
2. Fix A — Ereignis-Clustering (< 5 s Lücke = ein Ereignis), physische
   Klassifikation über Roh-GPS (> 8 m/s über mehrere Punkte oder Einzel-
   Versatz > 100 m), Matcher-Neuzuordnung als `route_rematch` ohne
   Sprung-Zählung; Schweregrade 1–2 physisch = review, hart invalid nur bei
   ≥ 3 physischen Ereignissen oder Versatz > 300 m; Aggregations-Guard:
   wenn Startzone, Zielzone, Zeit, Höhe, Korridor und GPS-Genauigkeit alle
   bestehen, erzeugen Anomalie-Checks höchstens needs_review.
3. Fix B — Routenmodell v2 einsetzen.
4. Fix C — Konfetti/Fanfare-Testtrigger: 2-s-Longpress auf das Logo im
   Finish- und Einstellungs-Screen.
5. Fix D — Fixture-Replay-Tests, Step-Genauigkeit ±25, Teleport-Regression.
