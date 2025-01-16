import { Candidate } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mail, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import { CandidateStatusBadge } from './candidate-status-badge';
import { toast } from 'sonner';
import { useState } from 'react';

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate: initialCandidate }: CandidateCardProps) {
  const [candidate, setCandidate] = useState(initialCandidate);

  const handleScheduleInterview = () => {
    // Update candidate status
    setCandidate(prev => ({
      ...prev,
      status: 'scheduled',
      interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Schedule for 1 week from now
    }));

    // Show success toast
    toast.success('Interview invitation sent', {
      description: `An email has been sent to ${candidate.name} to schedule the interview.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{candidate.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{candidate.email}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <CandidateStatusBadge status={candidate.status} />
            {candidate.status === 'pre-interview' && (
              <Button 
                variant="outline"
                onClick={handleScheduleInterview}
              >
                Schedule Interview
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Match Score</span>
              <span className="text-sm text-muted-foreground">{candidate.score}%</span>
            </div>
            <Progress value={candidate.score} className="w-64" />
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <Briefcase className="mr-1 h-4 w-4" />
              {candidate.experience} years
            </div>
            <div className="flex items-center">
              <GraduationCap className="mr-1 h-4 w-4" />
              {candidate.education}
            </div>
            {candidate.interviewDate && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                {candidate.interviewDate.toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="text-sm">
            <span className="font-medium">Skills: </span>
            {candidate.skills.join(', ')}
          </div>
          {candidate.interviewNotes && (
            <div className="text-sm">
              <span className="font-medium">Interview Notes: </span>
              {candidate.interviewNotes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}