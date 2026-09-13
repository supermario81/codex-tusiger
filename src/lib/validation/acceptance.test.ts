import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultChallengeConfig, routeSections } from "../../data/challenge";
import { advanceDisplayedSteps } from "../../features/run/displayedSteps";
import { analyzeRouteTrack } from "../geo/routeMatcher";
import type { RunPoint } from "../types";
import { validateRun } from "./validateRun";

// Abnahme entlang der manuellen Checkliste (test_runs/test_checklist.md).
// Jeder Punkt der Checkliste hat hier genau einen Test mit denselben
// Erwartungswerten. Datenbasis: die Ground-Truth-Messpunkte vom 2026-09-08
// (test_runs/ground_truth_points.csv), als Fixtures eingefroren.

const reference = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/reference-run-2026-09-08.json", import.meta.url), "utf8")
) as {
  marks: Array<[number, number]>;
  noStairsZones: Array<[number, number]>;
  run: { startedAt: string; endedAt: string | null; points: RunPoint[] };
};
const lagging = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/android-lag-2026-09-08.json", import.meta.url), "utf8")
) as { run: { startedAt: string; endedAt: string | null; points: RunPoint[] } };

const total = defaultChallengeConfig.totalSteps;
const tracking = analyzeRouteTrack(reference.run.points, defaultChallengeConfig);
const startMs = new Date(reference.run.points[0].recordedAt).getTime();

function shownAt(elapsedSeconds: number): number {
  const targetMs = startMs + elapsedSeconds * 1000;
  return tracking.telemetry.reduce((best, item) =>
    Math.abs(new Date(item.recordedAt).getTime() - targetMs) < Math.abs(new Date(best.recordedAt).getTime() - targetMs)
      ? item
      : best
  ).filteredSteps;
}

describe("Checkliste A — Start", () => {
  it("A1: im Stand am Fuss der Treppe zeigt die App 0", () => {
    const standing = tracking.telemetry.filter((item) => new Date(item.recordedAt).getTime() - startMs <= 17_000);
    expect(standing.every((item) => item.filteredSteps === 0)).toBe(true);
  });

  it("A2: die erste angezeigte Zahl nach dem Losgehen ist 1, dann 2, 3, ...", () => {
    const firstMeasured = tracking.telemetry.find((item) => item.filteredSteps > 0)!.filteredSteps;
    const shown: number[] = [];
    let displayed = 0;
    while (displayed < firstMeasured) {
      displayed = advanceDisplayedSteps(displayed, firstMeasured);
      shown.push(displayed);
    }
    expect(shown[0]).toBe(1);
    expect(shown).toEqual(Array.from({ length: firstMeasured }, (_, index) => index + 1));
  });
});

describe("Checkliste B — 100er-Marken", () => {
  it("B1: an jeder Marke weicht die Anzeige hoechstens 3 Stufen ab", () => {
    reference.marks.forEach(([realSteps, elapsedSeconds]) => {
      expect(Math.abs(shownAt(elapsedSeconds) - realSteps)).toBeLessThanOrEqual(3);
    });
  });
});

describe("Checkliste C — stufenlose Abschnitte", () => {
  it("C1: die sechs Zonen liegen bei 240, 265, 362, 371, 468 und 611", () => {
    const zones = routeSections.filter((section) => section.kind === "path").map((section) => section.fromSteps);
    expect(zones).toEqual([240, 265, 362, 371, 468, 611]);
  });

  it("C2: in keiner Zone steigt die Anzeige um mehr als 2", () => {
    reference.noStairsZones.forEach(([enteredAt, leftAt]) => {
      expect(shownAt(leftAt) - shownAt(enteredAt)).toBeLessThanOrEqual(2);
    });
  });
});

describe("Checkliste D — Ziel und Wertung", () => {
  const result = validateRun(reference.run, reference.run.points, defaultChallengeConfig);

  it("D1: oben angekommen steht die Anzeige auf 1150 und bleibt dort", () => {
    expect(tracking.finalSteps).toBe(total);
    expect(tracking.telemetry.slice(-10).every((item) => item.filteredSteps === total)).toBe(true);
  });

  it("D2: der vollstaendige Lauf wird als gueltig gewertet, Score 100", () => {
    expect(result.status).toBe("valid");
    expect(result.score).toBe(100);
    expect(result.metrics.estimatedSteps).toBe(total);
    expect(result.checks.every((check) => check.level === "pass")).toBe(true);
  });
});

describe("Checkliste E — keine falschen Streckenmeldungen", () => {
  it("E1: kein Punkt des Referenzlaufs gilt als neben der Strecke", () => {
    expect(tracking.offRoutePointCount).toBe(0);
    expect(tracking.routeAdherenceRatio).toBe(1);
    expect(tracking.physicalJumpEventCount).toBe(0);
  });

  it("E2: auch der hinterherhinkende Android-Lauf war nie neben der Strecke", () => {
    const androidTracking = analyzeRouteTrack(lagging.run.points, defaultChallengeConfig);
    expect(androidTracking.offRoutePointCount).toBe(0);
    expect(androidTracking.physicalJumpEventCount).toBe(0);
  });
});

describe("Checkliste F — Android-Fehlerfall", () => {
  const result = validateRun(lagging.run, lagging.run.points, defaultChallengeConfig);

  it("F1: ein Geraet mit driftender Hoehe landet in der Pruefung, nicht im Aus", () => {
    expect(result.status).toBe("needs_review");
    expect(result.checks.find((check) => check.rule === "elevation")?.level).toBe("review");
  });

  it("F2: die Drift steht als Messwert im Bericht", () => {
    expect(result.tracking.altitudeDriftM).toBeLessThan(-40);
    expect(result.checks.find((check) => check.rule === "elevation")?.measured).toMatch(/driftet um -?\d+ m/);
  });
});
