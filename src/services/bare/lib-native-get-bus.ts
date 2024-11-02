import {
  begin_send_file,
  end_swarm,
  group_random_key,
  send_swarm_msg,
  swarm,
} from 'lib/native';

export const beginSendFile = (jsonFileData: string) => {
  return begin_send_file(jsonFileData);
};

export const endSwarm = (key: string) => {
  return end_swarm(key);
};

export const groupRandomKey = async () => {
  return await group_random_key();
};

export const sendSwarmMsg = async (
  key: string,
  message: string,
  reply: string | null,
) => {
  return await send_swarm_msg(key, message, reply);
};

export const initSwarm = (hashKey: string, key: string, admin: string) => {
  return swarm(hashKey, key, admin);
};
