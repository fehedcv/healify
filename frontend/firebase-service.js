// Firebase Service - Centralized Firebase Operations

class FirebaseService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.initPromise = this.waitForFirebaseInit();
  }

  async waitForFirebaseInit() {
    // Wait for Firebase to be available
    let attempts = 0;
    while (attempts < 50) {
      if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        return this.initialize();
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    throw new Error('Firebase failed to initialize after 5 seconds');
  }

  initialize() {
    try {
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      this.storage = firebase.storage();
      console.log('✓ Firebase Service initialized successfully');
      console.log('ℹ️ Firebase config check: projectId=' + firebase.app().options.projectId);
      return true;
    } catch (error) {
      console.error('❌ Error initializing Firebase Service:', error);
      throw new Error('Firebase Service initialization failed: ' + error.message);
    }
  }

  // Ensure Firebase is ready before any operation
  async ensureReady() {
    if (!this.auth || !this.db) {
      await this.initPromise;
    }
  }

  // ============ Authentication Services ============

  // Register new user (Patient or Doctor)
  async register(email, password, userType, userData) {
    try {
      await this.ensureReady();
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      const uid = result.user.uid;

      // Store user data in Firestore
      await this.db.collection('users').doc(uid).set({
        uid,
        email,
        userType, // 'patient' or 'doctor'
        ...userData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('✓ User registered successfully:', uid);
      return { success: true, uid, user: result.user };
    } catch (error) {
      console.error('Registration error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Login user
  async login(email, password) {
    try {
      await this.ensureReady();
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      const userDoc = await this.db.collection('users').doc(result.user.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User data not found in database');
      }
      
      console.log('✓ User logged in successfully:', result.user.email);
      return { success: true, user: result.user, userData: userDoc.data() };
    } catch (error) {
      console.error('Login error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      await this.ensureReady();
      await this.auth.signOut();
      console.log('✓ User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  async getCurrentUser() {
    await this.ensureReady();
    return this.auth.currentUser;
  }

  // Get current user data from Firestore
  async getCurrentUserData() {
    await this.ensureReady();
    const user = this.auth.currentUser;
    if (!user) return null;

    try {
      const userDoc = await this.db.collection('users').doc(user.uid).get();
      return userDoc.data();
    } catch (error) {
      console.error('Error getting current user data:', error.message);
      return null;
    }
  }

  // ============ Doctor Services ============

  // Add/Update doctor details (Admin only)
  // if a password is provided, also create a Firebase Authentication user
  async addDoctor(doctorData, profileImage, password) {
    try {
      await this.ensureReady();
      let imageUrl = null;

      // upload profile image first (URL may be stored regardless of auth)
      if (profileImage) {
        const fileName = `doctors/${Date.now()}_${profileImage.name}`;
        const storageRef = this.storage.ref(fileName);
        await storageRef.put(profileImage);
        imageUrl = await storageRef.getDownloadURL();
      }

      let docId = null;
      // create authentication account if password provided
      if (password && doctorData.email) {
        try {
          const result = await this.auth.createUserWithEmailAndPassword(doctorData.email, password);
          const uid = result.user.uid;
          // store basic user record
          await this.db.collection('users').doc(uid).set({
            uid,
            email: doctorData.email,
            userType: 'doctor',
            name: doctorData.name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          docId = uid;
        } catch (authErr) {
          console.error('Error creating auth user for doctor:', authErr.message);
          // continue without auth if necessary
        }
      }

      const doctorDoc = {
        name: doctorData.name,
        email: doctorData.email,
        specialization: doctorData.specialization,
        qualifications: doctorData.qualifications,
        experience: doctorData.experience,
        phoneNumber: doctorData.phoneNumber,
        profileImage: imageUrl,
        bio: doctorData.bio || '',
        consultationFee: doctorData.consultationFee || 0,
        availableSlots: doctorData.availableSlots || [],
        rating: 0,
        reviewCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      let writeRef;
      if (docId) {
        writeRef = this.db.collection('doctors').doc(docId);
        await writeRef.set(doctorDoc);
      } else {
        writeRef = await this.db.collection('doctors').add(doctorDoc);
        docId = writeRef.id;
      }

      console.log('✓ Doctor added successfully:', docId);
      return { success: true, doctorId: docId };
    } catch (error) {
      console.error('Error adding doctor:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get all doctors
  async getAllDoctors() {
    try {
      await this.ensureReady();
      const snapshot = await this.db.collection('doctors').get();
      const doctors = [];
      snapshot.forEach(doc => {
        doctors.push({ id: doc.id, ...doc.data() });
      });
      console.log('✓ Fetched all doctors:', doctors.length);
      return { success: true, doctors };
    } catch (error) {
      console.error('Error fetching doctors:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get doctor by ID
  async getDoctorById(doctorId) {
    try {
      await this.ensureReady();
      const doc = await this.db.collection('doctors').doc(doctorId).get();
      if (doc.exists) {
        return { success: true, doctor: { id: doc.id, ...doc.data() } };
      }
      return { success: false, error: 'Doctor not found' };
    } catch (error) {
      console.error('Error fetching doctor:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Update doctor details
  async updateDoctor(doctorId, updateData) {
    try {
      await this.ensureReady();
      await this.db.collection('doctors').doc(doctorId).update({
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✓ Doctor updated successfully:', doctorId);
      return { success: true };
    } catch (error) {
      console.error('Error updating doctor:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Delete doctor
  async deleteDoctor(doctorId) {
    try {
      await this.ensureReady();
      await this.db.collection('doctors').doc(doctorId).delete();
      console.log('✓ Doctor deleted successfully:', doctorId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting doctor:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ Appointment Services ============

  // Book appointment
  async bookAppointment(appointmentData) {
    try {
      await this.ensureReady();
      const appointment = {
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate: new Date(appointmentData.appointmentDate),
        appointmentTime: appointmentData.appointmentTime,
        reason: appointmentData.reason || '',
        notes: appointmentData.notes || '',
        status: 'pending', // pending, confirmed, completed, cancelled
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db.collection('appointments').add(appointment);
      console.log('✓ Appointment booked successfully:', docRef.id);
      return { success: true, appointmentId: docRef.id };
    } catch (error) {
      console.error('Error booking appointment:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get patient appointments
  async getPatientAppointments(patientId) {
    try {
      await this.ensureReady();
      const snapshot = await this.db.collection('appointments')
        .where('patientId', '==', patientId)
        .orderBy('appointmentDate', 'desc')
        .get();

      const appointments = [];
      snapshot.forEach(doc => {
        appointments.push({ id: doc.id, ...doc.data() });
      });
      console.log('✓ Fetched patient appointments:', appointments.length);
      return { success: true, appointments };
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get doctor appointments
  async getDoctorAppointments(doctorId) {
    try {
      await this.ensureReady();
      const snapshot = await this.db.collection('appointments')
        .where('doctorId', '==', doctorId)
        .orderBy('appointmentDate', 'desc')
        .get();

      const appointments = [];
      snapshot.forEach(doc => {
        appointments.push({ id: doc.id, ...doc.data() });
      });
      console.log('✓ Fetched doctor appointments:', appointments.length);
      return { success: true, appointments };
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Update appointment status
  async updateAppointmentStatus(appointmentId, status) {
    try {
      await this.ensureReady();
      await this.db.collection('appointments').doc(appointmentId).update({
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✓ Appointment status updated:', appointmentId, '->', status);
      return { success: true };
    } catch (error) {
      console.error('Error updating appointment:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ Consultation Services ============

  // Start consultation
  async startConsultation(consultationData) {
    try {
      await this.ensureReady();
      const consultation = {
        appointmentId: consultationData.appointmentId,
        patientId: consultationData.patientId,
        doctorId: consultationData.doctorId,
        startTime: firebase.firestore.FieldValue.serverTimestamp(),
        endTime: null,
        notes: consultationData.notes || '',
        status: 'ongoing', // ongoing, completed
        roomId: consultationData.roomId
      };

      const docRef = await this.db.collection('consultations').add(consultation);
      console.log('✓ Consultation started:', docRef.id);
      return { success: true, consultationId: docRef.id };
    } catch (error) {
      console.error('Error starting consultation:', error.message);
      return { success: false, error: error.message };
    }
  }

  // End consultation
  async endConsultation(consultationId, notes) {
    try {
      await this.ensureReady();
      await this.db.collection('consultations').doc(consultationId).update({
        endTime: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        notes
      });
      console.log('✓ Consultation ended:', consultationId);
      return { success: true };
    } catch (error) {
      console.error('Error ending consultation:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ Prescription Services ============

  // Add prescription
  async addPrescription(prescriptionData) {
    try {
      await this.ensureReady();
      const prescription = {
        patientId: prescriptionData.patientId,
        doctorId: prescriptionData.doctorId,
        consultationId: prescriptionData.consultationId,
        medications: prescriptionData.medications || [], // Array of {name, dosage, frequency, duration}
        notes: prescriptionData.notes || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db.collection('prescriptions').add(prescription);
      console.log('✓ Prescription added:', docRef.id);
      return { success: true, prescriptionId: docRef.id };
    } catch (error) {
      console.error('Error adding prescription:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get patient prescriptions
  async getPatientPrescriptions(patientId) {
    try {
      await this.ensureReady();
      const snapshot = await this.db.collection('prescriptions')
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc')
        .get();

      const prescriptions = [];
      snapshot.forEach(doc => {
        prescriptions.push({ id: doc.id, ...doc.data() });
      });
      console.log('✓ Fetched patient prescriptions:', prescriptions.length);
      return { success: true, prescriptions };
    } catch (error) {
      console.error('Error fetching prescriptions:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ Medical Records Services ============

  // Add medical record
  async addMedicalRecord(recordData) {
    try {
      await this.ensureReady();
      const record = {
        patientId: recordData.patientId,
        title: recordData.title,
        description: recordData.description,
        type: recordData.type, // 'report', 'lab-test', 'prescription', etc
        fileUrl: recordData.fileUrl || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db.collection('medicalRecords').add(record);
      console.log('✓ Medical record added:', docRef.id);
      return { success: true, recordId: docRef.id };
    } catch (error) {
      console.error('Error adding medical record:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get patient medical records
  async getPatientMedicalRecords(patientId) {
    try {
      await this.ensureReady();
      const snapshot = await this.db.collection('medicalRecords')
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc')
        .get();

      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
      console.log('✓ Fetched patient medical records:', records.length);
      return { success: true, records };
    } catch (error) {
      console.error('Error fetching medical records:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============ Utility Methods ============

  // Upload file to Firebase Storage
  async uploadFile(file, path) {
    try {
      await this.ensureReady();
      const fileName = `${path}/${Date.now()}_${file.name}`;
      const storageRef = this.storage.ref(fileName);
      await storageRef.put(file);
      const url = await storageRef.getDownloadURL();
      console.log('✓ File uploaded:', fileName);
      return { success: true, url, fileName };
    } catch (error) {
      console.error('Error uploading file:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Delete file from Firebase Storage
  async deleteFile(filePath) {
    try {
      await this.ensureReady();
      await this.storage.ref(filePath).delete();
      console.log('✓ File deleted:', filePath);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Set up real-time listener for doctors
  onDoctorsChange(callback) {
    return this.db.collection('doctors').onSnapshot(snapshot => {
      const doctors = [];
      snapshot.forEach(doc => {
        doctors.push({ id: doc.id, ...doc.data() });
      });
      callback(doctors);
    });
  }

  // Set up real-time listener for appointments
  onAppointmentsChange(userId, userType, callback) {
    const field = userType === 'patient' ? 'patientId' : 'doctorId';
    return this.db.collection('appointments')
      .where(field, '==', userId)
      .onSnapshot(snapshot => {
        const appointments = [];
        snapshot.forEach(doc => {
          appointments.push({ id: doc.id, ...doc.data() });
        });
        callback(appointments);
      });
  }
}

// Create global instance with proper error handling
let firebaseService;
(async () => {
  try {
    firebaseService = new FirebaseService();
    // Wait for Firebase to initialize
    await firebaseService.initPromise;
    console.log('✓ firebaseService global instance created and ready');
  } catch (error) {
    console.error('❌ FATAL: Could not create firebaseService instance:', error);
    console.error('Make sure:');
    console.error('  1. Firebase SDK is loaded first');
    console.error('  2. firebase-config.js is loaded second');
    console.error('  3. firebase-service.js is loaded third');
  }
})();

