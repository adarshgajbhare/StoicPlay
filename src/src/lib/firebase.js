import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyB1F3ct8HYCSr4wBlLM-_6ow_hVMqNw4I4",
  authDomain: "feed-8aeca.firebaseapp.com",
  projectId: "feed-8aeca",
  storageBucket: "feed-8aeca.appspot.com",
  messagingSenderId: "1001794915344",
  appId: "1:1001794915344:web:d10fd81eae6cd1c584ce95",
  measurementId: "G-L1KH2X9MPC"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app); // Initialize Firestore
