import { Navigate, Route, Routes } from "react-router-dom";
import { AdminPage } from "../features/admin/AdminPage";
import { LoginPage } from "../features/auth/LoginPage";
import { VerifyPage } from "../features/auth/VerifyPage";
import { GroupsPage } from "../features/groups/GroupsPage";
import { HistoryPage } from "../features/history/HistoryPage";
import { LeaderboardPage } from "../features/leaderboard/LeaderboardPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { ProfileSetupPage } from "../features/profile/ProfileSetupPage";
import { FinishPage } from "../features/run/FinishPage";
import { HomePage } from "../features/run/HomePage";
import { PreRunPage } from "../features/run/PreRunPage";
import { ResultPage } from "../features/run/ResultPage";
import { RunPage } from "../features/run/RunPage";
import { SettingsPage } from "../features/settings/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/setup-profile" element={<ProfileSetupPage />} />
      <Route path="/start" element={<HomePage />} />
      <Route path="/pre-run" element={<PreRunPage />} />
      <Route path="/run" element={<RunPage />} />
      <Route path="/finish" element={<FinishPage />} />
      <Route path="/result/:runId" element={<ResultPage />} />
      <Route path="/report/:runId" element={<ResultPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/new" element={<GroupsPage mode="new" />} />
      <Route path="/groups/join" element={<GroupsPage mode="join" />} />
      <Route path="/groups/:groupId" element={<GroupsPage mode="detail" />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/donate" element={<HistoryPage focusDonate />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
