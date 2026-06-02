export type ValidationStatus = "valid" | "needs_review" | "invalid" | "draft";

export type ChallengeConfig = {
  id: string;
  name: string;
  totalSteps: number;
  startLat: number;
  startLng: number;
  startRadiusM: number;
  endLat: number;
  endLng: number;
  endRadiusM: number;
  expectedElevationGainM: number;
  elevationValidMinM: number;
  elevationValidMaxM: number;
  elevationReviewMinM: number;
  elevationReviewMaxM: number;
  gpsAccuracyValidMaxM: number;
  gpsAccuracyReviewMaxM: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  publishNeedsReview: boolean;
  donationUrl: string;
  active: boolean;
};

export type RunPoint = {
  recordedAt: string;
  lat: number;
  lng: number;
  altitudeM: number | null;
  altitudeAccuracyM: number | null;
  accuracyM: number;
  speedMps: number | null;
  heading: number | null;
};

export type TrackingConfidenceLevel = "high" | "estimated" | "low";

export type RoutePointTelemetry = {
  recordedAt: string;
  rawLat: number;
  rawLng: number;
  projectedLat: number;
  projectedLng: number;
  segmentIndex: number;
  progressSteps: number;
  filteredSteps: number;
  distanceToRouteM: number;
  accuracyM: number;
  rawAltitudeM: number | null;
  expectedAltitudeM: number;
  altitudeDeltaM: number | null;
  rawSpeedMps: number | null;
  routeSpeedMps: number | null;
  confidence: number;
  confidenceLevel: TrackingConfidenceLevel;
  offRoute: boolean;
  inferred: boolean;
  flags: string[];
};

export type RouteTrackSummary = {
  pointCount: number;
  matchedPointCount: number;
  highConfidencePointCount: number;
  estimatedPointCount: number;
  lowConfidencePointCount: number;
  offRoutePointCount: number;
  impossibleJumpCount: number;
  backwardJumpCount: number;
  largeGapCount: number;
  longestGapSeconds: number;
  finalSteps: number;
  maxSteps: number;
  progressRatio: number;
  rawDistanceMeters: number;
  projectedDistanceMeters: number;
  routeDistanceMeters: number;
  altitudeGainM: number | null;
  interpretedElevationGainM: number;
  averageConfidence: number;
  confidenceLevel: TrackingConfidenceLevel;
  routeAdherenceRatio: number;
  lowConfidenceRatio: number;
  offRouteRatio: number;
  continuityScore: number;
  altitudeConsistencyRatio: number | null;
  filteredSpeedMps: number | null;
  rawSpeedMps: number | null;
  pacePer100Steps: number | null;
  inferredSteps: number;
  telemetry: RoutePointTelemetry[];
};

export type RunRecord = {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  status: ValidationStatus;
  validationScore: number;
  validationReasons: string[];
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  elevationGainM: number | null;
  gpsAccuracyAvgM: number | null;
  gpsAccuracyMinM: number | null;
  gpsAccuracyMaxM: number | null;
  estimatedSteps: number;
  pacePer100StepsSeconds: number | null;
  points: RunPoint[];
  trackingSummary?: RouteTrackSummary;
};

export type Profile = {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  language: "de" | "en";
  showInPublicLeaderboard: boolean;
  role: "user" | "admin";
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicRun = {
  id: string;
  rank: number;
  nickname: string;
  avatarUrl: string;
  durationSeconds: number;
  date: string;
  status: ValidationStatus;
  isCurrentUser: boolean;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  isPrivate: boolean;
  memberCount: number;
  bestTimeSeconds: number | null;
  role?: "owner" | "admin" | "member";
};

export type HistoryItem = {
  id: string;
  slug?: string;
  language?: "de" | "en";
  sortOrder: number;
  yearLabel: string;
  title: string;
  body: string;
};

export type LegalPage = {
  id: string;
  slug: string;
  language: "de" | "en";
  title: string;
  body: string;
  version: string;
  active: boolean;
};

export type MotivationMessage = {
  minSteps: number;
  maxSteps: number;
  intensity: number;
  message: string;
};

export type ValidationResult = {
  status: Exclude<ValidationStatus, "draft">;
  score: number;
  reasons: string[];
  metrics: {
    durationSeconds: number;
    elevationGain: number | null;
    gpsAccuracyAverage: number | null;
    gpsAccuracyMin: number | null;
    gpsAccuracyMax: number | null;
    startDistanceToZone: number | null;
    endDistanceToZone: number | null;
    estimatedSteps: number;
    pacePer100Steps: number | null;
    pointCount: number;
    routeDistanceMeters: number;
    routeProgressSteps: number;
    maxProgressSteps: number;
    routeConfidenceAverage: number;
    routeConfidenceLevel: TrackingConfidenceLevel;
    routeAdherenceRatio: number;
    continuityScore: number;
    offRoutePointCount: number;
    lowConfidencePointCount: number;
    impossibleJumpCount: number;
    inferredSteps: number;
  };
  tracking: RouteTrackSummary;
};
