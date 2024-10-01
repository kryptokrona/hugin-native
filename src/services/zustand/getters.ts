// Only add getters that cannot be used in components directly

import { useGlobalStore } from './global-store';

export const getStoreTheme = () => {
  const storeTheme = useGlobalStore.getState().theme;

  return storeTheme;
};

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

export const getPreferences = () => {
  const storePreferences = useGlobalStore.getState().preferences;

  return storePreferences;
};
