import type { FileInput, Message, SelectedFile } from '@/types';
import {
  beginSendFile,
  endSwarm,
  groupRandomKey,
  initSwarm,
  sendSwarmMsg,
} from './lib-native-get-bus';
import { containsOnlyEmojis, sleep } from '@/utils';
import {
  getCurrentRoom,
  getRoomsMessages,
  setStoreCurrentRoom,
  setStoreRoomMessages,
} from '../zustand';
import {
  getLatestRoomMessages,
  getRoomMessages,
  getRooms,
  removeRoomFromDatabase,
  saveAccount,
  saveRoomToDatabase,
  saveRoomsMessageToDatabaseSql,
} from './sqlite';
import { naclHash, newKeyPair, randomKey } from './crypto';

export const getRoomUsers = async () => {
  const rooms = await getLatestRoomMessages();
  const fixed = [];
  for (const room of rooms) {
    try {
      const m = JSON.parse(room.message);
      if (m?.fileName) {
        room.message = m.fileName;
      }
      fixed.push(room);
    } catch (e) {
      fixed.push(room);
    }
  }

  return rooms.sort((a, b) => b.timestamp - a.timestamp);
};

export const updateMessages = async (message: Message) => {
  // const theme = useThemeStore((state) => state.theme);
  const thisRoom = getCurrentRoom();
  console.log(thisRoom);

  if (thisRoom === message.room) {
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
  return await sendSwarmMsg(key, message, reply);
};

export const onSendGroupMessageWithFile = (
  key: string,
  file: SelectedFile,
  message: string,
) => {
  const fileData: FileInput = {
    ...file,
    key,
    message,
  };
  const JSONfileData = JSON.stringify(fileData);
  beginSendFile(JSONfileData);
};

export const onRequestNewGroupKey = async () => {
  const key = await groupRandomKey();
  return key;
};

export const onDeleteGroup = async (key: string) => {
  await removeRoomFromDatabase(key);
  await getRoomUsers();
  onLeaveGroup(key);
};

export const onLeaveGroup = (key: string) => {
  endSwarm(key);
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
    await initSwarm(naclHash(r.key), r.key, admin);
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
  admin: string,
  address: string,
  userName: string,
) => {
  await initSwarm(naclHash(key), key, admin);
  console.log('Swarm launched');
  await saveRoomToDatabase(name, key, admin);
  await saveRoomsMessageToDatabaseSql(
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
  getRoomUsers();
};

export const saveRoomsMessageToDatabaseAndUpdateStore = async (
  address: string,
  message: string,
  room: string,
  reply: string,
  timestamp: number,
  nickname: string,
  hash: string,
  sent: boolean,
) => {
  const newMessage = await saveRoomsMessageToDatabaseSql(
    address,
    message,
    room,
    reply,
    timestamp,
    nickname,
    hash,
    sent,
  );

  if (newMessage) {
    updateMessages(newMessage);
  }
};

export const createUserAddress = async () => {
  const keys = newKeyPair();
  await saveAccount(keys.publicKey, keys.secretKey);

  return keys.publicKey;
};
