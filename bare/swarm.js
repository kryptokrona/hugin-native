const HyperSwarm = require('hyperswarm-hugin');
const { Hugin } = require('./account');
const {
  get_new_peer_keys,
  sanitize_group_message,
  sanitize_join_swarm_data,
  sanitize_voice_status_data,
  random_key,
  toUintArray,
  verify_signature,
  sign_admin_message,
  sanitize_file_message,
  check_if_media,
  sign_joined_message,
  check_hash,
  room_message_exists,
  sign,
  sleep,
} = require('./utils');
const {
  send_file,
  start_download,
  add_remote_file,
  add_local_file,
  update_remote_file,
} = require('./beam');
const { Storage } = require('./storage.js');

const LOCAL_VOICE_STATUS_OFFLINE = {
  voice: false,
  video: false,
  topic: '',
  videoMute: false,
  audioMute: false,
  screenshare: false,
};

const MISSING_MESSAGES = 'missing-messages';
const REQUEST_MESSAGES = 'request-messages';
const REQUEST_HISTORY = 'request-history';
const SEND_HISTORY = 'send-history';
const PING_SYNC = 'Ping';
const REQUEST_FILE = 'request-file';

let active_voice_channel = LOCAL_VOICE_STATUS_OFFLINE;
let active_swarms = [];
let localFiles = [];
class Room {
  constructor(key) {
    this.swarm = {};
    this.time = Date.now();
    this.topic = null;
    this.discovery = null;
  }

  async join(hashkey) {
    //Create a new common keypair for this room from hashed invitelink as seed.
    //The public key of this keypair is used as topic.
    //Connections auth is checked by a signature from the privatekey.
    const invite = toUintArray(hashkey);
    const [base_keys, dht_keys, sig] = get_new_peer_keys(invite);
    const topic = base_keys.publicKey.toString('hex');
    const hash = Buffer.alloc(32).fill(topic);
    await Storage.load_drive(topic);

    console.log('Joining room....');
    try {
      this.swarm = new HyperSwarm({}, sig, dht_keys, base_keys);
    } catch (e) {
      error_message('Error starting swarm');
      return;
    }
    this.swarm.on('connection', (connection, information) => {
      new_connection(connection, topic, this.key, dht_keys, information);
    });

    this.discovery = this.swarm.join(hash, { client: true, server: true });
    this.topic = topic;
    return true;
  }
}

const create_swarm = async (hashkey, key) => {
  console.log('Creating swarm!');
  const room = new Room();
  const connected = await room.join(hashkey);
  if (!connected) return;
  const admin = is_admin(key);
  const files = await Storage.load_meta(room.topic);

  Hugin.send('peer-connected', {
    joined: {
      name: Hugin.name,
      address: Hugin.address,
      key,
      avatar: Hugin.avatar,
    },
  });

  const active = {
    call: [],
    connections: [],
    channels: [],
    voice_channel: [],
    key,
    swarm: room.swarm,
    time: room.time,
    topic: room.topic,
    discovery: room.discovery,
    admin: admin ? true : false,
    search: false,
    buffer: [],
    peers: [],
    requests: 0,
    files,
  };

  active_swarms.push(active);
  Hugin.send('new-swarm', { connected, key, admin });
  check_if_online(room.topic);

  process.once('SIGINT', function () {
    room.swarm.on('close', function () {
      process.exit();
    });
    room.swarm.destroy();
    setTimeout(() => process.exit(), 2000);
  });

  return room.topic;
};

const new_connection = (connection, topic, key, dht_keys, peer) => {
  console.log('New connection incoming');
  let active = get_active_topic(topic);

  if (!active) {
    console.log('no longer active in topic');
    connection_closed(connection, topic, 'New connection error');
    return;
  }

  console.log('*********Got new Connection! ************');
  active.connections.push({
    address: '',
    connection,
    name: '',
    topic,
    video: false,
    voice: false,
    knownHashes: [],
    peer,
    request: true,
    publicKey: peer.publicKey.toString('hex'),
  });
  send_joined_message(topic, dht_keys, connection);
  connection.on('data', async (data) => {
    incoming_message(data, topic, connection, peer);
  });

  connection.on('close', () => {
    console.log('Got close signal');
    connection_closed(connection, topic, 'Connection on close');
  });

  connection.on('error', (e) => {
    console.log('Got error connection signal', e);
    connection_closed(connection, topic, 'Connection on error');
  });
};

