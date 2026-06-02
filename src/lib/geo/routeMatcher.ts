import { routeWaypoints, type RouteWaypoint } from "../../data/challenge";
import type {
  ChallengeConfig,
  RoutePointTelemetry,
  RouteTrackSummary,
  RunPoint,
  TrackingConfidenceLevel
} from "../types";
import { calculateRouteDistance, haversineDistanceMeters } from "./geo";

type XYPoint = { x: number; y: number };

type RouteSegment = {
  index: number;
  start: RouteWaypoint;
  end: RouteWaypoint;
  startXY: XYPoint;
  endXY: XYPoint;
  lengthM: number;
  startDistanceM: number;
  endDistanceM: number;
};

export type RouteMatch = {
  recordedAt: string;
  segmentIndex: number;
  progressSteps: number;
  progressRatio: number;
  projectedLat: number;
  projectedLng: number;
  distanceToRouteM: number;
  expectedAltitudeM: number;
  altitudeDeltaM: number | null;
  accuracyM: number;
  rawSpeedMps: number | null;
  confidence: number;
  confidenceLevel: TrackingConfidenceLevel;
  offRoute: boolean;
  flags: string[];
};

const origin = routeWaypoints[0];
const originLatRad = (origin.lat * Math.PI) / 180;
const metersPerDegreeLat = 111_320;
const metersPerDegreeLng = Math.cos(originLatRad) * 111_320;

const routePointsXY = routeWaypoints.map(toXY);
const routeSegments = createRouteSegments();
const totalRouteDistanceM = routeSegments.at(-1)?.endDistanceM ?? 0;

const maxForwardStepsPerSecond = 5.8;
const maxBackDriftStepsPerSecond = 0.9;
const minGoodConfidence = 0.45;
const highConfidenceThreshold = 0.72;
const maxInferredStepsPerRun = 80;
const maxInferredStepsPerPoint = 18;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toXY(point: { lat: number; lng: number }): XYPoint {
  return {
    x: (point.lng - origin.lng) * metersPerDegreeLng,
    y: (point.lat - origin.lat) * metersPerDegreeLat
  };
}

function fromXY(point: XYPoint): { lat: number; lng: number } {
  return {
    lat: origin.lat + point.y / metersPerDegreeLat,
    lng: origin.lng + point.x / metersPerDegreeLng
  };
}

function createRouteSegments(): RouteSegment[] {
  let distanceM = 0;
  return routeWaypoints.slice(0, -1).map((start, index) => {
    const end = routeWaypoints[index + 1];
    const startXY = routePointsXY[index];
    const endXY = routePointsXY[index + 1];
    const lengthM = haversineDistanceMeters(start, end);
    const segment = {
      index,
      start,
      end,
      startXY,
      endXY,
      lengthM,
      startDistanceM: distanceM,
      endDistanceM: distanceM + lengthM
    };
    distanceM += lengthM;
    return segment;
  });
}

function confidenceLevel(confidence: number): TrackingConfidenceLevel {
  if (confidence >= highConfidenceThreshold) return "high";
  if (confidence >= minGoodConfidence) return "estimated";
  return "low";
}

function scoreByRange(value: number, good: number, review: number, poor: number) {
  if (value <= good) return 1;
  if (value <= review) return 1 - ((value - good) / Math.max(1, review - good)) * 0.35;
  if (value <= poor) return 0.45 - ((value - review) / Math.max(1, poor - review)) * 0.25;
  return 0.12;
}

function projectToSegment(point: RunPoint, segment: RouteSegment) {
  const p = toXY(point);
  const abX = segment.endXY.x - segment.startXY.x;
  const abY = segment.endXY.y - segment.startXY.y;
  const ab2 = abX * abX + abY * abY;
  const t = ab2 <= 0 ? 0 : clamp(((p.x - segment.startXY.x) * abX + (p.y - segment.startXY.y) * abY) / ab2, 0, 1);
  const projectedXY = {
    x: segment.startXY.x + abX * t,
    y: segment.startXY.y + abY * t
  };
  const dx = p.x - projectedXY.x;
  const dy = p.y - projectedXY.y;
  const distanceToRouteM = Math.sqrt(dx * dx + dy * dy);
  const progressSteps = segment.start.steps + t * (segment.end.steps - segment.start.steps);
  const expectedAltitudeM = segment.start.altM + t * (segment.end.altM - segment.start.altM);
  const projected = fromXY(projectedXY);

  return {
    t,
    projected,
    progressSteps,
    expectedAltitudeM,
    distanceToRouteM
  };
}

