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
import VoipPushNotification from 'react-native-voip-push-notification';
import { updateUser, useGlobalStore, usePreferencesStore, useUserStore } from './zustand';
import { initDB } from './bare/sqlite';
import { Beam, decrypt_sealed_box, Nodes, Rooms } from 'lib/native';
import { Connection } from './bare/globals';
import { ConnectionStatus, User } from '../types/user';
import { WebRTC } from './calls';
import { Peers } from 'lib/connections';
import { sleep, waitForCondition } from '../utils/utils';
import { Wallet } from './kryptokrona';
import { keychain } from './bare';
import RNCallKeep from 'react-native-callkeep';


const answerCall = async () => {
      // Handle call answer event     

      console.log('☎️ Answering call..');

      const incomingCall = useGlobalStore.getState().voipPayload;

      console.log('incomingCall', incomingCall);

      const me: User = {
        address: Wallet.address,
        name: useUserStore.getState().user.name,
        room: incomingCall?.call,
        online: true,
        voice: true,
        video: false,
        screenshare: false,
        muted: false,
        talking: false,
        dm: true,
        connectionStatus: ConnectionStatus.connected,
        avatar: ''
      };

      const caller: User = {
        address: incomingCall?.from || '',
        name: incomingCall?.name || 'Anonymous',
        room: incomingCall?.call,
        online: true,
        voice: true,
        video: false,
        screenshare: false,
        muted: false,
        talking: false,
        dm: true,
        connectionStatus: ConnectionStatus.connecting,
        avatar: ''
      };

      const currentCall = { callKit: true, room: incomingCall?.call, time: Date.now(), users: [me, caller], talkingUsers: {} };
      useGlobalStore.getState().setCurrentCall(currentCall);

      await waitForCondition(() => useGlobalStore.getState().roomUsers[incomingCall?.call]?.length > 0, 5000);

      console.log('✅ Conditions met, user is online')


      const peer = {
        address: Wallet.address,
        audioMute: false,
        screenshare: false,
        video: false,
        voice: true,
        room: incomingCall?.call
      };

      Peers.voicestatus(peer);

      console.log('✅ Voice status completed')

      // await sleep(5000);

      Rooms.voice(
        {
          audioMute: false,
          key: incomingCall?.call,
          screenshare: false,
          video: false,
          videoMute: false,
          voice: true,
        },
        false,
      );

      console.log('✅ Voice sent')
    }

async function init() {

  
  console.log('☎️ Initing stuff in the background..')
  
    await Rooms.start();
  
    Rooms.idle(false, false);
    
    console.log('☎️ Rooms started..')

    await initDB();

    console.log('☎️ Inited db')

    usePreferencesStore.persist.rehydrate();
    const preferences = usePreferencesStore.getState().preferences;

    const node = preferences?.node
      ? {
          port: parseInt(preferences.node.split(':')[1]),
          url: preferences.node.split(':')[0],
        }
      : { port: 80, url: 'node.xkr.network' };

      await Wallet.init(node);
      console.log('☎️ Trying to rehydrate user..')
      await useUserStore.persist.rehydrate();
      const user = useUserStore.getState().user;
      console.log('☎️ Got user')

      Rooms.init(user);
      Rooms.join();
      Beam.join();
      Nodes.connect('', true);
      useGlobalStore.getState().setStarted(true);
      console.log('☎️ Init complete..')
      return;
    }

VoipPushNotification.addEventListener('didLoadWithEvents', async (events) => {
        // --- this will fire when there are events occured before js bridge initialized
        // --- use this event to execute your event handler manually by event type

        if (!events || !Array.isArray(events) || events.length < 1) {
            return;
        }
        for (let voipPushEvent of events) {
            let { name, data } = voipPushEvent;
            if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
              if (useGlobalStore.getState().appState === 'active') return;
              WebRTC.init();
              console.log('✅ WebRTC inited')
              console.log('VOIP activated!', data)

              // const audioRoutes = await RNCallKeep.getAudioRoutes();
              // console.log('audioRoutes:', audioRoutes)

              // if (useGlobalStore.getState().started === false) await init();

              const payload = data?.payload;

              const box = JSON.parse(fromHex(payload)).box;
              // const box = "6124c64ea83b13cd88336b55d354a861c17dafb347c862e369ed4595d475cf28b57800809d879b91e6dbce74fe86f6f5c1443ede10ab472efb6be51b624eb1cd214c995fad498ab9916d917edddf35f0863720c04eba4507341a9c2a2f88276250202a49444cf255674ca86be08c4ba840d01d4ccace6e8df2a0d6874ca22ebe0bbb07f98999e7b447ce0c21cb0318462f365b8a48e057662c4e810392f567aea68c3ab8c39f366f7a3904fd808481f3be77e74dd52400d92e43aa37b320c89879e051179e352d8dda7341ee1b88fbcaab6cc844dd5f9b3d9d3158cdc6784b2c1fff743d274769e555621466b421f872f9ea21c91f162723c41b4c4f834a1bf4fb147a05a9dfde4e81abdbde7328e4d09463a0088d2616e981149de17484783acd5ab12c531e9aed0d85fb609077270a6510561c8b16f2f509353057b1f0b19cb42de7f2f6b230a320b110131dca993446abb27ed855385a53c12157dc2981588acf79164e0029d660af0c771930c01f9b5b84704d25fc85dbb849c367787c9ea5b023d4e7773cd4c06a6bdb95248a27a67fe7b5ba2550bfbef595abdfb4b997a549f901bd91ccf1907b885fa0293befc26244f7ee016b444481c81a68dc08e9737d1c05611772ff2e11078580558bc754ae488c4b03719b9cbd9d";
              console.log('🎁 box:', box)
              // await sleep(3000);
              const skHex = Buffer.from(keychain.getKeyPair().secretKey).toString('hex');
              const pkHex = Buffer.from(keychain.getKeyPair().publicKey).toString('hex');
              console.log('🎁 skHex:', skHex)
              console.log('🎁 pkHex:', pkHex)
              const plaintext = await decrypt_sealed_box({skHex, pkHex, cipherHex: box});
              const json = JSON.parse(plaintext);
              console.log('json', json)
              useGlobalStore.getState().setVoipPayload(json);

                answerCall()

              // await waitForCondition(() => started, 10000);
              // const key = Buffer.from(keychain.getKeyPair().secretKey).toString('hex');
              // const pubKey = Buffer.from(keychain.getKeyPair().publicKey).toString('hex');
              // const box = JSON.parse(fromHex(data?.payload)).box;
              // const plaintext = await decrypt_sealed_box({skHex: key, pkHex: pubKey, cipherHex: box});
              // const json = JSON.parse(plaintext);
              // useGlobalStore.getState().setVoipPayload(json);
              // answerCall();
            }
        }
    });


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
      return credentials.password.substring(0,64); // This is the stored key
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
    setTimeout(() => {Rooms.idle(true, true, true)}, 15000);
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