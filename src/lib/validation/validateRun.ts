import { calculateRouteDistance, haversineDistanceMeters, stableEdgePoint } from "../geo/geo";
import { analyzeRouteTrack } from "../geo/routeMatcher";
import type { ChallengeConfig, RunPoint, ValidationResult } from "../types";

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function detectImpossibleJumps(points: RunPoint[]): number {
  return points.reduce((count, point, index) => {
    const previous = points[index - 1];
    if (!previous) {
      return count;
    }

    const distance = haversineDistanceMeters(previous, point);
    const seconds =
      (new Date(point.recordedAt).getTime() - new Date(previous.recordedAt).getTime()) / 1000;

    if (seconds <= 0) {
      return count;
    }

    return distance / seconds > 8 ? count + 1 : count;
  }, 0);
}

export function validateRun(
  run: { startedAt: string; endedAt: string | null },
  points: RunPoint[],
  config: ChallengeConfig
): ValidationResult {
  const reasons: string[] = [];
  const invalidReasons: string[] = [];
  const reviewReasons: string[] = [];
  const startedAt = new Date(run.startedAt).getTime();
  const endedAt = run.endedAt ? new Date(run.endedAt).getTime() : Date.now();
  const durationSeconds = Math.max(0, (endedAt - startedAt) / 1000);
  const startPoint = stableEdgePoint(points, "start");
  const endPoint = stableEdgePoint(points, "end");
  const tracking = analyzeRouteTrack(points, config);
  const accuracyValues = points.map((point) => point.accuracyM).filter(Number.isFinite);
  const gpsAccuracyAverage = average(accuracyValues);
  const gpsAccuracyMin = accuracyValues.length > 0 ? Math.min(...accuracyValues) : null;
  const gpsAccuracyMax = accuracyValues.length > 0 ? Math.max(...accuracyValues) : null;
  const startDistanceToZone = startPoint
    ? haversineDistanceMeters(startPoint, { lat: config.startLat, lng: config.startLng })
    : null;
  const endDistanceToZone = endPoint
    ? haversineDistanceMeters(endPoint, { lat: config.endLat, lng: config.endLng })
    : null;
  const elevationGain =
    startPoint?.altitudeM !== null &&
    startPoint?.altitudeM !== undefined &&
    endPoint?.altitudeM !== null &&
    endPoint?.altitudeM !== undefined
      ? endPoint.altitudeM - startPoint.altitudeM
      : null;
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
  const startRecoveredByRoute =
    routeCompletionStrong &&
    earlyRawGpsUnreliable &&
    firstRouteLock !== undefined &&
    firstRouteLock.filteredSteps <= 150 &&
    tracking.continuityScore >= 0.5 &&
    tracking.routeAdherenceRatio >= 0.58;
  const endRecoveredByRoute =
    routeCompletionStrong &&
    lateRawGpsUnreliable &&
    lastRouteLock !== undefined &&
    lastRouteLock.filteredSteps >= config.totalSteps - 65 &&
    tracking.continuityScore >= 0.5 &&
    tracking.routeAdherenceRatio >= 0.58;
  const interpretedElevationValid =
    tracking.interpretedElevationGainM >= config.elevationValidMinM &&
    tracking.interpretedElevationGainM <= config.elevationValidMaxM;
  const interpretedElevationReview =
    tracking.interpretedElevationGainM >= config.elevationReviewMinM &&
    tracking.interpretedElevationGainM <= config.elevationReviewMaxM;
  const edgeAltitudeReliable =
    (startPoint?.altitudeAccuracyM ?? Infinity) <= 35 &&
    (endPoint?.altitudeAccuracyM ?? Infinity) <= 35;
  const strongCompletionEvidence =
    routeCompletionStrong &&
    (endZonePlausible || endRecoveredByRoute) &&
    (startZonePlausible || startRecoveredByRoute) &&
    tracking.routeAdherenceRatio >= 0.62 &&
    tracking.continuityScore >= 0.5 &&
    tracking.averageConfidence >= 0.45;

  if (points.length < 3) {
    invalidReasons.push("Zu wenige GPS-Punkte für eine Prüfung.");
  } else if (points.length < 8) {
    reviewReasons.push("Wenige GPS-Punkte, Ergebnis braucht Prüfung.");
  }

  if (startDistanceToZone === null) {
    invalidReasons.push("Startzone konnte nicht geprüft werden.");
  } else if (startDistanceToZone <= config.startRadiusM) {
    reasons.push("Startzone erfüllt.");
  } else if (startRecoveredByRoute) {
    reasons.push("Startzone über frühen Routenlock plausibel.");
  } else if (startDistanceToZone <= config.startRadiusM * 1.75) {
    reviewReasons.push("Startzone knapp außerhalb des Kernbereichs.");
  } else {
    invalidReasons.push("Startzone nicht erfüllt.");
  }

  if (endDistanceToZone === null) {
    invalidReasons.push("Zielzone konnte nicht geprüft werden.");
  } else if (endDistanceToZone <= config.endRadiusM) {
    reasons.push("Zielzone erfüllt.");
  } else if (endRecoveredByRoute) {
    reasons.push("Zielzone über letzten Routenlock plausibel.");
  } else if (endDistanceToZone <= config.endRadiusM * 1.75) {
    reviewReasons.push("Zielzone knapp außerhalb des Kernbereichs.");
  } else {
    invalidReasons.push("Zielzone nicht erfüllt.");
  }

  if (gpsAccuracyAverage === null) {
    reviewReasons.push("GPS-Genauigkeit fehlt.");
  } else if (gpsAccuracyAverage <= config.gpsAccuracyValidMaxM) {
    reasons.push("GPS-Genauigkeit ausreichend.");
  } else if (gpsAccuracyAverage <= config.gpsAccuracyReviewMaxM) {
    reviewReasons.push("GPS-Genauigkeit braucht Prüfung.");
  } else if (gpsAccuracyAverage <= config.gpsAccuracyReviewMaxM * 1.6 && tracking.averageConfidence >= 0.55) {
    reviewReasons.push("GPS war im Wald ungenau, Route bleibt aber plausibel.");
  } else if (strongCompletionEvidence && gpsAccuracyAverage <= config.gpsAccuracyReviewMaxM * 2.3) {
    reviewReasons.push("GPS war zeitweise sehr ungenau, der vollständige Routenverlauf bleibt plausibel.");
  } else {
    invalidReasons.push("GPS-Genauigkeit zu ungenau.");
  }

  if (durationSeconds < config.minDurationSeconds) {
    invalidReasons.push("Zeit ist zu kurz für die Strecke.");
  } else if (durationSeconds > config.maxDurationSeconds) {
    invalidReasons.push("Zeit liegt außerhalb des erlaubten Bereichs.");
  } else {
    reasons.push("Zeit plausibel.");
  }

  if (elevationGain === null) {
    if (interpretedElevationValid && strongCompletionEvidence) {
      reasons.push("Höhenprofil über Routenmodell plausibel.");
    } else if (interpretedElevationReview) {
      reviewReasons.push("GPS-Höhe fehlt, Höhenprofil wird über Route geschätzt.");
    } else {
      reviewReasons.push("Höhenprofil fehlt, Ergebnis braucht Prüfung.");
    }
  } else if (
    elevationGain >= config.elevationValidMinM &&
    elevationGain <= config.elevationValidMaxM
  ) {
    reasons.push("Höhenprofil plausibel.");
  } else if (
    elevationGain >= config.elevationReviewMinM &&
    elevationGain <= config.elevationReviewMaxM
  ) {
    if (interpretedElevationValid && strongCompletionEvidence && (startRecoveredByRoute || endRecoveredByRoute || !edgeAltitudeReliable)) {
      reasons.push("GPS-Höhe war unruhig, Höhenprofil über Routenmodell plausibel.");
    } else {
      reviewReasons.push("Höhenprofil im Prüfbereich.");
    }
  } else if (interpretedElevationValid && strongCompletionEvidence && !edgeAltitudeReliable) {
    reasons.push("GPS-Höhe war unruhig, Höhenprofil über Routenmodell plausibel.");
  } else if (interpretedElevationReview && routeCompletionStrong && endZonePlausible && !edgeAltitudeReliable) {
    reviewReasons.push("GPS-Höhe war unruhig, Routen-Höhenprofil bleibt plausibel.");
  } else {
    invalidReasons.push("Höhenprofil nicht plausibel.");
  }

  const impossibleJumps = detectImpossibleJumps(points);
  const totalImpossibleJumps = impossibleJumps + tracking.impossibleJumpCount;
  if (totalImpossibleJumps >= 3) {
    invalidReasons.push("Mehrere unrealistische GPS-Sprünge erkannt.");
  } else if (totalImpossibleJumps > 0) {
    reviewReasons.push("Einzelne GPS-Sprünge erkannt.");
  } else if (points.length > 1 && tracking.routeAdherenceRatio >= 0.75) {
    reasons.push("Route plausibel.");
  }

  if (routeCompletionStrong) {
    reasons.push("Routenfortschritt bis zur Zielzone plausibel.");
  } else if (tracking.maxSteps >= config.totalSteps * 0.9 && endDistanceToZone !== null && endDistanceToZone <= config.endRadiusM * 1.75) {
    reviewReasons.push("Routenfortschritt fast vollständig, Ergebnis braucht Prüfung.");
  } else {
    invalidReasons.push("Routenfortschritt erreicht die 1150 Stufen nicht plausibel.");
  }

  if (tracking.routeAdherenceRatio >= 0.82) {
    reasons.push("Bewegung bleibt im Treppenkorridor.");
  } else if (tracking.routeAdherenceRatio >= 0.62) {
    reviewReasons.push("Ein Teil der GPS-Punkte liegt außerhalb des Treppenkorridors.");
  } else if (routeCompletionStrong && endZonePlausible && tracking.routeAdherenceRatio >= 0.52) {
    reviewReasons.push("Viele GPS-Punkte waren seitlich ungenau, Abschluss und Route bleiben prüfbar.");
  } else {
    invalidReasons.push("Zu viele Punkte liegen außerhalb des Treppenkorridors.");
  }

  if (tracking.continuityScore >= 0.58) {
    reasons.push("Fortschritt entlang der Route ausreichend kontinuierlich.");
  } else if (tracking.continuityScore >= 0.38) {
    reviewReasons.push("Route wurde nur teilweise kontinuierlich erfasst.");
  } else if (routeCompletionStrong && endZonePlausible && tracking.continuityScore >= 0.3) {
    reviewReasons.push("Routenabschnitte wurden lückenhaft erfasst, Zielabschluss bleibt prüfbar.");
  } else {
    invalidReasons.push("Route wurde nicht kontinuierlich genug erfasst.");
  }

  if (tracking.averageConfidence >= 0.68) {
    reasons.push("Signalqualität hoch.");
  } else if (tracking.averageConfidence >= 0.45) {
    reviewReasons.push("Signalqualität reduziert, aber auswertbar.");
  } else {
    invalidReasons.push("Signalqualität zu niedrig.");
  }

  if (tracking.altitudeConsistencyRatio !== null) {
    if (tracking.altitudeConsistencyRatio >= 0.72) {
      reasons.push("GPS-Höhe passt zum Routenprofil.");
    } else if (tracking.altitudeConsistencyRatio >= 0.45) {
      reviewReasons.push("GPS-Höhe weicht teilweise vom Routenprofil ab.");
    } else if (interpretedElevationValid && strongCompletionEvidence && !edgeAltitudeReliable) {
      reasons.push("GPS-Höhe war stark verrauscht, Routen-Höhenmodell ist plausibel.");
    } else {
      invalidReasons.push("GPS-Höhe passt nicht zum Routenprofil.");
    }
  }

  if (tracking.inferredSteps > 0) {
    reviewReasons.push(`${tracking.inferredSteps} Stufen wurden bei schwachem GPS konservativ geschätzt.`);
  }

  const estimatedSteps = Math.round(Math.max(tracking.finalSteps, tracking.maxSteps >= completionThresholdSteps ? tracking.maxSteps : tracking.finalSteps));
  const pacePer100Steps =
    durationSeconds > 0 && estimatedSteps > 0 ? durationSeconds / (estimatedSteps / 100) : null;
  const status =
    invalidReasons.length > 0 ? "invalid" : reviewReasons.length > 0 ? "needs_review" : "valid";
  const score = Math.max(0, 100 - invalidReasons.length * 35 - reviewReasons.length * 12);

  return {
    status,
    score,
    reasons: [...reasons, ...reviewReasons, ...invalidReasons],
    metrics: {
      durationSeconds,
      elevationGain,
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
      impossibleJumpCount: totalImpossibleJumps,
      inferredSteps: tracking.inferredSteps
    },
    tracking
  };
}
