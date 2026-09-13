// Anzeige-Zaehler: folgt dem gemessenen Stufenstand in menschlicher Kadenz.
//
// Die Messung kann nicht bei 1 beginnen. GPS liefert einen Fix pro Sekunde,
// der Laeufer nimmt ein bis zwei Stufen pro Sekunde — der erste Fix mit
// Bewegung projiziert deshalb zwangslaeufig auf 2 oder mehr, nach einer
// Aufzeichnungsluecke (Handy in der Tasche, Safari pausiert) auf 4 oder mehr.
// Im Referenzlauf vom 2026-09-08 sprang der Zaehler nach 14 s Luecke von 0
// direkt auf 4, im Lauf vom 2026-07-14 auf 2.
//
// Die Messung bleibt unangetastet; sie ist die Wahrheit fuer Wertung und
// Bericht. Nur die Anzeige holt sie ein: immer ueber die 1, dann eine Stufe je
// Tick, solange der Rueckstand klein ist. Bei grossem Rueckstand (lange
// Luecke, Wiedereinstieg in einen laufenden Lauf, Ziel-Snap auf 1150) springt
// sie auf drei Stufen vor den Messwert und zaehlt die letzten einzeln — so
// ist sie nach einer Sekunde wieder auf Stand, statt minutenlang
// nachzuzaehlen. Rueckwaerts und beim Zuruecksetzen folgt sie sofort.

/** Takt der Anzeige. Vier Stufen je Sekunde liegen ueber jeder realen Kadenz. */
export const displayTickMs = 250;

const singleStepDeficit = 8;
const finalSingleSteps = 3;

export function advanceDisplayedSteps(displayed: number, measured: number): number {
  if (measured <= displayed) {
    return measured;
  }
  if (displayed <= 0) {
    return 1;
  }
  if (measured - displayed <= singleStepDeficit) {
    return displayed + 1;
  }
  return measured - finalSingleSteps;
}
