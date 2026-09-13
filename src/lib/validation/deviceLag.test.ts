import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultChallengeConfig } from "../../data/challenge";
import { analyzeRouteTrack } from "../geo/routeMatcher";
import type { RunPoint } from "../types";
import { validateRun } from "./validateRun";

// Zwei Geraete am selben Koerper, dieselbe Treppe, dieselbe Sekunde.
// Das iPhone lieferte die Wahrheit, das Android eine Position, die bis zu
// 39 m hinterherhinkte, und behauptete dabei +/-3 m Genauigkeit.
const reference = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/reference-run-2026-09-08.json", import.meta.url), "utf8")
) as { run: { startedAt: string; endedAt: string | null; points: RunPoint[] } };
const lagging = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/android-lag-2026-09-08.json", import.meta.url), "utf8")
) as { run: { startedAt: string; endedAt: string | null; points: RunPoint[] } };

const referenceResult = validateRun(reference.run, reference.run.points, defaultChallengeConfig);
const laggingResult = validateRun(lagging.run, lagging.run.points, defaultChallengeConfig);
const level = (result: typeof laggingResult, rule: string) => result.checks.find((check) => check.rule === rule)?.level;

describe("Hoehen-Drift als Vertrauenssignal", () => {
  it("bleibt bei einem stimmigen GPS klein", () => {
    const tracking = analyzeRouteTrack(reference.run.points, defaultChallengeConfig);
    expect(tracking.altitudeDriftM).not.toBeNull();
    expect(Math.abs(tracking.altitudeDriftM!)).toBeLessThan(15);
  });

  it("entlarvt das hinterherhinkende Geraet trotz gemeldeter +/-3 m", () => {
    const tracking = analyzeRouteTrack(lagging.run.points, defaultChallengeConfig);
    expect(tracking.altitudeDriftM).toBeLessThan(-40);
    // Die gemeldete Genauigkeit haette es nie verraten:
    const accuracies = lagging.run.points.map((point) => point.accuracyM);
    expect(Math.max(...accuracies)).toBeLessThanOrEqual(6);
  });
});

describe("Wertung eines hinterherhinkenden Geraets", () => {
  it("war nie neben der Route — Korridor-Toleranzen koennen hier nichts richten", () => {
    const tracking = analyzeRouteTrack(lagging.run.points, defaultChallengeConfig);
    expect(tracking.offRoutePointCount).toBe(0);
    expect(tracking.physicalJumpEventCount).toBe(0);
    expect(tracking.routeAdherenceRatio).toBe(1);
  });

  it("macht aus einer driftenden Hoehe keinen harten Fehlschlag mehr", () => {
    // Vorher: elevation fail (138 m) -> invalid, Score 41.
    expect(level(laggingResult, "elevation")).toBe("review");
    expect(laggingResult.checks.find((check) => check.rule === "elevation")?.measured).toContain("driftet");
  });

  it("landet in der Pruefung statt im Aus, weil GPS allein den Abschluss nicht belegen kann", () => {
    // 1038 von 1150 per GPS, 38 m vom Ziel, 100 % im Korridor: das ist ein
    // Fall fuer einen Menschen, kein Fall fuer "ungueltig". Gueltig wird er
    // ohne unabhaengigen Beleg (Tritte des Beschleunigungssensors) nicht.
    expect(laggingResult.status).toBe("needs_review");
    expect(level(laggingResult, "routeProgress")).toBe("review");
    expect(level(laggingResult, "endZone")).toBe("review");
    expect(laggingResult.metrics.estimatedSteps).toBe(1038);
  });

  it("laesst die Referenz unangetastet", () => {
    expect(referenceResult.status).toBe("valid");
    expect(referenceResult.score).toBe(100);
  });
});

describe("Die Vollstaendigkeitspruefung haengt nicht an einzelnen Punkten", () => {
  function withBlip(points: RunPoint[], fromEnd: number, count: number): RunPoint[] {
    // Ein paar Fixes springen 200 m nach Osten und kommen zurueck — ein
    // GPS-Ausschlag, wie ihn Mehrwegeempfang im Wald erzeugt.
    return points.map((point, index) => {
      const offset = points.length - index;
      return offset <= fromEnd && offset > fromEnd - count
        ? { ...point, lng: point.lng + 200 / (111_320 * Math.cos((point.lat * Math.PI) / 180)), accuracyM: 40 }
        : point;
    });
  }

  it("bleibt gueltig, wenn im Ziel ein 200-m-Ausschlag hin und zurueck springt", () => {
    // Vorher: ein Einzelversatz ueber 100 m galt unbedingt als physischer
    // Sprung -> needs_review, Score 88, obwohl Stufen und Ziel stimmten.
    const points = withBlip(reference.run.points, 8, 3);
    const result = validateRun(reference.run, points, defaultChallengeConfig);
    expect(result.status).toBe("valid");
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(result.tracking.physicalJumpEventCount).toBe(0);
  });

  it("bleibt gueltig, wenn die allerletzten Fixes Artefakte sind", () => {
    // Die stabile Ziel-Referenz (Median der letzten guten Punkte) traegt.
    const points = withBlip(reference.run.points, 3, 3);
    const result = validateRun(reference.run, points, defaultChallengeConfig);
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(result.metrics.endDistanceToZone).toBeLessThan(10);
  });

  it("rettet keinen Lauf, der ehrlich vor dem Ziel endet", () => {
    // Referenzlauf bei ~Stufe 1000 abgebrochen, GPS stimmig: kein Drift,
    // kein Fallback, kein Abschluss.
    const startMs = new Date(reference.run.points[0].recordedAt).getTime();
    const points = reference.run.points.filter((point) => new Date(point.recordedAt).getTime() - startMs <= 925_000);
    const result = validateRun({ startedAt: reference.run.startedAt, endedAt: points.at(-1)!.recordedAt }, points, defaultChallengeConfig);
    expect(result.status).not.toBe("valid");
    expect(level(result, "routeProgress")).not.toBe("pass");
    expect(result.metrics.estimatedSteps).toBeLessThan(1010);
  });
});
