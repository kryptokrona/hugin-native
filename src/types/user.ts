export enum AuthMethods {
  reckless = 'reckless',
  pincode = 'pincode',
  hardewarePin = 'hardewarePin',
  bioMetric = 'bioMetric',
}

export enum ConnectionStatus {
  connected = 'connected',
  disconnected = 'disconnected',
  connecting = 'connecting',
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
  store?: string;
  files?: string [];
  online?: boolean;
  lastseen?: number;
  voice?: boolean;
  video?: boolean;
  screenshare?: boolean;
  muted?: boolean;
  talking?: boolean;
  dm?: boolean;
  connectionStatus?: ConnectionStatus;
}

export interface PeerUser {
  address: string;
  name: string;
  key?: string;
}
