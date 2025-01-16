import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { JobCandidatesList } from './job-candidates-list';
import { JobDescription, Candidate, JobApplication, ScreeningStatus } from '@/types';
import { getJob, getJobMatchScores, updateJobMatchScores, updateJob } from '@/lib/firebase/jobs';
import { getCandidates } from '@/lib/firebase/candidates';
import { getApplicationsForJob } from '@/lib/firebase/applications';
import { calculateMatchScore } from '@/lib/openai/matching';
import { toast } from 'sonner';

export function JobCandidatesPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobDescription | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingMatches, setProcessingMatches] = useState(false);

  const loadData = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      
      // Load job, candidates, and existing applications
      const [jobData, candidatesData, applicationsData] = await Promise.all([
        getJob(jobId),
        getCandidates(),
        getApplicationsForJob(jobId)
      ]);

      setJob(jobData);
      setCandidates(candidatesData);
      setApplications(applicationsData);

      // Initialize screening status for new candidates
      const updatedJob = { ...jobData };
      let needsUpdate = false;

      candidatesData.forEach(candidate => {
        if (!updatedJob.candidates?.[candidate.id]) {
          if (!updatedJob.candidates) {
            updatedJob.candidates = {};
          }
          updatedJob.candidates[candidate.id] = {
            candidateId: candidate.id,
            screeningStatus: 'pre-screening' as ScreeningStatus
          };
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        await updateJob(jobId, updatedJob);
        setJob(updatedJob);
      }

      // Get existing match scores
      const existingMatchScores = await getJobMatchScores(jobId);
      
      // Find candidates without match scores
      const candidatesNeedingScores = candidatesData.filter(
        candidate => !existingMatchScores[candidate.id]
      );

      if (candidatesNeedingScores.length > 0) {
        setProcessingMatches(true);
        toast.info(`Calculating match scores for ${candidatesNeedingScores.length} new candidates...`);

        // Calculate match scores for new candidates
        const newScores = { ...existingMatchScores };
        
        for (const candidate of candidatesNeedingScores) {
          try {
            const matchResult = await calculateMatchScore(candidate, jobData);
            newScores[candidate.id] = matchResult;
          } catch (error) {
            console.error(`Error calculating match score for candidate ${candidate.id}:`, error);
          }
        }

        // Update job with new match scores
        await updateJobMatchScores(jobId, newScores);
        toast.success('Match scores updated');
        
        // Reload job data to get updated match scores
        const updatedJobData = await getJob(jobId);
        setJob(updatedJobData);
        
        setProcessingMatches(false);
      }

    } catch (error) {
      console.error('Error loading job candidates data:', error);
      toast.error('Error loading candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  const handleScreeningScheduled = async () => {
    await loadData();
  };

  if (loading || !job) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="text-muted-foreground mt-2">
          Candidates for this position
          {processingMatches && ' (Calculating match scores...)'}
        </p>
      </div>
      <JobCandidatesList 
        jobId={jobId!}
        job={job}
        candidates={candidates}
        applications={applications}
        loading={processingMatches}
        onScreeningScheduled={handleScreeningScheduled}
      />
    </div>
  );
}