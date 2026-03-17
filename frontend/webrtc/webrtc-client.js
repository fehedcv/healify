// WebRTC Client Library for Healify Video Consultation

class HealifyWebRTC {
    constructor(config = {}) {
        this.config = {
            iceServers: config.iceServers || [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            ...config
        };

        this.localStream = null;
        this.remoteStreams = new Map();
        this.peerConnections = new Map();
        this.dataChannels = new Map();
        this.signalingServer = config.signalingServer || 'ws://localhost:5000';
        
        this.localVideoElement = null;
        this.remoteVideoElement = null;
        
        this.callbacks = {
            onLocalStream: null,
            onRemoteStream: null,
            onError: null,
            onConnectionStateChange: null,
            onMessage: null
        };
    }

    // Initialize local media stream
    async initializeLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            });

            if (this.callbacks.onLocalStream) {
                this.callbacks.onLocalStream(this.localStream);
            }

            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError('Failed to access camera/microphone: ' + error.message);
            }
            throw error;
        }
    }

    // Create peer connection
    createPeerConnection(peerId) {
        const peerConnection = new RTCPeerConnection({
            iceServers: this.config.iceServers
        });

        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log('Remote track received:', event.track.kind);
            
            let remoteStream = this.remoteStreams.get(peerId);
            if (!remoteStream) {
                remoteStream = new MediaStream();
                this.remoteStreams.set(peerId, remoteStream);
                
                if (this.callbacks.onRemoteStream) {
                    this.callbacks.onRemoteStream(remoteStream, peerId);
                }
            }
            
            remoteStream.addTrack(event.track);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    to: peerId
                });
            }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
            
            if (this.callbacks.onConnectionStateChange) {
                this.callbacks.onConnectionStateChange(peerConnection.connectionState, peerId);
            }

            if (peerConnection.connectionState === 'failed') {
                this.handleConnectionFailure(peerId);
            }
        };

        // Create data channel for messaging
        const dataChannel = peerConnection.createDataChannel('chat');
        this.setupDataChannel(peerId, dataChannel);

        // Handle incoming data channels
        peerConnection.ondatachannel = (event) => {
            this.setupDataChannel(peerId, event.channel);
        };

        this.peerConnections.set(peerId, peerConnection);
        return peerConnection;
    }

    // Setup data channel
    setupDataChannel(peerId, dataChannel) {
        dataChannel.onopen = () => {
            console.log('Data channel opened with', peerId);
            this.dataChannels.set(peerId, dataChannel);
        };

        dataChannel.onmessage = (event) => {
            if (this.callbacks.onMessage) {
                this.callbacks.onMessage({
                    from: peerId,
                    message: event.data,
                    timestamp: new Date()
                });
            }
        };

        dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };

        dataChannel.onclose = () => {
            this.dataChannels.delete(peerId);
        };
    }

    // Create and send offer
    async createOffer(peerId) {
        try {
            const peerConnection = this.peerConnections.get(peerId) || 
                                  this.createPeerConnection(peerId);
            
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            this.sendSignalingMessage({
                type: 'offer',
                offer: offer,
                to: peerId
            });

            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError('Failed to create offer: ' + error.message);
            }
        }
    }

    // Create and send answer
    async createAnswer(peerId, offer) {
        try {
            let peerConnection = this.peerConnections.get(peerId);
            
            if (!peerConnection) {
                peerConnection = this.createPeerConnection(peerId);
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.sendSignalingMessage({
                type: 'answer',
                answer: answer,
                to: peerId
            });

            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError('Failed to create answer: ' + error.message);
            }
        }
    }

    // Handle remote offer
    async handleOffer(offer, peerId) {
        try {
            await this.createAnswer(peerId, offer);
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    // Handle remote answer
    async handleAnswer(answer, peerId) {
        try {
            const peerConnection = this.peerConnections.get(peerId);
            if (peerConnection && !peerConnection.currentRemoteDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    // Handle ICE candidate
    async handleIceCandidate(candidate, peerId) {
        try {
            const peerConnection = this.peerConnections.get(peerId);
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    // Send message through data channel
    sendMessage(peerId, message) {
        const dataChannel = this.dataChannels.get(peerId);
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                text: message,
                timestamp: new Date()
            }));
        } else {
            console.warn('Data channel not ready for peer:', peerId);
        }
    }

    // Toggle audio
    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    // Toggle video
    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    // Share screen
    async shareScreen() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false
            });

            const videoTrack = screenStream.getVideoTracks()[0];

            // Replace video track in all peer connections
            for (const [peerId, peerConnection] of this.peerConnections.entries()) {
                const sender = peerConnection.getSenders()
                    .find(s => s.track?.kind === 'video');
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            }

            // Handle screen share stop
            videoTrack.onended = async () => {
                const originalTrack = this.localStream.getVideoTracks()[0];
                
                for (const peerConnection of this.peerConnections.values()) {
                    const sender = peerConnection.getSenders()
                        .find(s => s.track?.kind === 'video');
                    
                    if (sender) {
                        await sender.replaceTrack(originalTrack);
                    }
                }
            };

            return screenStream;
        } catch (error) {
            console.error('Screen share error:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError('Screen share failed: ' + error.message);
            }
        }
    }

    // Close peer connection
    closePeerConnection(peerId) {
        const peerConnection = this.peerConnections.get(peerId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(peerId);
        }

        const remoteStream = this.remoteStreams.get(peerId);
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStreams.delete(peerId);
        }

        const dataChannel = this.dataChannels.get(peerId);
        if (dataChannel) {
            dataChannel.close();
            this.dataChannels.delete(peerId);
        }
    }

    // Close all connections
    closeAll() {
        for (const peerId of this.peerConnections.keys()) {
            this.closePeerConnection(peerId);
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }

    // Handle connection failure with retry
    handleConnectionFailure(peerId) {
        console.warn('Connection failed for peer:', peerId);
        // Implement reconnection logic here
    }

    // Send signaling message (implement with your signaling server)
    sendSignalingMessage(message) {
        // This should be implemented based on your signaling server
        console.log('Sending signaling message:', message);
    }

    // Register callbacks
    on(event, callback) {
        if (this.callbacks.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
            this.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
        }
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealifyWebRTC;
}
