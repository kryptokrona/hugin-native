import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainScreen } from '../../screens';
import { NavigationContainer } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Main" component={MainScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
