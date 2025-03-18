import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDxsCHuhTxRH1pqAgjYzi1S4v7YV9_axyA",
  authDomain: "newproject-b6b63.firebaseapp.com",
  projectId: "newproject-b6b63",
  storageBucket: "newproject-b6b63.firebasestorage.app",
  messagingSenderId: "642988102741",
  appId: "1:642988102741:web:764d309f8ccf6c98ca30dc",
  measurementId: "G-HRMHG7SG84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };