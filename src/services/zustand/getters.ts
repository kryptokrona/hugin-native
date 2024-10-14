// Only add getters that cannot be used in components directly

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
