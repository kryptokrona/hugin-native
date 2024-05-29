import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GroupsScreen, MainScreen, RecipientsScreen } from '@/screens';
import { MainScreens, MainStackParamList } from '@/types';

const MainStack = createNativeStackNavigator<MainStackParamList>();

export const MainStackNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name={MainScreens.MainScreen} component={MainScreen} />
      <MainStack.Screen
        name={MainScreens.GroupsScreen}
        component={GroupsScreen}
      />
      <MainStack.Screen
        name={MainScreens.RecipientsScreen}
        component={RecipientsScreen}
      />
    </MainStack.Navigator>
  );
};
