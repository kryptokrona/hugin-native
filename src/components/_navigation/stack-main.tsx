import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainScreen } from '@/screens';

const MainStack = createNativeStackNavigator();

export const MainStackNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name="Main" component={MainScreen} />
    </MainStack.Navigator>
  );
};
