import { TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomIcon } from '@/components';
import { AddGroupScreen, GroupsScreen } from '@/screens';
import {
  GroupsScreens,
  GroupStackNavigationType,
  GroupStackParamList,
} from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export const GroupStackNavigator = () => {
  const navigation = useNavigation<GroupStackNavigationType>();

  function onAddGroupPress() {
    navigation.navigate(GroupsScreens.AddGroupScreen);
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={GroupsScreens.GroupsScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => (
            <Header
              title={'Groups'}
              right={
                <TouchableOpacity onPress={onAddGroupPress}>
                  <CustomIcon type="MI" name="add-box" size={30} />
                </TouchableOpacity>
              }
            />
          ),
        })}
      />
      <Stack.Screen
        name={GroupsScreens.AddGroupScreen}
        component={AddGroupScreen}
        options={() => ({
          header: (_props) => <Header title={'Add group'} />,
        })}
      />
      {/* <Stack.Screen
        name={GroupsScreens.ModifyGroupScreen}
        component={GroupsScreen}
        options={() => ({
          header: (_props) => <Header title={'Modify group'} />,
        })}
      /> */}
    </Stack.Navigator>
  );
};
