import {
  getLatestRoomMessages,
  naclHash,
  getRoomMessages,
  removeRoomFromDatabase,
  getRooms,
  saveRoomToDatabase,
  saveRoomsMessageToDatabase,
  randomKey,
} from '@/services';
import type { SelectedFile, FileInput, Message, User } from '@/types';
import { sleep } from '@/utils';

import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from '/lib/native';

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
  setStoreRooms(rooms.sort((a, b) => b.timestamp - a.timestamp));
};

export const peerConnected = (user) => {
  console.log('Peer connected, add:', user);
  const connected: User = {
    address: user.address,
    name: user.nickname,
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
  reply: string,
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
  for (r of rooms) {
    await sleep(100);
    console.log('Joining room -->');
    console.log('With invite key:', r.key);
    await swarm(naclHash(r.key), r.key);
  }
};

export const joinAndSaveRoom = async (
  key: string,
  name: string,
  admin: string,
  address: string,
  userName: string,
) => {
  await swarm(naclHash(key), key);
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
