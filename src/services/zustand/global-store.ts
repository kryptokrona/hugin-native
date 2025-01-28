import type { Transaction } from 'kryptokrona-wallet-backend-js';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { Balance, Message, Room, User, Contact } from '@/types';

type GlobalStore = {
  balance: Balance;
  address: string;
  authenticated: boolean;
  rooms: Room[];
  contacts: Contact[];
  thisRoom: string;
  thisContact: string;
  roomMessages: Message[];
  messages: Message[];
  roomUsers: User[];
  transactions: Transaction[];
  syncStatus: number[];
  setRoomMessages: (payload: Message[]) => void;
  setMessages: (payload: Message[]) => void;
  setCurrentRoom: (payload: string) => void;
  setCurrentContact: (payload: string) => void;
  setRoomUserList: (payload: User[]) => void;
  setAuthenticated: (payload: boolean) => void;
  setStoreRooms: (payload: Room[]) => void;
  setStoreContacts: (payload: Contact[]) => void;
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
    contacts: [],
    messages: [],
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

    setCurrentContact: (thisContact: string) => {
      set({ thisContact });
    },
    setCurrentRoom: (thisRoom: string) => {
      set({ thisRoom });
    },

    setMessages: (messages: Message[]) => {
      set({ messages });
    },

    setRoomMessages: (roomMessages: Message[]) => {
      set({ roomMessages });
    },

    setRoomUserList: (roomUsers: User[]) => {
      set({ roomUsers });
    },
    setStoreContacts: (contacts: Contact[]) => {
      set({ contacts });
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
    thisContact: '',
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
