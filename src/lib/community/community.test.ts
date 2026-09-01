import { describe, expect, it } from "vitest";
import { filterLeaderboardByTab, getInviteUrl, normalizeInviteCode, parseInviteInput, rankLeaderboard } from "./community";
import type { PublicRun } from "../types";

const runs: PublicRun[] = [
  { id: "1", rank: 1, nickname: "A", avatarUrl: "", durationSeconds: 100, date: "2026-05-19T08:00:00Z", status: "valid", isCurrentUser: false },
  { id: "2", rank: 2, nickname: "B", avatarUrl: "", durationSeconds: 200, date: "2026-05-10T08:00:00Z", status: "valid", isCurrentUser: false }
];

describe("community helpers", () => {
  it("filters leaderboard by today", () => {
    expect(filterLeaderboardByTab(runs, "Heute", new Date("2026-05-19T12:00:00Z"))).toHaveLength(1);
  });

  // Die Rangliste zeigte den Rang aus der ungefilterten Gesamtliste: im Tab
  // "Heute" trug der einzige sichtbare Lauf plötzlich Rang 2.
  it("vergibt den Rang erst nach dem Zeitfilter", () => {
    const filtered = filterLeaderboardByTab(runs, "Heute", new Date("2026-05-19T12:00:00Z"));
    expect(filtered[0].rank).toBe(1);

    const secondOnly = filterLeaderboardByTab(runs, "Heute", new Date("2026-05-10T12:00:00Z"));
    expect(secondOnly[0].rank).toBe(2);
    expect(rankLeaderboard(secondOnly)[0].rank).toBe(1);
  });

  it("nummeriert eine gefilterte Liste lueckenlos ab 1", () => {
    expect(rankLeaderboard(runs).map((run) => run.rank)).toEqual([1, 2]);
    expect(rankLeaderboard([]).length).toBe(0);
  });

  it("laesst in der Zukunft datierte Laeufe nicht durch die Zeitfenster rutschen", () => {
    const future: PublicRun[] = [
      { ...runs[0], id: "future", date: "2027-01-01T08:00:00Z" }
    ];
    const now = new Date("2026-05-19T12:00:00Z");
    expect(filterLeaderboardByTab(future, "Woche", now)).toHaveLength(0);
    expect(filterLeaderboardByTab(future, "Monat", now)).toHaveLength(0);
    expect(filterLeaderboardByTab(future, "Gesamt", now)).toHaveLength(1);
  });

  it("extracts invite codes from code-only and full links", () => {
    expect(parseInviteInput("TUS5D29A02B")).toBe("TUS5D29A02B");
    expect(parseInviteInput("tus5d29a02b")).toBe("TUS5D29A02B");
    expect(normalizeInviteCode("https://supermario81.github.io/codex-tusiger/#/join/TUSAB12CD")).toBe("TUSAB12CD");
    expect(normalizeInviteCode("https://supermario81.github.io/codex-tusiger/images/twint-1000er-staegli.jpg#/join/TUS956F42A4")).toBe("TUS956F42A4");
  });

  it("creates hash invite URLs without leaking asset paths", () => {
    expect(getInviteUrl("TUS956F42A4")).toContain("#/join/TUS956F42A4");
    expect(getInviteUrl("https://supermario81.github.io/codex-tusiger/images/twint-1000er-staegli.jpg#/join/TUS5D29A02B")).toContain("#/join/TUS5D29A02B");
    expect(getInviteUrl("https://supermario81.github.io/codex-tusiger/images/twint-1000er-staegli.jpg#/join/TUS5D29A02B")).not.toContain("twint-1000er-staegli.jpg");
  });
});
