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
};

export type Profile = {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  role: "user" | "admin";
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
};

export type HistoryItem = {
  id: string;
  sortOrder: number;
  yearLabel: string;
  title: string;
  body: string;
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
  };
};
