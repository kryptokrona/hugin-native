import { useEffect, useRef } from 'react';

import {
  AppState,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
  Settings,
  AppStateStatus,
  Linking
} from 'react-native';

import { createNavigationContainerRef } from '@react-navigation/native';
import RNFS from 'react-native-fs';

import InCallManager from 'react-native-incall-manager';

import {
  getThisRoom,
  setStoreCurrentRoom,
  updateUser,
  useGlobalStore,
  usePreferencesStore,
  useRoomStore,
  useThemeStore,
  useUserStore,
  WebRTC,
} from '@/services';

import { MainScreens } from '@/config';

import VoipPushNotification from 'react-native-voip-push-notification';
import RNCallKeep from 'react-native-callkeep';

import { Peers } from '../lib/connections';

import { Background } from './background';

import { Beam, decrypt_sealed_box, get_sealed_box, Nodes, Rooms } from '../lib/native';
// import { Foreground } from './service';

import {
  setLatestMessages,
  setLatestRoomMessages,
  setRoomMessages,
  updateMessage,
} from '../services/bare';
import { keychain } from '../services/bare/crypto';
import { Camera, Connection, Files } from '../services/bare/globals';
import { getContacts, getFeedMessages, initDB, loadSavedFiles, saveMessage } from '../services/bare/sqlite';
import { MessageSync } from '../services/hugin/syncer';
import { Wallet } from '../services/kryptokrona/wallet';
import { fromHex, Notify } from '../services/utils';
import { getCoinPriceFromAPI } from '../utils/fiat';
import { setStoreFeedMessages } from '../services/zustand';
import { useTranslation } from 'react-i18next';
import { getMessageQueue, resetMessageQueue } from '@/utils/messageQueue';
import { AuthMethods, ConnectionStatus, User } from '@/types';
import { sleep, waitForCondition } from '@/utils';

interface AppProviderProps {
  children: React.ReactNode;
}

let joining = false;

