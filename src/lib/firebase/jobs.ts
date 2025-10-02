import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { JobDescription, JobCandidate, ScreeningStatus } from '@/types';

export async function getJobs() {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get jobs');
  }

  const jobsRef = collection(db, 'jobs');
  // Query only jobs created by the current recruiter
  const recruiterQuery = query(
    jobsRef,
    where('recruiterId', '==', auth.currentUser.uid)
  );
  const snapshot = await getDocs(recruiterQuery);

  // Convert documents to job objects
  const jobs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    candidates: convertCandidateDates(doc.data().candidates),
  })) as JobDescription[];

  // Sort jobs by createdAt in descending order
  return jobs.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function createJob(
  job: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt' | 'recruiterId'>
) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to create jobs');
  }

  const jobsRef = collection(db, 'jobs');
  const now = Timestamp.now();

  const docRef = await addDoc(jobsRef, {
    ...job,
    candidates: {},
    matchScores: {},
    createdAt: now,
    updatedAt: now,
    recruiterId: auth.currentUser.uid, // Add recruiter ID when creating job
  });

  return docRef.id;
}

export async function getJob(id: string) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get job details');
  }

  const docRef = doc(db, 'jobs', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Job not found');
  }

  const data = docSnap.data();
  // Check if the job belongs to the current recruiter
  if (data.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot access job created by another recruiter');
  }

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    candidates: convertCandidateDates(data.candidates),
  } as JobDescription;
}

export async function updateJob(id: string, updates: Partial<JobDescription>) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to update jobs');
  }

  // First check if the job belongs to the current recruiter
  const jobDoc = await getDoc(doc(db, 'jobs', id));
  if (!jobDoc.exists()) {
    throw new Error('Job not found');
  }

  const jobData = jobDoc.data();
  if (jobData.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot update job created by another recruiter');
  }

  const docRef = doc(db, 'jobs', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function updateJobMatchScores(
  jobId: string,
  matchScores: Record<string, any>
) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to update match scores');
  }

  // First check if the job belongs to the current recruiter
  const jobDoc = await getDoc(doc(db, 'jobs', jobId));
  if (!jobDoc.exists()) {
    throw new Error('Job not found');
  }

  const jobData = jobDoc.data();
  if (jobData.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot update match scores for job created by another recruiter');
  }

  const docRef = doc(db, 'jobs', jobId);
  await updateDoc(docRef, {
    matchScores,
    matchScoresUpdatedAt: Timestamp.now(),
  });
}

export async function getJobMatchScores(jobId: string) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get match scores');
  }

  const docRef = doc(db, 'jobs', jobId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Job not found');
  }

  const jobData = docSnap.data();
  if (jobData.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot access match scores for job created by another recruiter');
  }

  return jobData.matchScores || {};
}

export async function updateCandidateScreeningStatus(
  jobId: string,
  candidateId: string,
  status: ScreeningStatus
) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to update screening status');
  }

  const docRef = doc(db, 'jobs', jobId);
  const jobDoc = await getDoc(docRef);

  if (!jobDoc.exists()) {
    throw new Error('Job not found');
  }

  const jobData = jobDoc.data();
  if (jobData.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot update screening status for job created by another recruiter');
  }

  const candidates = jobData.candidates || {};
  candidates[candidateId] = {
    candidateId,
    screeningStatus: status,
  };

  await updateDoc(docRef, {
    candidates,
    updatedAt: Timestamp.now(),
  });
}

export async function getCandidateScreeningStatus(
  jobId: string,
  candidateId: string
): Promise<JobCandidate | null> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get screening status');
  }

  const docRef = doc(db, 'jobs', jobId);
  const jobDoc = await getDoc(docRef);

  if (!jobDoc.exists()) {
    return null;
  }

  const jobData = jobDoc.data();
  if (jobData.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot access screening status for job created by another recruiter');
  }

  const candidates = jobData.candidates || {};
  const candidate = candidates[candidateId];

  if (!candidate) {
    return null;
  }

  return {
    candidateId: candidate.candidateId,
    screeningStatus: candidate.screeningStatus,
  };
}

// Helper function to convert Firestore Timestamps to Dates in candidates object
function convertCandidateDates(candidates: Record<string, any> | undefined) {
  if (!candidates) return {};
  
  const converted: Record<string, any> = {};
  for (const [id, candidate] of Object.entries(candidates)) {
    converted[id] = {
      candidateId: candidate.candidateId,
      screeningStatus: candidate.screeningStatus,
    };
  }
  return converted;
}