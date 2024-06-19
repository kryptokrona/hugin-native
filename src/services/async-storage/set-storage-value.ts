import AsyncStorage from '@react-native-async-storage/async-storage';

export const setStorageValue = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting async storage key ${key}`, error);
  }
};

const clearAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('AsyncStorage cleared.');
  } catch (error) {
    console.error('Error clearing AsyncStorage', error);
  }
};
clearAsyncStorage();
