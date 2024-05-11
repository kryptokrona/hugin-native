import DeviceInfo from 'react-native-device-info';

export const getAppVersion = (): { version: string; buildNumber: string } => {
  const version = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();
  return { version, buildNumber };
};
