import { AuthMethods, Preferences, Theme, ThemeName, User } from '@/types';
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import { defaultTheme, themes } from '@/styles';

import { ASYNC_STORAGE_KEYS } from './async-storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { create } from 'zustand';
import { setAuthenticated } from './global-store';
import { update_bare_user } from 'lib/native';

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
        useThemeStore.setState((state) => {
          const themeName = state.theme.name as ThemeName;
          const mode = state.theme.mode;
          return {
            theme: themes[themeName][mode],
          };
        });
        useAppStoreState.getState().setHasHydrated('theme');
      },
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

interface PreferencesStore {
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
  setAuthMethod: (authMethod: AuthMethods | null) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreferences: (preferences) => set({ preferences }),
      setAuthMethod: (authMethod) =>
        set((state) => ({
          preferences: { ...state.preferences, authMethod },
        })),
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
        const authMethod = getAuthMethod();

        if (authMethod === AuthMethods.reckless) {
          setAuthenticated(true);
        }

        useAppStoreState.getState().setHasHydrated('preferences');
      },
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const defaultPreferences: Preferences = {
  pincode: null,
  authMethod: AuthMethods.reckless,
  language: 'en',
  nickname: 'Anon',
};

export const defaultUser: User = {
  address: '',
  downloadDir:
    Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath
      : RNFS.DocumentDirectoryPath, // TODO test this properly
  name: 'Anon',
  room: 'lobby',
};

export const getAuthMethod = () => {
  return usePreferencesStore.getState().preferences?.authMethod;
};

export const getUser = () => {
  return useUserStore.getState().user;
};
