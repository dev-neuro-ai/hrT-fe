import { collection, addDoc, getDocs, doc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobApplication } from '@/types';

export async function getApplicationsForJob(jobId: string) {
  const applicationsRef = collection(db, 'applications');
  const q = query(applicationsRef, where('jobId', '==', jobId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    appliedAt: doc.data().appliedAt?.toDate(),
    lastUpdated: doc.data().lastUpdated?.toDate(),
  })) as JobApplication[];
}

export async function createApplication(application: Omit<JobApplication, 'id' | 'appliedAt' | 'lastUpdated'>) {
  const applicationsRef = collection(db, 'applications');
  const now = Timestamp.now();
  
  const docRef = await addDoc(applicationsRef, {
    ...application,
    appliedAt: now,
    lastUpdated: now,
  });
  
  return docRef.id;
}

export async function updateApplication(id: string, updates: Partial<JobApplication>) {
  const docRef = doc(db, 'applications', id);
  await updateDoc(docRef, {
    ...updates,
    lastUpdated: Timestamp.now(),
  });
}