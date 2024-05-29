const HyperSwarm = require('hyperswarm');
const { get_new_peer_keys } = require('./utils');
let active_swarms = [];

const create_swarm = async () => {
  console.log('Creating swarm!');
  const key =
    '650068fcd99d5649ea148c4b92cd3f9c831485eb0ba2feb095587dd89fbd5fba';
  const [base_keys, dht_keys, sig] = get_new_peer_keys(key);

  //The topic is public so lets use the pubkey from the new base keypair
  const hash = base_keys.publicKey.toString('hex');
  const startTime = Date.now();
  let discovery;
  let swarm;
  //We add sig, keys and keyPair for custom firewall settings.
  try {
    swarm = new HyperSwarm(
      {
        firewall(remotePublicKey, payload) {
          //We are already checking payloads in hyperswarm
          return false;
        },
      },
      sig,
      dht_keys,
      base_keys,
    );
  } catch (e) {
    console.log('Error starting swarm');
    return;
  }
  const active = {
    key,
    topic: hash,
    connections: [],
    call: [],
    time: startTime,
    swarm,
  };
  active_swarms.push(active);

  swarm.on('connection', (connection, information) => {
    console.log('New connection ', information);
    // new_connection(connection, hash, key, name)
  });

  process.once('SIGINT', function () {
    swarm.on('close', function () {
      process.exit();
    });
    swarm.destroy();
    setTimeout(() => process.exit(), 2000);
  });

  const topic = Buffer.alloc(32).fill(hash);
  discovery = swarm.join(topic, { server: true, client: true });
  await discovery.flushed();
  // check_if_online(hash)
};

const new_connection = (connection, hash, key, name) => {
  console.log('New connection incoming');
  let active = get_active_topic(hash);

  if (!active) {
    console.log('no longer active in topic');
    connection_closed(connection, hash);
    return;
  }

  console.log('*********Got new Connection! ************');
  active.connections.push({
    connection,
    topic: hash,
    voice: false,
    name: '',
    address: '',
    video: false,
  });
  // send_joined_message(key, hash, my_address)
  connection.on('data', async (data) => {
    incoming_message(data, hash, connection, key);
  });

  connection.on('close', () => {
    console.log('Got close signal');
    connection_closed(connection, hash);
  });

  connection.on('error', () => {
    console.log('Got error connection signal');
    connection_closed(connection, hash);
  });
};

const connection_closed = (conn, topic) => {
  console.log('Closing connection...');
  const active = get_active_topic(topic);
  if (!active) return;
  try {
    conn.end();
    conn.destroy();
  } catch (e) {
    console.log('failed close connection');
  }
  const user = active.connections.find((a) => a.connection === conn);
  if (!user) return;
  sender('close-voice-channel-with-peer', user.address);
  sender('peer-disconnected', { address: user.address, topic });
  const still_active = active.connections.filter((a) => a.connection !== conn);
  console.log('Connection closed');
  console.log('Still active:', still_active);
  active.connections = still_active;
};

const incoming_message = async (data, topic, connection, key) => {
  const str = new TextDecoder().decode(data);
  console.log('Str!', str);
  if (str === 'Ping') return;
  // Check
  // await check_data_message(data, connection, topic)
  const check = true;
  if (check === 'Error') {
    connection_closed(connection, topic);
    return;
  }
  if (check) return;
  const hash = str.substring(0, 64);
  // let [message, time, hsh] = await decryptSwarmMessage(str, hash, key)
  if (!message) return;
  // const msg = await saveGroupMsg(message, hsh, time, false, true)
  if (!msg) return;
  //Send new board message to frontend.
  // sender('groupRtcMsg', msg)
  sender('group-notification', [msg, false]);
};

const get_active_topic = (topic) => {
  const active = active_swarms.find((a) => a.topic === topic);
  if (!active) return false;
  return active;
};

const sender = (channel, data) => {
  console.log('Send this to front end!', channel);
};

module.exports = { create_swarm };
