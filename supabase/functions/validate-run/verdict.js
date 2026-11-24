// src/data/challenge.ts
var routeSections = [
  { kind: "stairs", fromSteps: 0, toSteps: 240, stairsPerFootfall: 1 },
  { kind: "path", fromSteps: 240, toSteps: 240, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 240, toSteps: 265, stairsPerFootfall: null },
  { kind: "path", fromSteps: 265, toSteps: 265, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 265, toSteps: 362, stairsPerFootfall: 1 },
  { kind: "path", fromSteps: 362, toSteps: 362, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 362, toSteps: 371, stairsPerFootfall: null },
  { kind: "path", fromSteps: 371, toSteps: 371, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 371, toSteps: 468, stairsPerFootfall: 1 },
  { kind: "path", fromSteps: 468, toSteps: 468, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 468, toSteps: 611, stairsPerFootfall: 1 },
  { kind: "path", fromSteps: 611, toSteps: 611, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 611, toSteps: 1150, stairsPerFootfall: 1 }
];
var defaultStairsPerFootfall = 1;
function stairsPerFootfallAt(steps) {
  const rounded = Math.round(steps);
  if (routeSections.some((item) => item.kind === "path" && item.fromSteps === rounded)) {
    return 0;
  }
  const section = routeSections.find(
    (item) => item.kind === "stairs" && steps >= item.fromSteps && steps <= item.toSteps
  );
  return section?.stairsPerFootfall ?? defaultStairsPerFootfall;
}
var routeWaypoints = [
  { steps: 0, lat: 47.3152241, lng: 7.8869355, altM: 429.8 },
  { steps: 45, lat: 47.3153331, lng: 7.8867673, altM: 438.3 },
  { steps: 70, lat: 47.3154147, lng: 7.8867189, altM: 443 },
  { steps: 100, lat: 47.3155006, lng: 7.8866203, altM: 449 },
  { steps: 137, lat: 47.3155916, lng: 7.8865018, altM: 456.9 },
  { steps: 172, lat: 47.3157094, lng: 7.8864225, altM: 464.8 },
  { steps: 200, lat: 47.3157808, lng: 7.8863183, altM: 470.5 },
  { steps: 225, lat: 47.3158539, lng: 7.8862188, altM: 475 },
  { steps: 240, lat: 47.3159021, lng: 7.8861619, altM: 477.7 },
  { steps: 240, lat: 47.31595, lng: 7.8861231, altM: 479.6 },
  { steps: 259, lat: 47.3160117, lng: 7.8860679, altM: 482.6 },
  { steps: 265, lat: 47.3160329, lng: 7.8860413, altM: 483.6 },
  { steps: 265, lat: 47.3160501, lng: 7.8860165, altM: 484.5 },
  { steps: 300, lat: 47.3161606, lng: 7.8858893, altM: 490.1 },
  { steps: 304, lat: 47.3161774, lng: 7.8858906, altM: 490.7 },
  { steps: 339, lat: 47.3162887, lng: 7.8857338, altM: 498.6 },
  { steps: 362, lat: 47.3163741, lng: 7.8856494, altM: 501.9 },
  { steps: 362, lat: 47.3164018, lng: 7.8856352, altM: 502.9 },
  { steps: 362, lat: 47.3165481, lng: 7.8854647, altM: 507.2 },
  { steps: 362, lat: 47.3165617, lng: 7.8854577, altM: 507.5 },
  { steps: 371, lat: 47.3165997, lng: 7.8854398, altM: 508.8 },
  { steps: 371, lat: 47.3166287, lng: 7.8854244, altM: 509.8 },
  { steps: 371, lat: 47.3166738, lng: 7.8853643, altM: 511.4 },
  { steps: 392, lat: 47.3167464, lng: 7.8852823, altM: 514.9 },
  { steps: 400, lat: 47.3167693, lng: 7.8852403, altM: 516.6 },
  { steps: 407, lat: 47.3167783, lng: 7.8851993, altM: 519 },
  { steps: 448, lat: 47.3169333, lng: 7.8850457, altM: 527.3 },
  { steps: 458, lat: 47.3169599, lng: 7.8849944, altM: 529.8 },
  { steps: 468, lat: 47.3170033, lng: 7.8849668, altM: 532 },
  { steps: 468, lat: 47.3170204, lng: 7.8849626, altM: 533.6 },
  { steps: 468, lat: 47.3170309, lng: 7.8849482, altM: 534.5 },
  { steps: 478, lat: 47.3170544, lng: 7.8848944, altM: 536.3 },
  { steps: 500, lat: 47.3171451, lng: 7.8848219, altM: 540.6 },
  { steps: 508, lat: 47.3171747, lng: 7.8848019, altM: 542.2 },
  { steps: 529, lat: 47.3172304, lng: 7.8847034, altM: 545.4 },
  { steps: 600, lat: 47.3174781, lng: 7.8844694, altM: 557.1 },
  { steps: 603, lat: 47.3174863, lng: 7.8844583, altM: 558.3 },
  { steps: 611, lat: 47.3175105, lng: 7.8844446, altM: 559.5 },
  { steps: 611, lat: 47.3175571, lng: 7.8844112, altM: 561.3 },
  { steps: 611, lat: 47.3175618, lng: 7.884396, altM: 561.4 },
  { steps: 629, lat: 47.3175996, lng: 7.8843209, altM: 563.9 },
  { steps: 652, lat: 47.3176678, lng: 7.8842451, altM: 567.1 },
  { steps: 668, lat: 47.3176996, lng: 7.8841767, altM: 569.4 },
  { steps: 688, lat: 47.3177589, lng: 7.8841143, altM: 572.2 },
  { steps: 695, lat: 47.3177825, lng: 7.8841171, altM: 573.4 },
  { steps: 700, lat: 47.3177902, lng: 7.8840914, altM: 574.3 },
  { steps: 703, lat: 47.3177925, lng: 7.8840783, altM: 574.7 },
  { steps: 722, lat: 47.3178566, lng: 7.8840253, altM: 577.6 },
  { steps: 752, lat: 47.3179302, lng: 7.8839068, altM: 581.8 },
  { steps: 781, lat: 47.318026, lng: 7.8838254, altM: 585.3 },
  { steps: 800, lat: 47.3180802, lng: 7.8837517, altM: 588.1 },
  { steps: 826, lat: 47.3181557, lng: 7.8836759, altM: 592.7 },
  { steps: 837, lat: 47.3181937, lng: 7.883667, altM: 594.2 },
  { steps: 847, lat: 47.3182139, lng: 7.8836195, altM: 596.3 },
  { steps: 877, lat: 47.3183099, lng: 7.8835358, altM: 601.9 },
  { steps: 900, lat: 47.318361, lng: 7.8834412, altM: 606.7 },
  { steps: 933, lat: 47.3184266, lng: 7.8833297, altM: 613.7 },
  { steps: 943, lat: 47.3184583, lng: 7.8833147, altM: 615.3 },
  { steps: 950, lat: 47.318478, lng: 7.883328, altM: 616.4 },
  { steps: 960, lat: 47.3185096, lng: 7.8833065, altM: 618.9 },
  { steps: 965, lat: 47.318507, lng: 7.8832901, altM: 620.4 },
  { steps: 978, lat: 47.3185517, lng: 7.8832852, altM: 623.3 },
  { steps: 988, lat: 47.3185527, lng: 7.8832419, altM: 626.2 },
  { steps: 1e3, lat: 47.3185886, lng: 7.8832247, altM: 629.1 },
  { steps: 1014, lat: 47.31863, lng: 7.883198, altM: 631.7 },
  { steps: 1032, lat: 47.3186672, lng: 7.8831335, altM: 635.7 },
  { steps: 1062, lat: 47.3187574, lng: 7.8830757, altM: 642.9 },
  { steps: 1093, lat: 47.31883, lng: 7.882976, altM: 649.8 },
  { steps: 1100, lat: 47.3188528, lng: 7.8829677, altM: 651.2 },
  { steps: 1102, lat: 47.3188568, lng: 7.8829638, altM: 651.5 },
  { steps: 1113, lat: 47.3188642, lng: 7.8829241, altM: 654.6 },
  { steps: 1126, lat: 47.3189025, lng: 7.8829069, altM: 657.4 },
  { steps: 1150, lat: 47.3189565, lng: 7.8828313, altM: 661.3 },
  { steps: 1150, lat: 47.3189602, lng: 7.8828263, altM: 661.4 },
  { steps: 1150, lat: 47.3189526, lng: 7.8828031, altM: 662.5 }
];

