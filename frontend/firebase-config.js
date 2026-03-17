// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg4gskBBxbUWER-cl-w1sXpoDp7lny8kg",
  authDomain: "healify-5d611.firebaseapp.com",
  projectId: "healify-5d611",
  storageBucket: "healify-5d611.firebasestorage.app",
  messagingSenderId: "140927278570",
  appId: "1:140927278570:web:529f8f2a76d9cb7e18a693"
  
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// add storage reference for uploads
export const storage = getStorage(app);