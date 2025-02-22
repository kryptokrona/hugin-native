class RPC {
  constructor(ipc) {
    this.ipc = ipc;
    this.pendingRequests = new Map();
    this.id = 0;
    this.ipc.on('data', (response) => {
      const data = this.parse(response);
      if (this.pendingRequests.has(data.id)) {
        const { resolve, reject } = this.pendingRequests.get(data.id);
        if (error) {
          reject(new Error(error));
        } else {
          resolve(data.data);
        }
        this.pendingRequests.delete(data.id);
      } else {
        this.emit('data', data);
      }
    });
  }

  request(type, data) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pendingRequests.set(id, { resolve, reject });
      this.ipc.write(JSON.stringify({ id, type, data }));
    });
  }

  parse(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }

  send(type, data) {
    console.log('Send rpc data from bare');
    const send = data;
    send.type = type;
    this.ipc.write(JSON.stringify(send));
  }
}

module.exports = { RPC };
