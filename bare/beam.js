const fs = require('bare-fs');
const Hyperbeam = require('hyperbeam');
const { sleep, random_key } = require('./utils');
const { Hugin } = require('./account');

let active_beams = [];
let localFiles = [];
let remoteFiles = [];
let downloadDirectory;
//STATUS

const new_beam = async (key, chat, send = false) => {
  //The beam is already encrypted. We add Hugin encryption inside.
  return await start_beam(key, chat, false, send);
};

const start_beam = async (
  key,
  chat,
  file = false,
  send,
  group,
  filename,
  size,
) => {
  let beam;
  //Create new or join existing beam
  try {
    if (key === 'new') {
      const random = random_key();
      beam = new Hyperbeam({ random });
      beam.write('Start');
      if (file) {
        file_beam(beam, chat, beam.key, false, group, filename, size);
        return { chat, key: beam.key };
      }
      beam_event(beam, chat, beam.key);
      if (send) {
        return { chat: chat, msg: 'BEAMFILE://' + beam.key };
      }
      return { chat: chat, msg: 'BEAM://' + beam.key };
    } else {
      if (key.length !== 52) {
        return false;
      }
      beam = new Hyperbeam(key);
      if (file) {
        file_beam(beam, chat, key, true, group, filename, size);
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
) => {
  let start = false;
  active_beams.push({ beam, chat, group, key });

  beam.on('data', (data) => {
    if (!start && download) {
      const str = new TextDecoder().decode(data);

      if (group && str === 'Start') {
        download_file(filename, size, chat, key, true);
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
    const str = new TextDecoder().decode(data);
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
    stream.on('done', (a) => {
      console.log('stream done', a);
      console.log('File uploaded');
      console.log('Done!');
      let message = `Uploaded ${fileName}`;
      console.log('------>', message);
    });
  } catch (err) {
    errorMessage('Something went wrong uploading the file');
  }
};

const download_file = async (fileName, size, chat, key, group = false) => {
  const file = remoteFiles.find(
    (a) => a.fileName === fileName && a.chat === chat && a.key === key,
  );
  const active = active_beams.find((a) => a.key === key);
  console.log('active file?', file);
  if (!active) {
    errorMessage("Can't download file, beam no longer active");
    return;
  }
  if (!file) {
    errorMessage('File is no longer shared');
    return;
  }
  try {
    Hugin.send('downloading', { chat, fileName, group, size });
    const downloadPath = downloadDirectory + '/' + fileName;
    const stream = fs.createWriteStream(downloadPath);
    // const progressStream = progress({ length: size, time: 100 });
    // progressStream.on('progress', (progress) => {
    Hugin.send('download-file-progress', {
      chat,
      fileName,
      path: downloadPath,
      progress: 'Started',
    });
    console.log('Downloading  file...');
    // if (progress.percentage === 100) {
    // if (!group) saveMsg(message, chat, false, file.time);

    active.beam.pipe(stream);
    stream.on('done', (a) => {
      let message = `Downloaded ${fileName}`;
      console.log('--------->', message);
      console.log('stream done ');
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

const add_remote_file = async (
  fileName,
  chat,
  size,
  key,
  group = false,
  hash,
  room = false,
  name,
) => {
  const time = Date.now();
  const update = remoteFiles.some(
    (a) => group && a.fileName === fileName && a.chat === chat,
  );
  let file = { chat, fileName, group, key, room, size, time };
  if (update) {
    let updateFile = remoteFiles.find((a) => a.fileName === fileName);
    updateFile.key = key;
  } else {
    remoteFiles.unshift(file);
  }
  console.log('Updated remte', remoteFiles);
  if (update) {
    return;
  }
  if (group) {
    return await add_group_file(
      fileName,
      remoteFiles,
      chat,
      group,
      time,
      hash,
      room,
      name,
    );
  } else {
    Hugin.send('remote-file-added', { chat, remoteFiles });
  }
};

const add_group_file = async (
  fileName,
  remoteFiles,
  chat,
  group,
  time,
  hash,
  room = true,
  name,
) => {
  Hugin.send('room-remote-file-added', { chat, room: group, remoteFiles });
  const message = {
    address: chat,
    channel: 'Room',
    file: true,
    room: group,
    hash: hash,
    message: fileName,
    name: name,
    reply: false,
    sent: false,
    time: time,
  };
  Hugin.send('new-message', message);
  return time;
};

const remote_remote_file = (fileName, chat) => {
  remoteFiles = remoteFiles.filter(
    (x) => x.fileName !== fileName && x.chat === chat,
  );
  Hugin.send('remote-files', { chat, remoteFiles });
};

const start_download = async (downloadDir, file, chat, k) => {
  downloadDirectory = downloadDir;
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
  download_file,
  end_beam,
  new_beam,
  remote_remote_file,
  remove_local_file,
  send_beam_message,
  send_file,
  start_download,
};
