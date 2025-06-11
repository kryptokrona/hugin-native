import Toast from 'react-native-toast-message';

import { Rooms } from 'lib/native';

import type {
  FileInfo,
  FileInput,
  Message,
  SelectedFile,
  TipType,
} from '@/types';
import { containsOnlyEmojis } from '@/utils';

import { naclHash, newKeyPair, randomKey } from './crypto';
import {
  getLatestRoomMessages,
  getRoomMessages,
  removeRoomFromDatabase,
  saveAccount,
  saveFileInfo,
  saveRoomMessage,
  saveRoomToDatabase,
} from './sqlite';

import { Notify } from '../../services/utils';
import {
  getCurrentRoom,
  getRoomsMessages,
  setStoreCurrentRoom,
  setStoreRoomMessages,
  setStoreRooms,
  useGlobalStore,
  useUnreadMessagesStore,
  useUserStore,
} from '../zustand';

import { navigationRef } from '@/contexts';

export const setLatestRoomMessages = async (history: boolean) => {
  if (history) return
  const latestRooms = await getLatestRoomMessages();
  setStoreRooms(latestRooms?.sort((a, b) => b.timestamp - a.timestamp) ?? []);
};

export const updateMessages = async (
  message: Message,
  history = false,
  background: boolean | undefined,
) => {
  const thisRoom = getCurrentRoom();
  const inRoom = thisRoom === message.room;

  if (inRoom) {

    const messages = getRoomsMessages();

    if (message.reply?.length === 64) {
      if (containsOnlyEmojis(message.message) && message.message.length < 9) {
        const updatedMessage = messages.map((msg) => {
          if (msg.hash === message.reply) {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), message.message]
            };
          }
          return msg;
        });
        setStoreRoomMessages(updatedMessage);
        return;
      }

      const reply = messages.find((a) => a.hash === message.reply);
      if (reply !== undefined) {
        message.replyto = [reply];
      }
    }

    const messageExists = messages.some((msg) => msg.hash === message.hash);
    if (!messageExists) {
      const updatedMessages = [...messages, message].sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      setStoreRoomMessages(updatedMessages);
    }
  } else {
    //Not active in this room. Add it to unread.
    useUnreadMessagesStore.getState().addUnreadRoomMessage(message)
  }

  const roomName = useGlobalStore.getState().rooms.find(room => room.roomKey === message.room)?.name;
  if (!history && !inRoom && !background && !message.file) {
    Toast.show({
      text1: message.nickname + ' in ' + roomName,
      text2: message.message,
      type: 'success',
      onPress: () => {
        navigationRef.navigate('GroupChatScreen', {
          name: roomName,
          roomKey: message.room,
        });
      },

    });
  } else if (background) {
    Notify.new({ name: message.nickname + " in " + roomName, text: message.message }, background, {roomKey: message.room, type: 'room', name: roomName});
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
  tip: TipType | false,
) => {
  return await Rooms.message(key, message, reply, tip);
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
  Rooms.file(JSONfileData);
};

export const onDeleteGroup = async (key: string) => {
  await removeRoomFromDatabase(key);
  await setLatestRoomMessages();
  onLeaveGroup(key);
};

export const onLeaveGroup = (key: string) => {
  Rooms.leave(key);
};

export const joinAndSaveRoom = async (
  key: string,
  name: string,
  address: string,
  userName: string,
  admin?: string,
) => {
  Rooms.new(naclHash(key), key, admin);
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
  file?: FileInfo | undefined,
  tip?: TipType | undefined,
  background?: boolean | undefined,
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

  if ((newMessage && !history) || (newMessage && history && background)) {
    if (isFile) {
      newMessage.file = file;
    }
    await updateMessages(newMessage, history, background);
  }

  setLatestRoomMessages(history);
};

export const createUserAddress = async () => {
  const keys = newKeyPair();
  await saveAccount(keys.publicKey, keys.secretKey);

  return keys.publicKey;
};
