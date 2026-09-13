# Release 0.10.0 — Vorbereitung

Stand 2026-09-12. Nichts committed, nichts gepusht. Arbeitsbaum: 11 geänderte,
8 neue Dateien; 130 Tests grün; lint, typecheck und Produktions-Build sauber.

## 1. Was sich geändert hat

### Routenmodell v4 — `src/data/challenge.ts`, `scripts/build-route-model-v4.py`

Aus dem gültigen Referenzlauf vom 08.09. gebaut (zwölf fotografierte Marken,
Höhe barometrisch aus Strava). **Eine** echte Korrektur: die vorletzte
Abschnittsgrenze wandert von 663 auf 611. Die Abschnitte 6 und 7 haben 143 und
539 Stufen statt 195 und 487.

Damit löst sich die seit dem Kalibriergang offene Anomalie auf: Der
Beschleunigungssensor hatte auf beiden Geräten 142/143 und 535/536 Tritte
gezählt — er hatte recht, die Grenze war falsch eingetippt. Die Faktoren
Stufen-pro-Tritt stehen jetzt gemessen auf 1,00–1,01 (vorher unerklärte 1,37
und 0,91).

Verifiziert out of sample am Juli-Lauf: mittlerer Fehler 7,9 → 4,2 Stufen,
Maximum 22,6 → 12,5. Stufen auf stufenlosen Wegen: 41 → 4.

### Stufenzähler — `src/features/run/displayedSteps.ts`, `RunPage.tsx`, `routeMatcher.ts`

- Die Anzeige folgt der Messung in menschlicher Kadenz: beginnt bei 1, lässt
  keine Zahl aus, holt nach Lücken binnen einer Sekunde auf. Messung, Wertung
  und Pace bleiben auf dem exakten Wert.
- Bei Signalverlust wird auf stufenlosen Wegen nichts mehr geschätzt.
- Bug behoben: `stairsPerFootfallAt(240)` fand zuerst die Treppe 0→240 statt
  den Weg {240} — am Zonenwert gewann immer die Treppe.

### GPS-Robustheit — `routeMatcher.ts`, `validateRun.ts`, `types.ts`, `RunPage.tsx`

- Neue Kennzahl `altitudeDriftM`. Ein Gerät, dessen Höhe über den Lauf um mehr
  als 20 m gegen das Routenprofil driftet, gilt als nicht verlässlich —
  unabhängig davon, welche Genauigkeit es meldet. Dann greift der Fallback aufs
  Modellprofil; die Höhenprüfung kann kein `fail` mehr erzeugen, nur `review`.
- Sprungregel: ein Ausschlag von höchstens drei Samples, der binnen fünf
  Sekunden zurückkommt, ist kein physischer Sprung — egal wie groß.
- Wake Lock während des Laufs gegen die iOS-Lücke beim Einstecken.

### Tests und Fixtures

`test/fixtures/reference-run-2026-09-08.json` (iPhone, 277 KB) und
`android-lag-2026-09-08.json` (428 KB). Neue Dateien `acceptance.test.ts`
(spiegelt die Checkliste), `deviceLag.test.ts`, `displayedSteps.test.ts`;
`routeModel.test.ts` prüft jetzt gegen den unabhängigen Juli-Lauf statt gegen
die eigenen Trainingsdaten. 94 → 130 Tests.

### Dokumentation — `test_runs/`

`overview.md`, `ground_truth.md` + CSV, `strava_reliability.md` + CSV,
`route_model_v4.md`, `gps_robustness.md`, `test_checklist.md`.

## 2. Welche Bugs behoben sein sollten

| Beobachtung im Feld | Ursache | Fix |
|---|---|---|
| Zähler zeigt beim Losgehen 5 oder 9 | v3-Startvertex 3 m neben dem Start (≈7 Stufen); danach physikalisch 2–4 beim ersten Fix mit Bewegung | Modell v4 + Anzeige-Kadenz |
| +28 Stufen an der Marke 600 | Abschnittsgrenze 663 statt 611 | Modell v4 |
| Sensor-Tritte „passen nicht" zu zwei Abschnitten | dieselbe Grenze | Modell v4 |
| Android: ungültig trotz kompletter Treppe (138 m, 1033 Stufen) | Gerät hinkt bis 39 m hinterher, Höhe driftet −65 m, meldet ±3 m | Drift-Erkennung → Prüfung statt ungültig. **Gültig per GPS wird er nicht** — dafür bräuchte es die Sensor-Fusion |
| 14-s-Lücke beim Einstecken (iOS) | Safari pausiert `watchPosition` bei Bildschirm aus | Wake Lock |
| Ein 200-m-GPS-Ausschlag kippt einen makellosen Lauf in die Prüfung | Einzelversatz > 100 m galt unbedingt als physisch | Blip-Ausnahme |

## 3. Release-Note (Entwurf)

> **Tusiger 0.10.0 — genauer zählen, ehrlicher werten**
>
> - Die Strecke ist neu vermessen. Der Zähler trifft jede 100er-Marke auf
>   wenige Stufen genau und steht auf den stufenlosen Wegen still.
> - Die Anzeige beginnt bei 1 und zählt jede Stufe einzeln — auch nach einer
>   kurzen Aufzeichnungspause.
> - Der Bildschirm bleibt während des Laufs an, damit kein GPS-Fix verloren geht.
> - Ein Gerät, dessen Höhenmessung nachweislich wegdriftet, wird nicht mehr
>   automatisch als ungültig gewertet, sondern zur Prüfung vorgelegt.
> - Kurze GPS-Ausschläge kippen einen sauberen Lauf nicht mehr in die Prüfung.

