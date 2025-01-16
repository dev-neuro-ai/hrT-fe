import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { Candidate } from '@/types';

export async function getCandidates() {
  const candidatesRef = collection(db, 'candidates');
  const q = query(candidatesRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    interviewDate: doc.data().interviewDate?.toDate(),
  })) as Candidate[];
}

export async function createCandidate(candidate: Omit<Candidate, 'id'>, resumeFile?: File) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to create candidates');
  }

  const candidatesRef = collection(db, 'candidates');
  let resumeUrl = '';
  
  if (resumeFile) {
    // Upload resume to Firebase Storage under the user's directory
    const userId = auth.currentUser.uid;
    const timestamp = Date.now();
    const safeFileName = resumeFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `resumes/${userId}/${timestamp}_${safeFileName}`;
    const storageRef = ref(storage, storagePath);
    
    try {
      await uploadBytes(storageRef, resumeFile);
      resumeUrl = await getDownloadURL(storageRef);
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error('Permission denied: Unable to upload resume. Please try again.');
      }
      throw new Error('Failed to upload resume');
    }
  }
  
  const docRef = await addDoc(candidatesRef, {
    ...candidate,
    resumeUrl,
    createdAt: Timestamp.now(),
    userId: auth.currentUser.uid, // Store the user ID who created the candidate
  });
  
  return docRef.id;
}

export async function updateCandidate(id: string, updates: Partial<Candidate>) {
  const docRef = doc(db, 'candidates', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function getCandidate(id: string) {
  const docRef = doc(db, 'candidates', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Candidate not found');
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
    interviewDate: docSnap.data().interviewDate?.toDate(),
  } as Candidate;
}