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

export const getBalance = () => {
  return useGlobalStore.getState().balance;
};

export const getAddress = () => {
  return useGlobalStore.getState().address;
};

export const getTransactions = () => {
  return useGlobalStore.getState().transactions;
};