import type { SelectedFile, FileInput } from '@/types';
import { mockGroups } from '@/utils';

import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from '../../../lib/native';

export const getUserGroups = (user: string) => {
  return mockGroups;
};

export const onSendGroupMessage = (message: string, topic: string) => {
  send_swarm_msg(topic, message);
};

export const onSendGroupMessageWithFile = (
  topic: string,
  file: SelectedFile,
  message: string,
) => {
  const fileData: FileInput & { message: string } = {
    ...file,
    message,
    topic,
  };
  const JSONfileData = JSON.stringify(fileData);
  begin_send_file(JSONfileData);
};

export const onCreateGroup = async (name: string, topic: string) => {
  // TODO name?
  return await swarm(topic);
};

export const onRequestNewGroupKey = async () => {
  return await group_random_key();
};

export const onDeleteGroup = (topic: string) => {
  // TODO
};

export const onLeaveGroup = (topic: string) => {
  end_swarm(topic);
};
