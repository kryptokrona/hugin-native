const Corestore = require('corestore');
const Hyperdrive = require('hyperdrive');
const fs = require('bare-fs');
const MEDIA_TYPES = [
  { file: '.png', type: 'image' },
  { file: '.jpg', type: 'image' },
  { file: '.gif', type: 'image' },
  { file: '.jfif', type: 'image' },
  { file: '.jpeg', type: 'image' },
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
const { get_new_peer_keys, sleep } = require('./utils.js');
const Huginbeam = require('huginbeam');
const { Readable } = require('streamx');
const { Hugin } = require('./account.js');

///Storage module to keep fast access from the bare moduke
//  to forward saved files to others in the group.

// Might need to send data to front end if the front end requests a file.

class HyperStorage {
  constructor() {
    this.drives = [];
    this.limit = 100000000; //100 mb per session
    this.saved = 0;
    this.beams = [];
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
    this.add(drive, topic);
    await drive.ready();
  }

  loaded(topic) {
    if (this.drives.length) {
      if (this.drives.some((a) => a.topic === topic)) return true;
    }
    return false;
  }

  add(drive, topic) {
    if (this.loaded(topic)) return;
    console.log('Drive added');
    this.drives.push({ drive, topic });
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

  async start_beam(upload, key, file, topic, room) {
    console.log('----::::::::::----');
    console.log('::::START BEAM::::');
    console.log('----::::::::::----');
    console.log('');
    const [base_keys, dht_keys, sig] = get_new_peer_keys(key);
    const options = { upload, dht_keys, base_keys, sig };
    try {
      const beam = new Huginbeam(key, options);
      this.beam_started(beam, upload, key, topic, file, room);
      beam.write('Start');
      return true;
    } catch (e) {
      console.log('Beam err', e);
      return false;
    }
  }

  async beam_started(beam, upload, key, topic, file, room) {
    console.log('----::::::::::----');
    console.log(':::BEAM STARTED:::');
    console.log('----::::::::::----');
    beam.on('connected', async () => {
      console.log('----:::::::::::::::::::----');
      console.log('------BEAM CONNECTED------');
      console.log('----:::::::::::::::::::----');
      if (upload) {
        this.upload(beam, file, topic);
      } else {
        this.download(beam, file, topic, room);
      }
    });

    const close = async () => {
      console.log('XXXXXXXXXXXXXXX');
      console.log('--BEAM CLOSED--');
      console.log('XXXXXXXXXXXXXXX');
      beam.end();
      await sleep(2000);
      beam.destroy();
    };

    beam.on('close', () => {
      console.log('** Beam closed **');
    });
    beam.on('error', (e) => {
      console.log('Beam error', e);
      close();
    });
  }

  async upload(beam, file, topic) {
    console.log('***********SEND DATA*****************');
    const send = await this.load(file.hash, topic);
    const stream = Readable.from(send);
    stream.on('data', (data) => {
      console.log('Sending data ------>', data);
      try {
        beam.write(data);
      } catch (e) {}
    });
  }

  async download(beam, file, topic, room) {
    console.log('Download file', file);
    beam.on('data', async (data) => {
      console.log('*********************');
      console.log('****BEAM DATA INC****');
      console.log('*********************');

      if (data.length < 20) {
        if (data.toString() === 'Start') return;
      }
      const buf = [];
      let downloaded = 0;
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

        if (!saved) return;
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
          return;
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
        // Todo** test this.
        Hugin.send('swarm-message', { message });
      }
    });
  }
}

function make_directory(directory, topic) {
  //If its the first time we create a core store
  const storage = `${directory}/corestorage`;
  if (!fs.existsSync(storage)) {
    fs.mkdirSync(storage);
  }

  //If its the first time we join this topic
  const topicPath = `${storage}/${topic}`;
  if (!fs.existsSync(topicPath)) {
    fs.mkdirSync(topicPath);
  }

  //Create filedirectory for this topic
  const filesPath = `${topicPath}/files`;
  if (!fs.existsSync(filesPath)) {
    fs.mkdirSync(filesPath);
  }

  //Create chat for this topic
  const chatPath = `${topicPath}/chat`;
  if (!fs.existsSync(chatPath)) {
    fs.mkdirSync(chatPath);
  }

  return [filesPath, chatPath];
}

const Storage = new HyperStorage();

module.exports = { Storage };
