import {User} from './user.ts';

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
  unreads?: number;
}

export interface Contact {
  name: string;
  address: string;
  messagekey: string;
  message: string;
  unreads?: number;
  timestamp?: number
}

export interface Message {
  address: string;
  message: string;
  room?: string;
  reply: string;
  timestamp: number;
  nickname: string;
  hash: string;
  sent?: boolean;
  reactions?: string[];
  joined?: boolean;
  file?: FileInfo;
  replyto?: Message[] | undefined;
  replies?: Message[] | undefined;
  tip?: TipType | false;
  status?: MessageStatus;
}

export type MessageStatus = 'pending' | 'success' | 'failed' | undefined;

export interface File {
  fileName: string;
  hash: string;
  size: number;
  room: string;
  time: number;
  path?: string;
}

export interface GroupMessage extends Message {
  grp: string;
  channel?: string;
}

export interface SelectedFile {
  fileName: string;
  uri?: string;
  path: string | null | undefined;
  size: number;
  time: number;
  type: string | null;
}

export interface FileInput extends SelectedFile {
  topic?: string;
  invite?: string;
  key: string;
  message: string;
  sig?: string;
}

export interface FileInfo {
  fileName: string;
  path: string;
  timestamp: number;
  sent: boolean;
  hash: string;
  image: boolean;
  name?: string;
  topic?: string | null;
  type?: string | null;
}

export interface TipType {
  receiver?: string;
  amount: number;
  hash: string;
}

export interface EmojiType {
  emoji: string;
  userAddress: string;
}

export interface Call {
  room: string;
  users: User[];
  time: number;
  talkingUsers: Record<string, boolean>;
}

export interface HuginNode {
  address?: string;
  connected: boolean;
}