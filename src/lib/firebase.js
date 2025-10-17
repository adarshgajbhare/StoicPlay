import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-L1KH2X9MPC"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Default Google provider (existing login)
export const provider = new GoogleAuthProvider();

// YouTube provider with additional scope for subscriptions
export const youtubeProvider = new GoogleAuthProvider();
youtubeProvider.addScope('https://www.googleapis.com/auth/youtube.readonly');
youtubeProvider.setCustomParameters({
  'prompt': 'consent',
  'access_type': 'offline'
});

export const db = getFirestore(app);