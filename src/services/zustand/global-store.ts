import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { Message, Room, User } from '@/types';

type GlobalStore = {
  rooms: Room[];
  thisRoom: string;
  roomMessages: Message[];
  roomUsers: User[];
  setRooms: (payload: Room[]) => void;
  setRoomMessages: (payload: Message[]) => void;
  setCurrentRoom: (payload: string) => void;
  setRoomUserList: (payload: User[]) => void;
};

export const useGlobalStore = create<
  GlobalStore,
  [['zustand/subscribeWithSelector', never]]
>(
  subscribeWithSelector((set) => ({
    roomMessages: [],
    roomUsers: [],
    rooms: [],
    setCurrentRoom: (thisRoom: string) => {
      set({ thisRoom });
    },

    setRoomMessages: (roomMessages: Message[]) => {
      set({ roomMessages });
    },
    setRoomUserList: (roomUsers: User[]) => {
      set({ roomUsers });
    },
    setRooms: (rooms: Room[]) => {
      set({ rooms });
    },

    thisRoom: '',
  })),
);
