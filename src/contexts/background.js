import BackgroundFetch from 'react-native-background-fetch';
import { sleep } from '@/utils';
import { Beam, Rooms } from '../lib/native';
import { Notify } from '../services/utils';

class BackgroundTask {
  constructor() {}

  async sync() {
    return new Promise(async (resolve, reject) => {
      Rooms.idle(false, true);
      console.log('---------------------------------------');
      console.log('*********** BACKGROUND P2P ************');
      console.log('---------------------------------------');
      await sleep(5000);
      resolve();
    });
  }

  async init() {
    console.log('**** INIT BACKGROUND ****');
    const event = async (taskId) => {
      console.log('[BackgroundFetch] task: ', taskId);
      await this.sync();
      console.log('******** BACKGROUND TASK COMPLETED ********');
      Notify.wakeup();
      Rooms.idle(true);
      BackgroundFetch.finish(taskId);
    };

    const timeout = async (taskId) => {
      console.log('******** BACKGROUND TASK TIMEOUT ********');
      Rooms.idle(true);
      Notify.wakeup();
      BackgroundFetch.finish(taskId);
    };

    await BackgroundFetch.configure(
      { minimumFetchInterval: 15 },
      event,
      timeout,
    );
  }
}

export const Background = new BackgroundTask();
