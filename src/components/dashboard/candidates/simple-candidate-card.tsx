import { Candidate } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, GraduationCap, Briefcase, FileText } from 'lucide-react';
import { useState } from 'react';
import { CandidateDetailsDialog } from './candidate-details-dialog';

interface SimpleCandidateCardProps {
  candidate: Candidate;
}

export function SimpleCandidateCard({ candidate }: SimpleCandidateCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
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
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-1" />
                  Resume
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDetailsOpen(true)}>
                View Details
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Briefcase className="mr-1 h-4 w-4" />
                {candidate.experience} years
              </div>
              <div className="flex items-center">
                <GraduationCap className="mr-1 h-4 w-4" />
                {candidate.education}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium">Skills: </span>
              {candidate.skills.join(', ')}
            </div>
          </div>
        </CardContent>
      </Card>

      <CandidateDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        candidate={candidate}
      />
    </>
  );
}