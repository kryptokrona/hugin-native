const fs = require('bare-fs');
const Huginbeam = require('huginbeam');
const {
  sleep,
  random_key,
  check_if_media,
  get_new_peer_keys,
} = require('./utils');
const { Hugin } = require('./account');

let active_beams = [];
let localFiles = [];
let remoteFiles = [];
//STATUS

const new_beam = async (key, chat, upload = false) => {
  //The beam is already encrypted. We add Hugin encryption inside.
  return await start_beam(key, chat, false, upload);
};

const start_beam = async (
  key,
  chat,
  file = false,
  upload,
  group,
  filename,
  size,
  room,
) => {
  let beam;
  //Create new or join beam
  const beamKey = key === 'new' ? random_key().toString('hex') : key;
  const [base_keys, dht_keys, sig] = get_new_peer_keys(beamKey);
  const options = { upload, dht_keys, base_keys, sig };
  try {
    //START A NEW BEAM
    if (key === 'new') {
      beam = new Huginbeam(beamKey, options);
      beam.write('Start');
      if (file) {
        file_beam(beam, chat, beam.key, false, group, filename, size, room);
        return { chat, key: beam.key };
      }
      beam_event(beam, chat, beam.key);
      if (upload) {
        //Send a request to start sharing files.
        return { chat: chat, msg: 'BEAMFILE://' + beam.key };
      }
      //Send a request to start a p2p session.
      return { chat: chat, msg: 'BEAM://' + beam.key };
    } else {
      //JOIN
      if (key.length > 64) {
        return false;
      }
      beam = new Huginbeam(beamKey, options);
      if (file) {
        file_beam(beam, chat, key, true, group, filename, size, room);
        return true;
      }
      beam_event(beam, chat, key);
      return false;
    }
  } catch (e) {
    console.log('Beam DHT error', e);
    errorMessage('Failed to start beam');
    Hugin.send('stop-beam', chat);
    return 'Error';
  }
};

const file_beam = (
  beam,
  chat,
  key,
  download = false,
  group = false,
  filename,
  size,
  room,
) => {
  let start = false;
  active_beams.push({ beam, chat, group, key });

  beam.on('data', (data) => {
    if (!start && download) {
      const str = data.toString();

      if (group && str === 'Start') {
        download_file(filename, size, chat, key, room);
        start = true;
        return;
      }

      if (!group && str === 'Start') {
        start = true;
        request_download(chat, key);
        return;
      }
    }
  });

  beam.on('error', function (e) {
    console.log('Beam error', e);
    errorMessage('Beam error, shutting down..');
    end_file_beam(chat, key);
  });

  beam.on('end', () => {
    console.log('File sent, end event');
    end_file_beam(chat, key);
  });
};

const beam_event = (beam, chat, key) => {
  const addr = chat.substring(0, 99);
  active_beams.push({ beam, chat: addr, key });
  Hugin.send('new-beam', { chat: addr, key });
  beam.on('remote-address', function ({ host, port }) {
    if (!host) {
      console.log('Could not find the host');
    } else {
      console.log('Connected to DHT with' + host + ':' + port);
    }
    if (port) {
      console.log('Connection ready');
    }
  });

  beam.on('connected', function () {
    console.log('Beam connected to peer');
    check_if_online(addr);
    Hugin.send('beam-connected', [addr, beam.key]);
  });

  //Incoming message
  beam.on('data', (data) => {
    const str = data.toString();
    if (str === 'Start') {
      return;
    }
    if (str === 'Ping') {
      return;
    }
    if (check_data_message(str, addr)) {
      return;
    }
  });

  beam.on('end', () => {
    console.log('Chat beam ended on event');
  });

  beam.on('error', function (e) {
    console.log('error', e);
    console.log('Beam error');
    end_beam(addr);
  });

  process.once('SIGINT', () => {
    if (!beam.connected) {
      closeASAP();
    } else {
      beam.end();
    }
  });

  function closeASAP() {
    console.error('Shutting down beam...');
    const timeout = setTimeout(() => process.exit(1), 2000);
    beam.destroy();
    beam.on('close', function () {
      clearTimeout(timeout);
    });
  }
};

const send_beam_message = (message, to) => {
  const active = active_beams.find((a) => a.chat === to);
  active.beam.write(message);
};

const end_file_beam = async (chat, key) => {
  const file = active_beams.find((a) => a.chat === chat && a.key === key);
  if (!file) {
    return;
  }
  file.beam.end();
  await sleep(2000);
  file.beam.destroy();
  const filter = active_beams.filter((a) => a.key !== file.key);
  console.log('File beams cleared', filter);
  active_beams = filter;
};

