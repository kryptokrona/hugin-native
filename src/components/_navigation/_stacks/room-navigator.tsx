import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { RoomsScreens } from '@/config';
import {
  AddRoomScreen,
  ModifyRoomScreen,
  RoomChatScreen,
  RoomScreens,
} from '@/screens';
import type { RoomStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<RoomStackParamList>();

export const RoomStackNavigator = () => {
  const { t } = useTranslation();
  // const navigation = useNavigation<RoomStackNavigationType>();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={RoomsScreens.RoomScreens}
        component={RoomScreens}
        options={() => ({
          header: (_props) => <Header title={t('rooms')} />, // More actions handled in screen
        })}
      />
      <Stack.Screen
        name={RoomsScreens.AddRoomScreen}
        component={AddRoomScreen}
        options={() => ({
          header: (_props) => <Header backButton title={t('subscribe')} />,
        })}
      />
      <Stack.Screen
        name={RoomsScreens.RoomChatScreen}
        component={RoomChatScreen}
        options={() => ({
          header: (_props) => (
            <Header
              // Is set in screen
              title={'Untitled'}
              backButton
            />
          ),
        })}
      />
      <Stack.Screen
        name={RoomsScreens.ModifyRoomScreen}
        component={ModifyRoomScreen}
        options={() => ({
          header: (_props) => <Header backButton title={t('modify')} />,
        })}
      />
    </Stack.Navigator>
  );
};
