import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Label,
  Cell,
} from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface ScreeningData {
  id: string;
  jobId: string;
  candidateId: string;
  recruiterId: string;
  createdAt: Date;
  status: string;
  score?: {
    score: number;
    analysis: {
      strengths: string[];
      weaknesses: string[];
      recommendation: string;
    };
  };
}

interface JobData {
  id: string;
  title: string;
}

export function ScreeningAnalytics() {
  const [screenings, setScreenings] = useState<ScreeningData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!auth.currentUser) {
          throw new Error('User must be authenticated');
        }

        // Load jobs for the current recruiter
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(
          jobsRef,
          where('recruiterId', '==', auth.currentUser.uid)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsData = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
        }));
        setJobs(jobsData);

        // Load completed screenings for the current recruiter
        const screeningsRef = collection(db, 'screenings');
        const screeningsQuery = query(
          screeningsRef,
          where('status', '==', 'completed'),
          where('recruiterId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(screeningsQuery);
        
        const screeningsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as ScreeningData[];

        setScreenings(screeningsData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter screenings based on selected job
  const filteredScreenings = selectedJob === 'all'
    ? screenings
    : screenings.filter(s => s.jobId === selectedJob);

  // Calculate analytics data
  const totalScreenings = filteredScreenings.length;
  const completedWithScore = filteredScreenings.filter(s => s.score?.score).length;
  const averageScore = filteredScreenings.reduce((acc, s) => acc + (s.score?.score || 0), 0) / completedWithScore || 0;
  const passRate = (filteredScreenings.filter(s => (s.score?.score || 0) >= 70).length / completedWithScore) * 100;

  // Prepare data for score trends chart
  const scoreTrendData = filteredScreenings
    .filter(s => s.score?.score)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(s => ({
      date: format(s.createdAt, 'MMM d'),
      score: s.score?.score || 0,
    }));

  // Prepare data for score distribution
  const scoreDistributionData = [
    { range: '90-100', count: filteredScreenings.filter(s => (s.score?.score || 0) >= 90).length },
    { range: '80-89', count: filteredScreenings.filter(s => (s.score?.score || 0) >= 80 && (s.score?.score || 0) < 90).length },
    { range: '70-79', count: filteredScreenings.filter(s => (s.score?.score || 0) >= 70 && (s.score?.score || 0) < 80).length },
    { range: '60-69', count: filteredScreenings.filter(s => (s.score?.score || 0) >= 60 && (s.score?.score || 0) < 70).length },
    { range: '< 60', count: filteredScreenings.filter(s => (s.score?.score || 0) < 60).length },
  ];

  const scoreColors = [
    'hsl(var(--success))',
    'hsl(var(--primary))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--muted-foreground))',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Screening Analytics</h2>
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScreenings}</div>
            <p className="text-xs text-muted-foreground">
              {completedWithScore} with scores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
            <Progress value={averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(passRate)}%</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 70%
            </p>
            <Progress value={passRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  >
                    <Label 
                      value="Score (%)" 
                      angle={-90} 
                      position="insideLeft"
                      style={{ fontSize: '12px', fill: 'hsl(var(--foreground))' }}
                    />
                  </YAxis>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scoreDistributionData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number">
                    <Label 
                      value="Number of Candidates" 
                      position="insideBottom" 
                      offset={-5}
                      style={{ fontSize: '12px', fill: 'hsl(var(--foreground))' }}
                    />
                  </XAxis>
                  <YAxis 
                    dataKey="range" 
                    type="category"
                    width={60}
                    tick={{ fontSize: 12 }}
                  >
                    <Label 
                      value="Score Range (%)" 
                      angle={-90} 
                      position="insideLeft" 
                      dx={-15}
                      dy={40}
                      style={{ 
                        fontSize: '12px', 
                        fill: 'hsl(var(--foreground))'
                      }}
                    />
                  </YAxis>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} candidates`, 'Count']}
                  />
                  <Bar 
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                  >
                    {scoreDistributionData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={scoreColors[index]}
                        opacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}