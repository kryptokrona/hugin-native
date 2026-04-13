const Corestore = require('corestore');
const Hyperdrive = require('hyperdrive');
const fs = require('bare-fs');
const HyperSwarm = require('hyperswarm-hugin');
const process = require('bare-process');

const MEDIA_TYPES = [
  { file: '.png', type: 'image' },
  { file: '.jpg', type: 'image' },
  { file: '.gif', type: 'image' },
  { file: '.jfif', type: 'image' },
  { file: '.jpeg', type: 'image' },
  { file: '.webp', type: 'image' },
  { file: '.mp4', type: 'video' },
  { file: '.webm', type: 'video' },
  { file: '.avi', type: 'video' },
  { file: '.webp', type: 'video' },
  { file: '.mov', type: 'video' },
  { file: '.wmv', type: 'video' },
  { file: '.mkv', type: 'video' },
  { file: '.mpeg', type: 'video' },
  { file: '.m4a', type: 'audio' },
  { file: '.mp3', type: 'audio' },
  { file: '.wav', type: 'audio' },
];
const { get_new_peer_keys, sleep, check_if_media } = require('./utils.js');
const { Hugin } = require('./account.js');

///Storage module to keep fast access from the bare moduke
//  to forward saved files to others in the group.

// Might need to send data to front end if the front end requests a file.

class HyperStorage {
  constructor() {
    this.drives = [];
    this.limit = 10000000000; //10 gb per session
    this.saved = 0;
    this.beams = [];
    this.downloading = new Set(); // prevents concurrent downloads of same hash
  }

  async load_drive(topic) {
    const userDataDir = Hugin.store;
    const [filesPath, chatPath] = make_directory(userDataDir, topic);
    //Uss RAM instead for temp storage?
    if (this.loaded(topic)) return;
    const fileStore = new Corestore(filesPath);
    console.log('Loaded store path');
    console.log('Loading drive');
    const drive = new Hyperdrive(fileStore);
    this.add(drive, topic, fileStore);
    await drive.ready();
  }

  loaded(topic) {
    if (this.drives.length) {
      if (this.drives.some((a) => a.topic === topic)) return true;
    }
    return false;
  }

  add(drive, topic, store) {
    if (this.loaded(topic)) return;
    console.log('Drive added');
    this.drives.push({ drive, topic, store, peerDrives: new Map(), notifiedFiles: new Set() });
  }

  async purge() {
    for (const a of this.drives) {
      await a.drive.purge();
    }
  }

  async load_files(topic) {
    const drive = this.get_drive(topic);
    if (!drive) return [];
    for await (const entry of drive.entries()) {
    }
  }

  get_drive(topic) {
    const found = this.drives.find((a) => a.topic === topic);
    if (!found) return false;
    return found.drive;
  }

  get_room(topic) {
    return this.drives.find((a) => a.topic === topic);
  }

  get_drive_key(topic) {
    const room = this.get_room(topic);
    if (!room) return null;
    return room.drive.key.toString('hex');
  }

  replicate(conn, topic) {
    const room = this.get_room(topic);
    if (!room) return;
    try {
      room.store.replicate(conn);
      console.log('Corestore replication started for topic', topic);
    } catch (e) {
      console.log('Replicate error', e);
    }
  }

  async add_peer_drive(topic, peerDriveKeyHex, roomKey, dm = false) {
    const room = this.get_room(topic);
    if (!room) return;
    if (room.peerDrives.has(peerDriveKeyHex)) return;
    try {
      const peerDrive = new Hyperdrive(room.store, Buffer.from(peerDriveKeyHex, 'hex'));
      await peerDrive.ready();
      room.peerDrives.set(peerDriveKeyHex, peerDrive);
      console.log('Peer drive added:', peerDriveKeyHex.slice(0, 8));

      const self = this;

      // Startup scan: process entries already replicated from previous sessions
      ;(async () => {
        try {
          for await (const entry of peerDrive.entries()) {
            const meta = entry.value.metadata;
            await self.process_entry(meta, topic, peerDriveKeyHex, roomKey, dm, room);
          }
        } catch (e) {
          console.log('[storage.js] Startup scan error:', e);
        }
      })();

      // Live sync: watch for new entries as they replicate
      ;(async () => {
        try {
          for await (const [current, previous] of peerDrive.watch('/')) {
            for await (const entry of current.diff(previous.version, '/')) {
              if (!entry.left) continue;
              const meta = entry.left.value.metadata;
              await self.process_entry(meta, topic, peerDriveKeyHex, roomKey, dm, room);
            }
          }
        } catch {}
      })();
    } catch (e) {
      console.log('Error adding peer drive', e);
    }
  }

