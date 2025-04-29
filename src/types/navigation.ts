import { AuthScreens, MainScreens, Stacks } from '@/config';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

export type MainNavigationParamList = {
  [MainScreens.SettingsScreen]: undefined;
  [MainScreens.SettingsScreen]: undefined;
  [MainScreens.FaqScreen]: undefined;
  [MainScreens.ChangeLanguageScreen]: undefined;
  [MainScreens.UpdateProfileScreen]: undefined;
  [MainScreens.ChangeThemeScreen]: undefined;
  [MainScreens.MessagesScreen]: undefined;
  [MainScreens.MessageScreen]: { name: string; roomKey: string };
  [MainScreens.GroupsScreen]: {
    joining?: boolean;
    link?: string;
  };
  [MainScreens.GroupChatScreen]: {
    roomKey: string;
    name: string;
    call?: boolean;
  };
  [MainScreens.ModifyGroupScreen]: { roomKey: string; name: string };
  [MainScreens.AddGroupScreen]:
    | {
        roomKey?: string;
        name?: string;
      }
    | undefined;
  [MainScreens.PickNodeScreen]: undefined;
  [MainScreens.DashboardScreen]: undefined;
  [MainScreens.SendTransactionScreen]: { 
    address?: string;
    paymentId?: string;
    amount?: number;
   } | undefined;
  [MainScreens.WalletStatusScreen]: undefined;
  [MainScreens.ModifyContactScreen]: { name: string; roomKey: string };

  [MainScreens.MessageStack]: undefined;
  [MainScreens.GroupStack]: undefined;
  [MainScreens.SettingsStack]: undefined;
  [MainScreens.WalletStack]: undefined;
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
  [AuthScreens.SplashScreen]: undefined;
  [AuthScreens.CreateAccountScreen]:
    | {
        selectedValues: {
          blockHeight: number;
          seedWords: string[];
        };
      }
    | undefined;
  [AuthScreens.WelcomeScreen]: undefined;
  [AuthScreens.RestoreAccountScreen]: undefined;
};

export type AuthStackNavigationType =
  NativeStackNavigationProp<AuthStackParamList>;
