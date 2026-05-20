import { Globe2, ImagePlus } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { Logo } from "../../components/layout/Logo";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

const blockedNicknames = ["admin", "null", "undefined", "test"];

export function ProfileSetupPage() {
  const { language, profile, saveProfile, setLanguage, uploadAvatar } = useApp();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [error, setError] = useState("");
  const [uploadState, setUploadState] = useState("");

  const isValid = useMemo(() => {
    const clean = nickname.trim().toLowerCase();
    return clean.length >= 3 && clean.length <= 20 && !blockedNicknames.includes(clean);
  }, [nickname]);

  function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Bitte nutze JPG, PNG oder WebP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Das Bild darf maximal 2 MB groß sein.");
      return;
    }

    setUploadState("Avatar wird hochgeladen...");
    uploadAvatar(file).then((url) => {
      setAvatarUrl(url);
      setUploadState("Avatar bereit.");
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Avatar konnte nicht hochgeladen werden.");
      setUploadState("");
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!isValid) {
      setError("Nickname braucht 3–20 Zeichen und darf kein Platzhalter sein.");
      return;
    }
    await saveProfile({ nickname: nickname.trim(), avatarUrl, language });
    navigate("/");
  }

  return (
    <PageShell nav={false}>
      <form className="profile-setup" onSubmit={handleSubmit}>
        <Logo compact />
        <h1>Dein Profil</h1>
        <p>Wähle einen Nickname und Avatar, um loszulegen.</p>
        <label className="avatar-upload">
          <Avatar name={nickname || "Tusiger"} url={avatarUrl} size="lg" />
          <span><ImagePlus aria-hidden /></span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} />
        </label>
        <button className="text-link" type="button" onClick={() => setAvatarUrl("")}>
          Avatar ändern oder überspringen
        </button>
        <GlassPanel>
          <Input
            label="Nickname"
            value={nickname}
            maxLength={20}
            placeholder="Dein Nickname"
            helper={`${nickname.length} / 20`}
            error={error}
            onChange={(event) => setNickname(event.currentTarget.value)}
          />
          <p className="helper-line"><Globe2 size={18} /> Öffentlich sichtbar in der Rangliste</p>
          <div className="segmented language-switch">
            <button className={language === "de" ? "active" : ""} type="button" onClick={() => setLanguage("de")}>Deutsch</button>
            <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>English</button>
          </div>
          {uploadState ? <p className="helper-line">{uploadState}</p> : null}
        </GlassPanel>
        <Button disabled={!isValid}>Weiter</Button>
        <GlassPanel className="preview-card">
          <h2>Vorschau</h2>
          <Avatar name={nickname || "Dein Nickname"} url={avatarUrl} size="md" />
          <div>
            <strong>{nickname || "Dein Nickname"}</strong>
            <span>642 Stufen</span>
            <em>Rookie</em>
          </div>
        </GlassPanel>
      </form>
    </PageShell>
  );
}
