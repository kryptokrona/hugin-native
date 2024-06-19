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

export const SettingsScreens = {
  ChangeLanguageScreen: 'ChangeLanguageScreen',

  ChangeThemeScreen: 'ChangeThemeScreen',
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
  UpdateProfileScreen: 'UpdateProfileScreen',
} as const;

export const MessagesScreens = {
  MessageScreen: 'MessageScreen',
  MessagesScreen: 'MessagesScreen',
} as const;

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

export const GroupsScreens = {
  AddGroupScreen: 'AddGroupScreen',
  GroupChatScreen: 'GroupChatScreen',
  GroupsScreen: 'GroupsScreen',
  ModifyGroupScreen: 'ModifyGroupScreen',
} as const;
