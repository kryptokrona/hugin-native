import AsyncStorage from '@react-native-async-storage/async-storage';

export const getStorageValue = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      const parsed = JSON.parse(value);
      console.log({ parsed });
      return JSON.parse(value);
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving async storage key ${key}`, error);
  }
};
