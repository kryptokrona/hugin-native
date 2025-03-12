import {
    mediaDevices,
    RTCPeerConnection,
    RTCView,
    RTCIceCandidate,
    RTCSessionDescription,
    processCandidates
  } from 'react-native-webrtc';

const active_connections = [];

import { Rooms } from 'lib/native';

export async function add_answer(data) {

    const address = data.address;

    const peerConnection = active_connections.find(a => a.address === address);

    console.log('peerConnection to add answer to:', peerConnection);

    const offerDescription = new RTCSessionDescription( data.data );
	await peerConnection.peerConnection.setRemoteDescription( offerDescription );

    processCandidates();

}

export async function connect_to_peer(key, topic, address) {

let mediaConstraints = {
    audio: true,
    video: false
};

let localMediaStream;
let remoteMediaStream;
let isVoiceOnly = true;

let sessionConstraints = {
    mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
        VoiceActivityDetection: true
    }
};

try {
    const mediaStream = await mediaDevices.getUserMedia( mediaConstraints );

    console.log('mediaStream', mediaStream);

    if ( isVoiceOnly ) {
        // let videoTrack = await mediaStream.getVideoTracks()[ 0 ];
        // videoTrack.enabled = false;
    };

    localMediaStream = mediaStream;
} catch( err ) {
    // Handle Error
    console.log('Error getting media: ', err);
};

let peerConstraints = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

let peerConnection = new RTCPeerConnection( peerConstraints );

active_connections.push({address, topic, peerConnection});

peerConnection.addEventListener( 'connectionstatechange', event => {
    console.log('connectionstatechange',peerConnection.connectionState)
    switch( peerConnection.connectionState ) {
        case 'closed':
            // You can handle the call being disconnected here.

            break;
    };
} );

peerConnection.addEventListener( 'icecandidate', async event => {
    // When you find a null candidate then there are no more candidates.
    // Gathering of candidates has finished.
    console.log('Ice candidate happened yo');
    if ( !event.candidate ) {

        try {
            const offerDescription = await peerConnection.createOffer( sessionConstraints );
            await peerConnection.setLocalDescription( offerDescription );
        
            console.log('offerDescription', offerDescription);
        
            Rooms.sdp({type: 'offer', key, topic, address, data: offerDescription});
        
            // Send the offerDescription to the other participant.
        } catch( err ) {
            // Handle Errors
        };

        return;


    };

    // Send the event.candidate onto the person you're calling.
    // Keeping to Trickle ICE Standards, you should send the candidates immediately.
} );

peerConnection.addEventListener( 'icecandidateerror', event => {
    // You can ignore some candidate errors.
    // Connections can still be made even when errors occur.
} );

peerConnection.addEventListener( 'iceconnectionstatechange', event => {
    switch( peerConnection.iceConnectionState ) {
        case 'connected':
        case 'completed':
            // You can handle the call being connected here.
            // Like setting the video streams to visible.

            break;
    };
} );

peerConnection.addEventListener( 'negotiationneeded', event => {
    // You can start the offer stages here.
    // Be careful as this event can be called multiple times.
} );

peerConnection.addEventListener( 'signalingstatechange', event => {
    switch( peerConnection.signalingState ) {
        case 'closed':
            // You can handle the call being disconnected here.

            break;
    };
} );

peerConnection.addEventListener( 'track', event => {
    // Grab the remote track from the connected participant.
    remoteMediaStream = remoteMediaStream || new MediaStream();
    remoteMediaStream.addTrack( event.track, remoteMediaStream );
} );

// Add our stream to the peer connection.
localMediaStream.getTracks().forEach( 
    track => peerConnection.addTrack( track, localMediaStream )
);



const offerDescription = await peerConnection.createOffer( sessionConstraints );
await peerConnection.setLocalDescription( offerDescription );


}