import ce from 'compact-encoding';
import { requireNativeModule } from 'expo-modules-core';
import { Daemon, WalletBackend } from 'kryptokrona-wallet-backend-js';
import RPC from 'tiny-buffer-rpc';
import { rpc_message } from './rpc';
requireNativeModule('HelloBare').install();

// forward bare's logs to console
HelloBare.onLog = console.log;

// RPC FROM FRONT END
const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);

const init_bare = rpc.register(0, {
  request: ce.string,
  response: ce.string,
});

const new_swarm = rpc.register(1, {
  request: ce.string,
  response: ce.string,
});

const end_swarm = rpc.register(3, {
  request: ce.string,
  response: ce.string,
});

const send_room = rpc.register(4, {
  request: ce.string,
  response: ce.string,
});

const group_random_key = rpc.register(5, {
  request: ce.string,
  response: ce.string,
});

//Right now we use a stream to send ipc messages.
//This may need to be bidirectional if we send files etc.
rpc.register(2, {
  request: ce.string,
  response: ce.string,
  onstream: (stream) => {
    stream.on('data', (a) => {
      rpc_message(a);
    });
  },
});

export const bare = async () => {
  // await wallet();
  init_bare.request('activate');
};

export const swarm = async (key) => {
  console.log('Join swarm!');
  return await new_swarm.request(key);
};

export const endswarm = (topic) => {
  console.log('End swarm!');
  end_swarm.request(topic);
};

export const send_swarm_msg = (message, topic) => {
  send_room.request(message, topic);
};

export const group_key = async () => {
  return await group_random_key.request('new');
};

//Function to test wallet support for different JS engines
const wallet = async () => {
  // const daemon = new Daemon('privacymine.net', 11898);
  // const config = {};
  // const wallet = await WalletBackend.createWallet(daemon, config);
  // console.log('Wallet!', wallet);
};

console.log('Loaded native js');

//IPC SWARM
