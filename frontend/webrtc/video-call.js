// Video consultation WebRTC + Firestore signaling helper
//
// This module implements a peer-to-peer WebRTC video + audio call between
// a patient and a doctor, using Firebase Firestore as the signaling channel.
//
// Workflow:
// 1) Patient clicks "Start Call" -> creates a Firestore room document and writes an offer.
// 2) Doctor clicks "Join Call" -> reads the offer, creates an answer, and writes it back.
// 3) Both peers exchange ICE candidates via Firestore subcollections.
//
// Requirements met:
// - One local and one remote video element
// - Firestore offer/answer + ICE candidate exchange
// - Handles permissions, connection state, and call lifecycle

import { db } from "../firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// UI elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusEl = document.getElementById('status');
const callIdEl = document.getElementById('callId');

const startBtn = document.getElementById('startCallBtn');
const joinBtn = document.getElementById('joinCallBtn');
const endBtn = document.getElementById('endCallBtn');
const micBtn = document.getElementById('micBtn');
const cameraBtn = document.getElementById('cameraBtn');
const screenBtn = document.getElementById('screenBtn');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatBox = document.getElementById('chatBox');

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let dataChannel = null;
let roomId = null;
let isCaller = false;
let micEnabled = true;
let cameraEnabled = true;

const appointmentId = new URLSearchParams(window.location.search).get('appointment');
const doctorId = new URLSearchParams(window.location.search).get('doctorId');
const doctorName = new URLSearchParams(window.location.search).get('doctorName');
const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId');

let roomDocRef = null;
let callerCandidatesRef = null;
let calleeCandidatesRef = null;

let unsubscribeRoom = null;
let unsubscribeCallerCandidates = null;
let unsubscribeCalleeCandidates = null;

// Call duration tracking
let callStartTime = null;
let durationIntervalId = null;
const durationEl = document.getElementById('duration');

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function updateDuration() {
  if (!callStartTime || !durationEl) return;

  const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  durationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startDurationTimer() {
  if (durationIntervalId) return;

  callStartTime = Date.now();
  durationIntervalId = setInterval(updateDuration, 1000);
  updateDuration();
}

function stopDurationTimer() {
  if (durationIntervalId) {
    clearInterval(durationIntervalId);
    durationIntervalId = null;
  }

  if (durationEl) {
    durationEl.textContent = '00:00';
  }
  
  callStartTime = null;
}

function setCallId(id) {
  roomId = id;
  if (callIdEl) callIdEl.textContent = id || '-';
  const url = new URL(window.location.href);
  if (roomId) {
    url.searchParams.set('id', roomId);
  } else {
    url.searchParams.delete('id');
  }
  window.history.replaceState({}, '', url);
}

function getCallIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function generateRandomId() {
  return Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
}

async function ensureLocalStream() {
  if (localStream) return localStream;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    if (localVideo) {
      localVideo.srcObject = localStream;
    }

    console.log('Local stream obtained successfully');
    return localStream;
  } catch (err) {
    console.error('Failed to get local media:', err);
    
    let errorMsg = 'Camera/Mic permission required';
    if (err.name === 'NotAllowedError') {
      errorMsg = 'Permission denied: Please allow camera and microphone access';
    } else if (err.name === 'NotFoundError') {
      errorMsg = 'No camera/microphone found on this device';
    } else if (err.name === 'NotReadableError') {
      errorMsg = 'Camera/Microphone is in use by another application';
    }
    
    setStatus(errorMsg);
    alert(errorMsg);
    throw err;
  }
}

