import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultChallengeConfig } from "../../data/challenge";
import { analyzeRouteTrack } from "./routeMatcher";
import { validateRun } from "../validation/validateRun";
import type { RunPoint } from "../types";

const fixture = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/run-2026-07-14.json", import.meta.url), "utf8")
) as { run: { startedAt: string; endedAt: string | null; points: RunPoint[] } };
const points = fixture.run.points;
const run = { startedAt: fixture.run.startedAt, endedAt: fixture.run.endedAt };

describe("Stufenzaehler: Nullpunkt am Start", () => {
  // Feldtest: An der ersten Stufe zeigte die App bereits 5 bis 9 Stufen an.
  // Ursache war GPS-Jitter im Stand, den das Routenmodell mit 2,29 Stufen pro
  // Meter sofort in Fortschritt umrechnete.
  it("zaehlt im Stand am Start keine Stufen", () => {
    const tracking = analyzeRouteTrack(points, defaultChallengeConfig);
    const firstSeconds = tracking.telemetry.slice(0, 6).map((item) => item.filteredSteps);
    expect(firstSeconds.every((steps) => steps === 0)).toBe(true);
  });

  it("beginnt beim Losgehen bei kleinen Werten statt bei 5 bis 9", () => {
    const tracking = analyzeRouteTrack(points, defaultChallengeConfig);
    const firstNonZero = tracking.telemetry.find((item) => item.filteredSteps > 0);
    expect(firstNonZero).toBeDefined();
    expect(firstNonZero!.filteredSteps).toBeLessThanOrEqual(4);
  });

  it("steigt monoton und erreicht oben exakt die volle Stufenzahl", () => {
    const tracking = analyzeRouteTrack(points, defaultChallengeConfig);
    expect(tracking.finalSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(tracking.maxSteps).toBe(defaultChallengeConfig.totalSteps);
  });

  it("haelt die Kalibriermarken trotz Nullpunkt-Korrektur ein", () => {
    const tracking = analyzeRouteTrack(points, defaultChallengeConfig);
    const startMs = new Date(points[0].recordedAt).getTime();
    const marks: Array<[number, number]> = [
      [100, 71], [200, 155], [300, 246], [400, 366], [500, 470], [600, 557],
      [700, 644], [800, 728], [900, 818], [1000, 920], [1100, 1023], [1150, 1068]
    ];
    marks.forEach(([realSteps, elapsedSeconds]) => {
      const targetMs = startMs + elapsedSeconds * 1000;
      const closest = tracking.telemetry.reduce((best, item) =>
        Math.abs(new Date(item.recordedAt).getTime() - targetMs) <
        Math.abs(new Date(best.recordedAt).getTime() - targetMs)
          ? item
          : best
      );
      expect(Math.abs(closest.filteredSteps - realSteps)).toBeLessThanOrEqual(25);
    });
  });
});

describe("Stufenzaehler: Abschluss im Ziel", () => {
  // Feldtest: Der Lauf wurde als Erfolg gewertet, zeigte aber 1145 statt 1150,
  // weil der letzte Roh-Fix verrauscht war und der Live-Snap nicht griff.
  function noisyFinish(accuracyM: number): RunPoint[] {
    return points.map((point, index) =>
      index >= points.length - 25
        ? { ...point, lat: defaultChallengeConfig.endLat, lng: defaultChallengeConfig.endLng, accuracyM }
        : point
    );
  }

  it("vervollstaendigt den Bericht auf 1150, auch wenn der letzte Fix zu ungenau war", () => {
    const noisy = noisyFinish(defaultChallengeConfig.gpsAccuracyReviewMaxM + 1);
    const tracking = analyzeRouteTrack(noisy, defaultChallengeConfig);
    // Der Live-Zaehler bleibt wegen des ungenauen Fixes zurueck ...
    expect(tracking.finalSteps).toBeLessThan(defaultChallengeConfig.totalSteps);
    // ... der Bericht nutzt die stabile Ziel-Referenz und ist vollstaendig.
    const result = validateRun(run, noisy, defaultChallengeConfig);
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
  });

  it("gibt einem abgebrochenen Lauf weiterhin keine vollen Stufen", () => {
    const half = points.slice(0, Math.floor(points.length / 2));
    const result = validateRun(
      { startedAt: run.startedAt, endedAt: half.at(-1)!.recordedAt },
      half,
      defaultChallengeConfig
    );
    expect(result.metrics.estimatedSteps).toBeLessThan(900);
    expect(result.status).not.toBe("valid");
  });
});
