import {
  getLatestRoomMessages,
  getRoomMessages,
  getRooms,
  naclHash,
  randomKey,
  removeRoomFromDatabase,
  saveRoomToDatabase,
  saveRoomsMessageToDatabase,
} from '@/services';
import type { FileInput, Message, SelectedFile, User } from '@/types';

import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from '/lib/native';

import { containsOnlyEmojis, sleep } from '@/utils';

import {
  getActiveRoomUsers,
  getCurrentRoom,
  getRoomsMessages,
  setStoreActiveRoomUsers,
  setStoreCurrentRoom,
  setStoreRoomMessages,
  setStoreRooms,
} from '../zustand';

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
  setStoreRooms(rooms.sort((a, b) => b.timestamp - a.timestamp));
};

export const peerConnected = (user) => {
  console.log('Peer connected, add:', user);
  const connected: User = {
    address: user.address,
    name: user.name,
    room: user.key,
  };
  const users = getActiveRoomUsers();
  console.log('online users in all groups', users.length);
  const updateList = [...users, connected];
  console.log('Updated:', updateList.length);
  setStoreActiveRoomUsers(updateList);
  //Here we also get status if the user is connected to a voice channel
  //updateVoiceChannelStatus(user)
};

export const peerDisconncted = (user) => {
  console.log('Peer disconnected, remove:', user);
  const users = getActiveRoomUsers();
  console.log('Users active', users.length);
  const updateList = users.filter(
    (a: User) => a.address !== user.address && a.room !== user.key,
  );
  console.log('Updated list', updateList.length);
  setStoreActiveRoomUsers(updateList);
  //updateVoiceChannelStatus(user)
};

export const updateVoiceChannelStatus = (status) => {
  //Update the user voice status
};

export const updateMessages = async (message: Message) => {
  // const theme = useGlobalStore((state) => state.theme);
  const thisRoom = getCurrentRoom();
  console.log(thisRoom);

  if (thisRoom === message.room) {
    const messages = getRoomsMessages();

    //Update reply
    if (message.reply?.length === 64) {
      //Update reactions
      if (containsOnlyEmojis(message.message) && message.message.length < 9) {
        const update = messages.find((a) => a.hash === message.reply);
        console.log('React to this!', update);
        if (update !== undefined) {
          //TODO ** FIX React sucks, this is not reactive?
          update.reactions?.push(message.message);
          setStoreRoomMessages(messages);
          return;
        }
      }
      //Add original message to this reply
      const reply = messages.find((a) => a.hash === message.reply);
      if (reply !== undefined) {
        message.replyto = [reply];
        return;
      }
    }
    const updatedMessages = [...messages, message];
    setStoreRoomMessages(updatedMessages);
  }
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
  const fileData: FileInput & { message: string } = {
    ...file,
    key,
    message,
  };
  const JSONfileData = JSON.stringify(fileData);
  begin_send_file(JSONfileData);
};

export const onRequestNewGroupKey = async () => {
  return await group_random_key();
};

export const onDeleteGroup = async (key: string) => {
  await removeRoomFromDatabase(key);
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
    const admin = key?.seed;
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
  admin: string,
  address: string,
  userName: string,
) => {
  await swarm(naclHash(key), key, admin);
  console.log('Swarm launched');
  await saveRoomToDatabase(name, key, admin);
  await saveRoomsMessageToDatabase(
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
