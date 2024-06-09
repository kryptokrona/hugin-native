import { ASYNC_STORAGE_KEYS, getStorageValue } from './async-storage';
import { defaultPreferences, setPreferences } from './zustand';

export const init = async () => {
  const preferences = await getStorageValue(ASYNC_STORAGE_KEYS.PREFERENCES);
  console.log({ preferences });
  if (!preferences) {
    setPreferences(defaultPreferences);
  } else {
    setPreferences(preferences);
  }
};
