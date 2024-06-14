export interface MessageUser {
  key: string;
  name: string;
}
export interface HuginUser {
  hash: string;
  name: string;
}

export interface Group {
  topic: string;
  name: string;
}

export interface Message {
  m: string;
  k: string;
  s: string;
  g: string; // Group key
  n: string;
  r: string; // Can be empty string
  c: string; // Channel
  t: Date;
  hash: string;
  reactions: string[];
}

export interface GroupMessage extends Message {
  grp: string;
  channel?: string;
}
