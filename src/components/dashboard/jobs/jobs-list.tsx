import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { JobCard } from './job-card';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '@/lib/firebase/jobs';
import { JobDescription } from '@/types';

export function JobsList() {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsData = await getJobs();
        setJobs(jobsData);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Listings</h2>
        <Button onClick={() => navigate('/dashboard/jobs/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}