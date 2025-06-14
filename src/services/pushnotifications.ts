// import { Notify } from '../services/utils';
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  requestPermission,
  AuthorizationStatus,
  getToken,
  setBackgroundMessageHandler
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import { MessageSync } from './hugin/syncer';
import * as Keychain from 'react-native-keychain';
import * as naclSealed from 'tweetnacl-sealed-box';
import * as nacl from 'tweetnacl';
import * as naclutil from 'tweetnacl-util';
import { saveMessageToQueue, resetMessageQueue, getMessageQueue } from '../utils/messageQueue';


function hexToUint(hexString: string) {
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function fromHex(hex: string) {
  let str;
  try {
    str = decodeURIComponent(hex.replace(/(..)/g, '%$1'));
  } catch (e) {
    str = hex;
    // console.log('invalid hex input: ' + hex)
  }
  return str;
}

const nonceFromTimestamp  = (tmstmp: number) => {
  // Converts a timestamp to a nonce used for encryption
  let nonce = hexToUint(String(tmstmp));

  while ( nonce.length < nacl.box.nonceLength ) {

    let tmp_nonce = Array.from(nonce);

    tmp_nonce.push(0);

    nonce = Uint8Array.from(tmp_nonce);

  }
  return nonce;
}

function decryptMessage(box: string, timestamp: number, key: string) {
  let decryptBox;
  try {

    decryptBox = naclSealed.sealedbox.open(
      hexToUint(box),
      nonceFromTimestamp(timestamp),
      hexToUint(key)
    );
    
  } catch (e) {
    console.log('Failed to decrypt:', e);
  }
  decryptBox = naclutil.encodeUTF8(decryptBox);
  console.log('decryptbox: ', decryptBox)
  return JSON.parse(decryptBox);

}

async function getEncryptionKey(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      return credentials.password; // This is the stored key
    }
    console.warn('🔑 No key found in Keychain.');
    return null;
  } catch (error) {
    console.error('❌ Error retrieving encryption key:', error);
    return null;
  }
}

  async function requestPermissionAndGetToken(messaging: any) {

    //     Notify.new({ 
    //   name: 'Firebased 🔥', 
    //   text: 'This is from firebase my guy!' },
    //   true,
    //   {}
    // )

  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;
  console.log('enabled?', enabled)
  if (!enabled) return;
  console.log('getting Firebase Token:');

    try {
    if (!isDeviceRegisteredForRemoteMessages(messaging)) {
      await registerDeviceForRemoteMessages(messaging);
    }
    const firebaseToken = await getToken(messaging);
    console.log('✅ Firebase Token:', firebaseToken);
    deviceId = firebaseToken;
    return firebaseToken;
  } catch (err) {
    console.error('❌ Failed to get FCM token:', err);
  }

  channelId = await notifee.createChannel({
  id: 'hugin_notifiy',
  name: 'Hugin',
  sound: 'roommessage',
  vibration: true,
  vibrationPattern: [200, 400],
  });
  

}

const firebaseApp = getApp();
const messaging = getMessaging(firebaseApp);

let channelId;

  onMessage(messaging, async remoteMessage => {
    console.log('🔔 Foreground message:', remoteMessage);
    // Notify.new({ 
    //   name: 'Firebased 🔥', 
    //   text: 'This is from firebase my guy!' },
    //   true,
    //   {}
    // )
  });
  let deviceId;
  export function getDeviceId() {
    return deviceId;
  }

  setBackgroundMessageHandler(messaging, async remoteMessage => {
    console.log('🔔 Background message:', remoteMessage);
    let message;
    let error;
    try {

      const key = await getEncryptionKey();
      
      const payload = JSON.parse(fromHex(remoteMessage?.data?.encryptedPayload));
      
      message = decryptMessage(payload.box, payload.t, key);
      await saveMessageToQueue({
        ...message,
        timestamp: payload.t,
      });

      console.log('final msg:', message)
    } catch (e){
      console.log('Error:', e);
      error = e;
    }

    if (!message.msg) return;

    if (!channelId) {

    channelId = await notifee.createChannel({
      id: 'hugin_notifiy',
      name: 'Hugin',
      sound: 'roommessage',
      vibration: true,
      vibrationPattern: [200, 400],
      });

    }



    await notifee.displayNotification({
      android: {
        category: AndroidCategory.MESSAGE,
        channelId: channelId,
        importance: AndroidImportance.HIGH,
        // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: 'default',
        },

        smallIcon: '@mipmap/ic_launcher',
        visibility: AndroidVisibility.PUBLIC,
      },

      body: message.msg,//message.msg || 'You\'ve got a new message!',

      ios: {
        sound: 'roommessage.wav',
      },
      title: message.name
    });

  });

  onNotificationOpenedApp(messaging, async remoteMessage => {
    console.log('🔔 Opened with notification:', remoteMessage);
  })

  requestPermissionAndGetToken(messaging);