export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? "logo-compact" : ""}`} aria-label="Tusiger">
      <strong>T</strong>
      {!compact ? (
        <>
          <span>TUSIGER</span>
          <em>1000 Stufen. Deine Zeit.</em>
        </>
      ) : null}
    </div>
  );
}
