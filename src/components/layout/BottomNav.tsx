import { BarChart3, BookHeart, Home, UsersRound, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Start", icon: Home },
  { to: "/leaderboard", label: "Rangliste", icon: BarChart3 },
  { to: "/groups", label: "Gruppen", icon: UsersRound },
  { to: "/profile", label: "Profil", icon: UserRound },
  { to: "/history", label: "Geschichte", icon: BookHeart }
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
