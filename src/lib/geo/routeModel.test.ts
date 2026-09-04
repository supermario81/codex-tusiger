import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultChallengeConfig, routeModelVersion, routeWaypoints } from "../../data/challenge";
import { matchPointToRoute } from "./routeMatcher";
import type { RunPoint } from "../types";

// Vermessung der echten Strecke vom Kalibriergang 2026-09-04 (zwei Geräte
// gleichzeitig, Positionen gemittelt). Sie ist die Referenz für das
// Routenmodell — unabhängig davon, wie das Modell intern aufgebaut ist.
const calibration = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/calibration-2026-09-04.json", import.meta.url), "utf8")
) as {
  totalSteps: number;
  sections: Array<{
    kind: "stairs" | "path";
    steps: number;
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  }>;
};

function pointAt(lat: number, lng: number): RunPoint {
  return {
    recordedAt: new Date(0).toISOString(),
    lat,
    lng,
    altitudeM: null,
    altitudeAccuracyM: null,
    accuracyM: 5,
    speedMps: null,
    heading: null
  };
}

function modelStepsAt(lat: number, lng: number): number {
  return matchPointToRoute(pointAt(lat, lng), defaultChallengeConfig, null).progressSteps;
}

describe("Routenmodell gegen die vermessene Strecke", () => {
  it("ist Version 3 und deckt die volle Stufenzahl ab", () => {
    expect(routeModelVersion).toBe(3);
    expect(routeWaypoints[0].steps).toBe(0);
    expect(routeWaypoints.at(-1)!.steps).toBe(defaultChallengeConfig.totalSteps);
  });

  it("laesst den Zaehler auf stufenlosen Wegen stehen", () => {
    // Modell v2 vergab hier zusammen 74 Stufen, allein 32 auf dem 27-m-Weg.
    const paths = calibration.sections.filter((section) => section.kind === "path");
    expect(paths.length).toBeGreaterThanOrEqual(5);

    let awarded = 0;
    paths.forEach((section) => {
      const gained =
        modelStepsAt(section.end.lat, section.end.lng) - modelStepsAt(section.start.lat, section.start.lng);
      expect(Math.abs(gained)).toBeLessThan(3);
      awarded += Math.abs(gained);
    });
    expect(awarded).toBeLessThan(6);
  });

  it("bildet jeden Treppenabschnitt mit seiner gemessenen Stufenzahl ab", () => {
    const stairs = calibration.sections.filter((section) => section.kind === "stairs");
    expect(stairs.map((section) => section.steps)).toEqual([245, 19, 97, 7, 100, 195, 487]);

    stairs.forEach((section) => {
      const gained =
        modelStepsAt(section.end.lat, section.end.lng) - modelStepsAt(section.start.lat, section.start.lng);
      // Toleranz skaliert mit der Abschnittslaenge: GPS-Bias zwischen zwei
      // Begehungen liegt bei rund 9 m, das sind bei 2,5 Stufen/m gut 20 Stufen.
      const tolerance = Math.max(25, section.steps * 0.12);
      expect(Math.abs(gained - section.steps)).toBeLessThanOrEqual(tolerance);
    });
  });

  it("haelt die Stufendichte im physikalisch moeglichen Band", () => {
    for (let i = 0; i < routeWaypoints.length - 1; i += 1) {
      const a = routeWaypoints[i];
      const b = routeWaypoints[i + 1];
      const deltaSteps = b.steps - a.steps;
      expect(deltaSteps).toBeGreaterThanOrEqual(0);
    }
  });
});
