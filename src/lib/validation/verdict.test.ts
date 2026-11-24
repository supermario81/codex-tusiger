import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verdict } from "./verdict";
import { defaultChallengeConfig as c } from "../../data/challenge";
import { toRunInsert } from "../supabase/mappers";
import type { RunPoint, RunRecord } from "../types";

const { run } = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/reference-run-2026-09-08.json", import.meta.url), "utf8")
) as { run: { startedAt: string; endedAt: string; points: RunPoint[] } };
const row = { started_at: run.startedAt, ended_at: run.endedAt };
const points = run.points.map((p) => ({
  recorded_at: p.recordedAt, lat: p.lat, lng: p.lng, altitude_m: p.altitudeM,
  altitude_accuracy_m: p.altitudeAccuracyM, accuracy_m: p.accuracyM, speed_mps: p.speedMps, heading: p.heading
}));
const config = {
  total_steps: c.totalSteps, start_lat: c.startLat, start_lng: c.startLng, start_radius_m: c.startRadiusM,
  end_lat: c.endLat, end_lng: c.endLng, end_radius_m: c.endRadiusM,
  elevation_valid_min_m: c.elevationValidMinM, elevation_valid_max_m: c.elevationValidMaxM,
  elevation_review_min_m: c.elevationReviewMinM, elevation_review_max_m: c.elevationReviewMaxM,
  gps_accuracy_valid_max_m: c.gpsAccuracyValidMaxM, gps_accuracy_review_max_m: c.gpsAccuracyReviewMaxM,
  min_duration_seconds: c.minDurationSeconds, max_duration_seconds: c.maxDurationSeconds
};
const start = Date.parse(run.startedAt);
const at = (p: { recorded_at: string }) => (Date.parse(p.recorded_at) - start) / 1000;

describe("Server-Wertung", () => {
  it("wertet den echten Lauf gültig", () => {
    expect(verdict(row, points, config)).toMatchObject({ status: "valid", validation_score: 100, estimated_steps: 1150 });
  });
  it("wertet einen Lauf ohne Punkte, mit spätem Start oder aus der Zukunft nie gültig", () => {
    expect(verdict(row, [], config).status).toBe("invalid");
    expect(verdict({ ...row, started_at: new Date(start + 600_000).toISOString() }, points, config).status).not.toBe("valid");
    expect(verdict(row, points, config, start).status).toBe("invalid");
  });
  it("gibt einen lückenhaften Lauf mit belegtem Start und Ziel zur Prüfung", () => {
    const gappy = points.filter((p) => at(p) < 8 || at(p) > 1000);
    expect(verdict(row, gappy, config).status).toBe("needs_review");
  });
  it("schickt den Lauf ohne Telemetrie", () => {
    expect(toRunInsert({ trackingSummary: { telemetry: [1] } } as unknown as RunRecord).tracking_summary?.telemetry).toEqual([]);
  });
  it("hat ein aktuelles Bundle (npm run build:verdict)", () => {
    const fresh = execFileSync("npx", ["esbuild", "src/lib/validation/verdict.ts", "--bundle", "--format=esm", "--charset=utf8"], { encoding: "utf8" });
    expect(fresh).toBe(readFileSync("supabase/functions/validate-run/verdict.js", "utf8"));
  });
});
