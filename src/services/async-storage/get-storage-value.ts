import AsyncStorage from '@react-native-async-storage/async-storage';

import { ASYNC_STORAGE_KEYS } from './async-storage-keys';

export const getStorageValue = async (key: keyof typeof ASYNC_STORAGE_KEYS) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      console.log(value);
      return JSON.parse(value);
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving async storage key ${key}`, error);
  }
};
