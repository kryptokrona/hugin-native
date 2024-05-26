import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  GroupsScreen: 'GroupsScreen',
  MainScreen: 'MainScreen',
  RecipientsScreen: 'RecipientsScreen',
  SettingsScreen: 'SettingsScreen',
  TransactionsScreen: 'TransactionsScreen',
  TransferScreen: 'TransferScreen',
} as const;

export const TabBar = {
  Main: {
    description: 'Main tab bar for the wallet',
    name: 'MainTabBar',
  },
} as const;

export const Stacks = {
  AuthStack: 'AuthStack',
  MainStack: 'MainStack',
} as const;

export interface RootStackParamList {
  AuthStack: { screen: keyof typeof AuthScreens; params?: any };
  MainStack: { screen: keyof typeof MainScreens; params?: any };
}

export type MainStackParamList = {
  [MainScreens.MainScreen]: undefined;
  [MainScreens.SettingsScreen]: undefined;
  [MainScreens.TransactionsScreen]: undefined;
  [MainScreens.TransferScreen]: undefined;
  [MainScreens.GroupsScreen]: undefined;
  [MainScreens.RecipientsScreen]: undefined;
};

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
