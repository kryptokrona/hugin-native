import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppNavigator } from './app-navigator';
// import { AuthNavigator } from './auth-navigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* <Stack.Screen name="Auth" component={AuthNavigator}
         options={{ headerShown: false }} /> */}
        <Stack.Screen
          name="App"
          component={AppNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
