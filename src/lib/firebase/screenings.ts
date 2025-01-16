import { collection, getDocs, getDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Screening } from '@/types';

export async function getScreening(id: string): Promise<Screening | null> {
  const docRef = doc(db, 'screenings', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt.toDate()
  } as Screening;
}

export async function getScreeningByJobAndCandidate(jobId: string, candidateId: string): Promise<Screening | null> {
  const screeningsRef = collection(db, 'screenings');
  const q = query(
    screeningsRef,
    where('jobId', '==', jobId),
    where('candidateId', '==', candidateId)
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