import { useEffect } from 'react';

import {
  AppState,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

import { useNavigationContainerRef } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

import { Background } from './background';

import { Beam, Nodes, Rooms } from '../lib/native';
// import { Foreground } from './service';

import {
  setLatestMessages,
  setLatestRoomMessages,
  setRoomMessages,
} from '../services/bare';
import { keychain } from '../services/bare/crypto';
import { Camera, Connection, Files } from '../services/bare/globals';
import { getContacts, getFeedMessages, initDB, loadSavedFiles } from '../services/bare/sqlite';
import { MessageSync } from '../services/hugin/syncer';
import { Wallet } from '../services/kryptokrona/wallet';
import { Notify } from '../services/utils';
import { getCoinPriceFromAPI } from '../utils/fiat';
import { setStoreFeedMessages } from '../services/zustand';

interface AppProviderProps {
  children: React.ReactNode;
}

let started = false;
let joining = false;

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);
  const navigationRef = useNavigationContainerRef();

  const authenticated = useGlobalStore((state) => state.authenticated);
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);
  const { setThisRoom } = useRoomStore();

  async function init() {
    /// Activate this if we want to run foreground task running on Android
    /// It drains alot of battery but some users might want it.

    // if (Platform.OS === 'android') {
    //   const err = await Foreground.init();
    //   if (err) {
    //     return;
    //   }
    // }

    if (started) {
      return;
    }

    await Rooms.start();
    await initDB();
    await setLatestRoomMessages();
    await setLatestMessages();
    Files.update(await loadSavedFiles());
    // await Background.init();

    // Function to update the fiat price every minute
    async function updateFiatPrice() {
      console.log('$£$£$£$∞£$∞£$∞£$∞ - Getting fiat..');
      const price = await getCoinPriceFromAPI();
      useGlobalStore.setState({ fiatPrice: price });
    }

    const node = preferences?.node
      ? {
          port: parseInt(preferences.node.split(':')[1]),
          url: preferences.node.split(':')[0],
        }
      : { port: 80, url: 'node.xkr.network' };

    Connection.listen();
    Notify.setup();
    await Wallet.init(node);
    const huginAddress = Wallet.address + keychain.getMsgKey();
    console.log('huginAddress', huginAddress);

    const files = Files.all().map((a) => {
      return a.hash;
    });

    updateUser({
      files,
      huginAddress,
    });

    const contacts = await getContacts();
    const knownKeys = contacts.map((contact) => contact.messagekey);
    const keys = Wallet.privateKeys();
    MessageSync.init(node, knownKeys, keys);

    Rooms.init(user);
    Rooms.join();
    Beam.join();
    Nodes.connect('', true)
    started = true;

    updateFiatPrice();

    // Start the interval
    setInterval(updateFiatPrice, 60000);
  }

  useEffect(() => {
    updateUser({
      downloadDir:
        Platform.OS == 'ios'
          ? RNFS.LibraryDirectoryPath
          : RNFS.CachesDirectoryPath,
      store:
        Platform.OS == 'ios'
          ? RNFS.LibraryDirectoryPath
          : RNFS.DocumentDirectoryPath,
    });
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

  // const stopTasks = () => {
  //   Foreground?.service?.stopAll();
  // };

  /// Deactivated timer to stop foreground tasks on Android

  // const Timeout = new Timer(() => {
  //   console.log('Stop task!');

  //   if (Platform.OS === 'android') {
  //     stopTasks();
  //   }
  // });

  /////////////////////////////////////////////

  useEffect(() => {
    const onAppStateChange = async (state: string) => {
      if (state === 'inactive') {
        // if (!started) {
        //   return;
        // }
        // Rooms.pause();
        // console.log('******** INACTIVE STATE *********');
        // //Idle status might be used to display "yellow symbol" instead of "disconnecting"
        // //Or display notifications during background mode
        // if (WebRTC.localMediaStream === null) {
        Rooms.idle(true, true);
        // } else {
        //   Rooms.idle(false, true);
        // }
        // setThisRoom(getThisRoom());
        // Wallet.active?.stop();

        // if (started) {
        //   // await Background.init();
        // }
      } else if (state === 'background') {
        if (Camera.active) {
          return;
        }
        console.log('******** BACKGROUND ********');

        // Rooms.pause();
        
        //Idle status might be used to display "yellow symbol" instead of "disconnecting"
        //Or display notifications during background mode
        console.log('Close!');
        Rooms.idle(true, true);
        if (WebRTC.localMediaStream !== null) {
          InCallManager.start({ media: 'audio' });
        }

        setThisRoom(getThisRoom());
        Wallet.active?.stop();
        if (started) {
          // await Background.init();
        }
      } else if (state === 'active') {
        console.log('********** ACTIVE STATE **********');
        if (started && !joining) {
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
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 40 : 0,
  },
});
