import { BarChart3, BookHeart, Home, UsersRound, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../app/AppContext";

const items = [
  { to: "/", label: { de: "Start", en: "Start" }, icon: Home },
  { to: "/leaderboard", label: { de: "Rangliste", en: "Ranking" }, icon: BarChart3 },
  { to: "/groups", label: { de: "Gruppen", en: "Groups" }, icon: UsersRound },
  { to: "/profile", label: { de: "Profil", en: "Profile" }, icon: UserRound },
  { to: "/history", label: { de: "Geschichte", en: "Story" }, icon: BookHeart }
];

export function BottomNav() {
  const { language } = useApp();
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to}>
            <Icon aria-hidden />
            <span>{item.label[language]}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
