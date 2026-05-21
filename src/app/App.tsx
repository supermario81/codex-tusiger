import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminPage } from "../features/admin/AdminPage";
import { LoginPage } from "../features/auth/LoginPage";
import { VerifyPage } from "../features/auth/VerifyPage";
import { GroupsPage } from "../features/groups/GroupsPage";
import { HistoryPage } from "../features/history/HistoryPage";
import { LeaderboardPage } from "../features/leaderboard/LeaderboardPage";
import { LegalPage } from "../features/legal/LegalPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { ProfileSetupPage } from "../features/profile/ProfileSetupPage";
import { FinishPage } from "../features/run/FinishPage";
import { HomePage } from "../features/run/HomePage";
import { PreRunPage } from "../features/run/PreRunPage";
import { ResultPage } from "../features/run/ResultPage";
import { RunPage } from "../features/run/RunPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { readPendingInviteCode, savePendingInviteCode } from "../lib/community/community";
import { useApp } from "./AppContext";

function Gate({ children }: { children: React.ReactNode }) {
  const { profile, ready, setupError, user } = useApp();
  const location = useLocation();

  if (!ready) {
    return <div className="boot-screen">Tusiger wird geladen...</div>;
  }

  if (setupError && !user) {
    return <LoginPage />;
  }

  if (location.pathname.startsWith("/join/")) {
    savePendingInviteCode(location.pathname);
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return <Navigate to="/setup-profile" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicStart() {
  const { profile, ready, user } = useApp();
  if (!ready) return <div className="boot-screen">Tusiger wird geladen...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/setup-profile" replace />;
  const pendingInviteCode = readPendingInviteCode();
  if (pendingInviteCode) return <Navigate to={"/join/" + pendingInviteCode} replace />;
  return <HomePage />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicStart />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/setup-profile" element={<ProfileSetupPage />} />
      <Route path="/legal/:slug" element={<LegalPage />} />
      <Route path="/join/:inviteCode" element={<Gate><GroupsPage mode="invite" /></Gate>} />
      <Route path="/start" element={<Gate><HomePage /></Gate>} />
      <Route path="/pre-run" element={<Gate><PreRunPage /></Gate>} />
      <Route path="/run" element={<Gate><RunPage /></Gate>} />
      <Route path="/finish" element={<Gate><FinishPage /></Gate>} />
      <Route path="/result/:runId" element={<Gate><ResultPage /></Gate>} />
      <Route path="/report/:runId" element={<Gate><ResultPage /></Gate>} />
      <Route path="/leaderboard" element={<Gate><LeaderboardPage /></Gate>} />
      <Route path="/groups" element={<Gate><GroupsPage /></Gate>} />
      <Route path="/groups/new" element={<Gate><GroupsPage mode="new" /></Gate>} />
      <Route path="/groups/join" element={<Gate><GroupsPage mode="join" /></Gate>} />
      <Route path="/groups/:groupId" element={<Gate><GroupsPage mode="detail" /></Gate>} />
      <Route path="/profile" element={<Gate><ProfilePage /></Gate>} />
      <Route path="/history" element={<Gate><HistoryPage /></Gate>} />
      <Route path="/donate" element={<Gate><HistoryPage focusDonate /></Gate>} />
      <Route path="/settings" element={<Gate><SettingsPage /></Gate>} />
      <Route path="/admin" element={<Gate><AdminPage /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
