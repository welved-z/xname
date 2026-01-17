// firebase.js - initialize Firebase (modular) using CDN imports (ES module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// ---------- CONFIG: your config (kept as you provided) ----------
const firebaseConfig = {
  apiKey: "AIzaSyAt7QIuLGjJ4AZBiS4JEZ_RAmupqRKxWrU",
  authDomain: "kaderisasi-mpkosis71.firebaseapp.com",
  projectId: "kaderisasi-mpkosis71",
  storageBucket: "kaderisasi-mpkosis71.firebasestorage.app",
  messagingSenderId: "93663584622",
  appId: "1:93663584622:web:666a18a0abfcff48e9e17f",
  measurementId: "G-25RZJY8QET"
};
// -------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
try { const analytics = getAnalytics(app); } catch(e){ /* ignore in unsupported env */ }

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default firebaseConfig;
