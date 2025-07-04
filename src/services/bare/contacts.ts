// import { naclHash, newKeyPair, randomKey } from './crypto';

// import { AppState } from 'react-native';

// import { send_idle_status } from 'lib/native';

import type { Message } from '@/types';
import Toast from 'react-native-toast-message';
import { navigationRef } from '@/contexts';
import { getLatestMessages, getMessages } from './sqlite';

import {
  getCurrentContact,
  setStoreContacts,
  setStoreMessages,
  useGlobalStore,
  useUnreadMessagesStore,
  useUserStore,
} from '../zustand';
import { Notify } from '../../services/utils';
import { MainScreens } from '@/config';

// import { sleep } from '@/utils';

// AppState.addEventListener('change', onAppStateChange);

// let current = '';
// async function onAppStateChange(state: string) {
//   if (state === 'inactive') {
//     console.log('Inactive state');
//     //I think this is for iPhone only
//   } else if (state === 'background') {
//     send_idle_status(true);
//     current = getCurrentRoom();
//     setStoreCurrentRoom('');
//     //Start background timer to shut off foreground task?
//   } else if (state === 'active') {
//     send_idle_status(false);
//     setStoreCurrentRoom(current);
//     current = '';

//     //Reset timer?
//   }
// }

export const setLatestMessages = async () => {
  const latestContacts = await getLatestMessages();
  setStoreContacts(
    latestContacts?.sort((a, b) => b.timestamp - a.timestamp) ?? [],
  );
};

export const updateMessage = async (message: Message, background: boolean) => {
  const thisContact = getCurrentContact();
  const inRoom = thisContact === message.room;
  const messages = await getMessages(message.room, 0);
  if (inRoom) {
    setStoreMessages(messages);
  } else {
     useUnreadMessagesStore.getState().addUnreadPrivateMessage(message)
     const messageAge = Date.now() - message.timestamp;
     if (!background && messageAge < (1000 * 30)) {

         Toast.show({
           text1: message.nickname,
           text2: message.message,
           type: 'success',
           onPress: () => {
            setStoreMessages(messages);

              navigationRef.navigate(MainScreens.MessageStack, {
                screen: MainScreens.MessageScreen,
                params: {
                  name: message.nickname,
                  roomKey: message.address,
                },
              });

            },
            
         });
       }
  }
  if (background) {
    const contacts = useGlobalStore.getState().contacts;
    for (const contact of contacts) {
      if (contact.address === message.address) {
          Notify.new({ 
            name: contact.name, 
            text: message.message }, background, {} //Todo: Data for navigation on click notif.
          )
          break;
      }
    }
  }
}

export const setMessages = async (contact: string, page: number) => {
  console.log('Load message page:', page);
  const messages = await getMessages(contact, page);
  console.log('Set store messs');
  setStoreMessages(messages);
};
