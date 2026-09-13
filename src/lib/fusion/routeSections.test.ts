import { describe, expect, it } from "vitest";
import { defaultChallengeConfig, routeSections, stairsPerFootfallAt } from "../../data/challenge";

// Der Beschleunigungssensor zählt Tritte. Wie viele Stufen ein Tritt abdeckt,
// hängt vom Abschnitt ab — gemessen im Kalibriergang vom 2026-09-04 auf beiden
// Geräten unabhängig, gegen die Abschnittsgrößen aus Routenmodell v4.
describe("Stufen pro Tritt je Abschnitt", () => {
  it("deckt die Strecke lückenlos von 0 bis zur vollen Stufenzahl ab", () => {
    const stairs = routeSections.filter((section) => section.kind === "stairs");
    expect(stairs[0].fromSteps).toBe(0);
    expect(stairs.at(-1)!.toSteps).toBe(defaultChallengeConfig.totalSteps);
    // Korrigiert mit Modell v4. Zuvor standen hier 195 und 487 für die
    // letzten beiden Abschnitte — die vorletzte Grenze war im Kalibriergang
    // 52 Stufen zu hoch eingetragen.
    expect(stairs.map((section) => section.toSteps - section.fromSteps)).toEqual([240, 25, 97, 9, 97, 143, 539]);

    for (let i = 0; i < routeSections.length - 1; i += 1) {
      expect(routeSections[i].toSteps).toBe(routeSections[i + 1].fromSteps);
    }
  });

  it("vergibt auf stufenlosen Wegen keine Stufen pro Tritt", () => {
    routeSections
      .filter((section) => section.kind === "path")
      .forEach((section) => {
        expect(section.stairsPerFootfall).toBe(0);
        // Am Zonenwert selbst muss der Weg gewinnen, nicht die Treppe, die
        // dort endet — sonst zaehlt ein Tritt auf dem Weg als Stufe.
        expect(stairsPerFootfallAt(section.fromSteps)).toBe(0);
        expect(stairsPerFootfallAt(section.fromSteps - 1)).toBeGreaterThan(0);
        expect(stairsPerFootfallAt(section.fromSteps + 1)).toBeGreaterThan(0);
      });
  });

  it("nimmt auf allen Treppenabschnitten ein Verhältnis von eins an", () => {
    // Überall 1,0 — und das ist jetzt gemessen statt angenommen. Unter Modell
    // v3 zeigten zwei Abschnitte 1,37 und 0,91 Stufen pro Tritt; mit den
    // korrigierten Größen 143 und 539 liegen beide bei 1,00 bis 1,01.
    [100, 300, 400, 500, 600, 700, 1100].forEach((steps) =>
      expect(stairsPerFootfallAt(steps)).toBeCloseTo(1.0, 2)
    );
  });

  it("rechnet Tritte dort in Stufen um, wo das Verhältnis belegt ist", () => {
    // Gemessene Tritte des Kalibriergangs (Mittel beider Geräte) gegen die
    // Abschnittsgrößen aus Modell v4. Die letzten beiden Zeilen sind der
    // Beleg für die korrigierte Grenze: mit 195 und 487 lagen sie 37 % bzw.
    // 9 % daneben, mit 143 und 539 unter 1 %.
    const measured: Array<[number, number, number]> = [
      [243, 100, 240],
      [96, 300, 97],
      [98, 400, 97],
      [142.5, 500, 143],
      [535.5, 700, 539]
    ];
    measured.forEach(([footfalls, position, realSteps]) => {
      const estimate = footfalls * stairsPerFootfallAt(position);
      expect(Math.abs(estimate - realSteps) / realSteps).toBeLessThan(0.04);
    });
  });
});