export function expectedAltitudeForSteps(steps: number): number {
  const clamped = clamp(steps, routeWaypoints[0].steps, routeWaypoints.at(-1)?.steps ?? steps);
  const segment = routeSegments.find((item) => clamped >= item.start.steps && clamped <= item.end.steps) ?? routeSegments.at(-1);
  if (!segment) return routeWaypoints[0].altM;
  const stepSpan = Math.max(1, segment.end.steps - segment.start.steps);
  const t = clamp((clamped - segment.start.steps) / stepSpan, 0, 1);
  return segment.start.altM + t * (segment.end.altM - segment.start.altM);
}

export function routeDistanceForSteps(steps: number): number {
  const clamped = clamp(steps, routeWaypoints[0].steps, routeWaypoints.at(-1)?.steps ?? steps);
  const segment = routeSegments.find((item) => clamped >= item.start.steps && clamped <= item.end.steps) ?? routeSegments.at(-1);
  if (!segment) return 0;
  const stepSpan = Math.max(1, segment.end.steps - segment.start.steps);
  const t = clamp((clamped - segment.start.steps) / stepSpan, 0, 1);
  return segment.startDistanceM + t * segment.lengthM;
}

export function getRouteLengthMeters(): number {
  return totalRouteDistanceM;
}

export function matchPointToRoute(
  point: RunPoint,
  config: ChallengeConfig,
  expectedSteps?: number | null
): RouteMatch {
  const altitudeAvailable = point.altitudeM !== null && point.altitudeM > 350 && point.altitudeM < 750;
  const pointAltitudeM = altitudeAvailable ? point.altitudeM : null;
  const candidates = routeSegments.map((segment) => {
    const projected = projectToSegment(point, segment);
    const altitudeDeltaM = pointAltitudeM === null ? null : pointAltitudeM - projected.expectedAltitudeM;
    const altitudePenalty = altitudeDeltaM === null ? 0 : Math.min(45, Math.abs(altitudeDeltaM) * 0.7);
    const continuityPenalty =
      expectedSteps === null || expectedSteps === undefined
        ? 0
        : Math.min(65, Math.abs(projected.progressSteps - expectedSteps) * 0.08);

    return {
      segment,
      projected,
      altitudeDeltaM,
      score: projected.distanceToRouteM + altitudePenalty + continuityPenalty
    };
  });

  const best = candidates.reduce((winner, candidate) => candidate.score < winner.score ? candidate : winner, candidates[0]);
  const accuracyScore = scoreByRange(
    point.accuracyM,
    config.gpsAccuracyValidMaxM,
    config.gpsAccuracyReviewMaxM,
    config.gpsAccuracyReviewMaxM * 2
  );
  const routeScore = scoreByRange(best.projected.distanceToRouteM, 18, 45, 85);
  const altitudeScore =
    best.altitudeDeltaM === null
      ? 0.66
      : scoreByRange(Math.abs(best.altitudeDeltaM), 14, 32, 60);
  let confidence = clamp(accuracyScore * 0.42 + routeScore * 0.38 + altitudeScore * 0.2, 0, 1);
  const offRoute = best.projected.distanceToRouteM > Math.max(55, point.accuracyM + 25);
  if (offRoute) {
    confidence = Math.min(confidence, 0.35);
  }
  const flags: string[] = [];

  if (point.accuracyM > config.gpsAccuracyReviewMaxM) flags.push("gps_accuracy_low");
  if (offRoute) flags.push("off_route");
  if (best.altitudeDeltaM !== null && Math.abs(best.altitudeDeltaM) > 45) flags.push("altitude_mismatch");
  if (confidence < minGoodConfidence) flags.push("low_confidence");

  return {
    recordedAt: point.recordedAt,
    segmentIndex: best.segment.index,
    progressSteps: clamp(best.projected.progressSteps, 0, config.totalSteps),
    progressRatio: clamp(best.projected.progressSteps / config.totalSteps, 0, 1),
    projectedLat: best.projected.projected.lat,
    projectedLng: best.projected.projected.lng,
    distanceToRouteM: best.projected.distanceToRouteM,
    expectedAltitudeM: best.projected.expectedAltitudeM,
    altitudeDeltaM: best.altitudeDeltaM,
    accuracyM: point.accuracyM,
    rawSpeedMps: point.speedMps,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    offRoute,
    flags
  };
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function positiveOrNull(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function analyzeRouteTrack(points: RunPoint[], config: ChallengeConfig): RouteTrackSummary {
  if (points.length === 0) {
    return {
      pointCount: 0,
      matchedPointCount: 0,
      highConfidencePointCount: 0,
      estimatedPointCount: 0,
      lowConfidencePointCount: 0,
      offRoutePointCount: 0,
      impossibleJumpCount: 0,
      backwardJumpCount: 0,
      largeGapCount: 0,
      longestGapSeconds: 0,
      finalSteps: 0,
      maxSteps: 0,
      progressRatio: 0,
      rawDistanceMeters: 0,
      projectedDistanceMeters: 0,
      routeDistanceMeters: getRouteLengthMeters(),
      altitudeGainM: null,
      interpretedElevationGainM: 0,
      averageConfidence: 0,
      confidenceLevel: "low",
      routeAdherenceRatio: 0,
      lowConfidenceRatio: 1,
      offRouteRatio: 1,
      continuityScore: 0,
      altitudeConsistencyRatio: null,
      filteredSpeedMps: null,
      rawSpeedMps: null,
      pacePer100Steps: null,
      inferredSteps: 0,
      telemetry: []
    };
  }

  const sorted = [...points].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  let filteredSteps = 0;
  let maxSteps = 0;
  let inferredSteps = 0;
  let filteredStepSpeed = 0;
  let lastAcceptedAt: number | null = null;
  let lastPoint: RunPoint | null = null;
  let impossibleJumpCount = 0;
  let backwardJumpCount = 0;
  let largeGapCount = 0;
  let longestGapSeconds = 0;
  let projectedDistanceMeters = 0;
  const matchedBands = new Set<number>();
  const altitudeConsistency: boolean[] = [];
  const telemetry: RoutePointTelemetry[] = [];

  sorted.forEach((point) => {
    const currentAt = new Date(point.recordedAt).getTime();
    const previousAt = lastPoint ? new Date(lastPoint.recordedAt).getTime() : currentAt;
    const dt = Math.max(0, (currentAt - previousAt) / 1000);
    const match = matchPointToRoute(point, config, filteredSteps);
    const flags = [...match.flags];
    let inferred = false;
    let routeSpeedMps: number | null = null;

    if (lastPoint && dt > 0) {
      const rawDistance = haversineDistanceMeters(lastPoint, point);
      if (rawDistance / dt > 8) {
        impossibleJumpCount += 1;
        flags.push("impossible_raw_jump");
      }
      if (dt > 20) {
        largeGapCount += 1;
        longestGapSeconds = Math.max(longestGapSeconds, dt);
        flags.push("large_gap");
      }
    }

    const canUseMeasuredMatch = match.confidence >= minGoodConfidence && !match.offRoute;
    const previousSteps = filteredSteps;

    if (canUseMeasuredMatch) {
      const maxForward = dt > 0 ? dt * maxForwardStepsPerSecond : config.totalSteps;
      const maxBackward = Math.max(18, dt * maxBackDriftStepsPerSecond);
      if (match.progressSteps > previousSteps + maxForward + 45) {
        impossibleJumpCount += 1;
        flags.push("impossible_route_jump");
      }
      if (match.progressSteps < previousSteps - maxBackward) {
        backwardJumpCount += 1;
        flags.push("backward_drift_suppressed");
      }

      const boundedForward = dt > 0 ? Math.min(match.progressSteps, previousSteps + maxForward) : match.progressSteps;
      const boundedBackward = Math.max(previousSteps - maxBackward, boundedForward);
      filteredSteps = clamp(Math.max(0, boundedBackward), 0, config.totalSteps);
      const deltaSteps = Math.max(0, filteredSteps - previousSteps);
      if (dt > 0 && deltaSteps > 0) {
        const instantStepSpeed = deltaSteps / dt;
        filteredStepSpeed = filteredStepSpeed === 0 ? instantStepSpeed : filteredStepSpeed * 0.72 + instantStepSpeed * 0.28;
        const deltaMeters = Math.max(0, routeDistanceForSteps(filteredSteps) - routeDistanceForSteps(previousSteps));
        projectedDistanceMeters += deltaMeters;
        routeSpeedMps = deltaMeters / dt;
      }
      lastAcceptedAt = currentAt;
      matchedBands.add(Math.floor(filteredSteps / 100));
    } else {
      const secondsSinceAccepted = lastAcceptedAt === null ? Infinity : (currentAt - lastAcceptedAt) / 1000;
      const canInfer =
        previousSteps >= 25 &&
        filteredStepSpeed > 0 &&
        secondsSinceAccepted <= 18 &&
        dt > 0 &&
        inferredSteps < maxInferredStepsPerRun;

      if (canInfer) {
        const conservativeSteps = Math.min(
          filteredStepSpeed * dt * 0.35,
          dt * 0.8,
          maxInferredStepsPerPoint,
          maxInferredStepsPerRun - inferredSteps
        );
        filteredSteps = clamp(previousSteps + Math.max(0, conservativeSteps), 0, config.totalSteps);
        inferredSteps += Math.max(0, filteredSteps - previousSteps);
        inferred = filteredSteps > previousSteps;
        flags.push("progress_inferred_low_confidence");
      }
    }

    maxSteps = Math.max(maxSteps, filteredSteps);

    if (match.altitudeDeltaM !== null) {
      altitudeConsistency.push(Math.abs(match.altitudeDeltaM) <= 35);
    }

    const item: RoutePointTelemetry = {
      recordedAt: point.recordedAt,
      rawLat: point.lat,
      rawLng: point.lng,
      projectedLat: match.projectedLat,
      projectedLng: match.projectedLng,
      segmentIndex: match.segmentIndex,
      progressSteps: Math.round(match.progressSteps),
      filteredSteps: Math.round(filteredSteps),
      distanceToRouteM: Math.round(match.distanceToRouteM * 10) / 10,
      accuracyM: Math.round(point.accuracyM * 10) / 10,
      rawAltitudeM: point.altitudeM,
      expectedAltitudeM: Math.round(match.expectedAltitudeM * 10) / 10,
      altitudeDeltaM: match.altitudeDeltaM === null ? null : Math.round(match.altitudeDeltaM * 10) / 10,
      rawSpeedMps: point.speedMps,
      routeSpeedMps: routeSpeedMps === null ? null : Math.round(routeSpeedMps * 100) / 100,
      confidence: Math.round(match.confidence * 100) / 100,
      confidenceLevel: match.confidenceLevel,
      offRoute: match.offRoute,
      inferred,
      flags
    };

    telemetry.push(item);
    lastPoint = point;
  });

  const highConfidencePointCount = telemetry.filter((point) => point.confidenceLevel === "high").length;
  const estimatedPointCount = telemetry.filter((point) => point.confidenceLevel === "estimated").length;
  const lowConfidencePointCount = telemetry.filter((point) => point.confidenceLevel === "low").length;
  const offRoutePointCount = telemetry.filter((point) => point.offRoute).length;
  const averageConfidence = mean(telemetry.map((point) => point.confidence));
  const usablePoints = highConfidencePointCount + estimatedPointCount;
  const routeAdherenceRatio = telemetry.length ? (telemetry.length - offRoutePointCount) / telemetry.length : 0;
  const lowConfidenceRatio = telemetry.length ? lowConfidencePointCount / telemetry.length : 1;
  const offRouteRatio = telemetry.length ? offRoutePointCount / telemetry.length : 1;
  const continuityScore = clamp(matchedBands.size / Math.ceil(config.totalSteps / 100), 0, 1);
  const altitudeConsistencyRatio = altitudeConsistency.length
    ? altitudeConsistency.filter(Boolean).length / altitudeConsistency.length
    : null;
  const firstAltitude = sorted.find((point) => point.altitudeM !== null)?.altitudeM ?? null;
  const lastAltitude = [...sorted].reverse().find((point) => point.altitudeM !== null)?.altitudeM ?? null;
  const altitudeGainM = firstAltitude === null || lastAltitude === null ? null : lastAltitude - firstAltitude;
  const interpretedElevationGainM = expectedAltitudeForSteps(maxSteps) - expectedAltitudeForSteps(0);
  const rawSpeedValues = sorted.map((point) => point.speedMps).filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);
  const filteredSpeedMps = positiveOrNull((filteredStepSpeed / config.totalSteps) * getRouteLengthMeters());
  const finalSteps = Math.round(clamp(telemetry.at(-1)?.filteredSteps ?? filteredSteps, 0, config.totalSteps));
  const durationSeconds = Math.max(
    0,
    (new Date(sorted.at(-1)?.recordedAt ?? sorted[0].recordedAt).getTime() - new Date(sorted[0].recordedAt).getTime()) / 1000
  );

  return {
    pointCount: sorted.length,
    matchedPointCount: usablePoints,
    highConfidencePointCount,
    estimatedPointCount,
    lowConfidencePointCount,
    offRoutePointCount,
    impossibleJumpCount,
    backwardJumpCount,
    largeGapCount,
    longestGapSeconds,
    finalSteps,
    maxSteps: Math.round(clamp(maxSteps, 0, config.totalSteps)),
    progressRatio: clamp(maxSteps / config.totalSteps, 0, 1),
    rawDistanceMeters: calculateRouteDistance(sorted),
    projectedDistanceMeters,
    routeDistanceMeters: getRouteLengthMeters(),
    altitudeGainM,
    interpretedElevationGainM,
    averageConfidence,
    confidenceLevel: confidenceLevel(averageConfidence),
    routeAdherenceRatio,
    lowConfidenceRatio,
    offRouteRatio,
    continuityScore,
    altitudeConsistencyRatio,
    filteredSpeedMps,
    rawSpeedMps: rawSpeedValues.length ? mean(rawSpeedValues) : null,
    pacePer100Steps: durationSeconds > 0 && finalSteps > 0 ? durationSeconds / (finalSteps / 100) : null,
    inferredSteps: Math.round(inferredSteps),
    telemetry
  };
}
