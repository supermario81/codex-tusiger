import { routeWaypoints } from "../../data/challenge";
import type { RunPoint } from "../../lib/types";

function interpolateAlongRoute(progress: number) {
  const totalSteps = routeWaypoints.at(-1)?.steps ?? 1150;
  const steps = progress * totalSteps;
  const segment =
    routeWaypoints.slice(0, -1).find((waypoint, index) => {
      const next = routeWaypoints[index + 1];
      return steps >= waypoint.steps && steps <= next.steps;
    }) ?? routeWaypoints[routeWaypoints.length - 2];
  const next = routeWaypoints[routeWaypoints.indexOf(segment) + 1];
  const span = Math.max(1, next.steps - segment.steps);
  const t = Math.max(0, Math.min(1, (steps - segment.steps) / span));
  return {
    lat: segment.lat + (next.lat - segment.lat) * t,
    lng: segment.lng + (next.lng - segment.lng) * t,
    altitudeM: segment.altM + (next.altM - segment.altM) * t
  };
}

export function createSyntheticRunPoints(durationSeconds = 4140): RunPoint[] {
  const points: RunPoint[] = [];
  const now = Date.now() - durationSeconds * 1000;
  const total = 46;

  for (let index = 0; index < total; index += 1) {
    const progress = index / (total - 1);
    const routePoint = interpolateAlongRoute(progress);
    points.push({
      recordedAt: new Date(now + progress * durationSeconds * 1000).toISOString(),
      lat: routePoint.lat,
      lng: routePoint.lng,
      altitudeM: routePoint.altitudeM,
      altitudeAccuracyM: 6,
      accuracyM: index < 3 ? 8 : 5 + (index % 4),
      speedMps: 0.16,
      heading: 318
    });
  }

  return points;
}

// Kalibrierlauf wie im Feldtest: exakt 1 Punkt pro Sekunde entlang der
// vermessenen Wegpunkte, lineares Höhenprofil 427 m → 661 m (~234 m Anstieg)
// und realistisches ±8-m-Rauschen. Deterministisch, damit Tests stabil sind.
export function createCalibrationRunPoints(durationSeconds = 1002): RunPoint[] {
  const total = Math.max(2, Math.round(durationSeconds));
  const startedAt = Date.now() - durationSeconds * 1000;
  const startAltitudeM = 427;
  const endAltitudeM = 661;
  const points: RunPoint[] = [];

  for (let index = 0; index < total; index += 1) {
    const progress = index / (total - 1);
    const routePoint = interpolateAlongRoute(progress);
    const pseudoNoise = Math.sin(index * 12.9898) * 43758.5453;
    const jitter = pseudoNoise - Math.floor(pseudoNoise) - 0.5; // -0.5..0.5
    points.push({
      recordedAt: new Date(startedAt + index * 1000).toISOString(),
      lat: routePoint.lat,
      lng: routePoint.lng,
      altitudeM: startAltitudeM + progress * (endAltitudeM - startAltitudeM) + jitter * 2,
      altitudeAccuracyM: 8,
      accuracyM: 8 + jitter * 4,
      speedMps: 0.7,
      heading: 318
    });
  }

  return points;
}

// Bewusst OHNE Limit: Validierung, Höhenmeter und Zonen-Prüfung brauchen die
// komplette Aufzeichnung. Ein rollierender 300-Punkte-Puffer (slice(-300)) hat
// früher jeden echten Lauf ungültig gemacht. Bei 1 Punkt/Sekunde und maximal
// 2 Stunden sind das höchstens 7200 Punkte — problemlos im Speicher.
export function appendRunPoint(points: RunPoint[], point: RunPoint): RunPoint[] {
  return [...points, point];
}

export function positionToRunPoint(position: GeolocationPosition): RunPoint {
  return {
    recordedAt: new Date(position.timestamp).toISOString(),
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    altitudeM: position.coords.altitude,
    altitudeAccuracyM: position.coords.altitudeAccuracy,
    accuracyM: position.coords.accuracy,
    speedMps: position.coords.speed,
    heading: position.coords.heading
  };
}
