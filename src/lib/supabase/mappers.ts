import type { ChallengeConfig, RunRecord } from "../types";

export function toRunInsert(run: RunRecord) {
  return {
    id: run.id,
    user_id: run.userId,
    started_at: run.startedAt,
    ended_at: run.endedAt,
    duration_seconds: run.durationSeconds,
    status: run.status,
    validation_score: run.validationScore,
    validation_reasons: run.validationReasons,
    start_lat: run.startLat,
    start_lng: run.startLng,
    end_lat: run.endLat,
    end_lng: run.endLng,
    elevation_gain_m: run.elevationGainM,
    gps_accuracy_avg_m: run.gpsAccuracyAvgM,
    gps_accuracy_min_m: run.gpsAccuracyMinM,
    gps_accuracy_max_m: run.gpsAccuracyMaxM,
    estimated_steps: run.estimatedSteps,
    pace_per_100_steps_seconds: run.pacePer100StepsSeconds
  };
}

export function fromConfigRow(row: Record<string, unknown>): ChallengeConfig {
  return {
    id: String(row.id),
    name: String(row.name),
    totalSteps: Number(row.total_steps),
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
