import { Globe2, ImagePlus, UserRound } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

const blockedNicknames = ["admin", "null", "undefined", "test"];

export function ProfileSetupPage() {
  const { config, language, profile, saveProfile, uploadAvatar } = useApp();
  const t = language === "en" ? {
    title: "Your profile",
    subtitle: "Choose a nickname and avatar to get started.",
    invalidFile: "Please use JPG, PNG or WebP.",
    sourceTooLarge: "The source image may be up to 8 MB. It is optimized as WebP below 1 MB before upload.",
    uploading: "Optimizing and uploading avatar...",
    ready: "Avatar ready.",
    uploadFailed: "Avatar could not be uploaded.",
    nicknameInvalid: "Nickname needs 3-20 characters and cannot be a placeholder.",
    avatarAction: "Change avatar or skip",
    nickname: "Nickname",
    placeholder: "Your nickname",
    public: "Publicly visible in the leaderboard",
    continue: "Continue",
    preview: "Preview",
    steps: "steps"
  } : {
    title: "Dein Profil",
    subtitle: "Wähle einen Nickname und Avatar, um loszulegen.",
    invalidFile: "Bitte nutze JPG, PNG oder WebP.",
    sourceTooLarge: "Das Ausgangsbild darf maximal 8 MB groß sein. Es wird vor dem Upload als WebP unter 1 MB optimiert.",
    uploading: "Avatar wird optimiert und hochgeladen...",
    ready: "Avatar bereit.",
    uploadFailed: "Avatar konnte nicht hochgeladen werden.",
    nicknameInvalid: "Nickname braucht 3–20 Zeichen und darf kein Platzhalter sein.",
    avatarAction: "Avatar ändern oder überspringen",
    nickname: "Nickname",
    placeholder: "Dein Nickname",
    public: "Öffentlich sichtbar in der Rangliste",
    continue: "Weiter",
    preview: "Vorschau",
    steps: "Stufen"
  };
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = typeof location.state === "object" && location.state && "from" in location.state && typeof location.state.from === "string"
    ? location.state.from
    : "/";
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
      setError(t.invalidFile);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError(t.sourceTooLarge);
      return;
    }

    setUploadState(t.uploading);
    uploadAvatar(file).then((url) => {
      setAvatarUrl(url);
      setUploadState(t.ready);
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : t.uploadFailed);
      setUploadState("");
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!isValid) {
      setError(t.nicknameInvalid);
      return;
    }
    await saveProfile({ nickname: nickname.trim(), avatarUrl, language });
    navigate(fromPath);
  }

  return (
    <PageShell nav={false}>
      <form className="profile-setup" onSubmit={handleSubmit}>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <label className="avatar-upload">
          {avatarUrl ? <Avatar name={nickname || "Tusiger"} url={avatarUrl} size="lg" /> : <UserRound aria-hidden />}
          <span className="avatar-upload-action"><ImagePlus aria-hidden /></span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} />
        </label>
        <button className="text-link" type="button" onClick={() => setAvatarUrl("")}>
          {t.avatarAction}
        </button>
        <GlassPanel>
          <Input
            label={t.nickname}
            value={nickname}
            maxLength={20}
            placeholder={t.placeholder}
            helper={`${nickname.length} / 20`}
            error={error}
            onChange={(event) => setNickname(event.currentTarget.value)}
          />
          <p className="helper-line"><Globe2 size={18} /> {t.public}</p>
          {uploadState ? <p className="helper-line">{uploadState}</p> : null}
        </GlassPanel>
        <Button disabled={!isValid}>{t.continue}</Button>
        <GlassPanel className="preview-card">
          <h2>{t.preview}</h2>
          <Avatar name={nickname || ""} url={avatarUrl} size="md" />
          <div>
            <strong>{nickname || t.placeholder}</strong>
            <span>0 / {config.totalSteps} {t.steps}</span>
            <em>Rookie</em>
          </div>
        </GlassPanel>
      </form>
    </PageShell>
  );
}
