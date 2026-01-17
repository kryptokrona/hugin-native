import { Platform } from 'react-native';

import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import { navigationRef } from '@/contexts';
import { setMessages, setRoomMessages, useGlobalStore } from '@/services';
import { Linking } from 'react-native';
import { parseHuginUrl, waitForCondition } from '@/utils';
import { Stacks } from '@/config';

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

  async new({ text, name }: Notification, background: boolean, data: object) {
    // if (background) {
    //   this.pending.push({ name, text });
    //   return;
    // }
    this.display(name, text, data);
  }

  async handleNotificationPress(data: any) {

    console.log('Notification pressed with this data:', data);

    const url = data?.url;

    console.log('Do we have url?', url);

    if (url) {
      console.log('Opening URL from notification data:', url);
    } else {
      console.log('No URL found in notification data');
    }


    useGlobalStore.getState().setPendingLink(data?.url);

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

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        const url = detail.notification?.data?.url;
      }
    });


    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationPress(detail.notification?.data);
      }
    });
    

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

  async display(name: string, text: string, data: object) {
    console.log('Displaying notification:', { name, text, data });
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
      data: data
    });
  }
}

export const Notify = new Notifee();
