import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const doctorList = document.getElementById("doctorList");

async function loadDoctors() {
  try {
    const snapshot = await getDocs(collection(db, "doctors"));
    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        const d = doc.data();
        const id = doc.id;

        const card = document.createElement('div');
        card.className = 'doctor-card';

        // determine photo source (handle Google Drive share links)
        let photoHtml = `<div class="doctor-avatar">${d.name ? d.name.charAt(0) : 'D'}</div>`;
        if (d.photo) {
          const transformGoogleDrive = (url) => {
            try {
              const u = new URL(url);
              if (u.hostname.includes('drive.google.com')) {
                // try extracting /d/FILEID or id=FILEID
                const parts = u.pathname.split('/');
                const idIndex = parts.indexOf('d');
                if (idIndex !== -1 && parts[idIndex+1]) {
                  const fileId = parts[idIndex+1];
                  return `https://drive.google.com/uc?export=view&id=${fileId}`;
                }
                const idParam = u.searchParams.get('id');
                if (idParam) return `https://drive.google.com/uc?export=view&id=${idParam}`;
              }
            } catch (e) {
              // not a valid URL
            }
            return url;
          };

          const imgSrc = transformGoogleDrive(d.photo);
          photoHtml = `<img class="doctor-photo" src="${imgSrc}" alt="${(d.name||'Doctor') }">`;
        }

        card.innerHTML = `
          <div class="doctor-header">
            ${photoHtml}
          </div>
          <div class="doctor-info">
            <h3 class="doctor-name">${d.name || 'Unknown'}</h3>
            <p class="doctor-specialty">${d.specialization || ''}</p>
            <div class="doctor-footer">
              <button class="btn-consult btn-call" data-id="${id}" data-email="${d.email || ''}" data-name="${encodeURIComponent(d.name || '')}">Call</button>
              <a class="btn-profile" href="doctor-profile.html?id=${encodeURIComponent(id)}">Profile</a>
            </div>
          </div>
        `;

        doctorList.appendChild(card);
      });
    } else {
      doctorList.innerHTML = '<p>No doctors found.</p>';
    }
  } catch (err) {
    console.error(err);
    doctorList.innerHTML = '<p class="error-text">Unable to load doctors.</p>';
  }

  // Delegate click for call buttons
  doctorList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-call');
    if (!btn) return;
    const doctorId = btn.dataset.id;
    const doctorEmail = btn.dataset.email || '';
    const doctorName = decodeURIComponent(btn.dataset.name || 'Doctor');
    // navigate to video consultation with doctor info (use email if available, fallback to doctorId)
    const identifier = doctorEmail ? `doctorEmail=${encodeURIComponent(doctorEmail)}` : `doctorId=${encodeURIComponent(doctorId)}`;
    window.location.href = `video-consultation.html?${identifier}&doctorName=${encodeURIComponent(doctorName)}`;
  });
}

loadDoctors();