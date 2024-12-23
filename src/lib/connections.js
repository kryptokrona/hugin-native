import { EventEmitter } from 'events';
import {
  setStoreActiveRoomUsers,
  getActiveRoomUsers,
} from '../services/zustand';

class Connections extends EventEmitter {
  join(peer) {
    console.log('New connection incoming');
    const connected = {
      address: peer.address,
      name: peer.name,
      room: peer.key,
      avatar: peer.avatar,
    };
    if (this.already(peer.address, peer.key)) return;
    const list = this.active();
    list.push(connected);
    this.update(list);
    console.log('New peer connected. Online:', list.length);
  }

  left(peer) {
    console.log('Peer disconnected', peer);
    const list = this.active().filter(
      (a) => !(a.address === peer.address && a.room === peer.key),
    );
    this.update(list);
    console.log('Peer disconnected. Still online:', list.length);
  }

  already(address, key) {
    return this.active().some((a) => a.room === key && a.address === address);
  }

  connected(key) {
    return this.active().some((a) => a.room === key);
  }

  update(list) {
    setStoreActiveRoomUsers(list);
  }

  active() {
    const users = getActiveRoomUsers();
    return users;
  }
}

const Peers = new Connections();

export { Peers };
