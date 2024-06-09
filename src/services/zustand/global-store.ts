import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// import { defaultPreferences } from '@/config';
import { Themes } from '@/styles';
import type { Preferences, Theme } from '@/types';

import { setPreferences } from './setters';

import { ASYNC_STORAGE_KEYS, setStorageValue } from '../async-storage';

// HACK prevent cycling import, fix this
export const defaultPreferences: Preferences = {
  authConfirmation: false,
  authenticationMethod: 'hardware-auth',
  //   autoOptimize: false,
  //   autoPickCache: 'true',
  // cache: Config.defaultCache,
  //   cacheEnabled: true,

  currency: 'usd',

  // node: Config.defaultDaemon.getConnectionString(),
  language: 'en',

  limitData: false,

  nickname: 'Anonymous',

  notificationsEnabled: true,

  scanCoinbaseTransactions: false,
  themeMode: 'dark',
  websocketEnabled: true,
};

type GlobalStore = {
  theme: Theme;
  preferences: Preferences;

  setTheme: (payload: Theme) => void;
  setPreferences: (preferences: Preferences) => void;
};

export const useGlobalStore = create<
  GlobalStore,
  [['zustand/subscribeWithSelector', never]]
>(
  subscribeWithSelector((set) => ({
    preferences: defaultPreferences,
    setPreferences: (preferences: Preferences) => {
      set({ preferences });
    },

    setTheme: (payload: Theme) => {
      set({ theme: payload });
    },
    theme: Themes.dark,
  })),
);

useGlobalStore.subscribe(
  (state) => state.preferences,
  (preferences) => {
    if (!preferences) {
      return;
    }
    setStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES, preferences);
  },
);

useGlobalStore.subscribe(
  (state) => state.theme,
  (theme) => {
    const { preferences } = useGlobalStore.getState();
    setPreferences({ ...preferences, themeMode: theme.mode });
  },
);

useGlobalStore.subscribe(
  (state) => state.preferences.themeMode,
  (themeMode) => {
    if (themeMode) {
      useGlobalStore.getState().setTheme(Themes[themeMode]);
    }
  },
);
