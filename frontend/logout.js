import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      alert("Logged out successfully");
      window.location.href = "index.html";
    } catch (error) {
      alert("Error logging out: " + error.message);
      console.error(error);
    }
  });
}