function send_message(message, topic, reply, invite, tip = false) {
  const message_json = {
    c: 'channel in room?',
    g: invite,
    hash: random_key().toString('hex'),
    k: Hugin.address,
    m: message,
    n: Hugin.name,
    r: reply,
    s: 'sig',
    t: Date.now(),
    tip, // {amount, sender, receiver, hash}
  };

  const send = JSON.stringify(message_json);
  send_swarm_message(send, topic);
  return message_json;
}

const is_admin = (key) => {
  return Hugin.rooms.find((a) => a.key === key && a.admin)?.admin;
};

const send_joined_message = async (topic, dht_keys, connection) => {
  //Use topic as signed message?
  const msg = topic;
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }

  const admin = is_admin(active.key);
  let sig = '';
  if (admin) {
    sig = sign_admin_message(dht_keys, admin);
  }
  let [voice, video, audioMute, videoMute, screenshare] =
    get_local_voice_status(topic);
  if (video) {
    voice = true;
  }

  const signature = await sign(dht_keys.get().publicKey.toString('hex'));

  const data = JSON.stringify({
    address: Hugin.address,
    channels: [],
    joined: true,
    message: msg,
    name: Hugin.name,
    avatar: Hugin.avatar,
    signature: sig.toString('hex'),
    time: active.time,
    topic: topic,
    video: video,
    voice: voice,
    idSig: signature,
    audioMute,
    videoMute,
    screenshare,
  });

  connection.write(data);
};

const send_swarm_message = (message, topic) => {
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  //Buffer any non sent messages if connection was lost.
  if (active.connections.length === 0) {
    active.buffer.push(message);
    return;
  }
  for (const chat of active.connections) {
    try {
      console.log('Writing to channel');
      chat.connection.write(message);
    } catch (e) {
      continue;
    }
  }

  console.log('Swarm msg sent!');
};

const incoming_message = async (data, topic, connection, peer) => {
  const str = data.toString();
  if (str === 'Ping') {
    return;
  }
  // Check
  const check = await check_data_message(str, connection, topic, peer);
  if (check === 'Ban') {
    console.log('Banned connection');
    peer.ban(true);
    connection_closed(connection, topic, 'Connection banned');
    return;
  }
  if (check === 'Error') {
    connection_closed(connection, topic, 'Connection Error check');
    return;
  }
  if (check) {
    peer.priority = 3;
    return;
  }
  const message = sanitize_group_message(JSON.parse(str));
  if (!message) return;
  message.background = Hugin.idle();
  Hugin.send('swarm-message', { message, topic });
};