const end_beam = async (chat) => {
  const active = active_beams.find((a) => a.chat === chat);
  if (!active) {
    return;
  }
  Hugin.send('stop-beam', chat);
  active.beam.end();
  await sleep(2000);
  active.beam.destroy();
  const filter = active_beams.filter((a) => a.chat !== chat);
  active_beams = filter;
  console.log('Active beams', active_beams);
};

const check_if_online = (addr) => {
  const interval = setInterval(ping, 10 * 1000);
  function ping() {
    let active = active_beams.find((a) => a.chat === addr);
    if (!active) {
      clearInterval(interval);
      return;
    } else {
      active.beam.write('Ping');
    }
  }
};

const send_file = async (fileName, size, chat, key, group) => {
  console.log('Sending file!');
  const active = active_beams.find((a) => a.chat === chat && a.key === key);
  const file = localFiles.find(
    (a) => a.fileName === fileName && a.chat === chat && a.key === key,
  );
  if (active.key !== key) {
    return;
  }
  if (!file) {
    errorMessage("Can't find the file, try share it again");
    return;
  }
  if (!active) {
    errorMessage("Can't send file, beam no longer active");
    return;
  }
  try {
    console.log('Upload starting....');
    const filePath = file.path;
    const stream = fs.createReadStream(filePath);
    // const progressStream = progress({ length: size, time: 100 });

    // progressStream.on('progress', async (progress) => {
    Hugin.send('upload-file-progress', {
      chat,
      fileName,
      progress: 'Started',
      time: file.time,
    });

    // if (progress.percentage === 100) {
    // if (!group) {
    //   saveMsg(message, chat, true, file.time);
    // }

    //   }
    // });

    stream.pipe(active.beam);
    stream.on('end', (a) => {
      let message = `Uploaded ${fileName}`;
      console.log('------>', message);
    });
  } catch (err) {
    errorMessage('Something went wrong uploading the file');
  }
};

const download_file = async (fileName, size, chat, key, room = false) => {
  const file = remoteFiles.find(
    (a) => a.fileName === fileName && a.chat === chat && a.key === key,
  );
  const active = active_beams.find((a) => a.key === key);
  if (!active) {
    errorMessage("Can't download file, beam no longer active");
    return;
  }
  if (!file) {
    errorMessage('File is no longer shared');
    return;
  }
  try {
    Hugin.send('downloading', { chat, fileName, room, size });
    const downloadPath = Hugin.downloadDir + '/' + fileName;
    const stream = fs.createWriteStream(downloadPath);
    // const progressStream = progress({ length: size, time: 100 });
    // progressStream.on('progress', (progress) => {
    Hugin.send('download-file-progress', {
      chat,
      fileName,
      path: downloadPath,
      progress: 0,
    });
    console.log('Downloading  file...');
    let progress = 0;
    let downloaded = 0;

    active.beam.on('data', (data) => {
      downloaded += data.length;
      console.log('Size:', file.size);
      console.log('Downloaded:', downloaded);
      if (downloaded > file.size) {
        stream.destroy();
        end_file_beam(chat, key);
        errorMessage('Download exceeded file size... Closing connection');
        return;
      }

      progress = (downloaded / file.size) * 100;
      console.log('downloaded percetnts', progress);
      Hugin.send('download-file-progress', {
        chat,
        fileName,
        progress,
        hash: file.hash,
        room,
      });
    });
    active.beam.pipe(stream);
    active.beam.on('end', (a) => {
      const [media, type] = check_if_media(fileName, size);
      if (media) {
        //Only images etc here
        const message = {
          address: chat,
          channel: 'Room',
          room,
          hash: file.hash,
          message: fileName,
          name: 'File shared',
          reply: false,
          sent: false,
          timestamp: file.time,
          history: false,
          file: {
            fileName,
            path: downloadPath,
            timestamp: file.time,
            hash: file.hash,
            sent: false,
            image: true,
            type,
          },
        };
        Hugin.send('swarm-message', { message });
      } else {
        //Some random file here.
        Hugin.send('download-complete', { fileName, room, hash, size, time });
      }
    });
    // });
  } catch (err) {
    errorMessage('Something went wrong downloading the file');
  }
};

const add_local_file = async (
  fileName,
  path,
  chat,
  size,
  time,
  group = false,
) => {
  const active = active_beams.find((a) => a.chat === chat);
  const fileBeam = await start_beam(
    'new',
    chat,
    true,
    true,
    group,
    fileName,
    size,
  );
  const file = {
    chat,
    fileName,
    info: 'file',
    key: fileBeam.key,
    path,
    size,
    time,
    type: 'upload-ready',
  };
  localFiles.unshift(file);
  Hugin.send('local-files', { chat, localFiles });
  Hugin.send('uploading', { chat, fileName, size, time });
  await sleep(1000);
  if (group) {
    return fileBeam.key;
  }
  if (!active) {
    return;
  }
  active.beam.write(
    JSON.stringify({
      fileName,
      key: fileBeam.key,
      size,
      type: 'remote-file-added',
    }),
  );
};

