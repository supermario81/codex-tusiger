import { routeWaypoints, type RouteWaypoint } from "../../data/challenge";
import type { ChallengeConfig, RunPoint } from "../types";

const EARTH_RADIUS_M = 6_371_000;

export function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);

  const h =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function averagePoint(points: RunPoint[]): RunPoint | null {
  if (points.length === 0) {
    return null;
  }

  const average = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng,
      altitudeM: acc.altitudeM + (point.altitudeM ?? 0),
      altitudeCount: acc.altitudeCount + (point.altitudeM === null ? 0 : 1),
      accuracyM: acc.accuracyM + point.accuracyM
    }),
    { lat: 0, lng: 0, altitudeM: 0, altitudeCount: 0, accuracyM: 0 }
  );

  const first = points[0];
  return {
    ...first,
    lat: average.lat / points.length,
    lng: average.lng / points.length,
    altitudeM: average.altitudeCount > 0 ? average.altitudeM / average.altitudeCount : null,
    accuracyM: average.accuracyM / points.length
  };
}

export function stableEdgePoint(points: RunPoint[], edge: "start" | "end"): RunPoint | null {
  const goodPoints = points.filter((point) => point.accuracyM <= 30);
  const source = goodPoints.length >= 3 ? goodPoints : points;
  const edgePoints = edge === "start" ? source.slice(0, 5) : source.slice(-5);
  return averagePoint(edgePoints);
}

export function calculateRouteDistance(points: RunPoint[]): number {
  return points.reduce((distance, point, index) => {
    const previous = points[index - 1];
    if (!previous) {
      return distance;
    }

    return distance + haversineDistanceMeters(previous, point);
  }, 0);
}

export function estimateStepsFromPosition(point: RunPoint | null, config: ChallengeConfig): number {
  if (!point) {
    return 0;
  }

  let nearestIndex = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < routeWaypoints.length; i += 1) {
    const distance = haversineDistanceMeters(point, routeWaypoints[i]);
    if (distance < nearestDist) {
      nearestDist = distance;
      nearestIndex = i;
    }
  }

  const previous = routeWaypoints[Math.max(0, nearestIndex - 1)];
  const nearest = routeWaypoints[nearestIndex];
  const next = routeWaypoints[Math.min(routeWaypoints.length - 1, nearestIndex + 1)];

  function projectOnSegment(
    p: { lat: number; lng: number },
    a: RouteWaypoint,
    b: RouteWaypoint
  ): { steps: number; distToLine: number } {
    const segmentLength = haversineDistanceMeters(a, b);
    if (segmentLength < 1) {
      return { steps: a.steps, distToLine: haversineDistanceMeters(p, a) };
    }

    const fromA = haversineDistanceMeters(a, p);
    const fromB = haversineDistanceMeters(b, p);
    const t = Math.max(
      0,
      Math.min(1, (segmentLength * segmentLength + fromA * fromA - fromB * fromB) / (2 * segmentLength * segmentLength))
    );
    const steps = a.steps + t * (b.steps - a.steps);
    const distToLine = Math.sqrt(Math.max(0, fromA * fromA - t * segmentLength * (t * segmentLength)));
    return { steps, distToLine };
  }

  const firstSegment = projectOnSegment(point, previous, nearest);
  const secondSegment = projectOnSegment(point, nearest, next);
  const best = firstSegment.distToLine <= secondSegment.distToLine ? firstSegment : secondSegment;

  if (point.altitudeM !== null && point.altitudeM > 350 && point.altitudeM < 750) {
    const altStart = routeWaypoints[0].altM;
    const altEnd = routeWaypoints[routeWaypoints.length - 1].altM;
    const altProgress = Math.max(0, Math.min(1, (point.altitudeM - altStart) / (altEnd - altStart)));
    const altSteps = Math.round(altProgress * config.totalSteps);
    return Math.round(Math.max(0, Math.min(config.totalSteps, best.steps * 0.7 + altSteps * 0.3)));
  }

  return Math.round(Math.max(0, Math.min(config.totalSteps, best.steps)));
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatPace(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return "–";
  }

  return `${formatDuration(seconds)} / 100 Stufen`;
}
