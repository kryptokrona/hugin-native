import type { SelectedFile, FileInput, User } from '@/types';
import { mockGroups } from '@/utils';
import { saveRoomToDatabase } from '@/services';
import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from '../../../lib/native';
import { setStoreGroups } from '../zustand';
import tweetnacl from 'tweetnacl';

const hexToUint = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

function randomKey() {
  return Buffer.from(tweetnacl.randomBytes(32)).toString('hex')
}

function naclHash(val) {
  return tweetnacl.hash(hexToUint(val))
}



export const getUserGroups = (_user: User) => {
  // TODO
  //  const groups = await get_user_groups(user.address);
  setStoreGroups(mockGroups);
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
  
  await saveRoomToDatabase(name, key);
  return await swarm(topic);
};

export const onRequestNewGroupKey = async () => {
  console.log('wtfm8')
  console.log(naclHash('fuckthepolice'))
  return await group_random_key();
};

export const onDeleteGroup = (_topic: string) => {
  // TODO
};

export const onLeaveGroup = (topic: string) => {
  end_swarm(topic);
};
