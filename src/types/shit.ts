export interface UnreadMessages {
  boards: number;
  groups: number;
  pms: number;
}

export interface Preferences {
  // authConfirmation: boolean;
  // authenticationMethod: 'none' | 'pincode' | 'hardware-auth';
  // autoOptimize: boolean;
  // autoPickCache: string;
  // cache: string;
  // cacheEnabled: boolean;
  // currency: string;
  language: string;
  pinCode: string | null;
  // limitData: boolean;
  // nickname: string;
  // node: string;
  // notificationsEnabled: boolean;
  // scanCoinbaseTransactions: boolean;
  // websocketEnabled: boolean;
}

export interface Payee {
  nickname: string | (string | null)[];
  address?: string;
  paymentID?: string | (string | null)[];
} // Used?

export interface FromPayee {
  name?: string;
  address?: string;
  paymentID?: string;
} // Used?

export interface TransactionDetail {
  hash: string;
} // Used?

export interface User {
  address: string;
  avatar?: string;
  name: string;
  room: string;
  downloadDir?: string;
}
