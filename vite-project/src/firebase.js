// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDP6qEsSsrTU9A3eyOxZvvgeYkgIhkc9U",
  authDomain: "drag-library.firebaseapp.com",
  projectId: "drag-library",
  storageBucket: "drag-library.firebasestorage.app",
  messagingSenderId: "171959973052",
  appId: "1:171959973052:web:b9eb880cb19a6316e7ccb9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);