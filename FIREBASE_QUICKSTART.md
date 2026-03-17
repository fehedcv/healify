# Healify - Firebase Quick Start

## 🚀 Quick Setup (5 Minutes)

### 1. Firebase Configuration
```javascript
// Edit: frontend/firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Start Using
- **Patient**: Open `/frontend/patient-login.html`
- **Doctor**: Open `/frontend/doctor-login.html`
- **Admin**: go to `/frontend/admin-login.html` and sign in with an admin account, then you can access `/frontend/admin-doctors.html` to add doctors (provide a temporary password which will become the doctor's login).

### 3. Key Features
✅ Patient registration & login  
✅ Doctor registration (admin-only)  
✅ Browse doctors with photos  
✅ Book appointments  
✅ Video consultations  
✅ Digital prescriptions  
✅ Medical records  

## 📁 Project Structure

```
healify/
├── frontend/
│   ├── firebase-config.js          # Firebase config
│   ├── firebase-service.js         # API layer
│   ├── patient-login.html          # Patient auth
│   ├── doctor-login.html           # Doctor auth
│   ├── patient.html                # Patient dashboard
│   ├── doctor.html                 # Doctor dashboard
│   ├── admin-doctors.html          # Doctor management
│   ├── video-consultation.html     # Video calls
│   ├── index.html                  # Homepage
│   └── styles.css                  # Styling
├── FIREBASE_SETUP.md               # Full setup guide
├── FIREBASE_QUICKSTART.md          # This file
└── docs/                           # Documentation
```

## 🔐 User Types

### Patient
- Register with email/password (records are saved in `users` collection with a `userType`)
- Browse all available doctors
- Book appointments
- View prescriptions
- Access medical records
- Start video consultations

### Doctor
- Login with admin-created account
- View pending appointments
- Confirm/decline appointments
- Start consultations
- Add prescriptions
- View patient history

### Admin
- Add doctors with profile pictures
- Edit doctor details
- Manage specializations
- View all doctors

## 📊 Database Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Patient & doctor accounts |
| `doctors` | Doctor profiles with photos |
| `appointments` | Appointments (pending/confirmed/completed) |
| `consultations` | Active consultations |
| `prescriptions` | Digital prescriptions |
| `medicalRecords` | Patient medical records |

## 🌐 Frontend URLs

| Page | URL |
|------|-----|
| Home | `/index.html` |
| Patient Login | `/patient-login.html` |
| Doctor Login | `/doctor-login.html` |
| Patient Dashboard | `/patient.html` |
| Doctor Dashboard | `/doctor.html` |
| Admin Panel | `/admin-doctors.html` |
| Video Consultation | `/video-consultation.html` |

## ⚡ Common Tasks

### Add a Doctor with Photo
1. Go to `/admin-doctors.html`
2. Fill in doctor details
3. Upload profile picture
4. Click "Add Doctor"

### Book an Appointment
1. Patient logs in
2. Browse doctors (click on specialty if needed)
3. Click "Book Appointment"
4. Select date/time and reason
5. Confirm booking

### Confirm Appointment
1. Doctor logs in
2. Check "Pending Approval" tab
3. Click "Confirm" or "Decline"

### Start Consultation
1. Doctor clicks "Start Consultation" on confirmed appointment
2. Redirects to video call page
3. After consultation, doctor can add prescription

### Add Prescription
1. Doctor completes consultation
2. Click "Add Prescription & Complete"
3. Add medications, dosage, frequency
4. Save prescription

## 🔧 Firebase Services Used

- **Authentication**: Email/Password auth
- **Firestore Database**: Main data storage
- **Cloud Storage**: Doctor profile images
- **Real-time Sync**: Firestore listeners
- **Security Rules**: Database access control

## 📱 Responsive Design

All pages are mobile-friendly:
- ✅ Patient login & dashboard
- ✅ Doctor login & dashboard
- ✅ Admin panel
- ✅ Booking interface
- ✅ Video consultations

## 🛡️ Security

- Firestore security rules enforce access control
- Storage rules restrict file access
- Patient data visible only to patient & assigned doctor
- Admin functions restricted
- Email verification ready (not enabled by default)

## 💾 Data Backup

Firebase automatically maintains backups. To restore:
1. Go to Firebase Console
2. Firestore → Backups
3. Restore from snapshot

## 📈 Monitoring

Monitor in Firebase Console:
- Authentication usage
- Firestore read/write operations
- Storage operations
- Function execution

## 🐛 Common Issues

**Issue**: Login doesn't work
- Check Firebase config in `firebase-config.js`
- Verify user exists in Authentication
- Check browser console for errors

**Issue**: Doctor pictures not showing
- Verify Firebase Storage rules
- Check image URL in database
- Ensure file permissions correct

**Issue**: Appointment not saving
- Check Firestore rules
- Verify user authentication
- Check browser console errors

## 🚦 Testing Checklist

- [ ] Patient can register
- [ ] Patient can login
- [ ] Doctor can login
- [ ] Can add doctor via admin panel
- [ ] Doctor photo uploads
- [ ] Can book appointment
- [ ] Appointment appears for both users
- [ ] Can confirm appointment
- [ ] Can start video call
- [ ] Can add prescription
- [ ] Prescription visible to patient

## 📚 Learning Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Sample Code](./frontend/) - Check each HTML file

## 🎯 Next Steps

1. ✅ Set up Firebase project (see FIREBASE_SETUP.md)
2. ✅ Add firebase-config.js credentials
3. ✅ Deploy to Firebase Hosting
4. ✅ Add doctors with photos
5. ✅ Start using!

## 📞 Support

For issues or questions:
1. Check browser console (F12)
2. Review FIREBASE_SETUP.md
3. Check Firebase Console logs
4. Review source code comments

---

**Version**: 1.0  
**Last Updated**: February 2026