  async process_entry(meta, topic, peerDriveKeyHex, roomKey, dm, room) {
    if (!meta || !meta.hash) return;
    if (Hugin.files.includes(meta.hash)) return;
    if (this.downloading.has(meta.hash)) return;

    const [isMedia, fileType] = check_if_media(meta.fileName, meta.size);
    const autoSync = isMedia && (dm || Hugin.syncImages);

    if (autoSync) {
      console.log('[storage.js] Auto-syncing:', meta.fileName);
      await this.save_from_peer(topic, meta, peerDriveKeyHex, roomKey, dm);
    } else if (!room.notifiedFiles.has(meta.hash)) {
      // Show download button for non-media or when sync is disabled
      room.notifiedFiles.add(meta.hash);
      const remoteFile = {
        fileName: meta.fileName,
        address: meta.address,
        size: meta.size,
        topic,
        key: dm ? meta.address : roomKey,
        chat: meta.address,
        hash: meta.hash,
        name: meta.name,
        time: meta.time,
        driveKey: peerDriveKeyHex,
      };
      if (dm) {
        Hugin.send('remote-dm-file-added', { chat: meta.address, remoteFiles: [remoteFile] });
      } else {
        Hugin.send('room-remote-file-added', { chat: roomKey, remoteFiles: [remoteFile] });
      }
    }
  }

  async save_from_peer(topic, file, peerDriveKeyHex, roomKey, dm = false) {
    if (Hugin.files.includes(file.hash)) return;
    if (this.downloading.has(file.hash)) return;
    this.downloading.add(file.hash);
    const room = this.get_room(topic);
    if (!room) { this.downloading.delete(file.hash); return; }
    const peerDrive = room.peerDrives.get(peerDriveKeyHex);
    if (!peerDrive) { this.downloading.delete(file.hash); return; }
    Hugin.send('downloading', {
      fileName: file.fileName,
      chat: file.address,
      time: file.time,
      size: file.size,
      hash: file.hash,
    });
    try {
      console.log('Fetching file from peer drive:', file.fileName);
      const buf = await peerDrive.get(file.hash, { timeout: 30000 });
      if (!buf) { this.downloading.delete(file.hash); return; }
      if (this.saved + file.size > this.limit) { this.downloading.delete(file.hash); return; }
      this.saved += file.size;
      await room.drive.put(file.hash, buf, {
        metadata: {
          name: file.name,
          topic,
          time: file.time,
          size: file.size,
          hash: file.hash,
          fileName: file.fileName,
          address: file.address,
          signature: file.signature,
          info: 'file-shared',
          type: 'file',
        },
      });
      const filePath = Hugin.downloadDir + '/' + file.fileName;
      let writeOk = false;
      try {
        fs.writeFileSync(filePath, buf);
        writeOk = true;
        console.log('[storage.js] File written to:', filePath);
      } catch (e) {
        console.log('[storage.js] ERROR writing file to downloadDir:', filePath, e);
      }
      if (!writeOk) { this.downloading.delete(file.hash); return; }
      Hugin.files.push(file.hash);
      this.downloading.delete(file.hash);
      Hugin.send('download-file-progress', {
        fileName: file.fileName,
        chat: file.address,
        time: file.time,
        progress: 100,
        hash: file.hash,
      });
      Hugin.send('file-downloaded', {
        fileName: file.fileName,
        hash: file.hash,
        address: file.address,
        name: file.name,
        time: file.time,
        size: file.size,
        topic,
        filePath,
        roomKey,
        dm,
      });
      if (dm) this.done(file, topic, roomKey, dm, filePath);
      console.log('File saved from peer:', file.fileName);
    } catch (e) {
      this.downloading.delete(file.hash);
      console.log('Error saving file from peer:', e);
    }
  }

