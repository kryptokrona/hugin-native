import NetInfo from '@react-native-community/netinfo';
import { sleep } from '@/utils';
import { Rooms, Beam } from 'lib/native';

class FilesCache {
  constructor() {
    this.files = [];
  }

  update(files) {
    this.files = files;
  }

  all() {
    return this.files;
  }

  new(file) {
    this.files.push(file);
  }
}

class ConnectionType {
  constructor() {
    this.connection = '';
    this.reset = false;
  }

  listen() {
    NetInfo.addEventListener(async (state) => {
      this.check(state.type);
    });
  }

  async check(type) {
    console.log('--------------------');
    console.log('Connection::Changed:', type);
    console.log('Connection::Current:', this.type());
    console.log('--------------------');
    if (this.type() === type) {
      return;
    }
    if (this.changing()) return;
    await this.restart(type);
  }

  update(t) {
    this.connection = t;
  }

  type() {
    return this.connection;
  }

  async restart(type) {
    if (this.type() !== '') {
      this.reset = true;
      Rooms.idle(true, false);
      await sleep(2000)
      Rooms.idle(false, false)
    }
    this.update(type);
    this.done();
  }

  done() {
    this.reset = false;
  }

  changing() {
    return this.reset;
  }
}

class CameraOptions {
  constructor() {
    this.active = false;
  }

  on() {
    this.active = true;
  }

  off() {
    this.active = false;
  }
}

export const Connection = new ConnectionType();
export const Files = new FilesCache();
export const Camera = new CameraOptions();
