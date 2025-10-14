// src/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// We don't need getAnalytics for now, but you could add it back later if you want.

// This configuration object now securely reads the values from your .env.local file.
// The "NEXT_PUBLIC_" prefix is required by Next.js to expose these variables to the browser.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase robustly to prevent re-initialization on hot reloads.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get the Firebase services we need for our app.
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services so we can use them in other components.
export { app, auth, db };