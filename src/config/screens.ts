export enum AuthScreens {
  WelcomeScreen = 'WelcomeScreen',
  RestoreAccountScreen = 'RestoreAccountScreen',
  ForgotPinScreen = 'ForgotPinScreen',
  RequestFingerPrintScreen = 'RequestFingerPrintScreen',
  RequestPinScreen = 'RequestPinScreen',
  SplashScreen = 'SplashScreen',
  CreateAccountScreen = 'CreateAccountScreen',
  DashboardScreen = 'DashboardScreen',
}

export const TabBar = {
  DashboardScreen: {
    iconName: 'wallet-outline',
    iconType: 'MCI',
    tabName: 'SettingsTab',
  },

  GroupsScreen: {
    iconName: 'comment-text-multiple-outline',
    iconType: 'MCI',
    tabName: 'GroupsTab',
  },
  MessagesScreen: {
    iconName: 'comment-text-outline',
    iconType: 'MCI',
    tabName: 'MessagesTab',
  },
  SettingsScreen: {
    iconName: 'sliders',
    iconType: 'FA',
    tabName: 'SettingsTab',
  },
} as const;

export enum Stacks {
  MainStack = 'MainStack',
  AuthStack = 'AuthStack',
}

export enum MainScreens {
  AddGroupScreen = 'AddGroupScreen',
  GroupChatScreen = 'GroupChatScreen',
  GroupsScreen = 'GroupsScreen',
  ModifyGroupScreen = 'ModifyGroupScreen',
  MessageScreen = 'MessageScreen',
  MessagesScreen = 'MessagesScreen',
  ChangeLanguageScreen = 'ChangeLanguageScreen',
  ChangeThemeScreen = 'ChangeThemeScreen',
  PickNodeScreen = 'PickNodeScreen',
  FaqScreen = 'FaqScreen',
  SettingsScreen = 'SettingsScreen',
  UpdateProfileScreen = 'UpdateProfileScreen',
  DashboardScreen = 'DashboardScreen',
  SendTransactionScreen = 'SendTransactionScreen',
  WalletStatusScreen = 'WalletStatusScreen',
}
