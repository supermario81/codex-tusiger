import { describe, expect, it } from "vitest";
import { classifyJumpEvents, type JumpFlagSample } from "./routeMatcher";

// Positionen entlang Nord-Richtung; 1 Grad Breite entspricht ca. 111320 m.
function northOf(meters: number) {
  return { lat: 47.315 + meters / 111_320, lng: 7.8869 };
}

function sample(second: number, fromM: number, toM: number, accuracyBudgetM: number): JumpFlagSample {
  const displacementM = Math.abs(toM - fromM);
  const from = northOf(fromM);
  const to = northOf(toM);
  return {
    atMs: second * 1000,
    speedMps: displacementM,
    displacementM,
    routeSnap: false,
    accuracyBudgetM,
    fromLat: from.lat,
    fromLng: from.lng,
    toLat: to.lat,
    toLng: to.lng
  };
}

describe("classifyJumpEvents", () => {
  // Der Feldtest vom 10.08.2026: ein 44-m-Ausschlag bei zeitweise ±63 m
  // Genauigkeit erzeugte zwei Messungen über 8 m/s und wurde als physischer
  // Sprung gewertet — der Lauf landete dadurch in der Prüfung.
  it("wertet einen Ausreisser hin und zurueck nicht als physischen Sprung", () => {
    const events = classifyJumpEvents([sample(1, 0, 44, 126), sample(2, 44, 0, 126)]);
    expect(events.physicalJumpEventCount).toBe(0);
    expect(events.routeRematchEventCount).toBe(1);
  });

  it("wertet den Ausreisser auch bei gutem Empfang nicht als Sprung, weil netto nichts passiert", () => {
    expect(classifyJumpEvents([sample(1, 0, 44, 12), sample(2, 44, 0, 12)]).physicalJumpEventCount).toBe(0);
  });

  it("erkennt anhaltende Fortbewegung mit 20 m/s als physisch", () => {
    const event = [0, 1, 2, 3, 4].map((i) => sample(i + 1, i * 20, (i + 1) * 20, 20));
    expect(classifyJumpEvents(event).physicalJumpEventCount).toBe(1);
  });

  it("erkennt 60 m/s auch bei schlechtem Empfang als physisch", () => {
    const event = [0, 1, 2, 3, 4].map((i) => sample(i + 1, i * 60, (i + 1) * 60, 60));
    expect(classifyJumpEvents(event).physicalJumpEventCount).toBe(1);
  });

  it("meldet einen Einzelversatz ueber 100 m unabhaengig von der Genauigkeit", () => {
    expect(classifyJumpEvents([sample(1, 0, 150, 400)]).physicalJumpEventCount).toBe(1);
  });

  it("meldet eine Einweg-Drift bei gutem Empfang weiterhin als physisch", () => {
    const events = classifyJumpEvents([sample(1, 0, 44, 10), sample(2, 44, 88, 10)]);
    expect(events.physicalJumpEventCount).toBe(1);
    expect(events.maxJumpDisplacementM).toBeCloseTo(44, 0);
  });

  it("trennt zwei zeitlich weit auseinanderliegende Ereignisse", () => {
    const first = [0, 1, 2, 3, 4].map((i) => sample(i + 1, i * 20, (i + 1) * 20, 20));
    const second = first.map((s) => ({ ...s, atMs: s.atMs + 60_000 }));
    expect(classifyJumpEvents([...first, ...second]).physicalJumpEventCount).toBe(2);
  });
});
