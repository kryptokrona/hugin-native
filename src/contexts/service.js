import { Platform } from 'react-native';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import { keep_alive } from '../lib/native';

class ForegroundService {
  constructor() {
    this.service = null;
  }
  async init() {
    if (Platform.OS === 'android') {
      this.service = ReactNativeForegroundService;
      this.addTask();
      return await this.startTask();
    } else {
      return false;
      //Set ios code here?
    }
  }

  async addTask() {
    this.service.add_task(() => keep_alive(), {
      delay: 10000,
      onError: (e) => {
        console.error('Error starting task', e);
      },
      onLoop: true,
      taskId: 'hugin',
    });
  }

  async startTask() {
    //Todo fix notification****
    console.log('Start task');
    const error = await this.service.start({
      ServiceType: 'dataSync',
      button: false,
      button2: false,
      button2Text: 'Stop',
      buttonOnPress: 'cray',
      buttonText: 'Close',
      color: '#000000',
      icon: 'ic_launcher',
      id: 1244,
      message: 'Syncing messages...',
      setOnlyAlertOnce: 'true',
      title: 'Hugin',
      visibility: 'public',
    });
    return error;
  }
}

export const Foreground = new ForegroundService();