## 4. Deployment-Checkliste

Der Workflow deployt bei **jedem Push auf `feature/next-major-work`** direkt
auf GitHub Pages — nach lint, typecheck, test und build. Es gibt keine
Staging-Stufe. Deshalb:

| # | Schritt | Wer | ☐ |
|---|---|---|---|
| 1 | `npm run lint && npm run typecheck && npm test && npm run build` lokal | Claude (erledigt, alles grün) | ☑ |
| 2 | Version 0.10.0 in `package.json` | Claude (erledigt) | ☑ |
| 3 | Commit auf `feature/next-major-work` mit der Nachricht unten | Claude, **nach Freigabe** | ☐ |
| 4 | Push → CI baut und deployt (Dauer ~3 min) | Claude, **nach Freigabe** | ☐ |
| 5 | Startscreen zeigt `v0.10.0 · Build #… · <commit>`; PWA ggf. neu laden | Mario | ☐ |
| 6 | **Live-Test iPhone** nach `test_runs/test_checklist.md` A–E | Mario | ☐ |
| 7 | **Live-Test Android** nach Checkliste A–F | Mario | ☐ |
| 8 | Beweise sichern (JSON, Sensor-CSV, Screenshots, Strava-GPX) und übergeben | Mario | ☐ |
| 9 | Ergebnis gegen die Erwartungswerte; bei Abweichung: Rollback = Revert-Commit pushen | beide | ☐ |
| 10 | Erst danach PR `feature/next-major-work` → `main` | Claude, nach Freigabe | ☐ |

Was vor dem Merge nach `main` **manuell** bestätigt sein muss: A2 (erste Zahl
1) auf beiden Geräten, C6 (Zone bei 611, nicht 663), D2 (Validiert, Score 100)
auf dem iPhone, F2 (Android-Fehlerfall → Prüfung, nicht ungültig) falls das
Android wieder hinterherhinkt.

### Commit-Nachricht (Entwurf)

```
Routenmodell v4 aus dem Referenzlauf, Anzeige ab 1, Hoehen-Drift-Erkennung (v0.10.0)

Routenmodell v4 aus dem gueltigen Referenzlauf vom 2026-09-08 (zwoelf
fotografierte Marken, Hoehe barometrisch aus Strava). Die vorletzte
Abschnittsgrenze wandert von 663 auf 611; die Abschnitte 6 und 7 haben 143
und 539 Stufen. Damit stimmen die Tritte des Beschleunigungssensors auf
beiden Geraeten (1,00-1,01 pro Stufe) - die seit dem Kalibriergang offene
Anomalie war eine falsch eingetippte Grenze. Out of sample am Juli-Lauf:
mittlerer Fehler 7,9 -> 4,2 Stufen.

Die Anzeige folgt der Messung in menschlicher Kadenz und beginnt bei 1;
Messung und Wertung bleiben exakt. Bei Signalverlust wird auf stufenlosen
Wegen nichts mehr geschaetzt. stairsPerFootfallAt gab am Zonenwert die
Treppe zurueck statt den Weg.

Neue Kennzahl altitudeDriftM: driftet die Geraete-Hoehe um mehr als 20 m
gegen das Routenprofil, gilt sie als unglaubwuerdig und die Hoehenpruefung
faellt auf das Modell zurueck (review statt fail). Der Android-Testlauf,
der bei +/-3 m gemeldeter Genauigkeit 39 m hinterherhinkte, landet damit
in der Pruefung statt im Aus. Kurze GPS-Ausschlaege (<= 3 Samples, <= 5 s,
netto <= 30 m) gelten nicht mehr als physischer Sprung. Wake Lock gegen die
iOS-Luecke beim Einstecken.

Fixtures fuer beide Testlaeufe, Abnahme-Tests entlang der manuellen
Checkliste, Analyse-Dokumente unter test_runs/. 130 Tests.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

### Branch / PR

Die Arbeit liegt auf `feature/next-major-work`, von dem Pages deployt.
Vorschlag: ein Commit auf diesen Branch (der Live-Test braucht das Deployment),
PR nach `main` erst nach bestandenem Live-Test. Kein Feature-Branch vom
Feature-Branch — das würde den Deploy-Pfad umgehen.

## 5. Vorschlag: Regeln gegen ungetestete Deployments

Risiko, wie es heute ist: Push = Live. Ein lokal ungetesteter Commit wird
zwar von CI gestoppt, aber erst nach dem Push — und ein grüner CI-Lauf sagt
nichts über das Verhalten auf dem Handy.

**a) Lokaler Pre-Push-Hook** (verhindert den Push, wenn Tests fehlschlagen):

```bash
# .git/hooks/pre-push  (chmod +x)
#!/bin/sh
npm run lint && npm run typecheck && npm test
```

Nicht versioniert; jede Kopie des Repos braucht ihn einzeln. Alternative:
`husky` als Dev-Dependency — versioniert, aber ein weiteres Paket.

**b) Manuelle Freigabe für das Deployment** — GitHub → Settings →
Environments → `github-pages` → *Required reviewers* → dich selbst eintragen.
Dann baut CI bei jedem Push, deployt aber erst nach Klick. Damit lässt sich
ein Build vor dem Live-Gang anhalten, ohne den Branch anzufassen. Kein Code,
keine Abhängigkeit; gleiche Stelle, an der im Juli die Branch-Policy fehlte.

**c) Live-Test als Merge-Bedingung nach `main`** — in der PR-Vorlage die
Checkliste A–F verlinken und den Merge erst nach ausgefülltem Ergebnis.
Rein organisatorisch.

Empfehlung: **b** sofort (fünf Klicks, größter Effekt), **a** dazu.
