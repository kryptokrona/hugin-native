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

export interface PreviewChat {
  id: string;
  user: HuginUser;
  lastMessage: {
    id: string;
    text: string;
  };
}

export interface Group {
  id: string;
  name: string;
  // users: HuginUser[];
  // messages: Message[];
}
