export interface UnreadMessages {
  boards: number;
  groups: number;
  pms: number;
}

export interface Preferences {
  // authConfirmation: boolean;
  // authenticationMethod: 'none' | 'pincode' | 'hardware-auth';
  // cache: string;
  // cacheEnabled: boolean;
  // currency: string;
  language: string;
  // limitData: boolean;
  nickname: string;

}

export interface Payee {
  nickname: string | (string | null)[];
  address?: string;
  paymentID?: string | (string | null)[];
} // Used?




export interface User {
  address: string;
  avatar?: string;
  name: string;
  room: string;
  downloadDir?: string;
}

export interface PeerUser {
  address: string;
  name: string;
  room: string;
  key: string;
}
