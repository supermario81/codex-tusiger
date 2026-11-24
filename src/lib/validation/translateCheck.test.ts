import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { translateCheck } from "./translateCheck";

// Jeder deutsche Text aus der Validierung muss eine englische Fassung haben.
it("übersetzt jeden Prüftext vollständig", () => {
  const source = ["validateRun.ts", "verdict.ts"]
    .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
    .join("\n")
    .replace(/^\s*(\/\/|\*).*$/gm, "");
  const literals = [...source.matchAll(/"([^"\n]*[ ÄÖÜäöü][^"\n]*)"/g)].map((match) => match[1]).filter((text) => !text.startsWith("."));
  const templates = [...source.matchAll(/`([^`]+)`/g)].map((match) => match[1].replace(/\$\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, "1"));
  expect(literals.length).toBeGreaterThan(50);
  const german = /[äöüßÄÖÜ]|\b(nicht|der|die|das|bei|vom|von|keine|Stufen|Punkte|kumulativ|Ziel|Zeit|ohne|und)\b/;
  const samples = [
    ...literals,
    // Zusammengesetzte Ereignis-Texte stehen unten als echte Beispiele.
    ...templates.filter((text) => !/Ereignis1/.test(text)),
    "2 physische Sprung-Ereignisse, max. Versatz 5 m; 1 Ereignis ohne echten Ortswechsel (GPS-Ausreißer/Neuzuordnung, kein GPS-Sprung)",
    "138 m Anstieg Start→Ziel, kumulativ 157 m; Geräte-Höhe driftet um -65 m gegen das Routenprofil, Routenmodell 207 m (gültig 205–265 m)"
  ];
  expect(samples.map((text) => translateCheck(text, "en")).filter((text) => german.test(text))).toEqual([]);
  expect(translateCheck("Zeit", "de")).toBe("Zeit");
});
