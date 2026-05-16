import { LockKeyhole, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { Logo } from "../../components/layout/Logo";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export function LoginPage() {
  const { isDemoMode, loginWithEmail, verifyOtp, profile } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Code konnte nicht gesendet werden.");
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyOtp(email, otp);
      navigate(profile ? "/pre-run" : "/setup-profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Der Code ist ungültig.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell nav={false} compactLogo={false}>
      <section className="auth-page">
        <Logo />
        <h1>Willkommen zurück</h1>
        <p>Melde dich mit E-Mail an</p>
        <div className="segmented">
          <button className="active" type="button">E-Mail</button>
          <button type="button" disabled>Mobile später</button>
        </div>
        <GlassPanel>
          <form onSubmit={sendCode}>
            <Input
              value={email}
              inputMode="email"
              placeholder="Deine E-Mail-Adresse"
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <Button disabled={loading} icon={<Send />}>
              {loading ? "Sende..." : "Code senden"}
            </Button>
          </form>
        </GlassPanel>
        <GlassPanel>
          <form onSubmit={login}>
            <h2>Code eingeben</h2>
            <p>{sent ? "Wir haben dir einen 6-stelligen Code gesendet." : "Sende zuerst deinen Code."}</p>
            <div className="otp-row" aria-hidden>
              {Array.from({ length: 6 }).map((_, index) => (
                <span key={index}>{otp[index] ?? "–"}</span>
              ))}
            </div>
            <Input
              value={otp}
              inputMode="numeric"
              maxLength={6}
              placeholder={isDemoMode ? "Demo: 123456" : "6-stelliger Code"}
              onChange={(event) => setOtp(event.currentTarget.value.replace(/\D/g, ""))}
            />
            {error ? <p className="form-error">{error}</p> : null}
            <Button disabled={!sent || loading} icon={<LockKeyhole />}>
              Einloggen
            </Button>
          </form>
        </GlassPanel>
        <p className="privacy-copy">
          Mit der Anmeldung stimmst du unserer Datenschutzerklärung zu. GPS wird erst vor dem Lauf angefragt.
          {isDemoMode ? " Demo-Modus ist aktiv." : null}
        </p>
      </section>
    </PageShell>
  );
}
