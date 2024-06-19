import React, { useEffect } from 'react';

import { Linking } from 'react-native';

import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GroupsScreens, Stacks, TabBar } from '@/config';
import { RootStackParamList } from '@/types';

import { AuthNavigator } from './_stacks';
import { AppNavigator } from './app-navigator';

const Stack = createNativeStackNavigator();

const linking: LinkingOptions<RootStackParamList> = {
  config: {
    screens: {
      [Stacks.AppStack]: {
        screens: {
          [TabBar.GroupsTab.tabName]: {
            screens: {
              [GroupsScreens.AddGroupScreen]: 'join-group/:name/:topic',
            },
          },
        },
      },
    },
  },
  prefixes: ['hugin://'],
};

export const RootNavigator = () => {
  useEffect(() => {
    const handleDeepLink = (e: { url: string }) => {
      console.log('Linking', e.url);
    };

    Linking.addEventListener('url', handleDeepLink);
  }, []);

  return (
    <NavigationContainer linking={linking}>
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