function createPeerConnection() {
  if (peerConnection) return peerConnection;

  peerConnection = new RTCPeerConnection({ iceServers });

  // Add local tracks
  if (localStream) {
    for (const track of localStream.getTracks()) {
      peerConnection.addTrack(track, localStream);
    }
  }

  // Remote track handler
  remoteStream = new MediaStream();
  if (remoteVideo) {
    remoteVideo.srcObject = remoteStream;
  }

  peerConnection.ontrack = (event) => {
    for (const track of event.streams[0].getTracks()) {
      remoteStream.addTrack(track);
    }
  };

  // Data channel (for in-call text chat)
  if (isCaller) {
    dataChannel = peerConnection.createDataChannel('chat');
    setupDataChannel();
  } else {
    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      setupDataChannel();
    };
  }

  // ICE candidates
  peerConnection.onicecandidate = async (event) => {
    if (!event.candidate) return;

    try {
      if (isCaller && callerCandidatesRef) {
        await addDoc(callerCandidatesRef, event.candidate.toJSON());
      } else if (!isCaller && calleeCandidatesRef) {
        await addDoc(calleeCandidatesRef, event.candidate.toJSON());
      }
    } catch (error) {
      console.error('Error adding ICE candidate to Firestore:', error);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    console.log('Peer connection state:', state);
    
    if (state === 'connected') {
      setStatus('Connected');
      startDurationTimer();
    } else if (state === 'connecting') {
      setStatus('Connecting...');
    } else if (state === 'disconnected') {
      console.warn('Peer connection disconnected');
      setStatus('Disconnected - attempting to reconnect...');
      stopDurationTimer();
    } else if (state === 'failed') {
      console.error('Peer connection failed');
      setStatus('Connection failed');
      stopDurationTimer();
      alert('Connection failed. Please check your network and try again.');
    } else if (state === 'closed') {
      setStatus('Connection closed');
      stopDurationTimer();
    }
  };

  // Handle ICE connection state
  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === 'failed') {
      console.error('ICE connection failed, attempting restart');
    }
  };

  return peerConnection;
}

function setupDataChannel() {
  if (!dataChannel) return;

  dataChannel.onopen = () => {
    console.log('Chat data channel open');
    displayMessage('Chat connection established', 'received');
  };

  dataChannel.onmessage = (event) => {
    try {
      displayMessage(event.data, 'received');
    } catch (error) {
      console.error('Error processing message:', error);
    }
  };

  dataChannel.onclose = () => {
    console.log('Chat data channel closed');
    displayMessage('Chat connection closed', 'received');
  };

  dataChannel.onerror = (error) => {
    console.error('Chat data channel error:', error);
    displayMessage('Chat error occurred', 'received');
  };
}

function displayMessage(text, type) {
  if (!chatBox) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  if (!messageInput) return;
  const message = messageInput.value.trim();
  if (!message) return;

  displayMessage(message, 'sent');
  messageInput.value = '';

  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(message);
  } else {
    console.warn('Data channel not open yet');
  }
}

function handleMessageKeypress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function toggleMic() {
  micEnabled = !micEnabled;
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = micEnabled;
    });
  }
  if (micBtn) micBtn.classList.toggle('active', micEnabled);
}

function toggleCamera() {
  cameraEnabled = !cameraEnabled;
  if (localStream) {
    localStream.getVideoTracks().forEach(track => {
      track.enabled = cameraEnabled;
    });
  }
  if (cameraBtn) cameraBtn.classList.toggle('active', cameraEnabled);
}

async function shareScreen() {
  if (!peerConnection) return;

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    const senders = peerConnection.getSenders();
    const videoSender = senders.find(s => s.track?.kind === 'video');

    if (videoSender) {
      await videoSender.replaceTrack(screenTrack);
    }

    screenTrack.onended = async () => {
      const cameraTrack = localStream?.getVideoTracks()[0];
      if (cameraTrack && videoSender) {
        await videoSender.replaceTrack(cameraTrack);
      }
    };
  } catch (error) {
    console.error('Screen share failed:', error);
    setStatus('Screen share failed');
  }
}

