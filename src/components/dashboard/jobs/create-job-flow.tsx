import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { createThread, sendMessage, generateJobDescription } from '@/lib/openai/assistant';
import { createJob } from '@/lib/firebase/jobs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function CreateJobFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'chat' | 'questions'>('chat');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mandatoryQuestions, setMandatoryQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  // Initialize chat thread
  const initializeChat = async () => {
    if (!threadId) {
      const id = await createThread();
      setThreadId(id);
      // Add initial message from assistant
      const response = await sendMessage(id, "Hi! I'm here to help you create a job description. What role are you hiring for?");
      setMessages([{ role: 'assistant', content: response }]);
    }
  };

  useEffect(() => {
    initializeChat();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !threadId) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(threadId, input);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const addMandatoryQuestion = () => {
    if (newQuestion.trim()) {
      setMandatoryQuestions(prev => [...prev, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const removeMandatoryQuestion = (index: number) => {
    setMandatoryQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    setIsLoading(true);

    try {
      // Convert messages to conversation transcript
      const conversation = messages.map(m => `${m.role}: ${m.content}`);

      // Generate job description and interview prompt
      const result = await generateJobDescription(conversation, mandatoryQuestions);

      // Create job in Firebase
      await createJob({
        ...result.jobDescription,
        interviewPrompt: result.interviewPrompt,
      });

      toast.success('Job created successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {step === 'chat' ? (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('questions')}
                  disabled={isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Mandatory Interview Questions</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="question">Add Question</Label>
                  <Input
                    id="question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter a mandatory interview question"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMandatoryQuestion();
                      }
                    }}
                  />
                </div>
                <Button
                  className="mt-8"
                  onClick={addMandatoryQuestion}
                  disabled={!newQuestion.trim()}
                >
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {mandatoryQuestions.map((question, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded-md">
                      {question}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMandatoryQuestion(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('chat')}>
              Back
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading || mandatoryQuestions.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}