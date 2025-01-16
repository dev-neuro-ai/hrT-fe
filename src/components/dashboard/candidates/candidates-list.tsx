import { useState, useEffect } from 'react';
import { SimpleCandidateCard } from './simple-candidate-card';
import { Input } from '@/components/ui/input';
import { Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadResumesDialog } from './upload-resumes-dialog';
import { getCandidates } from '@/lib/firebase/candidates';
import { Candidate } from '@/types';

export function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCandidates = async () => {
    try {
      const candidatesData = await getCandidates();
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase()));
    
    return matchesSearch;
  });

  const handleUploadComplete = () => {
    loadCandidates();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Candidate Pool</h2>
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Resumes
          </Button>
        </div>
      </div>
      <div className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <SimpleCandidateCard
            key={candidate.id}
            candidate={candidate}
            onViewDetails={() => {}} // TODO: Implement view details
          />
        ))}
      </div>

      <UploadResumesDialog 
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}