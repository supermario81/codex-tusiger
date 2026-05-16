import { BarChart3, ChevronRight, Footprints, Heart, Mountain } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { Logo } from "../../components/layout/Logo";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";

export function HomePage() {
  const { profile, runs } = useApp();
  const navigate = useNavigate();
  const bestRun = runs.find((run) => run.status === "valid");
  const steps = bestRun?.estimatedSteps ?? 642;

  function handleStart() {
    navigate(profile ? "/pre-run" : "/login");
  }

  return (
    <PageShell compactLogo={false}>
      <section className="hero-home">
        <Logo />
        <GlassPanel className="progress-card">
          <p className="eyebrow">Heute</p>
          <strong>{steps}</strong>
          <span>/ 1000 Stufen</span>
          <div className="stairs-visual" aria-hidden>
            <i />
          </div>
          <ProgressBar value={steps} />
          <p className="motivation"><Mountain size={22} /> Dranbleiben. Jeder Schritt zählt.</p>
        </GlassPanel>
        <Button icon={<Footprints />} onClick={handleStart}>
          Lauf starten
        </Button>
        <Link className="action-row" to="/leaderboard">
          <BarChart3 aria-hidden /> Rangliste <ChevronRight aria-hidden />
        </Link>
        <Link className="action-row" to="/history">
          <Heart aria-hidden /> Geschichte & Spenden <ChevronRight aria-hidden />
        </Link>
      </section>
    </PageShell>
  );
}