const remove_local_file = (fileName, chat, time) => {
  const active = active_beams.find((a) => a.chat === chat);
  localFiles = localFiles.filter(
    (x) => x.fileName !== fileName && x.time !== time,
  );
  Hugin.send('local-files', { chat, localFiles });
  if (!active) {
    errorMessage('Beam not active');
  }
  active.beam.write(
    JSON.stringify({ chat, fileName, type: 'remote-file-removed' }),
  );
};

const update_remote_file = (fileName, chat, size, key, time) => {
  const update = remoteFiles.find(
    (a) => a.fileName === fileName && a.chat === chat && a.time === time,
  );
  if (update) {
    update.key = key;
  }
};

const add_remote_file = async (
  fileName,
  chat,
  size,
  key,
  room,
  hash,
  name,
  time,
) => {
  file = { fileName, chat, size, time, key, room, hash };
  remoteFiles.unshift(file);
  if (room)
    return await add_group_file(
      fileName,
      remoteFiles,
      chat,
      room,
      time,
      hash,
      name,
      size,
    );
  else Hugin.send('remote-file-added', { remoteFiles, chat });
};

const add_group_file = async (
  fileName,
  remoteFiles,
  chat,
  room,
  time,
  hash,
  name,
  size,
) => {
  Hugin.send('room-remote-file-added', { chat, room, remoteFiles });
  const [media, type] = check_if_media(fileName, size);
  //If its not a image/video type or size out of bounds, return some message info about file.
  if (!media) {
    const message = {
      address: chat,
      channel: 'Room',
      file: true,
      room,
      hash: hash,
      message: fileName,
      name: name,
      reply: false,
      sent: false,
      timestamp: time,
    };
    Hugin.send('swarm-message', { message });
  }
  return time;
};

const remote_remote_file = (fileName, chat) => {
  remoteFiles = remoteFiles.filter(
    (x) => x.fileName !== fileName && x.chat === chat,
  );
  Hugin.send('remote-files', { chat, remoteFiles });
};

const start_download = async (file, chat, k, room) => {
  let download = remoteFiles.find(
    (a) => a.fileName === file && a.chat === chat,
  );
  const key = k ? k : download?.key;
  const group = k ? true : false;
  if (!download) {
    return;
  }
  let downloadBeam = await start_beam(
    key,
    chat,
    true,
    false,
    group,
    file,
    download.size,
    room,
  );
  if (downloadBeam === 'Error') {
    errorMessage('Error creating download beam');
  }
};

const request_download = (chat, key) => {
  let downloadFile = remoteFiles.find((a) => a.key === key && a.chat === chat);
  let active = active_beams.find((a) => a.key !== key && a.chat === chat);
  active.beam.write(
    JSON.stringify({
      fileName: downloadFile.fileName,
      key: downloadFile.key,
      type: 'request-download',
    }),
  );
};

const upload_ready = (file, size, chat, key) => {
  let active = active_beams.find((a) => a.chat === chat && a.key !== key);
  active.beam.write(
    JSON.stringify({
      fileName: file,
      key: key,
      size: size,
      type: 'upload-ready',
    }),
  );
};

const check_data_message = (data, chat) => {
  try {
    data = JSON.parse(data);
  } catch {
    return false;
  }

  let { fileName, size, key } = data;

  if ('type' in data) {
  } else {
    return false;
  }

  if (data.type === 'remote-file-added') {
    add_remote_file(fileName, chat, size, key);
    return true;
  }

  if (data.type === 'remote-file-removed') {
    remote_remote_file(fileName, chat);
    return true;
  }

  if (data.type === 'request-download') {
    let file = localFiles.find(
      (a) => a.fileName === fileName && a.chat === chat && a.key === key,
    );
    if (!file) {
      errorMessage("Can't upload the file");
    }
    if (!file) {
      return true;
    }
    Hugin.send('download-request', fileName);
    console.log('Download request');
    size = file.size;
    upload_ready(fileName, size, chat, key);
    send_file(fileName, size, chat, key);
    return true;
  }

  if (data.type === 'upload-ready') {
    console.log('upload ready!');
    download_file(fileName, size, chat, key);
    return true;
  }

  return false;
};

const errorMessage = (message) => {
  Hugin.send('error-message', { message });
};

module.exports = {
  add_local_file,
  add_remote_file,
  update_remote_file,
  download_file,
  end_beam,
  new_beam,
  remote_remote_file,
  remove_local_file,
  send_beam_message,
  send_file,
  start_download,
};
