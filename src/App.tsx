import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import AddUserPage from './pages/AddUserPage';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetLinkSent from './pages/auth/ResetLinkSent';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EmailPreview from './pages/auth/EmailPreview';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import InboxPage from './pages/InboxPage';
import TranscriptsFlowPage from './pages/TranscriptsFlowPage';
import TranscriptTasksPage from './pages/TranscriptTasksPage';
import FirmDetailPage from './pages/FirmDetailPage';

// ── Redirects to /login when no token is present ─────────────────────────────

function ProtectedRoute() {
  const { user, initialising } = useAuth();

  // Don't redirect until the initial token check completes
  if (initialising) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// ── Redirects logged-in users away from auth pages ───────────────────────────

function GuestRoute() {
  const { user, initialising } = useAuth();
  if (initialising) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

// ── App shell (sidebar + topbar) ─────────────────────────────────────────────

function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}

// ── Wrapper that reads location state for toast ───────────────────────────────

function UsersPageWrapper() {
  const location = useLocation();
  const showToast = (location.state as { showToast?: boolean } | null)?.showToast ?? false;
  return <UsersPage showToast={showToast} />;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest-only auth pages */}
          <Route element={<GuestRoute />}>
            <Route path="/login"           element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-link-sent" element={<ResetLinkSent />} />
            <Route path="/email-preview"   element={<EmailPreview />} />
          </Route>

          {/* Public onboarding — accessible without auth (invite link) */}
          <Route path="/onboarding"       element={<OnboardingPage />} />
          <Route path="/reset-password"   element={<ResetPasswordPage />} />

          {/* Protected app shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/inbox"                        element={<InboxPage />} />
              <Route path="/dashboard"                   element={<Dashboard />} />
              <Route path="/users"                       element={<UsersPageWrapper />} />
              <Route path="/users/new"                   element={<AddUserPage />} />
              <Route path="/settings"                    element={<SettingsPage />} />
              <Route path="/transcripts"                 element={<TranscriptsFlowPage />} />
              <Route path="/transcripts/:id/tasks"       element={<TranscriptTasksPage />} />
              <Route path="/firms/:id"                   element={<FirmDetailPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
