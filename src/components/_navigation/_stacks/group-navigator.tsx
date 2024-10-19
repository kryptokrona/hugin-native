import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { GroupsScreens } from '@/config';
import {
  AddGroupScreen,
  GroupChatScreen,
  GroupsScreen,
  ModifyGroupScreen,
} from '@/screens';
import type { GroupStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export const GroupStackNavigator = () => {
  const { t } = useTranslation();
  // const navigation = useNavigation<GroupStackNavigationType>();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={GroupsScreens.GroupsScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => <Header title={t('rooms')} />, // More actions handled in screen
        })}
      />
      <Stack.Screen
        name={GroupsScreens.AddGroupScreen}
        component={AddGroupScreen}
        options={() => ({
          header: (_props) => <Header backButton title={t('subscribe')} />,
        })}
      />
      <Stack.Screen
        name={GroupsScreens.GroupChatScreen}
        component={GroupChatScreen}
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
        name={GroupsScreens.ModifyGroupScreen}
        component={ModifyGroupScreen}
        options={() => ({
          header: (_props) => <Header backButton title={t('modify')} />,
        })}
      />
    </Stack.Navigator>
  );
};
