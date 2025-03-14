import {
    mediaDevices,
    RTCPeerConnection,
    RTCSessionDescription,
    processCandidates
} from 'react-native-webrtc';

import { Rooms } from 'lib/native';

class PeerConnectionManager {
    constructor() {
        this.activeConnections = [];
    }

    async endCall() {

        for (const con in this.activeConnections) {
            this.activeConnections[con].peerConnection.close();
        }

    }

    async addAnswer(data) {
        const { address, data: sessionData } = data;
        const connection = this.activeConnections.find(conn => conn.address === address);

        if (connection) {
            console.log('Adding answer to connection:', connection);
            const remoteDescription = new RTCSessionDescription(sessionData);
            await connection.peerConnection.setRemoteDescription(remoteDescription);
            // processCandidates();
        } else {
            console.log('No connection found for address:', address);
        }
    }

    async connectToPeer(key, topic, address) {
        const mediaConstraints = { audio: true, video: false };
        const sessionConstraints = {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true,
                VoiceActivityDetection: true
            }
        };

        let localMediaStream;
        let remoteMediaStream;

        try {
            localMediaStream = await mediaDevices.getUserMedia(mediaConstraints);
            console.log('Local media stream:', localMediaStream);
        } catch (error) {
            console.error('Error getting media:', error);
            return;
        }

        const peerConstraints = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };

        const peerConnection = new RTCPeerConnection(peerConstraints);
        this.activeConnections.push({ address, topic, peerConnection });

        this.setupPeerConnectionListeners(peerConnection, key, topic, address, sessionConstraints, remoteMediaStream, 'offer');

        localMediaStream.getTracks().forEach(track => peerConnection.addTrack(track, localMediaStream));

        const offerDescription = await peerConnection.createOffer(sessionConstraints);
        await peerConnection.setLocalDescription(offerDescription);
    }

    async answerToPeer(offer) {

        const { key, topic, address, data } = offer;

        const mediaConstraints = { audio: true, video: false };
        const sessionConstraints = {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true,
                VoiceActivityDetection: true
            }
        };

        let localMediaStream;
        let remoteMediaStream;

        try {
            localMediaStream = await mediaDevices.getUserMedia(mediaConstraints);
            console.log('Local media stream:', localMediaStream);
        } catch (error) {
            console.error('Error getting media:', error);
            return;
        }

        const peerConstraints = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };

        const peerConnection = new RTCPeerConnection(peerConstraints);
        this.activeConnections.push({ address, topic, peerConnection });

        this.setupPeerConnectionListeners(peerConnection, key, topic, address, sessionConstraints, remoteMediaStream, 'answer');

        localMediaStream.getTracks().forEach(track => peerConnection.addTrack(track, localMediaStream));

        const remoteDescription = new RTCSessionDescription(data);
        await peerConnection.setRemoteDescription(remoteDescription);
        try {

            const offerDescription = await peerConnection.createAnswer(sessionConstraints);
            await peerConnection.setLocalDescription(offerDescription);
            console.log('Sending SDP: ', offerDescription)
            Rooms.sdp({ type: 'answer', key, topic, address, data: offerDescription });

        } catch (e) {
            console.log('Failed to create answer: ', e)
        }

    }

    setupPeerConnectionListeners(peerConnection, key, topic, address, sessionConstraints, remoteMediaStream, type) {
        peerConnection.addEventListener('connectionstatechange', () => {
            console.log('Connection state changed:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'closed') {
                this.cleanupConnection(address);
            }
        });

        peerConnection.addEventListener('icecandidate', async event => {
            if (!event.candidate) {
                try {
                    if (type === 'offer') {
                        const offerDescription = await peerConnection.createOffer(sessionConstraints);

                        await peerConnection.setLocalDescription(offerDescription);
                        console.log('Sending SDP: ', offerDescription)
                        Rooms.sdp({ type: type == 'offer' ? 'offer' : 'answer', key, topic, address, data: offerDescription });
                    }
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            }
        });

        peerConnection.addEventListener('icecandidateerror', event => {
            console.warn('ICE candidate error:', event);
        });

        peerConnection.addEventListener('iceconnectionstatechange', () => {
            if (['connected', 'completed'].includes(peerConnection.iceConnectionState)) {
                console.log('ICE connection established');
            }
        });

        peerConnection.addEventListener('signalingstatechange', () => {
            console.log('Signaling state changed: ', peerConnection.signalingState);
            if (peerConnection.signalingState === 'closed') {
                this.cleanupConnection(address);
            }
        });

        peerConnection.addEventListener('track', event => {
            remoteMediaStream = remoteMediaStream || new MediaStream();
            remoteMediaStream.addTrack(event.track);
        });
    }

    cleanupConnection(address) {
        const index = this.activeConnections.findIndex(conn => conn.address === address);
        if (index !== -1) {
            this.activeConnections.splice(index, 1);
            console.log('Connection cleaned up for address:', address);
        }
    }
}

export const WebRTC = new PeerConnectionManager();
