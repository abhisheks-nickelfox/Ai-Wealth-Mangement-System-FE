import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NetworkErrorToast from './components/ui/NetworkErrorToast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
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
import AddFirmPage from './pages/AddFirmPage';
import EditFirmPage from './pages/EditFirmPage';
import EditUserSettingsPage from './pages/EditUserSettingsPage';
import SharedProjectPage from './pages/SharedProjectPage';
import TaskDetailPage from './pages/TaskDetailPage';
import ProjectFullPage from './pages/ProjectFullPage';
import MyTasksPage from './pages/MyTasksPage';
import ProjectsSummaryPage from './pages/ProjectsSummaryPage';

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

// ── QueryClient — shared singleton, created once outside the component tree ────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s default for most data
      gcTime:    600_000,      // 10 min — keep cache longer before GC
      retry:     1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path="/onboarding"                    element={<OnboardingPage />} />
          <Route path="/reset-password"                element={<ResetPasswordPage />} />
          <Route path="/shared/project/:token"         element={<SharedProjectPage />} />

          {/* Protected app shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/inbox"                        element={<InboxPage />} />
              <Route path="/dashboard"                   element={<Dashboard />} />
              <Route path="/users"                       element={<UsersPage />} />
              <Route path="/users/new"                   element={<AddUserPage />} />
              <Route path="/users/:id/settings"          element={<EditUserSettingsPage />} />
              <Route path="/settings"                    element={<SettingsPage />} />
              <Route path="/transcripts"                 element={<TranscriptsFlowPage />} />
              <Route path="/transcripts/:id/tasks"       element={<TranscriptTasksPage />} />
              <Route path="/firms/new"                   element={<AddFirmPage />} />
              <Route path="/firms/:id/edit"              element={<EditFirmPage />} />
              <Route path="/my-tasks"                            element={<MyTasksPage />} />
              <Route path="/projects"                            element={<ProjectsSummaryPage />} />
              <Route path="/firms/:firmId/tasks/:taskId"          element={<TaskDetailPage />} />
              <Route path="/firms/:firmId/projects/:projectId" element={<ProjectFullPage />} />
              <Route path="/firms/:id"                   element={<FirmDetailPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
      <NetworkErrorToast />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
