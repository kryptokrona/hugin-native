import type { Transaction } from 'kryptokrona-wallet-backend-js';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { Balance, Message, Room, User, Contact, Call, HuginNode } from '@/types';

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
  feedMessages: Message[];
  roomUsers: Record<string, User[]>;
  avatars: Record<string, string>;
  transactions: Transaction[];
  syncStatus: number[];
  fiatPrice: number;
  currentCall: Call;
  huginNode: HuginNode;
  typingUsers: Record<string, string[]>;
  setHuginNode: (payload: HuginNode) => void;
  setRoomMessages: (payload: Message[]) => void;
  setMessages: (payload: Message[]) => void;
  setFeedMessages: (payload: Message[]) => void;
  setCurrentRoom: (payload: string) => void;
  setCurrentContact: (payload: string) => void;
  setRoomUserList: (roomId: string, users: User[]) => void;
  setAuthenticated: (payload: boolean) => void;
  setStoreRooms: (payload: Room[]) => void;
  setStoreContacts: (payload: Contact[]) => void;
  setBalance: (payload: Balance) => void;
  setSyncStatus: (payload: number[]) => void;
  setFiatPrice: (payload: number) => void;
  setCurrentCall: (payload: Call) => void;
  resetCurrentCall: () => void;
  setUsers: (payload: User[]) => void;
  setAvatar: (address: string, avatar: string) => void;
  setTypingUsers: (roomId: string, users: string[]) => void;
  addTypingUser: (roomId: string, address: string) => void;
  removeTypingUser: (roomId: string, address: string) => void;
};

const defaultCall: Call = { 
  room: '', 
  users: [], 
  talkingUsers: {}, 
  time: 0 
};

export const useGlobalStore = create<
  GlobalStore,
  [['zustand/subscribeWithSelector', never]]
>(
  subscribeWithSelector((set) => ({
    typingUsers: {},
    address: '',
    authenticated: false,
    balance: { locked: 0, unlocked: 0 },
    contacts: [],
    currentCall: { ...defaultCall },
    fiatPrice: 0,
    messages: [],
    roomMessages: [],
    roomUsers: {},
    rooms: [],
    feedMessages: [],
    avatars: {},
    huginNode: {connected: false},
    setTypingUsers: (roomId: string, users: string[]) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [roomId]: users,
        },
      }));
    },

    addTypingUser: (roomId: string, address: string) => {
      set((state) => {
        const current = state.typingUsers[roomId] || [];
        if (current.includes(address)) return state;
        return {
          typingUsers: {
            ...state.typingUsers,
            [roomId]: [...current, address],
          },
        };
      });
    },

    removeTypingUser: (roomId: string, address: string) => {
      set((state) => {
        const current = state.typingUsers[roomId] || [];
        const updated = current.filter((a) => a !== address);
        return {
          typingUsers: {
            ...state.typingUsers,
            [roomId]: updated,
          },
        };
      });
    },
    setHuginNode: (huginNode: HuginNode) => {
      console.log('Setting node global state:', huginNode)
      set({ huginNode });
    },
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

    setFiatPrice: (fiatPrice: number) => {
      set({ fiatPrice });
    },
    setFeedMessages: (feedMessages: Message[]) => {
      set({ feedMessages });
    },
    setRoomMessages: (roomMessages: Message[]) => {
      set({ roomMessages });
    },
    setCurrentCall: (currentCall: Call) => {
      set({ currentCall });
    },
    resetCurrentCall: () => set({ currentCall: { ...defaultCall, time: Date.now() } }),
    setUsers(newUsers: User[]) {
      set((state) => ({
        currentCall: {
          ...state.currentCall,
          users: newUsers,
        },
      }));
    },
    setRoomUserList: (roomId: string, users: User[]) => {
      set((state) => ({
        roomUsers: { 
          ...state.roomUsers, 
          [roomId]: users 
        }
      }));
    },
    setNewName: (address: string, newName: string) => {
      set((state) => {
        const updatedRoomUsers = Object.fromEntries(
          Object.entries(state.roomUsers).map(([roomId, users]) => {
            const updatedUsers = users.map((user) =>
              user.address === address ? { ...user, name: newName } : user
            );
            return [roomId, updatedUsers];
          })
        );
        return { roomUsers: updatedRoomUsers };
      });
    },
    addRoomUser: (user: User) => {
      if (!user?.address.length || !user?.room?.length) return;
      set((state) => {
        const existingUsers = state.roomUsers[user.room] || [];        
        if (existingUsers.some(a => a.address == user.address)) return state;
        
        return {
          roomUsers: {
            ...state.roomUsers,
            [user.room]: [...existingUsers, user], // add to existing users
          },
        }; 
      });
    },
    removeRoomUser: (user: Object) => {
      if (!user?.address || !user?.address.length || !user?.key || !user?.key.length) {
        console.log('Invalid user input', user);
        return; // Exit early if data is invalid
      }
      set((state) => {
        const existingUsers = state.roomUsers[user.key] || [];
    
        const updatedUsers = existingUsers.filter(
          (u) => u.address !== user.address // filter out the user by address
        );
    
        return {
          roomUsers: {
            ...state.roomUsers,
            [user.key]: updatedUsers,
          },
        };
      });
    },
    updateRoomUser: (user: any) => {
      if (!user || !user.address || !user.room) return;
    
      set((state) => {
        const existingUsers = state.roomUsers[user.room] || [];
    
        const updatedUsers = existingUsers.map((u) => {
          if (u.address === user.address) {
            return {
              ...u,
              voice: user.voice,
              video: user.video,
              screenshare: user.screenshare,
              muted: user.audioMute,
            };
          }
          return u;
        });
    
        return {
          roomUsers: {
            ...state.roomUsers,
            [user.room]: updatedUsers,
          },
        };
      });
    },  
    updateConnectionStatus: (address: string, connectionStatus: string) => {
      set((state) => {
        console.log('Updating user state ', address, ' to ', connectionStatus);
        const updatedUsers = state.currentCall.users.map((user) => {
          if (user.address === address) {
            return {
              ...user,
              connectionStatus,
            };
          }
          return user;
        });

        return {
          currentCall: {
            ...state.currentCall,
            users: updatedUsers,
          },
        };
      });
    },
    setAvatar: (address: string, avatar: string) => {
      useGlobalStore.setState((state) => {
        // Only update if avatar is different
        if (state.avatars[address] === avatar) return state;
        return {
          avatars: {
            ...state.avatars,
            [address]: avatar,
          },
        };
      });
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

useGlobalStore.subscribe(
  (state) => state.thisContact,
  (current, _previous) => {
    const mContacts = useGlobalStore.getState().contacts;

    const updatedContacts = mContacts.map((contact) => {
      if (contact.address === current) {
        return {
          ...contact,
          unreads: 0,
        };
      }

      return contact;
    });
    useGlobalStore.setState({ contacts: updatedContacts });
  },
);

export const setAuthenticated = (authenticated: boolean) => {
  useGlobalStore.setState({ authenticated });
};

export const resetGlobalStore = () => {
  useGlobalStore.setState({
    address: '',
    authenticated: false,
    balance: { locked: 0, unlocked: 0 },
    contacts: [],
    currentCall: { ...defaultCall },
    fiatPrice: 0,
    messages: [],
    roomMessages: [],
    roomUsers: {},
    rooms: [],
    feedMessages: [],
    avatars: {},
    syncStatus: [],
    thisContact: '',
    thisRoom: '',
    transactions: [],
  });
};
