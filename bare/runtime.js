const process = require('bare-process');

// globals

Object.defineProperty(globalThis, 'global', {
  enumerable: true,
  writable: false,
  value: globalThis,
});
Object.defineProperty(globalThis, 'window', {
  enumerable: true,
  writable: false,
  value: globalThis,
});
Object.defineProperty(globalThis, 'self', {
  enumerable: true,
  writable: false,
  value: globalThis,
});
Object.defineProperty(globalThis, 'process', {
  enumerable: true,
  writable: false,
  value: process,
});

// error handlers

process.on('uncaughtException', (ex) => {
  console.log('uncaughtException', ex);
});

process.on('unhandledRejection', (ex) => {
  console.log('unhandledRejection', ex);
});

// console redirection to react-native side
// Bare.sendLog is not active anymore

// const consoleProxy = new Console({
//   colors: false,
//   stdout: Bare.sendLog,
//   stderr: Bare.sendLog,
// });
// globalThis.console = consoleProxy;
