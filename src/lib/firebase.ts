import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCfsesCJC6cV8QBpuAv_Kq3vxVGWyWkKDc",
  authDomain: "betterhr-83ef5.firebaseapp.com",
  projectId: "betterhr-83ef5",
  storageBucket: "betterhr-83ef5.firebasestorage.app",
  messagingSenderId: "102398949013",
  appId: "1:102398949013:web:447c25b24d35becb458d9c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);