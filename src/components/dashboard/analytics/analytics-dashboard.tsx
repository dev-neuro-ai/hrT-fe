import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockCandidates } from '@/lib/mock-data/candidates';
import { mockJobApplications } from '@/lib/mock-data/job-applications';
import { mockJobs } from '@/lib/mock-data/jobs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function AnalyticsDashboard() {
  // Calculate metrics
  const totalCandidates = mockCandidates.length;
  const totalApplications = mockJobApplications.length;
  const hiredCandidates = mockCandidates.filter(c => c.status === 'hired').length;
  const hireRate = (hiredCandidates / totalCandidates) * 100;

  // Calculate job-wise applications
  const jobApplications = mockJobs.map(job => {
    const applications = mockJobApplications.filter(app => app.jobId === job.id);
    const highScoreApplications = applications.filter(app => app.score >= 80);
    
    return {
      name: job.title.split(' ').slice(0, 2).join(' '), // Shorter names for better display
      total: applications.length,
      highScore: highScoreApplications.length,
    };
  });

  // Calculate score distribution
  const lowScoreApplications = mockJobApplications.filter(app => app.score < 50).length;
  const lowScorePercentage = (lowScoreApplications / totalApplications) * 100;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Hiring Analytics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              {hiredCandidates} hired
            </p>
            <Progress value={hireRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              Across {mockJobs.length} open positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowScorePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Candidates below 50% match score
            </p>
            <Progress value={lowScorePercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications by Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={jobApplications}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
                <Bar 
                  dataKey="total" 
                  name="Total Applications" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="highScore" 
                  name="High Score (>80%)" 
                  fill="hsl(var(--primary)/0.5)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}