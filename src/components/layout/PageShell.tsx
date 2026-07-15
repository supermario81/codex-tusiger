import type { ReactNode } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { CelebrationTestTrigger } from "../ui/Confetti";
import { Logo } from "./Logo";

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
  const showHome =
    location.pathname !== "/" &&
    location.pathname !== "/login" &&
    location.pathname !== "/setup-profile";

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
            <CelebrationTestTrigger>
              <Logo compact />
            </CelebrationTestTrigger>
          ) : (
            <Logo compact />
          )
        ) : null}
        {children}
        {nav ? <BottomNav /> : null}
      </div>
    </main>
  );
}
