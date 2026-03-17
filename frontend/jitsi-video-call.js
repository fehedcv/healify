// Jitsi Meet Video Call Integration with Firebase Authentication
// Uses Firebase UID to generate unique room identifiers

import { auth } from "./firebase-config.js";
import { db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let jitsiAPI = null;
let currentUser = null;
let roomName = null;
let notificationWs = null;

// Connect to WebSocket Notification Server
function connectNotificationServer() {
  return new Promise((resolve) => {
    try {
      // Try to connect to WebSocket server
      const wsUrl = window.location.hostname === 'localhost' 
        ? 'ws://localhost:3000'
        : `ws://${window.location.hostname}:3000`;
      
      notificationWs = new WebSocket(wsUrl);

      notificationWs.onopen = () => {
        console.log('✓ Connected to notification server');
        resolve(true);
      };

      notificationWs.onerror = (error) => {
        console.warn('⚠ Could not connect to notification server:', error);
        resolve(false);
      };

      notificationWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received notification:', data);
        } catch (e) {
          console.error('Error parsing notification:', e);
        }
      };

      notificationWs.onclose = () => {
        console.log('⚠ Disconnected from notification server');
      };

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
      resolve(false);
    }
  });
}

// Send call notification via WebSocket
function sendCallNotification(doctorIdentifier, patientId, patientName, callId, roomName, isDoctorEmail = false) {
  if (notificationWs && notificationWs.readyState === WebSocket.OPEN) {
    const message = {
      type: 'initiateCall',
      patientId,
      patientName,
      callId,
      roomName
    };
    
    // Send as doctorEmail if it's an email, otherwise as doctorId for backward compatibility
    if (isDoctorEmail) {
      message.doctorEmail = doctorIdentifier;
    } else {
      message.doctorId = doctorIdentifier;
    }
    
    notificationWs.send(JSON.stringify(message));
    console.log('✓ Call notification sent to doctor via WebSocket');
  } else {
    console.warn('⚠ WebSocket not connected, cannot send notification');
  }
}

// Initialize Jitsi API globally
async function initializeJitsi() {
  return new Promise((resolve) => {
    // Wait for jitsi API to be available
    const checkAPI = () => {
      if (typeof JitsiMeetExternalAPI !== 'undefined') {
        resolve();
      } else {
        setTimeout(checkAPI, 100);
      }
    };
    checkAPI();
  });
}

