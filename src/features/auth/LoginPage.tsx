import { ArrowLeft, LockKeyhole, MailCheck, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { Logo } from "../../components/layout/Logo";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export function LoginPage() {
  const { loginWithEmail, profile, setupError, user, verifyOtp } = useApp();
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

  function changeEmail() {
    setSent(false);
    setOtp("");
    setError("");
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyOtp(email, otp);
      navigate(profile ? "/" : "/setup-profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Der Code ist ungültig.");
    } finally {
      setLoading(false);
    }
  }

  return (
    user && profile ? <Navigate to="/" replace /> :
    <PageShell nav={false} compactLogo={false}>
      <section className="auth-page">
        <Logo />
        <h1>Willkommen zurück</h1>
        <p>Melde dich mit E-Mail an</p>
        {setupError ? <GlassPanel className="setup-warning"><strong>Setup fehlt</strong><p>{setupError}</p></GlassPanel> : null}
        {!sent ? (
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
        ) : (
          <GlassPanel className="sent-panel">
            <div className="sent-icon"><MailCheck /></div>
            <h2>Code ist unterwegs</h2>
            <p>Wir haben eine E-Mail an <strong>{email}</strong> gesendet. Gib den 6-stelligen Code ein oder nutze den Login-Link.</p>
            <button className="text-button" type="button" onClick={changeEmail}>
              <ArrowLeft /> E-Mail ändern
            </button>
          </GlassPanel>
        )}
        <GlassPanel>
          <form onSubmit={login}>
            <h2>Code eingeben</h2>
            <p>{sent ? "Bitte prüfe deinen Posteingang und den Spam-Ordner." : "Sende zuerst deinen Code."}</p>
            <div className="otp-row" aria-hidden>
              {Array.from({ length: 6 }).map((_, index) => (
                <span key={index}>{otp[index] ?? "–"}</span>
              ))}
            </div>
            <Input
              value={otp}
              inputMode="numeric"
              maxLength={6}
              placeholder="6-stelliger Supabase-Code"
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
          {" "}
          <Link to="/legal/datenschutz">Datenschutz</Link> · <Link to="/legal/nutzungsbedingungen">Nutzungsbedingungen</Link>
        </p>
      </section>
    </PageShell>
  );
}
