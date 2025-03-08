import BackgroundFetch from 'react-native-background-fetch';
import { sleep } from '@/utils';
import { Beam, Rooms } from '../lib/native';
import { Notify } from '../services/utils';

class BackgroundTask {
  constructor() {}

  async sync() {
    return new Promise(async (resolve, reject) => {
      Rooms.restart();
      console.log('---------------------------------------');
      console.log('*********** BACKGROUND P2P ************');
      console.log('---------------------------------------');
      await sleep(9000);
      Notify.wakeup();
      resolve();
    });
  }

  async init() {
    const event = async (taskId) => {
      console.log('[BackgroundFetch] task: ', taskId);
      await this.sync();
      console.log('******** BACKGROUND TASK COMPLETED ********');
      BackgroundFetch.finish(taskId);
    };

    const timeout = async (taskId) => {
      console.log('******** BACKGROUND TASK TIMEOUT ********');
      BackgroundFetch.finish(taskId);
    };

    await BackgroundFetch.configure(
      { minimumFetchInterval: 15, forceAlarmManager: true },
      event,
      timeout,
    );
  }
}

export const Background = new BackgroundTask();
