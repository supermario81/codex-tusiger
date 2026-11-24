import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultChallengeConfig, historyFallback, legalFallback } from "../data/challenge";
import { normalizeInviteCode } from "../lib/community/community";
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
  t: (de: string, en: string) => string;
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
  saveProfile: (input: { nickname: string; avatarUrl: string; language: "de" | "en"; showInPublicLeaderboard?: boolean }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  logout: () => Promise<void>;
  saveRun: (run: RunRecord, needsReview?: boolean) => Promise<void>;
  loadLeaderboard: (since: Date | null, groupId?: string) => Promise<PublicRun[]>;
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

function tr(de: string, en: string) {
  return getInitialLanguage() === "en" ? en : de;
}

function errorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string") {
    return cause.message;
  }
  return tr("Supabase konnte nicht geladen werden.", "Supabase could not be loaded.");
}

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

function friendlyGroupError(cause: unknown, language: "de" | "en", fallbackKey: "create" | "join" | "leave" = "join") {
  const message = errorMessage(cause).toLowerCase();
  if (message.includes("group_name_already_exists") || message.includes("groups_unique_name_lower") || message.includes("duplicate key")) {
    return language === "en"
      ? "A group with this name already exists. Please choose another name."
      : "Eine Gruppe mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.";
  }
  if (message.includes("group_name_too_short") || message.includes("too_short")) {
    return language === "en"
      ? "The group name must be at least 3 characters long."
      : "Der Gruppenname muss mindestens 3 Zeichen lang sein.";
  }
  if (message.includes("invalid_invite_code") || message.includes("group_not_found")) {
    return language === "en"
      ? "No group was found for this invite code."
      : "Zu diesem Einladungs-Code wurde keine Gruppe gefunden.";
  }
  if (message.includes("could not find the function") || message.includes("schema cache") || message.includes("list_my_groups") || message.includes("join_group_by_invite")) {
    return language === "en"
      ? "The group feature needs the latest Supabase migration. Please ask the admin to run 0006_fix_group_invites_rls.sql."
      : "Die Gruppenfunktion braucht die aktuelle Supabase-Migration. Bitte 0006_fix_group_invites_rls.sql ausführen.";
  }
  if (fallbackKey === "create") return language === "en" ? "Group could not be created." : "Gruppe konnte nicht erstellt werden.";
  if (fallbackKey === "leave") return language === "en" ? "Could not leave group." : "Gruppe konnte nicht verlassen werden.";
  return language === "en" ? "Could not join group." : "Gruppe konnte nicht beigetreten werden.";
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
      image.onerror = () => reject(new Error(tr("Bild konnte nicht gelesen werden.", "Image could not be read.")));
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
    if (!context) throw new Error(tr("Avatar konnte nicht verarbeitet werden.", "Avatar could not be processed."));
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= 1024 * 1024) return blob;
    }
    throw new Error(tr("Avatar konnte nicht unter 1 MB optimiert werden.", "Avatar could not be optimised below 1 MB."));
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
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

  // Wahl im Profil mitspeichern, sonst stellt das nächste Laden sie zurück.
  const changeLanguage = useCallback((nextLanguage: "de" | "en") => {
    setLanguage(nextLanguage);
    if (user && supabase) {
      void supabase.from("profiles").update({ language: nextLanguage }).eq("user_id", user.id).then(() => undefined);
    }
  }, [setLanguage, user]);

  const t = useCallback((de: string, en: string) => (language === "en" ? en : de), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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

  const loadLeaderboard = useCallback(async (since: Date | null, groupId?: string): Promise<PublicRun[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("get_leaderboard", { p_since: since?.toISOString() ?? null, p_group_id: groupId ?? null });
    if (error && import.meta.env.DEV) console.warn("Tusiger leaderboard query failed", error);
    return ((data ?? []) as Record<string, unknown>[]).map((row, index) => ({
      id: String(row.id),
      rank: index + 1,
      nickname: String(row.nickname ?? "Tusiger"),
      avatarUrl: String(row.avatar_url ?? ""),
      durationSeconds: Number(row.duration_seconds),
      date: String(row.ended_at),
      status: "valid",
      isCurrentUser: Boolean(row.is_current_user)
    }));
  }, []);

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSetupError(tr("Supabase ist noch nicht konfiguriert. Bitte VITE_SUPABASE_ANON_KEY als .env.local oder GitHub Secret setzen.", "Supabase is not configured yet. Please set VITE_SUPABASE_ANON_KEY in .env.local or as a GitHub secret."));
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
        const currentSupabase = supabase;
        const [{ data: profileRows }, { data: runRows }, myGroupsResult, publicGroupsResult] = await Promise.all([
          currentSupabase.from("profiles").select("*").eq("user_id", user_id).is("deleted_at", null).limit(1),
          currentSupabase.from("runs").select("*").eq("user_id", user_id).order("started_at", { ascending: false }),
          currentSupabase.rpc("get_my_groups"),
          currentSupabase.rpc("get_public_groups")
        ]);
        const nextProfile = profileRows?.[0] ? fromProfileRow(profileRows[0]) : null;
        setProfile(nextProfile);
        if (nextProfile?.language) {
          setLanguage(nextProfile.language);
        }
        const nextRuns = (runRows ?? []).map(fromRunRow);
        setRuns(nextRuns);
        if (myGroupsResult.error && import.meta.env.DEV) console.warn("Tusiger groups RPC failed", myGroupsResult.error);
        if (publicGroupsResult.error && import.meta.env.DEV) console.warn("Tusiger public groups RPC failed", publicGroupsResult.error);
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

      setLeaderboard(currentSession?.user ? await loadLeaderboard(null) : []);
    } catch (cause) {
      const message = errorMessage(cause);
      setSetupError(tr(`Supabase Setup unvollständig: ${message}. Bitte Migration ausführen und GitHub Secret VITE_SUPABASE_ANON_KEY setzen.`, `Supabase setup incomplete: ${message}. Please run the migration and set the GitHub secret VITE_SUPABASE_ANON_KEY.`));
      setSession(null);
      setProfile(null);
      setRuns([]);
      setGroups([]);
      setPublicGroups([]);
      setLeaderboard([]);
    } finally {
      setReady(true);
    }
  }, [loadLeaderboard, setLanguage]);

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
      throw new Error(tr("Supabase fehlt: Bitte VITE_SUPABASE_ANON_KEY konfigurieren.", "Supabase is missing: please configure VITE_SUPABASE_ANON_KEY."));
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
      throw new Error(tr("Supabase fehlt: Bitte VITE_SUPABASE_ANON_KEY konfigurieren.", "Supabase is missing: please configure VITE_SUPABASE_ANON_KEY."));
    }
    const normalizedEmail = cleanEmail(email);
    const cleanToken = token.trim();
    const { error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: cleanToken, type: "email" });
    if (error) throw error;
    await trackEvent("login_completed");
    await refreshData();
  }, [refreshData, trackEvent]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user || !supabase) throw new Error(tr("Bitte zuerst einloggen.", "Please sign in first."));
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error(tr("Bitte JPG, PNG oder WebP verwenden.", "Please use JPG, PNG or WebP."));
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error(tr("Avatar-Ausgangsbild darf maximal 8 MB groß sein.", "The original avatar image may be at most 8 MB."));
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

  const saveProfile = useCallback(async (input: { nickname: string; avatarUrl: string; language: "de" | "en"; showInPublicLeaderboard?: boolean }) => {
    if (!user || !supabase) throw new Error(tr("Bitte zuerst einloggen.", "Please sign in first."));
    const nickname = input.nickname.trim();
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      nickname,
      avatar_url: input.avatarUrl,
      language: input.language,
      show_in_public_leaderboard: input.showInPublicLeaderboard ?? profile?.showInPublicLeaderboard ?? true,
      deleted_at: null,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error) {
      throw error.code === "23505"
        ? new Error(input.language === "en" ? "This nickname is already taken." : "Dieser Nickname ist bereits vergeben.")
        : error;
    }
    await supabase.auth.updateUser({ data: { language: input.language } }).catch(() => undefined);
    await trackEvent("profile_completed");
    await refreshData();
  }, [profile?.showInPublicLeaderboard, refreshData, trackEvent, user]);

  const logout = useCallback(async () => {
    localStore.clearActiveRun();
    await supabase?.auth.signOut({ scope: "local" });
    setSession(null);
    setProfile(null);
    setRuns([]);
    setGroups([]);
  }, []);

  const saveRun = useCallback(async (localRun: RunRecord, needsReview = false) => {
    let run = localRun;
    if (!user || !supabase) {
      localStore.upsertRun(run);
      setRuns(localStore.readRuns(userId));
      return;
    }
    // Bei einem Retry (z. B. Netzabbruch mitten im Punkte-Upload) existiert der
    // Lauf schon; die RLS-Policy erlaubt kein Update abgeschlossener Läufe.
    const { data: existingRun, error: existingError } = await supabase
      .from("runs")
      .select("id")
      .eq("id", run.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existingRun) {
      const { error } = await supabase.from("runs").insert(toRunInsert({ ...run, status: "draft" }));
      if (error) throw error;
    }

    if (run.points.length > 0) {
      // Bereits hochgeladene Punkte überspringen, Rest in Batches — die volle
      // Aufzeichnung (bis zu 7200 Punkte) übersteigt sonst Payload-Limits.
      const { count: uploadedCount, error: countError } = await supabase
        .from("run_points")
        .select("id", { count: "exact", head: true })
        .eq("run_id", run.id);
      if (countError) throw countError;
      const pendingPoints = run.points.slice(uploadedCount ?? 0);
      const batchSize = 500;
      for (let offset = 0; offset < pendingPoints.length; offset += batchSize) {
        const { error: pointError } = await supabase.from("run_points").insert(
          pendingPoints.slice(offset, offset + batchSize).map((point) => ({
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
    }
    // Die Wertung fällt der Server aus den gespeicherten Punkten.
    const { data: judged, error: judgeError } = await supabase.functions.invoke("validate-run", { body: { runId: run.id, needsReview } });
    if (judgeError) {
      throw new Error(language === "en" ? "Run could not be validated. Please try again." : "Lauf konnte nicht geprüft werden. Bitte erneut versuchen.");
    }
    run = { ...fromRunRow(judged as Record<string, unknown>), points: localRun.points, trackingSummary: localRun.trackingSummary };

    await trackEvent("run_validated", { status: run.status });
    localStore.upsertRun(run);
    setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]);
    setLeaderboard(await loadLeaderboard(null));
  }, [language, loadLeaderboard, trackEvent, user, userId]);

  const createGroup = useCallback(async (groupInput: Pick<Group, "name" | "description" | "isPrivate">) => {
    if (!user || !supabase) throw new Error(tr("Bitte zuerst einloggen.", "Please sign in first."));
    const cleanName = groupInput.name.trim();
    if (cleanName.length < 3 || cleanName.length > 40) {
      throw new Error(language === "en" ? "The group name must be 3–40 characters long." : "Der Gruppenname muss 3–40 Zeichen lang sein.");
    }

    const existingGroupNames = [...groups, ...publicGroups].map((item) => item.name.trim().toLowerCase());
    if (existingGroupNames.includes(cleanName.toLowerCase())) {
      throw new Error(language === "en" ? "A group with this name already exists. Please choose another name." : "Eine Gruppe mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.");
    }

    const rpcResult = await supabase.rpc("create_group_with_invite", {
      p_name: cleanName,
      p_is_private: groupInput.isPrivate
    }).single();

    if (rpcResult.error) {
      if (import.meta.env.DEV) console.warn("Tusiger create group failed", rpcResult.error);
      throw new Error(friendlyGroupError(rpcResult.error, language, "create"));
    }
    const group = fromGroupRow(rpcResult.data as Record<string, unknown>, "owner");
    await trackEvent("group_created");
    setGroups((current) => [group, ...current.filter((item) => item.id !== group.id)]);
    setPublicGroups((current) => current.filter((item) => item.id !== group.id));
    await refreshData();
    return group;
  }, [groups, language, publicGroups, refreshData, trackEvent, user]);

  const joinGroup = useCallback(async (inviteCode: string) => {
    if (!user || !supabase) throw new Error(tr("Bitte zuerst einloggen.", "Please sign in first."));
    const normalizedInviteCode = normalizeInviteCode(inviteCode);
    if (!normalizedInviteCode) {
      throw new Error(language === "en" ? "Please enter a valid invite code." : "Bitte gib einen gültigen Einladungs-Code ein.");
    }

    const existing = groups.find((item) => item.inviteCode.toUpperCase() === normalizedInviteCode);
    if (existing) return existing;

    const rpcResult = await supabase.rpc("join_group_by_invite", {
      p_invite_code: normalizedInviteCode
    }).single();
    if (rpcResult.error) {
      if (import.meta.env.DEV) console.warn("Tusiger join group failed", rpcResult.error);
      const legacyResult = await supabase.rpc("join_tusiger_group", { p_invite_code: normalizedInviteCode }).single();
      if (legacyResult.error) {
        if (import.meta.env.DEV) console.warn("Tusiger legacy join group failed", legacyResult.error);
        throw new Error(friendlyGroupError(legacyResult.error.message.includes("group_not_found") ? legacyResult.error : rpcResult.error, language, "join"));
      }
      const legacyGroup = fromGroupRow(legacyResult.data as Record<string, unknown>, "member");
      await trackEvent("group_joined", { inviteCode: normalizedInviteCode });
      setGroups((current) => [legacyGroup, ...current.filter((item) => item.id !== legacyGroup.id)]);
      setPublicGroups((current) => current.filter((item) => item.id !== legacyGroup.id));
      await refreshData();
      return legacyGroup;
    }

    const next = fromGroupRow(rpcResult.data as Record<string, unknown>, "member");
    await trackEvent("group_joined", { inviteCode: normalizedInviteCode });
    setGroups((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setPublicGroups((current) => current.filter((item) => item.id !== next.id));
    await refreshData();
    return next;
  }, [groups, language, refreshData, trackEvent, user]);

  const leaveGroup = useCallback(async (groupId: string) => {
    if (!user || !supabase) throw new Error(tr("Bitte zuerst einloggen.", "Please sign in first."));
    const { error } = await supabase.rpc("leave_tusiger_group", { p_group_id: groupId });
    if (error) {
      if (import.meta.env.DEV) console.warn("Tusiger leave group failed", error);
      throw new Error(friendlyGroupError(error, language, "leave"));
    }
    setGroups((current) => current.filter((item) => item.id !== groupId));
    await trackEvent("group_left", { groupId });
    await refreshData();
  }, [language, refreshData, trackEvent, user]);

  const deleteAccount = useCallback(async () => {
    if (!user || !supabase) throw new Error(tr("Bitte zuerst einloggen.", "Please sign in first."));
    const { data: files } = await supabase.storage.from("avatars").list(user.id);
    if (files?.length) {
      await supabase.storage.from("avatars").remove(files.map((file) => `${user.id}/${file.name}`));
    }
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;
    localStore.clearRuns(user.id);
    await logout();
  }, [logout, user]);

  const value = useMemo(
    () => ({
      ready,
      setupError,
      isSupabaseConfigured,
      language,
      setLanguage: changeLanguage,
      t,
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
      loadLeaderboard,
      createGroup,
      joinGroup,
      leaveGroup,
      deleteAccount,
      trackEvent,
      refreshData
    }),
    [config, createGroup, deleteAccount, groups, history, joinGroup, language, leaderboard, leaveGroup, legalPages, loginWithEmail, logout, profile, publicGroups, ready, refreshData, runs, saveProfile, loadLeaderboard, saveRun, session, changeLanguage, setupError, t, trackEvent, uploadAvatar, user, userId, verifyOtp]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
