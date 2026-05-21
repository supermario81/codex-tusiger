import type { PublicRun } from "../types";

const pendingInviteKey = "tusiger.pendingInviteCode";

export function filterLeaderboardByTab(runs: PublicRun[], tab: "Heute" | "Woche" | "Monat" | "Gesamt", now = new Date()): PublicRun[] {
  return runs.filter((run) => {
    const date = new Date(run.date);
    if (tab === "Heute") return date.toDateString() === now.toDateString();
    if (tab === "Woche") return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
    if (tab === "Monat") return now.getTime() - date.getTime() <= 31 * 24 * 60 * 60 * 1000;
    return true;
  });
}

function inviteCandidate(value: string): string {
  let candidate = value.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // Keep the original string if a pasted URL contains malformed escapes.
  }
  const joinMatch = candidate.match(/(?:^|[#/])join\/([^/?#&]+)/i);
  if (joinMatch?.[1]) return joinMatch[1];
  return candidate;
}

export function normalizeInviteCode(value: string): string {
  return inviteCandidate(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function createInviteUrl(origin: string, path: string, inviteCode: string): string {
  return `${origin}${path}#/join/${normalizeInviteCode(inviteCode)}`;
}

export function savePendingInviteCode(value: string): string {
  const code = normalizeInviteCode(value);
  if (code && typeof localStorage !== "undefined") {
    localStorage.setItem(pendingInviteKey, code);
  }
  return code;
}

export function readPendingInviteCode(): string {
  if (typeof localStorage === "undefined") return "";
  return normalizeInviteCode(localStorage.getItem(pendingInviteKey) ?? "");
}

export function clearPendingInviteCode() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(pendingInviteKey);
  }
}
