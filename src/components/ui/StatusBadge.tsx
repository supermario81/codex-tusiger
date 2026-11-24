import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useApp } from "../../app/AppContext";
import type { ValidationStatus } from "../../lib/types";

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  const { t } = useApp();
  const label =
    status === "valid"
      ? t("Gültig geprüft", "Validated")
      : status === "needs_review"
        ? t("In Prüfung", "In review")
        : status === "invalid"
          ? t("Ungültig", "Invalid")
          : t("Entwurf", "Draft");
  const Icon = status === "valid" ? CheckCircle2 : status === "invalid" ? XCircle : Clock3;
  return (
    <span className={`status-badge status-${status}`}>
      <Icon size={16} aria-hidden />
      {label}
    </span>
  );
}