const check_data_message = async (data, connection, topic, peer) => {
  try {
    data = JSON.parse(data);
  } catch (e) {
    return 'Ban';
  }

  //Check if active in this topic
  const active = get_active_topic(topic);
  if (!active) {
    return 'Error';
  }

  //Check if this connection is still in our list
  const con = active.connections.find((a) => a.connection === connection);
  if (!con) {
    return 'Error';
  }

  //If the connections send us disconnect message, return. **todo double check closed connection
  if ('type' in data) {
    if (data.type === 'disconnected') {
      connection_closed(connection, active.topic, 'Disconnected');
      return true;
    }
  }

  if ('info' in data) {
    const fileData = sanitize_file_message(data);
    console.log('Got file data incoming', fileData);
    if (!fileData) return 'Ban';
    check_file_message(fileData, topic, con.address, con.name);
    return true;
  }

  // //Double check if connection is joined voice?
  // if ('offer' in data) {
  //     //Check if this connection has voice status activated.
  //     if (active.connections.some(a => a.connection === connection && a.voice === true)) {
  //         const [voice, video] = get_local_voice_status(topic)
  //         if ((!voice && !video) || !voice) {
  //             //We are not connected to a voice channel
  //             //Return true bc we do not need to check it again
  //             return true
  //         }

  //         //There are too many in the voice call
  //         const users = active.connections.filter(a => a.voice === true)
  //         if (users.length > 9) return true

  //             //Joining == offer
  //         if (data.offer === true) {
  //             if ('retry' in data) {
  //                 if (data.retry === true) {
  //                     Hugin.send('got-expanded-voice-channel', [data.data, data.address])
  //                     return
  //                 }
  //             }
  //             answer_call(data)
  //         } else {
  //             got_answer(data)
  //         }
  //     }
  //     return true
  // }

  if (typeof data === 'object') {
    if ('joined' in data) {
      const joined = sanitize_join_swarm_data(data);
      console.log('joined the lobby', joined?.name);
      if (!joined) {
        return 'Ban';
      }

      if (con.joined) {
        //Connection is already joined
        return true;
      }

      if (Hugin.banned(data.address, topic)) {
        if (active.admin) admin_ban_user(data.address, active.key);
        else ban_user(data.address, topic);
      }

      const admin = verify_signature(
        connection.remotePublicKey,
        Buffer.from(data.signature, 'hex'),
        Buffer.from(active.key.slice(-64), 'hex'),
      );

      const verified = await Hugin.request({
        type: 'verify-signature',
        data: {
          message: connection.remotePublicKey.toString('hex'),
          address: joined.address,
          signature: joined.idSig,
        },
      });

      if (!verified) return 'Ban';

      con.joined = true;
      con.address = joined.address;
      con.name = joined.name;
      con.voice = joined.voice;
      con.admin = admin;
      con.video = joined.video;
      joined.key = active.key;
      con.request = true;
      active.peers.push(peer.publicKey.toString('hex'));
      let uniq = {};
      const peers = active.peers.filter(
        (obj) => !uniq[obj] && (uniq[obj] = true),
      );
      active.peers = peers;

      const time = parseInt(joined.time);
      //Request message history from peer connected before us.
      if (parseInt(active.time) > time && active.requests < 1) {
        request_history(joined.address, topic, active.files);
        active.requests++;
      }

      //Send any buffered messages if connection was lost.
      // if (parseInt(active.time) < time && active.buffer.length) {
      //   send_history(joined.address, topic, active.key);
      //   active.buffer = [];
      // }

      //     //If our new connection is also in voice, check who was connected first to decide who creates the offer
      //     const [in_voice, video] = get_local_voice_status(topic)
      //     if (con.voice && in_voice && (parseInt(active.time) > time)  ) {
      //         join_voice_channel(active.key, topic, joined.address)
      //     }
      if (joined.avatar.length > 60000) {
        joined.avatar = '';
      }
      Hugin.send('peer-connected', { joined });
      console.log('Connection updated: Joined:', con.name);
      return true;
    }
  }
  if ('voice' in data) {
    const voice_status = check_peer_voice_status(data, con);
    if (!voice_status) {
      return 'Ban';
    }
    return true;
  }

  if (!con.joined) return 'Error';

  if ('type' in data) {
    if (data.type === 'ban') {
      if (data.address === Hugin.address && con.admin) {
        Hugin.send('banned', active.key);
        Hugin.send('remove-room', active.key);
        await sleep(777);
        end_swarm(topic);
        return;
      }
      if (con.admin) ban_user(data.address, topic);
      else return 'Error';
      return true;
    } else {
      //Dont handle requests from blocked users
      if (Hugin.blocked(con.address)) return true;
      // History requests

      //Start-up history sync
      if (data.type === REQUEST_HISTORY && con.request) {
        send_history(con.address, topic, active.key, active.files);
        return true;
      } else if (data.type === SEND_HISTORY && con.request) {
        console.log('Got message history from some cool guise');
        process_request(data.messages, active.key);
        if ('files' in data) {
          console.log('Got some files', data.files);
          process_files(data, active, con, topic);
        }
        con.request = false;
        return true;
      }

      //Live syncing from other peers who might have connections to others not established yet by us.

      const INC_HASHES = data.hashes?.length !== undefined || 0;
      const INC_MESSAGES = data.messages?.length !== undefined || 0;
      const INC_PEERS = data.peers?.length !== undefined || 0;
      //Check if payload is too big
      if (INC_HASHES) {
        if (data.hashes?.length > 25) return 'Ban';
      }

      if (data.type === PING_SYNC && active.search && INC_HASHES) {
        if ('files' in data) {
          process_files(data, active, con, topic);
        }

        if (con.knownHashes.toString() === data.hashes.toString()) {
          //Already know all the latest messages
          con.request = false;
          return true;
        }
        if (INC_PEERS && active.peers !== data?.peers) {
          if (data.peers?.length > 100) return 'Ban';
          find_missing_peers(active, data?.peers);
        }

        const missing = await check_missed_messages(
          data.hashes,
          con.address,
          topic,
        );
        con.knownHashes = data.hashes;
        if (!missing) return true;
        con.request = true;
        active.search = false;
        request_missed_messages(missing, con.address, topic);
        //Updated knownHashes from this connection
      } else if (data.type === REQUEST_MESSAGES && INC_HASHES) {
        send_missing_messages(data.hashes, con.address, topic);
      } else if (
        data.type === MISSING_MESSAGES &&
        INC_MESSAGES &&
        con.request
      ) {
        active.search = false;
        con.request = false;
        process_request(data.messages, active.key);
      } else if (data.type === REQUEST_FILE) {
        const file = sanitize_file_message(data.file);
        if (!file) return 'Error';
        Storage.start_beam(true, file.key, file, topic, con.name, active.key);
      }
      return true;
    }
  }
  //Dont display messages from blocked users
  if (Hugin.blocked(con.address)) return;

  return false;
};

