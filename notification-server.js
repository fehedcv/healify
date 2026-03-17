// WebSocket Notification Server for Healify Video Calls
// Runs on port 3000
// Handles real-time call notifications between patients and doctors

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT||3000;

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Map to store connected doctors: { doctorId: webSocket }
const connectedDoctors = new Map();

// Map to store connected doctors by email: { doctorEmail: webSocket }
const connectedDoctorsByEmail = new Map();

// Map to store connected patients: { patientId: webSocket }
const connectedPatients = new Map();

console.log('🚀 Notification Server starting on port', PORT);

wss.on('connection', (ws) => {
  console.log('✓ New connection established');
  
  let userId = null;
  let userType = null;

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // 1. Doctor/Patient registers themselves
      if (data.type === 'register') {
        userId = data.userId;
        userType = data.userType;
        const userEmail = data.userEmail; // Optional: email for alternative registration
        
        if (userType === 'doctor') {
          connectedDoctors.set(userId, ws);
          // Also register by email if provided
          if (userEmail) {
            connectedDoctorsByEmail.set(userEmail, ws);
            console.log(`✓ Doctor registered: ${userId} (${userEmail})`);
          } else {
            console.log(`✓ Doctor registered: ${userId}`);
          }
          console.log(`  Connected doctors: ${connectedDoctors.size}`);
        } else if (userType === 'patient') {
          connectedPatients.set(userId, ws);
          console.log(`✓ Patient registered: ${userId}`);
        }

        // Send confirmation
        ws.send(JSON.stringify({
          type: 'registered',
          status: 'success'
        }));
      }

      // 2. Patient initiates call - send notification to doctor
      if (data.type === 'initiateCall') {
        const { doctorId, doctorEmail, patientId, patientName, callId, roomName } = data;

        // Try to find doctor by email first (preferred), then by ID
        let doctorWs = null;
        let doctorIdentifier = doctorId;
        
        if (doctorEmail) {
          doctorWs = connectedDoctorsByEmail.get(doctorEmail);
          doctorIdentifier = doctorEmail;
          if (doctorWs) {
            console.log(`📞 Call initiated by patient ${patientName} (${patientId}) to doctor ${doctorEmail}`);
          }
        }
        
        if (!doctorWs && doctorId) {
          doctorWs = connectedDoctors.get(doctorId);
          doctorIdentifier = doctorId;
          console.log(`📞 Call initiated by patient ${patientName} (${patientId}) to doctor ${doctorId}`);
        }
        
        // Check if doctor is connected
        if (doctorWs && doctorWs.readyState === WebSocket.OPEN) {
          // Send notification to doctor
          doctorWs.send(JSON.stringify({
            type: 'incomingCall',
            patientId,
            patientName,
            callId,
            roomName,
            timestamp: new Date().toISOString()
          }));
          console.log(`✓ Notification sent to doctor ${doctorIdentifier}`);
        } else {
          console.log(`⚠ Doctor ${doctorIdentifier} is not connected`);
          // Optionally store for offline delivery
        }
      }

      // 3. Doctor accepts call
      if (data.type === 'acceptCall') {
        const { patientId, callId } = data;
        console.log(`✓ Doctor ${userId} accepted call ${callId}`);
        
        // Notify patient that doctor accepted
        const patientWs = connectedPatients.get(patientId);
        if (patientWs && patientWs.readyState === WebSocket.OPEN) {
          patientWs.send(JSON.stringify({
            type: 'callAccepted',
            doctorId: userId,
            callId
          }));
        }
      }

      // 4. Doctor declines call
      if (data.type === 'declineCall') {
        const { patientId, callId } = data;
        console.log(`✗ Doctor ${userId} declined call ${callId}`);
        
        // Notify patient that doctor declined
        const patientWs = connectedPatients.get(patientId);
        if (patientWs && patientWs.readyState === WebSocket.OPEN) {
          patientWs.send(JSON.stringify({
            type: 'callDeclined',
            doctorId: userId,
            callId
          }));
        }
      }

      // 5. End call
      if (data.type === 'endCall') {
        const { otherUserId, callId } = data;
        console.log(`📵 Call ended: ${callId}`);
        
        const otherWs = userType === 'doctor' 
          ? connectedPatients.get(otherUserId)
          : connectedDoctors.get(otherUserId);
          
        if (otherWs && otherWs.readyState === WebSocket.OPEN) {
          otherWs.send(JSON.stringify({
            type: 'callEnded',
            callId
          }));
        }
      }

    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    if (userType === 'doctor') {
      connectedDoctors.delete(userId);
      
      // Also remove from email map if it was stored there
      for (let [email, doctorWs] of connectedDoctorsByEmail) {
        if (doctorWs === ws) {
          connectedDoctorsByEmail.delete(email);
          console.log(`✗ Doctor disconnected: ${userId} (${email})`);
          break;
        }
      }
      
      console.log(`  Connected doctors: ${connectedDoctors.size}`);
    } else if (userType === 'patient') {
      connectedPatients.delete(userId);
      console.log(`✗ Patient disconnected: ${userId}`);
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n✓ Server running on ws://localhost:${PORT}`);
  console.log('Waiting for connections...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
