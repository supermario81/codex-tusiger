import { defaultChallengeConfig } from "../../data/challenge";
import type { RunPoint } from "../../lib/types";

export function createSyntheticRunPoints(durationSeconds = 4140): RunPoint[] {
  const points: RunPoint[] = [];
  const now = Date.now() - durationSeconds * 1000;
  const total = 34;

  for (let index = 0; index < total; index += 1) {
    const rawProgress = index / (total - 1);
    const progress = index < 5 ? 0 : index > total - 6 ? 1 : rawProgress;
    points.push({
      recordedAt: new Date(now + progress * durationSeconds * 1000).toISOString(),
      lat:
        defaultChallengeConfig.startLat +
        (defaultChallengeConfig.endLat - defaultChallengeConfig.startLat) * progress,
      lng:
        defaultChallengeConfig.startLng +
        (defaultChallengeConfig.endLng - defaultChallengeConfig.startLng) * progress,
      altitudeM: 427.6 + 233.5 * progress,
      altitudeAccuracyM: 6,
      accuracyM: index < 3 ? 8 : 5 + (index % 4),
      speedMps: 0.13,
      heading: 318
    });
  }

  return points;
}

export function positionToRunPoint(position: GeolocationPosition): RunPoint {
  return {
    recordedAt: new Date(position.timestamp).toISOString(),
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    altitudeM: position.coords.altitude,
    altitudeAccuracyM: position.coords.altitudeAccuracy,
    accuracyM: position.coords.accuracy,
    speedMps: position.coords.speed,
    heading: position.coords.heading
  };
}
