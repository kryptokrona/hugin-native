import type { User } from '@/types';

import { usePreferencesStore, useUserStore } from './zustand';

export const updateLanguage = async (language: string) => {
  usePreferencesStore.setState((state) => ({
    ...state,
    preferences: {
      ...state.preferences,
      language,
    },
  }));
};

export const updateUser = async (value: Partial<User>) => {
  useUserStore.setState((state) => ({
    ...state,
    user: {
      ...state.user,
      ...value,
    },
  }));
};
