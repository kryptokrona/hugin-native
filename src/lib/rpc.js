import {
  saveRoomMessageAndUpdate,
  setRoomMessages,
  setLatestRoomMessages,
} from '@/services/bare';
import { getCurrentRoom, useGlobalStore } from '@/services/zustand';
import { sleep } from '@/utils';
import Toast from 'react-native-toast-message';
import { Peers } from 'lib/connections';
import {
  getRoomMessages,
  roomMessageExists,
  getRoomReplyMessage,
  getLatestRoomHashes,
  saveRoomUser,
  saveFeedMessage,
  getFeedMessages
} from '../services/bare/sqlite';
import { WebRTC } from '../services/calls/webrtc';
import { Wallet } from '../services/kryptokrona/wallet';
import b4a from 'b4a';
import RPC from 'bare-rpc';
import { Notify, notify } from '../services/utils';
import { MessageSync } from '../services/hugin/syncer';
import { saveFeedMessageAndUpdate } from '../services/bare/feed';
import { Nodes } from './native';
import { getDeviceId } from '../services/pushnotifications';
export class Bridge {
  constructor(IPC) {
    this.pendingRequests = new Map();
    this.id = 0;
    this.sentpush = false;
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
    // console.log('Got message from bare: ', m)
    const json = m;
    if (!json) {
      console.log('** RPC ERROR, lib/rpc.js **');
      return;
    }
    if (json) {
      if (json.type !== 'room-message-exists') {
        // console.log('Got rpc message', json.type);
      }
      switch (json.type) {
        case 'log':
          console.log(json);
        case 'hugin-node-connected':
          console.log('Hugin node connected!')
          useGlobalStore.getState().setHuginNode({connected: true});
          if (this.sentpush) return;
          const pushRegistration = await Wallet.encrypt_push_registration();
          this.send({type: 'push_registration', data: pushRegistration});
          const callPushRegistration = await Wallet.encrypt_call_push_registration();
          this.send({type: 'push_registration', data: callPushRegistration});
          this.sentpush = true;
          const rooms = useGlobalStore.getState().rooms;
          for (const room in rooms) {
            const roomPushRegistration = await Wallet.encrypt_room_push_registration(rooms[room].roomKey);
            this.send({type: 'push_registration', data: roomPushRegistration});
          }
          break;
        case 'hugin-node-disconnected':
          console.log('Hugin node disconnected!')
          useGlobalStore.getState().setHuginNode({connected: false});
          break;
        case 'node-address':
          Nodes.address = json.address
          break;
        case 'new-swarm':
          break;
        case 'beam-message':
          MessageSync.check_for_pm(json.message, json.hash, json.background);
          break;
        case 'beam-connected':
          //Change state to -> "connected"
          break;
        case 'new-beam':
          //Set some state 'started, not connected'
          break;
        case 'typing':
          if (json?.datas?.typing) {
            useGlobalStore.getState().addTypingUser(json?.datas?.key, json?.datas?.address);
          } else {
            useGlobalStore.getState().removeTypingUser(json?.datas?.key, json?.datas?.address);
          }
          break;
        case 'get-history':
          //Get history from db
          //await db response here then send it back to bare
          break;
        case 'end-swarm':
          break;
        case 'feed-message':
          saveFeedMessageAndUpdate(json.data.address, json.data.message, json.data.reply, json.data.timestamp, json.data.nickname, json.data.hash, undefined, undefined);
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
          console.log('peer-connected!', json.joined.name);
          Peers.join(json.joined, json.beam);
          saveRoomUser(
            json.joined.name,
            json.joined.address,
            json.joined.key,
            json.joined.avatar,
          );
          break;
        case 'peer-disconnected':
          console.log('peer-disconnected!', json.name);
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
          WebRTC.answer(json.data);
          break;
        case 'got-expanded-voice-channel':
          const { key, topic, address, data } = json.data;
          WebRTC.signal(key, topic, address, data);
          break;
        case 'error-message':
          console.log('HUGE ERROR:', json.data)
          break;
        case 'save-file-info':
          break;
        case 'room-remote-file-added':
          //Maybe add a global state for remote files?
          //Update remote file list. We need to replace the message in the chat-window with a download button.
          //That message is a normal swarm-message with the correct Message format.
          //Both have the same hash as identifier.
          break;
        case 'download-complete':
        //path, chat, hash, filename
        case 'local-files':
        case 'upload-file-progress':
        case 'download-file-progress':
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
      case 'get-feed-history':
        const feed_messages = await getFeedMessages(0, true);
        return feed_messages;
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
        const sig = await Wallet.sign(request.message, true);
        return sig;
        case 'sign-node-message':
          const [p, pub] = await Wallet.messageKeyPair()
        const signature = await Wallet.sign(request.message, false);
        return [pub, signature];
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
