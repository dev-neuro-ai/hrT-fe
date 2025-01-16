import { JobDescription } from '@/types';

export const mockJobs: JobDescription[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    description: 'We are looking for an experienced Frontend Developer to lead our web application development efforts. The ideal candidate will have strong expertise in React and TypeScript, with a focus on building scalable and maintainable applications.',
    requirements: [
      '5+ years React experience',
      'TypeScript expertise',
      'Experience with state management',
      'Strong CSS and responsive design skills'
    ],
    responsibilities: [
      'Lead frontend architecture',
      'Mentor junior developers',
      'Implement new features',
      'Optimize application performance'
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Product Manager',
    department: 'Product',
    location: 'New York, NY',
    type: 'full-time',
    description: 'Seeking a strategic Product Manager to drive our product vision and roadmap. The ideal candidate will have a strong background in product development, user research, and data-driven decision making.',
    requirements: [
      '3+ years PM experience',
      'Strong analytical skills',
      'Experience with agile methodologies',
      'Excellent communication skills'
    ],
    responsibilities: [
      'Define product strategy',
      'Work with stakeholders',
      'Prioritize feature development',
      'Analyze market trends'
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote',
    type: 'full-time',
    description: 'Looking for a skilled DevOps Engineer to improve our infrastructure and deployment processes. The ideal candidate will have experience with cloud platforms and containerization.',
    requirements: [
      'AWS certification',
      'Kubernetes expertise',
      'Infrastructure as Code experience',
      'Strong scripting skills'
    ],
    responsibilities: [
      'Manage cloud infrastructure',
      'Implement CI/CD pipelines',
      'Monitor system performance',
      'Improve deployment processes'
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];