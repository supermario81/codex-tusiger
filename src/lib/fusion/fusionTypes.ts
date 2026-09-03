// Gerüst für die Sensorfusion. Bewusst noch ohne Logik: die Schwellen werden
// aus echten Aufzeichnungen bestimmt (siehe docs/sensor-fusion-architecture.md).
// Nichts hiervon ist im Laufpfad verdrahtet — die Auswertung läuft unverändert
// über analyzeRouteTrack.

export type StageKind = "stairs" | "flat" | "unknown";

export type FusedRouteState = {
  stageIndex: number;
  stageKind: StageKind;
  distanceInStageM: number;
  totalDistanceM: number;
  steps: number;
  elevationGainM: number;
  confidence: number;
};

export const initialFusedState: FusedRouteState = {
  stageIndex: 0,
  stageKind: "unknown",
  distanceInStageM: 0,
  totalDistanceM: 0,
  steps: 0,
  elevationGainM: 0,
  confidence: 0
};

export type MotionSample = {
  atMs: number;
  accelerationMagnitude: number;
  headingDeg: number | null;
  altitudeM: number | null;
};

export type GpsConstraint = {
  atMs: number;
  lat: number;
  lng: number;
  accuracyM: number;
};

// Schritterkennung aus der Beschleunigung (Task 6).
export interface StepDetector {
  push(sample: MotionSample): number;
  readonly stepCount: number;
  reset(): void;
}

// Kurs aus Gyroskop und Kompass (Task 7).
export interface HeadingEstimator {
  push(sample: MotionSample): number | null;
  readonly headingDeg: number | null;
}

// Höhenprofil aus Barometer beziehungsweise GPS-Höhe (Task 7).
export interface AltitudeEstimator {
  push(sample: MotionSample): number | null;
  readonly gainM: number;
}

// Zusammenführung; GPS wirkt nur als weiche Korrektur (Task 8).
export interface RouteStateMachine {
  readonly state: FusedRouteState;
  pushMotion(sample: MotionSample): FusedRouteState;
  applyGpsConstraint(constraint: GpsConstraint): FusedRouteState;
  reset(): void;
}
