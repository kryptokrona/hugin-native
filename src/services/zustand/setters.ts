import type { Transaction } from 'kryptokrona-wallet-backend-js';

import type { Balance, Message, Room, User, Contact } from '@/types';

import { usePreferencesStore, useUserStore } from './async-storage-stores';
import { useGlobalStore } from './global-store';

export const setStoreRooms = (rooms: Room[]) => {
  useGlobalStore.setState({ rooms });
};

export const setStoreContacts = (contacts: Contact[]) => {
  useGlobalStore.setState({ contacts });
};

export const setSyncStatus = (syncStatus: number[]) => {
  console.log('syncStatus', syncStatus);
  useGlobalStore.setState({ syncStatus });
};

export const setBalance = ([unlockedBalance, lockedBalance]: [
  number,
  number,
]) => {
  const balance: Balance = {
    locked: lockedBalance,
    unlocked: unlockedBalance,
  };
  useGlobalStore.setState({ balance });
};

export const setTransactions = (transactions: Transaction[]) => {
  useGlobalStore.setState({ transactions });
};

export const setStoreAddress = (address: string) => {
  useGlobalStore.setState({ address });
};

export const setStoreCurrentRoom = (thisRoom: string) => {
  console.log('setStoreCurrentRoom', thisRoom);
  useGlobalStore.setState({ thisRoom });
};

export const setStoreFeedMessages = (feedMessages: Message[]) => {
  console.log('Setting feedmessages..', feedMessages);
  useGlobalStore.setState({ feedMessages });
};

export const setStoreRoomMessages = (roomMessages: Message[]) => {
  useGlobalStore.setState({ roomMessages });
};

export const setStoreCurrentContact = (thisContact: string) => {
  useGlobalStore.setState({ thisContact });
};

export const setStoreMessages = (messages: Message[]) => {
  useGlobalStore.setState({ messages });
};

export const setStoreActiveRoomUsers = (roomUsers: User[]) => {
  useGlobalStore.setState({ roomUsers });
};

export const updateLanguage = async (language: string) => {
  usePreferencesStore.setState((state) => ({
    ...state,
    preferences: {
      ...state.preferences,
      language,
    },
  }));
};

export const updateUser = (value: Partial<User>) => {
  useUserStore.setState((state) => ({
    ...state,
    user: {
      ...state.user,
      ...value,
    },
  }));
};
