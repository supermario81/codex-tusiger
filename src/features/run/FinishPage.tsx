import { BarChart3, Check, Trophy } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { localStore } from "../../lib/storage/localStore";
import { formatDuration } from "../../lib/geo/geo";
import { useApp } from "../../app/AppContext";
import { useEffect } from "react";

function playSuccessSound() {
  const audioFile = `${import.meta.env.BASE_URL}audio/victory.mp3`;
  const audio = new Audio(audioFile);
  audio.volume = 0.55;
  void audio.play().catch(() => {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + index * 0.14);
      gain.gain.linearRampToValueAtTime(0.16, now + index * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.14 + 0.28);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + index * 0.14);
      oscillator.stop(now + index * 0.14 + 0.3);
    });
  });
}

export function FinishPage() {
  const { config } = useApp();
  const runId = localStorage.getItem("tusiger.lastRunId");
  const run = localStore.readRuns().find((item) => item.id === runId);

  useEffect(() => {
    playSuccessSound();
  }, []);

  if (!run) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell nav={false}>
      <section className="finish-page">
        <div className="confetti" aria-hidden />
        <GlassPanel className="finish-card">
          <span className="success-medal"><Check /></span>
          <h1>DU HAST ES GESCHAFFT!</h1>
          <p>Du hast alle {config.totalSteps} Stufen gemeistert.</p>
          <small>Deine Zeit</small>
          <strong>{formatDuration(run.durationSeconds)}</strong>
          <ValidationBadge status={run.status} />
          <div className="personal-best">
            <Trophy /> <span>Persönliche Bestzeit</span><b>{formatDuration(run.durationSeconds)}</b>
          </div>
        </GlassPanel>
        <Link to={`/result/${run.id}`}><Button icon={<BarChart3 />}>Ergebnis ansehen</Button></Link>
        <Link className="action-row" to="/leaderboard">Rangliste</Link>
      </section>
    </PageShell>
  );
}
