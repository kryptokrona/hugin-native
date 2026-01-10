import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const defaultScreenTransition: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  // animationDuration: 200, // native-stack doesn't always support duration customization directly on all platforms/versions without gesture config
};

export const modalScreenTransition: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  presentation: 'modal',
};

export const fadeScreenTransition: NativeStackNavigationOptions = {
  animation: 'fade',
};
