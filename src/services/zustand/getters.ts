// Only add getters that cannot be used in components directly

import { useGlobalStore } from './global-store';

export const getStoreTheme = () => {
  const storeTheme = useGlobalStore.getState().theme;

  return storeTheme;
};

export const getCurrentGroupKey = () => {
  const roomKey = useGlobalStore.getState().currentGroupKey;

  return roomKey;
};

export const getRoomsMessages = () => {
  const messages = useGlobalStore.getState().roomMessages;

  return messages;
};

export const getPreferences = () => {
  const storePreferences = useGlobalStore.getState().preferences;

  return storePreferences;
};
