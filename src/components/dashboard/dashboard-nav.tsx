import { Button } from '@/components/ui/button';
import { Briefcase, Users, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  currentView: string;
  onViewChange: (view: 'jobs' | 'candidates' | 'screening-analytics') => void;
}

export function DashboardNav({ currentView, onViewChange }: DashboardNavProps) {
  const navItems = [
    { icon: Briefcase, label: 'Jobs', value: 'jobs' },
    { icon: Users, label: 'Candidates', value: 'candidates' },
    { icon: Video, label: 'Screening Analytics', value: 'screening-analytics' },
  ];

  return (
    <nav className="w-64 border-r min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-2">
        {navItems.map(({ icon: Icon, label, value }) => (
          <Button
            key={value}
            variant={currentView === value ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start text-foreground',
              currentView === value && 'bg-secondary'
            )}
            onClick={() => onViewChange(value as any)}
          >
            <Icon className="mr-2 h-4 w-4 text-foreground" />
            {label}
          </Button>
        ))}
      </div>
    </nav>
  );
}