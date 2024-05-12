import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { MainScreen } from '@/screens';

import { MyTabBar } from './tab-bar';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => <MyTabBar {...props} />}>
        <Tab.Screen name="Main" component={MainScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// const styles = StyleSheet.create({
//   tabBar: {
//     backgroundColor: 'red',
//   },
// });
