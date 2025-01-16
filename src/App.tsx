import { AuthLayout } from '@/components/layout/auth-layout';
import { AuthTabs } from '@/components/auth/auth-tabs';
import { Dashboard } from '@/components/dashboard/dashboard';
import { CreateJobPage } from '@/components/dashboard/jobs/create-job-page';
import { JobCandidatesPage } from '@/components/dashboard/candidates/job-candidates-page';
import { ScreeningPage } from '@/components/screening/screening-page';
import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/contexts/auth-context';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';

function PrivateRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <AuthLayout>
        <AuthTabs />
      </AuthLayout>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/dashboard/jobs/create" element={<CreateJobPage />} />
      <Route
        path="/dashboard/jobs/:jobId/candidates"
        element={<JobCandidatesPage />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route for screening */}
          <Route path="/screening/:screeningId" element={<ScreeningPage />} />
          {/* All other routes are private */}
          <Route path="/*" element={<PrivateRoutes />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;