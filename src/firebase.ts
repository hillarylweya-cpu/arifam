import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  "projectId": "gen-lang-client-0943374163",
  "appId": "1:65696568398:web:0b2d2f3ef317bb87925f1f",
  "apiKey": "AIzaSyBKGe214xCRCY4G4ehmMgtb97MB1gWHwik",
  "authDomain": "gen-lang-client-0943374163.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-f7d9d926-d798-41ed-ab89-4331acf9670d",
  "storageBucket": "gen-lang-client-0943374163.firebasestorage.app",
  "messagingSenderId": "65696568398",
  "measurementId": ""
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
