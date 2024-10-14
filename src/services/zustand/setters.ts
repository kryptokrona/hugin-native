import type { Message, Room, User } from '@/types';

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
