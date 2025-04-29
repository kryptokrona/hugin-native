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
    console.log('New connection incoming');
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
    console.log('thisRoomUsers',thisRoomUsers);
    useGlobalStore.getState().updateRoomUser(peer)

    const peerPreviousCallStatus = thisRoomUsers.find(a => a.address == peer.address).voice;

    if (peerPreviousCallStatus === false && peer.voice === true && useGlobalStore.getState().address !== peer.address ) {
      const roomName = useGlobalStore.getState().rooms.find(room => room.roomKey === peer.room)?.name;
      const message = `Has joined the voice channel${roomName ? ' in ' +roomName : ''}.`;
      Notify.new({ name: peer.name, text: message }, true, {roomKey: peer.room, type: 'roomcall', name: roomName});
    }

  }

  left(peer) {
    console.log('Peer disconnected', peer);
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
