import { EventEmitter } from 'bare-events';
import {
  setStoreActiveRoomUsers,
  getActiveRoomUsers,
  useGlobalStore
} from '@/services';
import { Notify } from '../services/utils';
import { User } from '@/types';

class Connections extends EventEmitter {

  join(peer, beam) {
    // console.log('New connection incoming', peer.name);
    const connected = {
      address: peer.address ?? null,
      name: peer.name || "Anonymous",
      room: peer.key,
      avatar: peer.avatar,
      online: true,
      voice: peer.voice,
      video: peer.video,
      screenshare: peer.screenshare,
      muted: peer.audioMute,
      dm: beam
    };
    useGlobalStore.getState().addRoomUser(connected);
    this.change();
  }

  voicestatus(peer) {
    console.log('Voice status changed for ', peer );
    const thisRoomUsers = this.active()[peer.room];
    useGlobalStore.getState().updateRoomUser(peer)

    const peerPreviousCallStatus = false;
    try {
      peerPreviousCallStatus = thisRoomUsers.find(a => a.address == peer.address).voice;
    } catch (e) {

    }

    console.log('State is true?', peerPreviousCallStatus === false && peer.voice === true && useGlobalStore.getState().address !== peer.address)

    if (peerPreviousCallStatus === false && peer.voice === true && useGlobalStore.getState().address !== peer.address ) {
      let roomName;
      let message;
      try {
        roomName = useGlobalStore.getState().rooms.find(room => room.roomKey === peer.room)?.name;
      } catch (e) {
        console.log('Failed to get room name:', e)
      }
      if (!roomName) {
        message = `Has started a call`;
        Notify.new({ name: peer.name, text: message }, true);
      } else {
        message = `Has joined the voice channel${roomName ? ' in ' +roomName : ''}.`;
        Notify.new({ name: peer.name, text: message }, true, {roomKey: peer.room, type: 'roomcall', name: roomName});
      }
      
      
    }

    let list = this.active();
    this.update(list);

  }

  left(peer) {
    // console.log('Peer disconnected', peer.name);
    useGlobalStore.getState().removeRoomUser(peer);
  }

  already(address, key) {
    return this.active().some((a) => a.room === key && a.address === address);
  }

  connected(key) {
    return this.active().some((a) => a.room === key);
  }

  update(list) {
    const currentCall = useGlobalStore.getState().currentCall;

    const thisRoomUsers = list[currentCall.room];

    const voiceUsers = thisRoomUsers.filter(a => a.voice === true);
  
    const updatedTalkingUsers = currentCall.talkingUsers || {};

    for (const user of currentCall.users) {
      const thisUser = voiceUsers.find(a => a.address == user.address);
      if (thisUser) thisUser.connectionStatus = user.connectionStatus;
    }
  
    useGlobalStore.getState().setCurrentCall({
      ...currentCall,
      users: voiceUsers,
      talkingUsers: updatedTalkingUsers,
    });
  
    setStoreActiveRoomUsers(list);
  }

  active() {
    const users = getActiveRoomUsers();
    return users;
  }

  name(address, name) {
    let list = this.active();
    useGlobalStore.getState().setNewName(address, name);
  }

  change() {
    return true;
  }

}

const Peers = new Connections();

export { Peers };
