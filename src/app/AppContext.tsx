import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { defaultChallengeConfig } from "../data/challenge";
import { demoMode, supabase } from "../lib/supabase/client";
import { localStore } from "../lib/storage/localStore";
import type { ChallengeConfig, Group, Profile, RunRecord } from "../lib/types";

type AppContextValue = {
  isDemoMode: boolean;
  userId: string;
  profile: Profile | null;
  config: ChallengeConfig;
  runs: RunRecord[];
  groups: Group[];
  loginWithEmail: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  saveProfile: (input: { nickname: string; avatarUrl: string }) => Promise<void>;
  logout: () => Promise<void>;
  saveRun: (run: RunRecord) => Promise<void>;
  createGroup: (group: Pick<Group, "name" | "description" | "isPrivate">) => Group;
};

const AppContext = createContext<AppContextValue | null>(null);
const demoUserId = "demo-user";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => localStore.readProfile());
  const [runs, setRuns] = useState<RunRecord[]>(() => localStore.readRuns());
  const [groups, setGroups] = useState<Group[]>(() => localStore.readGroups());
  const [config] = useState<ChallengeConfig>(defaultChallengeConfig);

  const loginWithEmail = useCallback(async (email: string) => {
    if (demoMode) {
      localStorage.setItem("tusiger.pendingEmail", email);
      return;
    }

    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify` }
    });

    if (error) {
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (demoMode) {
      if (!/^\d{6}$/.test(token) && token !== "demo42") {
        throw new Error("Der Code ist ungültig. Im Demo-Modus funktioniert jeder 6-stellige Code.");
      }
      return;
    }

    const { error } = await supabase!.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      throw error;
    }
  }, []);

  const saveProfile = useCallback(async (input: { nickname: string; avatarUrl: string }) => {
    const now = new Date().toISOString();
    const nextProfile: Profile = {
      id: profile?.id ?? crypto.randomUUID(),
      userId: profile?.userId ?? demoUserId,
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
      role: profile?.role ?? "user",
      createdAt: profile?.createdAt ?? now,
      updatedAt: now
    };

    localStore.writeProfile(nextProfile);
    setProfile(nextProfile);

    if (!demoMode) {
      const { error } = await supabase!.from("profiles").upsert({
        user_id: nextProfile.userId,
        nickname: nextProfile.nickname,
        avatar_url: nextProfile.avatarUrl,
        role: nextProfile.role
      });
      if (error) {
        throw error;
      }
    }
  }, [profile]);

  const logout = useCallback(async () => {
    localStore.clearProfile();
    setProfile(null);
    if (!demoMode) {
      await supabase!.auth.signOut();
    }
  }, []);

  const saveRun = useCallback(async (run: RunRecord) => {
    localStore.upsertRun(run);
    setRuns(localStore.readRuns());
  }, []);

  const createGroup = useCallback((groupInput: Pick<Group, "name" | "description" | "isPrivate">) => {
    const group: Group = {
      id: crypto.randomUUID(),
      name: groupInput.name,
      description: groupInput.description,
      isPrivate: groupInput.isPrivate,
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      memberCount: 1,
      bestTimeSeconds: null
    };
    const next = [group, ...groups];
    localStore.writeGroups(next);
    setGroups(next);
    return group;
  }, [groups]);

  const value = useMemo(
    () => ({
      isDemoMode: demoMode,
      userId: profile?.userId ?? demoUserId,
      profile,
      config,
      runs,
      groups,
      loginWithEmail,
      verifyOtp,
      saveProfile,
      logout,
      saveRun,
      createGroup
    }),
    [config, createGroup, groups, loginWithEmail, logout, profile, runs, saveProfile, saveRun, verifyOtp]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
