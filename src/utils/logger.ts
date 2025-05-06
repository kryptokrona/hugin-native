const logs = [];

const originalConsoleLog = console.log;

console.log = (...args) => {
  logs.push(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '));
  originalConsoleLog(...args); // Keep native logging too
};

export const getLogs = () => logs;
export const clearLogs = () => logs.length = 0;