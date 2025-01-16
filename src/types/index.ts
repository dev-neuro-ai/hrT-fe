// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'recruiter' | 'admin';
}

// Candidate types
export type CandidateStatus = 'pre-interview' | 'scheduled' | 'interviewed' | 'hired' | 'rejected';
export type ScreeningStatus = 'pre-screening' | 'screening-scheduled' | 'screening-complete';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeUrl: string;
  score: number | null;
  status: CandidateStatus;
  skills: string[];
  experience: number;
  education: string;
  interviewDate?: Date;
  interviewNotes?: string;
}

export interface JobCandidate {
  candidateId: string;
  screeningStatus: ScreeningStatus;
  screeningDate?: Date;
  screeningTime?: string;
}

// Job types
export interface JobDescription {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  description: string;
  requirements: string[];
  responsibilities: string[];
  interviewPrompt?: {
    introduction: string;
    mandatoryQuestions: string[];
    suggestedQuestions: string[];
    evaluationCriteria: string[];
  };
  candidates?: Record<string, JobCandidate>;
  matchScores?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Application types
export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'rejected';
  score: number;
  appliedAt: Date;
  lastUpdated: Date;
}
export interface Screening {
  id: string;
  jobId: string;
  candidateId: string;
  llmId: string;
  agentId: string;
  prompt: string;
  createdAt: Date;
  status: 'pending' | 'completed';
}

export interface SendInterviewInvitationParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: Date;
  interviewTime: string;
  additionalNotes?: string;
  jobId: string;
  candidateId: string;
}