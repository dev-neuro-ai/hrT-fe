import { Badge } from '@/components/ui/badge';

const statusConfig = {
  'pre-interview': { label: 'Pre-Interview', variant: 'secondary' },
  'scheduled': { label: 'Interview Scheduled', variant: 'warning' },
  'interviewed': { label: 'Post-Interview', variant: 'primary' },
  'hired': { label: 'Hired', variant: 'success' },
  'rejected': { label: 'Rejected', variant: 'destructive' },
} as const;

type CandidateStatus = keyof typeof statusConfig;

interface CandidateStatusBadgeProps {
  status: CandidateStatus;
}

export function CandidateStatusBadge({ status }: CandidateStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant as any}>
      {config.label}
    </Badge>
  );
}