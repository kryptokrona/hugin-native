const rpc_message = (m) => {
  if (parse(m)) {
    console.log('Got rpc message', m);
    switch (m.rpc) {
      case 'new-swarm':
        console.log('new swarm!');
        break;
      case 'end-swarm':
        console.log('end-swarm!');
        break;
      case 'swarm-message':
        console.log('swarm-message!');
        break;
      case 'peer-connected':
        console.log('peer-connected!');
        break;
      case 'peer-disconnected':
        console.log('peer-disconnected!');
        break;
      case 'error-message':
        console.log('ERROR', m);
        break;
      default:
        console.log('Other message', m.rpc);
    }
  } else return false;
};

const parse = (a) => {
  try {
    return JSON.parse(a);
  } catch (e) {
    return false;
  }
};

module.exports = { rpc_message };
