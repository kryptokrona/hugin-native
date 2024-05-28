export interface UnreadMessages {
  boards: number;
  groups: number;
  pms: number;
}

export interface Preferences {
  authConfirmation: boolean;
  authenticationMethod: 'none' | 'pincode' | 'hardware-auth';
  autoOptimize: boolean;
  autoPickCache: string;
  cache: string;
  cacheEnabled: string; // TODO Should be boolean
  currency: string;
  language: string;
  limitData: boolean;
  nickname: string;
  node: string;
  notificationsEnabled: boolean;
  scanCoinbaseTransactions: boolean;
  theme: string;
  websocketEnabled: string;
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
export interface Group {
  key: string;
  group?: string; // temp test
}

export interface TransactionDetail {
  hash: string;
}
