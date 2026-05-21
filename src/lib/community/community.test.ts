import { describe, expect, it } from "vitest";
import { createInviteUrl, filterLeaderboardByTab, normalizeInviteCode } from "./community";
import type { PublicRun } from "../types";

const runs: PublicRun[] = [
  { id: "1", rank: 1, nickname: "A", avatarUrl: "", durationSeconds: 100, date: "2026-05-19T08:00:00Z", status: "valid", isCurrentUser: false },
  { id: "2", rank: 2, nickname: "B", avatarUrl: "", durationSeconds: 200, date: "2026-05-10T08:00:00Z", status: "valid", isCurrentUser: false }
];

describe("community helpers", () => {
  it("filters leaderboard by today", () => {
    expect(filterLeaderboardByTab(runs, "Heute", new Date("2026-05-19T12:00:00Z"))).toHaveLength(1);
  });

  it("normalizes invite codes", () => {
    expect(normalizeInviteCode(" ab-12 ")).toBe("AB12");
    expect(normalizeInviteCode("https://supermario81.github.io/codex-tusiger/#/join/TUSAB12CD")).toBe("TUSAB12CD");
  });

  it("creates hash invite URLs for GitHub Pages", () => {
    expect(createInviteUrl("https://supermario81.github.io", "/codex-tusiger/", "ab12")).toBe("https://supermario81.github.io/codex-tusiger/#/join/AB12");
  });
});
