// Doctor Dashboard WebSocket Client
// Receives real-time call notifications from the notification server

let doctorWs = null;
let currentDoctorId = null;

// Connect to notification server
function connectToNotificationServer(doctorId, doctorEmail) {
  return new Promise((resolve) => {
    try {
      const wsUrl = "wss://healify-websocket-server.onrender.com";
      
      doctorWs = new WebSocket(wsUrl);

      doctorWs.onopen = () => {
        console.log('✓ Doctor connected to notification server');
        currentDoctorId = doctorId;
        
        // Register doctor with both ID and email (if available)
        const registerMessage = {
          type: 'register',
          userId: doctorId,
          userType: 'doctor'
        };
        
        // Include email if available for email-based routing
        if (doctorEmail) {
          registerMessage.userEmail = doctorEmail;
        }
        
        doctorWs.send(JSON.stringify(registerMessage));
        
        resolve(true);
      };

      doctorWs.onerror = (error) => {
        console.warn('⚠ WebSocket error:', error);
        resolve(false);
      };

      doctorWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📬 Received from server:', data);

          // Handle incoming call notification
          if (data.type === 'incomingCall') {
            console.log('🔔 NEW INCOMING CALL!', data);
            handleIncomingCallNotification(data);
          }

          // Handle call acceptance confirmation
          if (data.type === 'registered') {
            console.log('✓ Doctor registered successfully');
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      doctorWs.onclose = () => {
        console.log('⚠ Disconnected from notification server');
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          if (currentDoctorId) {
            console.log('Attempting to reconnect...');
            connectToNotificationServer(currentDoctorId, doctorEmail);
          }
        }, 5000);
      };

      // Timeout
      setTimeout(() => resolve(false), 5000);
    } catch (error) {
      console.warn('Connection failed:', error);
      resolve(false);
    }
  });
}

// Handle incoming call notification
function handleIncomingCallNotification(callData) {
  const { patientName, callId, roomName, patientId } = callData;

  console.log('Showing notification for incoming call from:', patientName);
  console.log('Room name:', roomName);

  // 1. Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('📞 Incoming Video Call', {
      body: `${patientName} is calling...`,
      tag: 'incoming-call',
      badge: '🏥',
      requireInteraction: true
    });

    notification.onclick = () => {
      // Redirect to video consultation with room name (use roomName param for exact room match)
      const joinUrl = roomName 
        ? `video-consultation.html?roomName=${encodeURIComponent(roomName)}`
        : `video-consultation.html?id=${callId}`;
      window.location.href = joinUrl;
      notification.close();
    };
  }

  // 2. Audio alert
  playCallSound();

  // 3. Flash page title
  flashPageTitle(`📞 Call from ${patientName}`);

  // 4. Add to incoming calls section if it exists
  updateIncomingCallsUI(callData);
}

// Update incoming calls UI
function updateIncomingCallsUI(callData) {
  const callsList = document.getElementById('callsList');
  if (!callsList) return;

  const { patientName, callId, roomName, patientId } = callData;

  // Create call card
  const callCard = document.createElement('div');
  callCard.className = 'call-item';
  callCard.innerHTML = `
    <p><strong>Patient:</strong> ${patientName}</p>
    <p><strong>Call ID:</strong> ${callId.substring(0, 30)}...</p>
    <button onclick="acceptCallFromNotification('${roomName || callId}', '${patientId}', ${!!roomName})">Accept Call</button>
    <button class="danger" onclick="declineCallFromNotification(this)">Decline</button>
  `;

  callsList.insertBefore(callCard, callsList.firstChild);
}

// Accept call from notification
window.acceptCallFromNotification = function(identifier, patientId, isRoomName) {
  console.log('Accepting call:', identifier);
  const joinUrl = isRoomName
    ? `video-consultation.html?roomName=${encodeURIComponent(identifier)}`
    : `video-consultation.html?id=${identifier}`;
  window.location.href = joinUrl;
};

// Decline call from notification
window.declineCallFromNotification = function(button) {
  const callItem = button.closest('.call-item');
  if (callItem) {
    callItem.remove();
    console.log('Call declined');
  }
};

// Play incoming call sound
function playCallSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    setTimeout(() => {
      try {
        const oscillator2 = audioContext.createOscillator();
        oscillator2.connect(gainNode);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator2.frequency.value = 800;
        oscillator2.type = 'sine';
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        console.log('Audio error:', e);
      }
    }, 600);
  } catch (error) {
    console.log('Audio not available:', error);
  }
}

// Flash page title
function flashPageTitle(title) {
  const originalTitle = document.title;
  let isFlashing = true;
  const flashInterval = setInterval(() => {
    document.title = isFlashing ? title : originalTitle;
    isFlashing = !isFlashing;
  }, 1000);

  setTimeout(() => clearInterval(flashInterval), 30000);
  window.addEventListener('focus', () => {
    clearInterval(flashInterval);
    document.title = originalTitle;
  }, { once: true });
}

// Disconnect on unload
window.addEventListener('beforeunload', () => {
  if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
    doctorWs.close();
  }
});

export { connectToNotificationServer };
