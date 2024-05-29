import ce from 'compact-encoding';
const { HelloBare } = ReactNative.NativeModules;
import RPC from 'tiny-buffer-rpc';

HelloBare.install();

// forward bare's logs to console
HelloBare.onLog = console.log;

console.log('Bare activated!');
// RPC
const rpc = new RPC(HelloBare.sendMessage);
HelloBare.onMessage = rpc.recv.bind(rpc);

const reverseStringMethod = rpc.register(0, {
  request: ce.string,
  response: ce.string,
});

export const reverseString = async (message) =>
  await reverseStringMethod.request(message);
