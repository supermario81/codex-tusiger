import { describe, expect, it } from "vitest";
import { defaultChallengeConfig, routeWaypoints } from "../../data/challenge";
import type { RunPoint } from "../types";
import { estimateStepsFromPosition, haversineDistanceMeters } from "./geo";

function pointFromWaypoint(index: number, withAltitude = false): RunPoint {
  const waypoint = routeWaypoints[index];
  return {
    recordedAt: new Date(index * 1000).toISOString(),
    lat: waypoint.lat,
    lng: waypoint.lng,
    altitudeM: withAltitude ? waypoint.altM : null,
    altitudeAccuracyM: withAltitude ? 8 : null,
    accuracyM: 5,
    speedMps: null,
    heading: null
  };
}

describe("haversineDistanceMeters", () => {
  it("calculates the Tusiger start to end distance", () => {
    const distance = haversineDistanceMeters(
      { lat: 47.315206553, lng: 7.886963657 },
      { lat: 47.318954559, lng: 7.882850574 }
    );

    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(540);
  });
});

describe("estimateStepsFromPosition", () => {
  it("maps measured route waypoints to their stair references without altitude noise", () => {
    routeWaypoints.forEach((waypoint, index) => {
      expect(estimateStepsFromPosition(pointFromWaypoint(index), defaultChallengeConfig)).toBe(waypoint.steps);
    });
  });

  it("keeps altitude-corrected waypoints close to their measured stair references", () => {
    routeWaypoints.forEach((waypoint, index) => {
      const estimatedSteps = estimateStepsFromPosition(pointFromWaypoint(index, true), defaultChallengeConfig);
      expect(Math.abs(estimatedSteps - waypoint.steps)).toBeLessThanOrEqual(35);
    });
  });

  it("does not estimate stair progress from unreliable GPS points", () => {
    const point = { ...pointFromWaypoint(12, true), accuracyM: 90 };
    expect(estimateStepsFromPosition(point, defaultChallengeConfig)).toBe(0);
  });
});
