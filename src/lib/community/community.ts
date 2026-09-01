import type { PublicRun } from "../types";

const pendingInviteKey = "tusiger.pendingInviteCode";
const legacyPendingInviteKey = "pendingInviteCode";
const productionAppBaseUrl = "https://supermario81.github.io/codex-tusiger/";

type ViteImportMeta = ImportMeta & {
  env?: {
    VITE_APP_BASE_URL?: string;
    BASE_URL?: string;
  };
};

export function filterLeaderboardByTab(runs: PublicRun[], tab: "Heute" | "Woche" | "Monat" | "Gesamt", now = new Date()): PublicRun[] {
  return runs.filter((run) => {
    const date = new Date(run.date);
    if (tab === "Heute") return date.toDateString() === now.toDateString();
    // Beide Enden begrenzen: ein in der Zukunft datierter Lauf rutschte sonst
    // durch jedes Zeitfenster.
    const age = now.getTime() - date.getTime();
    if (tab === "Woche") return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
    if (tab === "Monat") return age >= 0 && age <= 31 * 24 * 60 * 60 * 1000;
    return true;
  });
}

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getAppBaseUrl(): string {
  const env = (import.meta as ViteImportMeta).env;
  const configured = env?.VITE_APP_BASE_URL?.trim();
  if (configured) return withTrailingSlash(configured);

  if (typeof window !== "undefined") {
    const basePath = env?.BASE_URL?.trim() || "/codex-tusiger/";
    return withTrailingSlash(`${window.location.origin}${basePath.startsWith("/") ? basePath : `/${basePath}`}`);
  }

  return productionAppBaseUrl;
}

export function parseInviteInput(value: string): string {
  let candidate = value.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // Keep the original string if a pasted URL contains malformed escapes.
  }
  const joinMatch = candidate.match(/(?:^|[#/])join\/([^/?#&]+)/i);
  const searchArea = joinMatch?.[1] ?? candidate;
  const match = searchArea.match(/TUS[A-Z0-9]+/i);
  return match?.[0]?.toUpperCase() ?? "";
}

export function normalizeInviteCode(value: string): string {
  return parseInviteInput(value);
}

export function getInviteUrl(inviteCode: string): string {
  return `${getAppBaseUrl()}#/join/${normalizeInviteCode(inviteCode)}`;
}

export function savePendingInviteCode(value: string): string {
  const code = normalizeInviteCode(value);
  if (code && typeof localStorage !== "undefined") {
    localStorage.setItem(pendingInviteKey, code);
    localStorage.setItem(legacyPendingInviteKey, code);
  }
  if (code && typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(legacyPendingInviteKey, code);
  }
  return code;
}

export function readPendingInviteCode(): string {
  if (typeof localStorage !== "undefined") {
    const stored = normalizeInviteCode(localStorage.getItem(pendingInviteKey) ?? localStorage.getItem(legacyPendingInviteKey) ?? "");
    if (stored) return stored;
  }
  if (typeof sessionStorage !== "undefined") {
    return normalizeInviteCode(sessionStorage.getItem(legacyPendingInviteKey) ?? "");
  }
  return "";
}

export function clearPendingInviteCode() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(pendingInviteKey);
    localStorage.removeItem(legacyPendingInviteKey);
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(legacyPendingInviteKey);
  }
}
