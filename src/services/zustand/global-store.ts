import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { defaultTheme } from '@/styles';
import type { Group, Preferences, Theme, User } from '@/types';
import { createAvatar } from '@/utils';

import { update_bare_user } from '../../../lib/native';
import { ASYNC_STORAGE_KEYS, setStorageValue } from '../async-storage';

type GlobalStore = {
  theme: Theme;
  user: User;
  preferences: Preferences;
  groups: Group[];

  setTheme: (payload: Theme) => void;
  setUser: (payload: User) => void;
  setPreferences: (payload: Preferences) => void;
  setGroups: (payload: Group[]) => void;
};

export const useGlobalStore = create<
  GlobalStore,
  [['zustand/subscribeWithSelector', never]]
>(
  subscribeWithSelector((set) => ({
    groups: [],
    preferences: defaultPreferences,
    setGroups: (groups: Group[]) => {
      set({ groups });
    },
    setPreferences: (preferences: Preferences) => {
      set({ preferences });
    },
    setTheme: (theme: Theme) => {
      set({ theme });
    },

    setUser: (user: User) => {
      set({ user });
    },
    theme: defaultTheme,
    user: defaultUser,
  })),
);

useGlobalStore.subscribe(
  (state) => state.preferences,
  async (preferences) => {
    if (!preferences) {
      return;
    }
    await setStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES, preferences);
  },
);

useGlobalStore.subscribe(
  (state) => state.user,
  async (user) => {
    if (!user) {
      return;
    }
    await setStorageValue(ASYNC_STORAGE_KEYS.USER, user);
    await update_bare_user(user);
  },
);

useGlobalStore.subscribe(
  (state) => state.theme,
  async (theme) => {
    if (theme) {
      await setStorageValue(ASYNC_STORAGE_KEYS.THEME, theme);
    }
  },
);

// HACK prevent cycling import, fix this
export const defaultPreferences: Preferences = {
  // authConfirmation: false,
  // authenticationMethod: 'hardware-auth',
  // currency: 'usd',
  language: 'en',
  // limitData: false,
  nickname: 'Anon',
  // notificationsEnabled: true,
  // scanCoinbaseTransactions: false,
  // websocketEnabled: true,
};

export const defaultUser = {
  address:
    'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme',
  avatar: createAvatar(),
  name: 'Anon',
};
