import { ChevronRight, Copy, LogOut, Plus, UsersRound, UserRoundPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatDuration } from "../../lib/geo/geo";
import { createInviteUrl, normalizeInviteCode } from "../../lib/community/community";

export function GroupsPage({ mode }: { mode?: "new" | "join" | "detail" | "invite" }) {
  const { createGroup, groups, joinGroup } = useApp();
  const { groupId, inviteCode } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [invite, setInvite] = useState("");
  const group = groups.find((item) => item.id === groupId) ?? groups[0];

  async function submitGroup(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    const next = await createGroup({ name: name.trim(), description, isPrivate: false });
    setInvite(next.inviteCode);
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    const next = await joinGroup(normalizeInviteCode(invite || inviteCode || ""));
    setInvite(next.inviteCode);
  }

  if (mode === "new") {
    return (
      <PageShell back>
        <section className="simple-page">
          <h1>Gruppe erstellen</h1>
          <GlassPanel>
            <form onSubmit={submitGroup}>
              <Input label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} />
              <Input label="Beschreibung" value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
              <Button icon={<Plus />}>Erstellen</Button>
            </form>
            {invite ? (
              <p className="helper-line">
                Invite-Link: <strong>{createInviteUrl(window.location.origin, window.location.pathname, invite)}</strong>
              </p>
            ) : null}
          </GlassPanel>
        </section>
      </PageShell>
    );
  }

  if (mode === "join" || mode === "invite") {
    return (
      <PageShell back>
        <section className="simple-page">
          <h1>Beitreten</h1>
          <GlassPanel>
            <form onSubmit={submitJoin}>
              <Input label="Invite-Code" placeholder="GIPFEL" value={invite || inviteCode || ""} onChange={(event) => setInvite(event.currentTarget.value)} />
              <Button icon={<UserRoundPlus />}>Gruppe beitreten</Button>
            </form>
            {invite ? <p className="helper-line">Bereit zum Beitreten mit Code {invite.toUpperCase()}</p> : null}
          </GlassPanel>
        </section>
      </PageShell>
    );
  }

  if (mode === "detail") {
    return (
      <PageShell back>
        <section className="simple-page">
          <h1>{group.name}</h1>
          <p>{group.description}</p>
          <GlassPanel className="group-detail">
            <p>Mitglieder <strong>{group.memberCount}</strong></p>
            <p>Invite-Code <strong>{group.inviteCode}</strong></p>
            <Button variant="secondary" icon={<Copy />} onClick={() => navigator.clipboard?.writeText(createInviteUrl(window.location.origin, window.location.pathname, group.inviteCode))}>Link kopieren</Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Komm in meine Tusiger-Gruppe: ${createInviteUrl(window.location.origin, window.location.pathname, group.inviteCode)}`)}`} target="_blank" rel="noreferrer"><Button variant="glass">Via WhatsApp teilen</Button></a>
            <Button variant="danger" icon={<LogOut />}>Gruppe verlassen</Button>
          </GlassPanel>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="groups-page">
        <h1>Gruppen</h1>
        <p>Gemeinsam weiter kommen.</p>
        <div className="group-actions">
          <Link to="/groups/new"><UsersRound /> <strong>Gruppe erstellen</strong><span>Starte deine eigene Community.</span></Link>
          <Link to="/groups/join"><UserRoundPlus /> <strong>Beitreten</strong><span>Tritt einer bestehenden Gruppe bei.</span></Link>
        </div>
        <h2>Deine Gruppen</h2>
        <GlassPanel className="group-list">
          {groups.map((item) => (
            <Link to={`/groups/${item.id}`} key={item.id}>
              <span className="round-icon"><UsersRound /></span>
              <strong>{item.name}<small>Aktiv · {item.memberCount} Mitglieder</small></strong>
              <span>Bestzeit<br /><b>{item.bestTimeSeconds ? formatDuration(item.bestTimeSeconds) : "–"}</b></span>
              <ChevronRight />
            </Link>
          ))}
        </GlassPanel>
        <GlassPanel className="top-group">
          <small>Top Gruppe</small>
          <h2>Gipfelstürmer</h2>
          <p>Diese Woche</p>
          {["Maria", "Tobias", "Lena"].map((person, index) => (
            <p key={person}><b>{index + 1}</b> {person}<span>{812 - index * 56} / 1000 Stufen</span></p>
          ))}
        </GlassPanel>
      </section>
    </PageShell>
  );
}
