import { TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { CustomIcon } from '@/components';
import {
  AddGroupScreen,
  GroupChatScreen,
  GroupsScreen,
  ModifyGroupScreen,
} from '@/screens';
import {
  GroupsScreens,
  GroupStackNavigationType,
  GroupStackParamList,
} from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export const GroupStackNavigator = () => {
  const { t } = useTranslation();
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
              title={t('groups')}
              right={
                <TouchableOpacity onPress={onAddGroupPress}>
                  <CustomIcon type="IO" name="add-outline" />
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
