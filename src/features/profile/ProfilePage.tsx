import { ChangeEvent, useState } from "react";
import { History, ImagePlus, LogOut, Settings, Trophy, UsersRound } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { formatDuration } from "../../lib/geo/geo";

export function ProfilePage() {
  const { language, logout, profile, runs, saveProfile, uploadAvatar } = useApp();
  const t = language === "en" ? {
    title: "Profile",
    optimizing: "Optimizing avatar...",
    updated: "Avatar updated.",
    failed: "Avatar could not be updated.",
    visible: "Rookie · Publicly visible",
    hidden: "Rookie · Private leaderboard only",
    publicToggle: "Show in public leaderboard",
    publicUpdated: "Leaderboard visibility updated.",
    publicUpdateFailed: "Visibility could not be updated.",
    noTime: "No time yet",
    history: "Run history",
    empty: "No runs saved yet.",
    groups: "Groups",
    story: "Story",
    settings: "Privacy & settings"
  } : {
    title: "Profil",
    optimizing: "Avatar wird optimiert...",
    updated: "Avatar aktualisiert.",
    failed: "Avatar konnte nicht aktualisiert werden.",
    visible: "Rookie · Öffentlich sichtbar",
    hidden: "Rookie · Nur persönliche Rangliste",
    publicToggle: "In öffentlicher Rangliste anzeigen",
    publicUpdated: "Ranglisten-Sichtbarkeit aktualisiert.",
    publicUpdateFailed: "Sichtbarkeit konnte nicht aktualisiert werden.",
    noTime: "Noch keine Zeit",
    history: "Lauf-History",
    empty: "Noch keine Läufe gespeichert.",
    groups: "Gruppen",
    story: "Geschichte",
    settings: "Datenschutz & Einstellungen"
  };
  const [avatarState, setAvatarState] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [visibilityState, setVisibilityState] = useState("");
  const [visibilityError, setVisibilityError] = useState("");
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const currentProfile = profile;
  const best = runs.filter((run) => run.status === "valid").sort((a, b) => a.durationSeconds - b.durationSeconds)[0];

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarState(t.optimizing);
    try {
      const avatarUrl = await uploadAvatar(file);
      await saveProfile({
        nickname: currentProfile.nickname,
        avatarUrl,
        language,
        showInPublicLeaderboard: currentProfile.showInPublicLeaderboard
      });
      setAvatarState(t.updated);
    } catch (cause) {
      setAvatarError(cause instanceof Error ? cause.message : t.failed);
      setAvatarState("");
    }
  }

  async function handlePublicVisibility(nextValue: boolean) {
    setVisibilityError("");
    setVisibilityState("");
    try {
      await saveProfile({
        nickname: currentProfile.nickname,
        avatarUrl: currentProfile.avatarUrl,
        language,
        showInPublicLeaderboard: nextValue
      });
      setVisibilityState(t.publicUpdated);
    } catch (cause) {
      setVisibilityError(cause instanceof Error ? cause.message : t.publicUpdateFailed);
    }
  }

  return (
    <PageShell>
      <section className="simple-page">
        <h1>{t.title}</h1>
        <GlassPanel className="profile-card">
          <label className="profile-avatar-edit">
            <Avatar name={currentProfile.nickname} url={currentProfile.avatarUrl} size="lg" />
            <span className="profile-avatar-action"><ImagePlus /></span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} />
          </label>
          <h2>{currentProfile.nickname}</h2>
          <p>{currentProfile.showInPublicLeaderboard ? t.visible : t.hidden}</p>
          <label className="toggle-line profile-toggle">
            <span><strong>{t.publicToggle}</strong></span>
            <input
              type="checkbox"
              checked={currentProfile.showInPublicLeaderboard}
              onChange={(event) => void handlePublicVisibility(event.currentTarget.checked)}
            />
          </label>
          <span className="status-badge status-valid"><Trophy size={16} /> {best ? formatDuration(best.durationSeconds) : t.noTime}</span>
          {avatarState ? <small>{avatarState}</small> : null}
          {avatarError ? <p className="form-error">{avatarError}</p> : null}
          {visibilityState ? <small>{visibilityState}</small> : null}
          {visibilityError ? <p className="form-error">{visibilityError}</p> : null}
        </GlassPanel>
        <GlassPanel className="run-history-list">
          <h2>{t.history}</h2>
          {runs.length === 0 ? <p>{t.empty}</p> : runs.slice(0, 5).map((run) => (
            <p key={run.id}>{new Date(run.startedAt).toLocaleDateString("de-CH")} <strong>{formatDuration(run.durationSeconds)}</strong> <span>{run.status}</span></p>
          ))}
        </GlassPanel>
        <Link className="action-row" to="/groups"><UsersRound /> {t.groups}</Link>
        <Link className="action-row" to="/history"><History /> {t.story}</Link>
        <Link className="action-row" to="/settings"><Settings /> {t.settings}</Link>
        <Button variant="secondary" onClick={logout} icon={<LogOut />}>Logout</Button>
      </section>
    </PageShell>
  );
}
