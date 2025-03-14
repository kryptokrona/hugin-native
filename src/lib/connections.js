import { EventEmitter } from 'bare-events';
import {
  setStoreActiveRoomUsers,
  getActiveRoomUsers,
  useGlobalStore
} from '../services/zustand';

class Connections extends EventEmitter {

  join(peer) {
    console.log('New connection incoming');
    const connected = {
      address: peer.address,
      name: peer.name,
      room: peer.key,
      avatar: peer.avatar,
      online: true,
      voice: peer.voice,
      video: peer.video,
      screenshare: peer.screenshare,
      muted: peer.audioMute,
    };
    if (this.already(peer.address, peer.key)) return;
    const list = this.active();
    list.push(connected);
    this.update(list);
    console.log('New peer connected. Online:', list.length);
    this.change();
  }

  voicestatus(peer) {
    console.log('Voice status changed for ', peer );
    let list = this.active();
    list.some((a) => {
      if (a.address === peer.address) {
        a.voice = peer.voice;
        a.video = peer.video;
        a.screenshare = peer.screenshare;
        a.muted = peer.audioMute;
        console.log('Updated peer: ', a)
      }
    });
    this.update(list);
    this.change();
  }

  left(peer) {
    console.log('Peer disconnected', peer);
    const list = this.active().filter(
      (a) => !(a.address === peer.address && a.room === peer.key),
    );
    this.update(list);
    console.log('Peer disconnected. Still online:', list.length);
    this.change();
  }

  already(address, key) {
    return this.active().some((a) => a.room === key && a.address === address);
  }

  connected(key) {
    return this.active().some((a) => a.room === key);
  }

  update(list) {
    const currentCall = useGlobalStore.getState().currentCall;
    console.log('Currentcall connections', currentCall);
    currentCall.users = list.filter(a => a.room === currentCall.room && a.voice === true);
    useGlobalStore.getState().setCurrentCall({...currentCall});
    setStoreActiveRoomUsers(list);
  }

  active() {
    const users = getActiveRoomUsers();
    return users;
  }

  name(address, name) {
    let list = this.active();
    list.some((a) => {
      if (a.address === address) {
        a.name = name;
      }
    });
    this.update(list);
  }

  change() {
    this.emit('change');
    return true;
  }

}

const Peers = new Connections();

export { Peers };
