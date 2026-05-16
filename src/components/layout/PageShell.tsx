import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Logo } from "./Logo";

export function PageShell({
  children,
  nav = true,
  back = false,
  dark = false,
  compactLogo = true
}: {
  children: ReactNode;
  nav?: boolean;
  back?: boolean;
  dark?: boolean;
  compactLogo?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <main className={`page-shell ${dark ? "page-dark" : ""}`}>
      <div className="app-frame">
        <div className="status-spacer" aria-hidden>
          <span>9:41</span>
        </div>
        {back ? (
          <button className="back-button" type="button" onClick={() => navigate(-1)} aria-label="Zurück">
            <ArrowLeft />
          </button>
        ) : null}
        {compactLogo ? <Logo compact /> : null}
        {children}
        {nav ? <BottomNav /> : null}
      </div>
    </main>
  );
}
