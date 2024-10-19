import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';

import { update_bare_user } from 'lib/native';

import { defaultTheme } from '@/styles';

import { Preferences, Theme, User } from '../../types';
import { ASYNC_STORAGE_KEYS } from '../async-storage/async-storage-keys';

interface UserStore {
  user: User;
  setDeviceUser: (obj: User) => void;
}

interface AppStoreState {
  _hasHydrated: {
    theme: boolean;
    preferences: boolean;
    user: boolean;
  };
  setHasHydrated: (key: keyof AppStoreState['_hasHydrated']) => void;
  resetHydration: () => void;
}

// Store for tracking hydration status, just for intial load of the app since async storage is... async.
export const useAppStoreState = create<AppStoreState>()((set) => ({
  _hasHydrated: {
    preferences: false,
    theme: false,
    user: false,
  },
  resetHydration: () =>
    set(() => ({
      _hasHydrated: {
        preferences: false,
        theme: false,
        user: false,
      },
    })),
  setHasHydrated: (key) =>
    set((state) => ({
      _hasHydrated: { ...state._hasHydrated, [key]: true },
    })),
}));

export const useUserStore = create<UserStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        setDeviceUser: (user) => {
          set({ user: user || defaultUser });
        },
        user: defaultUser,
      }),
      {
        merge: (persistedState: unknown, currentState: UserStore) => {
          const typedPersistedState = persistedState as
            | Partial<UserStore>
            | undefined;
          const user = typedPersistedState?.user ?? defaultUser;
          return { ...currentState, user };
        },
        name: ASYNC_STORAGE_KEYS.USER,
        onRehydrateStorage: () => {
          useAppStoreState.getState().setHasHydrated('user');
        },
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
  ),
);

useUserStore.subscribe(
  (state) => state.user,
  async (user) => {
    if (!user) {
      return;
    }
    await update_bare_user(user);
  },
);

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      setTheme: (theme) => set({ theme }),
      theme: defaultTheme,
    }),
    {
      name: ASYNC_STORAGE_KEYS.THEME,
      onRehydrateStorage: () => () => {
        useAppStoreState.getState().setHasHydrated('theme');
      },
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

interface PreferencesStore {
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreferences: (preferences) => set({ preferences }),
    }),
    {
      merge: (persistedState: unknown, currentState: PreferencesStore) => {
        const typedPersistedState = persistedState as
          | Partial<PreferencesStore>
          | undefined;
        const preferences =
          typedPersistedState?.preferences ?? defaultPreferences;
        return { ...currentState, preferences };
      },
      name: ASYNC_STORAGE_KEYS.PREFERENCES,
      onRehydrateStorage: () => () => {
        useAppStoreState.getState().setHasHydrated('preferences');
      },
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const defaultPreferences: Preferences = {
  // authConfirmation: false,
  // authenticationMethod: 'hardware-auth',
  // currency: 'usd',
  language: 'en',
  // limitData: false,
  // nickname: 'Anon',
  // notificationsEnabled: true,
  // scanCoinbaseTransactions: false,
  // websocketEnabled: true,
};

export const defaultUser: User = {
  address: '',
  downloadDir: RNFS.DownloadDirectoryPath,
  name: 'Anon',
  room: 'lobby',
};
