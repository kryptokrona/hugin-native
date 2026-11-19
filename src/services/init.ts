import { Beam, decrypt_sealed_box, Nodes, Rooms } from 'lib/native';
import { initDB } from './bare/sqlite';
import { updateUser, useGlobalStore, usePreferencesStore, useUserStore } from '@/services';
import { Wallet } from './kryptokrona';
import { Notify } from './utils';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Connection } from './bare/globals';
import { parseNode } from './kryptokrona/daemon-node';

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

    // Signal that local SQLite is ready. Rooms/contacts are plain DB reads and
    // must not wait for the (much later) `started` flag, which only flips after
    // the wallet's initial sync -- a slow sync otherwise leaves those lists
    // spinning forever.
    useGlobalStore.getState().setDbReady(true);

    await usePreferencesStore.persist.rehydrate();
    const preferences = usePreferencesStore.getState().preferences;

    // no node chosen yet: an xkrd node over Hyperswarm
    const node = parseNode(preferences?.node);

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
      // Boot the RN-side PM syncer (poll + noble decrypt + ML-KEM handshake).
      const [privateSpendKey, privateViewKey] = Wallet.privateKeys();
      const { MessageSync } = await import('./hugin/syncer');
      MessageSync.init(node, { privateSpendKey, privateViewKey });
      // Pre-warm the ML-KEM identity (generate on first launch).
      const { loadOrCreateIdentity } = await import('./hugin/identity');
      await loadOrCreateIdentity();
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