  done(file, topic, room, dm, filePath) {
    if (!dm) return;
    const [media, fileType] = check_if_media(file.fileName, file.size);
    const message = {
      message: file.fileName,
      address: file.address,
      name: file.name,
      hash: file.hash,
      timestamp: file.time,
      room,
      reply: '',
      sent: false,
      history: false,
      file: {
        fileName: file.fileName,
        address: file.address,
        hash: file.hash,
        timestamp: file.time,
        image: media,
        path: filePath || 'storage',
        topic,
        type: fileType,
      },
      tip: false,
    };
    Hugin.send('dm-file', { message });
  }

  async load_meta(topic) {
    const data = [];
    const drive = this.get_drive(topic);
    if (!drive) return [];
    for await (const entry of drive.entries()) {
      data.push(entry.value.metadata);
    }
    return data;
  }

  async load(hash, topic) {
    const drive = this.get_drive(topic);
    if (!drive) return;
    const file = await drive.get(hash);
    if (file === null) return 'File not found';
    return file;
  }

  async save(
    topic,
    address,
    name,
    hash,
    size,
    time,
    fileName,
    path,
    signature,
    info,
    type,
    downloaded = false,
  ) {
    const drive = this.get_drive(topic);
    if (!drive) return false;
    console.log('****Save file to drive****');
    if (this.saved > this.limit) return false;
    if (downloaded) {
      const [media, fileType] = this.check(size, downloaded, fileName);
      if (!media) return false;
    }
    this.saved = this.saved + size;
    console.log('Saved thus far:', this.saved);
    console.log('Saving bytes:', size);
    try {
      let buf;
      if (!downloaded) {
        buf = await this.read(path);
      } else buf = downloaded;

      if (!buf) return false;
      await drive.put(hash, buf, {
        metadata: {
          name,
          topic,
          time,
          size,
          hash,
          fileName,
          address,
          signature,
          info,
          type,
        },
      });
    } catch (e) {
      return false;
    }
    console.log('Saved file');
    return true;
  }

