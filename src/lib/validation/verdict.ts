import { computeStableStartReference, stableEdgePoint } from "../geo/geo";
import { fromConfigRow } from "../supabase/mappers";
import type { RunPoint } from "../types";
import { validateRun } from "./validateRun";

type Row = Record<string, unknown>;

const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));

/** Wertung eines Laufs aus den gespeicherten Rohdaten; liefert die Spalten für runs. */
export function verdict(run: Row, pointRows: Row[], configRow: Row, now = Date.now()) {
  const config = fromConfigRow(configRow);
  const start = Date.parse(String(run.started_at));
  const end = Date.parse(String(run.ended_at));
  // Nur das deklarierte Zeitfenster zählt: wer Start oder Ende verschiebt,
  // verliert damit die Punkte in der Start- bzw. Zielzone.
  const points: RunPoint[] = pointRows
    .map((row) => ({
      recordedAt: String(row.recorded_at),
      lat: Number(row.lat),
      lng: Number(row.lng),
      altitudeM: num(row.altitude_m),
      altitudeAccuracyM: num(row.altitude_accuracy_m),
      accuracyM: Number(row.accuracy_m),
      speedMps: num(row.speed_mps),
      heading: num(row.heading)
    }))
    .filter((point) => {
      const at = Date.parse(point.recordedAt);
      return at >= start - 5000 && at <= end + 5000;
    })
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));

  const startReference = computeStableStartReference(points) ?? stableEdgePoint(points, "start");
  const endReference = stableEdgePoint(points, "end");
  const result = validateRun({ startedAt: String(run.started_at), endedAt: String(run.ended_at) }, points, config, {
    start: startReference,
    end: endReference
  });
  const timeOk = end > start && end <= now + 300_000;
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
