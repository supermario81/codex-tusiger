import type { ChallengeConfig, Group, HistoryItem, LegalPage, Profile, RunRecord } from "../types";

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

export function fromProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    nickname: String(row.nickname),
    avatarUrl: String(row.avatar_url ?? ""),
    language: row.language === "en" ? "en" : "de",
    showInPublicLeaderboard: row.show_in_public_leaderboard === undefined ? true : Boolean(row.show_in_public_leaderboard),
    role: row.role === "admin" ? "admin" : "user",
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export function fromRunRow(row: Record<string, unknown>): RunRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    startedAt: String(row.started_at),
    endedAt: row.ended_at ? String(row.ended_at) : null,
    durationSeconds: Number(row.duration_seconds ?? 0),
    status: row.status === "valid" || row.status === "needs_review" || row.status === "invalid" ? row.status : "draft",
    validationScore: Number(row.validation_score ?? 0),
    validationReasons: Array.isArray(row.validation_reasons) ? row.validation_reasons.map(String) : [],
    startLat: row.start_lat === null ? null : Number(row.start_lat),
    startLng: row.start_lng === null ? null : Number(row.start_lng),
    endLat: row.end_lat === null ? null : Number(row.end_lat),
    endLng: row.end_lng === null ? null : Number(row.end_lng),
    elevationGainM: row.elevation_gain_m === null ? null : Number(row.elevation_gain_m),
    gpsAccuracyAvgM: row.gps_accuracy_avg_m === null ? null : Number(row.gps_accuracy_avg_m),
    gpsAccuracyMinM: row.gps_accuracy_min_m === null ? null : Number(row.gps_accuracy_min_m),
    gpsAccuracyMaxM: row.gps_accuracy_max_m === null ? null : Number(row.gps_accuracy_max_m),
    estimatedSteps: Number(row.estimated_steps ?? 0),
    pacePer100StepsSeconds: row.pace_per_100_steps_seconds === null ? null : Number(row.pace_per_100_steps_seconds),
    points: []
  };
}

export function fromGroupRow(row: Record<string, unknown>, role = "member"): Group {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    inviteCode: String(row.invite_code),
    isPrivate: Boolean(row.is_private),
    memberCount: Number(row.member_count ?? 1),
    bestTimeSeconds: row.best_time_seconds === null || row.best_time_seconds === undefined ? null : Number(row.best_time_seconds),
    role: role === "owner" || role === "admin" ? role : "member"
  };
}

export function fromHistoryRow(row: Record<string, unknown>): HistoryItem {
  return {
    id: String(row.id),
    slug: String(row.slug ?? ""),
    language: row.language === "en" ? "en" : "de",
    sortOrder: Number(row.sort_order ?? 0),
    yearLabel: String(row.year_label ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? "")
  };
}

export function fromLegalRow(row: Record<string, unknown>): LegalPage {
  return {
    id: String(row.id),
    slug: String(row.slug),
    language: row.language === "en" ? "en" : "de",
    title: String(row.title),
    body: String(row.body ?? ""),
    version: String(row.version ?? "draft"),
    active: Boolean(row.active)
  };
}
