import { LogOut, Settings, Trophy } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { formatDuration } from "../../lib/geo/geo";

export function ProfilePage() {
  const { logout, profile, runs } = useApp();
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const best = runs.filter((run) => run.status === "valid").sort((a, b) => a.durationSeconds - b.durationSeconds)[0];

  return (
    <PageShell>
      <section className="simple-page">
        <h1>Profil</h1>
        <GlassPanel className="profile-card">
          <Avatar name={profile.nickname} url={profile.avatarUrl} size="lg" />
          <h2>{profile.nickname}</h2>
          <p>Rookie · Öffentlich sichtbar</p>
          <span className="status-badge status-valid"><Trophy size={16} /> {best ? formatDuration(best.durationSeconds) : "Noch keine Zeit"}</span>
        </GlassPanel>
        <Link className="action-row" to="/settings"><Settings /> Datenschutz & Einstellungen</Link>
        <Button variant="secondary" onClick={logout} icon={<LogOut />}>Logout</Button>
      </section>
    </PageShell>
  );
}
