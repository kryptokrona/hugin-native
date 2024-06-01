export interface MessageUser {
  key: string;
  name: string;
}
export interface HuginUser {
  hash: string;
  name: string;
}

export interface Group {
  hash: string;
  name: string;
}

export interface Message {
  msg: string;
  chat: string;
  sent: boolean;
  timestamp: number;
  name: string;
  hash: string;
  reply: string;
  address: string;
  signature: string;
}

export interface GroupMessage extends Message {
  grp: string;
  channel?: string;
}
