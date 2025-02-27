import BackgroundFetch from 'react-native-background-fetch';
import { sleep } from '@/utils';
import { P2P } from '../lib/native';

class BackgroundTask {
  constructor() {}

  async sync() {
    return new Promise(async (resolve, reject) => {
      P2P.resume();
      P2P.join();
      console.log('---------------------------------------');
      console.log('*********** BACKGROUND P2P ************');
      console.log('---------------------------------------');
      await sleep(10000);
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
      await P2P.close();
      console.log('******** BACKGROUND TASK TIMEOUT ********');
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