// src/lib/geo/geo.ts
var EARTH_RADIUS_M = 6371e3;
function toRadians(value) {
  return value * Math.PI / 180;
}
function haversineDistanceMeters(a, b) {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const h = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function medianValue(values) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function medianPoint(points) {
  if (points.length === 0) {
    return null;
  }
  const anchor = points[Math.floor(points.length / 2)];
  const altitudes = points.map((point) => point.altitudeM).filter((value) => value !== null);
  return {
    ...anchor,
    lat: medianValue(points.map((point) => point.lat)) ?? anchor.lat,
    lng: medianValue(points.map((point) => point.lng)) ?? anchor.lng,
    altitudeM: altitudes.length > 0 ? medianValue(altitudes) : null,
    accuracyM: medianValue(points.map((point) => point.accuracyM)) ?? anchor.accuracyM
  };
}
var stableReferenceAccuracyMaxM = 30;
function stableEdgePoint(points, edge) {
  const goodPoints = points.filter((point) => point.accuracyM <= stableReferenceAccuracyMaxM);
  const source = goodPoints.length >= 3 ? goodPoints : points;
  const edgePoints = edge === "start" ? source.slice(0, 5) : source.slice(-5);
  return medianPoint(edgePoints);
}
function computeStableStartReference(points) {
  if (points.length === 0) {
    return null;
  }
  const window = points.slice(0, 20);
  const goodPoints = window.filter((point) => point.accuracyM <= stableReferenceAccuracyMaxM);
  if (goodPoints.length >= 5) {
    return medianPoint(goodPoints.slice(0, 5));
  }
  if (points.length >= 20) {
    const bestFive = [...window].sort((a, b) => a.accuracyM - b.accuracyM).slice(0, 5);
    return medianPoint(bestFive);
  }
  return null;
}
function calculateRouteDistance(points) {
  return points.reduce((distance, point, index) => {
    const previous = points[index - 1];
    if (!previous) {
      return distance;
    }
    return distance + haversineDistanceMeters(previous, point);
  }, 0);
}

// src/lib/supabase/mappers.ts
function fromConfigRow(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    totalSteps: Math.max(1150, Number(row.total_steps) || 1150),
    startLat: Number(row.start_lat),
    startLng: Number(row.start_lng),
    startRadiusM: Number(row.start_radius_m),
    endLat: Number(row.end_lat),
    endLng: Number(row.end_lng),
    endRadiusM: Number(row.end_radius_m),
    expectedElevationGainM: Number(row.expected_elevation_gain_m),
    elevationValidMinM: Number(row.elevation_valid_min_m),
    elevationValidMaxM: Number(row.elevation_valid_max_m),
    elevationReviewMinM: Number(row.elevation_review_min_m),
    elevationReviewMaxM: Number(row.elevation_review_max_m),
    gpsAccuracyValidMaxM: Number(row.gps_accuracy_valid_max_m),
    gpsAccuracyReviewMaxM: Number(row.gps_accuracy_review_max_m),
    minDurationSeconds: Number(row.min_duration_seconds),
    maxDurationSeconds: Number(row.max_duration_seconds),
    publishNeedsReview: Boolean(row.publish_needs_review),
    donationUrl: String(row.donation_url ?? ""),
    active: Boolean(row.active)
  };
}

