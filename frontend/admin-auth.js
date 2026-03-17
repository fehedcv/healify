import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// firebaseService is defined in firebase-service.js which is loaded separately by pages
// we import it here so that caller pages can access it after login
import "./firebase-service.js";

const loginBtn = document.getElementById("loginBtn");
const errorEl = document.getElementById("error");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  errorEl.innerText = "";

  if (!email || !password) {
    errorEl.innerText = "Please fill in all fields";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // ensure firebaseService is ready and get user data
    if (typeof firebaseService === 'undefined' || !firebaseService.auth) {
      // wait for initialization
      let attempts=0;
      while ((typeof firebaseService === 'undefined' || !firebaseService.auth) && attempts<50) {
        await new Promise(r=>setTimeout(r,100));
        attempts++;
      }
    }
    const userData = await firebaseService.getCurrentUserData();
    if (!userData || userData.userType !== 'admin') {
      // logout the account immediately
      await firebaseService.logout();
      throw new Error('Not an admin account');
    }
    alert("Admin login successful");
    localStorage.setItem('adminId', firebase.auth().currentUser.uid);
    window.location.href = "admin-doctors.html";
  } catch (err) {
    console.error(err);
    errorEl.innerText = err.message || 'Login failed';
  }
});