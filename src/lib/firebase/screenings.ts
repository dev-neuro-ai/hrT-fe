import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Screening } from '@/types';

export async function getScreening(id: string): Promise<Screening | null> {
  const docRef = doc(db, 'screenings', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  // For screenings, we allow access without authentication check since candidates
  // need to access their screening sessions. However, we'll add authorization
  // checks in the components that display sensitive screening data.

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt.toDate()
  } as Screening;
}

export async function getScreeningByJobAndCandidate(jobId: string, candidateId: string): Promise<Screening | null> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get screening details');
  }

  const screeningsRef = collection(db, 'screenings');
  const q = query(
    screeningsRef,
    where('jobId', '==', jobId),
    where('candidateId', '==', candidateId),
    where('recruiterId', '==', auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }

  // Get the most recent screening if there are multiple
  const screeningDoc = snapshot.docs[0];
  const data = screeningDoc.data();

  return {
    id: screeningDoc.id,
    ...data,
    createdAt: data.createdAt.toDate()
  } as Screening;
}

export async function getScreeningsForRecruiter(): Promise<Screening[]> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get screenings');
  }

  const screeningsRef = collection(db, 'screenings');
  const q = query(
    screeningsRef,
    where('recruiterId', '==', auth.currentUser.uid),
    where('status', '==', 'completed')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate()
  })) as Screening[];
}

export async function getScreeningsForJob(jobId: string): Promise<Screening[]> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get job screenings');
  }

  const screeningsRef = collection(db, 'screenings');
  const q = query(
    screeningsRef,
    where('jobId', '==', jobId),
    where('recruiterId', '==', auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate()
  })) as Screening[];
}