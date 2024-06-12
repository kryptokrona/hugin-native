import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainScreen } from '@/screens';
import { MainScreens, MainStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={MainScreens.MainScreen}
        component={MainScreen}
        options={() => ({
          header: (_props) => <Header />,
        })}
      />
    </Stack.Navigator>
  );
};
