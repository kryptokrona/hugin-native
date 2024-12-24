import type { Message, Room, User, Balance, Address } from '@/types';
import type { Transaction } from 'kryptokrona-wallet-backend-js';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

type GlobalStore = {
  balance: Balance;
  address: string;
  authenticated: boolean;
  rooms: Room[];
  thisRoom: string;
  roomMessages: Message[];
  roomUsers: User[];
  transactions: Transaction[];
  setRooms: (payload: Room[]) => void;
  setRoomMessages: (payload: Message[]) => void;
  setCurrentRoom: (payload: string) => void;
  setRoomUserList: (payload: User[]) => void;
  setAuthenticated: (payload: boolean) => void;
  setStoreRooms: (payload: Room[]) => void;
  setBalance: (payload: Balance) => void;
};

export const useGlobalStore = create<
  GlobalStore,
  [['zustand/subscribeWithSelector', never]]
>(
  subscribeWithSelector((set) => ({
    authenticated: false,
    rooms: [],
    thisRoom: '',
    address: '',
    roomMessages: [],
    roomUsers: [],
    balance: {unlocked: 0, locked: 0},
    transactions: [],

    setCurrentRoom: (thisRoom: string) => {
      set({ thisRoom });
    },

    setTransactions: (transactions: Transaction[]) => {
      set({ transactions });
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
    setBalance: async (balance: Balance) => {
      set({ balance });
    },
    setAddress: async (address: string) => {
      set({ address });
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
