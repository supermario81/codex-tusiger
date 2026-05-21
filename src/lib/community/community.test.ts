import { describe, expect, it } from "vitest";
import { filterLeaderboardByTab, getInviteUrl, normalizeInviteCode, parseInviteInput } from "./community";
import type { PublicRun } from "../types";

const runs: PublicRun[] = [
  { id: "1", rank: 1, nickname: "A", avatarUrl: "", durationSeconds: 100, date: "2026-05-19T08:00:00Z", status: "valid", isCurrentUser: false },
  { id: "2", rank: 2, nickname: "B", avatarUrl: "", durationSeconds: 200, date: "2026-05-10T08:00:00Z", status: "valid", isCurrentUser: false }
];

describe("community helpers", () => {
  it("filters leaderboard by today", () => {
    expect(filterLeaderboardByTab(runs, "Heute", new Date("2026-05-19T12:00:00Z"))).toHaveLength(1);
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
