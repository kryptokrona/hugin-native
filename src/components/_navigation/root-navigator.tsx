import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Stacks } from '@/config';

import { AuthNavigator } from './_stacks';
import { AppNavigator } from './app-navigator';

const Stack = createNativeStackNavigator();

// const linking: LinkingOptions<RootStackParamList> = {
//   config: {
//     screens: {
//       [Stacks.AppStack]: {
//         // path: 'app',
//         screens: {
//           [AppStack.GroupsStack]: {
//             // path: 'groups',
//             screens: {
//               [GroupsScreens.AddGroupScreen]: 'add-group/:topic',
//             },
//           },
//         },
//       },
//     },
//   },
//   prefixes: ['hugin://'],
// };
export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={Stacks.AuthStack}
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={Stacks.AppStack}
          component={AppNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
