import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { routeSections } from "../../data/challenge";
import { AccelerationStepDetector } from "./stepDetector";

// Betrag der Beschleunigung aus dem Kalibriergang vom 2026-09-04, beide Geräte
// gleichzeitig bei 10 Hz. Pro Treppenabschnitt ist die real gezählte Stufenzahl
// bekannt — damit lässt sich der Detektor an echten Daten prüfen statt nur an
// synthetischen Signalen.
const fixture = JSON.parse(
  readFileSync(new URL("../../../test/fixtures/acceleration-2026-09-04.json", import.meta.url), "utf8")
) as {
  totalSteps: number;
  devices: Record<string, { samples: Array<[number, number]>; sections: Array<[number, number, number]> }>;
};

function countIn(samples: Array<[number, number]>, fromMs: number, toMs: number): number {
  const detector = new AccelerationStepDetector();
  samples.forEach(([atMs, magnitude]) => {
    if (atMs >= fromMs && atMs <= toMs) {
      detector.push(atMs, 0, 0, magnitude);
    }
  });
  return detector.stepCount;
}

describe.each(["android", "iphone"])("Schritterkennung auf echten Daten (%s)", (device) => {
  const { samples, sections } = fixture.devices[device];

  it("erkennt in der Summe über alle Treppenabschnitte nahezu die echte Stufenzahl", () => {
    const total = sections.reduce((sum, [from, to]) => sum + countIn(samples, from, to), 0);
    // Android traf 1150 exakt, das iPhone 1131. Beides liegt weit unter dem
    // GPS-Fehler von rund 20 Stufen pro Messpunkt.
    expect(Math.abs(total - fixture.totalSteps) / fixture.totalSteps).toBeLessThan(0.03);
  });

  it("trifft jeden ausreichend langen Abschnitt auf wenige Stufen genau", () => {
    // Gemessen wird gegen die Abschnittsgrößen aus Routenmodell v4, nicht
    // gegen die im Kalibriergang eingetippten Zahlen. Genau hier lag der lange
    // ungeklärte Widerspruch: Mit den alten Größen 195 und 487 zählte der
    // Detektor auf beiden Geräten 1,37 bzw. 0,91 Stufen pro Tritt. Mit den
    // korrigierten Größen 143 und 539 liegt er auf beiden Geräten bei 1,00
    // bis 1,01. Nicht der Detektor lag falsch, sondern die Abschnittsgrenze.
    //
    // Ausgenommen bleiben die beiden sehr kurzen Abschnitte (25 und 9 Stufen).
    // Dort entscheidet die Reaktionszeit beim Tippen über ein Viertel des
    // Ergebnisses — das misst nicht den Detektor, sondern den Daumen.
    const stairs = routeSections.filter((section) => section.kind === "stairs");
    expect(sections).toHaveLength(stairs.length);

    const longEnough = stairs
      .map((section, index) => [section.toSteps - section.fromSteps, index] as const)
      .filter(([size]) => size >= 30);
    expect(longEnough).toHaveLength(5);

    longEnough.forEach(([realSteps, index]) => {
      const [from, to] = sections[index];
      const counted = countIn(samples, from, to);
      const tolerance = Math.max(5, realSteps * 0.05);
      expect(Math.abs(counted - realSteps)).toBeLessThanOrEqual(tolerance);
    });
  });

  it("zählt auf stufenlosen Wegen ebenfalls Schritte — die dürfen keine Stufen werden", () => {
    // Über den ganzen Gang zählt der Detektor mehr als 1150, weil auf den
    // 52 m stufenlosem Weg echte Schritte anfallen. Genau deshalb entscheidet
    // das Routenmodell, ob ein erkannter Schritt als Stufe zählt.
    const whole = new AccelerationStepDetector();
    samples.forEach(([atMs, magnitude]) => whole.push(atMs, 0, 0, magnitude));
    expect(whole.stepCount).toBeGreaterThan(fixture.totalSteps);
    expect(whole.stepCount).toBeLessThan(fixture.totalSteps * 1.15);
  });
});
