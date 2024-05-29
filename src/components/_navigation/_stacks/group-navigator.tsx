import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GroupsScreen } from '@/screens';
import { GroupsScreens, GroupStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export const GroupStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={GroupsScreens.GroupsScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => <Header title={'Groups'} />,
        })}
      />
      <Stack.Screen
        name={GroupsScreens.GroupChatScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => <Header title={'Chat'} />,
        })}
      />
      <Stack.Screen
        name={GroupsScreens.ModifyGroupScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => <Header title={'Modify group'} />,
        })}
      />
      <Stack.Screen
        name={GroupsScreens.NewGroupScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => <Header title={'New group'} />,
        })}
      />
    </Stack.Navigator>
  );
};