async function startCall() {
  try {
    setStatus('Initializing...');

    await ensureLocalStream();
    isCaller = true;
    createPeerConnection();

    const callIdFromUrl = getCallIdFromUrl();
    const newRoomId = callIdFromUrl || generateRandomId();
    setCallId(newRoomId);

    roomDocRef = doc(db, 'videoCalls', roomId);
    callerCandidatesRef = collection(roomDocRef, 'callerCandidates');
    calleeCandidatesRef = collection(roomDocRef, 'calleeCandidates');

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Write offer to Firestore
    try {
      await setDoc(roomDocRef, {
        createdAt: serverTimestamp(),
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      });
      console.log('Call Room created with ID:', roomId);
    } catch (firestoreError) {
      console.error('Error writing offer to Firestore:', firestoreError);
      throw new Error('Failed to create call room: ' + firestoreError.message);
    }

    // Notify doctor of incoming call
    if (appointmentId) {
      try {
        const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
        if (appointmentDoc.exists()) {
          const appointment = appointmentDoc.data();
          const patientId = appointment.patientId;
          const doctorId = appointment.doctorId;

          // Get patient name
          const patientDoc = await getDoc(doc(db, 'users', patientId));
          const patientName = patientDoc.exists() ? (patientDoc.data().name || 'Patient') : 'Patient';

          // Write incoming call notification
          await setDoc(doc(db, 'incomingCalls', roomId), {
            callId: roomId,
            patientId,
            doctorId,
            patientName,
            appointmentId,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error creating incoming call notification:', error);
      }
    } else if (doctorId) {
      // Handle direct call without appointment
      try {
        // Get patient name from localStorage or database
        let patientName = localStorage.getItem('patientName') || 'Patient';
        if (!patientName || patientName === 'Patient') {
          try {
            const patientDoc = await getDoc(doc(db, 'users', patientId));
            patientName = patientDoc.exists() ? (patientDoc.data().name || 'Patient') : 'Patient';
          } catch (e) {
            console.log('Could not fetch patient name:', e);
          }
        }

        // Write incoming call notification for direct call
        await setDoc(doc(db, 'incomingCalls', roomId), {
          callId: roomId,
          patientId,
          doctorId,
          patientName,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error creating incoming call notification for direct call:', error);
      }
    }

    const remoteLabelEl = document.getElementById('remoteLabel');
    if (remoteLabelEl) remoteLabelEl.textContent = 'Doctor (Remote)';

    setStatus('Waiting for doctor to join...');
    enableCallButtons(true);

    // Listen for answer
    unsubscribeRoom = onSnapshot(roomDocRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (!peerConnection.currentRemoteDescription && data.answer) {
        const answer = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(answer).catch(err => console.error(err));
      }
    });

    // Listen for remote ICE candidates from doctor
    unsubscribeCalleeCandidates = onSnapshot(calleeCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
            console.error('Error adding received candidate:', err);
          });
        }
      });
    });
  } catch (err) {
    console.error('Error starting call:', err);
    alert('Unable to start call. Check camera permissions and network connection.');
    setStatus('Error starting call');
  }
}

async function joinCall() {
  try {
    setStatus('Joining call...');

    await ensureLocalStream();
    createPeerConnection();

    isCaller = false;

    const callIdFromUrl = getCallIdFromUrl();
    if (!callIdFromUrl) {
      const enteredId = prompt('Enter Call ID:');
      if (!enteredId) {
        setStatus('Join cancelled');
        return;
      }
      setCallId(enteredId.trim());
    }

    roomDocRef = doc(db, 'videoCalls', roomId);
    
    let callSnapshot;
    try {
      callSnapshot = await getDoc(roomDocRef);
    } catch (error) {
      console.error('Error fetching call room:', error);
      throw new Error('Failed to connect to call room: ' + error.message);
    }

    if (!callSnapshot.exists()) {
      alert('Call not found. Make sure the Call ID is correct.');
      setStatus('Call not found');
      return;
    }

    const callData = callSnapshot.data();
    if (!callData.offer) {
      alert('No offer found in this call. Please ask the patient to start the call first.');
      setStatus('No offer found');
      return;
    }

    // Listen for new caller ICE candidates
    callerCandidatesRef = collection(roomDocRef, 'callerCandidates');
    unsubscribeCallerCandidates = onSnapshot(callerCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
            console.error('Error adding caller candidate:', err);
          });
        }
      });
    });

    // Set remote description to the received offer
    const offerDesc = new RTCSessionDescription(callData.offer);
    await peerConnection.setRemoteDescription(offerDesc);

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Save answer to Firestore
    await updateDoc(roomDocRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      }
    });

    // Listen for remote ICE candidates from caller
    calleeCandidatesRef = collection(roomDocRef, 'calleeCandidates');
    unsubscribeCalleeCandidates = onSnapshot(calleeCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
            console.error('Error adding callee candidate:', err);
          });
        }
      });
    });

    const remoteLabelEl = document.getElementById('remoteLabel');
    if (remoteLabelEl) remoteLabelEl.textContent = 'Patient (Remote)';

    setStatus('Connected');
    enableCallButtons(true);
  } catch (err) {
    console.error('Error joining call:', err);
    alert('Unable to join call. Make sure the Call ID is correct and that the patient started the call.');
    setStatus('Error joining call');
  }
}

