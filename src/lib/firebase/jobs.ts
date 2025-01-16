import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobDescription, JobCandidate, ScreeningStatus } from '@/types';

export async function getJobs() {
  const jobsRef = collection(db, 'jobs');
  const q = query(jobsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    candidates: convertCandidateDates(doc.data().candidates),
  })) as JobDescription[];
}

export async function createJob(
  job: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>
) {
  const jobsRef = collection(db, 'jobs');
  const now = Timestamp.now();

  const docRef = await addDoc(jobsRef, {
    ...job,
    candidates: {},
    matchScores: {},
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function getJob(id: string) {
  const docRef = doc(db, 'jobs', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Job not found');
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    candidates: convertCandidateDates(data.candidates),
  } as JobDescription;
}

export async function updateJob(id: string, updates: Partial<JobDescription>) {
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
  const docRef = doc(db, 'jobs', jobId);
  await updateDoc(docRef, {
    matchScores,
    matchScoresUpdatedAt: Timestamp.now(),
  });
}

export async function getJobMatchScores(jobId: string) {
  const docRef = doc(db, 'jobs', jobId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Job not found');
  }

  return docSnap.data().matchScores || {};
}

export async function updateCandidateScreeningStatus(
  jobId: string,
  candidateId: string,
  status: ScreeningStatus,
  screeningDate?: Date,
  screeningTime?: string
) {
  const docRef = doc(db, 'jobs', jobId);
  const jobDoc = await getDoc(docRef);

  if (!jobDoc.exists()) {
    throw new Error('Job not found');
  }

  const candidates = jobDoc.data().candidates || {};
  candidates[candidateId] = {
    candidateId,
    screeningStatus: status,
    screeningDate: screeningDate ? Timestamp.fromDate(screeningDate) : null,
    screeningTime,
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
  const docRef = doc(db, 'jobs', jobId);
  const jobDoc = await getDoc(docRef);

  if (!jobDoc.exists()) {
    return null;
  }

  const candidates = jobDoc.data().candidates || {};
  const candidate = candidates[candidateId];

  if (!candidate) {
    return null;
  }

  return {
    ...candidate,
    screeningDate: candidate.screeningDate?.toDate(),
  };
}

// Helper function to convert Firestore Timestamps to Dates in candidates object
function convertCandidateDates(candidates: Record<string, any> | undefined) {
  if (!candidates) return {};
  
  const converted: Record<string, any> = {};
  for (const [id, candidate] of Object.entries(candidates)) {
    converted[id] = {
      ...candidate,
      screeningDate: candidate.screeningDate?.toDate() || null
    };
  }
  return converted;
}