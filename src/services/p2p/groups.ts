import { mockGroups } from '@/utils';

export const getUserGroups = (user: string) => {
  return mockGroups;
};

export const onSendGroupMessage = (message: string, topic: string) => {
  console.log({ message, topic });
};

export const onDeleteGroup = (topic: string) => {};

export const onLeaveGroup = (topic: string) => {};
