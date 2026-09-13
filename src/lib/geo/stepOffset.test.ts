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

// Referenzlauf vom 2026-09-08 (Grundlage von Routenmodell v4). Der Laeufer
// stand 17 s am Start, dann pausierte Safari die Aufzeichnung 14 s lang
// (Handy in der Tasche) — der erste Fix mit Bewegung liegt bei Stufe 4.
const reference = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/reference-run-2026-09-08.json", import.meta.url), "utf8")
) as {
  noStairsZones: Array<[number, number]>;
  run: { startedAt: string; endedAt: string | null; points: RunPoint[] };
};
const referencePoints = reference.run.points;

function telemetryAt(tracking: ReturnType<typeof analyzeRouteTrack>, points: RunPoint[], elapsedSeconds: number) {
  const targetMs = new Date(points[0].recordedAt).getTime() + elapsedSeconds * 1000;
  return tracking.telemetry.reduce((best, item) =>
    Math.abs(new Date(item.recordedAt).getTime() - targetMs) < Math.abs(new Date(best.recordedAt).getTime() - targetMs)
      ? item
      : best
  );
}

describe("Stufenzaehler am Referenzlauf 2026-09-08", () => {
  const tracking = analyzeRouteTrack(referencePoints, defaultChallengeConfig);

  it("zeigt im Stand am Start 17 s lang exakt 0", () => {
    // Mit Modell v4 liegt der erste Stuetzpunkt am echten Start; die
    // Rohprojektion ist dort 0, der Nullpunkt-Anker muss nicht mehr eingreifen.
    const standing = tracking.telemetry.filter(
      (item) => new Date(item.recordedAt).getTime() - new Date(referencePoints[0].recordedAt).getTime() <= 17_000
    );
    expect(standing.length).toBeGreaterThanOrEqual(15);
    expect(standing.every((item) => item.filteredSteps === 0 && item.progressSteps === 0)).toBe(true);
  });

  it("beginnt nach der Aufzeichnungsluecke mit dem echten Stand, nicht mit 5 bis 9", () => {
    const firstNonZero = tracking.telemetry.find((item) => item.filteredSteps > 0);
    expect(firstNonZero!.filteredSteps).toBe(4);
  });

  it("laesst den Zaehler in jeder stufenlosen Zone stehen", () => {
    let awarded = 0;
    reference.noStairsZones.forEach(([enteredAt, leftAt]) => {
      const gained =
        telemetryAt(tracking, referencePoints, leftAt).filteredSteps -
        telemetryAt(tracking, referencePoints, enteredAt).filteredSteps;
      expect(gained).toBeLessThanOrEqual(2);
      awarded += Math.max(0, gained);
    });
    expect(awarded).toBeLessThanOrEqual(6);
  });

  it("endet oben exakt bei 1150 und bleibt dort", () => {
    expect(tracking.finalSteps).toBe(defaultChallengeConfig.totalSteps);
    const tail = tracking.telemetry.slice(-10);
    expect(tail.every((item) => item.filteredSteps === defaultChallengeConfig.totalSteps)).toBe(true);
  });

  it("stuetzt die Wertung auf denselben Zaehler", () => {
    const result = validateRun(
      { startedAt: reference.run.startedAt, endedAt: reference.run.endedAt },
      referencePoints,
      defaultChallengeConfig
    );
    expect(result.status).toBe("valid");
    expect(result.metrics.estimatedSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(result.checks.find((check) => check.rule === "routeProgress")?.level).toBe("pass");
  });

  it("wertet einen Lauf, der im Stand am Start endet, mit 0 Stufen", () => {
    const standingOnly = referencePoints.slice(0, 17);
    const result = validateRun(
      { startedAt: reference.run.startedAt, endedAt: standingOnly.at(-1)!.recordedAt },
      standingOnly,
      defaultChallengeConfig
    );
    expect(result.metrics.estimatedSteps).toBe(0);
    expect(result.status).not.toBe("valid");
  });
});

describe("Stufenzaehler: keine Schaetzung auf stufenlosen Wegen", () => {
  // Bei schlechtem GPS schaetzt der Tracker den Fortschritt aus der zuletzt
  // gemessenen Kadenz weiter. Auf einem stufenlosen Weg gibt es nichts zu
  // schaetzen — dort muss der Zaehler auch bei Signalverlust stehen bleiben.
  function truncateAndDegrade(elapsedSeconds: number, degradedSeconds = 12): RunPoint[] {
    const startMs = new Date(referencePoints[0].recordedAt).getTime();
    const kept = referencePoints.filter((point) => new Date(point.recordedAt).getTime() - startMs <= elapsedSeconds * 1000);
    const last = kept.at(-1)!;
    const lastMs = new Date(last.recordedAt).getTime();
    // Signalverlust: ±90 m und 60 m neben der Route. Ein Punkt exakt auf der
    // Route bliebe trotz ±90 m ueber der Konfidenzschwelle.
    const degraded: RunPoint[] = Array.from({ length: degradedSeconds }, (_, index) => ({
      ...last,
      recordedAt: new Date(lastMs + (index + 1) * 1000).toISOString(),
      lng: last.lng + 60 / (111_320 * Math.cos((last.lat * Math.PI) / 180)),
      accuracyM: 90
    }));
    return [...kept, ...degraded];
  }

  it("bleibt in der stufenlosen Zone stehen, wenn das Signal wegbricht", () => {
    // Zone 1 des Referenzlaufs, Zaehlerstand 240. Der Moment wird aus der
    // Telemetrie gewaehlt, nicht aus der Uhr: mitten in der Zone wackelt das
    // GPS zeitweise zwei Meter auf die naechste Treppe.
    const full = analyzeRouteTrack(referencePoints, defaultChallengeConfig);
    const startMs = new Date(referencePoints[0].recordedAt).getTime();
    const inZone = full.telemetry.find(
      (item) => new Date(item.recordedAt).getTime() - startMs >= 227_900 && item.filteredSteps === 240
    )!;
    const elapsedSeconds = (new Date(inZone.recordedAt).getTime() - startMs) / 1000;

    const track = truncateAndDegrade(elapsedSeconds);
    const tracking = analyzeRouteTrack(track, defaultChallengeConfig);
    expect(tracking.telemetry.at(-13)!.filteredSteps).toBe(240);
    expect(tracking.finalSteps).toBe(240);
    expect(tracking.inferredSteps).toBe(0);
  });

  it("schaetzt auf der Treppe unter denselben Bedingungen weiter", () => {
    // Gegenprobe kurz vor der Marke 300, mitten auf der Treppe.
    const track = truncateAndDegrade(280);
    const tracking = analyzeRouteTrack(track, defaultChallengeConfig);
    expect(tracking.inferredSteps).toBeGreaterThan(0);
    expect(tracking.finalSteps).toBeGreaterThan(tracking.telemetry.at(-13)!.filteredSteps);
  });
});
