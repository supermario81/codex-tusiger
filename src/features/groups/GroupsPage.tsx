import { ChevronRight, Copy, LogOut, Plus, UsersRound, UserRoundPlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatDuration } from "../../lib/geo/geo";
import { clearPendingInviteCode, createInviteUrl, normalizeInviteCode } from "../../lib/community/community";

function errorText(cause: unknown, fallback: string) {
  if (cause instanceof Error && cause.message) return cause.message;
  if (cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string") return cause.message;
  return fallback;
}

export function GroupsPage({ mode }: { mode?: "new" | "join" | "detail" | "invite" }) {
  const { createGroup, groups, joinGroup, language, leaveGroup, publicGroups } = useApp();
  const navigate = useNavigate();
  const t = language === "en" ? {
    create: "Create group",
    join: "Join",
    name: "Name",
    closed: "Closed",
    closedHint: "Invite link only",
    public: "Public",
    publicHint: "Everyone can join",
    createCta: "Create",
    created: "Group created.",
    createdError: "Group could not be created.",
    duplicateName: "This group name already exists.",
    joinError: "Could not join group.",
    joined: "You joined the group.",
    invite: "Invite link",
    copy: "Copy link",
    joinCta: "Join group",
    ready: "Ready to join with code",
    privateGroup: "Closed group",
    publicGroup: "Public group",
    members: "Members",
    inviteCode: "Invite code",
    invitePlaceholder: "Example: TUSAB12CD or paste the full invite link",
    shareWhatsapp: "Share via WhatsApp",
    leave: "Leave group",
    left: "You left the group.",
    groups: "Groups",
    subtitle: "Move further together.",
    ownCommunity: "Start your own community.",
    joinCommunity: "Join an existing group.",
    yourGroups: "Your groups",
    active: "Active",
    best: "Best time",
    publicGroups: "Public groups",
    noGroups: "No groups yet.",
    noPublicGroups: "No public groups yet."
  } : {
    create: "Gruppe erstellen",
    join: "Beitreten",
    name: "Name",
    closed: "Geschlossen",
    closedHint: "Nur per Einladungslink",
    public: "Öffentlich",
    publicHint: "Alle können beitreten",
    createCta: "Erstellen",
    created: "Gruppe wurde erstellt.",
    createdError: "Gruppe konnte nicht erstellt werden.",
    duplicateName: "Dieser Gruppenname ist bereits vergeben.",
    joinError: "Gruppe konnte nicht beigetreten werden.",
    joined: "Du bist der Gruppe beigetreten.",
    invite: "Einladungslink",
    copy: "Link kopieren",
    joinCta: "Gruppe beitreten",
    ready: "Bereit zum Beitreten mit Code",
    privateGroup: "Geschlossene Gruppe",
    publicGroup: "Öffentliche Gruppe",
    members: "Mitglieder",
    inviteCode: "Einladungs-Code",
    invitePlaceholder: "Beispiel: TUSAB12CD oder ganzen Einladungslink einfügen",
    shareWhatsapp: "Via WhatsApp teilen",
    leave: "Gruppe verlassen",
    left: "Du hast die Gruppe verlassen.",
    groups: "Gruppen",
    subtitle: "Gemeinsam weiter kommen.",
    ownCommunity: "Starte deine eigene Community.",
    joinCommunity: "Tritt einer bestehenden Gruppe bei.",
    yourGroups: "Deine Gruppen",
    active: "Aktiv",
    best: "Bestzeit",
    publicGroups: "Öffentliche Gruppen",
    noGroups: "Noch keine Gruppen.",
    noPublicGroups: "Noch keine öffentlichen Gruppen."
  };
  const { groupId, inviteCode } = useParams();
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoJoinedCode, setAutoJoinedCode] = useState("");
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const groupNames = useMemo(() => [...groups, ...publicGroups].map((item) => item.name.trim().toLowerCase()), [groups, publicGroups]);
  const publicGroupRows = useMemo(() => {
    const ownPublicGroups = groups.filter((item) => !item.isPrivate).map((item) => ({ group: item, isMember: true }));
    const publicRows = publicGroups.filter((item) => !groups.some((own) => own.id === item.id)).map((item) => ({ group: item, isMember: false }));
    return [...ownPublicGroups, ...publicRows];
  }, [groups, publicGroups]);

  useEffect(() => {
    if (mode !== "invite" || !inviteCode || autoJoinedCode === inviteCode) return;
    setAutoJoinedCode(inviteCode);
    joinGroup(normalizeInviteCode(inviteCode))
      .then((next) => {
        clearPendingInviteCode();
        setInvite(next.inviteCode);
        setSuccess(t.joined);
      })
      .catch((cause) => setError(errorText(cause, t.joinError)));
  }, [autoJoinedCode, inviteCode, joinGroup, mode, t.joinError, t.joined]);

  async function submitGroup(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const cleanName = name.trim();
    if (!cleanName) return;
    if (groupNames.includes(cleanName.toLowerCase())) {
      setError(t.duplicateName);
      return;
    }
    try {
      const next = await createGroup({ name: cleanName, description: "", isPrivate });
      setInvite(next.inviteCode);
      setName("");
      setSuccess(t.created);
    } catch (cause) {
      setError(errorText(cause, t.createdError));
    }
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const next = await joinGroup(normalizeInviteCode(invite || inviteCode || ""));
      clearPendingInviteCode();
      setInvite("");
      setSuccess(`${t.joined} ${next.name}`);
    } catch (cause) {
      setError(errorText(cause, t.joinError));
    }
  }

  async function joinPublic(inviteCodeToJoin: string) {
    setError("");
    setSuccess("");
    try {
      const next = await joinGroup(normalizeInviteCode(inviteCodeToJoin));
      setSuccess(`${t.joined} ${next.name}`);
    } catch (cause) {
      setError(errorText(cause, t.joinError));
    }
  }

  async function leaveCurrentGroup(id: string) {
    setError("");
    setSuccess("");
    try {
      await leaveGroup(id);
      setSuccess(t.left);
      if (mode === "detail") navigate("/groups");
    } catch (cause) {
      setError(errorText(cause, language === "en" ? "Could not leave group." : "Gruppe konnte nicht verlassen werden."));
    }
  }

  if (mode === "new") {
    return (
      <PageShell back>
        <section className="simple-page">
          <h1>{t.create}</h1>
          <GlassPanel>
            <form onSubmit={submitGroup}>
              <Input label={t.name} value={name} onChange={(event) => setName(event.currentTarget.value)} />
              <div className="group-privacy">
                <button className={isPrivate ? "active" : ""} type="button" onClick={() => setIsPrivate(true)}>
                  {t.closed}
                  <small>{t.closedHint}</small>
                </button>
                <button className={!isPrivate ? "active" : ""} type="button" onClick={() => setIsPrivate(false)}>
                  {t.public}
                  <small>{t.publicHint}</small>
                </button>
              </div>
              {error ? <p className="form-error">{error}</p> : null}
              {success ? <p className="form-success">{success}</p> : null}
              <Button icon={<Plus />}>{t.createCta}</Button>
            </form>
            {invite ? (
              <div className="invite-result">
                <p>{t.invite}</p>
                <strong>{createInviteUrl(window.location.origin, window.location.pathname, invite)}</strong>
                <Button variant="secondary" icon={<Copy />} onClick={() => navigator.clipboard?.writeText(createInviteUrl(window.location.origin, window.location.pathname, invite))}>{t.copy}</Button>
              </div>
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
          <h1>{t.join}</h1>
          <GlassPanel>
            {mode === "invite" && inviteCode ? (
              <p>{success || (invite ? `${t.ready} ${invite.toUpperCase()}` : `${t.joinCta}...`)}</p>
            ) : (
              <form onSubmit={submitJoin}>
                <Input label={t.inviteCode} placeholder={t.invitePlaceholder} value={invite || inviteCode || ""} onChange={(event) => setInvite(event.currentTarget.value)} />
                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : null}
                <Button icon={<UserRoundPlus />}>{t.joinCta}</Button>
              </form>
            )}
            {error ? <p className="form-error">{error}</p> : null}
          </GlassPanel>
        </section>
      </PageShell>
    );
  }

  if (mode === "detail") {
    if (!group) {
      return (
        <PageShell back>
          <section className="simple-page">
            <h1>{t.groups}</h1>
            <GlassPanel><p>{t.noGroups}</p></GlassPanel>
          </section>
        </PageShell>
      );
    }

    return (
      <PageShell back>
        <section className="simple-page">
          <h1>{group.name}</h1>
          <p>{group.isPrivate ? t.privateGroup : t.publicGroup}</p>
          <GlassPanel className="group-detail">
            <p>{t.members} <strong>{group.memberCount}</strong></p>
            <p>{t.inviteCode} <strong>{group.inviteCode}</strong></p>
            {error ? <p className="form-error">{error}</p> : null}
            {success ? <p className="form-success">{success}</p> : null}
            <Button variant="secondary" icon={<Copy />} onClick={() => navigator.clipboard?.writeText(createInviteUrl(window.location.origin, window.location.pathname, group.inviteCode))}>{t.copy}</Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Komm in meine Tusiger-Gruppe: ${createInviteUrl(window.location.origin, window.location.pathname, group.inviteCode)}`)}`} target="_blank" rel="noreferrer"><Button variant="glass">{t.shareWhatsapp}</Button></a>
            <Button variant="danger" icon={<LogOut />} onClick={() => void leaveCurrentGroup(group.id)}>{t.leave}</Button>
          </GlassPanel>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="groups-page">
        <h1>{t.groups}</h1>
        <p>{t.subtitle}</p>
        <div className="group-actions">
          <Link to="/groups/new"><UsersRound /> <strong>{t.create}</strong><span>{t.ownCommunity}</span></Link>
          <Link to="/groups/join"><UserRoundPlus /> <strong>{t.join}</strong><span>{t.joinCommunity}</span></Link>
        </div>
        <h2>{t.yourGroups}</h2>
        <GlassPanel className="group-list">
          {groups.length === 0 ? <p className="empty-state">{t.noGroups}</p> : groups.map((item) => (
            <Link to={`/groups/${item.id}`} key={item.id}>
              <span className="round-icon"><UsersRound /></span>
              <strong>{item.name}<small>{t.active} · {item.memberCount} {t.members}</small></strong>
              <span>{t.best}<br /><b>{item.bestTimeSeconds ? formatDuration(item.bestTimeSeconds) : "–"}</b></span>
              <ChevronRight />
            </Link>
          ))}
        </GlassPanel>
        <h2>{t.publicGroups}</h2>
        <GlassPanel className="group-list">
          {publicGroupRows.length === 0 ? <p className="empty-state">{t.noPublicGroups}</p> : publicGroupRows.map(({ group: item, isMember }) => (
            <article className="public-group-row" key={item.id}>
              <span className="round-icon"><UsersRound /></span>
              <strong>{item.name}<small>{item.memberCount} {t.members}</small></strong>
              {isMember
                ? <Button variant="secondary" onClick={() => void leaveCurrentGroup(item.id)}>{t.leave}</Button>
                : <Button variant="secondary" onClick={() => void joinPublic(item.inviteCode)}>{t.joinCta}</Button>}
            </article>
          ))}
          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
        </GlassPanel>
      </section>
    </PageShell>
  );
}
