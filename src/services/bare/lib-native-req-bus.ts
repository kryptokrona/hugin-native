import { PeerUser, User } from '@/types';
import { getActiveRoomUsers, setStoreActiveRoomUsers } from '../zustand';

export const peerConnected = (user: PeerUser) => {
  const connected: User = {
    address: user.address,
    name: user.name,
    room: user.key,
  };
  const users = getActiveRoomUsers();
  const updateList = [...users, connected];
  setStoreActiveRoomUsers(updateList);
  //Here we also get status if the user is connected to a voice channel
  //updateVoiceChannelStatus(user)
};

export const peerDisconncted = (user: PeerUser) => {
  const users = getActiveRoomUsers();
  const updateList = users.filter(
    (a: User) => a.address !== user.address && a.room !== user.key,
  );
  setStoreActiveRoomUsers(updateList);
  //updateVoiceChannelStatus(user)
};
