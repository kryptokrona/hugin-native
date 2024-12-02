import { AppState } from 'react-native';

import Toast from 'react-native-toast-message';

import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from 'lib/native';

import type { FileInfo, FileInput, Message, SelectedFile } from '@/types';
import { containsOnlyEmojis, sleep } from '@/utils';

import { naclHash, newKeyPair, randomKey } from './crypto';
import {
  getLatestRoomMessages,
  getRoomMessages,
  getRooms,
  removeRoomFromDatabase,
  saveAccount,
  saveRoomToDatabase,
  saveRoomMessage,
  saveFileInfo,
} from './sqlite';

import { notify } from '../utils';
import {
  getCurrentRoom,
  getRoomsMessages,
  setStoreCurrentRoom,
  setStoreRoomMessages,
  setStoreRooms,
} from '../zustand';

AppState.addEventListener('change', onAppStateChange);

let current = '';
async function onAppStateChange(state: string) {
  if (state === 'inactive') {
    console.log('Inactive state');
    //I think this is for iPhone only
  } else if (state === 'background') {
    current = getCurrentRoom();
    setStoreCurrentRoom('');
    //Start background timer to shut off foreground task?
  } else if (state === 'active') {
    setStoreCurrentRoom(current);
    current = '';
    //Reset timer?
  }
}

export const setLatestRoomMessages = async () => {
  const rooms = await getLatestRoomMessages();
  setStoreRooms(rooms.sort((a, b) => b.timestamp - a.timestamp));
};

export const updateMessages = async (message: Message, history = false) => {
  const thisRoom = getCurrentRoom();
  const inRoom = thisRoom === message.room;
  if (inRoom || current) {
    const messages = getRoomsMessages();

    //Update reply
    if (message.reply?.length === 64) {
      if (containsOnlyEmojis(message.message) && message.message.length < 9) {
        const updatedMessage = messages.map((msg) => {
          if (msg.hash === message.reply) {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), message.message],
            };
          }
          return msg;
        });
        setStoreRoomMessages(updatedMessage);
        return;
      }
      //Add original message to this reply
      const reply = messages.find((a) => a.hash === message.reply);
      if (reply !== undefined) {
        message.replyto = [reply];
      }
    }
    const updatedMessages = [...messages, message];
    setStoreRoomMessages(updatedMessages);
  }

  if (!history && !inRoom) {
    if (current.length === 0) {
      Toast.show({
        text1: message.nickname,
        text2: message.message,
        type: 'success',
      });
    } else {
      notify({ name: message.nickname, text: message.message }, 'New message');
    }
  }
};

export const updateVoiceChannelStatus = (status: any) => {
  //Update the user voice status
};

export const setRoomMessages = async (room: string, page: number) => {
  console.log('Load message page:', page);
  const messages = await getRoomMessages(room, page);
  setStoreRoomMessages(messages);
};

export const onSendGroupMessage = async (
  key: string,
  message: string,
  reply: string | null,
) => {
  return await send_swarm_msg(key, message, reply);
};

export const onSendGroupMessageWithFile = (
  key: string,
  file: SelectedFile,
  message: string,
) => {
  console.log('here 1', { key });
  const fileData: FileInput = {
    ...file,
    key,
    message,
  };
  const JSONfileData = JSON.stringify(fileData);
  begin_send_file(JSONfileData);
};

export const onRequestNewGroupKey = async () => {
  const key = await group_random_key();
  return key;
};

export const onDeleteGroup = async (key: string) => {
  await removeRoomFromDatabase(key);
  await setLatestRoomMessages();
  onLeaveGroup(key);
};

export const onLeaveGroup = (key: string) => {
  end_swarm(key);
};

export const joinRooms = async () => {
  console.log('********* Joining rooms! ***********');
  const rooms = await getRooms();
  // for (r of rooms) {
  //   await sleep(100);
  //   await onDeleteGroup(r.key);
  // }
  const adminkeys = await loadAdminKeys();
  for (const r of rooms) {
    const key = adminkeys.find((a) => a.key === r.key && a.seed);
    const admin: string = key?.seed;
    await sleep(100);
    console.log('Joining room -->');
    await swarm(naclHash(r.key), r.key, admin);
  }
};

export const loadAdminKeys = async () => {
  const rooms = await getRooms();
  const keys = [];
  for (const r of rooms) {
    if (r.seed) {
      const admin = { key: r.key, seed: r.seed };
      keys.push(admin);
    }
  }
  return keys;
};

export const joinAndSaveRoom = async (
  key: string,
  name: string,
  address: string,
  userName: string,
  admin?: string,
) => {
  await swarm(naclHash(key), key, admin);
  console.log('Swarm launched');
  await saveRoomToDatabase(name, key, admin);
  await saveRoomMessageAndUpdate(
    address,
    'Joined room',
    key,
    '',
    Date.now(),
    userName,
    randomKey(),
    true,
  );
  setRoomMessages(key, 0);
  setStoreCurrentRoom(key);
};

export const saveRoomMessageAndUpdate = async (
  address: string,
  message: string,
  room: string,
  reply: string,
  timestamp: number,
  nickname: string,
  hash: string,
  sent: boolean,
  history: boolean | undefined = false,
  file: FileInfo | undefined | boolean,
) => {
  if (typeof file === 'object') {
    await saveFileInfo(file);
  }

  const newMessage = await saveRoomMessage(
    address,
    message,
    room,
    reply,
    timestamp,
    nickname,
    hash,
    sent,
  );

  if (newMessage && !history) {
    updateMessages(newMessage);
  }

  if (!history) {
    setLatestRoomMessages();
  }
};

export const createUserAddress = async () => {
  const keys = newKeyPair();
  await saveAccount(keys.publicKey, keys.secretKey);

  return keys.publicKey;
};
