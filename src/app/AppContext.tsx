import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultChallengeConfig, historyFallback, legalFallback } from "../data/challenge";
import { isSupabaseConfigured, supabase } from "../lib/supabase/client";
import { fromConfigRow, fromGroupRow, fromHistoryRow, fromLegalRow, fromProfileRow, fromRunRow, toRunInsert } from "../lib/supabase/mappers";
import { localStore } from "../lib/storage/localStore";
import type { ChallengeConfig, Group, HistoryItem, LegalPage, Profile, PublicRun, RunRecord } from "../lib/types";

type AppContextValue = {
  ready: boolean;
  setupError: string | null;
  isSupabaseConfigured: boolean;
  language: "de" | "en";
  setLanguage: (language: "de" | "en") => void;
  session: Session | null;
  user: User | null;
  userId: string;
  profile: Profile | null;
  config: ChallengeConfig;
  runs: RunRecord[];
  groups: Group[];
  publicGroups: Group[];
  leaderboard: PublicRun[];
  history: HistoryItem[];
  legalPages: LegalPage[];
  loginWithEmail: (email: string, language?: "de" | "en") => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  saveProfile: (input: { nickname: string; avatarUrl: string; language: "de" | "en" }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  logout: () => Promise<void>;
  saveRun: (run: RunRecord) => Promise<void>;
  createGroup: (group: Pick<Group, "name" | "description" | "isPrivate">) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => Promise<void>;
  refreshData: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);
const anonymousUserId = "anonymous";
const languageKey = "tusiger.language";

function getInitialLanguage(): "de" | "en" {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(languageKey);
    if (stored === "en" || stored === "de") return stored;
  }
  if (typeof navigator !== "undefined") {
    return navigator.language.toLowerCase().startsWith("en") ? "en" : "de";
  }
  return "de";
}

function errorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string") {
    return cause.message;
  }
  return "Supabase konnte nicht geladen werden.";
}

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateInviteCode() {
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `TUS${randomPart}`;
}

function withRpcFallbackMessage(action: string, rpcError: unknown, fallbackError: unknown) {
  return new Error(`${action}: ${errorMessage(fallbackError)} RPC: ${errorMessage(rpcError)}. Bitte Supabase-Migration 0005_group_rpc.sql ausführen, falls geschlossene Invite-Links nicht funktionieren.`);
}

function avatarStoragePath(publicUrl: string) {
  const marker = "/storage/v1/object/public/avatars/";
  const index = publicUrl.indexOf(marker);
  return index >= 0 ? decodeURIComponent(publicUrl.slice(index + marker.length)) : "";
}

