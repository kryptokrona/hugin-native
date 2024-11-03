export enum AuthScreens {
  // CreateWalletScreen = 'CreateWalletScreen',
  // DisclaimerScreen = 'DisclaimerScreen',
  // ImportKeysOrSeedScreen = 'ImportKeysOrSeedScreen',
  // ImportKeysScreen ='ImportKeysScreen',
  // ImportSeedScreen= 'ImportSeedScreen',
  // ImportWalletScreen= 'ImportWalletScreen',
  // PickBlockHeightScreen ='PickBlockHeightScreen',
  // PickExactBlockHeightScreen= 'PickExactBlockHeightScreen',
  // PickMonthScreen ='PickMonthScreen',
  // WalletOptionScreen = 'WalletOptionScreen',
  ForgotPinScreen = 'ForgotPinScreen',
  ChooseAuthMethodScreen = 'ChooseAuthMethodScreen',
  RequestFingerPrintScreen = 'RequestFingerPrintScreen',
  RequestPinScreen = 'RequestPinScreen',
  SetPinScreen = 'SetPinScreen',
  SplashScreen = 'SplashScreen',
  CreateAccountScreen = 'CreateAccountScreen',
}

export const TabBar = {
  GroupsScreen: {
    iconName: 'comment-text-multiple-outline',
    iconType: 'MCI',
    tabName: 'GroupsTab',
  },
  // MessagesTab: {
  //   iconName: 'comment-text-outline',
  //   iconType: 'MCI',
  //   tabName: 'MessagesTab',
  // },
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
  FaqScreen = 'FaqScreen',
  SettingsScreen = 'SettingsScreen',
  UpdateProfileScreen = 'UpdateProfileScreen',
}