// Get user info from localStorage and Firestore
async function getUserInfo() {
  const patientId = localStorage.getItem('patientId');
  const doctorId = localStorage.getItem('doctorId');
  let patientName = localStorage.getItem('patientName');
  let doctorName = localStorage.getItem('doctorName');

  let userType = 'unknown';
  let userId = null;
  let userName = 'User';

  if (patientId) {
    userType = 'patient';
    userId = patientId;
    userName = patientName || 'Patient';
    
    // Try to fetch patient name from Firestore if not in localStorage
    if (!patientName) {
      try {
        const patientDoc = await getDoc(doc(db, 'patients', patientId));
        if (patientDoc.exists()) {
          userName = patientDoc.data().name || 'Patient';
          localStorage.setItem('patientName', userName);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    }
  } else if (doctorId) {
    userType = 'doctor';
    userId = doctorId;
    userName = doctorName || 'Doctor';
    
    // Try to fetch doctor name from Firestore if not in localStorage
    if (!doctorName) {
      try {
        const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
        if (doctorDoc.exists()) {
          userName = doctorDoc.data().name || 'Doctor';
          localStorage.setItem('doctorName', userName);
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      }
    }
  }

  return { userType, userId, userName };
}

// Generate room name from participants' IDs
async function generateRoomName() {
  const params = new URLSearchParams(window.location.search);
  const doctorIdFromURL = params.get('doctorId');
  const doctorEmailFromURL = params.get('doctorEmail');
  const appointmentId = params.get('appointment');
  const callId = params.get('id');
  const roomNameFromURL = params.get('roomName');
  const userInfo = await getUserInfo();

  // If room name is provided directly (from notification), use it
  if (roomNameFromURL) {
    return decodeURIComponent(roomNameFromURL);
  }

  // If there's a specific call ID (from doctor accepting call), use it
  if (callId) {
    return `healify-call-${callId}`;
  }

  // If there's an appointment ID, use it as the room name
  if (appointmentId) {
    return `healify-appointment-${appointmentId}`;
  }

  // If doctor ID/email is provided in URL, create room name from patient and doctor identifiers
  const doctorIdentifier = doctorEmailFromURL || doctorIdFromURL;
  if (doctorIdentifier && userInfo.userId) {
    // Sort the identifiers to ensure both parties get the same room name
    const ids = [userInfo.userId, doctorIdentifier].sort();
    return `healify-consultation-${ids[0]}-${ids[1]}`;
  }

  // Fallback: use user ID and current timestamp
  return `healify-${userInfo.userId}-${Date.now()}`;
}

// Initialize Jitsi Conference
async function startConference() {
  try {
    // Wait for Jitsi API to be available
    await initializeJitsi();

    const userInfo = await getUserInfo();
    const params = new URLSearchParams(window.location.search);
    const doctorIdFromURL = params.get('doctorId');
    const doctorEmailFromURL = params.get('doctorEmail');
    const appointmentId = params.get('appointment');
    
    roomName = await generateRoomName();

    // Validate room setup
    if (!userInfo.userId) {
      alert('Error: User not authenticated. Please log in first.');
      window.location.href = userInfo.userType === 'doctor' ? 'doctor-login.html' : 'patient-login.html';
      return;
    }

    // Connect to notification server
    await connectNotificationServer();

    // Register user on notification server
    if (notificationWs && notificationWs.readyState === WebSocket.OPEN) {
      const registerMessage = {
        type: 'register',
        userId: userInfo.userId,
        userType: userInfo.userType
      };
      
      // Include user email if available
      if (userInfo.userType === 'patient') {
        const patientEmail = localStorage.getItem('patientEmail');
        if (patientEmail) registerMessage.userEmail = patientEmail;
      }
      
      notificationWs.send(JSON.stringify(registerMessage));
    }

    // If this is a patient initiating a call with a doctor, send notification via WebSocket
    const doctorIdentifier = doctorEmailFromURL || doctorIdFromURL;
    const isDoctorEmail = !!doctorEmailFromURL;
    
    if (userInfo.userType === 'patient' && doctorIdentifier && !appointmentId) {
      // Send notification via WebSocket
      sendCallNotification(doctorIdentifier, userInfo.userId, userInfo.userName, roomName, roomName, isDoctorEmail);
      
      // Also create in Firestore as backup
      try {
        const firestorePayload = {
          patientId: userInfo.userId,
          patientName: userInfo.userName,
          callId: roomName,
          timestamp: serverTimestamp(),
          status: 'pending'
        };
        
        // Store both email and ID for flexibility in Firestore
        if (doctorEmailFromURL) {
          firestorePayload.doctorEmail = doctorEmailFromURL;
        }
        if (doctorIdFromURL) {
          firestorePayload.doctorId = doctorIdFromURL;
        }
        
        await addDoc(collection(db, 'incomingCalls'), firestorePayload);
        console.log('Incoming call notification created in Firestore');
      } catch (error) {
        console.error('Error creating incoming call notification:', error);
      }
    }

    // Update UI with room info
    document.getElementById('roomId').textContent = roomName.substring(0, 30) + '...';
    document.getElementById('status').textContent = 'Connecting...';

    const options = {
      roomName: roomName,
      parentNode: document.querySelector('#jitsiConference'),
      configOverwrite: {
        startAudioOnly: false,
        enableLobbyMode: false,
        prejoinPageEnabled: false,
        disableFilmstripOnly: false,
        hideConferenceTimer: false,
        resolution: 720,
      },
      interfaceConfigOverwrite: {
        DEFAULT_LOGO_URL: 'https://healify-5d611.web.app/logo.png',
        SHOW_BRAND_WATERMARK: false,
        SHOW_JITSI_WATERMARK: true,
        MOBILE_APP_PROMO: false,
        FILMSTRIP_ONLY: false,
        HIDE_INVITE_MORE_HEADER: false,
        TOOLBAR_BUTTONS: ['microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'chat', 'recording', 'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts', 'tileview', 'toggle-camera'],
      },
      userInfo: {
        displayName: userInfo.userName,
        email: currentUser?.email || '',
      },
    };

    // Create Jitsi API instance
    jitsiAPI = new JitsiMeetExternalAPI('meet.jit.si', options);

    // Event listeners
    jitsiAPI.addEventListener('videoConferenceJoined', onConferenceJoined);
    jitsiAPI.addEventListener('videoConferenceLeft', onConferenceLeft);
    jitsiAPI.addEventListener('participantJoined', onParticipantJoined);
    jitsiAPI.addEventListener('participantLeft', onParticipantLeft);
    jitsiAPI.addEventListener('readyToClose', onReadyToClose);

  } catch (error) {
    console.error('Error starting conference:', error);
    alert('Failed to start video conference: ' + error.message);
    document.getElementById('status').textContent = 'Error: ' + error.message;
  }
}

// Event: User joined the conference
function onConferenceJoined() {
  console.log('User joined the conference');
  document.getElementById('status').textContent = 'In Conference';
}

// Event: User left the conference
function onConferenceLeft() {
  console.log('User left the conference');
  document.getElementById('status').textContent = 'Disconnected';
}

// Event: Participant joined
function onParticipantJoined(participantId) {
  console.log('Participant joined:', participantId);
  updateParticipantCount();
}

// Event: Participant left
function onParticipantLeft(participantId) {
  console.log('Participant left:', participantId);
  updateParticipantCount();
}

// Event: Ready to close
function onReadyToClose() {
  console.log('Conference ready to close');
  jitsiAPI.dispose();
  jitsiAPI = null;
}

// Update participant count
function updateParticipantCount() {
  try {
    const participants = jitsiAPI?.getParticipants();
    const count = (participants ? participants.length : 0) + 1; // +1 for current user
    document.getElementById('participantCount').textContent = count;
  } catch (error) {
    console.error('Error updating participant count:', error);
  }
}

// Go back function
window.goBack = async function() {
  if (jitsiAPI) {
    jitsiAPI.dispose();
    jitsiAPI = null;
  }
  // Disconnect from notification server
  if (notificationWs && notificationWs.readyState === WebSocket.OPEN) {
    notificationWs.close();
  }
  // Redirect based on user type
  const userInfo = await getUserInfo();
  if (userInfo.userType === 'doctor') {
    window.location.href = 'doctor-dashboard.html';
  } else {
    window.location.href = 'patient-dashboard.html';
  }
};

// Setup authentication and start conference
async function setupConference() {
  try {
    // Wait for Firebase auth to be ready
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        console.log('User authenticated:', user.uid);
        await startConference();
      } else {
        console.log('User not authenticated');
        alert('Please log in to start a video consultation');
        window.location.href = 'patient-login.html';
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    alert('Error: ' + error.message);
  }
}

// Start when page loads
document.addEventListener('DOMContentLoaded', setupConference);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (jitsiAPI) {
    jitsiAPI.dispose();
  }
  if (notificationWs && notificationWs.readyState === WebSocket.OPEN) {
    notificationWs.close();
  }
});
