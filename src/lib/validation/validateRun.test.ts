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

  it("sends poor GPS accuracy to review or invalid", () => {
    const points = createSyntheticRunPoints().map((point) => ({ ...point, accuracyM: 48 }));
    expect(runFor(points).status).toBe("invalid");
  });

  it("flags elevation outside the valid range", () => {
    const points = createSyntheticRunPoints().map((point, index) => ({
      ...point,
      altitudeM: 427 + index * 1
    }));
    expect(runFor(points).status).toBe("invalid");
  });
});