const find_missing_peers = async (active, peers) => {
  for (const peer of peers) {
    if (typeof peer !== 'string' || peer?.length !== 64) continue;
    if (!active.peers.some((a) => a === peer)) {
      console.log("'''''''''''''''''''''''''''''''");
      console.log('Try connect to peer ------------>');
      console.log("'''''''''''''''''''''''''''''''");
      active.swarm.joinPeer(Buffer.from(peer, 'hex'));
      await sleep(100);
    }
  }
};

const check_missed_messages = async (hashes) => {
  console.log('Checking for missing messages');
  const missing = [];
  for (const hash of hashes) {
    if (!check_hash(hash)) continue;
    if (await room_message_exists(hash)) continue;
    missing.push(hash);
  }

  if (missing.length > 0) {
    console.log('Requesting:', missing.length, ' missed messages');
    return missing;
  }
  console.log('Current state synced.');
  return false;
};

const request_missed_messages = (hashes, address, topic) => {
  const message = {
    type: REQUEST_MESSAGES,
    hashes,
  };
  send_peer_message(address, topic, message);
};

const send_missing_messages = async (hashes, address, topic) => {
  const messages = [];
  for (const hash of hashes) {
    if (!check_hash(hash)) continue;
    const found = await Hugin.request({ type: 'get-room-message', hash });
    if (found) messages.push(found);
  }
  if (messages.length > 0) {
    const message = {
      type: MISSING_MESSAGES,
      messages,
    };
    send_peer_message(address, topic, message);
  }
};

const request_history = (address, topic, files) => {
  console.log('Reqeust history from another peer');
  const message = {
    type: REQUEST_HISTORY,
    files,
  };
  send_peer_message(address, topic, message);
};

const send_history = async (address, topic, key, files) => {
  const messages = await Hugin.request({ type: 'get-room-history', key });
  console.log('Sending:', messages.length, 'messages');
  const history = {
    type: SEND_HISTORY,
    messages,
    files,
  };
  send_peer_message(address, topic, history);
};

