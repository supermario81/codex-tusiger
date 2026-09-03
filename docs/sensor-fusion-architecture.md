# Sensorfusion: Architektur (Entwurf, Stand 2026-09-01)

Status: **Entwurf und Gerüst.** Es ist noch nichts aktiv — die Laufauswertung
läuft unverändert über `analyzeRouteTrack` (GPS + Routenmodell). Dieses Dokument
legt fest, wohin die Fusion gebaut wird und welche Rolle jeder Sensor bekommt.

## Warum

Heute ist rohes GPS die einzige Quelle für Position, Abschnitt und Stufenzahl.
Das erzeugt genau die beobachteten Fehler: Ausreißer bei schlechtem Empfang,
Fortschritt im Stand, Zähler, der am Ziel nicht aufgeht. GPS ist im Wald und an
einer steilen Treppe die *schlechteste* verfügbare Quelle für kurze Distanzen und
die *beste* für die absolute Verortung. Die Fusion dreht die Gewichtung um:
Schritte kommen aus der Beschleunigung, Höhe aus dem Barometer, Richtung aus
Gyroskop und Kompass — GPS wird zur weichen Nebenbedingung.

## Zustandsautomat

Der fusionierte Zustand (`FusedRouteState`) ist die künftige Wahrheit:

| Feld | Bedeutung |
|---|---|
| `stageIndex` | Index des aktuellen Routenabschnitts (Treppe oder Flachstück) |
| `stageKind` | `stairs` \| `flat` \| `unknown` — steuert, ob Schritte zählen |
| `distanceInStageM` | zurückgelegte Strecke innerhalb des Abschnitts |
| `totalDistanceM` | Strecke seit Laufbeginn entlang der Route |
| `steps` | fusionierte Stufenzahl (Anzeige und Wertung) |
| `elevationGainM` | Höhengewinn seit Start |
| `confidence` | 0..1, wie gut die Quellen zusammenpassen |

Übergänge:

- `flat → stairs`: anhaltender Höhengewinn (Barometer) **und** Schrittkadenz im
  Treppenband **und** Position innerhalb eines als Treppe markierten Abschnitts.
- `stairs → flat`: Höhe stagniert über mehrere Sekunden, Kadenz bleibt, Position
  erreicht das Ende des Treppenabschnitts.
- `→ unknown`: widersprüchliche Quellen; der Zustand friert ein und wartet, statt
  zu raten. Kein Fortschritt in `unknown`.

Auf einem Flachstück zählen Schritte **nicht** als Stufen — sie erhöhen nur
`distanceInStageM`. Das ist der Kern der Verbesserung: heute vergibt das Modell
im Flachstück Stufen nach Strecke.

## Rolle je Sensor

| Sensor | Rolle | Vertrauen |
|---|---|---|
| Beschleunigung | **primäre Schritterkennung** (Peak-Erkennung auf dem Betrag) | hoch, geräteunabhängig |
| Gyroskop + Kompass | Richtung, Ausrichtung an der Route, Erkennen von Kehren | mittel, driftet |
| Barometer | Höhenänderung, Treppe vs. Flach, Stufenzahl-Gegenprobe | hoch, wo verfügbar |
| GPS | **weiche** Nebenbedingung: grobe Verortung, Start-/Zielzone | niedrig auf kurzer Distanz |

Verfügbarkeit auf iPhone Safari: Beschleunigung und Gyroskop über
`DeviceMotionEvent` (Freigabe nötig), Kompass über `webkitCompassHeading`.
**Kein** rohes Magnetometer, **kein** Barometer, **kein** Schrittzähler. Wo ein
Sensor fehlt, fällt die Fusion auf die nächstbeste Quelle zurück — im Zweifel
auf das heutige GPS-Verhalten.

## Datenfluss

```
Sensoren ──► SensorSource (roh, gepuffert)
               │
               ├─► StepDetector      (Beschleunigung → Schrittereignisse)
               ├─► HeadingEstimator  (Gyro + Kompass → Kurs)
               ├─► AltitudeEstimator (Barometer/GPS-Höhe → Höhenprofil)
               │
               └─► RouteStateMachine ──► FusedRouteState ──► UI + Validierung
                        ▲
                        └── GPS als weiche Nebenbedingung (Korrektur, kein Diktat)
```

## GPS als weiche Nebenbedingung

1. Fixes mit Genauigkeit über 20–30 m fließen **nicht** in Abschnittsentscheidungen.
2. Positionen werden geglättet (gleitender Mittelwert, später Kalman).
3. Ein Fix, der mehr als X Meter in weniger als Y Sekunden springt und
   Schritt-, Kurs- oder Höhendaten widerspricht, gilt als Ausreißer.
4. GPS darf den fusionierten Fortschritt **korrigieren**, aber nicht zurücksetzen:
   Schritte, die die Beschleunigung gezählt hat, verfallen nicht, weil ein Fix
   springt.

## Umsetzungsreihenfolge

1. *(erledigt)* Sensor-Logger mit CSV-Export — ohne echte Daten wäre jede
   Schwelle geraten.
2. Schritterkennung aus der Beschleunigung, kalibriert an den geloggten Läufen.
3. Kurs und Höhe ergänzen, Abschnittserkennung darauf umstellen.
4. GPS-Regeln verschärfen und die Fusion zur Wahrheit für Anzeige und Wertung
   machen.

Die Schwellen (Peak-Höhe, Kadenzband, Höhen-Hysterese) werden **aus den
geloggten Läufen bestimmt**, nicht vorab gesetzt.
