import { requireNativeModule } from 'expo-modules-core';

requireNativeModule('HelloBare').install();

// forward bare's logs to console
HelloBare.onLog = console.log;

// RPC
// const rpc = new RPC(HelloBare.senDMessage);
// HelloBare.onMessage = rpc.recv.bind(rpc);

// const ipc = rpc.register(0, {
//   request: ce.string,
//   response: ce.string,
// });

export const joinSwarm = (key: string) => {
  console.log('LOLO');
};
