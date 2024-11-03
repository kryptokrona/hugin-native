// Only add getters that cannot be used in components directly

import { usePreferencesStore, useUserStore } from './async-storage-stores';

import { useGlobalStore } from './global-store';

export const getCurrentRoom = () => {
  const roomKey = useGlobalStore.getState().thisRoom;

  return roomKey;
};

export const getRoomsMessages = () => {
  const messages = useGlobalStore.getState().roomMessages;

  return messages;
};

export const getActiveRoomUsers = () => {
  return useGlobalStore.getState().roomUsers;
};

export const getUser = () => {
  return useUserStore.getState().user;
};

export const getAuthMethod = () => {
  return usePreferencesStore.getState().preferences?.authMethod;
};
