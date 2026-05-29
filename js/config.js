// ── Firebase Configuration & Re-exports ──────────────────────────────
export const FB_CFG = {
  apiKey: "AIzaSyAQv2GdSkoC3thWE9a_HT_PwCrJqCM7Uvo",
  authDomain: "therapyvr-9fe01.firebaseapp.com",
  projectId: "therapyvr-9fe01",
  storageBucket: "therapyvr-9fe01.firebasestorage.app",
  messagingSenderId: "259767551112",
  appId: "1:259767551112:web:d59e3c7e568e1075bd4b3d"
};

export { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
export { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
export { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
export { getFirestore, collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, serverTimestamp, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
