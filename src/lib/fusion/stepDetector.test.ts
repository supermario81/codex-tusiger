import { describe, expect, it } from "vitest";
import { AccelerationStepDetector } from "./stepDetector";

// Erzeugt ein Beschleunigungssignal wie beim Treppensteigen: Schwerkraft als
// Sockel, darauf ein Ausschlag pro Schritt. Ein realer Schritt-Impuls dauert
// 150 bis 250 ms und wird hier als Grundschwingung mit einer Oberwelle
// modelliert — ein schmalerer Impuls waere bei 10 Hz Abtastung schlicht nicht
// aufloesbar und wuerde den Detektor an einem Artefakt des Testsignals messen.
function walk(steps: number, cadenceHz: number, amplitude = 3.5, sampleHz = 10, noise = 0) {
  const detector = new AccelerationStepDetector();
  const durationMs = (steps / cadenceHz) * 1000;
  for (let atMs = 0; atMs <= durationMs + 1500; atMs += 1000 / sampleHz) {
    const active = atMs <= durationMs;
    const phase = 2 * Math.PI * cadenceHz * (atMs / 1000);
    const pulse = active ? amplitude * (Math.sin(phase) + 0.3 * Math.sin(2 * phase)) : 0;
    const jitter = noise === 0 ? 0 : Math.sin(atMs * 0.7) * noise;
    detector.push(atMs, 0, 0, 9.81 + pulse + jitter);
  }
  return detector.stepCount;
}

describe("Schritterkennung aus der Beschleunigung", () => {
  it("zaehlt bei gleichmaessigem Gehtempo nahe der Wahrheit", () => {
    const counted = walk(100, 1.4);
    expect(Math.abs(counted - 100)).toBeLessThanOrEqual(10);
  });

  it("folgt auch einer langsamen Kadenz", () => {
    const counted = walk(60, 0.9);
    expect(Math.abs(counted - 60)).toBeLessThanOrEqual(8);
  });

  it("laesst sich von leichtem Rauschen nicht aus dem Takt bringen", () => {
    const clean = walk(80, 1.4);
    const noisy = walk(80, 1.4, 3.5, 10, 0.4);
    expect(Math.abs(noisy - clean)).toBeLessThanOrEqual(8);
  });

  it("zaehlt im Stillstand keine Schritte", () => {
    const detector = new AccelerationStepDetector();
    for (let atMs = 0; atMs < 30_000; atMs += 100) {
      detector.push(atMs, 0, 0, 9.81 + Math.sin(atMs * 0.01) * 0.15);
    }
    expect(detector.stepCount).toBe(0);
  });

  it("ignoriert unbrauchbare Messwerte", () => {
    const detector = new AccelerationStepDetector();
    for (let atMs = 0; atMs < 5_000; atMs += 100) {
      detector.push(atMs, Number.NaN, 0, 9.81);
    }
    expect(detector.stepCount).toBe(0);
  });

  it("haelt die Sperrzeit ein und zaehlt einen Schritt nicht doppelt", () => {
    const detector = new AccelerationStepDetector({ refractoryMs: 400 });
    // Zwei Ausschlaege im Abstand von 100 ms duerfen nur einen Schritt ergeben.
    for (let atMs = 0; atMs < 2_000; atMs += 100) {
      const spike = atMs === 1_000 || atMs === 1_100 ? 6 : 0;
      detector.push(atMs, 0, 0, 9.81 + spike);
    }
    expect(detector.stepCount).toBeLessThanOrEqual(1);
  });

  it("faengt nach reset wieder bei null an", () => {
    const detector = new AccelerationStepDetector();
    for (let atMs = 0; atMs < 10_000; atMs += 100) {
      detector.push(atMs, 0, 0, 9.81 + (atMs % 700 === 0 ? 5 : 0));
    }
    const before = detector.stepCount;
    detector.reset();
    expect(before).toBeGreaterThan(0);
    expect(detector.stepCount).toBe(0);
  });
});
