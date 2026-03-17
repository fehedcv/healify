# Firebase Migration Guide - Healify

## Overview

Healify has been migrated from a multi-backend architecture (Python Flask, PHP, Node.js with MySQL/MongoDB) to a **Firebase-based backend**. This guide walks you through setting up and using the new Firebase system.

## Architecture Changes

### Before (Old Architecture)
- **Backend**: Python (Flask), PHP, Node.js (Express)
- **Database**: MySQL, MongoDB
- **Authentication**: JWT Tokens
- **File Storage**: Local filesystem

### After (New Architecture)
- **Backend**: Firebase (serverless)
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **Real-time**: Firestore real-time listeners

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `Healify`
4. Accept the terms and click "Create Project"
5. Wait for the project to be created

### Step 2: Enable Firebase Services

1. In Firebase Console, go to your project
2. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"

3. **Enable Firestore Database**:
   - Go to Firestore Database
   - Click "Create Database"
   - Choose "Start in production mode"
   - Select your region (closest to users)

4. **Enable Storage**:
   - Go to Storage
   - Click "Get Started"
   - Start in production mode
   - Choose storage location

### Step 3: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. In "Your apps" section, select Web app
3. Copy the Firebase config object
4. It will look like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 4: Update firebase-config.js

1. Open `frontend/firebase-config.js`
2. Replace `firebaseConfig` values with your actual configuration
3. Save the file

### Step 5: Update Firestore Security Rules