const request_file = async (address, topic, file, room) => {
  //request a missing file, open a hugin beam
  console.log('-----------------------------');
  console.log('*** WANT TO REQUEST FILE  ***');
  console.log('-----------------------------');
  const verify = await Hugin.request({
    type: 'verify-signature',
    data: {
      message:
        file.hash + file.size.toString() + file.time.toString() + file.fileName,
      address: file.address,
      signature: file.signature,
    },
  });
  if (!verify) return;
  const key = random_key().toString('hex');
  Storage.start_beam(false, key, file, topic, room);
  file.key = key;
  const message = {
    file,
    type: REQUEST_FILE,
  };
  await sleep(200);
  send_peer_message(address, topic, message);
};

const process_files = async (data, active, con, topic) => {
  //Check if the latest 10 files are in sync
  console.log('PROCESS FILES');
  if (Hugin.syncImages) {
    if (!Array.isArray(data.files)) return 'Ban';
    if (data.files.length > 10) return 'Ban';
    for (const file of data.files) {
      if (Hugin.files.some((a) => a === file.hash)) continue;
      if (!check_hash(file.hash)) continue;
      await sleep(50);
      request_file(con.address, topic, file, active.key);
    }
  }
};

const process_request = async (messages, key) => {
  let i = 0;
  try {
    for (const m of messages.reverse()) {
      if (m?.address === Hugin.address) continue;
      if (m?.hash?.length !== 64) continue;
      const inc = {
        m: m?.message,
        k: m?.address,
        s: m?.signature,
        t: m?.time ? m.time : m?.timestamp,
        g: m?.grp ? m?.grp : m?.room,
        r: m?.reply,
        n: m?.name ? m?.name : m?.nickname,
        hash: m?.hash,
        tip: m?.tip,
        background: Hugin.idle(),
      };
      if (await room_message_exists(inc.hash)) continue;
      const message = sanitize_group_message(inc);
      if (!message) continue;
      //Save room message in background mode ??
      message.history = true;
      i++;
      Hugin.send('swarm-message', { message });
    }
    //Trigger update when all messages are synced? here.
    Hugin.send('history-update', { key, i, background: Hugin.idle() });
  } catch (e) {
    console.log('error processing history', e);
  }
};

const save_file_info = (data, topic, address, time, sent, name) => {
  const active = get_active_topic(topic);
  const message = {
    message: data.fileName,
    address: address,
    name: name,
    timestamp: time,
    room: active.key,
    hash: data.hash,
    reply: '',
    sent: sent,
    file: false,
  };
  Hugin.send('swarm-message', { message });
};

const check_file_message = async (data, topic, address, name) => {
  const active = get_active_topic(topic);
  const [media, type] = check_if_media(data.fileName, data.size);
  //TODO** Add switch to enable/disable auto syncing images
  if (media && Hugin.syncImages) {
    //A file is shared and we have auto sync images on.
    //Request to download the file
    const file = {
      address,
      topic,
      name: data.name,
      time: data.time,
      hash: data.hash,
      size: data.size,
      fileName: data.fileName,
      signature: data.sig,
      type: data.type,
      info: data.info,
    };
    request_file(address, topic, file, active.key);
    return;
  }

  if (data.info === 'file-shared') {
    const added = await add_remote_file(
      data.fileName,
      address,
      data.size,
      topic,
      active.key,
      data.hash,
      name,
      data.time,
    );

    //Enable / disable auto downloading of image video audio here
    if (media) {
      const file = {
        chat: address,
        fileName: data.fileName,
        hash: data.hash,
        size: data.size,
        key: topic,
        time: data.time,
      };
      request_download(file);
    } else {
      //Here we need to save file info for other types of files that we might want to download later.
      save_file_info(data, topic, address, added, false, name);
    }
  }

  if (data.type === 'download-request') {
    const key = await start_upload(data, topic);
    send_file(data.fileName, data.size, address, key, true);
  }

  if (data.type === 'upload-ready') {
    if (data.info === 'file') {
      update_remote_file(
        data.fileName,
        address,
        data.size,
        data.key,
        data.time,
      );
      console.log('Starting to download ----------->');
      start_download(data.fileName, address, data.key, active.key);
      return;
    }
  }

  if (data.type === 'file-removed') console.log("'file removed", data); //TODO REMOVE FROM remoteFiles
};

