export interface MessageUser {
  key: string;
  name: string;
}
export interface HuginUser {
  hash: string;
  name: string;
}

export interface Room {
  roomKey: string;
  name: string;
  message: string;
  timestamp: number;
}

export interface Message {
  // m: string;
  // k: string;
  // s: string;
  // g: string; // Group key
  // n: string;
  // r: string; // Can be empty string
  // c: string; // Channel
  // t: Date;
  // hash: string;
  // reactions: string[];
  address: string;
  message: string;
  room: string;
  reply: string;
  timestamp: number;
  nickname: string;
  hash: string;
  sent: boolean;
  joined?: boolean;
}

export interface GroupMessage extends Message {
  grp: string;
  channel?: string;
}

export interface SelectedFile {
  fileName: string;
  path: string | null | undefined;
  size: number;
  time: number;
  type: string | null;
}

export interface FileInput extends SelectedFile {
  topic: string;
  invite: string;
  key: string;
  message: string;
}
