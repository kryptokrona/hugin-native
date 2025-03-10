import { Platform } from 'react-native';

import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';

type Notification = {
  name: string;
  text: string;
};

class Notifee {
  private pending: Notification[];
  private channel: string;
  constructor() {
    this.pending = [];
    this.channel = '';
  }

  async new({ text, name }: Notification, background: boolean) {
    if (background) {
      this.pending.push({ name, text });
      return;
    }
    this.display(name, text);
  }

  async setup() {
    const channelId = await notifee.createChannel({
      id: 'hugin_notifiy',
      name: 'Hugin',
      sound: 'roommessage',
      vibration: true,
      vibrationPattern: [200, 400],
    });

    if (Platform.OS === 'ios') {
      await notifee.requestPermission();
    }

    this.channel = channelId;
  }

  wakeup() {
    if (this.pending.length === 0) {
      return;
    }
    const text = `You have ${this.pending.length} unread messages`;
    this.display('New messages', text);
    this.pending = [];
  }

  async display(name: string, text: string) {
    await notifee.displayNotification({
      android: {
        category: AndroidCategory.MESSAGE,
        channelId: this.channel,
        importance: AndroidImportance.HIGH,
        // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: 'default',
        },

        smallIcon: '@mipmap/ic_launcher',
        visibility: AndroidVisibility.PUBLIC,
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
