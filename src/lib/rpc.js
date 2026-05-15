import {
  saveRoomMessageAndUpdate,
  setRoomMessages,
  syncRoomMessages,
  setLatestRoomMessages,
} from '@/services/bare';
import { getCurrentRoom, useGlobalStore, usePreferencesStore } from '@/services/zustand';
import { getDeviceId } from '../services/pushnotifications';
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
import { cnFastHash, cnTurtleLiteSlowHashV2 } from '../services/NativeTest';
import { findPowShare } from '../services/NativeTest';
const IMAGE_EXTS = ['.png', '.jpg', '.gif', '.jpeg', '.jfif', '.webp'];
const VIDEO_EXTS = ['.mp4', '.webm', '.avi', '.mov', '.wmv', '.mkv', '.mpeg'];
const AUDIO_EXTS = ['.m4a', '.mp3', '.wav'];

function getImageFlag(fileName) {
  const lower = (fileName ?? '').toLowerCase();
  return IMAGE_EXTS.some((e) => lower.endsWith(e));
}

function getMediaType(fileName) {
  const lower = (fileName ?? '').toLowerCase();
  if (IMAGE_EXTS.some((e) => lower.endsWith(e))) return 'image';
  if (VIDEO_EXTS.some((e) => lower.endsWith(e))) return 'video';
  if (AUDIO_EXTS.some((e) => lower.endsWith(e))) return 'audio';
  return 'file';
}

