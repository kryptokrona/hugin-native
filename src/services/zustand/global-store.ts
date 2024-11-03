import type { Message, Room, User } from '@/types';

import { create } from 'zustand';
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
  setStoreRooms: (payload: Room[]) => void;
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
    setStoreRooms: async (rooms: Room[]) => {
      set({ rooms });
    },
  })),
);

// useGlobalStore.subscribe(
//   (state) => state.authenticated,
//   async (authenticated) => {
//     if (authenticated) {
//       const user = useUserStore.getState().user;
//       await onAuthenticated(user);
//     }
//   },
// );

export const setAuthenticated = (authenticated: boolean) => {
  useGlobalStore.setState({ authenticated });
};
