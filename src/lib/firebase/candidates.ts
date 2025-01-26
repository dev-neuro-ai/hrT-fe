import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { Candidate } from '@/types';

export async function getCandidates() {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get candidates');
  }

  const candidatesRef = collection(db, 'candidates');
  
  // First get candidates for the current recruiter
  const recruiterQuery = query(
    candidatesRef,
    where('recruiterId', '==', auth.currentUser.uid)
  );
  const snapshot = await getDocs(recruiterQuery);
  
  // Convert the documents to candidate objects
  const candidates = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    interviewDate: doc.data().interviewDate?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Candidate[];

  // Sort the candidates by createdAt in descending order
  return candidates.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
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
    recruiterId: auth.currentUser.uid, // Store the recruiter ID who created the candidate
  });
  
  return docRef.id;
}

export async function updateCandidate(id: string, updates: Partial<Candidate>) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to update candidates');
  }

  // First check if the candidate belongs to the current recruiter
  const candidateDoc = await getDoc(doc(db, 'candidates', id));
  if (!candidateDoc.exists()) {
    throw new Error('Candidate not found');
  }

  const candidateData = candidateDoc.data();
  if (candidateData.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot update candidate created by another recruiter');
  }

  const docRef = doc(db, 'candidates', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function getCandidate(id: string) {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to get candidate details');
  }

  const docRef = doc(db, 'candidates', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Candidate not found');
  }

  const data = docSnap.data();
  // Check if the candidate belongs to the current recruiter
  if (data.recruiterId !== auth.currentUser.uid) {
    throw new Error('Unauthorized: Cannot access candidate created by another recruiter');
  }
  
  return {
    id: docSnap.id,
    ...data,
    interviewDate: data.interviewDate?.toDate(),
  } as Candidate;
}