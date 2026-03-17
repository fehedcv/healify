import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
    
    // Store doctor ID in localStorage
    localStorage.setItem('doctorId', uid);
    
    alert("Doctor login successful ✅");
    window.location.href = "doctor-dashboard.html";
  } catch (err) {
    error.innerText = err.message;
  }
});