import {
  getLatestRoomMessages,
  saveRoomToDatabase,
  naclHash,
  getRoomMessages,
} from '@/services';
import type { SelectedFile, FileInput, Message } from '@/types';

import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from '/lib/native';

import {getRoomsMessages, getCurrentGroupKey, setStoreGroups, setStoreRoomMessages } from '../zustand';

export const getUserGroups = async () => {
  const groups = await getLatestRoomMessages();
  setStoreGroups(groups);
};

export const updateMessages = async (message: Message) => {

  // const theme = useGlobalStore((state) => state.theme);
  const currentGroupKey = getCurrentGroupKey();
  console.log(currentGroupKey);
  
  if (currentGroupKey == message.room) {
    const messages = getRoomsMessages();
    messages.push(message);
    setStoreRoomMessages(messages);
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
  invite: string,
) => {
  return await send_swarm_msg(key, message, reply, invite);
};

export const onSendGroupMessageWithFile = (
  key: string,
  file: SelectedFile,
  message: string,
  invite: string,
) => {
  const fileData: FileInput & { message: string } = {
    ...file,
    invite,
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
  return await swarm(naclHash(key));
};

export const onRequestNewGroupKey = async () => {
  return await group_random_key();
};

export const onDeleteGroup = (_topic: string) => {
  // TODO
};

export const onLeaveGroup = (key: string) => {
  end_swarm(naclHash(key));
};
