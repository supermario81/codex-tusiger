import { describe, expect, it } from "vitest";
import { defaultChallengeConfig, routeSections, stairsPerFootfallAt } from "../../data/challenge";

// Der Beschleunigungssensor zählt Tritte. Wie viele Stufen ein Tritt abdeckt,
// hängt vom Abschnitt ab — gemessen im Kalibriergang vom 2026-09-04 auf beiden
// Geräten unabhängig.
describe("Stufen pro Tritt je Abschnitt", () => {
  it("deckt die Strecke lückenlos von 0 bis zur vollen Stufenzahl ab", () => {
    const stairs = routeSections.filter((section) => section.kind === "stairs");
    expect(stairs[0].fromSteps).toBe(0);
    expect(stairs.at(-1)!.toSteps).toBe(defaultChallengeConfig.totalSteps);
    expect(stairs.map((section) => section.toSteps - section.fromSteps)).toEqual([245, 19, 97, 7, 100, 195, 487]);

    for (let i = 0; i < routeSections.length - 1; i += 1) {
      expect(routeSections[i].toSteps).toBe(routeSections[i + 1].fromSteps);
    }
  });

  it("vergibt auf stufenlosen Wegen keine Stufen pro Tritt", () => {
    routeSections
      .filter((section) => section.kind === "path")
      .forEach((section) => expect(section.stairsPerFootfall).toBe(0));
  });

  it("nimmt auf allen Treppenabschnitten ein Verhältnis von eins an", () => {
    // Bewusst überall 1,0: die im Kalibriergang gemessenen Abweichungen von
    // 1,35 und 0,90 sind unerklärt (siehe Kommentar in challenge.ts) und werden
    // deshalb nicht eingebaut.
    [100, 300, 400, 500, 600, 700, 1100].forEach((steps) =>
      expect(stairsPerFootfallAt(steps)).toBeCloseTo(1.0, 2)
    );
  });

  it("rechnet Tritte dort in Stufen um, wo das Verhältnis belegt ist", () => {
    // Gemessene Tritte des Kalibriergangs (Mittel beider Geräte) für die
    // Abschnitte, in denen Tritte und Stufen nachweislich eins zu eins liegen.
    const measured: Array<[number, number, number]> = [
      [248, 100, 245],
      [98, 300, 97],
      [100, 400, 100]
    ];
    measured.forEach(([footfalls, position, realSteps]) => {
      const estimate = footfalls * stairsPerFootfallAt(position);
      expect(Math.abs(estimate - realSteps) / realSteps).toBeLessThan(0.04);
    });
  });
});
