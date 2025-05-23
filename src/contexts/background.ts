import BackgroundFetch from 'react-native-background-fetch';
import { sleep } from '@/utils';
import { Beam, Rooms } from '../lib/native';
import { Notify } from '../services/utils';
import notifee, { IntervalTrigger, TriggerType, TimeUnit } from '@notifee/react-native';
import { Alert, Linking, Platform } from 'react-native';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';
import { usePreferencesStore } from '@/services';


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
      try {

        await BackgroundFetch.configure(
          { minimumFetchInterval: 15,
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true
          },
          event,
          timeout,
        );
      } catch (e) {
        console.log('Failed to configure bg fetch:', e)
        const skipWarning = usePreferencesStore.getState().skipBgRefreshWarning;
        if (e == '1' && Platform.OS == 'ios' && !skipWarning) {
              Alert.alert(t('backgroundRefreshTitle'), t('backgroundRefreshSubtitle'), [
              {text: t('openSettings'), onPress: () => Linking.openSettings()},
              {text: t('dontAskAgain'), onPress: () => usePreferencesStore.getState().setSkipBgRefreshWarning(true)},
            ]);
        }
      }

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
