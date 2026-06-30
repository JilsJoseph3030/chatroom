// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config object (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAwqLHbTBd7Pc8o6vabQKM7qyTVL2OGr20",
  authDomain: "chat-room-a964c.firebaseapp.com",
  projectId: "chat-room-a964c",
  storageBucket: "chat-room-a964c.firebasestorage.app",
  messagingSenderId: "825310798383",
  appId: "1:825310798383:web:c50465936a4917dc375cda",
  measurementId: "G-Z9PK37MCN0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export services so other files can import them
export const auth = getAuth(app);
export const db = getFirestore(app);
