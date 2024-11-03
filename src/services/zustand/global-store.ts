import type { Message, Room, User } from '@/types';
import { getRoomUsers, joinRooms } from '../bare';
import { initDB, loadAccount } from '../bare/sqlite';

import { bare } from 'lib/native';
import { create } from 'zustand';
import { getUser } from './getters';
import { sleep } from '@/utils';
import { subscribeWithSelector } from 'zustand/middleware';

type GlobalStore = {
  authenticated: boolean;
  rooms: Room[];
  thisRoom: string;
  roomMessages: Message[];
  roomUsers: User[];
  setRooms: (payload: Room[]) => void;
  setRoomMessages: (payload: Message[]) => void;
  setCurrentRoom: (payload: string) => void;
  setRoomUserList: (payload: User[]) => void;
  setAuthenticated: (payload: boolean) => void;
};

export const useGlobalStore = create<
  GlobalStore,
  [['zustand/subscribeWithSelector', never]]
>(
  subscribeWithSelector((set) => ({
    authenticated: false,
    rooms: [],
    thisRoom: '',
    roomMessages: [],
    roomUsers: [],

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
    setAuthenticated: (authenticated: boolean) => {
      set({ authenticated });
    },
  })),
);

useGlobalStore.subscribe(
  (state) => state.authenticated,
  async (authenticated) => {
    if (authenticated) {
      console.log('User is authenticated');
      const user = getUser();
      await bare(user);
      console.log('Initializing database..');
      await initDB();
      getRoomUsers();
      await sleep(100);
      const acc = await loadAccount();
      console.log('Account', acc);

      await joinRooms();
    }
  },
);
