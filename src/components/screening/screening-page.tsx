import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { RetellWebClient } from 'retell-client-js-sdk';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  Phone,
  PhoneOff,
  Activity,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { getScreening } from '@/lib/firebase/screenings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import appConfig from '@/config/app.config.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || appConfig.backendUrl;

export function ScreeningPage() {
  const { screeningId } = useParams<{ screeningId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallEnding, setIsCallEnding] = useState(false);
  const [screening, setScreening] = useState<any>(null);
  const webClientRef = useRef<RetellWebClient | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (webClientRef.current) {
      try {
        webClientRef.current.stopCall();
      } catch (error) {
        console.error('Error in stopCall:', error);
      }
      webClientRef.current = null;
    }
    setIsCallActive(false);
    setCallDuration(0);
  };

  useEffect(() => {
    const loadScreening = async () => {
      try {
        if (!screeningId) {
          throw new Error('No screening ID provided');
        }

        const screeningData = await getScreening(screeningId);
        if (!screeningData) {
          throw new Error('Screening not found');
        }

        setScreening(screeningData);

        // If screening is already completed, show error
        if (screeningData.status === 'completed') {
          setError('This screening interview has already been completed.');
        }
      } catch (err) {
        console.error('Error loading screening:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadScreening();

    return () => {
      cleanupCall();
    };
  }, [screeningId]);

  const setupAudioAnalyser = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        // Audio level processing removed as it's not used
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analyser:', error);
      toast.error('Failed to access microphone');
      throw error;
    }
  };

  const startCall = async () => {
    // Prevent starting if screening is completed
    if (screening?.status === 'completed') {
      toast.error('This screening has already been completed');
      return;
    }

    try {
      setLoading(true);
      await setupAudioAnalyser();

      const response = await fetch(
        `${BACKEND_URL}/api/start-web-call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: screening.agentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const { accessToken } = await response.json();

      webClientRef.current = new RetellWebClient();
      await webClientRef.current.startCall({
        accessToken,
        captureDeviceId: 'default',
        playbackDeviceId: 'default',
        sampleRate: 16000,
      });

      setIsCallActive(true);
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      toast.success('Call started successfully');
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Failed to start call');
      cleanupCall();
    } finally {
      setLoading(false);
    }
  };

  const stopCall = async () => {
    if (!webClientRef.current || isCallEnding) return;

    try {
      setIsCallEnding(true);
      cleanupCall();

      // Save analytics after call ends
      if (screeningId) {
        const analyticsResponse = await fetch(
          `${BACKEND_URL}/api/save-analytics`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              screeningId,
            }),
          }
        );

        if (!analyticsResponse.ok) {
          throw new Error('Failed to save analytics');
        }

        toast.success('Interview completed successfully');

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error('Error stopping call:', err);
      toast.error('Failed to end interview');
      cleanupCall();
    } finally {
      setIsCallEnding(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  if (loading && !isCallActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 p-6 bg-white shadow-md rounded-md">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-lg font-medium">Preparing Your Interview</p>
            <p className="text-sm text-muted-foreground">
              Setting up AI interviewer...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show completed state if screening is completed
  if (screening?.status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-6 w-full max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-green-600">
              Interview Completed
            </h1>
            <p className="text-sm text-muted-foreground">
              This screening interview has already been completed. Thank you for
              your participation.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-6 w-full max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <PhoneOff className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-destructive">
              Interview Setup Failed
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card
        className={cn(
          'w-full max-w-md relative p-6 shadow-md',
          isCallActive ? 'shadow-primary/30' : ''
        )}
      >
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              AI Screening Interview
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isCallActive
                ? 'Your interview is in progress'
                : 'Ready to start your interview'}
            </p>
          </div>

          {/* Call Status and Controls */}
          <div className="flex flex-col items-center gap-6">
            {isCallActive && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <Activity className="h-5 w-5 text-primary" />
                <span className="tabular-nums">
                  {formatDuration(callDuration)}
                </span>
              </div>
            )}

            <Button
              size="lg"
              className={cn(
                'w-28 h-28 rounded-full relative group transition-all duration-300',
                isCallActive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-primary hover:bg-primary/90',
                (loading || isCallEnding) && 'opacity-50 cursor-not-allowed'
              )}
              onClick={isCallActive ? stopCall : startCall}
              disabled={loading || isCallEnding}
            >
              {loading || isCallEnding ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : isCallActive ? (
                <PhoneOff className="h-10 w-10" />
              ) : (
                <Phone className="h-10 w-10" />
              )}
            </Button>

            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Connecting...'
                : isCallEnding
                ? 'Ending call...'
                : isCallActive
                ? 'Click to end interview'
                : 'Click to start your interview'}
            </p>
          </div>

          {/* Tips Section */}
          <div
            className={cn(
              'text-sm',
              isCallActive ? 'opacity-60' : 'opacity-100'
            )}
          >
            <div className="flex items-center gap-2 mb-2 font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Tips for a Great Interview</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {[
                'Find a quiet place with good internet connection',
                'Speak clearly and at a normal pace',
                'Answer questions thoroughly but concisely',
                'Take your time to think before answering',
              ].map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}