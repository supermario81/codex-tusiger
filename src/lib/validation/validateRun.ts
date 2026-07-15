import { calculateRouteDistance, haversineDistanceMeters, stableEdgePoint } from "../geo/geo";
import { analyzeRouteTrack } from "../geo/routeMatcher";
import type {
  ChallengeConfig,
  RunPoint,
  ValidationCheck,
  ValidationCheckLevel,
  ValidationResult
} from "../types";

// Optionale, bereits beim Lauf eingefrorene Referenzpunkte. Ohne sie werden
// die Referenzen aus der vollen Aufzeichnung berechnet (Median der ersten/
// letzten 5 guten Punkte) — niemals aus einem Puffer-Ausschnitt.
export type ValidationReferences = {
  start?: RunPoint | null;
  end?: RunPoint | null;
};

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function validateRun(
  run: { startedAt: string; endedAt: string | null },
  points: RunPoint[],
  config: ChallengeConfig,
  references: ValidationReferences = {}
): ValidationResult {
  const reasons: string[] = [];
  const invalidReasons: string[] = [];
  const reviewReasons: string[] = [];
  const checks: ValidationCheck[] = [];

  function record(
    rule: string,
    label: string,
    measured: string,
    level: ValidationCheckLevel,
    reason?: string
  ) {
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
  const durationSeconds = Math.max(0, (endedAt - startedAt) / 1000);
  const startPoint = references.start ?? stableEdgePoint(points, "start");
  const endPoint = references.end ?? stableEdgePoint(points, "end");
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

  const pointCountMeasured = `${points.length} GPS-Punkte aufgezeichnet`;
  if (points.length < 3) {
    record("pointCount", "GPS-Punkte", pointCountMeasured, "fail", "Zu wenige GPS-Punkte für eine Prüfung.");
  } else if (points.length < 8) {
    record("pointCount", "GPS-Punkte", pointCountMeasured, "review", "Wenige GPS-Punkte, Ergebnis braucht Prüfung.");
  } else {
    record("pointCount", "GPS-Punkte", pointCountMeasured, "pass");
  }

  const startZoneMeasured =
    startDistanceToZone === null
      ? "keine stabile Start-Referenz"
      : `${Math.round(startDistanceToZone)} m vom Referenzpunkt (Radius ${Math.round(config.startRadiusM)} m)`;
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

  const endZoneMeasured =
    endDistanceToZone === null
      ? "keine stabile Ziel-Referenz"
      : `${Math.round(endDistanceToZone)} m vom Referenzpunkt (Radius ${Math.round(config.endRadiusM)} m)`;
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

  const accuracyMeasured =
    gpsAccuracyAverage === null
      ? "keine Genauigkeitswerte"
      : `Ø ±${Math.round(gpsAccuracyAverage)} m (min ±${Math.round(gpsAccuracyMin ?? 0)} m, max ±${Math.round(gpsAccuracyMax ?? 0)} m, gültig ≤ ${Math.round(config.gpsAccuracyValidMaxM)} m)`;
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
  const elevationMeasured =
    elevationGain === null
      ? `keine verwertbaren Höhendaten an Start/Ziel${ascentInfo} (Routenmodell ${Math.round(tracking.interpretedElevationGainM)} m)`
      : `${Math.round(elevationGain)} m Anstieg Start→Ziel${ascentInfo} (gültig ${Math.round(config.elevationValidMinM)}–${Math.round(config.elevationValidMaxM)} m)`;
  if (elevationGain === null) {
    if (interpretedElevationValid && strongCompletionEvidence) {
      record("elevation", "Höhenmeter", elevationMeasured, "pass", "Höhenprofil über Routenmodell plausibel.");
    } else if (interpretedElevationReview) {
      record("elevation", "Höhenmeter", elevationMeasured, "review", "GPS-Höhe fehlt, Höhenprofil wird über Route geschätzt.");
    } else {
      record("elevation", "Höhenmeter", elevationMeasured, "review", "Höhenprofil fehlt, Ergebnis braucht Prüfung.");
    }
  } else if (
    elevationGain >= config.elevationValidMinM &&
    elevationGain <= config.elevationValidMaxM
  ) {
    record("elevation", "Höhenmeter", elevationMeasured, "pass", "Höhenprofil plausibel.");
  } else if (
    elevationGain >= config.elevationReviewMinM &&
    elevationGain <= config.elevationReviewMaxM
  ) {
    if (interpretedElevationValid && strongCompletionEvidence && (startRecoveredByRoute || endRecoveredByRoute || !edgeAltitudeReliable)) {
      record("elevation", "Höhenmeter", elevationMeasured, "pass", "GPS-Höhe war unruhig, Höhenprofil über Routenmodell plausibel.");
    } else {
      record("elevation", "Höhenmeter", elevationMeasured, "review", "Höhenprofil im Prüfbereich.");
    }
  } else if (interpretedElevationValid && strongCompletionEvidence && !edgeAltitudeReliable) {
    record("elevation", "Höhenmeter", elevationMeasured, "pass", "GPS-Höhe war unruhig, Höhenprofil über Routenmodell plausibel.");
  } else if (interpretedElevationReview && routeCompletionStrong && endZonePlausible && !edgeAltitudeReliable) {
    record("elevation", "Höhenmeter", elevationMeasured, "review", "GPS-Höhe war unruhig, Routen-Höhenprofil bleibt plausibel.");
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

  // Sprung-Anomalien: physische Ereignisse (Roh-GPS > 8 m/s über mehrere
  // Punkte oder Einzel-Versatz > 100 m) getrennt von Matcher-Neuzuordnungen.
  // Aggregations-Guard: Wer nachweislich von der Start- zur Zielreferenz mit
  // korrektem Anstieg im Korridor gelaufen ist, kann durch ein Sprung-Artefakt
  // nicht hart ungültig werden — höchstens needs_review.
  const levelOf = (rule: string) => checks.find((check) => check.rule === rule)?.level;
  const coreChecksPass = ["startZone", "endZone", "gpsAccuracy", "duration", "elevation", "adherence"]
    .every((rule) => levelOf(rule) === "pass");
  const physicalJumps = tracking.physicalJumpEventCount;
  const rematches = tracking.routeRematchEventCount;
  const maxDisplacement = Math.round(tracking.maxJumpDisplacementM);
  const rematchInfo = rematches > 0
    ? `${rematches} Ereignis${rematches === 1 ? "" : "se"} Matcher-Neuzuordnung (kein GPS-Sprung)`
    : "";
  const jumpsMeasured =
    physicalJumps > 0
      ? `${physicalJumps} physische${physicalJumps === 1 ? "s" : ""} Sprung-Ereignis${physicalJumps === 1 ? "" : "se"}, max. Versatz ${maxDisplacement} m${rematchInfo ? `; ${rematchInfo}` : ""}`
      : rematchInfo || "keine unrealistischen GPS-Sprünge";
  if (physicalJumps >= 3 || tracking.maxJumpDisplacementM > 300) {
    if (coreChecksPass) {
      record("jumps", "GPS-Sprünge", jumpsMeasured, "review", "GPS-Sprünge erkannt, aber Start, Ziel, Zeit, Höhe und Korridor sind plausibel — Ergebnis braucht Prüfung.");
    } else {
      record("jumps", "GPS-Sprünge", jumpsMeasured, "fail", "Mehrere unrealistische GPS-Sprünge erkannt.");
    }
  } else if (physicalJumps > 0) {
    record("jumps", "GPS-Sprünge", jumpsMeasured, "review", "Einzelne GPS-Sprünge erkannt.");
  } else if (rematches > 0) {
    record("jumps", "GPS-Sprünge", jumpsMeasured, "pass", "Route nach Matcher-Neuzuordnung plausibel fortgesetzt, kein GPS-Sprung.");
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
  } else if (routeCompletionStrong && endZonePlausible && tracking.continuityScore >= 0.3) {
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
