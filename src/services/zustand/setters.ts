import type { Message, Room, User } from '@/types';
import { usePreferencesStore, useUserStore } from './async-storage-stores';

import { useGlobalStore } from './global-store';

export const setStoreRooms = (rooms: Room[]) => {
  useGlobalStore.setState({ rooms });
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
