import { Theme } from '@react-navigation/native';

export const AuthScreens = {
  ChooseAuthMethod: {
    description: 'Choose the authentication method for the wallet',
    name: 'ChooseAuthMethodScreen',
  },

  CreateWallet: {
    description: 'Create a new wallet',
    name: 'CreateWalletScreen',
  },

  Disclaimer: {
    description: 'Explain the disclaimer for the wallet',
    name: 'DisclaimerScreen',
  },

  ForgotPin: {
    description: 'Forgot the pin for the wallet',
    name: 'ForgotPinScreen',
  },

  ImportKeys: {
    description: 'Import a wallet with a set of keys',
    name: 'ImportKeysScreen',
  },

  ImportKeysOrSeed: {
    descrption:
      'Pick between importing a wallet with a mnemonic seed or a set of keys',
    name: 'ImportKeysOrSeedScreen',
  },

  ImportSeed: {
    description: 'Import a wallet with a mnemonic seed',
    name: 'ImportSeedScreen',
  },

  ImportWallet: {
    description: 'Import an existing wallet',
    name: 'ImportWalletScreen',
  },

  PickBlockHeight: {
    description: 'Pick a block height to start the wallet scanning from',
    name: 'PickBlockHeightScreen',
  },

  PickExactBlockHeight: {
    description:
      'Pick a specific block height to start the wallet scanning from',
    name: 'PickExactBlockHeightScreen',
  },

  PickMonth: {
    desfription: 'Pick a month to start the wallet scanning from',
    name: 'PickMonthScreen',
  },

  RequestHardwareAuth: {
    description: 'Request the hardware auth for the wallet',
    name: 'RequestHardwareAuthScreen',
  },

  RequestPin: {
    description: 'Request the pin for the wallet',
    name: 'RequestPinScreen',
  },

  SetPin: {
    description: 'Set a pin for the created wallet',
    name: 'SetPinScreen',
  },

  Splash: {
    description: 'Launching screen',
    name: 'SplashScreen',
  },

  WalletOption: {
    description: 'Create a new wallet or import an existing one',
    name: 'WalletOptionScreen',
  },
} as const;

export const MainScreens = {
  Groups: {
    description: 'List of groups for the wallet',
    name: 'GroupsScreen',
  },
  Main: {
    description: 'Main screen for the wallet',
    name: 'MainScreen',
  },
  Recipients: {
    description: 'List of recipients for the wallet',
    name: 'RecipientsScreen',
  },
  Settings: {
    description: 'Settings for the wallet',
    name: 'SettingsScreen',
  },
  Transactions: {
    description: 'Transaction history for the wallet',
    name: 'TransactionScreen',
  },
  Transfer: {
    description: 'Transfer funds to another wallet',
    name: 'TransferScreen',
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
  [MainScreens.Main.name]: { theme: Theme };
  [MainScreens.Settings.name]: { theme: Theme };
  [MainScreens.Transactions.name]: { theme: Theme };
  [MainScreens.Transfer.name]: { theme: Theme };
  [MainScreens.Groups.name]: { theme: Theme };
  [MainScreens.Recipients.name]: { theme: Theme };
};

export type AuthStackParamList = {
  [AuthScreens.ChooseAuthMethod.name]: { theme: Theme };
  [AuthScreens.CreateWallet.name]: { theme: Theme };
  [AuthScreens.Disclaimer.name]: { theme: Theme };
  [AuthScreens.ForgotPin.name]: { theme: Theme };
  [AuthScreens.ImportKeys.name]: { theme: Theme };
  [AuthScreens.ImportKeysOrSeed.name]: { theme: Theme };
  [AuthScreens.ImportSeed.name]: { theme: Theme };
  [AuthScreens.ImportWallet.name]: { theme: Theme };
  [AuthScreens.PickBlockHeight.name]: { theme: Theme };
  [AuthScreens.PickExactBlockHeight.name]: { theme: Theme };
  [AuthScreens.PickMonth.name]: { theme: Theme };
  [AuthScreens.RequestHardwareAuth.name]: { theme: Theme };
  [AuthScreens.RequestPin.name]: { theme: Theme };
  [AuthScreens.SetPin.name]: { theme: Theme };
  [AuthScreens.Splash.name]: { theme: Theme };
  [AuthScreens.WalletOption.name]: { theme: Theme };
};
