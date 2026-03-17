import { auth } from "./firebase-config.js";

// Populate patient profile information using Firebase Auth data
auth.onAuthStateChanged(user => {
  if (!user) {
    alert("Patient not logged in");
    return;
  }

  document.getElementById("email").innerText = user.email || "";
  document.getElementById("name").innerText = user.displayName || "(No name set)";
  document.getElementById("photo").src = user.photoURL || "https://via.placeholder.com/150";

  // If additional custom fields are stored in Firestore/Realtime DB, fetch them here
  // For now placeholders (age, gender, history) remain as-is or could be extended later
});