// src/lib/geo/routeMatcher.ts
var origin = routeWaypoints[0];
var originLatRad = origin.lat * Math.PI / 180;
var metersPerDegreeLat = 111320;
var metersPerDegreeLng = Math.cos(originLatRad) * 111320;
var routePointsXY = routeWaypoints.map(toXY);
var routeSegments = createRouteSegments();
var totalRouteDistanceM = routeSegments.at(-1)?.endDistanceM ?? 0;
var maxForwardStepsPerSecond = 5.8;
var maxBackDriftStepsPerSecond = 0.9;
var minGoodConfidence = 0.45;
var highConfidenceThreshold = 0.72;
var maxInferredStepsPerRun = 80;
var maxInferredStepsPerPoint = 18;
var jumpEventGapSeconds = 5;
var physicalSpeedMps = 8;
var pedestrianSpeedMps = 3;
var physicalSingleDisplacementM = 100;
var jumpNoiseFloorM = 30;
var startAnchorRadiusM = 10;
var startAnchorFadeSteps = 30;
var maxStartAnchorSteps = 10;
function classifyJumpEvents(samples) {
  const sorted = [...samples].sort((a, b) => a.atMs - b.atMs);
  const events = [];
  sorted.forEach((sample) => {
    const current = events.at(-1);
    if (current && sample.atMs - (current.at(-1)?.atMs ?? 0) < jumpEventGapSeconds * 1e3) {
      current.push(sample);
    } else {
      events.push([sample]);
    }
  });
  let physicalJumpEventCount = 0;
  let routeRematchEventCount = 0;
  let maxJumpDisplacementM = 0;
  events.forEach((event) => {
    const maxDisplacement = Math.max(...event.map((sample) => sample.displacementM));
    const fastSamples = event.filter((sample) => sample.speedMps > physicalSpeedMps);
    const first = event[0];
    const last = event.at(-1) ?? first;
    const netDisplacementM = first.fromLat !== void 0 && first.fromLng !== void 0 && last.toLat !== void 0 && last.toLng !== void 0 ? haversineDistanceMeters(
      { lat: first.fromLat, lng: first.fromLng },
      { lat: last.toLat, lng: last.toLng }
    ) : event.reduce((sum, sample) => sum + sample.displacementM, 0);
    const accuracyBudgetM = Math.max(0, ...event.map((sample) => sample.accuracyBudgetM ?? 0));
    const noiseToleranceM = Math.max(jumpNoiseFloorM, accuracyBudgetM);
    const briefExcursion = event.length <= 3 && last.atMs - first.atMs <= jumpEventGapSeconds * 1e3 && netDisplacementM <= jumpNoiseFloorM;
    const physical = !briefExcursion && (maxDisplacement > physicalSingleDisplacementM || fastSamples.length >= 2 && netDisplacementM > noiseToleranceM);
    if (physical) {
      physicalJumpEventCount += 1;
      maxJumpDisplacementM = Math.max(maxJumpDisplacementM, maxDisplacement);
    } else {
      routeRematchEventCount += 1;
    }
  });
  return { physicalJumpEventCount, routeRematchEventCount, maxJumpDisplacementM };
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function toXY(point) {
  return {
    x: (point.lng - origin.lng) * metersPerDegreeLng,
    y: (point.lat - origin.lat) * metersPerDegreeLat
  };
}
function fromXY(point) {
  return {
    lat: origin.lat + point.y / metersPerDegreeLat,
    lng: origin.lng + point.x / metersPerDegreeLng
  };
}
function createRouteSegments() {
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
function confidenceLevel(confidence) {
  if (confidence >= highConfidenceThreshold) return "high";
  if (confidence >= minGoodConfidence) return "estimated";
  return "low";
}
function scoreByRange(value, good, review, poor) {
  if (value <= good) return 1;
  if (value <= review) return 1 - (value - good) / Math.max(1, review - good) * 0.35;
  if (value <= poor) return 0.45 - (value - review) / Math.max(1, poor - review) * 0.25;
  return 0.12;
}
function altitudeReliability(point) {
  if (point.altitudeM === null || point.altitudeM <= 350 || point.altitudeM >= 750) {
    return 0;
  }
  if (point.altitudeAccuracyM === null) {
    return 0.35;
  }
  return scoreByRange(point.altitudeAccuracyM, 12, 35, 80);
}
function projectToSegment(point, segment) {
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
function expectedAltitudeForSteps(steps) {
  const clamped = clamp(steps, routeWaypoints[0].steps, routeWaypoints.at(-1)?.steps ?? steps);
  const segment = routeSegments.find((item) => clamped >= item.start.steps && clamped <= item.end.steps) ?? routeSegments.at(-1);
  if (!segment) return routeWaypoints[0].altM;
  const stepSpan = Math.max(1, segment.end.steps - segment.start.steps);
  const t = clamp((clamped - segment.start.steps) / stepSpan, 0, 1);
  return segment.start.altM + t * (segment.end.altM - segment.start.altM);
}
function routeDistanceForSteps(steps) {
  const clamped = clamp(steps, routeWaypoints[0].steps, routeWaypoints.at(-1)?.steps ?? steps);
  const segment = routeSegments.find((item) => clamped >= item.start.steps && clamped <= item.end.steps) ?? routeSegments.at(-1);
  if (!segment) return 0;
  const stepSpan = Math.max(1, segment.end.steps - segment.start.steps);
  const t = clamp((clamped - segment.start.steps) / stepSpan, 0, 1);
  return segment.startDistanceM + t * segment.lengthM;
}
function getRouteLengthMeters() {
  return totalRouteDistanceM;
}
function matchPointToRoute(point, config, expectedSteps) {
  const altitudeTrust = altitudeReliability(point);
  const altitudeAvailable = altitudeTrust > 0;
  const pointAltitudeM = altitudeAvailable ? point.altitudeM : null;
  const candidates = routeSegments.map((segment) => {
    const projected = projectToSegment(point, segment);
    const altitudeDeltaM = pointAltitudeM === null ? null : pointAltitudeM - projected.expectedAltitudeM;
    const altitudePenalty = altitudeDeltaM === null ? 0 : Math.min(28, Math.abs(altitudeDeltaM) * 0.45 * altitudeTrust);
    const continuityPenalty = expectedSteps === null || expectedSteps === void 0 ? 0 : Math.min(65, Math.abs(projected.progressSteps - expectedSteps) * 0.08);
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
  const altitudeScore = best.altitudeDeltaM === null ? 0.66 : scoreByRange(Math.abs(best.altitudeDeltaM), 14, 32, 60);
  let confidence = clamp(accuracyScore * 0.46 + routeScore * 0.42 + altitudeScore * 0.12, 0, 1);
  const offRoute = best.projected.distanceToRouteM > Math.max(55, point.accuracyM + 25);
  if (offRoute) {
    confidence = Math.min(confidence, 0.35);
  }
  const flags = [];
  if (point.accuracyM > config.gpsAccuracyReviewMaxM) flags.push("gps_accuracy_low");
  if (offRoute) flags.push("off_route");
  if (best.altitudeDeltaM !== null && Math.abs(best.altitudeDeltaM) > 65 && altitudeTrust >= 0.65) {
    flags.push("altitude_mismatch");
  } else if (best.altitudeDeltaM !== null && Math.abs(best.altitudeDeltaM) > 65) {
    flags.push("altitude_unreliable");
  }
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
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
function positiveOrNull(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}
function analyzeRouteTrack(points, config) {
  if (points.length === 0) {
    return {
      pointCount: 0,
      matchedPointCount: 0,
      highConfidencePointCount: 0,
      estimatedPointCount: 0,
      lowConfidencePointCount: 0,
      offRoutePointCount: 0,
      impossibleJumpCount: 0,
      physicalJumpEventCount: 0,
      routeRematchEventCount: 0,
      maxJumpDisplacementM: 0,
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
      cumulativeAscentM: null,
      interpretedElevationGainM: 0,
      averageConfidence: 0,
      confidenceLevel: "low",
      routeAdherenceRatio: 0,
      lowConfidenceRatio: 1,
      offRouteRatio: 1,
      continuityScore: 0,
      altitudeConsistencyRatio: null,
      altitudeDriftM: null,
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
  let lastAcceptedAt = null;
  let lastPoint = null;
  let backwardJumpCount = 0;
  let largeGapCount = 0;
  let longestGapSeconds = 0;
  let projectedDistanceMeters = 0;
  const ascentNoiseThresholdM = 1.5;
  let cumulativeAscentM = 0;
  let ascentAnchorAltitudeM = null;
  const matchedBands = /* @__PURE__ */ new Set();
  const altitudeConsistency = [];
  const altitudeDeltas = [];
  const telemetry = [];
  const jumpSamples = [];
  let startAnchorSteps = 0;
  let startAnchorLocked = false;
  function withStartAnchor(steps) {
    if (startAnchorSteps <= 0) {
      return steps;
    }
    const fade = clamp(1 - (steps - startAnchorSteps) / startAnchorFadeSteps, 0, 1);
    return clamp(steps - startAnchorSteps * fade, 0, config.totalSteps);
  }
  sorted.forEach((point) => {
    const currentAt = new Date(point.recordedAt).getTime();
    const previousAt = lastPoint ? new Date(lastPoint.recordedAt).getTime() : currentAt;
    const dt = Math.max(0, (currentAt - previousAt) / 1e3);
    const match = matchPointToRoute(point, config, filteredSteps);
    const flags = [...match.flags];
    let inferred = false;
    let routeSpeedMps = null;
    let rawDistance = 0;
    let rawSpeed = 0;
    if (lastPoint && dt > 0) {
      rawDistance = haversineDistanceMeters(lastPoint, point);
      rawSpeed = rawDistance / dt;
      if (rawSpeed > physicalSpeedMps) {
        flags.push("impossible_raw_jump");
        jumpSamples.push({
          atMs: currentAt,
          speedMps: rawSpeed,
          displacementM: rawDistance,
          routeSnap: false,
          accuracyBudgetM: lastPoint.accuracyM + point.accuracyM,
          fromLat: lastPoint.lat,
          fromLng: lastPoint.lng,
          toLat: point.lat,
          toLng: point.lng
        });
      }
      if (dt > 20) {
        largeGapCount += 1;
        longestGapSeconds = Math.max(longestGapSeconds, dt);
        flags.push("large_gap");
      }
    }
    if (!startAnchorLocked) {
      const distanceToStartM = haversineDistanceMeters(point, { lat: config.startLat, lng: config.startLng });
      if (distanceToStartM <= startAnchorRadiusM) {
        if (match.confidence >= minGoodConfidence && !match.offRoute) {
          startAnchorSteps = clamp(
            Math.max(startAnchorSteps, match.progressSteps),
            0,
            maxStartAnchorSteps
          );
        }
      } else if (startAnchorSteps > 0 || telemetry.length > 0) {
        startAnchorLocked = true;
      }
    }
    const canUseMeasuredMatch = match.confidence >= minGoodConfidence && !match.offRoute;
    const previousSteps = filteredSteps;
    if (canUseMeasuredMatch) {
      const maxForward = dt > 0 ? dt * maxForwardStepsPerSecond : config.totalSteps;
      const maxBackward = Math.max(18, dt * maxBackDriftStepsPerSecond);
      if (match.progressSteps > previousSteps + maxForward + 45) {
        if (rawSpeed <= pedestrianSpeedMps) {
          flags.push("route_rematch");
        } else {
          flags.push("impossible_route_jump");
        }
        jumpSamples.push({
          atMs: currentAt,
          speedMps: rawSpeed,
          displacementM: rawDistance,
          routeSnap: true,
          accuracyBudgetM: lastPoint ? lastPoint.accuracyM + point.accuracyM : point.accuracyM,
          fromLat: lastPoint?.lat,
          fromLng: lastPoint?.lng,
          toLat: point.lat,
          toLng: point.lng
        });
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
      const secondsSinceAccepted = lastAcceptedAt === null ? Infinity : (currentAt - lastAcceptedAt) / 1e3;
      const onStepFreePath = stairsPerFootfallAt(previousSteps) === 0;
      const canInfer = previousSteps >= 25 && !onStepFreePath && filteredStepSpeed > 0 && secondsSinceAccepted <= 18 && dt > 0 && inferredSteps < maxInferredStepsPerRun;
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
    const completionThreshold = Math.max(config.totalSteps - 35, config.totalSteps * 0.96);
    if (filteredSteps < config.totalSteps && maxSteps >= completionThreshold && filteredSteps >= config.totalSteps - 55 && point.accuracyM <= config.gpsAccuracyReviewMaxM && haversineDistanceMeters(point, { lat: config.endLat, lng: config.endLng }) <= config.endRadiusM) {
      filteredSteps = config.totalSteps;
      maxSteps = config.totalSteps;
      flags.push("end_zone_completion");
    }
    const altitudeCanJudge = point.altitudeM !== null && (point.altitudeAccuracyM === null || point.altitudeAccuracyM <= 65);
    if (match.altitudeDeltaM !== null && altitudeCanJudge) {
      altitudeConsistency.push(Math.abs(match.altitudeDeltaM) <= 45);
      altitudeDeltas.push(match.altitudeDeltaM);
    }
    if (point.altitudeM !== null && altitudeCanJudge) {
      if (ascentAnchorAltitudeM === null) {
        ascentAnchorAltitudeM = point.altitudeM;
      } else {
        const altitudeDelta = point.altitudeM - ascentAnchorAltitudeM;
        if (altitudeDelta >= ascentNoiseThresholdM) {
          cumulativeAscentM += altitudeDelta;
          ascentAnchorAltitudeM = point.altitudeM;
        } else if (altitudeDelta <= -ascentNoiseThresholdM) {
          ascentAnchorAltitudeM = point.altitudeM;
        }
      }
    }
    const item = {
      recordedAt: point.recordedAt,
      rawLat: point.lat,
      rawLng: point.lng,
      projectedLat: match.projectedLat,
      projectedLng: match.projectedLng,
      segmentIndex: match.segmentIndex,
      progressSteps: Math.round(match.progressSteps),
      filteredSteps: Math.round(withStartAnchor(filteredSteps)),
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
  const altitudeConsistencyRatio = altitudeConsistency.length ? altitudeConsistency.filter(Boolean).length / altitudeConsistency.length : null;
  const driftWindow = 30;
  const altitudeDriftM = altitudeDeltas.length >= driftWindow * 2 ? median(altitudeDeltas.slice(-driftWindow)) - median(altitudeDeltas.slice(0, driftWindow)) : null;
  const firstAltitude = sorted.find((point) => point.altitudeM !== null)?.altitudeM ?? null;
  const lastAltitude = [...sorted].reverse().find((point) => point.altitudeM !== null)?.altitudeM ?? null;
  const altitudeGainM = firstAltitude === null || lastAltitude === null ? null : lastAltitude - firstAltitude;
  const interpretedElevationGainM = expectedAltitudeForSteps(maxSteps) - expectedAltitudeForSteps(0);
  const rawSpeedValues = sorted.map((point) => point.speedMps).filter((value) => value !== null && Number.isFinite(value) && value >= 0);
  const filteredSpeedMps = positiveOrNull(filteredStepSpeed / config.totalSteps * getRouteLengthMeters());
  const finalSteps = Math.round(clamp(telemetry.at(-1)?.filteredSteps ?? filteredSteps, 0, config.totalSteps));
  const durationSeconds = Math.max(
    0,
    (new Date(sorted.at(-1)?.recordedAt ?? sorted[0].recordedAt).getTime() - new Date(sorted[0].recordedAt).getTime()) / 1e3
  );
  const jumpEvents = classifyJumpEvents(jumpSamples);
  return {
    pointCount: sorted.length,
    matchedPointCount: usablePoints,
    highConfidencePointCount,
    estimatedPointCount,
    lowConfidencePointCount,
    offRoutePointCount,
    impossibleJumpCount: jumpEvents.physicalJumpEventCount,
    physicalJumpEventCount: jumpEvents.physicalJumpEventCount,
    routeRematchEventCount: jumpEvents.routeRematchEventCount,
    maxJumpDisplacementM: jumpEvents.maxJumpDisplacementM,
    backwardJumpCount,
    largeGapCount,
    longestGapSeconds,
    finalSteps,
    maxSteps: Math.round(clamp(withStartAnchor(maxSteps), 0, config.totalSteps)),
    progressRatio: clamp(withStartAnchor(maxSteps) / config.totalSteps, 0, 1),
    rawDistanceMeters: calculateRouteDistance(sorted),
    projectedDistanceMeters,
    routeDistanceMeters: getRouteLengthMeters(),
    altitudeGainM,
    cumulativeAscentM: ascentAnchorAltitudeM === null ? null : Math.round(cumulativeAscentM * 10) / 10,
    interpretedElevationGainM,
    averageConfidence,
    confidenceLevel: confidenceLevel(averageConfidence),
    routeAdherenceRatio,
    lowConfidenceRatio,
    offRouteRatio,
    continuityScore,
    altitudeConsistencyRatio,
    altitudeDriftM: altitudeDriftM === null ? null : Math.round(altitudeDriftM * 10) / 10,
    filteredSpeedMps,
    rawSpeedMps: rawSpeedValues.length ? mean(rawSpeedValues) : null,
    pacePer100Steps: durationSeconds > 0 && finalSteps > 0 ? durationSeconds / (finalSteps / 100) : null,
    inferredSteps: Math.round(inferredSteps),
    telemetry
  };
}

// src/lib/validation/validateRun.ts
function average(values) {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function validateRun(run, points, config, references = {}) {
  const reasons = [];
  const invalidReasons = [];
  const reviewReasons = [];
  const checks = [];
  function record(rule, label, measured, level, reason) {
    checks.push({ rule, label, measured, level });
    if (!reason) {
      return;
    }
    if (level === "pass") {
      reasons.push(reason);
    } else if (level === "review") {
      reviewReasons.push(reason);
    } else {
      invalidReasons.push(reason);
    }
  }
  const startedAt = new Date(run.startedAt).getTime();
  const endedAt = run.endedAt ? new Date(run.endedAt).getTime() : Date.now();
  const durationSeconds = Math.max(0, (endedAt - startedAt) / 1e3);
  const startPoint = references.start ?? stableEdgePoint(points, "start");
  const endPoint = references.end ?? stableEdgePoint(points, "end");
  const tracking = analyzeRouteTrack(points, config);
  const accuracyValues = points.map((point) => point.accuracyM).filter(Number.isFinite);
  const gpsAccuracyAverage = average(accuracyValues);
  const gpsAccuracyMin = accuracyValues.length > 0 ? Math.min(...accuracyValues) : null;
  const gpsAccuracyMax = accuracyValues.length > 0 ? Math.max(...accuracyValues) : null;
  const startDistanceToZone = startPoint ? haversineDistanceMeters(startPoint, { lat: config.startLat, lng: config.startLng }) : null;
  const endDistanceToZone = endPoint ? haversineDistanceMeters(endPoint, { lat: config.endLat, lng: config.endLng }) : null;
  const elevationGain = startPoint?.altitudeM !== null && startPoint?.altitudeM !== void 0 && endPoint?.altitudeM !== null && endPoint?.altitudeM !== void 0 ? endPoint.altitudeM - startPoint.altitudeM : null;
  const cumulativeAscentM = tracking.cumulativeAscentM;
  const completionThresholdSteps = Math.max(config.totalSteps - 35, config.totalSteps * 0.96);
  const routeCompletionStrong = tracking.maxSteps >= completionThresholdSteps && tracking.finalSteps >= config.totalSteps - 55;
  const endZonePlausible = endDistanceToZone !== null && endDistanceToZone <= config.endRadiusM * 1.75;
  const startZonePlausible = startDistanceToZone !== null && startDistanceToZone <= config.startRadiusM * 1.75;
  const firstRouteLock = tracking.telemetry.find(
    (point) => point.confidenceLevel !== "low" && !point.offRoute
  );
  const lastRouteLock = [...tracking.telemetry].reverse().find(
    (point) => point.confidenceLevel !== "low" && !point.offRoute
  );
  const earlyRawGpsUnreliable = points.slice(0, 5).some(
    (point) => point.accuracyM > config.gpsAccuracyReviewMaxM || (point.altitudeAccuracyM ?? 0) > 80
  );
  const lateRawGpsUnreliable = points.slice(-5).some(
    (point) => point.accuracyM > config.gpsAccuracyReviewMaxM || (point.altitudeAccuracyM ?? 0) > 80
  );
  const startRecoveredByRoute = routeCompletionStrong && earlyRawGpsUnreliable && firstRouteLock !== void 0 && firstRouteLock.filteredSteps <= 150 && tracking.continuityScore >= 0.5 && tracking.routeAdherenceRatio >= 0.58;
  const endRecoveredByRoute = routeCompletionStrong && lateRawGpsUnreliable && lastRouteLock !== void 0 && lastRouteLock.filteredSteps >= config.totalSteps - 65 && tracking.continuityScore >= 0.5 && tracking.routeAdherenceRatio >= 0.58;
  const interpretedElevationValid = tracking.interpretedElevationGainM >= config.elevationValidMinM && tracking.interpretedElevationGainM <= config.elevationValidMaxM;
  const interpretedElevationReview = tracking.interpretedElevationGainM >= config.elevationReviewMinM && tracking.interpretedElevationGainM <= config.elevationReviewMaxM;
  const altitudeDriftMaxM = 20;
  const altitudeSelfConsistent = tracking.altitudeDriftM === null || Math.abs(tracking.altitudeDriftM) <= altitudeDriftMaxM;
  const edgeAltitudeReliable = (startPoint?.altitudeAccuracyM ?? Infinity) <= 35 && (endPoint?.altitudeAccuracyM ?? Infinity) <= 35 && altitudeSelfConsistent;
  const strongCompletionEvidence = routeCompletionStrong && (endZonePlausible || endRecoveredByRoute) && (startZonePlausible || startRecoveredByRoute) && tracking.routeAdherenceRatio >= 0.62 && tracking.continuityScore >= 0.5 && tracking.averageConfidence >= 0.45;
  const pointCountMeasured = `${points.length} GPS-Punkte aufgezeichnet`;
  if (points.length < 3) {
    record("pointCount", "GPS-Punkte", pointCountMeasured, "fail", "Zu wenige GPS-Punkte für eine Prüfung.");
  } else if (points.length < 8) {
    record("pointCount", "GPS-Punkte", pointCountMeasured, "review", "Wenige GPS-Punkte, Ergebnis braucht Prüfung.");
  } else {
    record("pointCount", "GPS-Punkte", pointCountMeasured, "pass");
  }
  const startZoneMeasured = startDistanceToZone === null ? "keine stabile Start-Referenz" : `${Math.round(startDistanceToZone)} m vom Referenzpunkt (Radius ${Math.round(config.startRadiusM)} m)`;
  if (startDistanceToZone === null) {
    record("startZone", "Startzone", startZoneMeasured, "fail", "Startzone konnte nicht geprüft werden.");
  } else if (startDistanceToZone <= config.startRadiusM) {
    record("startZone", "Startzone", startZoneMeasured, "pass", "Startzone erfüllt.");
  } else if (startRecoveredByRoute) {
    record("startZone", "Startzone", startZoneMeasured, "pass", "Startzone über frühen Routenlock plausibel.");
  } else if (startDistanceToZone <= config.startRadiusM * 1.75) {
    record("startZone", "Startzone", startZoneMeasured, "review", "Startzone knapp außerhalb des Kernbereichs.");
  } else {
    record("startZone", "Startzone", startZoneMeasured, "fail", "Startzone nicht erfüllt.");
  }
  const endZoneMeasured = endDistanceToZone === null ? "keine stabile Ziel-Referenz" : `${Math.round(endDistanceToZone)} m vom Referenzpunkt (Radius ${Math.round(config.endRadiusM)} m)`;
  if (endDistanceToZone === null) {
    record("endZone", "Zielzone", endZoneMeasured, "fail", "Zielzone konnte nicht geprüft werden.");
  } else if (endDistanceToZone <= config.endRadiusM) {
    record("endZone", "Zielzone", endZoneMeasured, "pass", "Zielzone erfüllt.");
  } else if (endRecoveredByRoute) {
    record("endZone", "Zielzone", endZoneMeasured, "pass", "Zielzone über letzten Routenlock plausibel.");
  } else if (endDistanceToZone <= config.endRadiusM * 1.75) {
    record("endZone", "Zielzone", endZoneMeasured, "review", "Zielzone knapp außerhalb des Kernbereichs.");
  } else {
    record("endZone", "Zielzone", endZoneMeasured, "fail", "Zielzone nicht erfüllt.");
  }
  const accuracyMeasured = gpsAccuracyAverage === null ? "keine Genauigkeitswerte" : `Ø ±${Math.round(gpsAccuracyAverage)} m (min ±${Math.round(gpsAccuracyMin ?? 0)} m, max ±${Math.round(gpsAccuracyMax ?? 0)} m, gültig ≤ ${Math.round(config.gpsAccuracyValidMaxM)} m)`;
  if (gpsAccuracyAverage === null) {
    record("gpsAccuracy", "GPS-Genauigkeit", accuracyMeasured, "review", "GPS-Genauigkeit fehlt.");
  } else if (gpsAccuracyAverage <= config.gpsAccuracyValidMaxM) {
    record("gpsAccuracy", "GPS-Genauigkeit", accuracyMeasured, "pass", "GPS-Genauigkeit ausreichend.");
  } else if (gpsAccuracyAverage <= config.gpsAccuracyReviewMaxM) {
    record("gpsAccuracy", "GPS-Genauigkeit", accuracyMeasured, "review", "GPS-Genauigkeit braucht Prüfung.");
  } else if (gpsAccuracyAverage <= config.gpsAccuracyReviewMaxM * 1.6 && tracking.averageConfidence >= 0.55) {
    record("gpsAccuracy", "GPS-Genauigkeit", accuracyMeasured, "review", "GPS war im Wald ungenau, Route bleibt aber plausibel.");
  } else if (strongCompletionEvidence && gpsAccuracyAverage <= config.gpsAccuracyReviewMaxM * 2.3) {
    record("gpsAccuracy", "GPS-Genauigkeit", accuracyMeasured, "review", "GPS war zeitweise sehr ungenau, der vollständige Routenverlauf bleibt plausibel.");
  } else {
    record("gpsAccuracy", "GPS-Genauigkeit", accuracyMeasured, "fail", "GPS-Genauigkeit zu ungenau.");
  }
  const durationMeasured = `${Math.round(durationSeconds)} s (erlaubt ${config.minDurationSeconds}–${config.maxDurationSeconds} s)`;
  if (durationSeconds < config.minDurationSeconds) {
    record("duration", "Zeit", durationMeasured, "fail", "Zeit ist zu kurz für die Strecke.");
  } else if (durationSeconds > config.maxDurationSeconds) {
    record("duration", "Zeit", durationMeasured, "fail", "Zeit liegt außerhalb des erlaubten Bereichs.");
  } else {
    record("duration", "Zeit", durationMeasured, "pass", "Zeit plausibel.");
  }
  const ascentInfo = cumulativeAscentM === null ? "" : `, kumulativ ${Math.round(cumulativeAscentM)} m`;
  const driftInfo = altitudeSelfConsistent ? "" : `; Geräte-Höhe driftet um ${Math.round(tracking.altitudeDriftM ?? 0)} m gegen das Routenprofil, Routenmodell ${Math.round(tracking.interpretedElevationGainM)} m`;
  const elevationMeasured = elevationGain === null ? `keine verwertbaren Höhendaten an Start/Ziel${ascentInfo} (Routenmodell ${Math.round(tracking.interpretedElevationGainM)} m)` : `${Math.round(elevationGain)} m Anstieg Start→Ziel${ascentInfo}${driftInfo} (gültig ${Math.round(config.elevationValidMinM)}–${Math.round(config.elevationValidMaxM)} m)`;
  if (elevationGain === null) {
    if (interpretedElevationValid && strongCompletionEvidence) {
      record("elevation", "Höhenmeter", elevationMeasured, "pass", "Höhenprofil über Routenmodell plausibel.");
    } else if (interpretedElevationReview) {
      record("elevation", "Höhenmeter", elevationMeasured, "review", "GPS-Höhe fehlt, Höhenprofil wird über Route geschätzt.");
    } else {
      record("elevation", "Höhenmeter", elevationMeasured, "review", "Höhenprofil fehlt, Ergebnis braucht Prüfung.");
    }
  } else if (elevationGain >= config.elevationValidMinM && elevationGain <= config.elevationValidMaxM) {
    record("elevation", "Höhenmeter", elevationMeasured, "pass", "Höhenprofil plausibel.");
  } else if (elevationGain >= config.elevationReviewMinM && elevationGain <= config.elevationReviewMaxM) {
    if (interpretedElevationValid && strongCompletionEvidence && (startRecoveredByRoute || endRecoveredByRoute || !edgeAltitudeReliable)) {
      record("elevation", "Höhenmeter", elevationMeasured, "pass", "GPS-Höhe war unruhig, Höhenprofil über Routenmodell plausibel.");
    } else {
      record("elevation", "Höhenmeter", elevationMeasured, "review", "Höhenprofil im Prüfbereich.");
    }
  } else if (interpretedElevationValid && strongCompletionEvidence && !edgeAltitudeReliable) {
    record("elevation", "Höhenmeter", elevationMeasured, "pass", "GPS-Höhe war unruhig, Höhenprofil über Routenmodell plausibel.");
  } else if (interpretedElevationReview && routeCompletionStrong && endZonePlausible && !edgeAltitudeReliable) {
    record("elevation", "Höhenmeter", elevationMeasured, "review", "GPS-Höhe war unruhig, Routen-Höhenprofil bleibt plausibel.");
  } else if (!altitudeSelfConsistent && interpretedElevationReview) {
    record("elevation", "Höhenmeter", elevationMeasured, "review", "Geräte-Höhe driftet und ist nicht verwertbar; das Routen-Höhenprofil liegt im Prüfbereich.");
  } else {
    record("elevation", "Höhenmeter", elevationMeasured, "fail", "Höhenprofil nicht plausibel.");
  }
  const progressMeasured = `${tracking.maxSteps} von ${config.totalSteps} Stufen erreicht`;
  if (routeCompletionStrong) {
    record("routeProgress", "Routenfortschritt", progressMeasured, "pass", "Routenfortschritt bis zur Zielzone plausibel.");
  } else if (tracking.maxSteps >= config.totalSteps * 0.9 && endDistanceToZone !== null && endDistanceToZone <= config.endRadiusM * 1.75) {
    record("routeProgress", "Routenfortschritt", progressMeasured, "review", "Routenfortschritt fast vollständig, Ergebnis braucht Prüfung.");
  } else {
    record("routeProgress", "Routenfortschritt", progressMeasured, "fail", "Routenfortschritt erreicht die 1150 Stufen nicht plausibel.");
  }
  const adherenceMeasured = `${Math.round(tracking.routeAdherenceRatio * 100)} % der Punkte im Treppenkorridor`;
  if (tracking.routeAdherenceRatio >= 0.82) {
    record("adherence", "Treppenkorridor", adherenceMeasured, "pass", "Bewegung bleibt im Treppenkorridor.");
  } else if (tracking.routeAdherenceRatio >= 0.62) {
    record("adherence", "Treppenkorridor", adherenceMeasured, "review", "Ein Teil der GPS-Punkte liegt außerhalb des Treppenkorridors.");
  } else if (routeCompletionStrong && endZonePlausible && tracking.routeAdherenceRatio >= 0.52) {
    record("adherence", "Treppenkorridor", adherenceMeasured, "review", "Viele GPS-Punkte waren seitlich ungenau, Abschluss und Route bleiben prüfbar.");
  } else {
    record("adherence", "Treppenkorridor", adherenceMeasured, "fail", "Zu viele Punkte liegen außerhalb des Treppenkorridors.");
  }
  const levelOf = (rule) => checks.find((check) => check.rule === rule)?.level;
  const coreChecksPass = ["startZone", "endZone", "gpsAccuracy", "duration", "elevation", "adherence"].every((rule) => levelOf(rule) === "pass");
  const physicalJumps = tracking.physicalJumpEventCount;
  const rematches = tracking.routeRematchEventCount;
  const maxDisplacement = Math.round(tracking.maxJumpDisplacementM);
  const rematchInfo = rematches > 0 ? `${rematches} Ereignis${rematches === 1 ? "" : "se"} ohne echten Ortswechsel (GPS-Ausreißer/Neuzuordnung, kein GPS-Sprung)` : "";
  const jumpsMeasured = physicalJumps > 0 ? `${physicalJumps} physische${physicalJumps === 1 ? "s" : ""} Sprung-Ereignis${physicalJumps === 1 ? "" : "se"}, max. Versatz ${maxDisplacement} m${rematchInfo ? `; ${rematchInfo}` : ""}` : rematchInfo || "keine unrealistischen GPS-Sprünge";
  if (physicalJumps >= 3 || tracking.maxJumpDisplacementM > 300) {
    if (coreChecksPass) {
      record("jumps", "GPS-Sprünge", jumpsMeasured, "review", "GPS-Sprünge erkannt, aber Start, Ziel, Zeit, Höhe und Korridor sind plausibel — Ergebnis braucht Prüfung.");
    } else {
      record("jumps", "GPS-Sprünge", jumpsMeasured, "fail", "Mehrere unrealistische GPS-Sprünge erkannt.");
    }
  } else if (physicalJumps > 0) {
    record("jumps", "GPS-Sprünge", jumpsMeasured, "review", "Einzelne GPS-Sprünge erkannt.");
  } else if (rematches > 0) {
    record("jumps", "GPS-Sprünge", jumpsMeasured, "pass", "GPS-Ausschlag ohne echten Ortswechsel, Route plausibel fortgesetzt.");
  } else if (points.length > 1 && tracking.routeAdherenceRatio >= 0.75) {
    record("jumps", "GPS-Sprünge", jumpsMeasured, "pass", "Route plausibel.");
  } else {
    record("jumps", "GPS-Sprünge", jumpsMeasured, "pass");
  }
  const continuityMeasured = `${Math.round(tracking.continuityScore * 100)} % der Streckenabschnitte erfasst`;
  if (tracking.continuityScore >= 0.58) {
    record("continuity", "Kontinuität", continuityMeasured, "pass", "Fortschritt entlang der Route ausreichend kontinuierlich.");
  } else if (tracking.continuityScore >= 0.38) {
    record("continuity", "Kontinuität", continuityMeasured, "review", "Route wurde nur teilweise kontinuierlich erfasst.");
  } else if (routeCompletionStrong && endZonePlausible && // Gesperrter Bildschirm: iOS stoppt die Ortung, Start, Ziel, Zeit und Höhe
  // sind aber belegt. Das ist ein Prüffall, kein ungültiger Lauf.
  (tracking.continuityScore >= 0.3 || coreChecksPass)) {
    record("continuity", "Kontinuität", continuityMeasured, "review", "Routenabschnitte wurden lückenhaft erfasst, Zielabschluss bleibt prüfbar.");
  } else {
    record("continuity", "Kontinuität", continuityMeasured, "fail", "Route wurde nicht kontinuierlich genug erfasst.");
  }
  const confidenceMeasured = `${Math.round(tracking.averageConfidence * 100)} % mittlere Signalqualität`;
  if (tracking.averageConfidence >= 0.68) {
    record("confidence", "Signalqualität", confidenceMeasured, "pass", "Signalqualität hoch.");
  } else if (tracking.averageConfidence >= 0.45) {
    record("confidence", "Signalqualität", confidenceMeasured, "review", "Signalqualität reduziert, aber auswertbar.");
  } else {
    record("confidence", "Signalqualität", confidenceMeasured, "fail", "Signalqualität zu niedrig.");
  }
  if (tracking.altitudeConsistencyRatio !== null) {
    const altConsistencyMeasured = `${Math.round(tracking.altitudeConsistencyRatio * 100)} % der Höhenwerte passen zum Routenprofil`;
    if (tracking.altitudeConsistencyRatio >= 0.72) {
      record("altitudeConsistency", "Höhenprofil-Konsistenz", altConsistencyMeasured, "pass", "GPS-Höhe passt zum Routenprofil.");
    } else if (tracking.altitudeConsistencyRatio >= 0.45) {
      record("altitudeConsistency", "Höhenprofil-Konsistenz", altConsistencyMeasured, "review", "GPS-Höhe weicht teilweise vom Routenprofil ab.");
    } else if (interpretedElevationValid && strongCompletionEvidence && !edgeAltitudeReliable) {
      record("altitudeConsistency", "Höhenprofil-Konsistenz", altConsistencyMeasured, "pass", "GPS-Höhe war stark verrauscht, Routen-Höhenmodell ist plausibel.");
    } else {
      record("altitudeConsistency", "Höhenprofil-Konsistenz", altConsistencyMeasured, "fail", "GPS-Höhe passt nicht zum Routenprofil.");
    }
  }
  if (tracking.inferredSteps > 0) {
    record(
      "inferredSteps",
      "Geschätzte Stufen",
      `${tracking.inferredSteps} Stufen bei schwachem GPS konservativ geschätzt`,
      "review",
      `${tracking.inferredSteps} Stufen wurden bei schwachem GPS konservativ geschätzt.`
    );
  }
  const finishedInEndZone = routeCompletionStrong && endDistanceToZone !== null && endDistanceToZone <= config.endRadiusM;
  const estimatedSteps = finishedInEndZone ? config.totalSteps : Math.round(Math.max(tracking.finalSteps, tracking.maxSteps >= completionThresholdSteps ? tracking.maxSteps : tracking.finalSteps));
  const pacePer100Steps = durationSeconds > 0 && estimatedSteps > 0 ? durationSeconds / (estimatedSteps / 100) : null;
  const status = invalidReasons.length > 0 ? "invalid" : reviewReasons.length > 0 ? "needs_review" : "valid";
  const score = Math.max(0, 100 - invalidReasons.length * 35 - reviewReasons.length * 12);
  return {
    status,
    score,
    reasons: [...reasons, ...reviewReasons, ...invalidReasons],
    checks,
    metrics: {
      durationSeconds,
      elevationGain,
      cumulativeAscentM,
      gpsAccuracyAverage,
      gpsAccuracyMin,
      gpsAccuracyMax,
      startDistanceToZone,
      endDistanceToZone,
      estimatedSteps,
      pacePer100Steps,
      pointCount: points.length,
      routeDistanceMeters: calculateRouteDistance(points),
      routeProgressSteps: tracking.finalSteps,
      maxProgressSteps: tracking.maxSteps,
      routeConfidenceAverage: tracking.averageConfidence,
      routeConfidenceLevel: tracking.confidenceLevel,
      routeAdherenceRatio: tracking.routeAdherenceRatio,
      continuityScore: tracking.continuityScore,
      offRoutePointCount: tracking.offRoutePointCount,
      lowConfidencePointCount: tracking.lowConfidencePointCount,
      impossibleJumpCount: tracking.physicalJumpEventCount,
      inferredSteps: tracking.inferredSteps
    },
    tracking
  };
}

// src/lib/validation/verdict.ts
var num = (value) => value === null || value === void 0 ? null : Number(value);
function verdict(run, pointRows, configRow, now = Date.now()) {
  const config = fromConfigRow(configRow);
  const start = Date.parse(String(run.started_at));
  const end = Date.parse(String(run.ended_at));
  const points = pointRows.map((row) => ({
    recordedAt: String(row.recorded_at),
    lat: Number(row.lat),
    lng: Number(row.lng),
    altitudeM: num(row.altitude_m),
    altitudeAccuracyM: num(row.altitude_accuracy_m),
    accuracyM: Number(row.accuracy_m),
    speedMps: num(row.speed_mps),
    heading: num(row.heading)
  })).filter((point) => {
    const at = Date.parse(point.recordedAt);
    return at >= start - 5e3 && at <= end + 5e3;
  }).sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  const startReference = computeStableStartReference(points) ?? stableEdgePoint(points, "start");
  const endReference = stableEdgePoint(points, "end");
  const result = validateRun({ startedAt: String(run.started_at), endedAt: String(run.ended_at) }, points, config, {
    start: startReference,
    end: endReference
  });
  const timeOk = end > start && end <= now + 3e5;
  return {
    status: timeOk ? result.status : "invalid",
    validation_score: timeOk ? result.score : 0,
    validation_reasons: timeOk ? result.reasons : [...result.reasons, "Zeitangaben nicht plausibel."],
    validation_checks: result.checks,
    tracking_summary: { ...result.tracking, telemetry: [] },
    duration_seconds: result.metrics.durationSeconds,
    start_lat: startReference?.lat ?? null,
    start_lng: startReference?.lng ?? null,
    end_lat: endReference?.lat ?? null,
    end_lng: endReference?.lng ?? null,
    elevation_gain_m: result.metrics.elevationGain,
    gps_accuracy_avg_m: result.metrics.gpsAccuracyAverage,
    gps_accuracy_min_m: result.metrics.gpsAccuracyMin,
    gps_accuracy_max_m: result.metrics.gpsAccuracyMax,
    estimated_steps: result.metrics.estimatedSteps,
    pace_per_100_steps_seconds: result.metrics.pacePer100Steps
  };
}
export {
  verdict
};
