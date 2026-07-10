import { describe, expect, it } from "vitest";
import { defaultChallengeConfig } from "../../data/challenge";
import { computeStableStartReference, haversineDistanceMeters, stableEdgePoint } from "../../lib/geo/geo";
import type { RunPoint } from "../../lib/types";
import { appendRunPoint, createCalibrationRunPoints } from "./runUtils";

// Regressionstest für den 300-Punkte-Cap: Der Aufnahme-Pfad muss JEDEN Punkt
// behalten. Ein rollierendes Fenster (slice(-300)) hat früher jeden echten
// Lauf ungültig gemacht, weil Startzone und Höhengewinn nur noch die letzten
// 5 Minuten sahen.
describe("run recording pipeline", () => {
  it("keeps every point of a full 1-point-per-second run — no rolling window", () => {
    const source = createCalibrationRunPoints(1002);
    let recorded: RunPoint[] = [];
    source.forEach((point) => {
      recorded = appendRunPoint(recorded, point);
    });

    expect(recorded).toHaveLength(source.length);
    expect(recorded.length).toBeGreaterThan(300);
    expect(recorded[0]).toEqual(source[0]);
    expect(recorded.at(-1)).toEqual(source.at(-1));
  });

  it("derives the stable start reference from the actual start, not a mid-run point", () => {
    const source = createCalibrationRunPoints(1002);
    let recorded: RunPoint[] = [];
    source.forEach((point) => {
      recorded = appendRunPoint(recorded, point);
    });

    const startReference = computeStableStartReference(recorded);
    expect(startReference).not.toBeNull();

    const distanceToStartZone = haversineDistanceMeters(startReference!, {
      lat: defaultChallengeConfig.startLat,
      lng: defaultChallengeConfig.startLng
    });
    expect(distanceToStartZone).toBeLessThanOrEqual(defaultChallengeConfig.startRadiusM);

    // Und ausdrücklich kein Punkt aus der Streckenmitte (der Cap-Bug lieferte
    // als "ersten Punkt" einen Punkt ~5 Minuten vor Schluss):
    const midPoint = recorded[Math.floor(recorded.length / 2)];
    expect(haversineDistanceMeters(startReference!, midPoint)).toBeGreaterThan(100);

    const startAltitude = startReference!.altitudeM;
    expect(startAltitude).not.toBeNull();
    expect(Math.abs((startAltitude ?? 0) - 427)).toBeLessThan(6);
  });

  it("locks the stable start early and keeps it identical after the full run", () => {
    const source = createCalibrationRunPoints(1002);
    const earlyReference = computeStableStartReference(source.slice(0, 8));
    const lateReference = computeStableStartReference(source);

    expect(earlyReference).not.toBeNull();
    expect(lateReference).toEqual(earlyReference);
  });

  it("derives the stable end reference from the last good points", () => {
    const source = createCalibrationRunPoints(1002);
    const endReference = stableEdgePoint(source, "end");

    expect(endReference).not.toBeNull();
    const distanceToEndZone = haversineDistanceMeters(endReference!, {
      lat: defaultChallengeConfig.endLat,
      lng: defaultChallengeConfig.endLng
    });
    expect(distanceToEndZone).toBeLessThanOrEqual(defaultChallengeConfig.endRadiusM);
    expect(Math.abs((endReference!.altitudeM ?? 0) - 661)).toBeLessThan(6);
  });
});