const share_file_info = async (file, topic) => {
  // Note file includes property "message", regular text message
  const active = get_active_topic(topic);
  const hash = random_key().toString('hex');
  const signature = await sign(
    hash + file.size.toString() + file.time.toString() + file.fileName,
  );
  const fileInfo = {
    address: Hugin.address,
    fileName: file.fileName,
    name: Hugin.name,
    hash,
    info: 'file-shared',
    size: file.size,
    time: file.time,
    topic: topic,
    type: 'file',
    signature,
  };

  Hugin.files.push(hash);
  //Put the shared file in to our local storage
  await Storage.save(
    topic,
    Hugin.address,
    Hugin.name,
    fileInfo.hash,
    fileInfo.size,
    fileInfo.time,
    fileInfo.fileName,
    'storage',
    signature,
    'file-shared',
    'file',
  );
  const [media, type] = check_if_media(file.fileName, file.size);

  const message = {
    address: Hugin.address,
    name: Hugin.name,
    message: file.fileName,
    hash: fileInfo.hash,
    timestamp: file.time,
    room: active.key,
    reply: '',
    sent: true,
    history: false,
    file: {
      path: file.path,
      fileName: file.fileName,
      timestamp: file.time,
      hash: fileInfo.hash,
      sent: true,
      image: media,
      type: type,
    },
  };

  //Send our file info to front end as message
  Hugin.send('swarm-message', { message });
  const info = JSON.stringify(fileInfo);
  file.topic = topic;
  localFiles.push(file);
  //File shared, send info to peers
  send_swarm_message(info, topic);
};

const request_download = (download) => {
  const active = get_active_topic(download.key);
  const address = download.chat;
  const topic = active.topic;
  const info = {
    fileName: download.fileName,
    address: Hugin.address,
    topic: topic,
    info: 'file',
    type: 'download-request',
    size: download.size,
    time: download.time,
    key: download.key,
  };
  send_peer_message(address, topic, info);
};

const start_upload = async (file, topic) => {
  const sendFile = localFiles.find(
    (a) => a.fileName === file.fileName && file.topic === topic,
  );
  console.log('Start uploading this file:', sendFile);
  if (!sendFile) {
    errorMessage('File not found');
    return;
  }
  return await upload_ready(sendFile, topic, file.address);
};

const upload_ready = async (file, topic, address) => {
  const beam_key = await add_local_file(
    file.fileName,
    file.path,
    address,
    file.size,
    file.time,
    true,
  );
  const info = {
    fileName: file.fileName,
    address,
    topic,
    info: 'file',
    type: 'upload-ready',
    size: file.size,
    time: file.time,
    key: beam_key,
  };
  send_peer_message(address, topic, info);
  return beam_key;
};

const send_peer_message = (address, topic, message) => {
  console.log('Send peer message', message);
  const active = get_active_topic(topic);
  if (!active) {
    errorMessage('Swarm is not active');
    return;
  }
  const con = active.connections.find((a) => a.address === address);
  if (!con) {
    errorMessage('Connection is closed');
    return;
  }
  con.connection.write(JSON.stringify(message));
};

const ban_connection = (conn, topic) => {
  conn.ban(true);
  connection_closed(conn, topic);
};

const connection_closed = (conn, topic, trace) => {
  console.log('Reason:', trace);
  console.log('Closing connection...');
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  try {
    conn.end();
    conn.destroy();
  } catch (e) {
    console.log('failed close connection');
  }
  const user = active.connections.find((a) => a.connection === conn);
  if (!user) {
    return;
  }
  // Hugin.send('close-voice-channel-with-peer', user.address);
  Hugin.send('peer-disconnected', { address: user.address, key: active.key });

  const connection = active.connections.find((a) => a.connection === conn);
  const removedPeer = active.peers.filter((a) => a !== connection.publicKey);
  console.log('Removed peer', removedPeer);
  active.peers = removedPeer;
  console.log('active.peers', active.peers);
  const still_active = active.connections.filter((a) => a.connection !== conn);
  console.log('Connection closed');
  console.log('Still active:', still_active);
  active.connections = still_active;
};

