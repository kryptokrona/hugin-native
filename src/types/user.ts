export enum AuthMethods {
  reckless = 'reckless',
  pincode = 'pincode',
  hardewarePin = 'hardewarePin',
  bioMetric = 'bioMetric',
}

export interface Preferences {
  authMethod: AuthMethods | null;
  pincode: string | null;
  language: string;
  nickname: string;
  node: string;
}

export interface Payee {
  nickname: string | (string | null)[];
  address?: string;
  paymentID?: string | (string | null)[];
}

export interface User {
  address: string | null;
  avatar?: string;
  name: string;
  room?: string;
  downloadDir?: string;
  keys?: object;
  huginAddress?: string;
}

export interface PeerUser {
  address: string;
  name: string;
  key?: string;
}
