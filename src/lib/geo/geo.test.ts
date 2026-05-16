import { describe, expect, it } from "vitest";
import { haversineDistanceMeters } from "./geo";

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
