export function ProgressBar({ value, max = 1000 }: { value: number; max?: number }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress-bar" aria-label={`${Math.round(percent)} Prozent`}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
