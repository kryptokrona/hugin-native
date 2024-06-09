import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HuginUser, MessageUser } from './messages';

export const AuthScreens = {
  ChooseAuthMethodScreen: 'ChooseAuthMethodScreen',
  CreateWalletScreen: 'CreateWalletScreen',
  DisclaimerScreen: 'DisclaimerScreen',
  ForgotPinScreen: 'ForgotPinScreen',
  ImportKeysOrSeedScreen: 'ImportKeysOrSeedScreen',
  ImportKeysScreen: 'ImportKeysScreen',
  ImportSeedScreen: 'ImportSeedScreen',
  ImportWalletScreen: 'ImportWalletScreen',
  PickBlockHeightScreen: 'PickBlockHeightScreen',
  PickExactBlockHeightScreen: 'PickExactBlockHeightScreen',
  PickMonthScreen: 'PickMonthScreen',
  RequestHardwareAuthScreen: 'RequestHardwareAuthScreen',
  RequestPinScreen: 'RequestPinScreen',
  SetPinScreen: 'SetPinScreen',
  SplashScreen: 'SplashScreen',
  WalletOptionScreen: 'WalletOptionScreen',
} as const;

export const MainScreens = {
  MainScreen: 'MainScreen',
} as const;

export type MainStackParamList = {
  [MainScreens.MainScreen]: undefined;
};

export const SettingsScreens = {
  ChangeLanguageScreen: 'ChangeLanguageScreen',
  // ChooseAuthMethodScreen: 'ChooseAuthMethodScreen',
  DisableDozeScreen: 'DisableDozeScreen',
  ExportKeysScreen: 'ExportKeysScreen',

  FaqScreen: 'FaqScreen',

  // ForgotPinScreen: 'ForgotPinScreen',
  // LoggingScreen: 'LoggingScreen',
  OptimizeScreen: 'OptimizeScreen',
  // RequestHardwareAuthScreen: 'RequestHardwareAuthScreen',
  // RequestPinScreen: 'RequestPinScreen',
  // SetPinScreen: 'SetPinScreen',
  SettingsScreen: 'SettingsScreen',
  SwapAPIScreen: 'SwapAPIScreen',
  SwapCurrencyScreen: 'SwapCurrencyScreen',
  SwapNodeScreen: 'SwapNodeScreen',
} as const;

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
};

export const GroupsScreens = {
  AddGroupScreen: 'AddGroupScreen',
  GroupChatScreen: 'GroupChatScreen',
  GroupsScreen: 'GroupsScreen',
  ModifyGroupScreen: 'ModifyGroupScreen',
} as const;

export type GroupStackParamList = {
  [GroupsScreens.GroupsScreen]: undefined;
  [GroupsScreens.GroupChatScreen]: {
    topic: string;
    name: string;
  };
  [GroupsScreens.ModifyGroupScreen]: undefined;
  [GroupsScreens.AddGroupScreen]: undefined;
};

export const MessagesScreens = {
  MessageScreen: 'MessageScreen',
  MessagesScreen: 'MessagesScreen',
} as const;

export type MessagesStackParamList = {
  [MessagesScreens.MessagesScreen]: { user: MessageUser };
  [MessagesScreens.MessageScreen]: { user: HuginUser };
};

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

export const TabBar = {
  GroupsTab: {
    iconName: 'comment-text-multiple-outline',
    iconType: 'MCI',
    tabName: 'GroupsTab',
  },
  MainTab: {
    iconName: 'view-dashboard-outline',
    iconType: 'MCI',
    tabName: 'MainTab',
  },
  MessagesTab: {
    iconName: 'comment-text-outline',
    iconType: 'MCI',
    tabName: 'MessagesTab',
  },
  SettingsTab: {
    iconName: 'sliders',
    iconType: 'FA',
    tabName: 'SettingsTab',
  },
} as const;

export const Stacks = {
  AppStack: 'AppStack',
  AuthStack: 'AuthStack',
} as const;

export const AppStack = {
  GroupsStack: 'GroupsStack',
  MainStack: 'MainStack',
  SettingsStack: 'SettingsStack',
  TransferStack: 'TransferStack',
} as const;

export interface RootStackParamList {
  AuthStack: { screen: keyof typeof AuthScreens; params?: any };
  AppStack: { screen: keyof typeof AppStack; params?: any };
}

export type AuthStackParamList = {
  [AuthScreens.ChooseAuthMethodScreen]: { nextRoute?: string } | undefined;
  [AuthScreens.CreateWalletScreen]: undefined;
  [AuthScreens.DisclaimerScreen]: { nextRoute?: string } | undefined;
  [AuthScreens.ForgotPinScreen]: undefined;
  [AuthScreens.ImportKeysScreen]: { scanHeight?: number } | undefined;
  [AuthScreens.ImportKeysOrSeedScreen]: { scanHeight?: number } | undefined;
  [AuthScreens.ImportSeedScreen]: { scanHeight?: number } | undefined;
  [AuthScreens.ImportWalletScreen]: undefined;
  [AuthScreens.PickBlockHeightScreen]: undefined;
  [AuthScreens.PickExactBlockHeightScreen]: undefined;
  [AuthScreens.PickMonthScreen]: undefined;
  [AuthScreens.RequestHardwareAuthScreen]:
    | { subtitle?: string; finishFunction?: any }
    | undefined;
  [AuthScreens.RequestPinScreen]:
    | { subtitle?: string; finishFunction?: any }
    | undefined;
  [AuthScreens.SetPinScreen]: { nextRoute?: string } | undefined;
  [AuthScreens.SplashScreen]: undefined;
  [AuthScreens.WalletOptionScreen]: undefined;
};

export type AuthStackNavigationType =
  NativeStackNavigationProp<AuthStackParamList>;
export type MainStackNavigationType =
  NativeStackNavigationProp<MainStackParamList>;
export type SettingsStackNavigationType =
  NativeStackNavigationProp<SettingsStackParamList>;
export type GroupStackNavigationType =
  NativeStackNavigationProp<GroupStackParamList>;
export type MessagesStackNavigationType =
  NativeStackNavigationProp<MessagesStackParamList>;
