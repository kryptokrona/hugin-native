import { Platform } from 'react-native';

import notifee, { AndroidImportance } from '@notifee/react-native';

type Notification = {
  name: string;
  text: string;
};

class Notifee {
  private pending: Notification[];
  constructor() {
    this.pending = [];
  }

  async new({ text, name }: Notification, background: boolean) {
    // Request permissions (required for iOS)
    if (Platform.OS === 'ios') {
      await notifee.requestPermission();

      if (background) {
        this.pending.push({ name, text });
        return;
      }
    }

    this.display(name, text);
  }

  wakeup() {
    if (this.pending.length === 0) {
      return;
    }
    const text = `You have ${this.pending.length} unread messages`;
    this.display('New messages', text);
  }

  async display(name: string, text: string) {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'hugin_notifiy',
      name: 'Hugin',
      sound: 'roommessage',
      vibration: true,
      vibrationPattern: [200, 400],
    });

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
