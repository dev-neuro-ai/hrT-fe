import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sendInterviewInvitation } from '@/lib/email';
import { toast } from 'sonner';

interface SendInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: string;
  candidateId: string;
  onScheduled: (date: Date, time: string) => void;
}

export function SendInterviewDialog({ 
  open, 
  onOpenChange,
  candidateName,
  candidateEmail,
  jobTitle,
  jobId,
  candidateId,
  onScheduled
}: SendInterviewDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    `Dear ${candidateName},\n\nWe would like to invite you for an interview.`
  );

  const handleSend = async () => {
    if (!date || !time) {
      toast.error('Please select both date and time');
      return;
    }

    setLoading(true);

    try {
      await sendInterviewInvitation({
        to: candidateEmail,
        candidateName,
        jobTitle,
        interviewDate: date,
        interviewTime: time,
        additionalNotes: message,
        jobId,
        candidateId
      });

      await onScheduled(date, time);
      toast.success('Interview invitation sent successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending interview invitation:', error);
      toast.error('Failed to send interview invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>To</Label>
            <Input value={candidateEmail} disabled />
          </div>
          
          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!date || !time || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}