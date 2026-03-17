// WebRTC with Socket.io Integration

class HealifyWebRTCSocket {
    constructor(socketUrl, config = {}) {
        this.socket = io(socketUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        this.webrtc = new HealifyWebRTC(config);
        this.roomId = null;
        this.userId = null;
        this.peers = new Map();

        this.setupSocketListeners();
    }

    // Setup Socket.io listeners
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to signaling server');
        });

        this.socket.on('offer', (data) => {
            this.webrtc.handleOffer(data.offer, data.from);
        });

        this.socket.on('answer', (data) => {
            this.webrtc.handleAnswer(data.answer, data.from);
        });

        this.socket.on('ice-candidate', (data) => {
            this.webrtc.handleIceCandidate(data.candidate, data.from);
        });

        this.socket.on('user-joined', (data) => {
            console.log('User joined:', data.userId);
            this.peers.set(data.userId, data);
            this.webrtc.createOffer(data.userId);
        });

        this.socket.on('user-left', (data) => {
            console.log('User left:', data.userId);
            this.webrtc.closePeerConnection(data.userId);
            this.peers.delete(data.userId);
        });

        this.socket.on('receive-message', (data) => {
            console.log('Message received:', data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from signaling server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    // Join consultation room
    async joinRoom(roomId, userId) {
        this.roomId = roomId;
        this.userId = userId;

        // Initialize local stream
        await this.webrtc.initializeLocalStream();

        // Join room via Socket.io
        this.socket.emit('join-room', roomId, userId, 'video');

        return this.webrtc.localStream;
    }

    // Leave room
    leaveRoom() {
        this.socket.emit('leave-room', this.roomId);
        this.webrtc.closeAll();
        this.peers.clear();
    }

    // Override sendSignalingMessage to use Socket.io
    setupWebRTCSignaling() {
        this.webrtc.sendSignalingMessage = (message) => {
            this.socket.emit(message.type, {
                ...message,
                roomId: this.roomId,
                from: this.userId
            });
        };
    }

    // Send message in consultation
    sendMessage(message) {
        this.socket.emit('send-message', {
            roomId: this.roomId,
            sender: this.userId,
            message: message
        });
    }

    // Get room stats
    getRoomStats() {
        return {
            peers: this.peers.size,
            roomId: this.roomId,
            userId: this.userId,
            connections: this.webrtc.peerConnections.size
        };
    }
}

// Example usage:
/*
const webrtcSocket = new HealifyWebRTCSocket('http://localhost:5000', {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
});

// Join room
await webrtcSocket.joinRoom('consultation-123', 'user-456');

// Setup signaling
webrtcSocket.setupWebRTCSignaling();

// Listen for local stream
webrtcSocket.webrtc.on('LocalStream', (stream) => {
    document.getElementById('localVideo').srcObject = stream;
});

// Listen for remote stream
webrtcSocket.webrtc.on('RemoteStream', (stream, peerId) => {
    document.getElementById('remoteVideo').srcObject = stream;
});

// Send message
webrtcSocket.sendMessage('Hello doctor!');

// Leave room
webrtcSocket.leaveRoom();
*/
