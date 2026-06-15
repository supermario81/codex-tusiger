import { describe, expect, it } from "vitest";
import { defaultChallengeConfig } from "../../data/challenge";
import { createSyntheticRunPoints } from "../../features/run/runUtils";
import type { RunPoint } from "../types";
import { validateRun } from "./validateRun";

function runFor(points: RunPoint[], seconds = 4140) {
  const startedAt = new Date("2026-05-16T08:00:00Z").toISOString();
  const endedAt = new Date(new Date(startedAt).getTime() + seconds * 1000).toISOString();
  return validateRun({ startedAt, endedAt }, points, defaultChallengeConfig);
}

describe("validateRun", () => {
  it("accepts a synthetic valid run based on calibration data", () => {
    const result = runFor(createSyntheticRunPoints());
    expect(result.status).toBe("valid");
    expect(result.metrics.elevationGain).toBeGreaterThan(205);
  });

  it("invalidates a wrong start zone", () => {
    const points = createSyntheticRunPoints().map((point, index) =>
      index < 5 ? { ...point, lat: point.lat + 0.01 } : point
    );
    expect(runFor(points).status).toBe("invalid");
  });

  it("invalidates a wrong end zone", () => {
    const points = createSyntheticRunPoints().map((point, index, all) =>
      index > all.length - 6 ? { ...point, lng: point.lng + 0.01 } : point
    );
    expect(runFor(points).status).toBe("invalid");
  });

  it("invalidates a too short duration", () => {
    expect(runFor(createSyntheticRunPoints(), 90).status).toBe("invalid");
  });

  it("does not award full stair progress when GPS points are missing", () => {
    const result = runFor([], 90);
    expect(result.status).toBe("invalid");
    expect(result.metrics.estimatedSteps).toBe(0);
  });

  it("sends poor GPS accuracy to review or invalid", () => {
    const points = createSyntheticRunPoints().map((point) => ({ ...point, accuracyM: 120 }));
    expect(runFor(points).status).toBe("invalid");
  });

  it("keeps a complete route with slightly weak forest GPS in review instead of faking certainty", () => {
    const points = createSyntheticRunPoints().map((point) => ({ ...point, accuracyM: 52 }));
    const result = runFor(points);

    expect(result.status).toBe("needs_review");
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(result.metrics.routeConfidenceAverage).toBeGreaterThan(0.45);
  });

  it("flags elevation outside the valid range", () => {
    const points = createSyntheticRunPoints().map((point, index) => ({
      ...point,
      altitudeM: 427 + index * 1
    }));
    expect(runFor(points).status).toBe("invalid");
  });

  it("accepts a complete route when browser altitude is unusable but route evidence is strong", () => {
    const points = createSyntheticRunPoints().map((point) => ({
      ...point,
      altitudeM: 500,
      altitudeAccuracyM: 120
    }));
    const result = runFor(points);

    expect(result.status).toBe("valid");
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(result.reasons).toContain("GPS-Höhe war unruhig, Höhenprofil über Routenmodell plausibel.");
  });

  it("requires the full run track instead of accepting only a truncated finish buffer", () => {
    const fullTrack = createSyntheticRunPoints(920);
    const finishOnlyBuffer = fullTrack.slice(-12);

    expect(runFor(fullTrack, 920).status).toBe("valid");
    expect(runFor(finishOnlyBuffer, 920).status).toBe("invalid");
  });

  it("recovers a valid complete run when the first GPS fix is noisy but the early route lock is plausible", () => {
    const points = createSyntheticRunPoints(920).map((point, index) =>
      index < 5
        ? {
            ...point,
            lat: point.lat + 0.001,
            lng: point.lng + 0.001,
            accuracyM: 95,
            altitudeAccuracyM: 120
          }
        : point
    );
    const result = runFor(points, 920);

    expect(result.status).toBe("valid");
    expect(result.reasons).toContain("Startzone über frühen Routenlock plausibel.");
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
  });
});
