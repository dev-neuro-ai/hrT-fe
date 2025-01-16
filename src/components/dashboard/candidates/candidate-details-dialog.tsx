import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Candidate } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mail, GraduationCap, Briefcase, FileText } from 'lucide-react';
import { CandidateStatusBadge } from './candidate-status-badge';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CandidateDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
}

interface CandidateAnalysis {
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  fitScore: number;
  recommendations: string[];
}

export function CandidateDetailsDialog({ 
  open, 
  onOpenChange,
  candidate 
}: CandidateDetailsDialogProps) {
  const [analysis, setAnalysis] = useState<CandidateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      // Simulate API call to get analysis
      // In a real app, this would call your OpenAI endpoint
      setTimeout(() => {
        setAnalysis({
          summary: "Experienced professional with a strong background in their field. Shows good potential for growth and leadership.",
          strengths: [
            "Strong technical expertise",
            "Proven track record",
            "Leadership potential"
          ],
          areasForImprovement: [
            "Could benefit from more industry certifications",
            "Consider expanding cross-functional experience"
          ],
          fitScore: 85,
          recommendations: [
            "Schedule technical interview",
            "Assess team fit",
            "Verify project experience"
          ]
        });
        setLoading(false);
      }, 1500);
    } else {
      setLoading(true);
      setAnalysis(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Profile</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{candidate.name}</h3>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{candidate.email}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <CandidateStatusBadge status={candidate.status} />
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Resume
                    </a>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{candidate.experience} years experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>{candidate.education}</span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <div 
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
              
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  {/* Fit Score */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Overall Fit Score</span>
                      <span>{analysis.fitScore}%</span>
                    </div>
                    <Progress value={analysis.fitScore} />
                  </div>

                  {/* Summary */}
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-muted-foreground">{analysis.summary}</p>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h4 className="font-medium mb-2">Key Strengths</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-muted-foreground">{strength}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div>
                    <h4 className="font-medium mb-2">Areas for Development</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.areasForImprovement.map((area, index) => (
                        <li key={index} className="text-muted-foreground">{area}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-2">Next Steps</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-muted-foreground">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}