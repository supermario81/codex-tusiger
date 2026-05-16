import { UserRound } from "lucide-react";

export function Avatar({ name, url, size = "md" }: { name: string; url?: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className={`avatar avatar-${size}`}>
      {url ? <img src={url} alt="" /> : initials ? <span>{initials}</span> : <UserRound aria-hidden />}
    </span>
  );
}
