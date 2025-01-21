import type { Transaction } from 'kryptokrona-wallet-backend-js';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { Balance, Message, Room, User } from '@/types';

type GlobalStore = {
  balance: Balance;
  address: string;
  authenticated: boolean;
  rooms: Room[];
  thisRoom: string;
  roomMessages: Message[];
  roomUsers: User[];
  transactions: Transaction[];
  syncStatus: number[];
  setRoomMessages: (payload: Message[]) => void;
  setCurrentRoom: (payload: string) => void;
  setRoomUserList: (payload: User[]) => void;
  setAuthenticated: (payload: boolean) => void;
  setStoreRooms: (payload: Room[]) => void;
  setBalance: (payload: Balance) => void;
  setSyncStatus: (payload: number[]) => void;
};

export const useGlobalStore = create<
  GlobalStore,
  [['zustand/subscribeWithSelector', never]]
>(
  subscribeWithSelector((set) => ({
    address: '',
    authenticated: false,
    balance: { locked: 0, unlocked: 0 },
    roomMessages: [],
    roomUsers: [],
    rooms: [],
    setAddress: async (address: string) => {
      set({ address });
    },
    setAuthenticated: (authenticated: boolean) => {
      set({ authenticated });
    },
    setBalance: async (balance: Balance) => {
      set({ balance });
    },

    setCurrentRoom: (thisRoom: string) => {
      set({ thisRoom });
    },

    setRoomMessages: (roomMessages: Message[]) => {
      set({ roomMessages });
    },

    setRoomUserList: (roomUsers: User[]) => {
      set({ roomUsers });
    },
    setStoreRooms: async (rooms: Room[]) => {
      set({ rooms });
    },
    setSyncStatus: (syncStatus: number[]) => {
      set({ syncStatus });
    },
    setTransactions: (transactions: Transaction[]) => {
      set({ transactions });
    },
    syncStatus: [],
    thisRoom: '',
    transactions: [],
  })),
);

useGlobalStore.subscribe(
  (state) => state.thisRoom,
  (current, _previous) => {
    const mRooms = useGlobalStore.getState().rooms;

    const updatedRooms = mRooms.map((room) => {
      if (room.roomKey === current) {
        return {
          ...room,
          unreads: 0,
        };
      }

      return room;
    });
    useGlobalStore.setState({ rooms: updatedRooms });
  },
);

export const setAuthenticated = (authenticated: boolean) => {
  useGlobalStore.setState({ authenticated });
};
