import type { PublicRun } from "../types";

export function filterLeaderboardByTab(runs: PublicRun[], tab: "Heute" | "Woche" | "Monat" | "Gesamt", now = new Date()): PublicRun[] {
  return runs.filter((run) => {
    const date = new Date(run.date);
    if (tab === "Heute") return date.toDateString() === now.toDateString();
    if (tab === "Woche") return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
    if (tab === "Monat") return now.getTime() - date.getTime() <= 31 * 24 * 60 * 60 * 1000;
    return true;
  });
}

export function normalizeInviteCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function createInviteUrl(origin: string, path: string, inviteCode: string): string {
  return `${origin}${path}#/join/${normalizeInviteCode(inviteCode)}`;
}
