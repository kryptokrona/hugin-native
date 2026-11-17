// Process-wide setup of the worklet (called once by bare/main.js when it runs under BareKit).
//
// An exception or rejection nobody handled is logged instead of ending the worklet (React
// Native keeps talking to it). hugin-network registers no process handlers of its own; the
// worklet's lifecycle comes from React Native (`idle_status`, worklet terminate).

const process = require('bare-process');

let installed = false;

function installProcessHandlers() {
  if (installed) return;
  installed = true;
  process.on('uncaughtException', (err) => {
    console.log('Caught an unhandled exception:', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.log('Unhandled rejection:', reason);
  });
}

module.exports = { installProcessHandlers };
