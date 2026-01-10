import { Beam, decrypt_sealed_box, Nodes, Rooms } from 'lib/native';
import { initDB } from './bare/sqlite';
import { updateUser, useGlobalStore, usePreferencesStore, useUserStore } from './zustand';
import { Wallet } from './kryptokrona';
import { Notify } from './utils';

export async function init() {

  if (useGlobalStore.getState().started === true) return;

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
      Nodes.connect(preferences.huginNodeMode == 'manual' ? preferences.huginNode : '', preferences.huginNodeMode == 'manual' ? false : true);
      Notify.setup();
      useGlobalStore.getState().setStarted(true);
      console.log('☎️ Init complete..')
      return;
    }

init();