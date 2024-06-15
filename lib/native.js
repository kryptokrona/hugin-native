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

const mainRPC = rpc.register(0, {
  request: ce.string,
  response: ce.string,
});

// Right now we use a stream to send IPC messages.
// This may need to be bidirectional if we send files etc.
rpc.register(1, {
  request: ce.string,
  response: ce.string,
  onstream: (stream) => {
    stream.on('data', (a) => {
      rpc_message(a);
    });
  },
});

// Exported functions to client
export const bare = async (user) => {
  const data = JSON.stringify({
    type: 'init_bare',
    user,
  });
  mainRPC.request(data);
};

export const update_bare_user = async (user) => {
  const data = JSON.stringify({ type: 'update_bare_user', user });
  mainRPC.request(data);
};

export const swarm = async (key) => {
  const data = JSON.stringify({ type: 'new_swarm', key });
  mainRPC.request(data);
};

export const end_swarm = (topic) => {
  const data = JSON.stringify({ type: 'end_swarm', topic });
  mainRPC.request(data);
};

export const send_swarm_msg = (message, topic) => {
  const data = JSON.stringify({ type: 'send_room', message, topic });
  mainRPC.request(data);
};

export const group_key = async () => {
  const data = JSON.stringify({ type: 'group_random_key' });
  mainRPC.request(data);
};

export const begin_send_file = (json_file_data) => {
  const data = JSON.stringify({ type: 'begin_send_file', json_file_data });
  mainRPC.request(data);
};

// Function to test wallet support for different JS engines
const wallet = async () => {
  // const daemon = new Daemon('privacymine.net', 11898);
  // const config = {};
  // const wallet = await WalletBackend.createWallet(daemon, config);
  // console.log('Wallet!', wallet);
};

console.log('Loaded native js');

// IPC SWARM