const close_all_connections = () => {
  for (const swarm of active_swarms) {
    const active = get_active_topic(swarm.topic);
    if (!active) continue;
    for (const a of active.connections) {
      connection_closed(a.connection, active.topic);
    }
  }
};

const end_swarm = async (topic) => {
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  Hugin.send('end-swarm', { topic });
  const [in_voice] = get_local_voice_status(topic);
  if (in_voice) {
    update_local_voice_channel_status(LOCAL_VOICE_STATUS_OFFLINE);
  }

  send_swarm_message(JSON.stringify({ type: 'disconnected' }), topic);

  await active.swarm.leave(Buffer.from(topic));
  await active.discovery.destroy();
  await active.swarm.destroy();
  const still_active = active_swarms.filter((a) => a.topic !== topic);
  active_swarms = still_active;
  console.log('***** Ended swarm *****');
};

const update_local_voice_channel_status = (data) => {
  const updated = data;
  active_voice_channel = updated;
  return true;
};

const check_peer_voice_status = (data, con) => {
  const voice_data = sanitize_voice_status_data(data);
  if (!voice_data) {
    return false;
  }
  const updated = update_voice_channel_status(voice_data, con);
  if (!updated) {
    return false;
  }
  return true;
};

const update_voice_channel_status = (data, con) => {
  ////Already know this status
  if (data.voice === con.voice) {
    return true;
  }
  //Just doublechecking the address
  if (data.address !== con.address) {
    return false;
  }
  //Set voice status
  con.voice = data.voice;
  con.video = data.video;
  console.log(
    'Updating voice channel status for this connection Voice, Video:',
    con.voice,
    con.video,
  );
  //Send status to front-end
  Hugin.send('voice-channel-status', { data });
  return true;
};

const get_local_voice_status = (topic) => {
  const c = active_voice_channel;
  if (c.topic !== topic) return [false, false, false, false, false];
  return [c.voice, c.video, c.audioMute, c.videoMute, c.screenshare];
};

const get_active_topic = (topic) => {
  const active = active_swarms.find((a) => a.topic === topic);
  if (!active) {
    return false;
  }
  return active;
};

const check_if_online = async (topic) => {
  const interval = setInterval(ping, 10 * 1000);
  let a = 0;
  async function ping() {
    //Check message state every 20seconds if idle
    if (a % 2 !== 0 && Hugin.idle()) return;
    const active = get_active_topic(topic);
    const allFiles = await Storage.load_meta(topic);
    active.files = allFiles.sort((a, b) => a.time - b.time).slice(-10);
    const hashes = await Hugin.request({
      type: 'get-latest-room-hashes',
      key: active.key,
    });
    if (!active) {
      clearInterval(interval);
      return;
    } else {
      active.search = true;
      let i = 0;
      let peers = [];
      //Send peer info on the first three pings. Then every 10 times.
      if (a < 3 || a % 10 === 0) {
        peers = active.peers;
        a++;
      }
      const data = { type: 'Ping', peers, files: active.files };
      for (const conn of active.connections) {
        data.hashes = hashes;
        if (i > 4) {
          if (i % 2 === 0) data.hashes = [];
        }
        conn.connection.write(JSON.stringify(data));
        i++;
      }
    }
  }
};

const admin_ban_user = async (address, key) => {
  const active = get_active(key);
  if (!active) return;
  active.connections.forEach((chat) => {
    chat.connection.write(JSON.stringify({ type: 'ban', address }));
  });
  await sleep(200);
  ban_user(address, active.topic);
};

const ban_user = async (address, topic) => {
  const active = get_active_topic(topic);
  if (!active) return;
  Hugin.ban(address, topic);
  const conn = active.connections.find((a) => a.address === address);
  if (conn) return;
  conn.peer.ban(true);
  await sleep(200);
  connection_closed(conn.connection, topic, 'Ban user');
};

const error_message = (message) => {
  Hugin.send('error-message', { message });
};

const errorMessage = (message) => {
  Hugin.send('error-message', { message });
};

module.exports = {
  create_swarm,
  end_swarm,
  send_message,
  share_file_info,
  request_download,
  close_all_connections,
};
