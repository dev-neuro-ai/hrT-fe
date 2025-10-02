import { Candidate, JobCandidate } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mail, GraduationCap, Briefcase, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { updateCandidateScreeningStatus } from '@/lib/firebase/jobs';
import { getScreeningByJobAndCandidate } from '@/lib/firebase/screenings';
import { sendInterviewInvitation } from '@/lib/email';

interface JobCandidateCardProps {
  candidate: Candidate;
  jobId: string;
  jobTitle: string;
  matchScore: {
    score: number;
    analysis: {
      strengths: string[];
      gaps: string[];
      recommendation: string;
    };
  } | null;
  screeningStatus: JobCandidate | undefined;
  onScreeningScheduled: () => Promise<void>;
}

export function JobCandidateCard({ 
  candidate, 
  jobId,
  jobTitle, 
  matchScore,
  screeningStatus,
  onScreeningScheduled
}: JobCandidateCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screeningData, setScreeningData] = useState<any>(null);

  useEffect(() => {
    const loadScreeningData = async () => {
      if (screeningStatus?.screeningStatus === 'screening-complete') {
        try {
          const screening = await getScreeningByJobAndCandidate(jobId, candidate.id);
          if (screening) {
            setScreeningData(screening);
          }
        } catch (error) {
          console.error('Error loading screening data:', error);
        }
      }
    };

    loadScreeningData();
  }, [jobId, candidate.id, screeningStatus?.screeningStatus]);

  const handleScheduleInterview = async () => {
    setLoading(true);
    try {
      // First update the screening status
      await updateCandidateScreeningStatus(
        jobId,
        candidate.id,
        'screening-scheduled'
      );

      // Then send the interview invitation
      await sendInterviewInvitation({
        to: candidate.email,
        candidateName: candidate.name,
        jobTitle,
        jobId,
        candidateId: candidate.id
      });

      toast.success('Screening scheduled successfully');
      await onScreeningScheduled();
    } catch (error) {
      console.error('Error scheduling screening:', error);
      toast.error('Failed to schedule screening');
    } finally {
      setLoading(false);
    }
  };

  // Get the screening score from the score object
  const screeningScore = screeningData?.score?.score;
  const screeningAnalysis = screeningData?.score?.analysis;

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
            <div className="text-sm font-medium">
              {screeningStatus?.screeningStatus === 'pre-screening' && 'Pre-Screening'}
              {screeningStatus?.screeningStatus === 'screening-scheduled' && 'Screening Scheduled'}
              {screeningStatus?.screeningStatus === 'screening-complete' && 'Screening Complete'}
            </div>
            {screeningStatus?.screeningStatus === 'pre-screening' && (
              <Button 
                variant="outline"
                onClick={handleScheduleInterview}
                disabled={loading}
              >
                Schedule Screening
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="space-y-4">
            {matchScore && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Match Score</span>
                  <span className="text-sm text-muted-foreground">{matchScore.score}%</span>
                </div>
                <Progress value={matchScore.score} className="w-64" />
              </div>
            )}

            {screeningStatus?.screeningStatus === 'screening-complete' && typeof screeningScore === 'number' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Screening Score</span>
                  <span className="text-sm text-muted-foreground">{screeningScore}%</span>
                </div>
                <Progress value={screeningScore} className="w-64" />
              </div>
            )}
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
          </div>

          <div className="text-sm">
            <span className="font-medium">Skills: </span>
            {candidate.skills.join(', ')}
          </div>

          {(matchScore || (screeningScore && screeningAnalysis)) && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full justify-between"
              >
                Analysis
                <span className="text-xs text-muted-foreground">
                  {showAnalysis ? 'Hide' : 'Show'}
                </span>
              </Button>

              {showAnalysis && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  {matchScore && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Match Analysis</h4>
                        <div>
                          <h5 className="text-sm font-medium mb-1">Key Strengths</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {matchScore.analysis.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <ThumbsUp className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-green-500" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-1">Areas for Consideration</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {matchScore.analysis.gaps.map((gap, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <ThumbsDown className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-yellow-500" />
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}

                  {screeningScore && screeningAnalysis && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">Screening Analysis</h4>
                      <div>
                        <h5 className="text-sm font-medium mb-1">Strengths</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {screeningAnalysis.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start">
                              <ThumbsUp className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-green-500" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-3">
                        <h5 className="text-sm font-medium mb-1">Areas for Improvement</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {screeningAnalysis.weaknesses.map((weakness: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start">
                              <ThumbsDown className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-yellow-500" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-sm font-medium">Recommendation</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {screeningAnalysis.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}