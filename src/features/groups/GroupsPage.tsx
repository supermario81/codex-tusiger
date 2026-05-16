import { ChevronRight, Copy, LogOut, Plus, UsersRound, UserRoundPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatDuration } from "../../lib/geo/geo";

export function GroupsPage({ mode }: { mode?: "new" | "join" | "detail" }) {
  const { createGroup, groups } = useApp();
  const { groupId } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [invite, setInvite] = useState("");
  const group = groups.find((item) => item.id === groupId) ?? groups[0];

  function submitGroup(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    const next = createGroup({ name: name.trim(), description, isPrivate: false });
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
            {invite ? <p className="helper-line">Invite-Code: <strong>{invite}</strong></p> : null}
          </GlassPanel>
        </section>
      </PageShell>
    );
  }

  if (mode === "join") {
    return (
      <PageShell back>
        <section className="simple-page">
          <h1>Beitreten</h1>
          <GlassPanel>
            <Input label="Invite-Code" placeholder="GIPFEL" />
            <Button icon={<UserRoundPlus />}>Gruppe beitreten</Button>
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
            <Button variant="secondary" icon={<Copy />}>Link kopieren</Button>
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
          <a href="/groups/new"><UsersRound /> <strong>Gruppe erstellen</strong><span>Starte deine eigene Community.</span></a>
          <a href="/groups/join"><UserRoundPlus /> <strong>Beitreten</strong><span>Tritt einer bestehenden Gruppe bei.</span></a>
        </div>
        <h2>Deine Gruppen</h2>
        <GlassPanel className="group-list">
          {groups.map((item) => (
            <a href={`/groups/${item.id}`} key={item.id}>
              <span className="round-icon"><UsersRound /></span>
              <strong>{item.name}<small>Aktiv · {item.memberCount} Mitglieder</small></strong>
              <span>Bestzeit<br /><b>{item.bestTimeSeconds ? formatDuration(item.bestTimeSeconds) : "–"}</b></span>
              <ChevronRight />
            </a>
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
