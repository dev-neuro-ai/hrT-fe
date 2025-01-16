import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Send, Loader2 } from 'lucide-react';
import { createJob } from '@/lib/firebase/jobs';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface JobChatProps {
  onComplete: () => void;
}

export function JobChat({ onComplete }: JobChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m here to help you create a job description. Tell me about the role you\'re hiring for.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<{
    title?: string;
    department?: string;
    location?: string;
    type?: 'full-time' | 'part-time' | 'contract';
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
  }>({});

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real app, this would use an AI service to process the input
      // For now, we'll simulate the AI response
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Example: Extract job title from user input
      if (!jobData.title && input.toLowerCase().includes('hiring') && input.toLowerCase().includes('for')) {
        const title = input.split('for').pop()?.trim();
        if (title) {
          setJobData(prev => ({ ...prev, title }));
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I understand you\'re looking for a new role. Could you tell me more about:\n\n1. The seniority level\n2. Required skills and experience\n3. Main responsibilities\n4. Location and work arrangement (remote/hybrid/onsite)',
        },
      ]);

      // If we have enough information, create the job
      if (jobData.title && jobData.description && jobData.requirements?.length && jobData.responsibilities?.length) {
        const jobId = await createJob({
          title: jobData.title,
          department: jobData.department || 'General',
          location: jobData.location || 'Remote',
          type: jobData.type || 'full-time',
          description: jobData.description,
          requirements: jobData.requirements,
          responsibilities: jobData.responsibilities,
        });

        toast.success('Job created successfully');
        onComplete();
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
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
            placeholder="Describe the role you're hiring for..."
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
            <Button size="icon" variant="outline">
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}