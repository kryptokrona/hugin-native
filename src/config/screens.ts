export enum AuthScreens {
  // ChooseAuthMethodScreen: 'ChooseAuthMethodScreen',
  // CreateWalletScreen: 'CreateWalletScreen',
  // DisclaimerScreen: 'DisclaimerScreen',
  ForgotPinScreen = 'ForgotPinScreen',
  // ImportKeysOrSeedScreen: 'ImportKeysOrSeedScreen',
  // ImportKeysScreen: 'ImportKeysScreen',
  // ImportSeedScreen: 'ImportSeedScreen',
  // ImportWalletScreen: 'ImportWalletScreen',
  // PickBlockHeightScreen: 'PickBlockHeightScreen',
  // PickExactBlockHeightScreen: 'PickExactBlockHeightScreen',
  // PickMonthScreen: 'PickMonthScreen',
  // RequestHardwareAuthScreen: 'RequestHardwareAuthScreen',
  // RequestPinScreen: 'RequestPinScreen',
  SetPinScreen = 'SetPinScreen',
  SplashScreen = 'SplashScreen',
  CreateProfileScreen = 'CreateProfileScreen',
  // WalletOptionScreen: 'WalletOptionScreen',
}

export enum MainScreens {
  MainScreen = 'MainScreen',
}

export enum SettingsScreens {
  ChangeLanguageScreen = 'ChangeLanguageScreen',

  ChangeThemeScreen = 'ChangeThemeScreen',
  // ChooseAuthMethodScreen: 'ChooseAuthMethodScreen',
  DisableDozeScreen = 'DisableDozeScreen',

  ExportKeysScreen = 'ExportKeysScreen',

  FaqScreen = 'FaqScreen',

  // ForgotPinScreen: 'ForgotPinScreen',
  // LoggingScreen: 'LoggingScreen',
  OptimizeScreen = 'OptimizeScreen',
  // RequestHardwareAuthScreen: 'RequestHardwareAuthScreen',
  // RequestPinScreen: 'RequestPinScreen',
  // SetPinScreen: 'SetPinScreen',
  SettingsScreen = 'SettingsScreen',
  SwapAPIScreen = 'SwapAPIScreen',
  SwapCurrencyScreen = 'SwapCurrencyScreen',
  SwapNodeScreen = 'SwapNodeScreen',
  UpdateProfileScreen = 'UpdateProfileScreen',
}

export enum MessagesScreens {
  MessageScreen = 'MessageScreen',
  MessagesScreen = 'MessagesScreen',
}

export const TabBar = {
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
  RoomsTab: {
    iconName: 'comment-text-multiple-outline',
    iconType: 'MCI',
    tabName: 'RoomsTab',
  },
  SettingsTab: {
    iconName: 'sliders',
    iconType: 'FA',
    tabName: 'SettingsTab',
  },
} as const;

export enum Stacks {
  AppStack = 'AppStack',
  AuthStack = 'AuthStack',
}

export enum AppStack {
  RoomsStack = 'RoomsStack',
  MainStack = 'MainStack',
  SettingsStack = 'SettingsStack',
  TransferStack = 'TransferStack',
}

export enum RoomsScreens {
  AddRoomScreen = 'AddRoomScreen',
  RoomChatScreen = 'RoomChatScreen',
  RoomScreens = 'RoomScreens',
  ModifyRoomScreen = 'ModifyRoomScreen',
}
