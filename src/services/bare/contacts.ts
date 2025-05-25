// import { naclHash, newKeyPair, randomKey } from './crypto';

// import { AppState } from 'react-native';

// import { send_idle_status } from 'lib/native';

import type { Message } from '@/types';

import { getLatestMessages, getMessages } from './sqlite';

import {
  getCurrentContact,
  setStoreContacts,
  setStoreMessages,
  useGlobalStore,
  useUserStore,
} from '../zustand';
import { Notify } from '../../services/utils';

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
  const currentContacts = useGlobalStore.getState().contacts;
  const userAddress = useUserStore.getState().user.address;
  const currentContact = useGlobalStore.getState().thisContact;
  const updatedContacts = latestContacts?.map((latestContact) => {
    const existingContact = currentContacts.find(
      (contact) => contact.messagekey === latestContact.messagekey,
    );

    const isFromUser = latestContact.address === userAddress;

    const newUnreads =
      existingContact &&
      latestContact.timestamp > (existingContact.timestamp || 0) &&
      !isFromUser
        ? (existingContact.unreads || 0) + 1
        : existingContact?.unreads || 0;

    return {
      ...latestContact,
      unreads: currentContact === latestContact.address ? 0 : newUnreads, // Reset unreads if in room
    };
  });

  setStoreContacts(
    updatedContacts?.sort((a, b) => b.timestamp - a.timestamp) ?? [],
  );
};

export const updateMessage = async (message: Message, background: boolean) => {
  const thisContact = getCurrentContact();
  const inRoom = thisContact === message.room;
  if (inRoom) {
    const messages = await getMessages(thisContact, 0);
    setStoreMessages(messages);
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
