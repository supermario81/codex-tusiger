import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultChallengeConfig, routeModelVersion, routeSections, routeWaypoints } from "../../data/challenge";
import { matchPointToRoute } from "./routeMatcher";
import type { RunPoint } from "../types";

// Grundlage des Modells v4: der gültige Referenzlauf vom 2026-09-08. An jeder
// 100er-Marke gibt es einen Screenshot, dessen Dateizeit die Laufsekunde
// verrät — damit sind Position und echter Stufenstand aus derselben Quelle.
const reference = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/reference-run-2026-09-08.json", import.meta.url), "utf8")
) as {
  marks: Array<[number, number]>;
  noStairsZones: Array<[number, number]>;
  run: { points: RunPoint[] };
};

// Unabhängiger Lauf, der am Modell nicht beteiligt war. Er ist der eigentliche
// Test: hier kann sich das Modell nicht selbst bestätigen.
const july = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/run-2026-07-14.json", import.meta.url), "utf8")
) as { run: { points: RunPoint[] } };
const julyMarks: Array<[number, number]> = [
  [100, 71], [200, 155], [300, 246], [400, 366], [500, 470], [600, 557],
  [700, 644], [800, 728], [900, 818], [1000, 920], [1100, 1023], [1150, 1068]
];

// Der Kalibriergang vom 2026-09-04. Seine Abschnittspositionen sind echte
// Messpunkte, seine Stufenzahlen stimmen bis auf die vorletzte Grenze.
const calibration = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/calibration-2026-09-04.json", import.meta.url), "utf8")
) as {
  sections: Array<{
    kind: "stairs" | "path";
    steps: number;
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  }>;
};

function modelStepsAt(lat: number, lng: number): number {
  const point: RunPoint = {
    recordedAt: new Date(0).toISOString(),
    lat,
    lng,
    altitudeM: null,
    altitudeAccuracyM: null,
    accuracyM: 5,
    speedMps: null,
    heading: null
  };
  return matchPointToRoute(point, defaultChallengeConfig, null).progressSteps;
}

function stepsAtSecond(points: RunPoint[], elapsedSeconds: number): number {
  const startMs = new Date(points[0].recordedAt).getTime();
  const targetMs = startMs + elapsedSeconds * 1000;
  const closest = points.reduce((best, point) =>
    Math.abs(new Date(point.recordedAt).getTime() - targetMs) <
    Math.abs(new Date(best.recordedAt).getTime() - targetMs)
      ? point
      : best
  );
  return modelStepsAt(closest.lat, closest.lng);
}

const stairsSections = routeSections.filter((section) => section.kind === "stairs");

describe("Routenmodell v4", () => {
  it("deckt die volle Stufenzahl ab", () => {
    expect(routeModelVersion).toBe(4);
    expect(routeWaypoints[0].steps).toBe(0);
    expect(routeWaypoints.at(-1)!.steps).toBe(defaultChallengeConfig.totalSteps);
  });

  it("trifft die zwölf fotografierten Marken des Referenzlaufs", () => {
    reference.marks.forEach(([realSteps, elapsedSeconds]) => {
      expect(Math.abs(stepsAtSecond(reference.run.points, elapsedSeconds) - realSteps)).toBeLessThanOrEqual(3);
    });
  });

  it("trifft den unabhängigen Lauf vom 2026-07-14 doppelt so genau wie Modell v3", () => {
    // Der harte Test: dieser Lauf war am Modell nicht beteiligt. Modell v3 kam
    // hier auf 7,9 Stufen im Mittel und 22,6 im Maximum, mit einem groben
    // Ausreißer von +23 an der Marke 600 — genau dort, wo die falsch gesetzte
    // Abschnittsgrenze saß. Modell v4 schafft 4,2 und 12,5.
    const errors = julyMarks.map(([realSteps, elapsedSeconds]) =>
      Math.abs(stepsAtSecond(july.run.points, elapsedSeconds) - realSteps)
    );
    const mean = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    expect(mean).toBeLessThanOrEqual(6);
    expect(Math.max(...errors)).toBeLessThanOrEqual(15);
  });

  it("lässt den Zähler auf den gemessenen stufenlosen Wegen stehen", () => {
    // Modell v2 vergab hier zusammen 74 Stufen, Modell v3 an denselben
    // Positionen noch 41. Die Zonen haben in v4 eigene Stützpunkte, damit
    // eine sechs Meter kurze Zone nicht zwischen zwei Stützpunkten
    // weginterpoliert wird.
    let awarded = 0;
    reference.noStairsZones.forEach(([enteredAt, leftAt]) => {
      const gained =
        stepsAtSecond(reference.run.points, leftAt) - stepsAtSecond(reference.run.points, enteredAt);
      expect(Math.abs(gained)).toBeLessThan(3);
      awarded += Math.abs(gained);
    });
    expect(awarded).toBeLessThan(8);
  });

  it("bildet die sieben Treppenabschnitte mit ihren korrigierten Größen ab", () => {
    expect(stairsSections.map((section) => section.toSteps - section.fromSteps))
      .toEqual([240, 25, 97, 9, 97, 143, 539]);
    expect(stairsSections.at(-1)!.toSteps).toBe(defaultChallengeConfig.totalSteps);
  });

  it("stimmt an den Positionen des Kalibriergangs mit den korrigierten Größen überein", () => {
    // Der Kalibriergang trug an der vorletzten Grenze 663 ein statt 611 und
    // verschob damit 52 Stufen vom letzten in den vorletzten Abschnitt: 195
    // und 487 statt 143 und 539. Gegen diese beiden Zahlen darf nicht geprüft
    // werden — sie sind widerlegt. Geprüft wird gegen die korrigierten Größen
    // an denselben gemessenen Positionen.
    //
    // Die Toleranz ist bewusst weit: Kalibriergang und Referenzlauf fanden an
    // verschiedenen Tagen statt, ihre Zonengrenzen liegen 3 bis 5 m
    // auseinander. Bei rund 2,5 Stufen pro Meter sind das gut 12 Stufen, die
    // kein Modell wegrechnen kann.
    const measured = calibration.sections.filter((section) => section.kind === "stairs");
    expect(measured).toHaveLength(stairsSections.length);

    measured.forEach((section, index) => {
      const expected = stairsSections[index].toSteps - stairsSections[index].fromSteps;
      const gained = modelStepsAt(section.end.lat, section.end.lng) - modelStepsAt(section.start.lat, section.start.lng);
      const tolerance = Math.max(16, expected * 0.08);
      expect(Math.abs(gained - expected)).toBeLessThanOrEqual(tolerance);
    });
  });

  it("zählt nie rückwärts", () => {
    for (let i = 0; i < routeWaypoints.length - 1; i += 1) {
      expect(routeWaypoints[i + 1].steps).toBeGreaterThanOrEqual(routeWaypoints[i].steps);
    }
  });
});
