import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';

import {
    useGlobalStore
  } from '../zustand';

import { Rooms } from 'lib/native';

import InCallManager from 'react-native-incall-manager';

class VoiceChannel {
  constructor() {
    this.connections = [];
    this.stunServers = {
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:global.stun.twilio.com:3478',
          ],
        },
      ],
      iceTransportPolicy: "all",
      sdpSemantics: 'unified-plan',
      trickle: false
    };
    this.settings = {
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true,
        VoiceActivityDetection: true,
      },
    };
    this.localMediaStream = null;
  }

  async init(video=false) {
     //TODO***
    //If we have active video during the call, if someone joins, we should set vidoe = true
    const mediaConstraints = { audio: true, video };

    try {
      this.localMediaStream = await mediaDevices.getUserMedia(mediaConstraints);
    } catch (error) {
      console.error('Error getting media:', error);
      return;
    }
    InCallManager.stop();
    InCallManager.start({ media: 'audio/video', auto: true});
    InCallManager.setSpeakerphoneOn(true);

  }

  async exit() {
    InCallManager.stop();
    for (const con of this.connections) {
      try {
        con.peerConnection.close();
      } catch (e) {
        console.log('Error closing connection');
      }
    }
  }

  forceOpus(sdp) {
    return sdp.replace(/a=rtpmap:\d+ AAC\/\d+\r\n/g, '') // Remove AAC
              .replace(/a=rtpmap:\d+ G722\/\d+\r\n/g, '') // Remove G.722 if present
              .replace(/a=rtpmap:\d+ PCMU\/\d+\r\n/g, '') // Remove G.711 if needed
              .replace(/a=rtpmap:\d+ PCMA\/\d+\r\n/g, '') // Remove PCMA
              .replace(/a=rtpmap:\d+ red\/\d+\/\d+\r\n/g, '') // Remove red
              .replace(/a=fmtp:\d+ .*\r\n/g, '') // Remove fmtp lines for removed codecs
              .replace(/a=rtpmap:\d+ ILBC\/\d+\r\n/g, '') // Remove PCMA
              .replace(/a=rtpmap:\d+ CN\/\d+\r\n/g, '') // Remove PCMA
              .replace(/^a=ice-options:.*\r\n/m, '');
}

  close(address) {
    const conn = this.active(address);
    if (!conn) return;
    try {
      conn.peerConnection.close();
    } catch (e) {
      console.log('Error closing connection');
    }
  }

  active(address) {
    return this.connections.find((conn) => conn.address === address);
  }

  async callback(answer) {
    const { address, data } = answer;
    const connection = this.active(address);

    if (connection) {
      console.log('Adding answer to connection:', connection);
      const remote = new RTCSessionDescription(data);
      await connection.peerConnection.setRemoteDescription(data);
      // processCandidates();
    } else {
      console.log('No connection found for address:', address);
    }
  }

  async call(key, topic, address) {
    //Always join voice as video : false
    if (!this.localMediaStream) await this.init();

    const peerConnection = new RTCPeerConnection(this.stunServers);
    this.connections.push({ address, topic, peerConnection });

    this.localMediaStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, this.localMediaStream));

    this.events(peerConnection, key, topic, address, 'offer');

    await peerConnection.createDataChannel('HuginDataChannel');

    const offer = await peerConnection.createOffer(this.settings);
    await peerConnection.setLocalDescription(offer);
  }

  async answer(offer) {
    const { key, topic, address, data } = offer;
   
    if (!this.localMediaStream) await this.init();

    const peerConnection = new RTCPeerConnection(this.stunServers);
    this.connections.push({ address, topic, peerConnection });

    this.localMediaStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, this.localMediaStream));

    this.events(peerConnection, key, topic, address, 'answer');

    const remoteDescription = new RTCSessionDescription(data);
    await peerConnection.setRemoteDescription(remoteDescription);
    try {
      const answer = await peerConnection.createAnswer(this.settings);
      await peerConnection.setLocalDescription(answer);
      Rooms.sdp({ type: 'answer', key, topic, address, data: answer });
    } catch (e) {
      console.log('Failed to create answer: ', e);
    }
  }

  events(peerConnection, key, topic, address, type) {
    let remoteMediaStream;

    peerConnection.addEventListener('connectionstatechange', () => {
      console.log('Connection state changed:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'closed') {
        this.remove(address);
      }
      if (peerConnection.connectionState === 'connected') this.peervolume(address);
    });

    peerConnection.addEventListener('icecandidate', async (event) => {
      if (!event.candidate) {
        try {
          if (type === 'offer') {
            let offer = await peerConnection.createOffer(this.settings);
            offer = new RTCSessionDescription({type: 'offer', sdp: this.forceOpus(offer.sdp)});   
            await peerConnection.setLocalDescription(offer);

            //Send to backend
            Rooms.sdp({
              type,
              key,
              topic,
              address,
              data: offer,
            });
          }
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      }
    });

    peerConnection.addEventListener('icecandidateerror', (event) => {
      console.warn('ICE candidate error:', event);
    });

    peerConnection.addEventListener('iceconnectionstatechange', () => {
      if (
        ['connected', 'completed'].includes(peerConnection.iceConnectionState)
      ) {
        console.log('ICE connection established');
      }
    });

    peerConnection.addEventListener('signalingstatechange', () => {
      console.log('Signaling state changed: ', peerConnection.signalingState);
      if (peerConnection.signalingState === 'closed') {
        this.remove(address);
      }
    });

    peerConnection.addEventListener('track', (event) => {
      remoteMediaStream = remoteMediaStream || new MediaStream();
      remoteMediaStream.addTrack(event.track);
    });
  }

  remove(address) {
    this.close(address);
    const filter = this.connections.filter((conn) => conn.address !== address);
    this.connections = filter;
    console.log('Still connected in call:', this.connections.length);
  }

  peervolume(address) {

    let interval;
        let array = new Array(3);
        let peer = this.active(address);

        const sensitivity = 0.01;

        interval = setInterval(getAudioLevel, 300);

        const getRemoteAudioLevel = async (peerConnection) => {

            if (!peerConnection) return;
          
            const senders = peerConnection.getSenders();
            const receivers = peerConnection.getReceivers();
          
            for (const receiver of receivers) {
              const track = receiver.track;
              
              if (track && track.kind === 'audio') {
                try {
                  const stats = await peerConnection.getStats(track);
                  
                  stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                      array.push(report.audioLevel);
                    return report.audioLevel;
                    }
                  });
          
                } catch (error) {
                  console.error('Error getting stats:', error);
                }
              }
            }
          };
        
        async function getAudioLevel() {
            const currentCall = useGlobalStore.getState().currentCall;
            if (currentCall.users.some((a) => a.address == address)) {
                await getRemoteAudioLevel(peer.peerConnection);
                
                const talking = array.some((volume) => volume > sensitivity);

                useGlobalStore.getState().setCurrentCall({...currentCall});

                currentCall.users.find(a => a.address === address).talking = talking;
                
                array.shift()
            } else {
                clearInterval(interval)
            }
  }
  }    

}

export const WebRTC = new VoiceChannel();
