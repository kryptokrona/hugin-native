import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainScreen } from '@/screens';
import { MainScreens, MainStackParamList } from '@/types';

const MainStack = createNativeStackNavigator<MainStackParamList>();

export const MainStackNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name={MainScreens.Main.name} component={MainScreen} />
    </MainStack.Navigator>
  );
};
