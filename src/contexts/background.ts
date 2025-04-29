import BackgroundFetch from 'react-native-background-fetch';
import { sleep } from '@/utils';
import { Beam, Rooms } from '../lib/native';
import { Notify } from '../services/utils';
import notifee, { IntervalTrigger, TriggerType, TimeUnit } from '@notifee/react-native';
import { Platform } from 'react-native';


class BackgroundTask {
  constructor() {}

  async sync() {
    return new Promise<void>(async (resolve, reject) => {
      // Rooms.resume();
      Rooms.idle(false, true);
      // await Rooms.restart();
      console.log('---------------------------------------');
      console.log('*********** BACKGROUND P2P ************');
      console.log('---------------------------------------');
      await sleep(10000);
      Rooms.idle(true, true, true);
      await sleep(1000);
      // Rooms.pause();
      // Notify.new({text: 'Syncing complete', name: 'Hugin'}, true);
      resolve();
    });
  }

  async init() {
    console.log('**** INIT BACKGROUND ****', BackgroundFetch);
    // if (Platform.OS == 'android' || 1 == 1) {

      const event = async (taskId: string) => {
        // Rooms.pause();
        console.log('[BackgroundFetch] task: ', taskId);
        // Notify.new({text: 'Syncing messages', name: 'Hugin'}, true);
        await this.sync();
        console.log('******** BACKGROUND TASK COMPLETED ********');
        // Notify.wakeup();
        
        BackgroundFetch.finish(taskId);
      };
      
      const timeout = async (taskId: string) => {
        console.log('******** BACKGROUND TASK TIMEOUT ********');
        Rooms.idle(true, true, true);
        // Notify.wakeup();
        BackgroundFetch.finish(taskId);
      };
      
      await BackgroundFetch.configure(
        { minimumFetchInterval: 15,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true
        },
        event,
        timeout,
      );

      // console.log('Scheduling..')
      // BackgroundFetch.scheduleTask({
      //   taskId: 'com.transistorsoft.huginfetch',
      //   delay: 5000,  // ms
      //   forceAlarmManager: true,  // for Android mostly
      //   periodic: false,
      // });
      // console.log('Scheduled!')
    // } else {
      

      // const trigger: IntervalTrigger = {
      //   type: TriggerType.INTERVAL,
      //   interval: 30,
      //   timeUnit: TimeUnit.MINUTES
      // };

      // await notifee.createTriggerNotification(
      //   {
      //     id: Date.now().toString(),
      //     title: 'Hugin',
      //     body: 'Open Hugin to see your new messages!',
      //   },
      //   trigger,
      // );

    // }
      

  }
}

export const Background = new BackgroundTask();
