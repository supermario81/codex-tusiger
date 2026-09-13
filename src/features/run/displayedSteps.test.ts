import { describe, expect, it } from "vitest";
import { advanceDisplayedSteps, displayTickMs } from "./displayedSteps";

function run(start: number, measured: number): number[] {
  const out: number[] = [];
  let value = start;
  for (let i = 0; i < 100 && value !== measured; i += 1) {
    value = advanceDisplayedSteps(value, measured);
    out.push(value);
  }
  return out;
}

describe("Anzeige-Zaehler", () => {
  it("beginnt immer bei 1, auch wenn der erste Messwert hoeher liegt", () => {
    // Referenzlauf 2026-09-08: erster Messwert nach der Startluecke war 4.
    expect(run(0, 4)).toEqual([1, 2, 3, 4]);
    // Lauf 2026-07-14: erster Messwert war 2.
    expect(run(0, 2)).toEqual([1, 2]);
    expect(advanceDisplayedSteps(0, 1)).toBe(1);
  });

  it("zaehlt bei kleinem Rueckstand einzeln und laesst keine Zahl aus", () => {
    expect(run(10, 15)).toEqual([11, 12, 13, 14, 15]);
  });

  it("holt grossen Rueckstand in wenigen Ticks auf statt minutenlang nachzuzaehlen", () => {
    // Nach einer langen Luecke oder beim Wiedereinstieg in einen laufenden Lauf.
    const ticks = run(100, 400);
    expect(ticks.length).toBeLessThanOrEqual(4);
    expect(ticks.at(-1)).toBe(400);
    expect(ticks.length * displayTickMs).toBeLessThanOrEqual(1000);
  });

  it("erreicht beim Ziel-Snap exakt 1150 und schiesst nicht darueber", () => {
    // Am Zielpodest springt die Messung von ~1141 auf 1150.
    const ticks = run(1141, 1150);
    expect(ticks.at(-1)).toBe(1150);
    expect(Math.max(...ticks)).toBe(1150);
  });

  it("folgt rueckwaerts und beim Zuruecksetzen sofort", () => {
    expect(advanceDisplayedSteps(40, 38)).toBe(38);
    expect(advanceDisplayedSteps(40, 0)).toBe(0);
    expect(advanceDisplayedSteps(40, 40)).toBe(40);
  });

  it("haelt bei realer Kadenz Schritt", () => {
    // 2,4 Stufen je Sekunde ist Rekordtempo auf dieser Treppe. Bei vier Ticks je
    // Sekunde darf die Anzeige nie mehr als ein paar Stufen hinterherlaufen.
    let displayed = 0;
    let measured = 0;
    let maxLag = 0;
    for (let tick = 1; tick <= 400; tick += 1) {
      measured = Math.round((tick * displayTickMs) / 1000 * 2.4);
      displayed = advanceDisplayedSteps(displayed, measured);
      maxLag = Math.max(maxLag, measured - displayed);
    }
    expect(maxLag).toBeLessThanOrEqual(2);
  });
});
