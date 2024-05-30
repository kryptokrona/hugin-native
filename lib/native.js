import { requireNativeModule } from 'expo-modules-core';
import ce from 'compact-encoding';
import RPC from 'tiny-buffer-rpc';

requireNativeModule('HelloBare').install();

// forward bare's logs to console
HelloBare.onLog = console.log;

// RPC
const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);

// const ipc = rpc.register(0, {
//   request: ce.string,
//   response: ce.string,
// });

export const joinSwarm = (key) => {
  console.log('LOLO');
};
