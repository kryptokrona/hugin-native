import { Beam, decrypt_sealed_box, Nodes, Rooms } from 'lib/native';
import { initDB } from './bare/sqlite';
import { updateUser, useGlobalStore, usePreferencesStore, useUserStore } from '@/services';
import { Wallet } from './kryptokrona';
import { Notify } from './utils';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Connection } from './bare/globals';

export async function init() {

  if (useGlobalStore.getState().started === true) {
    Rooms.idle(false, false);
    return;
  };

  console.log('☎️ Initing stuff in the background..')
  
    await Rooms.start();
    
    console.log('☎️ Rooms started..')

    await initDB();

    console.log('☎️ Inited db')

    await usePreferencesStore.persist.rehydrate();
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
      let user = useUserStore.getState().user;
      console.log('☎️ Got user')

      const currentStorePath = Platform.OS === 'ios' ? RNFS.LibraryDirectoryPath : RNFS.DocumentDirectoryPath;
      console.log('Current store path:', currentStorePath);
      updateUser({ store: currentStorePath, downloadDir: currentStorePath });
      user = useUserStore.getState().user;
      Rooms.init(user);
      Rooms.join();
      Beam.join();

      const huginNode = preferences?.huginNodeMode === 'manual' ? (preferences?.huginNode || '') : '';
      const useAuto = preferences?.huginNodeMode !== 'manual';
      console.log('☎️ Connecting to hugin node..', huginNode, useAuto);
      Nodes.connect(huginNode, useAuto);

      Connection.listen();

      Notify.setup();
      useGlobalStore.getState().setStarted(true);
      return;
    }

init().catch((e) => {
  console.error('☎️ Background init failed:', e);
});