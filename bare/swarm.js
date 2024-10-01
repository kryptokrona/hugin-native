const ce = require('compact-encoding');
const HyperSwarm = require('hyperswarm');
const { Hugin } = require('./account');
const {
  get_new_peer_keys,
  sanitize_group_message,
  sanitize_join_swarm_data,
  sanitize_voice_status_data,
  random_key,
  toUintArray,
  verify_admins,
} = require('./utils');

const LOCAL_VOICE_STATUS_OFFLINE = [
  JSON.stringify({ topic: '', video: false, voice: false }),
];
let RPC_SENDER;
let active_voice_channel = LOCAL_VOICE_STATUS_OFFLINE;
let active_swarms = [];

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
    console.log('Joining topic: ', topic);
    try {
      this.swarm = new HyperSwarm({}, sig, dht_keys, base_keys);
    } catch (e) {
      error_message('Error starting swarm');
      return;
    }
    this.swarm.on('connection', (connection, information) => {
      console.log('New connection ', information);
      new_connection(connection, topic, this.key);
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
  };

  active_swarms.push(active);
  sender('new-swarm', { connected, key });
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

const new_connection = (connection, topic, key) => {
  console.log('New connection incoming');
  const active = get_active_topic(topic);

  if (!active) {
    console.log('no longer active in topic');
    connection_closed(connection, topic);
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
  });
  send_joined_message(topic);
  connection.on('data', async (data) => {
    incoming_message(data, topic, connection, key);
  });

  connection.on('close', () => {
    console.log('Got close signal');
    connection_closed(connection, topic);
  });

  connection.on('error', () => {
    console.log('Got error connection signal');
    connection_closed(connection, topic);
  });
};

function send_message(message, topic, reply, invite) {
  console.log('Send this swarm message', message);
  const message_json = {
    c: 'channel in room?',
    g: invite,
    hash: random_key().toString('hex'),
    k: Hugin.address,
    m: message,
    n: Hugin.name,
    r: reply,
    s: 'signature',
    t: Date.now(),
  };

  console.log('Send this to hugin desktop! :', message_json);
  const send = JSON.stringify(message_json);
  send_swarm_message(send, topic);
  return send;
}

const send_joined_message = async (topic) => {
  //Use topic as signed message?
  const msg = topic;
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  const sig =
    'await signMessage(msg, keychain.getXKRKeypair().privateSpendKey)';
  let [voice, video] = get_local_voice_status(topic);
  if (video) {
    voice = true;
  }
  //const channels = await get_my_channels(key)
  console.log('Video?', video);
  const data = JSON.stringify({
    address: Hugin.address,
    channels: [],
    joined: true,
    message: msg,
    name: Hugin.name,
    avatar: Hugin.avatar,
    signature: sig,
    time: active.time,
    topic: topic,
    video: video,
    voice: voice,
  });

  send_swarm_message(data, topic);
};

const send_swarm_message = (message, topic) => {
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  active.connections.forEach((chat) => {
    try {
      console.log('Writing to channel');
      chat.connection.write(message);
    } catch (e) {
      error_message('Connection offline');
    }
  });

  console.log('Swarm msg sent!');
};

const incoming_message = async (data, topic, connection, key) => {
  const str = data.toString();
  console.log('Str!', str);
  if (str === 'Ping') {
    return;
  }
  // Check
  const check = await check_data_message(str, connection, topic);
  console.log('check', check);
  // if (check === 'Error') {
  //   connection_closed(connection, topic);
  //   return;
  // }
  if (check) {
    return;
  }
  const message = sanitize_group_message(JSON.parse(str));
  console.log('Sanitized: ', message);
  sender('swarm-message', { message, topic });
};

const check_data_message = async (data, connection, topic) => {
  try {
    data = JSON.parse(data);
  } catch (e) {
    return 'Error';
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
      connection_closed(connection, active.topic);
      return true;
    }
  }

  // if ('info' in data) {
  //     const fileData = sanitize_file_message(data)
  //     if (!fileData) return "Error"
  //     check_file_message(fileData, topic, con.address)
  //     return true
  // }

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
  //                     sender('got-expanded-voice-channel', [data.data, data.address])
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
      console.log('joined check', joined);
      // if (!joined) {
      //   return 'Error';
      // }

      if (con.joined) {
        //Connection is already joined
        return;
      }

      const admin = verify_admins(
        connection.remotePublicKey,
        Buffer.from(data.signature, 'hex'),
        Buffer.from(active.key.slice(-64), 'hex'),
      );

      console.log('Admin?', admin);
      //Check signature
      // const verified = await verifySignature(joined.message, joined.address, joined.signature)
      // if(!verified) return "Error"
      con.joined = true;
      con.address = joined.address;
      con.name = joined.name;
      con.voice = joined.voice;

      const time = parseInt(joined.time);
      if (parseInt(active.time) > time) {
        //Request new messages from peer
        request_message_history(con, joined);
      }
      //     //If our new connection is also in voice, check who was connected first to decide who creates the offer
      //     const [in_voice, video] = get_local_voice_status(topic)
      //     if (con.voice && in_voice && (parseInt(active.time) > time)  ) {
      //         join_voice_channel(active.key, topic, joined.address)
      //     }

      con.video = joined.video;
      joined.key = active.key;
      sender('peer-connected', { joined });
      console.log('Connection updated: Joined:', con.joined);
      return true;
    }
    if ('voice' in data) {
      const voice_status = check_peer_voice_status(data, con);
      if (!voice_status) {
        return 'Error';
      }
      return true;
    }

    if (data.type === 'request-history' && con.joined) {
      sender('get-history', 'invitekeytoroom and also address to the receiver');
    }
    if (data.type === 'sync-history' && con.joined && con?.request) {
      ///Sync history
      //request state may be needed to keep track if we are in requesting mode atm
      sync_message_history();
    }
  }

  return false;
};

