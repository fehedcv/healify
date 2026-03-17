import { auth } from "./firebase-config.js";
import { db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");

  if (!email || !password) {
    error.innerText = "Please fill in all fields";
    return;
  }

  error.innerText = "";

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;
    
    // Store doctor ID and email in localStorage
    localStorage.setItem('doctorId', uid);
    localStorage.setItem('doctorEmail', email);
    
    // Update doctor's Firestore document with email (for patient visibility)
    try {
      await updateDoc(doc(db, 'doctors', uid), {
        email: email,
        lastLogin: new Date()
      });
    } catch (err) {
      console.warn('Could not update doctor email in Firestore:', err);
      // Continue anyway, email is stored in localStorage
    }
    
    alert("Doctor login successful ✅");
    window.location.href = "doctor-dashboard.html";
  } catch (err) {
    error.innerText = err.message;
  }
});