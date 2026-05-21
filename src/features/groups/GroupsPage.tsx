import { ChevronRight, Copy, LogOut, Plus, UsersRound, UserRoundPlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatDuration } from "../../lib/geo/geo";
import { clearPendingInviteCode, getInviteUrl, normalizeInviteCode } from "../../lib/community/community";

function errorText(cause: unknown, fallback: string) {
  const message = cause instanceof Error
    ? cause.message
    : cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string"
      ? cause.message
      : "";
  if (message.includes("Eine Gruppe mit diesem Namen existiert bereits") || message.includes("A group with this name already exists")) return message;
  if (message.includes("Zu diesem Einladungs-Code") || message.includes("No group was found")) return message;
  if (message.includes("gültigen Einladungs-Code") || message.includes("valid invite code")) return message;
  if (message.includes("Gruppenfunktion") || message.includes("group feature")) return message;
  if (message) return fallback;
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
    invalidName: "Group name must be 3–40 characters.",
    joinError: "Could not join group.",
    joined: "You joined the group.",
    alreadyMember: "You are already a member of this group.",
    invite: "Invite link",
    copy: "Copy link",
    copied: "Copied",
    copiedToast: "Invite link copied",
    manualCopy: "Select and copy this link",
    joinCta: "Join group",
    ready: "Ready to join with code",
    goGroup: "To group",
    goHome: "To start",
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
    noPublicGroups: "No public groups yet.",
    previous: "Previous",
    next: "Next",
    page: "Page"
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
    invalidName: "Gruppenname muss 3–40 Zeichen lang sein.",
    joinError: "Gruppe konnte nicht beigetreten werden.",
    joined: "Du bist der Gruppe beigetreten.",
    alreadyMember: "Du bist bereits Mitglied dieser Gruppe.",
    invite: "Einladungslink",
    copy: "Link kopieren",
    copied: "Kopiert",
    copiedToast: "Einladungslink kopiert",
    manualCopy: "Link markieren und kopieren",
    joinCta: "Gruppe beitreten",
    ready: "Bereit zum Beitreten mit Code",
    goGroup: "Zur Gruppe",
    goHome: "Zur Startseite",
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
    noPublicGroups: "Noch keine öffentlichen Gruppen.",
    previous: "Zurück",
    next: "Weiter",
    page: "Seite"
  };
  const { groupId, inviteCode } = useParams();
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoJoinedCode, setAutoJoinedCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [manualCopyUrl, setManualCopyUrl] = useState("");
  const [joinedGroupId, setJoinedGroupId] = useState("");
  const [publicPage, setPublicPage] = useState(1);
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const groupNames = useMemo(() => [...groups, ...publicGroups].map((item) => item.name.trim().toLowerCase()), [groups, publicGroups]);
  const publicGroupRows = useMemo(() => {
    const myGroupIds = new Set(groups.map((item) => item.id));
    return publicGroups.filter((item) => !myGroupIds.has(item.id));
  }, [groups, publicGroups]);
  const publicPageSize = 10;
  const publicPageCount = Math.max(1, Math.ceil(publicGroupRows.length / publicPageSize));
  const visiblePublicGroups = publicGroupRows.slice((publicPage - 1) * publicPageSize, publicPage * publicPageSize);

  useEffect(() => {
    setPublicPage((current) => Math.min(current, publicPageCount));
  }, [publicPageCount]);

  useEffect(() => {
    if (mode !== "invite" || !inviteCode || autoJoinedCode === inviteCode) return;
    const code = normalizeInviteCode(inviteCode);
    if (!code) return;
    setAutoJoinedCode(inviteCode);
    const existing = groups.find((item) => item.inviteCode.toUpperCase() === code);
    if (existing) {
      clearPendingInviteCode();
      setInvite("");
      setJoinedGroupId(existing.id);
      setSuccess(`${t.alreadyMember} ${existing.name}`);
      return;
    }
    setBusy(true);
    void joinGroup(code)
      .then((next) => {
        clearPendingInviteCode();
        setInvite("");
        setJoinedGroupId(next.id);
        setSuccess(`${t.joined} ${next.name}`);
      })
      .catch((cause) => setError(errorText(cause, t.joinError)))
      .finally(() => setBusy(false));
  }, [autoJoinedCode, groups, inviteCode, joinGroup, mode, t.alreadyMember, t.joinError, t.joined]);

  async function copyInviteLink(code: string) {
    const url = getInviteUrl(code);
    setManualCopyUrl("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(url);
      setCopied(code);
      setSuccess(t.copiedToast);
      window.setTimeout(() => setCopied((current) => current === code ? "" : current), 2000);
    } catch {
      setManualCopyUrl(url);
      setSuccess(t.manualCopy);
      window.setTimeout(() => {
        const field = document.querySelector<HTMLInputElement>("[data-invite-copy-field]");
        field?.focus();
        field?.select();
      }, 50);
    }
  }

  async function submitGroup(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setJoinedGroupId("");
    const cleanName = name.trim();
    if (cleanName.length < 3 || cleanName.length > 40) {
      setError(t.invalidName);
      return;
    }
    if (groupNames.includes(cleanName.toLowerCase())) {
      setError(t.duplicateName);
      return;
    }
    try {
      setBusy(true);
      const next = await createGroup({ name: cleanName, description: "", isPrivate });
      setInvite(next.inviteCode);
      setName("");
      setSuccess(t.created);
    } catch (cause) {
      setError(errorText(cause, t.createdError));
    } finally {
      setBusy(false);
    }
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setJoinedGroupId("");
    const code = normalizeInviteCode(invite || inviteCode || "");
    const existing = groups.find((item) => item.inviteCode.toUpperCase() === code);
    if (existing) {
      clearPendingInviteCode();
      setInvite("");
      setJoinedGroupId(existing.id);
      setSuccess(`${t.alreadyMember} ${existing.name}`);
      return;
    }
    try {
      setBusy(true);
      const next = await joinGroup(code);
      clearPendingInviteCode();
      setInvite("");
      setJoinedGroupId(next.id);
      setSuccess(`${t.joined} ${next.name}`);
    } catch (cause) {
      setError(errorText(cause, t.joinError));
    } finally {
      setBusy(false);
    }
  }

  async function joinCurrentInvite() {
    await submitJoin({ preventDefault() { /* no form submit in invite-only CTA */ } } as FormEvent);
  }

  async function joinPublic(inviteCodeToJoin: string) {
    setError("");
    setSuccess("");
    const existing = groups.find((item) => item.inviteCode.toUpperCase() === normalizeInviteCode(inviteCodeToJoin));
    if (existing) {
      setSuccess(`${t.alreadyMember} ${existing.name}`);
      return;
    }
    try {
      setBusy(true);
      const next = await joinGroup(normalizeInviteCode(inviteCodeToJoin));
      setSuccess(`${t.joined} ${next.name}`);
    } catch (cause) {
      setError(errorText(cause, t.joinError));
    } finally {
      setBusy(false);
    }
  }

  async function leaveCurrentGroup(id: string) {
    setError("");
    setSuccess("");
    try {
      setBusy(true);
      await leaveGroup(id);
      setSuccess(t.left);
      if (mode === "detail") navigate("/groups");
    } catch (cause) {
      setError(errorText(cause, language === "en" ? "Could not leave group." : "Gruppe konnte nicht verlassen werden."));
    } finally {
      setBusy(false);
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
              <Button icon={<Plus />} disabled={busy}>{t.createCta}</Button>
            </form>
            {invite ? (
              <div className="invite-result">
                <p>{t.invite}</p>
                <strong>{getInviteUrl(invite)}</strong>
                <Button variant="secondary" icon={<Copy />} onClick={() => void copyInviteLink(invite)}>{copied === invite ? t.copied : t.copy}</Button>
                {manualCopyUrl ? <input className="copy-fallback" data-invite-copy-field readOnly value={manualCopyUrl} /> : null}
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
              <div className="join-success-panel">
                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : <p>{busy ? `${t.joinCta}...` : `${t.ready} ${normalizeInviteCode(inviteCode)}`}</p>}
                {joinedGroupId ? (
                  <>
                    <Button onClick={() => navigate(`/groups/${joinedGroupId}`)}>{t.goGroup}</Button>
                    <Button variant="secondary" onClick={() => navigate("/start")}>{t.goHome}</Button>
                  </>
                ) : (
                  <Button icon={<UserRoundPlus />} disabled={busy} onClick={() => void joinCurrentInvite()}>{t.joinCta}</Button>
                )}
              </div>
            ) : (
              <form onSubmit={submitJoin}>
                <Input label={t.inviteCode} placeholder={t.invitePlaceholder} value={invite || inviteCode || ""} onChange={(event) => setInvite(event.currentTarget.value)} />
                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : null}
                {joinedGroupId ? <Button variant="secondary" onClick={() => navigate(`/groups/${joinedGroupId}`)}>{t.goGroup}</Button> : null}
                <Button icon={<UserRoundPlus />} disabled={busy}>{t.joinCta}</Button>
              </form>
            )}
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
            <Button variant="secondary" icon={<Copy />} onClick={() => void copyInviteLink(group.inviteCode)}>{copied === group.inviteCode ? t.copied : t.copy}</Button>
            {manualCopyUrl ? <input className="copy-fallback" data-invite-copy-field readOnly value={manualCopyUrl} /> : null}
            <a href={`https://wa.me/?text=${encodeURIComponent(`Komm in meine Tusiger-Gruppe: ${getInviteUrl(group.inviteCode)}`)}`} target="_blank" rel="noreferrer"><Button variant="glass">{t.shareWhatsapp}</Button></a>
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
              <strong>{item.name}<small>{t.active} · {item.memberCount} {t.members}</small></strong>
              <span>{t.best}<br /><b>{item.bestTimeSeconds ? formatDuration(item.bestTimeSeconds) : "–"}</b></span>
              <ChevronRight />
            </Link>
          ))}
        </GlassPanel>
        <h2>{t.publicGroups}</h2>
        <GlassPanel className="group-list">
          {publicGroupRows.length === 0 ? <p className="empty-state">{t.noPublicGroups}</p> : visiblePublicGroups.map((item) => (
            <article className="public-group-row" key={item.id}>
              <strong>{item.name}<small>{item.memberCount} {t.members}</small></strong>
              <Button variant="secondary" disabled={busy} onClick={() => void joinPublic(item.inviteCode)}>{t.joinCta}</Button>
            </article>
          ))}
          {publicPageCount > 1 ? (
            <nav className="group-pagination" aria-label={t.publicGroups}>
              <button type="button" disabled={publicPage === 1} onClick={() => setPublicPage((page) => Math.max(1, page - 1))}>{t.previous}</button>
              <span>{t.page} {publicPage} / {publicPageCount}</span>
              <button type="button" disabled={publicPage === publicPageCount} onClick={() => setPublicPage((page) => Math.min(publicPageCount, page + 1))}>{t.next}</button>
            </nav>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
        </GlassPanel>
      </section>
    </PageShell>
  );
}