export const navigationRef = createNavigationContainerRef();

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);
  const { i18n } = useTranslation();
  const authenticated = useGlobalStore((state) => state.authenticated);
  const started = useGlobalStore((state) => state.started);
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);
  const { setThisRoom } = useRoomStore();
  const showFooterMask = useThemeStore((s) => s.showFooterMask);
  const authMethod = usePreferencesStore(
      (state) => state.preferences.authMethod,
    );
  const frontendStartedRef = useRef(false);
  const initInProgressRef = useRef(false);


  useEffect(() => {
    if (preferences) {
      i18n.changeLanguage(preferences.language);
    }
  }, [preferences]);

  async function init() {

        // if (started) {
      await initFrontend();
    // }

    if (initInProgressRef.current || 1 == 1) {
      return;
    }

  }

  async function initFrontend() {
    try {
    await waitForCondition(() => useGlobalStore.getState().started, 10000);
    console.log('Initing front end..', frontendStartedRef.current)
    if (frontendStartedRef.current) return;
    console.log('Setting latest room messages..')
    await setLatestRoomMessages(false);
    console.log('Setting latest messages..')
    await setLatestMessages();
    console.log('Starting fiat price loop..')
    // Function to update the fiat price every minute
    async function updateFiatPrice() {
      const price = await getCoinPriceFromAPI();
      useGlobalStore.setState({ fiatPrice: price });
    }
    console.log('Starting Notify..')
    Notify.setup();
    updateFiatPrice();

    Files.update(await loadSavedFiles());
    
    // Start the interval
    setInterval(updateFiatPrice, 60000);
    frontendStartedRef.current = true;
    console.log('[appProvider.tsx] Getting contacts..')
    const contacts = await getContacts();
    console.log('[appProvider.tsx] Got contacts..')
    const knownKeys = contacts.map((contact) => contact.messagekey);
    console.log('[appProvider.tsx] Got known keys..', knownKeys)
    const keys = Wallet.privateKeys();
    console.log('[appProvider.tsx] Got keys..', keys)
    MessageSync.init('', knownKeys, keys);
    console.log('[appProvider.tsx] Inited message sync..')

    const huginAddress = Wallet.address + keychain.getMsgKey();
    console.log('huginAddress', huginAddress);

    const files = Files.all().map((a) => {
      return a.hash;
    });

    updateUser({
      files,
      huginAddress,
    });

    } catch (e) {
      console.log('[appProvider.tsx] Error in initFrontend:', e);
    }

  }

  useEffect(() => {
    if (authenticated && user?.address) {
      console.log('running authenticated');
      init();
    }
  }, [authenticated, user?.address]);

  if (Platform.OS === 'android') {
    AppState.addEventListener('blur', () => {
      console.log('App not in focus.');
    });
  }

  const answerCall = async () => {
      // Handle call answer event     

      console.log('☎️ Answering call..');

      const incomingCall = useGlobalStore.getState().voipPayload;

      console.log('☎️ Incoming call:', incomingCall);

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

      console.log('☎️ Set current call:', currentCall);
      
      WebRTC.init();

      console.log('☎️ WebRTC inited, waiting for started:', started);

      await waitForCondition(() => useGlobalStore.getState().started, 10000);

      console.log('☎️ App started!');
      
      Rooms.idle(false, false);

      if(!incomingCall) return;

      console.log('☎️ Got incoming call, waiting for p2p conn...');

      await waitForCondition(() => useGlobalStore.getState().roomUsers[incomingCall?.call]?.length > 0, 5000);

      console.log('☎️ Got p2p conn!');

      const peer = {
        address: Wallet.address,
        audioMute: false,
        screenshare: false,
        video: false,
        voice: true,
        room: incomingCall?.call
      };

      Peers.voicestatus(peer);

      console.log('☎️ Sent voice status!');

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

      // const allRoomUsers = useGlobalStore.getState().roomUsers[incomingCall?.call];
      // const voiceUsers = allRoomUsers?.filter(a => a.voice === true) || [];

      // const call = { callKit: true, room: incomingCall?.call, time: Date.now(), users: voiceUsers, talkingUsers: {} };

      // useGlobalStore.getState().setCurrentCall(call);



    }

  useEffect(() => {

    if (Platform.OS === 'android') return
    let token = '';
    let incomingCall = null;
    let currentAppState = 'active';

    VoipPushNotification.registerVoipToken();

    VoipPushNotification.addEventListener('register', (t) => {
      token = t; // Send token to the APN server
      console.log('voiptoken', token)
      useGlobalStore.getState().setDeviceToken(token);
    });

    // async function getInitialEvents() {

    //   await waitForCondition(() => started, 10000);

    //   console.log('Started?', started);

    //   const initialEvents = await RNCallKeep.getInitialEvents();
    //   console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉')
    //   console.log('initialEvents', initialEvents);
    //   console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉')

    //   const key = Buffer.from(keychain.getKeyPair().secretKey).toString('hex');
    //   console.log('key', key)
    //   const pubKey = Buffer.from(keychain.getKeyPair().publicKey).toString('hex');
    //   console.log('pubKey', pubKey)
    //   const sealed_box = await get_sealed_box({data: JSON.stringify({lmao: 'lol'}), pubKey});
    //   console.log('sealed_box', sealed_box);
    //   const plaintext = await decrypt_sealed_box({skHex: key, pkHex: pubKey, cipherHex: sealed_box})
    //   console.log('plaintext', plaintext)

    // }
    
    // getInitialEvents();

  // ===== Step 3: subscribe `didLoadWithEvents` event =====
    VoipPushNotification.addEventListener('didLoadWithEvents', async (events) => {
        // --- this will fire when there are events occured before js bridge initialized
        // --- use this event to execute your event handler manually by event type

        if (!events || !Array.isArray(events) || events.length < 1) {
            return;
        }
        for (let voipPushEvent of events) {
            let { name, data } = voipPushEvent;
            if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
              await waitForCondition(() => started, 10000);
              const key = Buffer.from(keychain.getKeyPair().secretKey).toString('hex');
              const pubKey = Buffer.from(keychain.getKeyPair().publicKey).toString('hex');
              const box = JSON.parse(fromHex(data?.payload)).box;
              const plaintext = await decrypt_sealed_box({skHex: key, pkHex: pubKey, cipherHex: box});
              const json = JSON.parse(plaintext);
              useGlobalStore.getState().setVoipPayload(json);
              // RNCallKeep.endAllCalls();
              answerCall();
            }
        }
    });

    // const options = {
    //   ios: {
    //     appName: 'Hugin Messenger',
    //     supportsVideo: true,
    //   },
    //   android: {
    //     alertTitle: 'Permissions required',
    //     alertDescription: 'This application needs to access your phone accounts',
    //   },
    // };

    // RNCallKeep.setup(options);

    RNCallKeep.addEventListener('endCall', ({ callUUID }) => {

      incomingCall = null;

      if (currentAppState != 'active') Rooms.idle(true, true, true);

      Rooms.voice(
              {
                audioMute: false,
                key: incomingCall?.call,
                screenshare: false,
                video: false,
                videoMute: false,
                voice: false,
              },
              false,
            );
        
            const peer = {
              address: Wallet.address,
              audioMute: false,
              screenshare: false,
              video: false,
              voice: false,
              room: incomingCall?.call
            };
        
            // Peers.voicestatus(peer);
            useGlobalStore.getState().setCurrentCall({ room: '', users: [] });
            WebRTC.exit();


    });

    RNCallKeep.addEventListener('didDisplayIncomingCall', ({ payload }) => {

      console.log('☎️ didDisplayIncomingCall')

      useGlobalStore.getState().setVoipPayload(payload);
      
    });

    RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
      answerCall();
    });

    let timeoutId = null;
    const onAppStateChange = async (state: AppStateStatus) => {
      currentAppState = state;
      useGlobalStore.getState().setAppState(state);
      if (state === 'inactive') {
        if (useGlobalStore.getState().voipPayload !== null) return;
        // if (!started) {
        //   return;
        // }
        // Rooms.pause();
        // console.log('******** INACTIVE STATE *********');
        // //Idle status might be used to display "yellow symbol" instead of "disconnecting"
        // //Or display notifications during background mode
        if (WebRTC.localMediaStream === null && authenticated) {
        Rooms.idle(true, true);
        } //else {
        //   Rooms.idle(false, true);
        // }
        setThisRoom(getThisRoom());
        // Wallet.active?.stop();

        // if (started) {
        //   // await Background.init();
        // }
      } else if (state === 'background') {
        
        const hasIncomingCall = useGlobalStore.getState().voipPayload !== null;
        if (Camera.active || hasIncomingCall || !useGlobalStore.getState().started) {
          return;
        }
        console.log('******** BACKGROUND ********');
        timeoutId = setTimeout(() => {
          if (authMethod === AuthMethods.reckless) return;
          useGlobalStore.getState().setAuthenticated(false);
        }, 10000);

        // Rooms.pause();
        
        //Idle status might be used to display "yellow symbol" instead of "disconnecting"
        //Or display notifications during background mode
        console.log('Close!');
        if (WebRTC.localMediaStream === null) {
          Rooms.idle(true, true, true);
        }
        if (WebRTC.localMediaStream !== null) {
          InCallManager.start({ media: 'audio' });
          Rooms.idle(false, true);
        }

        setThisRoom(getThisRoom());
        Wallet.active?.stop();
        if (started) {
          // await Background.init();
        }
      } else if (state === 'active') {
        console.log('********** ACTIVE STATE **********');
        if (useGlobalStore.getState().started && !joining) {
          MessageSync.restart_sync();
          joining = true;
          Rooms.idle(false, false);
          const room = getThisRoom();
          setStoreCurrentRoom(room);
          setThisRoom(room);
          setRoomMessages(room, 0);
          Wallet.active?.start();
          joining = false;
          console.log('**** Successfully joined rooms after inactivity ****');
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        const message_queue = await getMessageQueue();
        console.log('message_queue', message_queue)

        for (const message of message_queue) {
          const saved = await saveMessage(
            message.from,
            message.msg,
            '', //Todo reply
            message.timestamp,
            message.timestamp.toString(),
            false,
            undefined,
            false,
            message.name
          );
          if (saved) {
            updateMessage(saved, false);
          }
          setLatestMessages();
        }
        resetMessageQueue();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Prevent app closing when navigation history is empty. E.g after press switch product.
    const backAction = () => {
      if (!navigationRef.canGoBack()) {
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigationRef]);

  return (
    
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {children}
        {showFooterMask && <View style={styles.footerMask} />}
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 40 : 40
  },
  footerMask: {
    height: 40, // or however tall the cropped part is
    backgroundColor: '#231f20', // match your background
    marginBottom: -40
  },
});
