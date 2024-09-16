import type { Message, Group, Preferences, Theme, User } from '@/types';

import { useGlobalStore } from './global-store';

export const setStorePreferences = (preferences: Preferences) => {
  useGlobalStore.setState({ preferences });
};

export const setStoreUser = (user: User) => {
  useGlobalStore.setState({ user });
};

export const setStoreGroups = (groups: Group[]) => {
  useGlobalStore.setState({ groups });
};

export const setStoreRoomMessages = (roomMessages: Message[]) => {
  useGlobalStore.setState({ roomMessages });
};

export const setStoreTheme = (theme: Theme) => {
  useGlobalStore.setState({ theme });
};

// Do never set individual preferences here, always set the whole preferences object
// Should be set to storage and then to the store
