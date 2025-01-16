import { JobApplication } from '@/types';

export const mockJobApplications: JobApplication[] = [
  // Frontend Developer Applications
  {
    id: '1',
    jobId: '1',
    candidateId: '1',
    status: 'reviewing',
    score: 85,
    appliedAt: new Date('2024-03-01'),
    lastUpdated: new Date('2024-03-01'),
  },
  {
    id: '2',
    jobId: '1',
    candidateId: '4',
    status: 'shortlisted',
    score: 78,
    appliedAt: new Date('2024-03-02'),
    lastUpdated: new Date('2024-03-02'),
  },
  {
    id: '3',
    jobId: '1',
    candidateId: '5',
    status: 'new',
    score: 72,
    appliedAt: new Date('2024-03-03'),
    lastUpdated: new Date('2024-03-03'),
  },

  // Product Manager Applications
  {
    id: '4',
    jobId: '2',
    candidateId: '2',
    status: 'shortlisted',
    score: 92,
    appliedAt: new Date('2024-03-01'),
    lastUpdated: new Date('2024-03-02'),
  },
  {
    id: '5',
    jobId: '2',
    candidateId: '3',
    status: 'reviewing',
    score: 68,
    appliedAt: new Date('2024-03-02'),
    lastUpdated: new Date('2024-03-02'),
  },
];