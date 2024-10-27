import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  AuthScreens,
  MainScreens,
  MessagesScreens,
  RoomsScreens,
  SettingsScreens,
  Stacks,
  TabBar,
} from '@/config';

import type { HuginUser, MessageUser } from './p2p';

export type MainStackParamList = {
  [MainScreens.MainScreen]: undefined;
};

export type SettingsStackParamList = {
  [SettingsScreens.SettingsScreen]: undefined;
  [SettingsScreens.DisableDozeScreen]: undefined;
  [SettingsScreens.ExportKeysScreen]: undefined;
  [SettingsScreens.FaqScreen]: undefined;
  [SettingsScreens.OptimizeScreen]: undefined;
  [SettingsScreens.SwapAPIScreen]: undefined;
  [SettingsScreens.SwapCurrencyScreen]: undefined;
  [SettingsScreens.ChangeLanguageScreen]: undefined;
  [SettingsScreens.SwapNodeScreen]: undefined;
  [SettingsScreens.UpdateProfileScreen]: undefined;
  [SettingsScreens.ChangeThemeScreen]: undefined;
};

export type RoomStackParamList = {
  [RoomsScreens.RoomScreens]: undefined;
  [RoomsScreens.RoomChatScreen]: {
    roomKey: string;
    name: string;
  };
  [RoomsScreens.ModifyRoomScreen]: { roomKey: string; name: string };
  [RoomsScreens.AddRoomScreen]: {
    key?: string;
    name?: string;
    joining?: boolean;
  };
};

export type MessagesStackParamList = {
  [MessagesScreens.MessagesScreen]: { user: MessageUser };
  [MessagesScreens.MessageScreen]: { user: HuginUser };
};

export type AppStackParamList = {
  [TabBar.MainTab.tabName]: NavigatorScreenParams<MainStackParamList>;
  [TabBar.SettingsTab.tabName]: NavigatorScreenParams<SettingsStackParamList>;
  [TabBar.RoomsTab.tabName]: NavigatorScreenParams<RoomStackParamList>;
  [TabBar.MessagesTab.tabName]: NavigatorScreenParams<MessagesStackParamList>;
};

export type AppStackNavigationType = BottomTabNavigationProp<AppStackParamList>;

// export const RecipientsScreens = {
//   CallScreen: 'CallScreen',
//   ChatScreen: 'ChatScreen',
//   ModifyPayeeScreen: 'ModifyPayeeScreen',
//   NewPayeeScreen: 'NewPayeeScreen',
//   RecipientsScreen: 'RecipientsScreen',
// } as const;

// export type RecipientStackParamList = {
//   [RecipientsScreens.RecipientsScreen]: undefined;
//   [RecipientsScreens.CallScreen]: undefined;
//   [RecipientsScreens.ChatScreen]: undefined;
//   [RecipientsScreens.ModifyPayeeScreen]: undefined;
//   [RecipientsScreens.NewPayeeScreen]: undefined;
// };

// export const TransactionsScreens = {
//   TransactionDetailsScreen: 'TransactionDetailsScreen',
//   TransactionsScreen: 'TransactionsScreen',
// } as const;

// export type TransactionsStackParamList = {
//   [TransactionsScreens.TransactionsScreen]: undefined;
//   [TransactionsScreens.TransactionDetailsScreen]: { id: string };
// };

// export const TransferScreens = {
//   ChoosePayeeScreen: 'ChoosePayeeScreen',
//   ConfirmScreen: 'ConfirmScreen',
//   NewPayeeScreen: 'NewPayeeScreen',
//   QrScannerScreen: 'QrScannerScreen',
//   // RequestHardwareAuthScreen: 'RequestHardwareAuthScreen',
//   // RequestPinScreen: 'RequestPinScreen',
//   SendTransactionScreen: 'SendTransactionScreen',
//   TransferScreen: 'TransferScreen',
// } as const;

// export type TransferStackParamList = {
//   [TransferScreens.TransferScreen]: undefined;
//   [TransferScreens.ChoosePayeeScreen]: undefined;
//   [TransferScreens.ConfirmScreen]: { amount: number; payee: string };
//   [TransferScreens.NewPayeeScreen]: undefined;
//   [TransferScreens.QrScannerScreen]: undefined;
//   [TransferScreens.SendTransactionScreen]: { amount: number; payee: string };
// };

export interface RootStackParamList {
  [Stacks.AuthStack]: NavigatorScreenParams<AuthStackParamList>;
  [Stacks.AppStack]: NavigatorScreenParams<AppStackParamList>;
}

export type AuthStackParamList = {
  // [AuthScreens.ChooseAuthMethodScreen]: { nextRoute?: string } | undefined;
  // [AuthScreens.CreateWalletScreen]: undefined;
  // [AuthScreens.DisclaimerScreen]: { nextRoute?: string } | undefined;
  [AuthScreens.ForgotPinScreen]: undefined;
  // [AuthScreens.ImportKeysScreen]: { scanHeight?: number } | undefined;
  // [AuthScreens.ImportKeysOrSeedScreen]: { scanHeight?: number } | undefined;
  // [AuthScreens.ImportSeedScreen]: { scanHeight?: number } | undefined;
  // [AuthScreens.ImportWalletScreen]: undefined;
  // [AuthScreens.PickBlockHeightScreen]: undefined;
  // [AuthScreens.PickExactBlockHeightScreen]: undefined;
  // [AuthScreens.PickMonthScreen]: undefined;
  // [AuthScreens.RequestHardwareAuthScreen]:
  //   | { subtitle?: string; finishFunction?: any }
  //   | undefined;
  // [AuthScreens.RequestPinScreen]:
  //   | { subtitle?: string; finishFunction?: any }
  //   | undefined;
  // [AuthScreens.SetPinScreen]: { nextRoute?: string } | undefined;
  [AuthScreens.CreateProfileScreen]: undefined;
  [AuthScreens.SplashScreen]: undefined;
  // [AuthScreens.WalletOptionScreen]: undefined;
};

export type AuthStackNavigationType =
  NativeStackNavigationProp<AuthStackParamList>;

export type MainStackNavigationType =
  NativeStackNavigationProp<MainStackParamList>;

export type SettingsStackNavigationType =
  NativeStackNavigationProp<SettingsStackParamList>;

export type RoomStackNavigationType =
  NativeStackNavigationProp<RoomStackParamList>;

export type MessagesStackNavigationType =
  NativeStackNavigationProp<MessagesStackParamList>;