  async read(path) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      const stream = fs.createReadStream(path);
      stream.on('data', (a) => chunks.push(a));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  }

  check(size, buf, name) {
    if (buf.length > size) return false;
    if (size > this.limit) return false;
    for (const a of MEDIA_TYPES) {
      if (name.toLowerCase().endsWith(a.file)) {
        return [true, a.type];
      }
    }
    return [false];
  }

  async start_beam(upload, key, file, topic, room, dm = false) {
    console.log('----::::::::::----');
    console.log('::::START BEAM::::');
    console.log('----::::::::::----');
    console.log('Key', key);
    const [base_keys, dht_keys, sig] = get_new_peer_keys(key);
    const topicHash = base_keys.publicKey.toString('hex');
    let beam;
    try {
      beam = new HyperSwarm({ maxPeers: 1 }, sig, dht_keys, base_keys);
      const announce = Buffer.alloc(32).fill(topicHash);
      const disc = beam.join(announce, { server: true, client: true });

      beam.on('connection', async (conn, info) => {
        console.log('------BEAM CONNECTED------');
        this.beams.push({ key, beam, conn, topic });
        if (upload) {
          this.upload(conn, file, topic);
        } else {
          await this.download(conn, file, topic, room, dm);
        }
      });

      beam.on('close', () => {
        console.log('** Beam closed **');
      });
      beam.on('error', (e) => {
        console.log('Beam error', e);
        this.close(key);
      });

      process.once('SIGINT', () => {
        this.close(key);
      });

      await disc.flushed();
    } catch (e) {
      console.log('Beam err', e);
    }
  }

  async close(key) {
    const active = this.beams.find((a) => a.key === key);
    await sleep(500);
    active.conn.end();
    await sleep(500);
    await active.beam.leave(Buffer.from(active.topic));
    await active.beam.destroy();
    const filter = this.beams.filter((a) => a.key !== key);
    this.beams = filter;
    console.log('XXXXXXXXXXXXXXX');
    console.log('--BEAM CLOSED--');
    console.log('XXXXXXXXXXXXXXX');
  }

  async upload(conn, file, topic) {
    console.log('***********SEND DATA*****************');
    const send = await this.load(file.hash, topic);
    console.log('Send this file', send);
    const CHUNK_SIZE = 1000000;
    const start = () => {
      if (send.length > CHUNK_SIZE) {
        const chunks = split(send);
        for (const c of chunks) {
          write(c);
        }
      } else write(send);
    };

    function write(chunk) {
      try {
        conn.write(chunk);
      } catch (e) {
        console.log('Error writing data.');
      }
    }

    function split(buf, size = CHUNK_SIZE) {
      let chunks = [];
      for (let i = 0; i < buf.length; i += size) {
        chunks.push(buf.slice(i, i + size));
      }
      return chunks;
    }

    conn.on('data', (data) => {
      if (data.toString() === 'Done') {
        this.close(file.key);
      }
    });

    start();
  }

  async download(beam, file, topic, room, dm) {
    console.log('Download file', file);
    let downloaded = 0;
    const buf = [];
    beam.on('data', async (data) => {
      console.log('*********************');
      console.log('****BEAM DATA INC****');
      console.log('*********************');

      if (data.length < 20) {
        if (data.toString() === 'Start') return;
      }

      console.log('-_-__---___--__--');
      console.log('---DOWNLOADING----');
      console.log('_-_----_---__-_--');

      downloaded += data.length;
      console.log('DONWLOADED', downloaded);
      if (downloaded > file.size) {
        console.log('********Limit! ******');
        return true;
      }
      console.log('Pushin data');
      buf.push(data);
      if (downloaded === file.size) {
        const buffer = Buffer.concat(buf);
        const saved = await this.save(
          topic,
          file.address,
          file.name,
          file.hash,
          file.size,
          file.time,
          file.fileName,
          'storage',
          file.signature,
          'file',
          'file-shared',
          buffer,
        );

        if (!saved) return true;
        const [media, fileType] = this.check(file.size, buffer, file.fileName);
        Hugin.files.push(file.hash);
        ////*******TEMP*********////
        // Wrtite file to normal download path until we fixed bridge stream from bare -> React
        // To load files from storage
        const filePath = Hugin.downloadDir + '/' + file.fileName;
        try {
          // Write buffer to file synchronously
          fs.writeFileSync(filePath, buffer);
          console.log('Buffer written successfully');
        } catch (err) {
          console.error('Error writing buffer to file:', err);
          return true;
        }
        ////*********TEMP********////

        //Not sure if we need this.
        Hugin.send('file-downloaded', file);

        const message = {
          message: file.fileName,
          address: file.address,
          room,
          timestamp: file.time,
          name: file.name,
          reply: '',
          hash: file.hash,
          sent: false,
          history: false, //????
          file: {
            fileName: file.fileName,
            address: file.address,
            hash: file.hash,
            timestamp: file.time,
            image: media,
            path: filePath,
            topic,
            type: fileType,
          }, //FileInfo type
          tip: false,
        };

        if (dm) {
          Hugin.send('dm-file', { message });
          return;
        }

        Hugin.send('swarm-message', { message });
        beam.write('Done');
        this.close(file.key);
      }
    });
  }
}

function make_directory(directory, topic) {
  const storage = `${directory}/corestorage`;
  console.log('bare storage path:', storage);
  if (!fs.existsSync(storage)) {
    fs.mkdirSync(storage, { recursive: true });
  }

  const topicPath = `${storage}/${topic}`;
  if (!fs.existsSync(topicPath)) {
    fs.mkdirSync(topicPath, { recursive: true });
  }

  const filesPath = `${topicPath}/files`;
  if (!fs.existsSync(filesPath)) {
    fs.mkdirSync(filesPath, { recursive: true });
  }

  const chatPath = `${topicPath}/chat`;
  if (!fs.existsSync(chatPath)) {
    fs.mkdirSync(chatPath, { recursive: true });
  }

  return [filesPath, chatPath];
}


const Storage = new HyperStorage();

module.exports = { Storage };
