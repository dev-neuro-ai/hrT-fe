import { useState } from 'react';
import { Candidate, JobApplication, JobDescription } from '@/types';
import { JobCandidateCard } from './job-candidate-card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface JobCandidatesListProps {
  jobId: string;
  job: JobDescription;
  candidates: Candidate[];
  applications: JobApplication[];
  loading?: boolean;
  onScreeningScheduled: () => Promise<void>;
}

export function JobCandidatesList({
  jobId,
  job,
  candidates,
  loading,
  onScreeningScheduled,
}: JobCandidatesListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sort candidates by match score
  const sortedCandidates = [...candidates].sort((a, b) => {
    const scoreA = job.matchScores?.[a.id]?.score || 0;
    const scoreB = job.matchScores?.[b.id]?.score || 0;
    return scoreB - scoreA;
  });

  const filteredCandidates = sortedCandidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.skills.some((skill) =>
        skill.toLowerCase().includes(search.toLowerCase())
      );

    const candidateStatus = job.candidates?.[candidate.id]?.screeningStatus || 'pre-screening';
    const matchesStatus = statusFilter === 'all' || candidateStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Candidates</h2>
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pre-screening">Pre-Screening</SelectItem>
              <SelectItem value="screening-scheduled">Screening Scheduled</SelectItem>
              <SelectItem value="screening-complete">Screening Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Calculating match scores...
          </div>
        ) : (
          filteredCandidates.map((candidate) => {
            const matchScore = job.matchScores?.[candidate.id];
            const screeningStatus = job.candidates?.[candidate.id];
            return (
              <JobCandidateCard
                key={candidate.id}
                candidate={candidate}
                jobId={jobId}
                jobTitle={job.title}
                matchScore={matchScore}
                screeningStatus={screeningStatus}
                onScreeningScheduled={onScreeningScheduled}
              />
            );
          })
        )}
      </div>
    </div>
  );
}