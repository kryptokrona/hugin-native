const rpc_message = (m) => {
  const json = parse(m);
  if (json) {
    console.log('Got rpc message', json);
    switch (json.rpc) {
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
      case 'voice-channel-status':
        console.log('Voice channel status');
      case 'error-message':
        console.log('ERROR', json);
        break;
      default:
        console.log('Other channel', json.rpc);
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
