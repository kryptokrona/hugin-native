import { Platform } from 'react-native';

import notifee, { AndroidImportance } from '@notifee/react-native';

class Notifee {
  constructor() {}

  async new({ text, name }, type) {
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
        importance: AndroidImportance.HIGH,
        // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: 'default',
        },
        smallIcon: '@mipmap/ic_launcher',
      },

      body: text,

      ios: {
        sound: 'roommessage.wav',
      },
      title: name,
    });
  }
}

export const Notify = new Notifee();
