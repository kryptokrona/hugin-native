import { AuthScreens, MainScreens, Stacks } from '@/config';
import type { HuginUser, MessageUser } from './p2p';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

export type MainNavigationParamList = {
  [MainScreens.SettingsScreen]: undefined;
  [MainScreens.SettingsScreen]: undefined;
  [MainScreens.FaqScreen]: undefined;
  [MainScreens.ChangeLanguageScreen]: undefined;
  [MainScreens.UpdateProfileScreen]: undefined;
  [MainScreens.ChangeThemeScreen]: undefined;
  [MainScreens.MessagesScreen]: { user: MessageUser };
  [MainScreens.MessageScreen]: { user: HuginUser };
  [MainScreens.GroupsScreen]: undefined;
  [MainScreens.GroupChatScreen]: {
    roomKey: string;
    name: string;
  };
  [MainScreens.ModifyGroupScreen]: { roomKey: string; name: string };
  [MainScreens.AddGroupScreen]:
    | {
        roomKey?: string;
        name?: string;
      }
    | undefined;
};

export type MainStackNavigationType =
  NativeStackNavigationProp<MainNavigationParamList>;

export interface RootStackParamList {
  [Stacks.AuthStack]: NavigatorScreenParams<AuthStackParamList>;
  [Stacks.MainStack]: NavigatorScreenParams<MainNavigationParamList>;
}

export type AuthStackParamList = {
  // [AuthScreens.ChooseAuthMethodScreen]: undefined;
  [AuthScreens.ForgotPinScreen]: undefined;
  [AuthScreens.RequestFingerPrintScreen]:
    | { finishFunction?: (nav?: MainStackNavigationType) => void }
    | undefined;
  [AuthScreens.RequestPinScreen]:
    | { finishFunction?: (nav?: MainStackNavigationType) => void }
    | undefined;
  [AuthScreens.SetPinScreen]: { nextRoute?: string } | undefined;
  [AuthScreens.SplashScreen]: undefined;
  [AuthScreens.CreateAccountScreen]: undefined;
};

export type AuthStackNavigationType =
  NativeStackNavigationProp<AuthStackParamList>;
