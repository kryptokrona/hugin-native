import type { Message, Room, User, Balance } from '@/types';

import { usePreferencesStore, useUserStore } from './async-storage-stores';
import { useGlobalStore } from './global-store';

export const setStoreRooms = (rooms: Room[]) => {
  useGlobalStore.setState({ rooms });
};

export const setBalance = ([unlockedBalance, lockedBalance]: [number, number]) => {
  console.log('Setting balance');
  console.log('Setting balance');
  console.log('Setting balance');
  console.log('Setting balance');
  console.log('Setting balance');
  const balance: Balance = {
      unlocked: unlockedBalance,
      locked: lockedBalance,
  };
  useGlobalStore.setState({ balance });
};

export const setStoreAddress = (address: string) => {
  console.log('Setting address');
  console.log('Setting address');
  console.log('Setting address');
  console.log('Setting address');
  console.log(address);
  useGlobalStore.setState({ address });
};


export const setStoreCurrentRoom = (thisRoom: string) => {
  useGlobalStore.setState({ thisRoom });
};

export const setStoreRoomMessages = (roomMessages: Message[]) => {
  useGlobalStore.setState({ roomMessages });
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

export const updateUser = async (value: Partial<User>) => {
  useUserStore.setState((state) => ({
    ...state,
    user: {
      ...state.user,
      ...value,
    },
  }));
};
