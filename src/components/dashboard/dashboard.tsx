import { useAuth } from '@/contexts/auth-context';
import { DashboardHeader } from './dashboard-header';
import { DashboardNav } from './dashboard-nav';
import { JobsList } from './jobs/jobs-list';
import { CandidatesList } from './candidates/candidates-list';
import { ScreeningAnalytics } from './analytics/screening-analytics';
import { useState } from 'react';

type DashboardView = 'jobs' | 'candidates' | 'screening-analytics';

export function Dashboard() {
  const [currentView, setCurrentView] = useState<DashboardView>('jobs');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <div className="flex h-[calc(100vh-4rem)]">
        <DashboardNav currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-y-auto p-8">
          {currentView === 'jobs' && <JobsList />}
          {currentView === 'candidates' && <CandidatesList />}
          {currentView === 'screening-analytics' && <ScreeningAnalytics />}
        </main>
      </div>
    </div>
  );
}