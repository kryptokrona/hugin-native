export interface MessageUser {
  key: string;
  id: string;
  name: string;
}

export interface Message {
  id: string;
  text: string;
  user: MessageUser;
  timestamp: number;
}

export interface HuginUser {
  key: string;
  id: string;
  name: string;
}
