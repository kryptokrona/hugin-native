import { Platform } from 'react-native';

import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import { navigationRef } from '@/contexts';
import { setRoomMessages } from '@/services';

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

    if (data.type == 'room') {

      await setRoomMessages(data.roomKey, 0);

      if (navigationRef.isReady()) {
        navigationRef.navigate('GroupChatScreen', {
          name: data.name,
          roomKey: data.roomKey,
        });

    }
  } 
    
    if (data.type == 'roomcall') {

      await setRoomMessages(data.roomKey, 0);

      if (navigationRef.isReady()) {
        navigationRef.navigate('GroupChatScreen', {
          name: data.name,
          roomKey: data.roomKey,
          call: true
        });

    }
  }
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
        this.handleNotificationPress(detail.notification?.data);
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
