import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultChallengeConfig } from "../../data/challenge";
import { analyzeRouteTrack, classifyJumpEvents } from "../geo/routeMatcher";
import type { RunPoint } from "../types";
import { validateRun } from "./validateRun";

// Kompletter realer Lauf vom 2026-07-14 (1073 Punkte, ±3–6 m Genauigkeit).
// Der Läufer ist nachweislich alle 1150 Stufen gelaufen und hat an jeder
// 100er-Marke das Display fotografiert — Ground Truth für Modell und Regeln.
const fixture = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/run-2026-07-14.json", import.meta.url), "utf8")
) as {
  run: { startedAt: string; endedAt: string | null; points: RunPoint[] };
};
const fixturePoints = fixture.run.points;
const fixtureRun = { startedAt: fixture.run.startedAt, endedAt: fixture.run.endedAt };

// realSteps ↔ Sekunden seit Start (Screenshot-Zeitpunkte der Kalibrierung).
const calibrationMarks: Array<[number, number]> = [
  [100, 71], [200, 155], [300, 246], [400, 366], [500, 470], [600, 557],
  [700, 644], [800, 728], [900, 818], [1000, 920], [1100, 1023], [1150, 1068]
];

describe("fixture replay: real run 2026-07-14", () => {
  const result = validateRun(fixtureRun, fixturePoints, defaultChallengeConfig);

  it("validates the complete real run as valid", () => {
    expect(result.status).toBe("valid");
    expect(result.metrics.elevationGain).toBeGreaterThanOrEqual(235);
    expect(result.metrics.elevationGain).toBeLessThanOrEqual(245);
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
  });

  it("counts zero physical jump events — the old 14-point flag burst is gone", () => {
    expect(result.tracking.physicalJumpEventCount).toBe(0);
    expect(result.metrics.impossibleJumpCount).toBe(0);
    const jumpCheck = result.checks.find((check) => check.rule === "jumps");
    expect(jumpCheck?.level).toBe("pass");
  });

  it("tracks step progress within ±25 steps at every 100-step marker", () => {
    const tracking = analyzeRouteTrack(fixturePoints, defaultChallengeConfig);
    const startMs = new Date(fixturePoints[0].recordedAt).getTime();
    calibrationMarks.forEach(([realSteps, elapsedSeconds]) => {
      const targetMs = startMs + elapsedSeconds * 1000;
      const closest = tracking.telemetry.reduce((best, point) =>
        Math.abs(new Date(point.recordedAt).getTime() - targetMs) <
        Math.abs(new Date(best.recordedAt).getTime() - targetMs)
          ? point
          : best
      );
      expect(Math.abs(closest.filteredSteps - realSteps)).toBeLessThanOrEqual(25);
    });
  });
});

describe("classifyJumpEvents", () => {
  it("clusters 14 consecutive pedestrian snap flags into ONE rematch event, zero physical", () => {
    // Exakt das Muster des Feldtests: 14 Flags im Sekundentakt bei Geh-Tempo.
    const samples = Array.from({ length: 14 }, (_, index) => ({
      atMs: index * 1000,
      speedMps: 0.5,
      displacementM: 0.6,
      routeSnap: true
    }));
    const events = classifyJumpEvents(samples);
    expect(events.routeRematchEventCount).toBe(1);
    expect(events.physicalJumpEventCount).toBe(0);
  });

  it("classifies sustained fast movement and large single displacement as physical", () => {
    const sustained = Array.from({ length: 5 }, (_, index) => ({
      atMs: index * 1000,
      speedMps: 50,
      displacementM: 50,
      routeSnap: false
    }));
    expect(classifyJumpEvents(sustained).physicalJumpEventCount).toBe(1);

    const singleLarge = [{ atMs: 0, speedMps: 150, displacementM: 150, routeSnap: false }];
    expect(classifyJumpEvents(singleLarge).physicalJumpEventCount).toBe(1);

    const twoSeparate = [
      ...sustained,
      ...sustained.map((sample) => ({ ...sample, atMs: sample.atMs + 60_000 }))
    ];
    expect(classifyJumpEvents(twoSeparate).physicalJumpEventCount).toBe(2);
  });

  it("does not count a single sub-100 m blip as physical", () => {
    const blip = [{ atMs: 0, speedMps: 12, displacementM: 12, routeSnap: false }];
    const events = classifyJumpEvents(blip);
    expect(events.physicalJumpEventCount).toBe(0);
  });
});