async function compressAvatarToWebp(file: File) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
      image.src = sourceUrl;
    });

    const maxSide = 720;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Avatar konnte nicht verarbeitet werden.");
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= 1024 * 1024) return blob;
    }
    throw new Error("Avatar konnte nicht unter 1 MB optimiert werden.");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function publicRunFromRun(run: RunRecord, rank: number, profile?: Profile | null): PublicRun {
  return {
    id: run.id,
    rank,
    nickname: profile?.nickname ?? "Tusiger",
    avatarUrl: profile?.avatarUrl ?? "",
    durationSeconds: run.durationSeconds,
    date: run.endedAt ?? run.startedAt,
    status: run.status,
    isCurrentUser: true
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [leaderboard, setLeaderboard] = useState<PublicRun[]>([]);
  const [config, setConfig] = useState<ChallengeConfig>(defaultChallengeConfig);
  const [history, setHistory] = useState<HistoryItem[]>(historyFallback);
  const [legalPages, setLegalPages] = useState<LegalPage[]>(legalFallback);
  const [language, setLanguageState] = useState<"de" | "en">(getInitialLanguage);

  const user = session?.user ?? null;
  const userId = user?.id ?? anonymousUserId;

  const setLanguage = useCallback((nextLanguage: "de" | "en") => {
    setLanguageState(nextLanguage);
    localStorage.setItem(languageKey, nextLanguage);
  }, []);

  const trackEvent = useCallback(async (eventName: string, metadata: Record<string, unknown> = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }
    try {
      await supabase.from("analytics_events").insert({
        user_id: supabase.auth.getUser ? (await supabase.auth.getUser()).data.user?.id ?? null : null,
        session_id: localStorage.getItem("tusiger.sessionId") ?? crypto.randomUUID(),
        event_name: eventName,
        page: window.location.hash || "/",
        metadata
      });
    } catch {
      // Analytics must never block the app.
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSetupError("Supabase ist noch nicht konfiguriert. Bitte VITE_SUPABASE_ANON_KEY als .env.local oder GitHub Secret setzen.");
      setReady(true);
      return;
    }

    try {
      setSetupError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;
      setSession(currentSession);

      const [{ data: configRows, error: configError }, { data: historyRows }, { data: legalRows }] = await Promise.all([
        supabase.from("challenge_config").select("*").eq("active", true).limit(1),
        supabase.from("history_content").select("*").eq("active", true).order("sort_order"),
        supabase.from("legal_pages").select("*").eq("active", true).order("slug")
      ]);

      if (configError) throw configError;
      if (configRows?.[0]) setConfig(fromConfigRow(configRows[0]));
      if (historyRows?.length) setHistory(historyRows.map(fromHistoryRow));
      if (legalRows?.length) setLegalPages(legalRows.map(fromLegalRow));

      if (!currentSession?.user) {
        setProfile(null);
        setRuns([]);
        setGroups([]);
        setPublicGroups([]);
      } else {
        const user_id = currentSession.user.id;
        const [{ data: profileRows }, { data: runRows }, myGroupsResult, publicGroupsResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user_id).is("deleted_at", null).limit(1),
          supabase.from("runs").select("*").eq("user_id", user_id).order("started_at", { ascending: false }),
          supabase.rpc("list_my_groups"),
          supabase.rpc("list_public_groups")
        ]);
        const nextProfile = profileRows?.[0] ? fromProfileRow(profileRows[0]) : null;
        setProfile(nextProfile);
        if (nextProfile?.language) {
          setLanguage(nextProfile.language);
        }
        const nextRuns = (runRows ?? []).map(fromRunRow);
        setRuns(nextRuns);
        const nextGroups: Group[] = myGroupsResult.error ? [] : ((myGroupsResult.data ?? []) as Record<string, unknown>[]).map((row) => fromGroupRow(row, String(row.role ?? "member")));
        setGroups(nextGroups);
        const memberIds = new Set(nextGroups.map((item) => item.id));
        setPublicGroups(
          publicGroupsResult.error
            ? []
            : ((publicGroupsResult.data ?? []) as Record<string, unknown>[])
              .map((row) => fromGroupRow(row, String(row.role ?? "member")))
              .filter((item) => !memberIds.has(item.id))
        );
      }

      const { data: leaderboardRows } = await supabase
        .from("leaderboard_public")
        .select("*")
        .order("duration_seconds", { ascending: true })
        .limit(100);

      setLeaderboard(
        (leaderboardRows ?? []).map((row, index) => ({
          id: String(row.id),
          rank: index + 1,
          nickname: String(row.nickname ?? "Tusiger"),
          avatarUrl: String(row.avatar_url ?? ""),
          durationSeconds: Number(row.duration_seconds),
          date: String(row.ended_at ?? row.started_at),
          status: "valid",
          isCurrentUser: row.user_id === currentSession?.user.id
        }))
      );
    } catch (cause) {
      const message = errorMessage(cause);
      setSetupError(`Supabase Setup unvollständig: ${message}. Bitte Migration ausführen und GitHub Secret VITE_SUPABASE_ANON_KEY setzen.`);
      setSession(null);
      setProfile(null);
      setRuns([]);
      setGroups([]);
      setPublicGroups([]);
      setLeaderboard([]);
    } finally {
      setReady(true);
    }
  }, [setLanguage]);

  useEffect(() => {
    localStorage.setItem("tusiger.sessionId", localStorage.getItem("tusiger.sessionId") ?? crypto.randomUUID());
    void refreshData();

    if (!supabase) return undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void refreshData();
    });
    return () => data.subscription.unsubscribe();
  }, [refreshData]);

  const loginWithEmail = useCallback(async (email: string, requestedLanguage: "de" | "en" = language) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase fehlt: Bitte VITE_SUPABASE_ANON_KEY konfigurieren.");
    }
    await trackEvent("login_started", { method: "email" });
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail(email),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
        data: { language: requestedLanguage }
      }
    });
    if (error) throw error;
  }, [language, trackEvent]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase fehlt: Bitte VITE_SUPABASE_ANON_KEY konfigurieren.");
    }
    const normalizedEmail = cleanEmail(email);
    const cleanToken = token.trim();
    const { error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: cleanToken, type: "email" });
    if (error) throw error;
    await trackEvent("login_completed");
    await refreshData();
  }, [refreshData, trackEvent]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Bitte JPG, PNG oder WebP verwenden.");
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error("Avatar-Ausgangsbild darf maximal 8 MB groß sein.");
    }
    const blob = await compressAvatarToWebp(file);
    const oldPath = profile?.avatarUrl ? avatarStoragePath(profile.avatarUrl) : "";
    const path = `${user.id}/avatar-${Date.now()}.webp`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/webp" });
    if (error) throw error;
    if (oldPath && oldPath.startsWith(`${user.id}/`) && oldPath !== path) {
      await supabase.storage.from("avatars").remove([oldPath]).catch(() => undefined);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }, [profile?.avatarUrl, user]);

  const saveProfile = useCallback(async (input: { nickname: string; avatarUrl: string; language: "de" | "en" }) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      nickname: input.nickname,
      avatar_url: input.avatarUrl,
      language: input.language,
      role: profile?.role ?? "user",
      deleted_at: null,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error) throw error;
    await supabase.auth.updateUser({ data: { language: input.language } }).catch(() => undefined);
    await trackEvent("profile_completed");
    await refreshData();
  }, [profile?.role, refreshData, trackEvent, user]);

  const logout = useCallback(async () => {
    localStore.clearActiveRun();
    await supabase?.auth.signOut();
    setSession(null);
    setProfile(null);
    setRuns([]);
    setGroups([]);
  }, []);

  const saveRun = useCallback(async (run: RunRecord) => {
    if (!user || !supabase) {
      localStore.upsertRun(run);
      setRuns(localStore.readRuns());
      return;
    }
    const { error } = await supabase.from("runs").upsert(toRunInsert(run));
    if (error) throw error;
    if (run.points.length > 0) {
      const { error: pointError } = await supabase.from("run_points").insert(
        run.points.map((point) => ({
          run_id: run.id,
          user_id: user.id,
          recorded_at: point.recordedAt,
          lat: point.lat,
          lng: point.lng,
          altitude_m: point.altitudeM,
          altitude_accuracy_m: point.altitudeAccuracyM,
          accuracy_m: point.accuracyM,
          speed_mps: point.speedMps,
          heading: point.heading
        }))
      );
      if (pointError) throw pointError;
    }
    await trackEvent("run_validated", { status: run.status });
    localStore.upsertRun(run);
    setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]);
    setLeaderboard((current) => run.status === "valid" ? [publicRunFromRun(run, current.length + 1, profile), ...current] : current);
  }, [profile, trackEvent, user]);

  const createGroup = useCallback(async (groupInput: Pick<Group, "name" | "description" | "isPrivate">) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    const currentUser = user;
    const currentSupabase = supabase;

    async function createDirect(rpcError?: unknown) {
      const id = crypto.randomUUID();
      const inviteCode = generateInviteCode();
      const row = {
        id,
        owner_user_id: currentUser.id,
        name: groupInput.name.trim(),
        description: groupInput.description?.trim() ?? "",
        invite_code: inviteCode,
        is_private: groupInput.isPrivate
      };
      const { error: groupError } = await currentSupabase.from("groups").insert(row);
      if (groupError) {
        if (rpcError) throw withRpcFallbackMessage("Gruppe konnte nicht erstellt werden", rpcError, groupError);
        throw groupError;
      }
      const { error: memberError } = await currentSupabase.from("group_members").insert({ group_id: id, user_id: currentUser.id, role: "owner" });
      if (memberError) {
        await currentSupabase.from("groups").delete().eq("id", id);
        if (rpcError) throw withRpcFallbackMessage("Gruppenmitgliedschaft konnte nicht erstellt werden", rpcError, memberError);
        throw memberError;
      }
      return fromGroupRow({ ...row, member_count: 1, best_time_seconds: null }, "owner");
    }

    let group: Group;
    const rpcResult = await currentSupabase.rpc("create_tusiger_group", {
      p_name: groupInput.name.trim(),
      p_is_private: groupInput.isPrivate
    }).single();

    if (rpcResult.error) {
      group = await createDirect(rpcResult.error);
    } else {
      group = fromGroupRow(rpcResult.data as Record<string, unknown>, "owner");
    }

    await trackEvent("group_created");
    setGroups((current) => [group, ...current.filter((item) => item.id !== group.id)]);
    setPublicGroups((current) => current.filter((item) => item.id !== group.id));
    return group;
  }, [trackEvent, user]);

  const joinGroup = useCallback(async (inviteCode: string) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    const normalizedInviteCode = inviteCode.toUpperCase();
    const rpcResult = await supabase.rpc("join_tusiger_group", {
      p_invite_code: normalizedInviteCode
    }).single();

    let next: Group;
    if (rpcResult.error) {
      const { data: groupRow, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", normalizedInviteCode)
        .maybeSingle();
      if (groupError || !groupRow) {
        throw withRpcFallbackMessage("Gruppe konnte per Invite-Code nicht gefunden werden", rpcResult.error, groupError ?? new Error("Invite-Code nicht lesbar"));
      }
      const { error: joinError } = await supabase.from("group_members").upsert({
        group_id: String(groupRow.id),
        user_id: user.id,
        role: "member"
      }, { onConflict: "group_id,user_id" });
      if (joinError) throw withRpcFallbackMessage("Gruppe konnte nicht beigetreten werden", rpcResult.error, joinError);
      next = fromGroupRow({ ...groupRow, member_count: Number(groupRow.member_count ?? 0) + 1 }, "member");
    } else {
      next = fromGroupRow(rpcResult.data as Record<string, unknown>, "member");
    }

    await trackEvent("group_joined", { inviteCode: normalizedInviteCode });
    setGroups((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setPublicGroups((current) => current.filter((item) => item.id !== next.id));
    return next;
  }, [trackEvent, user]);

  const leaveGroup = useCallback(async (groupId: string) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    const { error } = await supabase.rpc("leave_tusiger_group", { p_group_id: groupId });
    if (error) throw error;
    setGroups((current) => current.filter((item) => item.id !== groupId));
    await trackEvent("group_left", { groupId });
    await refreshData();
  }, [refreshData, trackEvent, user]);

  const deleteAccount = useCallback(async () => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    await supabase.from("audit_logs").insert({ user_id: user.id, action: "account_deleted", entity_type: "profile", metadata: {} });
    await supabase.from("profiles").update({
      nickname: `deleted-${user.id.slice(0, 8)}`,
      avatar_url: null,
      deleted_at: new Date().toISOString()
    }).eq("user_id", user.id);
    await supabase.from("group_members").delete().eq("user_id", user.id);
    await trackEvent("account_deleted");
    await logout();
  }, [logout, trackEvent, user]);

  const value = useMemo(
    () => ({
      ready,
      setupError,
      isSupabaseConfigured,
      language,
      setLanguage,
      session,
      user,
      userId,
      profile,
      config,
      runs,
      groups,
      publicGroups,
      leaderboard,
      history,
      legalPages,
      loginWithEmail,
      verifyOtp,
      saveProfile,
      uploadAvatar,
      logout,
      saveRun,
      createGroup,
      joinGroup,
      leaveGroup,
      deleteAccount,
      trackEvent,
      refreshData
    }),
    [config, createGroup, deleteAccount, groups, history, joinGroup, language, leaderboard, leaveGroup, legalPages, loginWithEmail, logout, profile, publicGroups, ready, refreshData, runs, saveProfile, saveRun, session, setLanguage, setupError, trackEvent, uploadAvatar, user, userId, verifyOtp]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
