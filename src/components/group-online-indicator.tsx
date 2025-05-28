import { StyleSheet, View } from 'react-native';
import { CustomIcon, OnlineUsers, TouchableOpacity } from './_elements';
import { useGlobalStore } from '@/services';

interface Props {
  roomKey: string;
  onPress: void;
}

export const GroupOnlineIndicator: React.FC<Props> = ({
  roomKey,
  onPress
}) => {

  const roomUsers = useGlobalStore((state) => state.roomUsers[roomKey]);
  console.log('roomUsers', roomUsers?.length)

  return (
  <TouchableOpacity
    style={{ flexDirection: 'row', marginRight: 15 }}
    onPress={onPress}>
    <CustomIcon type="MI" name={'groups-3'} />
    <View style={{zIndex: 9999}}>

    <CustomIcon
      name={'lens'}
      size={10}
      type={'MI'}
      color={`${roomUsers?.length > 0 ? 'green' : 'grey'}`}
      />
      </View>
    {roomUsers &&

      <OnlineUsers
          online={roomUsers.length}
          // color={`${online ? 'green' : 'grey'}`}
          />

        }
  </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  
});
