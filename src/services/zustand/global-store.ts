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
    roomMessages: [],
    messages: [],
    roomUsers: [],
    rooms: [],
    contacts: [],
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
    setCurrentContact: (thisContact: string) => {
      set({ thisContact });
    },

    setRoomMessages: (roomMessages: Message[]) => {
      set({ roomMessages });
    },

    setMessages: (messages: Message[]) => {
      set({ messages });
    },

    setRoomUserList: (roomUsers: User[]) => {
      set({ roomUsers });
    },
    setStoreRooms: async (rooms: Room[]) => {
      set({ rooms });
    },
    setStoreContacts: (contacts: Contact[]) => {
      set({ contacts });
    },
    setSyncStatus: (syncStatus: number[]) => {
      set({ syncStatus });
    },
    setTransactions: (transactions: Transaction[]) => {
      set({ transactions });
    },
    syncStatus: [],
    thisRoom: '',
    thisContact: '',
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
