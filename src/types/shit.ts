import { ColorSchemeName } from 'react-native';

export interface UnreadMessages {
  boards: number;
  groups: number;
  pms: number;
}

export interface Preferences {
  authConfirmation: boolean;
  authenticationMethod: 'none' | 'pincode' | 'hardware-auth';
  // autoOptimize: boolean;
  // autoPickCache: string;
  // cache: string;
  // cacheEnabled: boolean;
  currency: string;
  language: string;
  limitData: boolean;
  nickname: string;
  // node: string;
  notificationsEnabled: boolean;
  scanCoinbaseTransactions: boolean;
  themeMode: ColorSchemeName;
  websocketEnabled: boolean;
}

export interface Payee {
  nickname: string | (string | null)[];
  address?: string;
  paymentID?: string | (string | null)[];
}

export interface FromPayee {
  name?: string;
  address?: string;
  paymentID?: string;
}

export interface TransactionDetail {
  hash: string;
}

export interface User {
  address: string;
  avatar: string | null;
  name: string;
}
