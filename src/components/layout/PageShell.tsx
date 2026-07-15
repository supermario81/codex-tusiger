import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { ConfettiBurst } from "../ui/Confetti";
import { Logo } from "./Logo";
import { playRunFanfare, primeRunAudio } from "../../lib/audio/runAudio";

const celebrationHoldMs = 2000;

export function PageShell({
  children,
  nav = true,
  back = false,
  dark = false,
  compactLogo = true,
  logoCelebrationTest = false
}: {
  children: ReactNode;
  nav?: boolean;
  back?: boolean;
  dark?: boolean;
  compactLogo?: boolean;
  logoCelebrationTest?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  // Versteckter Test-Trigger: 2 s auf das Logo drücken spielt Konfetti +
  // Fanfare, ohne 1150 Stufen laufen zu müssen. Der Pointer-Down ist die
  // User-Geste, die iOS Safari für den AudioContext braucht.
  const [celebrationBurst, setCelebrationBurst] = useState(0);
  const celebrationTimer = useRef<number | null>(null);
  const showHome =
    location.pathname !== "/" &&
    location.pathname !== "/login" &&
    location.pathname !== "/setup-profile";

  function startCelebrationHold() {
    if (!logoCelebrationTest) {
      return;
    }
    try {
      primeRunAudio();
    } catch {
      // Audio darf den Test-Trigger nie blockieren.
    }
    cancelCelebrationHold();
    celebrationTimer.current = window.setTimeout(() => {
      setCelebrationBurst((count) => count + 1);
      try {
        playRunFanfare();
      } catch {
        // Blockiertes Audio: Konfetti läuft trotzdem.
      }
    }, celebrationHoldMs);
  }

  function cancelCelebrationHold() {
    if (celebrationTimer.current !== null) {
      window.clearTimeout(celebrationTimer.current);
      celebrationTimer.current = null;
    }
  }

  return (
    <main className={`page-shell ${dark ? "page-dark" : ""}`}>
      <div className="app-frame">
        <div className="global-language-switcher">
          <LanguageSwitcher />
        </div>
        {back || showHome ? (
          <div className="shell-actions">
            {back ? (
              <button className="shell-action-button" type="button" onClick={() => navigate(-1)} aria-label="Zurück">
                <ArrowLeft />
              </button>
            ) : null}
            {showHome ? (
              <button className="shell-action-button" type="button" onClick={() => navigate("/")} aria-label="Zur Startseite">
                <Home />
              </button>
            ) : null}
          </div>
        ) : null}
        {compactLogo ? (
          logoCelebrationTest ? (
            <span
              className="logo-celebration-test"
              onPointerDown={startCelebrationHold}
              onPointerUp={cancelCelebrationHold}
              onPointerLeave={cancelCelebrationHold}
              onPointerCancel={cancelCelebrationHold}
              onContextMenu={(event) => event.preventDefault()}
            >
              <Logo compact />
            </span>
          ) : (
            <Logo compact />
          )
        ) : null}
        {celebrationBurst > 0 ? <ConfettiBurst key={celebrationBurst} fixed /> : null}
        {children}
        {nav ? <BottomNav /> : null}
      </div>
    </main>
  );
}
