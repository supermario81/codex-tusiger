import { BarChart3, Heart, Home, UsersRound, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Start", icon: Home },
  { to: "/leaderboard", label: "Rangliste", icon: BarChart3 },
  { to: "/groups", label: "Gruppen", icon: UsersRound },
  { to: "/profile", label: "Profil", icon: UserRound },
  { to: "/donate", label: "Spenden", icon: Heart }
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to}>
            <Icon aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
