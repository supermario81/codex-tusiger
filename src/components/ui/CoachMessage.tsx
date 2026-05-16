import { Footprints } from "lucide-react";

export function CoachMessage({ message }: { message: string }) {
  return (
    <div className="coach-card">
      <span className="round-icon"><Footprints aria-hidden /></span>
      <div>
        <small>Tusiger Coach</small>
        <strong>{message}</strong>
      </div>
    </div>
  );
}
