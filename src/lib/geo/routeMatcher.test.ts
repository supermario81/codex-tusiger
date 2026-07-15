import { describe, expect, it } from "vitest";
import { defaultChallengeConfig, routeWaypoints } from "../../data/challenge";
import { createSyntheticRunPoints } from "../../features/run/runUtils";
import type { RunPoint } from "../types";
import { analyzeRouteTrack, matchPointToRoute } from "./routeMatcher";

function pointAtWaypoint(index: number): RunPoint {
  const waypoint = routeWaypoints[index];
  return {
    recordedAt: new Date(index * 1000).toISOString(),
    lat: waypoint.lat,
    lng: waypoint.lng,
    altitudeM: waypoint.altM,
    altitudeAccuracyM: 8,
    accuracyM: 6,
    speedMps: null,
    heading: null
  };
}

describe("matchPointToRoute", () => {
  it("projects a measured waypoint onto the matching route segment", () => {
    const index = routeWaypoints.findIndex((waypoint) => waypoint.steps === 700);
    const match = matchPointToRoute(pointAtWaypoint(index), defaultChallengeConfig);

    expect(match.progressSteps).toBeGreaterThan(690);
    expect(match.progressSteps).toBeLessThan(710);
    expect(match.distanceToRouteM).toBeLessThan(2);
    expect(match.confidenceLevel).toBe("high");
  });

  it("marks far lateral GPS drift as off-route", () => {
    const point = { ...pointAtWaypoint(7), lat: pointAtWaypoint(7).lat + 0.004 };
    const match = matchPointToRoute(point, defaultChallengeConfig);

    expect(match.offRoute).toBe(true);
    expect(match.confidenceLevel).toBe("low");
  });
});

describe("analyzeRouteTrack", () => {
  it("reaches the full Tusiger route on synthetic waypoint-based test data", () => {
    const summary = analyzeRouteTrack(createSyntheticRunPoints(), defaultChallengeConfig);

    expect(summary.maxSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(summary.routeAdherenceRatio).toBeGreaterThan(0.9);
    expect(summary.averageConfidence).toBeGreaterThan(0.7);
    expect(summary.continuityScore).toBeGreaterThan(0.8);
  });

  it("does not infer progress from weak GPS before a route lock exists", () => {
    const poorPoints = createSyntheticRunPoints(600).slice(0, 5).map((point) => ({
      ...point,
      accuracyM: 120,
      lat: point.lat + 0.003
    }));
    const summary = analyzeRouteTrack(poorPoints, defaultChallengeConfig);

    expect(summary.finalSteps).toBe(0);
    expect(summary.confidenceLevel).toBe("low");
  });

  it("suppresses erratic backward drift from a noisy GPS sample", () => {
    const points = createSyntheticRunPoints(900);
    const noisyPoints = points.map((point, index) =>
      index === 25
        ? { ...point, lat: routeWaypoints[5].lat, lng: routeWaypoints[5].lng, accuracyM: 48, altitudeAccuracyM: 80 }
        : point
    );
    const summary = analyzeRouteTrack(noisyPoints, defaultChallengeConfig);
    const filteredSteps = summary.telemetry.map((point) => point.filteredSteps);
    const largestBackwardMove = filteredSteps.reduce((largest, steps, index) => {
      const previous = filteredSteps[index - 1] ?? steps;
      return Math.max(largest, previous - steps);
    }, 0);

    expect(summary.maxSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(largestBackwardMove).toBeLessThanOrEqual(20);
  });
});
