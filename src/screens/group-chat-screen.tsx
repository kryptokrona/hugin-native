import { RouteProp } from '@react-navigation/native';

import { ScreenLayout, TextField } from '@/components';
import { GroupsScreens, GroupStackParamList } from '@/types';

interface Props {
  route: RouteProp<GroupStackParamList, typeof GroupsScreens.GroupChatScreen>;
}

export const GroupChatScreen: React.FC<Props> = ({ route }) => {
  return (
    <ScreenLayout>
      <TextField>hej</TextField>
    </ScreenLayout>
  );
};
