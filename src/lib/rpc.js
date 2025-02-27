import {
  saveRoomMessageAndUpdate,
  setRoomMessages,
  setLatestRoomMessages,
} from '@/services/bare';
import { getCurrentRoom } from '@/services/zustand';
import { sleep } from '@/utils';
import Toast from 'react-native-toast-message';
import { Peers } from 'lib/connections';
import {
  getRoomMessages,
  roomMessageExists,
  getRoomReplyMessage,
  getLatestRoomHashes,
} from '../services/bare/sqlite';
import { Wallet } from '../services/kryptokrona/wallet';
export class RPC {
  constructor(ipc) {
    this.ipc = ipc;
    this.pendingRequests = new Map();
    this.id = 0;
    this.ipc.on('data', (response) => {
      let data = this.parse(response.toString());
      if (
        !data &&
        response.toString()[0] == '{' &&
        response.toString().slice(-1) == '}'
      ) {
        try {
          let sanitized = '[' + response.toString().replace(/}{/g, '},{') + ']';
          let split_data = JSON.parse(sanitized);

          for (const d in split_data) {
            // Extremely ugly hotfix for concatenated ipc messages BUG
            if (this.pendingRequests.has(split_data[d].id)) {
              const { resolve, reject } = this.pendingRequests.get(
                split_data[d].id,
              );
              resolve(data);
              this.pendingRequests.delete(split_data[d].id);
            } else {
              this.on_message(split_data[d]);
            }
          }

          return;
        } catch (e) {
          console.log('Hotfix failed!', e);
        }
      }

      if (this.pendingRequests.has(data.id)) {
        const { resolve, reject } = this.pendingRequests.get(data.id);
        resolve(data);
        this.pendingRequests.delete(data.id);
      } else {
        this.on_message(data);
      }
    });
  }

  split_objects(data) {
    let datas = [];

    datas.push(data.toString().split('}{')[0] + '}');
    datas.push('{' + data.toString().split('}{')[1]);

    return datas;
  }

  request(data) {
    return new Promise((resolve, reject) => {
      data.id = this.id++;
      this.pendingRequests.set(data.id, { resolve, reject });
      this.ipc.write(JSON.stringify(data));
    });
  }

  parse(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return false;
    }
  }

  send(data) {
    const send = data;
    console.log('Send data from REACT rpc');
    this.ipc.write(JSON.stringify(send));
  }

  async on_message(m) {
    const json = m;
    if (!json) {
      console.log('** RPC ERROR, lib/rpc.js **');
      return;
    }
    if (json) {
      console.log('Got rpc message', json.type);
      switch (json.type) {
        case 'log':
          console.log(json.log);
        case 'new-swarm':
          console.log('new swarm!');
          break;
        case 'get-history':
          //Get history from db
          //await db response here then send it back to bare
          console.log('GET MESSAGE HISTORY ---->');
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
            json.message.tip,
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
          const response = await this.onrequest(json);
          this.send({ id: json.id, data: response });
      }
    }
  }

  async onrequest(request) {
    switch (request.type) {
      case 'get-room-history':
        const messages = await getRoomMessages(request.key, 0, true);
        return messages;
      case 'get-latest-room-hashes':
        const hashes = await getLatestRoomHashes(request.key);
        return hashes;
      case 'room-message-exists':
        const exists = await roomMessageExists(request.hash);
        return exists;
      case 'get-room-message':
        const message = await getRoomReplyMessage(request.hash, true);
        return message[0];
      case 'get-priv-key':
        //Temporary until we sign all messages with xkr address
        const key = Wallet.spendKey();
        return key;
      case 'sign-message':
        const sig = await Wallet.sign(request.message);
        return sig;
      case 'verify-signature':
        const verify = await Wallet.verify(
          request.data.message,
          request.data.address,
          request.data.signature,
        );
        return verify;
      default:
        return false;
    }
  }
}
