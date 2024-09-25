const { saveRoomsMessageToDatabase } = require('@/services/sqlite');
const { send_message_history } = require('./native');
const { peerConnected, peerDisconncted } = require('@/services/bare');

const rpc_message = async (m) => {
  const json = parse(m);
  if (!json) {
    console.log('** RPC ERROR, lib/rpc.js **');
    return;
  }
  if (json) {
    console.log('Got rpc message', json);
    switch (json.type) {
      case 'new-swarm':
        console.log('new swarm!');
        break;
      case 'get-history':
        //Get history from db
        //await db response here then send it back to bare
        console.log('GET MESSAGE HISTORY ---->');
        send_message_history('Got history hehe', 'roomkey', 'tooadreess');
        break;
      case 'end-swarm':
        console.log('end-swarm!');
        break;
      case 'swarm-message':
        console.log('swarm-message!', json);
        //Check if we want to print it in live conversation
        //If state.route.room === json.message.room
        //--> print
        saveRoomsMessageToDatabase(
          json.message.address,
          json.message.message,
          json.message.room,
          json.message.reply,
          json.message.timestamp,
          json.message.name,
          json.message.hash,
          false,
        );
        break;
      case 'peer-connected':
        console.log('peer-connected!', json);
        peerConnected(json.joined);
        break;
      case 'peer-disconnected':
        console.log('peer-disconnected!', json);
        peerDisconncted(json.disconnected);
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