export class Bridge {
  constructor(IPC) {
    this.pendingRequests = new Map();
    this.id = 0;
    this.basePushRegistered = false;
    this.callPushRegistered = false;
    this.registeredRoomKeys = new Set();
    this.pendingPushRoomKeys = new Set();
    this.pushRegistrationInFlight = null;
    this.pushRegistrationTimer = null;
    this.pushRegistrationDebouncePromise = null;
    this.pushRegistrationDebounceMs = 750;
    this.pushRegistrationDone = false;
    this.rpc = new RPC(IPC, (req, error) => {
      const data = this.parse(b4a.toString(req.data));
      if (!data) {
        console.log('**** ERRR PARSING DATA ***');
        return;
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
      const resp = this.rpc.request(1);
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
    const req = this.rpc.request(2);
    req.send(JSON.stringify(data));
  }

  async send_push_registration(data) {
    await sleep(5000);
    const res = await this.request({ type: 'push_registration', data });
    const sent = res && res.sent;
    if (!sent || sent.success !== true) {
      const reason = sent && typeof sent.reason === 'string' ? sent.reason : 'push_registration_failed';
      console.log('Push registration failed:', reason);
    }
    return sent;
  }

  get_room_keys_from_store() {
    const rooms = useGlobalStore.getState().rooms;
    return Object.values(rooms || {})
      .map((room) => room?.roomKey)
      .filter((roomKey) => typeof roomKey === 'string' && roomKey.length > 0);
  }

  get_pending_push_registrations(room_keys = []) {
    const all_room_keys = [...new Set([...this.get_room_keys_from_store(), ...room_keys])];
    const prefs = usePreferencesStore.getState().preferences;
    const prefs_registered = prefs?.registeredRoomKeys || [];
    const pending_room_keys = all_room_keys.filter((room_key) => !this.registeredRoomKeys.has(room_key) && !prefs_registered.includes(room_key));

    return {
      include_device_push: !this.basePushRegistered && !prefs?.basePushVerified,
      include_call_push: !this.callPushRegistered && !prefs?.basePushVerified,
      pending_room_keys,
    };
  }

  mark_push_registrations_sent({
    include_device_push,
    include_call_push,
    pending_room_keys,
  }) {
    if (include_device_push) this.basePushRegistered = true;
    if (include_call_push) this.callPushRegistered = true;
    pending_room_keys.forEach((room_key) => this.registeredRoomKeys.add(room_key));
  }

  collect_pending_push_room_keys(room_keys = []) {
    room_keys
      .filter((room_key) => typeof room_key === 'string' && room_key.length > 0)
      .forEach((room_key) => this.pendingPushRoomKeys.add(room_key));
  }

  async run_push_registration_sync(room_keys = []) {
    const state = this.get_pending_push_registrations(room_keys);
    const {
      include_device_push,
      include_call_push,
      pending_room_keys,
    } = state;

    if (!include_device_push && !include_call_push && pending_room_keys.length === 0) {
      return { success: true, skipped: true };
    }

    const push_registration_batch = await Wallet.encrypt_push_registration_batch({
      includeDevicePush: include_device_push,
      includeCallPush: include_call_push,
      roomKeys: pending_room_keys,
    });
    if (!push_registration_batch) {
      return { success: true, skipped: true };
    }

    const sent = await this.send_push_registration(push_registration_batch);
    console.log('[rpc.js] Push registration sent:', sent);
    if (sent && sent.success === true) {
      this.mark_push_registrations_sent(state);
      const currentFirebaseToken = getDeviceId();
      if (currentFirebaseToken) {
        usePreferencesStore.getState().setLastRegisteredDeviceToken(currentFirebaseToken);
      }
    }
    return sent;
  }

  async flush_push_registrations() {
    const pending_room_keys = [...this.pendingPushRoomKeys];
    this.pendingPushRoomKeys.clear();
    return await this.run_push_registration_sync(pending_room_keys);
  }

  async sync_push_registrations(room_keys = []) {
    this.collect_pending_push_room_keys(room_keys);

    const prefs = usePreferencesStore.getState().preferences;
    const currentFirebaseToken = getDeviceId();
    const tokenIsSame = currentFirebaseToken && currentFirebaseToken === prefs?.lastRegisteredDeviceToken;

    if (!tokenIsSame && currentFirebaseToken) {
      usePreferencesStore.getState().clearRegisteredRoomKeys();
    }

    const state = this.get_pending_push_registrations([...this.pendingPushRoomKeys]);

    console.log('[rpc.js] Push registration rooms number:' + state.pending_room_keys?.length);
    console.log('[rpc.js] Push registration token is same:' + tokenIsSame);

    if (state.pending_room_keys.length === 0 && tokenIsSame && !state.include_device_push && !state.include_call_push) {
      this.pendingPushRoomKeys.clear();
      return { success: true, skipped: true };
    }

    if (!useGlobalStore.getState().huginNode.connected) {
      return null;
    }

    if (this.pushRegistrationInFlight) {
      return this.pushRegistrationInFlight;
    }

    if (this.pushRegistrationDebouncePromise) {
      return this.pushRegistrationDebouncePromise;
    }

    this.pushRegistrationDebouncePromise = new Promise((resolve, reject) => {
      console.log('[rpc.js] Starting push registration sync')
      this.pushRegistrationTimer = setTimeout(async () => {
        this.pushRegistrationTimer = null;
        this.pushRegistrationDebouncePromise = null;
        this.pushRegistrationInFlight = this.flush_push_registrations();

        try {
          const result = await this.pushRegistrationInFlight;
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.pushRegistrationInFlight = null;
          if (this.pendingPushRoomKeys.size > 0) {
            await this.sync_push_registrations();
          }
        }
      }, this.pushRegistrationDebounceMs);
    });

    return this.pushRegistrationDebouncePromise;
  }

  async on_message(m) {
    // console.log('Got message from bare: ', m)
    const json = m;
    if (!json) {
      console.log('** RPC ERROR, lib/rpc.js **');
      return;
    }
    if (json) {
      // console.log('[rpc.js] Got rpc message', json.type)
      if (json.type !== 'room-message-exists') {
        // console.log('Got rpc message', json.type);
      }
      switch (json.type) {
        case 'log':
          console.log("RPC LOG: ", json);
          break;
        case 'hugin-node-connected':
          useGlobalStore.getState().setHuginNode({connected: true});

          if (useGlobalStore.getState().appState !== 'active') {
             console.log('[rpc.js] App not active, skipping push registration sync');
             break;
          }

          if (this.pushRegistrationDone) {
             console.log('[rpc.js] Push registration already done this run, skipping');
             break;
          }

          if (useGlobalStore.getState().contacts.length === 0
          && useGlobalStore.getState().rooms.length === 0) {
            console.log('[rpc.js] No contacts or rooms, skipping push registration sync')
            break;
          }

          const prefs = usePreferencesStore.getState().preferences;
          const currentFirebaseToken = getDeviceId();
          if (currentFirebaseToken && currentFirebaseToken === prefs?.lastRegisteredDeviceToken) {
            console.log('[rpc.js] Push token has not changed since last registration, skipping');
            this.pushRegistrationDone = true;
            break;
          }

          await this.sync_push_registrations();
          console.log('[rpc.js] Push registration sync completed');
          this.pushRegistrationDone = true;
          break;
        case 'hugin-node-disconnected':
          console.log('Hugin node disconnected!')
          useGlobalStore.getState().setHuginNode({connected: false, address: null});
          break;
        case 'node-address':
          Nodes.address = json.address
          useGlobalStore.getState().setHuginNode({connected: true, address: json.address});
          break;
        case 'new-swarm':
          if (!json.beam && typeof json.key === 'string' && json.key.length > 0) {
            console.log('[rpc.js] New swarm started, syncing push registrations')
            await this.sync_push_registrations([json.key]);
          }
          break;
        case 'beam-message':
          console.log('beam-message on frontend')
          MessageSync.check_for_pm(json.message, json.hash, json.background);
          break;
        case 'pool-messages':
          console.log('[syncer.js] Received pool-messages')
          if (Array.isArray(json.messages) && json.messages.length > 0) {
            await MessageSync.decrypt(json.messages, false, json.background);
          }
          break;
        case 'beam-connected':
          //Change state to -> "connected"
          break;
        case 'new-beam':
          //Set some state 'started, not connected'
          console.log('[rpc.js] New beam started')
          // Only needs to be done once
          if (useGlobalStore.getState().contacts.length > 1) return;
          // await this.sync_push_registrations();
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
            syncRoomMessages(json.key);
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
          console.log('Error:', json);
          if (json.data?.message?.length > 0) {
            Toast.show({ text1: json.data?.message, type: 'error' });
          }
          break;
        case 'file-saved-to-downloads':
          Toast.show({ text1: `Saved ${json.data?.fileName || 'file'}`, type: 'success' });
          break;
        case 'downloading': {
          useGlobalStore.getState().patchFileDownload({
            hash: json.hash,
            fileName: json.fileName,
            time: json.time,
            chat: json.chat,
            progress: 0,
          });
          break;
        }
        case 'download-file-progress': {
          useGlobalStore.getState().patchFileDownload({
            hash: json.hash,
            fileName: json.fileName,
            time: json.time,
            chat: json.chat,
            progress: json.progress ?? 0,
          });
          if (json.progress === 100 && json.hash) {
            useGlobalStore.getState().clearFileDownload(json.hash);
          }
          break;
        }
        case 'file-downloaded': {
          const { fileName, hash, address, time, name, filePath, roomKey, topic, dm } = json;
          if (hash) useGlobalStore.getState().clearFileDownload(hash);
          if (dm) break; // DM files are handled by the dm-file event
          const fileInfo = {
            fileName,
            hash,
            timestamp: parseInt(time),
            sent: false,
            path: filePath,
            image: getImageFlag(fileName),
            topic,
            type: getMediaType(fileName),
          };
          await saveRoomMessageAndUpdate(
            address, fileName, roomKey, '', parseInt(time), name, hash, false, false, fileInfo,
          );
          break;
        }
        case 'save-file-info':
          break;
        case 'room-remote-file-added':
          for (const file of (json.remoteFiles ?? [])) {
            useGlobalStore.getState().addRemoteRoomFile(file);
          }
          break;
        case 'remote-dm-file-added':
          for (const file of (json.remoteFiles ?? [])) {
            useGlobalStore.getState().addRemoteDmFile(file);
          }
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
      case 'cn-turtle-lite-slow-hash-v2':
        return await cnTurtleLiteSlowHashV2(request.blobHex);
      case 'cn-fast-hash':
        return await cnFastHash(request.hashInput);
      case 'pow-find-share':
        const powStart = Date.now();
        console.log('Starting PoW search', request)
        let share = await findPowShare(
          request.blobHex,
          request.targetHex,
          request.startNonce,
          request.maxAttempts,
          request.nonceTagBits,
          request.nonceTagValue,
        );
        const powEnd = Date.now();
        if (share && share.hashes_performed) {
          const time_ms = powEnd - powStart;
          if (time_ms > 0) {
            const hashrate = (share.hashes_performed / time_ms) * 1000;
            const threads = share.threads || 1;
            console.log(`[PoW] Hashrate: ${hashrate.toFixed(2)} H/s (${share.hashes_performed} hashes / ${time_ms}ms / ${threads} threads)`);
            console.log('[PoW] Share', share)
          }
        }
        
        if (share && !share.nonce) {
          return null;
        }
        return share;
      default:
        return false;
    }
  }
}
