import { routeWaypoints } from "../../data/challenge";
import type { RunPoint } from "../../lib/types";

export function createSyntheticRunPoints(durationSeconds = 4140): RunPoint[] {
  const points: RunPoint[] = [];
  const now = Date.now() - durationSeconds * 1000;
  const total = 46;

  function interpolate(progress: number) {
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

  for (let index = 0; index < total; index += 1) {
    const progress = index / (total - 1);
    const routePoint = interpolate(progress);
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
