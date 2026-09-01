import { ArrowLeft, LockKeyhole, LogOut, MailCheck, Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { Logo } from "../../components/layout/Logo";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { InstallHint } from "../../components/ui/InstallHint";

// Supabase/GoTrue erlaubt standardmäßig höchstens eine Anmelde-Mail pro Minute.
// Ein kürzerer Countdown würde den Knopf freigeben, während der Server noch
// ablehnt.
const resendCooldownSeconds = 60;

const copy = {
  de: {
    title: "Willkommen zurück",
    subtitle: "Melde dich mit E-Mail an",
    invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    sendFailed: "Code konnte nicht gesendet werden.",
    invalidCode: "Der Code ist ungültig.",
    emailPlaceholder: "Deine E-Mail-Adresse",
    sending: "Sende...",
    send: "Code senden",
    sentTitle: "Code ist unterwegs",
    sentBody: "Wir haben eine E-Mail an",
    sentInstruction: "gesendet. Gib den 6-stelligen Code ein oder nutze den Direktlink in der E-Mail.",
    currentSession: "Du bist aktuell angemeldet als",
    continue: "Weiter zur App",
    switchAccount: "Anderes Konto verwenden",
    changeEmail: "E-Mail ändern",
    resend: "Code erneut senden",
    resending: "Sende erneut...",
    resendWait: "Erneut senden in",
    resendSent: "Neuer Code gesendet. Prüfe dein Postfach.",
    resendRateLimited: "Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.",
    codeTitle: "Code eingeben",
    inbox: "Bitte prüfe deinen Posteingang und den Spam-Ordner.",
    sendFirst: "Sende zuerst deinen Code.",
    codePlaceholder: "6-stelliger Supabase-Code",
    login: "Einloggen",
    privacy: "Mit der Anmeldung stimmst du unserer Datenschutzerklärung zu. GPS wird erst vor dem Lauf angefragt.",
    privacyLink: "Datenschutz",
    termsLink: "Nutzungsbedingungen"
  },
  en: {
    title: "Welcome back",
    subtitle: "Sign in with email",
    invalidEmail: "Please enter a valid email address.",
    sendFailed: "The code could not be sent.",
    invalidCode: "The code is invalid.",
    emailPlaceholder: "Your email address",
    sending: "Sending...",
    send: "Send code",
    sentTitle: "Code sent",
    sentBody: "We sent an email to",
    sentInstruction: "Enter the 6-digit code or use the direct sign-in link in the email.",
    currentSession: "You are currently signed in as",
    continue: "Continue to app",
    switchAccount: "Use another account",
    changeEmail: "Change email",
    resend: "Resend code",
    resending: "Resending...",
    resendWait: "Resend available in",
    resendSent: "New code sent. Check your inbox.",
    resendRateLimited: "Too many requests. Please wait a moment and try again.",
    codeTitle: "Enter code",
    inbox: "Please check your inbox and spam folder.",
    sendFirst: "Send your code first.",
    codePlaceholder: "6-digit Supabase code",
    login: "Sign in",
    privacy: "By signing in, you agree to our privacy policy. GPS is requested only before a run.",
    privacyLink: "Privacy",
    termsLink: "Terms"
  }
};

export function LoginPage() {
  const { language, loginWithEmail, logout, profile, setupError, user, verifyOtp } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = typeof location.state === "object" && location.state && "from" in location.state && typeof location.state.from === "string"
    ? location.state.from
    : "/";
  const t = copy[language];
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  // Nur eine echte Rate-Limit-Antwort bekommt den Warte-Text; ein fehlendes
  // Supabase-Setup darf nicht als "zu viele Anfragen" verkleidet werden.
  function isRateLimit(cause: unknown) {
    const message = (cause instanceof Error ? cause.message : String(cause ?? "")).toLowerCase();
    return message.includes("rate limit") || message.includes("too many") || message.includes("429") ||
      message.includes("only request this after") || message.includes("security purposes");
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t.invalidEmail);
      return;
    }
    setEmail(cleanEmail);

    setLoading(true);
    try {
      await loginWithEmail(cleanEmail, language);
      setSent(true);
      setResendNote("");
      setCooldown(resendCooldownSeconds);
    } catch (cause) {
      setError(isRateLimit(cause) ? t.resendRateLimited : cause instanceof Error ? cause.message : t.sendFailed);
    } finally {
      setLoading(false);
    }
  }

  // Neuer Code an dieselbe Adresse, ohne das Code-Formular abzuräumen.
  async function resendCode() {
    if (resending || cooldown > 0 || !email) {
      return;
    }
    setError("");
    setResendNote("");
    setResending(true);
    try {
      await loginWithEmail(email, language);
      setOtp("");
      setResendNote(t.resendSent);
      setCooldown(resendCooldownSeconds);
    } catch (cause) {
      setError(isRateLimit(cause) ? t.resendRateLimited : cause instanceof Error ? cause.message : t.sendFailed);
    } finally {
      setResending(false);
    }
  }

  function changeEmail() {
    setSent(false);
    setOtp("");
    setError("");
    setResendNote("");
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyOtp(email, otp);
      navigate(fromPath);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.invalidCode);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell nav={false} compactLogo={false}>
      <section className="auth-page">
        <InstallHint />
        <Logo />
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        {setupError ? <GlassPanel className="setup-warning"><strong>Setup fehlt</strong><p>{setupError}</p></GlassPanel> : null}
        {user ? (
          <GlassPanel className="sent-panel">
            <div className="sent-icon"><MailCheck /></div>
            <h2>{profile?.nickname ?? user.email}</h2>
            <p>{t.currentSession} <strong>{user.email}</strong>.</p>
            <Button onClick={() => navigate(profile ? fromPath : "/setup-profile", { state: { from: fromPath } })}>{t.continue}</Button>
            <Button variant="secondary" icon={<LogOut />} onClick={logout}>{t.switchAccount}</Button>
          </GlassPanel>
        ) : null}
        {!user && !sent ? (
          <GlassPanel>
            <form onSubmit={sendCode}>
              <Input
                value={email}
                inputMode="email"
                placeholder={t.emailPlaceholder}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <Button disabled={loading || cooldown > 0} icon={<Send />}>
                {loading ? t.sending : cooldown > 0 ? `${t.resendWait} ${cooldown}s` : t.send}
              </Button>
            </form>
          </GlassPanel>
        ) : !user ? (
          <GlassPanel className="sent-panel">
            <div className="sent-icon"><MailCheck /></div>
            <h2>{t.sentTitle}</h2>
            <p>{t.sentBody} <strong>{email}</strong> {t.sentInstruction}</p>
            {resendNote ? <p className="form-success">{resendNote}</p> : null}
            <Button
              type="button"
              variant="secondary"
              icon={<Send />}
              disabled={resending || cooldown > 0}
              onClick={() => void resendCode()}
            >
              {resending ? t.resending : cooldown > 0 ? `${t.resendWait} ${cooldown}s` : t.resend}
            </Button>
            <button className="text-button" type="button" onClick={changeEmail}>
              <ArrowLeft /> {t.changeEmail}
            </button>
          </GlassPanel>
        ) : null}
        {!user ? <GlassPanel>
          <form onSubmit={login}>
            <h2>{t.codeTitle}</h2>
            <p>{sent ? t.inbox : t.sendFirst}</p>
            <div
              className="otp-entry"
              onClick={() => otpInputRef.current?.focus()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") otpInputRef.current?.focus();
              }}
              role="group"
              aria-label={t.codePlaceholder}
              tabIndex={-1}
            >
              <div className="otp-row" aria-hidden>
                {Array.from({ length: 6 }).map((_, index) => (
                  <span className={otp[index] ? "filled" : ""} key={index}>{otp[index] ?? ""}</span>
                ))}
              </div>
              <input
                ref={otpInputRef}
                className="otp-input"
                value={otp}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-label={t.codePlaceholder}
                onChange={(event) => setOtp(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <Button disabled={!sent || loading} icon={<LockKeyhole />}>
              {t.login}
            </Button>
          </form>
        </GlassPanel> : null}
        <p className="privacy-copy">
          {t.privacy}
          {" "}
          <Link to="/legal/datenschutz">{t.privacyLink}</Link> · <Link to="/legal/nutzungsbedingungen">{t.termsLink}</Link>
        </p>
      </section>
    </PageShell>
  );
}