Go to Firestore → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection (stores profile info for patients, doctors, admins)
    // each document includes at least { uid, email, userType }
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth.uid == resource.data.doctorId;
    }

    // Doctors collection (public read, admin write)
    match /doctors/{doctorId} {
      allow read: if true;
      allow write: if request.auth.uid == request.resource.data.createdBy;
    }

    // Appointments
    match /appointments/{appointmentId} {
      allow read: if request.auth.uid == resource.data.patientId || 
                     request.auth.uid == resource.data.doctorId;
      allow create: if request.auth.uid == request.resource.data.patientId;
      allow update: if request.auth.uid == resource.data.doctorId;
    }

    // Consultations
    match /consultations/{consultationId} {
      allow read: if request.auth.uid == resource.data.patientId || 
                     request.auth.uid == resource.data.doctorId;
      allow write: if request.auth.uid == resource.data.doctorId;
    }

    // Prescriptions
    match /prescriptions/{prescriptionId} {
      allow read: if request.auth.uid == resource.data.patientId;
      allow write: if request.auth.uid == resource.data.doctorId;
    }

    // Medical Records
    match /medicalRecords/{recordId} {
      allow read: if request.auth.uid == resource.data.patientId;
      allow write: if request.auth.uid == resource.data.doctorId;
    }
  }
}
```

### Step 6: Update Firebase Storage Rules

Go to Storage → Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read and write
    match /doctors/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /prescriptions/{userId}/{allPaths=**} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    match /medical-records/{userId}/{allPaths=**} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## Database Schema

### Collections

#### `users`
```javascript
{
  uid: string,
  email: string,
  name: string,
  userType: "patient" | "doctor",
  phone: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `doctors`
```javascript
{
  id: string (auto-generated),
  name: string,
  email: string,
  specialization: string,
  experience: number,
  qualifications: string,
  profileImage: string (URL),
  consultationFee: number,
  rating: number,
  reviewCount: number,
  bio: string,
  phoneNumber: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `appointments`
```javascript
{
  id: string (auto-generated),
  patientId: string,
  doctorId: string,
  appointmentDate: timestamp,
  appointmentTime: string,
  reason: string,
  notes: string,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `consultations`
```javascript
{
  id: string (auto-generated),
  appointmentId: string,
  patientId: string,
  doctorId: string,
  startTime: timestamp,
  endTime: timestamp,
  notes: string,
  status: "ongoing" | "completed",
  roomId: string
}
```

#### `prescriptions`
```javascript
{
  id: string (auto-generated),
  patientId: string,
  doctorId: string,
  consultationId: string,
  medications: array[{
    name: string,
    dosage: string,
    frequency: string,
    duration: string
  }],
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `medicalRecords`
```javascript
{
  id: string (auto-generated),
  patientId: string,
  title: string,
  description: string,
  type: string,
  fileUrl: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Pages & Features

### For Patients
- **Login**: `patient-login.html`
  - Register or login with email/password
  - Two-factor authentication ready

- **Dashboard**: `patient.html`
  - Browse available doctors
  - Book appointments
  - View appointment history
  - Access prescriptions
  - View medical records

### For Doctors
- **Login**: `doctor-login.html`
  - Login with email/password
  - Doctor accounts created by admin only

- **Dashboard**: `doctor.html`
  - View pending appointments
  - Confirm/decline appointments
  - Start video consultations
  - Add prescriptions
  - View patient medical history

### For Admins
- **Admin login**: `admin-login.html` – use an account with `userType: "admin"` (create via Firebase console or API)
- **Doctor Management**: `admin-doctors.html` (redirects to admin login if unauthenticated)
  - Add new doctors with profile pictures (use file picker to choose an image).  When creating a doctor, you will also specify a temporary password; an auth user is created under the hood so the doctor can log in.
  - Edit doctor details
  - Delete doctors
  - Manage specializations and fees
  - Upload doctor profile images (stored in Cloud Storage under `doctor_photos/{docId}`)

  *Note*: make sure your Cloud Storage rules permit doctors to write to their own subfolder, e.g.:
  ```
  service firebase.storage {
    match /b/{bucket}/o {
      match /doctor_photos/{docId}/{allPaths=**} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == docId;
      }
    }
  }
  ```

## API Reference (Firebase Service)

### Authentication

```javascript
// Register new user (patient, doctor, or admin)
// This helper creates the auth account *and* stores a record in the `users` collection with the specified `userType`.
// You can call it from client code or the console to bootstrap admin accounts:
//   await firebaseService.register('admin@example.com','secret','admin',{name:'Site Admin'});
await firebaseService.register(email, password, userType, userData);

// Login user
await firebaseService.login(email, password);

// Logout user
await firebaseService.logout();

// Get current user
firebaseService.getCurrentUser();

// Get current user data from Firestore
await firebaseService.getCurrentUserData();
```

### Doctors

```javascript
// Add new doctor with profile image
await firebaseService.addDoctor(doctorData, profileImage);

// Get all doctors
await firebaseService.getAllDoctors();

// Get specific doctor
await firebaseService.getDoctorById(doctorId);

// Update doctor details
await firebaseService.updateDoctor(doctorId, updateData);

// Delete doctor
await firebaseService.deleteDoctor(doctorId);
```

### Appointments

```javascript
// Book new appointment
await firebaseService.bookAppointment(appointmentData);

// Get patient appointments
await firebaseService.getPatientAppointments(patientId);

// Get doctor appointments
await firebaseService.getDoctorAppointments(doctorId);

// Update appointment status
await firebaseService.updateAppointmentStatus(appointmentId, status);
```

### Consultations

```javascript
// Start consultation
await firebaseService.startConsultation(consultationData);

// End consultation
await firebaseService.endConsultation(consultationId, notes);
```

### Prescriptions

```javascript
// Add prescription
await firebaseService.addPrescription(prescriptionData);

// Get patient prescriptions
await firebaseService.getPatientPrescriptions(patientId);
```

### Medical Records

```javascript
// Add medical record
await firebaseService.addMedicalRecord(recordData);

// Get patient medical records
await firebaseService.getPatientMedicalRecords(patientId);
```

### File Upload

```javascript
// Upload file to Firebase Storage
await firebaseService.uploadFile(file, path);

// Delete file from Firebase Storage
await firebaseService.deleteFile(filePath);
```

### Real-time Listeners

```javascript
// Listen for doctor changes
firebaseService.onDoctorsChange((doctors) => {
  console.log('Doctors updated:', doctors);
});

// Listen for appointment changes
firebaseService.onAppointmentsChange(userId, userType, (appointments) => {
  console.log('Appointments updated:', appointments);
});
```

## Adding Doctors with Photos

### Using Admin Interface

1. Navigate to `admin-doctors.html`
2. Fill in doctor details:
   - Full Name
   - Email Address
   - Phone Number
   - Specialization
   - Years of Experience
   - Consultation Fee
   - Qualifications
   - Bio (optional)
   - Profile Picture

3. Click "Add Doctor"
4. Doctor appears in browse list immediately

### Programmatically

```javascript
const fileInput = document.getElementById('imageInput');
const profileImage = fileInput.files[0];

const result = await firebaseService.addDoctor({
  name: "Dr. John Smith",
  email: "john@hospital.com",
  specialization: "Cardiology",
  experience: 10,
  consultationFee: 50,
  qualifications: "MD from Harvard",
  phoneNumber: "+1234567890"
}, profileImage);

if (result.success) {
  console.log('Doctor added:', result.doctorId);
}
```

## Deployment

### Frontend Deployment (Firebase Hosting)

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase in your project:
```bash
firebase init hosting
```

3. Deploy:
```bash
firebase deploy --only hosting
```

### Backend (Firebase - No Deployment Needed)
Firebase services are automatically deployed and managed by Google.

## Environment Setup

### Required Files

- `frontend/firebase-config.js` - Firebase configuration
- `frontend/firebase-service.js` - Service layer
- `frontend/patient-login.html` - Patient login
- `frontend/doctor-login.html` - Doctor login
- `frontend/patient.html` - Patient dashboard
- `frontend/doctor.html` - Doctor dashboard
- `frontend/admin-doctors.html` - Admin panel

### Browser Requirements

- Modern browser with ES6 support
- Firebase SDK 9.22.0+
- JavaScript enabled

## Troubleshooting

### Authentication Issues

**Error**: "Firebase: Error (auth/invalid-email)"
- Solution: Ensure email format is valid

**Error**: "Firebase: Error (auth/weak-password)"
- Solution: Password must be at least 6 characters

### Firestore Issues

**Error**: "Missing or insufficient permissions"
- Solution: Check Firestore security rules, credentials

**Error**: "Document not found"
- Solution: Verify document ID, collection name

### File Upload Issues

**Error**: "Firebase Storage: User does not have permission"
- Solution: Update storage security rules

## Testing

### Manual Testing Checklist

- [ ] Patient registration works
- [ ] Patient login works
- [ ] Doctor login works (admin account)
- [ ] Admin can add doctors with photos
- [ ] Patient can browse doctors
- [ ] Patient can book appointments
- [ ] Doctor can view pending appointments
- [ ] Doctor can confirm/decline appointments
- [ ] Appointments display correctly in both dashboards
- [ ] Profile images load correctly
- [ ] Prescriptions can be added
- [ ] Medical records display correctly

## Security Best Practices

1. **Never expose Firebase config in production code** - It's designed to be public
2. **Use Firestore Security Rules** - Restrict data access appropriately
3. **Implement rate limiting** - Use Cloud Functions for this
4. **Enable two-factor authentication** - Available in Firebase Auth
5. **Regular backups** - Enable Firestore automated backups
6. **Monitor usage** - Check Firebase Console for anomalies

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Firebase Storage](https://firebase.google.com/docs/storage)

## Next Steps

1. Set up Firebase project (follow Step 1-6 above)
2. Deploy doctor profiles with images
3. Test authentication flows
4. Deploy to Firebase Hosting
5. Set up monitoring and analytics

---

**Last Updated**: February 2026
**Version**: 1.0
