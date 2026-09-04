import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
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

  it("trifft die Abschnitte mit verlässlicher Zeitgrenze auf wenige Stufen genau", () => {
    // Der Abschnitt mit 195 Stufen und der darauffolgende mit 487 sind
    // ausgenommen: dort wurde die Grenze ein paar Schritte zu früh getippt,
    // wodurch rund 50 Stufen ins nächste Zeitfenster rutschen. Der unabhängige
    // Lauf vom 2026-07-14 bestätigt, dass die eingetragenen Zahlen stimmen —
    // nur der Zeitpunkt der Markierung war ungenau.
    const reliable = sections.filter(([, , realSteps]) => realSteps !== 195 && realSteps !== 487);
    expect(reliable).toHaveLength(5);

    reliable.forEach(([from, to, realSteps]) => {
      const counted = countIn(samples, from, to);
      const tolerance = Math.max(4, realSteps * 0.1);
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
