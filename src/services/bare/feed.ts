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
    getFeedMessages,
  getLatestRoomMessages,
  getRoomMessages,
  removeRoomFromDatabase,
  saveAccount,
  saveFeedMessage,
  saveFileInfo,
  saveRoomMessage,
  saveRoomToDatabase,
} from './sqlite';

import { Notify } from '../../services/utils';
import {
  getCurrentRoom,
  getRoomsMessages,
  setStoreCurrentRoom,
  setStoreFeedMessages,
  setStoreRooms,
  useGlobalStore,
  useUserStore,
} from '../zustand';
import { setRoomMessages } from './groups';

export const updateMessages = async (
  message: Message,
  background: boolean | undefined,
) => {
  
  console.log('Updating feed messages..')

    const messages = await getFeedMessages(0);

    console.log('Get feed messages from db: ', messages);

    if (message.reply?.length === 64) {
      if (containsOnlyEmojis(message.message) && message.message.length < 9) {
        const updatedMessage = messages.map((msg) => {
          if (msg.hash === message.reply) {
            return {
              ...msg,
              reactions: [
                ...new Set([...(msg.reactions || []), message.message]),
              ],
            };
          }
          return msg;
        });
        setStoreFeedMessages(updatedMessage);
        return;
      }

      const reply = messages.find((a) => a.hash === message.reply);
      if (reply !== undefined) {
        message.replyto = [reply];
      }
    }

    // const messageExists = messages.some((msg) => msg.hash === message.hash);
    // console.log('messageExists? ', messageExists);
    // if (!messageExists) {
    //   const updatedMessages = [...messages, message].sort(
    //     (a, b) => a.timestamp - b.timestamp,
    //   );
      setStoreFeedMessages(messages);
    // }
  }

//   if (!history && !inRoom && !background) {
//     Toast.show({
//       text1: message.nickname,
//       text2: message.message,
//       type: 'success',
//     });
//   } else if (background) {
//     Notify.new({ name: message.nickname, text: message.message }, background);
//   }


export const setFeedMessages = async (page: number) => {
  console.log('Load message page:', page);
  const messages = await getFeedMessages(page);

  setStoreFeedMessages(messages);
};


export const onSendFeedMessageWithFile = (
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


export const saveFeedMessageAndUpdate = async (
  address: string,
  message: string,
  reply: string,
  timestamp: number,
  nickname: string,
  hash: string,
  file?: FileInfo | undefined,
  tip?: TipType | undefined,
  background?: boolean | undefined,
) => {
  let isFile = false;
  if (typeof file === 'object') {
    isFile = true;
    await saveFileInfo(file);
  }

  console.log('Trying to save feed msg:', address,
    message,
    reply,
    timestamp,
    nickname,
    hash);

  const newMessage = await saveFeedMessage(
    address,
    message,
    reply,
    timestamp,
    nickname,
    hash
  );

//   if ((newMessage && !history) || (newMessage && history && background)) {
//     if (isFile) {
//       newMessage.file = file;
//     }
    await updateMessages(newMessage, background);
    // setFeedMessages();
//   }
};