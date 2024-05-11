import { MainScreen } from '../../screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const MainStack = createNativeStackNavigator();

export const MainStackNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name="Main" component={MainScreen} />
    </MainStack.Navigator>
  );
};
