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
  saveRoomUser,
} from '../services/bare/sqlite';
import { WebRTC } from '../services/calls/webrtc';
import { Wallet } from '../services/kryptokrona/wallet';
import b4a from 'b4a';
import RPC from 'bare-rpc';
import { Notify, notify } from '../services/utils';
import { MessageSync } from '../services/hugin/syncer';
export class Bridge {
  constructor(IPC) {
    this.pendingRequests = new Map();
    this.id = 0;
    this.rpc = new RPC(IPC, (req, error) => {
      const data = this.parse(b4a.toString(req.data));
      if (!data) {
        console.log('**** ERRR PARSING DATA ***');
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

  request(data) {
    return new Promise((resolve, reject) => {
      data.id = this.id++;
      this.pendingRequests.set(data.id, { resolve, reject });
      const resp = this.rpc.request('request');
      resp.send(JSON.stringify(data));
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
    const req = this.rpc.request('send');
    req.send(JSON.stringify(data));
  }

  async on_message(m) {
    const json = m;
    if (!json) {
      console.log('** RPC ERROR, lib/rpc.js **');
      return;
    }
    if (json) {
      if (json.type !== 'room-message-exists') {
        console.log('Got rpc message', json.type);
      }
      switch (json.type) {
        case 'log':
          console.log(json);
        case 'new-swarm':
          console.log('new swarm!');
          break;
        case 'beam-message':
          console.log('string? decrypt this! -->', json.message);
          MessageSync.check_for_pm(json.message, json.hash);
          break;
        case 'beam-connected':
          console.log('****** GOT BEAM CONNECTION *******');
          console.log('Address:', json.chat);
          console.log('Topic:', json.topic);
          //Change state to -> "connected"
          break;
        case 'new-beam':
          console.log('*********************************');
          console.log('******* Started a new beam! *****');
          console.log('*********************************');
          console.log('Address:', json.chat);
          console.log('Topic:', json.topic);
          //Set some state 'started, not connected'
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
          saveRoomUser(
            json.message.name,
            json.message.address,
            json.message.room,
            '',
          );
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
            json.message.background,
          );
          break;
        case 'dm-file':
          MessageSync.save_file_message(json.message);
          break;
        case 'history-update':
          await sleep(500);
          if (getCurrentRoom() === json.key) {
            setRoomMessages(json.key, 0);
            if (json.history && !json.background) {
              Toast.show({
                type: 'success',
                text1: 'Synced ✅',
                text2: `${json.i} messages in room`,
              });
            }
          }
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
          // console.log('peer-connected!', json);
          Peers.join(json.joined, json.beam);
          saveRoomUser(
            json.joined.name,
            json.joined.address,
            json.joined.key,
            json.joined.avatar,
          );
          break;
        case 'peer-disconnected':
          console.log('peer-disconnected!', json.address);
          Peers.left(json);
          break;
        case 'voice-channel-status':
          // console.log('Voice channel status', json);
          Peers.voicestatus(json.data);
          if (!json.data.voice) WebRTC.remove(json.data.address);
          break;
        case 'join-voice-channel':
          console.log('join-voice-channel called');
          WebRTC.call(json.key, json.topic, json.address);
          break;
        case 'got-answer':
          // console.log('Got answer: ', json);
          if (json?.data?.data?.transceiverRequest) {
            WebRTC.addTransceiver(json.data);
            return;
          }
          WebRTC.callback(json.data);
          break;
        case 'answer-call':
          console.log('Got call: ', json);
          WebRTC.answer(json.data);
          break;
        case 'got-expanded-voice-channel':
          const { key, topic, address, data } = json.data;
          WebRTC.signal(key, topic, address, data);
          break;
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
