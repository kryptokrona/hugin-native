import type { SelectedFile, FileInput } from '@/types';
import { mockGroups } from '@/utils';

import { begin_send_file } from '../../../lib/native';

export const getUserGroups = (user: string) => {
  return mockGroups;
};

export const onSendGroupMessage = (message: string, topic: string) => {
  console.log({ message, topic });
};

export const onSendGroupMessageWithFile = (
  topic: string,
  file: SelectedFile,
) => {
  const fileData: FileInput = {
    ...file,
    topic,
  };
  const JSONfileData = JSON.stringify(fileData);
  begin_send_file(JSONfileData);
};

export const onDeleteGroup = (topic: string) => {};

export const onLeaveGroup = (topic: string) => {};
