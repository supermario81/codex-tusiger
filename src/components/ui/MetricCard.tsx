import type { ReactNode } from "react";

export function MetricCard({ icon, label, value, meta }: { icon?: ReactNode; label: string; value: string; meta?: string }) {
  return (
    <article className="metric-card">
      {icon ? <span>{icon}</span> : null}
      <small>{label}</small>
      <strong>{value}</strong>
      {meta ? <em>{meta}</em> : null}
    </article>
  );
}
