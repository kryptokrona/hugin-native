import {
  saveRoomMessageAndUpdate,
  setRoomMessages,
  setLatestRoomMessages,
} from '@/services/bare';
import { getCurrentRoom } from '@/services/zustand';
import { sleep } from '@/utils';
import Toast from 'react-native-toast-message';
import { Peers } from 'lib/connections';

const rpc_message = async (m) => {
  const json = parse(m);
  if (!json) {
    console.log('** RPC ERROR, lib/rpc.js **');
    return;
  }
  if (json) {
    console.log('Got rpc message', json.type);
    switch (json.type) {
      case 'new-swarm':
        console.log('new swarm!');
        break;
      case 'get-history':
        //Get history from db
        //await db response here then send it back to bare
        console.log('GET MESSAGE HISTORY ---->');
        // send_message_history('Got history hehe', 'roomkey', 'tooadreess');
        break;
      case 'end-swarm':
        console.log('end-swarm!');
        break;
      case 'swarm-message':
        saveRoomMessageAndUpdate(
          json.message.address,
          json.message.message,
          json.message.room,
          json.message.reply,
          parseInt(json.message.timestamp),
          json.message.name,
          json.message.hash,
          false,
          json.message.history,
          json.message.file,
          json.message.tip
        );
        break;
      case 'history-update':
        await sleep(500);
        if (getCurrentRoom() === json.key) {
          setRoomMessages(json.key, 0);
          if (json.history) {
            Toast.show({
              type: 'success',
              text1: 'Synced ✅',
              text2: `${json.i} messages in room`,
            });
          }
        }
        setLatestRoomMessages();
        break;
      case 'syncing-history':
        if (getCurrentRoom() === json.key) {
          Toast.show({
            type: 'info',
            text1: 'Syncing history...',
          });
        }
        break;
      case 'peer-connected':
        console.log('peer-connected!', json.joined.name);
        Peers.join(json.joined);
        break;
      case 'peer-disconnected':
        console.log('peer-disconnected!', json.address);
        Peers.left(json);
        break;
      case 'voice-channel-status':
        console.log('Voice channel status');
      case 'error-message':
        console.log('ERROR', json.message);
        break;
      case 'save-file-info':
        console.log('Save file info:', json.message);
        break;
      case 'room-remote-file-added':
        console.log('Remote file added --> ', json.remoteFiles);
        console.log('From:', json.chat);
        console.log('In room:', json.room);
        //Maybe add a global state for remote files?
        //Update remote file list. We need to replace the message in the chat-window with a download button.
        //That message is a normal swarm-message with the correct Message format.
        //Both have the same hash as identifier.
        break;
      case 'download-complete':
        console.log('Download completed!', json.fileName);
      //path, chat, hash, filename
      case 'local-files':
        console.log('local files:', json.localFiles);
      case 'upload-file-progress':
        console.log('Uploading progress ipc message:', json.progress);
        console.log('File:', json);
      case 'download-file-progress':
        console.log('Downloading progress ipc message:', json.progress);
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
