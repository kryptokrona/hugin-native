import { Platform } from 'react-native';

import notifee from '@notifee/react-native';

export async function notify({ text, name }, type: string) {
  // Request permissions (required for iOS)
  if (Platform.OS === 'ios') {
    await notifee.requestPermission();
  }
  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'hugin_notifiy',
    name: 'Hugin',
    sound: 'roommessage',
    vibration: true,
    vibrationPattern: [200, 400],
  });

  // Display a notification
  await notifee.displayNotification({
    android: {
      channelId: channelId,

      // optional, defaults to 'ic_launcher'.
      // pressAction is needed if you want the notification to open the app when pressed
      pressAction: {
        id: 'default',
      },
      smallIcon: '@mipmap/ic_launcher',
    },
    body: text,
    title: name,
  });
}
