import { calculateRouteDistance, haversineDistanceMeters, stableEdgePoint } from "../geo/geo";
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

  if (points.length < 3) {
    invalidReasons.push("Zu wenige GPS-Punkte für eine Prüfung.");
  } else if (points.length < 8) {
    reviewReasons.push("Wenige GPS-Punkte, Ergebnis braucht Prüfung.");
  }

  if (startDistanceToZone === null) {
    invalidReasons.push("Startzone konnte nicht geprüft werden.");
  } else if (startDistanceToZone <= config.startRadiusM) {
    reasons.push("Startzone erfüllt.");
  } else if (startDistanceToZone <= config.startRadiusM * 1.75) {
    reviewReasons.push("Startzone knapp außerhalb des Kernbereichs.");
  } else {
    invalidReasons.push("Startzone nicht erfüllt.");
  }

  if (endDistanceToZone === null) {
    invalidReasons.push("Zielzone konnte nicht geprüft werden.");
  } else if (endDistanceToZone <= config.endRadiusM) {
    reasons.push("Zielzone erfüllt.");
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
    reviewReasons.push("Höhenprofil fehlt, Ergebnis braucht Prüfung.");
  } else if (
    elevationGain >= config.elevationValidMinM &&
    elevationGain <= config.elevationValidMaxM
  ) {
    reasons.push("Höhenprofil plausibel.");
  } else if (
    elevationGain >= config.elevationReviewMinM &&
    elevationGain <= config.elevationReviewMaxM
  ) {
    reviewReasons.push("Höhenprofil im Prüfbereich.");
  } else {
    invalidReasons.push("Höhenprofil nicht plausibel.");
  }

  const impossibleJumps = detectImpossibleJumps(points);
  if (impossibleJumps >= 3) {
    invalidReasons.push("Mehrere unrealistische GPS-Sprünge erkannt.");
  } else if (impossibleJumps > 0) {
    reviewReasons.push("Einzelne GPS-Sprünge erkannt.");
  } else if (points.length > 1) {
    reasons.push("Route plausibel.");
  }

  const estimatedSteps = config.totalSteps;
  const pacePer100Steps =
    durationSeconds > 0 ? durationSeconds / (config.totalSteps / 100) : null;
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
      routeDistanceMeters: calculateRouteDistance(points)
    }
  };
}
