import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("patient-auth loaded");

// Handle Registration
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const nameInput = document.getElementById("name");

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;
      
      // Store patient ID, name, and email in localStorage
      localStorage.setItem('patientId', uid);
      localStorage.setItem('patientEmail', email);
      if (nameInput?.value) {
        localStorage.setItem('patientName', nameInput.value);
      }

      alert("Registration successful ✅");
      window.location.href = "patient-dashboard.html";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

// Handle Login
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const errorEl = document.getElementById("error");

    if (!email || !password) {
      if (errorEl) errorEl.innerText = "Please fill in all fields";
      return;
    }

    if (errorEl) errorEl.innerText = "";

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;
      
      // Store patient ID and email in localStorage
      localStorage.setItem('patientId', uid);
      localStorage.setItem('patientEmail', email);
      
      alert("Patient login successful ✅");
      window.location.href = "patient-dashboard.html";
    } catch (err) {
      console.error(err);
      if (errorEl) errorEl.innerText = err.message;
    }
  });
}