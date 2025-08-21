const logs = [];

const originalConsoleLog = console.log;

console.log = (...args) => {
  try {
    logs.push(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '));
  } catch (e) {
    originalConsoleLog('Failed to log..'); // Keep native logging too  
  }
  originalConsoleLog(...args); // Keep native logging too
};

export const getLogs = () => logs;
export const clearLogs = () => logs.length = 0;