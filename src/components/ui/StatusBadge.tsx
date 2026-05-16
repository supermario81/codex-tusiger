import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { ValidationStatus } from "../../lib/types";

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  const label =
    status === "valid"
      ? "Gültig geprüft"
      : status === "needs_review"
        ? "In Prüfung"
        : status === "invalid"
          ? "Ungültig"
          : "Entwurf";
  const Icon = status === "valid" ? CheckCircle2 : status === "invalid" ? XCircle : Clock3;
  return (
    <span className={`status-badge status-${status}`}>
      <Icon size={16} aria-hidden />
      {label}
    </span>
  );
}
