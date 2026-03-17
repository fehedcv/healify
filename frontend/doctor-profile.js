import { auth, db } from "./firebase-config.js";
import {
  doc as docRef,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// storage for image uploads
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

let currentDoctorDocId = null;

async function loadDoctorById(id, allowEdit = false) {
  try {
    const ref = docRef(db, "doctors", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("Doctor profile not found");
      return;
    }
    const d = snap.data();
    currentDoctorDocId = id;
    document.getElementById("name").innerText = d.name || '';
    document.getElementById("spec").innerText = d.specialization || '';
    document.getElementById("email").innerText = d.email || '';
    document.getElementById("photo").src = d.photo || 'https://via.placeholder.com/150';

    // if profile belongs to authenticated doctor, enable save button
    if (allowEdit) {
      document.getElementById("saveBtn").addEventListener("click", handleSave);
    } else {
      // hide upload controls when viewing another doctor's profile
      document.getElementById('photoInput').style.display = 'none';
      document.getElementById('saveBtn').style.display = 'none';
    }
  } catch (err) {
    console.error(err);
    alert('Unable to load doctor profile');
  }
}

async function handleSave() {
  const fileInput = document.getElementById('photoInput');
  const msgEl = document.getElementById('updateMsg');
  const nameMsg = document.getElementById('nameMsg');
  msgEl.innerText = '';
  nameMsg.innerText = '';

  if (!currentDoctorDocId) {
    nameMsg.innerText = 'No profile loaded to update';
    return;
  }

  if (fileInput.files.length === 0) {
    nameMsg.innerText = 'Please select an image to upload';
    return;
  }

  const file = fileInput.files[0];
  const storage = getStorage();
  const photoRef = storageRef(storage, `doctor_photos/${currentDoctorDocId}/${file.name}`);
  try {
    await uploadBytes(photoRef, file);
    const url = await getDownloadURL(photoRef);
    // update firestore document
    await updateDoc(docRef(db, 'doctors', currentDoctorDocId), {
      photo: url
    });
    document.getElementById('photo').src = url;
    msgEl.innerText = 'Profile image updated successfully';
  } catch (e) {
    console.error(e);
    nameMsg.innerText = 'Failed to upload image';
  }
}


// If `id` query param present, load that profile. Otherwise, fall back to authenticated doctor.
const params = new URLSearchParams(window.location.search);
const profileId = params.get('id');

if (profileId) {
  // viewing someone else's profile; editing not permitted
  loadDoctorById(profileId, false);
} else {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      alert("Doctor not logged in");
      return;
    }

    const doctorEmail = user.email;
    const q = query(
      collection(db, "doctors"),
      where("email", "==", doctorEmail)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("No doctor profile found for this email");
      return;
    }

    snapshot.forEach(doc => {
      const d = doc.data();
      currentDoctorDocId = doc.id;
      document.getElementById("name").innerText = d.name;
      document.getElementById("spec").innerText = d.specialization;
      document.getElementById("email").innerText = d.email;
      document.getElementById("photo").src = d.photo;
    });

    // enable editing after setting current id
    document.getElementById("saveBtn").addEventListener("click", handleSave);
  });
}