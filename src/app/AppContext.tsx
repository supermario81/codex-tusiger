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
  session: Session | null;
  user: User | null;
  userId: string;
  profile: Profile | null;
  config: ChallengeConfig;
  runs: RunRecord[];
  groups: Group[];
  leaderboard: PublicRun[];
  history: HistoryItem[];
  legalPages: LegalPage[];
  loginWithEmail: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  saveProfile: (input: { nickname: string; avatarUrl: string; language: "de" | "en" }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  logout: () => Promise<void>;
  saveRun: (run: RunRecord) => Promise<void>;
  createGroup: (group: Pick<Group, "name" | "description" | "isPrivate">) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group>;
  deleteAccount: () => Promise<void>;
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => Promise<void>;
  refreshData: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);
const anonymousUserId = "anonymous";

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
  const [leaderboard, setLeaderboard] = useState<PublicRun[]>([]);
  const [config, setConfig] = useState<ChallengeConfig>(defaultChallengeConfig);
  const [history, setHistory] = useState<HistoryItem[]>(historyFallback);
  const [legalPages, setLegalPages] = useState<LegalPage[]>(legalFallback);

  const user = session?.user ?? null;
  const userId = user?.id ?? anonymousUserId;

  const trackEvent = useCallback(async (eventName: string, metadata: Record<string, unknown> = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }
    await supabase.from("analytics_events").insert({
      user_id: supabase.auth.getUser ? (await supabase.auth.getUser()).data.user?.id ?? null : null,
      session_id: localStorage.getItem("tusiger.sessionId") ?? crypto.randomUUID(),
      event_name: eventName,
      page: window.location.hash || "/",
      metadata
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSetupError("Supabase ist noch nicht konfiguriert. Bitte VITE_SUPABASE_ANON_KEY als .env.local oder GitHub Secret setzen.");
      setReady(true);
      return;
    }

    setSetupError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData.session;
    setSession(currentSession);

    const [{ data: configRows }, { data: historyRows }, { data: legalRows }] = await Promise.all([
      supabase.from("challenge_config").select("*").eq("active", true).limit(1),
      supabase.from("history_content").select("*").eq("active", true).order("sort_order"),
      supabase.from("legal_pages").select("*").eq("active", true).order("slug")
    ]);

    if (configRows?.[0]) setConfig(fromConfigRow(configRows[0]));
    if (historyRows?.length) setHistory(historyRows.map(fromHistoryRow));
    if (legalRows?.length) setLegalPages(legalRows.map(fromLegalRow));

    if (!currentSession?.user) {
      setProfile(null);
      setRuns([]);
      setGroups([]);
    } else {
      const user_id = currentSession.user.id;
      const [{ data: profileRows }, { data: runRows }, { data: memberRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user_id).is("deleted_at", null).limit(1),
        supabase.from("runs").select("*").eq("user_id", user_id).order("started_at", { ascending: false }),
        supabase.from("group_members").select("role, groups(*)").eq("user_id", user_id)
      ]);
      const nextProfile = profileRows?.[0] ? fromProfileRow(profileRows[0]) : null;
      setProfile(nextProfile);
      const nextRuns = (runRows ?? []).map(fromRunRow);
      setRuns(nextRuns);
      setGroups((memberRows ?? []).flatMap((row) => {
        const groupRow = Array.isArray(row.groups) ? row.groups[0] : row.groups;
        return groupRow ? [fromGroupRow(groupRow as unknown as Record<string, unknown>, String(row.role))] : [];
      }));
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

    setReady(true);
  }, []);

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

  const loginWithEmail = useCallback(async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase fehlt: Bitte VITE_SUPABASE_ANON_KEY konfigurieren.");
    }
    await trackEvent("login_started", { method: "email" });
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true }
    });
    if (error) throw error;
  }, [trackEvent]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase fehlt: Bitte VITE_SUPABASE_ANON_KEY konfigurieren.");
    }
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
    await trackEvent("login_completed");
    await refreshData();
  }, [refreshData, trackEvent]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Bitte JPG, PNG oder WebP verwenden.");
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Avatar darf maximal 2 MB groß sein.");
    }
    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }, [user]);

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
    setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]);
    setLeaderboard((current) => run.status === "valid" ? [publicRunFromRun(run, current.length + 1, profile), ...current] : current);
  }, [profile, trackEvent, user]);

  const createGroup = useCallback(async (groupInput: Pick<Group, "name" | "description" | "isPrivate">) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from("groups")
      .insert({
        owner_user_id: user.id,
        name: groupInput.name,
        description: groupInput.description,
        invite_code: inviteCode,
        is_private: groupInput.isPrivate
      })
      .select("*")
      .single();
    if (error) throw error;
    await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "owner" });
    await trackEvent("group_created");
    const group = fromGroupRow(data, "owner");
    setGroups((current) => [group, ...current]);
    return group;
  }, [trackEvent, user]);

  const joinGroup = useCallback(async (inviteCode: string) => {
    if (!user || !supabase) throw new Error("Bitte zuerst einloggen.");
    const { data: group, error } = await supabase.from("groups").select("*").eq("invite_code", inviteCode.toUpperCase()).single();
    if (error) throw new Error("Invite-Code nicht gefunden.");
    const { error: joinError } = await supabase.from("group_members").upsert({ group_id: group.id, user_id: user.id, role: "member" }, { onConflict: "group_id,user_id" });
    if (joinError) throw joinError;
    await trackEvent("group_joined", { inviteCode });
    const next = fromGroupRow(group, "member");
    setGroups((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    return next;
  }, [trackEvent, user]);

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
      session,
      user,
      userId,
      profile,
      config,
      runs,
      groups,
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
      deleteAccount,
      trackEvent,
      refreshData
    }),
    [config, createGroup, deleteAccount, groups, history, joinGroup, leaderboard, legalPages, loginWithEmail, logout, profile, ready, refreshData, runs, saveProfile, saveRun, session, setupError, trackEvent, uploadAvatar, user, userId, verifyOtp]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
