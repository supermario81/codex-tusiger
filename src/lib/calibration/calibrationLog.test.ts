import { describe, expect, it } from "vitest";
import { calibrationLog } from "./calibrationLog";
import type { RunPoint } from "../types";

function point(lat: number, lng: number): RunPoint {
  return {
    recordedAt: new Date().toISOString(),
    lat,
    lng,
    altitudeM: 430,
    altitudeAccuracyM: 8,
    accuracyM: 6,
    speedMps: 0.7,
    heading: 318
  };
}

describe("Kalibrier-Recorder", () => {
  it("wechselt zwischen Treppe und stufenlosem Weg und zaehlt Abschnitte hoch", () => {
    calibrationLog.start("walk-1", Date.now());
    calibrationLog.addTrackPoint(point(47.315188, 7.886946));
    expect(calibrationLog.currentSectionKind).toBe("path");

    calibrationLog.startStairs();
    expect(calibrationLog.currentSectionKind).toBe("stairs");
    expect(calibrationLog.currentSectionIndex).toBe(1);

    calibrationLog.addTrackPoint(point(47.315491, 7.886578));
    calibrationLog.endStairs(180);
    expect(calibrationLog.currentSectionKind).toBe("path");
    expect(calibrationLog.currentSectionIndex).toBe(2);
    calibrationLog.stop();
  });

  it("ignoriert doppeltes Starten oder Beenden desselben Abschnitts", () => {
    calibrationLog.start("walk-2", Date.now());
    calibrationLog.addTrackPoint(point(47.315188, 7.886946));
    expect(calibrationLog.endStairs(50)).toBeNull();      // Treppe laeuft gar nicht
    calibrationLog.startStairs();
    expect(calibrationLog.startStairs()).toBeNull();      // laeuft bereits
    calibrationLog.stop();
  });

  it("zaehlt 50er-Marken und macht sie rueckgaengig", () => {
    calibrationLog.start("walk-3", Date.now());
    calibrationLog.addTrackPoint(point(47.315188, 7.886946));
    calibrationLog.startStairs();
    calibrationLog.addStepMarker(50);
    calibrationLog.addStepMarker(50);
    expect(calibrationLog.stepsFromMarkers).toBe(100);
    calibrationLog.undoLast();
    expect(calibrationLog.stepsFromMarkers).toBe(50);
    calibrationLog.stop();
  });

  it("zeichnet ohne GPS-Punkt keine Markierung auf", () => {
    calibrationLog.start("walk-4", Date.now());
    expect(calibrationLog.startStairs()).toBeNull();
    expect(calibrationLog.addStepMarker(50)).toBeNull();
    expect(calibrationLog.stepsFromMarkers).toBe(0);
    calibrationLog.stop();
  });

  it("schreibt Markierungen und Spur als CSV mit Kopfzeile", () => {
    calibrationLog.start("walk-5", Date.now());
    calibrationLog.addTrackPoint(point(47.315188, 7.886946));
    calibrationLog.startStairs();
    calibrationLog.addTrackPoint(point(47.315491, 7.886578));
    calibrationLog.endStairs(180);
    calibrationLog.stop();

    const marks = calibrationLog.marksCsv().trim().split("\n");
    expect(marks[0]).toBe(
      "mark_index,timestamp_ms,kind,section_index,section_kind,section_steps,marker_steps,lat,lng,altitude_m,accuracy_m,walk_id"
    );
    expect(marks[1]).toContain("stairs_start");
    expect(marks[2]).toContain("stairs_end");
    expect(marks[2]).toContain("180");
    expect(marks[2]).toContain("walk-5");

    const track = calibrationLog.trackCsv().trim().split("\n");
    expect(track[0]).toBe("timestamp_ms,lat,lng,altitude_m,altitude_accuracy_m,accuracy_m,speed_mps,heading,walk_id");
    expect(track).toHaveLength(3);
  });
});
