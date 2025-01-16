import { Candidate, JobCandidate } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mail, GraduationCap, Briefcase, Calendar, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { SendInterviewDialog } from './send-interview-dialog';
import { updateCandidateScreeningStatus } from '@/lib/firebase/jobs';
import { getScreeningByJobAndCandidate } from '@/lib/firebase/screenings';

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
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screeningData, setScreeningData] = useState<any>(null);

  // Load screening data when component mounts and when screening status changes
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

  const handleScheduleInterview = () => {
    setShowInterviewDialog(true);
  };

  const handleInterviewScheduled = async (date: Date, time: string) => {
    setLoading(true);
    try {
      await updateCandidateScreeningStatus(
        jobId,
        candidate.id,
        'screening-scheduled',
        date,
        time
      );
      toast.success('Interview scheduled successfully');
      setShowInterviewDialog(false);
      await onScreeningScheduled();
    } catch (error) {
      console.error('Error updating screening status:', error);
      toast.error('Failed to update screening status');
    } finally {
      setLoading(false);
    }
  };

  // Format time to include AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Get the screening score from the score object
  const screeningScore = screeningData?.score?.score;
  const screeningAnalysis = screeningData?.score?.analysis;

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

            {screeningStatus?.screeningStatus === 'screening-scheduled' && 
             screeningStatus.screeningDate && 
             screeningStatus.screeningTime && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                Screening scheduled for {format(screeningStatus.screeningDate, 'PPP')} at {formatTime(screeningStatus.screeningTime)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SendInterviewDialog
        open={showInterviewDialog}
        onOpenChange={setShowInterviewDialog}
        candidateName={candidate.name}
        candidateEmail={candidate.email}
        jobTitle={jobTitle}
        jobId={jobId}
        candidateId={candidate.id}
        onScheduled={handleInterviewScheduled}
      />
    </>
  );
}