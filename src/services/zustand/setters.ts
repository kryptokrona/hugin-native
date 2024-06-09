import type { Preferences, User } from '@/types';

import { useGlobalStore } from './global-store';

export const setPreferences = (preferences: Preferences) => {
  useGlobalStore.setState({ preferences });
};

export const setUser = (user: User) => {
  useGlobalStore.setState({ user });
};

// Do never set individual preferences here, always set the whole preferences object
// Should be set to storage and then to the store
