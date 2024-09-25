import {
  getLatestRoomMessages,
  saveRoomToDatabase,
  naclHash,
  getRoomMessages,
  removeRoomFromDatabase,
  getRooms,
} from '@/services';
import type { SelectedFile, FileInput, Message } from '@/types';
import { sleep } from '@/utils';

import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from '/lib/native';

import {
  getRoomsMessages,
  getCurrentGroupKey,
  setStoreGroups,
  setStoreRoomMessages,
} from '../zustand';

export const getUserGroups = async () => {
  const groups = await getLatestRoomMessages();
  setStoreGroups(groups);
};

export const peerConnected = (user) => {
  console.log('Peer connected, add:', user);
  //Update state
  //Here we also get status if the user is connected to a voice channel
  //updateVoiceChannelStatus(user)
};

export const peerDisconncted = (user) => {
  console.log('Peer disconnected, remove:', user);
  //user.key is the room where user.address should be removed from.
  //remove from voice channel
  //updateVoiceChannelStatus(user)
};

export const updateVoiceChannelStatus = (status) => {
  //Update the user voice status
};

export const updateMessages = async (message: Message) => {
  // const theme = useGlobalStore((state) => state.theme);
  const currentGroupKey = getCurrentGroupKey();
  console.log(currentGroupKey);

  if (currentGroupKey === message.room) {
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

export const onCreateGroup = async (
  name: string,
  key: string,
  seed: string,
) => {
  await saveRoomToDatabase(name, key, seed);
  return await swarm(naclHash(key), key);
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
  for (r of rooms) {
    await sleep(100);
    console.log('Joining room -->');
    console.log('With invite key:', r.key);
    await swarm(naclHash(r.key), r.key);
  }
};