const request_message_history = (con, joined) => {
  //Request last 100~messages from connection
  const message = {
    message: 'more plx',
    type: 'request-history',
    amount: 100,
  };
  send_peer_message(message, con);
};

const send_message_history = async (history, room, address) => {
  //Send last 100 messages to connection
  //Need invite key or maybe topic to get messages from the correct room'
  //We also need to keep track of who to send this history to later.
  const invite = '';
  const message = {
    type: 'sync-history',
    data: history,
  };
  console.log('SEND MESSAGE HISTORY!!! ---->');
  //send_peer_message(message, con);
};

const sync_message_history = (history) => {
  //Got a message containing some message history -> save/print them
  //sender('sync-history', messages)
  console.log('Got messages from peer, Sync message history');
};

const send_peer_message = (message, con) => {
  //Send individual peer message
  console.log('Send peer message to connection!');
  //con.write(JSON.stringify(message));
};

const connection_closed = (conn, topic) => {
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
  const disconnected = { address: user.address, key: active.key };
  // sender('close-voice-channel-with-peer', user.address);
  sender('peer-disconnected', { disconnected });
  const still_active = active.connections.filter((a) => a.connection !== conn);
  console.log('Connection closed');
  console.log('Still active:', still_active);
  active.connections = still_active;
};

const end_swarm = async (topic) => {
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  sender('end-swarm', { topic });
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
  active_voice_channel = [updated];
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
  sender('voice-channel-status', { data });
  return true;
};

const get_local_voice_status = (topic) => {
  let voice = false;
  let video = false;
  let channel;
  //We do this bc stringified data is set locally from the status messages.
  //This can change
  try {
    channel = JSON.parse(active_voice_channel[0]);
    if (channel.topic !== topic) {
      return [false, false];
    }
  } catch (e) {
    return [false];
  }

  voice = channel.voice;
  video = channel.video;

  return [voice, video, topic];
};

const get_active_topic = (topic) => {
  const active = active_swarms.find((a) => a.topic === topic);
  if (!active) {
    return false;
  }
  return active;
};

const check_if_online = (topic) => {
  const interval = setInterval(ping, 10 * 1000);
  function ping() {
    const active = active_swarms.find((a) => a.topic === topic);
    if (!active) {
      clearInterval(interval);
      return;
    } else {
      active.connections.forEach((a) => a.connection.write('Ping'));
    }
  }
};
const localFiles = [];
const share_file_with_message = (file) => {
  // Note file includes property "message", regular text message
  // const active = get_active_topic(file.topic);
  const fileInfo = {
    address: Hugin.address,
    fileName: file.fileName,
    hash: file.hash,
    info: 'file-shared',
    size: file.size,
    time: file.time,
    topic: file.topic,
    type: 'file',
    message: file.message,
  };
  const info = JSON.stringify(fileInfo);
  localFiles.push(file);
  //File shared, send info to peers
  send_swarm_message(info, file.topic);
};

const sender = (type, data) => {
  console.log('Send rpc data from swarm');
  const send = data;
  send.type = type;
  RPC_SENDER.write(JSON.stringify(send));
};

const error_message = (message) => {
  sender('error-message', { message });
};

class ipc {
  constructor() {}
  new(rpc) {
    if (RPC_SENDER) return;
    let RPC;
    RPC = rpc.register(1, {
      request: ce.string,
      response: ce.string,
    });
    RPC_SENDER = RPC.createRequestStream();
    RPC_SENDER.on('data', (data) => {
      console.log('RPC sender in swarm got data from frontend', data);
    });
    return true;
  }
}

module.exports = {
  create_swarm,
  end_swarm,
  share_file_with_message,
  send_message,
  send_message_history,
  ipc,
};