function enableCallButtons(inCall) {
  const disabled = !inCall;
  startBtn.disabled = inCall;
  joinBtn.disabled = inCall;
  endBtn.disabled = !inCall;

  startBtn.classList.toggle('disabled', inCall);
  joinBtn.classList.toggle('disabled', inCall);
  endBtn.classList.toggle('disabled', !inCall);
}

async function endCall() {
  try {
    setStatus('Ending call...');
    stopDurationTimer();

    if (unsubscribeRoom) {
      unsubscribeRoom();
      unsubscribeRoom = null;
    }
    if (unsubscribeCallerCandidates) {
      unsubscribeCallerCandidates();
      unsubscribeCallerCandidates = null;
    }
    if (unsubscribeCalleeCandidates) {
      unsubscribeCalleeCandidates();
      unsubscribeCalleeCandidates = null;
    }

    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }

    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      remoteStream = null;
    }

    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;

    enableCallButtons(false);
    setCallId(null);
    setStatus('Call ended');

    // Remove incoming call notification
    if (roomId) {
      try {
        await deleteDoc(doc(db, 'incomingCalls', roomId));
      } catch (error) {
        console.warn('Error removing incoming call notification:', error);
      }
    }

    // Optionally cleanup Firestore data (uncomment if you want to delete the room when call ends)
    // await cleanupRoom();
  } catch (err) {
    console.error('Error ending call:', err);
  }
}

async function cleanupRoom() {
  if (!roomDocRef) return;
  try {
    // Delete candidates
    const deleteCollection = async (colRef) => {
      const snapshot = await getDocs(colRef);
      const deletions = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletions);
    };

    await deleteCollection(callerCandidatesRef);
    await deleteCollection(calleeCandidatesRef);
    await deleteDoc(roomDocRef);
  } catch (error) {
    console.warn('Failed to cleanup call room:', error);
  }
}

function setupUI() {
  // Validate all UI elements exist
  const requiredElements = {
    localVideo, remoteVideo, statusEl, callIdEl,
    startBtn, joinBtn, endBtn, micBtn, cameraBtn,
    screenBtn, messageInput, sendMessageBtn, chatBox
  };

  const missingElements = Object.entries(requiredElements)
    .filter(([key, el]) => !el)
    .map(([key]) => key);

  if (missingElements.length > 0) {
    console.warn('Missing UI elements:', missingElements);
  }

  if (startBtn) startBtn.addEventListener('click', startCall);
  if (joinBtn) joinBtn.addEventListener('click', joinCall);
  if (endBtn) endBtn.addEventListener('click', endCall);

  if (micBtn) micBtn.addEventListener('click', toggleMic);
  if (cameraBtn) cameraBtn.addEventListener('click', toggleCamera);
  if (screenBtn) screenBtn.addEventListener('click', shareScreen);

  if (sendMessageBtn) sendMessageBtn.addEventListener('click', sendMessage);
  if (messageInput) messageInput.addEventListener('keydown', handleMessageKeypress);

  // Auto-join when there is an ID in the URL
  const existingId = getCallIdFromUrl();
  if (existingId) {
    setCallId(existingId);
  }

  enableCallButtons(false);

  // Handle page unload
  window.addEventListener('beforeunload', (event) => {
    if (peerConnection && peerConnection.connectionState !== 'closed') {
      event.preventDefault();
      event.returnValue = '';
      endCall().catch(err => console.error('Error ending call on unload:', err));
    }
  });
}

setupUI();
