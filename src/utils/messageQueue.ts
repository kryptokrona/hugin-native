import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGE_QUEUE_KEY = 'MESSAGE_QUEUE';

export async function loadMessageQueue(): Promise<any[]> {
  try {
    const stored = await AsyncStorage.getItem(MESSAGE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to load message queue', err);
    return [];
  }
}

export async function saveMessageToQueue(newMessage: any): Promise<void> {
  const currentQueue = await loadMessageQueue();
  if (currentQueue.some(msg => msg.s === newMessage.s)) return;

  currentQueue.push(newMessage);

  try {
    await AsyncStorage.setItem(MESSAGE_QUEUE_KEY, JSON.stringify(currentQueue));
  } catch (err) {
    console.error('Failed to save message to queue', err);
  }
}

export async function resetMessageQueue(): Promise<void> {
  await AsyncStorage.removeItem(MESSAGE_QUEUE_KEY);
}

export async function getMessageQueue(): Promise<any[]> {
  return await loadMessageQueue();
}
