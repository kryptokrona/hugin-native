import ce from 'compact-encoding';
import { requireNativeModule } from 'expo-modules-core';
import RPC from 'tiny-buffer-rpc';
import { rpc_message } from './rpc';

requireNativeModule('HelloBare').install();

// forward bare's logs to console
HelloBare.onLog = console.log;

// // RPC FROM FRONT END
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
  init_bare.request('activate');
};

export const swarm = (key) => {
  console.log('Join swarm!');
  new_swarm.request(key);
};

export const endswarm = (topic) => {
  console.log('End swarm!');
  end_swarm.request(topic);
};

console.log('Loaded native js');

//IPC SWARM
