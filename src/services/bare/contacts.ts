import { AppState } from 'react-native';

import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_idle_status,
  send_swarm_msg,
  swarm,
} from 'lib/native';

import type { FileInfo, FileInput, Message, SelectedFile } from '@/types';
import { sleep } from '@/utils';

import { naclHash, newKeyPair, randomKey } from './crypto';
import {
  getLatestMessages,
  getMessages,
  getRooms,
  removeRoomFromDatabase,
  saveAccount,
  saveFileInfo,
  saveRoomMessage,
  saveRoomToDatabase,
} from './sqlite';

import {
  getCurrentContact,
  getCurrentRoom,
  setStoreContacts,
  setStoreCurrentRoom,
  setStoreMessages,
  useGlobalStore,
  useUserStore,
} from '../zustand';

AppState.addEventListener('change', onAppStateChange);

let current = '';
async function onAppStateChange(state: string) {
  if (state === 'inactive') {
    console.log('Inactive state');
    //I think this is for iPhone only
  } else if (state === 'background') {
    send_idle_status(true);
    current = getCurrentRoom();
    setStoreCurrentRoom('');
    //Start background timer to shut off foreground task?
  } else if (state === 'active') {
    send_idle_status(false);
    setStoreCurrentRoom(current);
    current = '';

    //Reset timer?
  }
}

export const setLatestMessages = async () => {
  const latestContacts = await getLatestMessages();

  const currentContacts = useGlobalStore.getState().contacts;
  const userAddress = useUserStore.getState().user.address;
  const currentContact = useGlobalStore.getState().thisContact;
  const updatedContacts = latestContacts?.map((latestContact) => {
    const existingContact = latestContacts.find(
      (contact) => contact.messagekey === latestContact.messagekey,
    );

    const isFromUser = latestContact.address === userAddress;

    const newUnreads =
      existingContact &&
      latestContact.timestamp > (latestContact.timestamp || 0) &&
      !isFromUser
        ? (latestContact.unreads || 0) + 1
        : latestContact?.unreads || 0;

    return {
      ...latestContact,
      unreads: currentContact === latestContact.key ? 0 : newUnreads, // Reset unreads if in room
    };
  });

  setStoreContacts(
    updatedContacts?.sort((a, b) => b.timestamp - a.timestamp) ?? [],
  );
};

export const updateMessage = async (message: Message, history = false) => {
  const thisContact = getCurrentContact();
  const inRoom = thisContact === message.room;
  if (inRoom) {
    const messages = await getMessages(thisContact, 0);
    const updated = [...messages, message];
    setStoreMessages(updated);
  }
};

const updateVoiceChannelStatus = (status: any) => {
  //Update the user voice status
};

export const setMessages = async (contact: string, page: number) => {
  console.log('Load message page:', page);
  const messages = await getMessages(contact, page);
  console.log('Set store messs');
  setStoreMessages(messages);
};

const onSendGroupMessage = async (
  key: string,
  message: string,
  reply: string | null,
  tip: JSON | false,
) => {
  return await send_swarm_msg(key, message, reply, tip);
};

const onSendGroupMessageWithFile = (
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
  begin_send_file(JSONfileData);
};

const onRequestNewGroupKey = async () => {
  const key = await group_random_key();
  return key;
};

const onDeleteGroup = async (key: string) => {
  await removeRoomFromDatabase(key);
  await setLatestRoomMessages();
  onLeaveGroup(key);
};

const onLeaveGroup = (key: string) => {
  end_swarm(key);
};

const leaveRooms = async () => {
  const rooms = await getRooms();
  for (const r of rooms) {
    end_swarm(r.key);
  }
  await sleep(200);
  return;
};

const joinRooms = async () => {
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

const loadAdminKeys = async () => {
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

const joinAndSaveRoom = async (
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

const saveRoomMessageAndUpdate = async (
  address: string,
  message: string,
  room: string,
  reply: string,
  timestamp: number,
  nickname: string,
  hash: string,
  sent: boolean,
  history: boolean | undefined = false,
  file?: FileInfo | undefined,
  tip?: JSON | undefined,
) => {
  let isFile = false;
  if (typeof file === 'object') {
    isFile = true;
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
    tip,
  );

  if (newMessage && !history) {
    if (isFile) {
      newMessage.file = file;
    }
    updateMessage(newMessage);
  }

  if (!history) {
    setLatestMessages();
  }
};

const createUserAddress = async () => {
  const keys = newKeyPair();
  await saveAccount(keys.publicKey, keys.secretKey);

  return keys.publicKey;
};
