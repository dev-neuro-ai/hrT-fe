import { JobDescription } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface JobCardProps {
  job: JobDescription;
}

export function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{job.title}</CardTitle>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Building2 className="mr-1 h-4 w-4 text-foreground" />
                {job.department}
              </div>
              <div className="flex items-center">
                <MapPin className="mr-1 h-4 w-4 text-foreground" />
                {job.location}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4 text-foreground" />
                {job.type}
              </div>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate(`/dashboard/jobs/${job.id}/candidates`)}
          >
            View Candidates
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
        <div className="flex flex-wrap gap-2">
          {job.requirements.map((req, index) => (
            <Badge key={index} variant="secondary">{req}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}